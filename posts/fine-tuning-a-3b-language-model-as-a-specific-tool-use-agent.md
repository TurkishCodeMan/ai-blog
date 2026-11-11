---
title: "Fine-Tuning a 3B Language Model as a Specific Tool-Use Agent"
date: "2026-02-22"
excerpt: "How we turned Nanbeige4.1-3B into a reliable email assistant that actually calls the right API — and everything we learned along the way."
tags: ["finetune"]
published: true
---

# Fine-Tuning a 3B Language Model as a Gmail Tool-Use Agent

*How we turned Nanbeige4.1-3B into a reliable email assistant that actually calls the right API — and everything we learned along the way.*

---

## Why This Project Exists

Most LLM fine-tuning tutorials start with a clean, synthetic dataset and a model that already knows how to follow instructions. Real projects are messier. This post documents what actually happened when we set out to fine-tune a 3-billion-parameter model to act as a Gmail agent — one capable of deciding *which* API to call, *when* to call it, and *how* to construct the right arguments from a natural-language request.

We made mistakes. We caught them. We fixed them. That process is worth writing down.

---

## The Goal: What Should the Model Learn?

Before touching code, it helps to be precise. We wanted the model to learn **two distinct behaviors**:

**1. Tool-call generation** — Given a user request and a set of available Gmail functions, produce a valid JSON tool call:
```json
{"name": "search_emails", "arguments": {"query": "from:google.com 'security alert'"}}
```

**2. Tool-result summarization** — After receiving a tool response, synthesize it into a natural-language answer for the user.

That's it. Not general-purpose chat. Not reasoning from scratch. A focused, agentic loop over Gmail's API surface.

---

## The Stack

| Component | Choice | Reason |
|---|---|---|
| Base model | `Nanbeige/Nanbeige4.1-3B` | 256K context, strong tool-use template |
| Fine-tuning method | LoRA r=64 | 96GB VRAM (4× RTX 4090) — full bf16 fits, QLoRA unnecessary |
| Training framework | HuggingFace Trainer + `torchrun` | No FSDP/ZeRO needed at this scale |
| Dataset | 715 ChatML traces | Gmail multi-turn tool-use conversations |

---

## The Dataset: What We Started With vs. What We Actually Needed

The raw dataset had 740 multi-turn conversations, each structured as a ChatML sequence with a `messages` array and a `tools` array listing all 19 available Gmail functions.

At first glance, it looked fine. Then we started measuring.

### Bug 1: Double `<|im_start|>` — a silent tokenizer trap

Nanbeige's tokenizer has `bos_token = <|im_start|>` (id=166100). Its chat template already opens every conversation with `<|im_start|>system`. When we called `tokenizer.encode(text)` without explicitly setting `add_special_tokens=False`, the encoder prepended another BOS token — giving us:

```
<|im_start|><|im_start|> system
You are a helpful Gmail assistant...
```

Every single training example was corrupted at position 0. The fix is one argument:

```python
ids = tokenizer.encode(text, add_special_tokens=False)
```

Simple. But easy to miss entirely if you don't decode and inspect your training sequences.

### Bug 2: Template-injected `<think>` tokens entering the loss

Nanbeige's chat template automatically inserts `<think>\n\n</think>` after certain assistant turns — specifically those that follow a tool response. The tag appears in the *formatted string*, not in the original message content, so cleaning the dataset's `messages` field does nothing. The template re-injects it at runtime.

Left unchecked, the model learns to produce `<think>` tokens as part of its output — which adds latency and noise to inference without contributing any reasoning signal (the blocks are always empty in our dataset).

The fix is a single regex applied to the formatted string before encoding:

```python
text = re.sub(r"<think>\s*</think>\n?", "", text)
```

### Problem 3: 19 tools in every prompt — most of them irrelevant

Each training example shipped the full schema for all 19 Gmail tools, regardless of which ones were actually used. The average conversation only called **3 tools**. The other 16 were dead weight.

Beyond wasted tokens, those schemas contained `"field": null` entries for every parameter that didn't apply to a given tool — a schema design artifact that inflated prompt size even further.

**The impact was severe:**

| | Original | Cleaned |
|---|---|---|
| Avg. tokens / example | 4,521 | 1,913 |
| Avg. active (loss) tokens | 544 | 539 |
| **Active loss ratio** | **11.5%** | **27.4%** |

Cutting irrelevant tools and null fields reduced sequence length by 57% while keeping the signal almost identical. The model now spends far more of its compute budget learning from assistant tokens rather than attending over dead context.

The cleaning logic is straightforward:

```python
# Keep only tools that were actually called in this conversation
used_tools = {tc["function"]["name"]
              for m in ex["messages"]
              for tc in (m.get("tool_calls") or [])}

clean_tools = [
    {
        "type": "function",
        "function": {
            "name": fn["name"],
            "description": fn["description"],
            "parameters": {
                "type": "object",
                # Drop null fields — they're schema noise, not information
                "properties": {k: v for k, v in props.items() if v is not None},
                "required": required,
            },
        },
    }
    for t in ex["tools"]
    if (fn := t["function"])["name"] in used_tools
    for params in [fn.get("parameters", {})]
    for props in [params.get("properties", {})]
    for required in [[r for r in (params.get("required") or []) if r in props]]
]
```

### Problem 4: Pad token choice

Nanbeige has no dedicated pad token. The default is `<unk>` (id=0). We changed this to `<|im_end|>` (id=166101, which is also the EOS token). With `attention_mask=0` on padding positions, neither choice affects the loss directly — but using `<unk>` means the model sees an id that's semantically "unknown" in padding regions, while `<|im_end|>` is at least a token the model encounters naturally at conversation boundaries.

```python
tokenizer.pad_token    = tokenizer.eos_token
tokenizer.pad_token_id = tokenizer.eos_token_id
```

---

## Loss Masking: Only the Assistant Speaks

TRL 0.28 removed `DataCollatorForCompletionOnlyLM`. We implemented manual label masking: every token that isn't part of an assistant turn is masked to `-100` and ignored by the cross-entropy loss.

The implementation searches for the `<|im_start|>assistant\n` template header to enter "active" mode, and exits on `<|im_start|>user\n` or `<|im_end|>`. Tool call JSON (`<tool_call>...</tool_call>`) is produced by the assistant turn and is therefore included in the loss — the model learns both the text and the structured output in one pass.

```python
def mask_labels(input_ids: list[int], ignore_index: int = -100) -> list[int]:
    labels = [ignore_index] * len(input_ids)
    in_response = False
    i = 0
    while i < len(input_ids):
        if input_ids[i:i+len(_resp_ids)] == _resp_ids:
            in_response = True
            i += len(_resp_ids)
            continue
        if input_ids[i:i+len(_instr_ids)] == _instr_ids:
            in_response = False
        if input_ids[i] == _im_end_id:
            in_response = False
        if in_response:
            labels[i] = input_ids[i]
        i += 1
    return labels
```

After cleaning, the active loss ratio sits at **~27%** — meaning more than a quarter of every sequence contributes a gradient signal. For a tool-use dataset this is healthy.

---

## Training Configuration

```python
# LoRA
LORA_R       = 64       # large rank — 96GB VRAM makes this affordable
LORA_ALPHA   = 128      # 2× r, standard scaling
LORA_TARGET  = ["q_proj", "k_proj", "v_proj", "o_proj",
                "gate_proj", "up_proj", "down_proj"]

# Training
NUM_EPOCHS   = 2        # 715 examples × 2 epochs — 3 risks overfit
BATCH_SIZE   = 1        # per GPU (8192-token sequences are large)
GRAD_ACCUM   = 16       # effective batch = 1 × 4 GPU × 16 = 64
LR           = 1e-4     # conservative for LoRA r=64 on small dataset
WARMUP_RATIO = 0.1
MAX_SEQ_LENGTH = 4096   # covers p95 of cleaned dataset (3,664 tokens)
```

**Why 2 epochs and not 3?** With 715 examples and an effective batch of 64, each epoch is only ~11 gradient steps. Three epochs means each example is seen ~48 times across all accumulation steps — enough to memorize traces rather than generalize. We chose 2.

**Why `torchrun` and not `accelerate`?** At this model size (3B, LoRA adapters ~300MB), all four GPUs comfortably hold their own replica. There's no need for ZeRO sharding or FSDP. `torchrun` is PyTorch's native process launcher — zero extra abstraction, easier to debug.

```bash
torchrun --nproc_per_node=4 train.py
```

---

## What the Model Is Actually Learning

To put it concretely: after fine-tuning, given a message like *"Find unread emails from my boss and mark them as read"*, the model should:

1. **Recognize** that this requires a `search_emails` call followed by a `batch_modify_emails` call
2. **Construct** the correct Gmail search query (`is:unread from:<boss_email>`)  
3. **Extract** the message IDs from the tool response
4. **Call** `batch_modify_emails` with `removeLabelIds: ["UNREAD"]`
5. **Summarize** the result in natural language

Steps 1–4 are learned from the 2,563 tool-call turns in our dataset. Step 5 is learned from the 1,126 text-only assistant turns.

What it will *not* reliably learn: generalizing to tools it never saw called together, or handling adversarial edge cases not represented in the 715 conversations. Tool-use fine-tuning is not magic — it's supervised imitation of a fixed set of demonstrated behaviors.

---

## Honest Assessment

**This will work** for the Gmail workflows represented in the training data.

**Risks to watch:**
- With only 715 examples, the model may over-fit to specific argument patterns (e.g., always using the same search query format it saw in training)
- Catastrophic forgetting is a real concern — the base model's general capability may degrade on tasks unrelated to Gmail
- The 25 examples we dropped (>4096 tokens) were the most complex multi-tool conversations — the model will be weaker on long, multi-step tasks

---

## What's Next

- [ ] Evaluate on held-out conversations (we should have reserved ~80 examples before training)
- [ ] Run inference with `merge_and_unload()` to get a full model checkpoint for deployment
- [ ] Compare against the base model on a standardized tool-use benchmark

The adapter will be roughly 200MB. The full merged model ~6GB in bf16. Both are worth keeping.

---

*All code, dataset processing scripts, and training configuration are available in the repository. Questions and critiques welcome.*
