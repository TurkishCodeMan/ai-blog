---
title: "Çoklu GPU ile Eğitim: Kolektif İletişimden DDP, Tensör ve Pipeline Paralelliğine"
date: "2026-11-10"
excerpt: "Tek GPU'ya sığmayan modeli birden fazla GPU'da nasıl eğitiriz? All-reduce, reduce-scatter, all-gather gibi kolektif operasyonlardan başlayıp DDP, tensör ve pipeline paralelliğini PyTorch kodlarıyla, örnek hesaplarla anlattım."
tags: ["LLM", "Distributed Training", "PyTorch", "GPU", "Parallelism"]
published: true
---

# Çoklu GPU ile Eğitim: Kolektif İletişimden DDP, Tensör ve Pipeline Paralelliğine

Tek bir GPU'nun içini (thread'ler, warp'lar, shared memory, tiling, kernel fusion) anladıktan sonra sıradaki doğal soru şuydu: **Bir GPU yetmediğinde ne yapıyoruz?** Cevap, birden fazla GPU'yu ve birden fazla makineyi birlikte çalıştırmak. Ama bu iş "daha çok GPU = daha hızlı" kadar basit değil. Çünkü GPU'lar birbirinden farklı mesafelerde ve farklı hızlarda konuşuyor.

Bu yazıda notlarımı derli toplu hale getirdim. Önce iletişimin temel taşlarını (kolektif operasyonlar), sonra donanımı, ardından üç temel paralellik stratejisini (veri, tensör, pipeline) çalışan PyTorch kodlarıyla anlatıyorum. Kodları dört process ile çalışacak şekilde yazdım. GPU yoksa Gloo (CPU) arka ucuyla da çalışıyorlar.

## Ana problem: Hesaplama ile veri arasındaki mesafe

Paralel hesaplamanın tek cümlelik özeti şu: **Veri taşıma darboğazlarını en aza indirecek şekilde hesaplamayı organize etmek.** GPU'nun içindeki matris çarpımı artık ucuz; pahalı olan, verinin yerinden oynaması.

Bellek ve bağlantı hiyerarşisine kabaca bakalım (rakamlar nesile göre değişir, büyüklük sırasını göstermesi için yazıyorum):

| Seviye | Nerede | Yaklaşık hız |
|---|---|---|
| L1 / Shared Memory | Tek GPU içinde | ~19-33 TB/s (en hızlı) |
| HBM | Tek GPU belleği | 2-8 TB/s |
| NVLink / NVSwitch | Aynı makinedeki GPU'lar arası | ~900 GB/s - 1,8 TB/s |
| InfiniBand / RoCE / Ethernet | Makineler arası | ~25-100 GB/s (en yavaş) |

Yukarıdan aşağı inildikçe hız bir iki büyüklük mertebesi düşüyor. Dolayısıyla "hangi veriyi hangi seviyede tutacağım ve hangi paralellik türünü hangi bağlantı üzerinden koşturacağım?" sorusu tasarımın merkezinde.

### Neden birden fazla GPU kullanıyoruz?

İki sebep var:

**1. Bellek kapasitesi.** Eğitimde sadece model parametreleri yer kaplamaz. Parametrelerin yanında gradyanlar, optimizer durumları (AdamW için parametre başına momentum ve varyans) ve aktivasyonlar da bellekte durur. Karışık hassasiyetli eğitimde parametre başına kabaca 16 bayt hesaplamak iyi bir başlangıç. Örnek: 7 milyar parametreli bir model için

```
7 x 10^9 parametre x 16 bayt ≈ 112 GB
```

Bu, aktivasyonlar hesaba katılmadan bile 80 GB'lık bir GPU'ya sığmıyor.

**2. Hesaplama hızı.** Daha çok FLOP kullanarak eğitim süresini aylardan haftalara, haftalardan günlere indirmek.

## Kolektif iletişim primitifleri

Paralel programlamanın 1980'lerden beri kullandığı MPI geleneği, birden fazla cihazın düzenli biçimde konuşması için bir "kelime hazinesi" tanımlar. İki terimi bilmek yeterli:

- **Rank:** Bir GPU'nun (ya da process'in) benzersiz numarası: 0, 1, 2, 3 gibi.
- **World size:** Toplam cihaz sayısı. Örneğimizde 4.

Temel operasyonlar:

| Operasyon | Ne yapar? |
|---|---|
| **Broadcast** | Bir rank'teki veriyi tüm rank'lere kopyalar. |
| **Scatter** | Bir rank'teki tensörü dilimleyip her rank'e bir dilim verir. |
| **Gather** | Tüm rank'lerdeki parçaları tek bir rank'te birleştirir (Scatter'ın tersi). |
| **Reduce** | Tüm rank'lerdeki parçaları bir işlemle (toplam, min, max) birleştirip tek bir rank'e yazar. |
| **All-Gather** | Gather'ın sonucunu sadece bir rank'e değil, **herkese** verir. |
| **Reduce-Scatter** | Reduce yapar ama sonucu dilimleyip her rank'e bir dilim dağıtır. |
| **All-Reduce** | Reduce sonucunu **herkese** verir. |
| **All-to-All** | Her rank, diğer her rank'e farklı bir dilim gönderir. |

Bunların arasındaki en güzel ilişki şu:

```
All-Reduce = Reduce-Scatter + All-Gather
```

Önce herkesin elindeki veriyi toplayıp parçalara bölerek dağıtırsın (reduce-scatter), sonra parçaları herkese yayarsın (all-gather). Sonuç, doğrudan all-reduce yapmakla aynı.

Hangi paralellik türünün hangi operasyona dayandığını da şimdiden söyleyeyim, yazının geri kalanında bunlara döneceğiz:

- **DDP** (veri paralelliği) → all-reduce
- **FSDP / ZeRO** → all-gather (ileri geçiş) ve reduce-scatter (geri geçiş)
- **Tensör paralelliği** → all-gather / all-reduce
- **Pipeline paralelliği** → send / recv (iki nokta arası)
- **MoE (uzman paralelliği)** → all-to-all

### Operasyonları önce tensörlerle simüle edelim

Gerçek GPU'lara geçmeden önce, bu operasyonların ne yaptığını saf PyTorch tensörleriyle taklit etmek bana çok yardımcı oldu. Dört rank'imiz olduğunu düşünelim:

```python
import torch
from torch import tensor

# BROADCAST: rank 0'daki veri herkese kopyalanır
input_rank0 = tensor([0., 1, 2, 3])
broadcast_output = {f"Rank {r}": input_rank0.clone() for r in range(4)}

# SCATTER: 4 elemanlı tensör 4 rank'e birer parça dağıtılır
scatter_output = {f"Rank {r}": input_rank0[r:r+1] for r in range(4)}

# GATHER: parçalar rank 0'da birleşir
gather_output_rank0 = torch.cat([scatter_output[f"Rank {r}"] for r in range(4)])

# REDUCE (SUM): 0 + 1 + 2 + 3 = 6, sonuç rank 0'da
reduce_sum_rank0 = sum([scatter_output[f"Rank {r}"] for r in range(4)])

# REDUCE-SCATTER: her rank bir vektör tutar, sütun toplamları rank'lere dağılır
matrix = torch.stack([
    tensor([0., 1, 2, 3]),
    tensor([1., 2, 3, 4]),
    tensor([2., 3, 4, 5]),
    tensor([3., 4, 5, 6]),
])  # her satır bir rank'in verisi
reduce_scatter_output = {f"Rank {r}": matrix[:, r].sum(dim=0, keepdim=True) for r in range(4)}

# ALL-REDUCE: her rank tüm sütunların toplamını alır
all_reduce_output = {f"Rank {r}": matrix.sum(dim=0) for r in range(4)}

# ALL-TO-ALL: dengeli durumda matrisin transpozu
all_to_all_in = torch.arange(16).reshape(4, 4).float()
all_to_all_out = all_to_all_in.t()
```

All-to-all'ın "transpoz" olması benim için aydınlatıcıydı. Satır i, rank i'nin gönderdikleri; sütun j, rank j'ye gidenler. Her rank'in aldığı şey, transpozdaki kendi satırı. Mixture-of-Experts'te token'ların uzmanlara dağıtılması tam olarak bu.

## Donanım ve NCCL

GPU'ların birbirine nasıl bağlandığı, hangi paralellik türünü rahatça kullanabileceğini belirliyor:

| Bağlantı | Konum | Tipik bant genişliği | Uygun paralellik |
|---|---|---|---|
| PCIe (Gen 4/5) | Tek makine | 32-64 GB/s | Veri paralelliği |
| NVLink 4/5 | Tek makine (DGX/HGX) | 900 GB/s - 1,8 TB/s | **Tensör paralelliği** |
| InfiniBand (RDMA) | Çok makine | 50-100 GB/s | Veri / Pipeline |
| Standart Ethernet | Çok makine | ~10-25 GB/s (CPU üzerinden) | Seyrek iletişim / Pipeline |

Burada iki kavram var:

**RDMA (Remote Direct Memory Access).** Klasik Ethernet iletişiminde veri önce CPU'ya, sonra işletim sisteminin socket tamponuna, sonra ağ kartına kopyalanır. RDMA'da ise bir GPU'nun belleği, CPU'yu ve işletim sistemini tamamen atlayarak doğrudan başka bir makinedeki GPU belleğine yazılır ya da oradan okunur. RoCE, bu fikri Ethernet üzerinde sunan türdür.

**NCCL.** NVIDIA'nın kolektif iletişim kütüphanesi. Donanım topolojisini (PCIe, NVLink, InfiniBand) kendisi tespit eder, en uygun iletişim halkalarını ya da ağaçlarını kurar ve doğrudan GPU çekirdekleri başlatır. PyTorch'ta `dist.init_process_group("nccl")` dediğinde arka planda çalışan şey bu.

Pratik kural: **Sık ve büyük iletişim gerektiren paralellik türünü en hızlı bağlantıya, seyrek iletişim gerektirenleri yavaş bağlantılara koy.**

## PyTorch ile gerçek kolektifler

Şimdi bu operasyonları gerçek process'lerle çalıştıralım. Her rank şu veriyi oluşturur:

```python
data = torch.tensor([0., 1, 2, 3], device=device) + rank
```

Yani rank 0'da `[0,1,2,3]`, rank 1'de `[1,2,3,4]`, rank 2'de `[2,3,4,5]`, rank 3'te `[3,4,5,6]`.

Process'leri başlatmak için küçük bir kurulum fonksiyonu yazıyorum:

```python
import os
import torch
import torch.distributed as dist
import torch.multiprocessing as mp

def setup(rank, world_size):
    os.environ["MASTER_ADDR"] = "localhost"
    os.environ["MASTER_PORT"] = "15629"
    if torch.cuda.is_available():
        torch.cuda.set_device(rank)          # her process kendi GPU'sunu seçmeli
        dist.init_process_group("nccl", rank=rank, world_size=world_size)
    else:
        dist.init_process_group("gloo", rank=rank, world_size=world_size)

def cleanup():
    dist.destroy_process_group()
```

Bir not: Jupyter içinde `mp.spawn` kullanmak sorun çıkarabiliyor, çünkü fonksiyonların serileştirilebilmesi gerekiyor. Ben worker kodunu geçici bir betik dosyasına yazıp ayrı bir Python process'iyle çalıştırarak bu sorunu aştım. Böylece kernel çökmesi ve bellek kilitlenmeleri de notebook'u etkilemiyor.

Asıl worker şöyle:

```python
def worker(rank, world_size):
    setup(rank, world_size)
    device = torch.device(f"cuda:{rank}") if torch.cuda.is_available() else torch.device("cpu")

    # 1. ALL-REDUCE
    data = torch.tensor([0., 1, 2, 3], device=device) + rank
    dist.all_reduce(data, op=dist.ReduceOp.SUM)

    # 2. REDUCE-SCATTER
    input_tensor = torch.arange(world_size, dtype=torch.float32, device=device) + rank
    output_shard = torch.empty(1, device=device)
    dist.reduce_scatter_tensor(output_shard, input_tensor, op=dist.ReduceOp.SUM)

    # 3. ALL-GATHER (reduce-scatter çıktısını geri birleştir)
    gathered_full = torch.empty(world_size, device=device)
    dist.all_gather_into_tensor(gathered_full, output_shard)

    cleanup()

if __name__ == "__main__":
    mp.spawn(worker, args=(4,), nprocs=4, join=True)
```

Sonucu elle hesaplayabiliriz, ki bence en iyi doğrulama bu. Dört rank'in `[0,1,2,3] + rank` vektörlerini toplarsak:

```
eleman 0: 0+1+2+3 = 6
eleman 1: 1+2+3+4 = 10
eleman 2: 2+3+4+5 = 14
eleman 3: 3+4+5+6 = 18
```

Yani **all-reduce sonrası her rank'te `[6, 10, 14, 18]`** olmalı. Reduce-scatter'da ise rank 0 `6`, rank 1 `10`, rank 2 `14`, rank 3 `18` alır, çünkü her rank toplamın sadece kendi dilimini tutar. Sonra all-gather bu dört parçayı birleştirir ve herkeste yine `[6, 10, 14, 18]` oluşur. Yani `all-reduce = reduce-scatter + all-gather` eşitliğini gözümüzle görmüş oluyoruz.

## İletişim bant genişliğini ölçmek

Dağıtık sistemlerde "hızlı mı?" sorusuna sezgiyle cevap verilmez, ölçülür. All-reduce için kullandığım ölçüm mantığı şu.

Halka (ring) all-reduce algoritmasında, S baytlık bir tensör ve W cihaz için toplam gönderilen veri:

```
gonderilen_bayt = S * 2 * (W - 1)
```

Cihaz başına efektif bant genişliği:

```
bant_genisligi = gonderilen_bayt / (W * sure)
```

W büyüdükçe bu değer yaklaşık `2 * S / sure` değerine yaklaşır. Önemli bir sonuç: **Halka all-reduce'un cihaz başına iletişim yükü, cihaz sayısına neredeyse bağlı değil.** 4 GPU'da da 400 GPU'da da her GPU yaklaşık `2 * S` bayt taşıyor.

Ölçüm kodu:

```python
num_elements = 10 * 1024 * 1024            # 10M float32 ≈ 40 MB
data = torch.randn(num_elements, device=device)

# Isınma: ilk çağrılar kurulum maliyeti içerir, ölçüme katma
for _ in range(3):
    dist.all_reduce(data, op=dist.ReduceOp.SUM)
if torch.cuda.is_available():
    torch.cuda.synchronize()
dist.barrier()

start = time.time()
trials = 5
for _ in range(trials):
    dist.all_reduce(data, op=dist.ReduceOp.SUM)
if torch.cuda.is_available():
    torch.cuda.synchronize()
dist.barrier()
duration = (time.time() - start) / trials

size_bytes = data.element_size() * data.numel()
sent_bytes = size_bytes * 2 * (world_size - 1)
bandwidth = sent_bytes / (world_size * duration)
```

İki ayrıntıya dikkat: Isınma turu şart, çünkü NCCL ilk çağrıda halkaları kuruyor. Ve GPU işlemleri asenkron olduğu için süreyi ölçmeden önce `torch.cuda.synchronize()` çağırmak gerekiyor. Aksi halde sadece "işi kuyruğa atma" süresini ölçersin.

## Strateji 1: Veri paralelliği (DDP)

En basit ve en yaygın strateji. Fikir şöyle:

- Model parametreleri **tüm GPU'larda kopyalanır**.
- Eğitim verisi (batch) **GPU sayısına bölünür**.
- Her GPU kendi mini-batch'inde ileri ve geri geçişi yapar, yerel gradyanlarını hesaplar.
- **Tek senkronizasyon noktası:** Optimizer adımından önce tüm gradyanlar `all_reduce` ile ortalanır.
- Herkes aynı ortalama gradyanı gördüğü ve aynı başlangıç ağırlıklarıyla başladığı için, **parametreler tüm GPU'larda birebir aynı kalır.**

Batch boyutunun en az world size kadar olması gerekir, aksi halde bazı GPU'lar boşta kalır.

```python
def worker(rank, world_size):
    setup(rank, world_size)
    device = get_device(rank)

    # Sentetik veri: 128 örnek, 256 boyut
    batch_size, num_dim = 128, 256
    torch.manual_seed(42)
    full_data = torch.randn(batch_size, num_dim)

    # Her rank kendi dilimini alır
    local_bs = batch_size // world_size
    local_data = full_data[rank * local_bs : (rank + 1) * local_bs].to(device)

    # Aynı seed: tüm rank'lerde aynı başlangıç ağırlıkları
    torch.manual_seed(0)
    w1 = nn.Parameter(torch.randn(num_dim, num_dim, device=device) / math.sqrt(num_dim))
    w2 = nn.Parameter(torch.randn(num_dim, num_dim, device=device) / math.sqrt(num_dim))
    params = [w1, w2]
    optimizer = torch.optim.AdamW(params, lr=1e-3)

    for step in range(3):
        optimizer.zero_grad()
        x = F.gelu(local_data @ w1)
        x = F.gelu(x @ w2)
        loss = x.square().mean()
        loss.backward()                      # yerel gradyanlar

        for p in params:                     # DDP'nin kalbi
            dist.all_reduce(p.grad, op=dist.ReduceOp.AVG)

        optimizer.step()                     # herkes aynı güncellemeyi yapar
```

Burada şunu fark etmek önemli: Her rank'in **loss değeri farklı** çıkar, çünkü her biri farklı veri dilimini görüyor. Ama `w1`'in herhangi bir elemanını yazdırırsan tüm rank'lerde aynı sayıyı görürsün. Senkron kalmanın kanıtı bu.

Bir de iletişim maliyeti hesabı yapalım. Varsayımsal olarak 7 milyar parametreli bir modelin gradyanlarını bf16'da (2 bayt) tuttuğumuzu düşün: 14 GB. Halka all-reduce her GPU'nun yaklaşık iki katı, yani ~28 GB taşımasını gerektirir. 100 GB/s'lik efektif bir bağlantıda bu yaklaşık 0,28 saniye. Eğer ileri-geri geçiş bundan çok daha uzun sürüyorsa iletişim sorun olmaz. Üstelik PyTorch DDP, gradyanları geri geçiş devam ederken katman katman gönderip iletişimi hesaplamayla örtüştürür.

DDP'nin sınırı belli: Her GPU modelin **tam kopyasını** tuttuğu için, model tek GPU'ya sığmıyorsa DDP tek başına çözüm değil. İşte FSDP ve ZeRO'nun doğuş sebebi. Parametre, gradyan ve optimizer durumlarını da GPU'lara paylaştırıyorlar: İleri geçişte gereken parametreleri `all-gather` ile toplayıp kullandıktan sonra bırakıyor, geri geçişte gradyanları `reduce-scatter` ile hem topluyor hem dağıtıyorlar.

## Strateji 2: Tensör paralelliği

Bir tek katmanın ağırlık matrisi bile çok büyük olabilir. Örneğin bir Transformer'ın MLP katmanı 4096 x 16384 boyutunda olabilir. Tensör paralelliği, **tek bir katmanı genişlik boyunca** GPU'lara böler.

Fikir:

- Her GPU aynı girdiyi alır.
- Ağırlık matrisi W, sütunlara bölünür. 4 GPU varsa her GPU ağırlığın dörtte birini tutar.
- Her GPU kendi dilimiyle kısmi aktivasyonu hesaplar:

```
yerel_aktivasyon = X @ W_i      ->  boyut: (batch, dim / 4)
```

- Ardından `all-gather` ile kısmi aktivasyonlar birleştirilip tam boyutlu aktivasyon elde edilir.

```python
def worker(rank, world_size):
    setup(rank, world_size)
    device = get_device(rank)

    batch_size, num_dim = 16, 128
    local_dim = num_dim // world_size

    torch.manual_seed(42)
    x = torch.randn(batch_size, num_dim, device=device)       # herkes aynı girdiyi alır

    torch.manual_seed(100 + rank)
    w_shard = nn.Parameter(torch.randn(num_dim, local_dim, device=device) / math.sqrt(num_dim))

    local_act = F.gelu(x @ w_shard)                            # (16, 32)

    gathered = [torch.empty(batch_size, local_dim, device=device) for _ in range(world_size)]
    dist.all_gather(gathered, local_act)
    full_act = torch.cat(gathered, dim=1)                      # (16, 128)
```

Her rank'te kısmi aktivasyonun şekli `[16, 32]`, birleştirilmiş tam aktivasyonun şekli `[16, 128]` olmalı.

Gerçek Transformer uygulamalarında (Megatron tarzı) bu fikir biraz daha incelikli kullanılır: MLP'nin ilk matrisi sütun bazlı, ikinci matrisi satır bazlı bölünür. Böylece iki matris arasında iletişim gerekmez ve **MLP başına yalnızca bir all-reduce** yeterli olur. Attention'da da başlıklar (heads) GPU'lara paylaştırılarak aynı numara yapılır.

Ama bu stratejinin bedeli var: **İletişim, her katmanın her matris çarpımında gerçekleşiyor**, yani çok sık ve ileri-geri geçişin kritik yolunda. Bu yüzden tensör paralelliği NVLink'li tek makinenin içinde (genelde 4 ya da 8 GPU) kullanılır. Yavaş bir makineler arası bağlantı üzerinde bunu çalıştırmak, GPU'ları çoğu zaman iletişim beklerken boşta bırakır.

## Strateji 3: Pipeline paralelliği

Model çok derin olduğunda (örneğin 80 katmanlı bir model), katmanları **derinlik boyunca** GPU'lara paylaştırabiliriz:

- Rank 0: katman 1-2
- Rank 1: katman 3-4
- ...

Veri sırayla rank 0'dan rank 1'e akar. İletişim artık kolektif değil, **iki nokta arası** (`send` / `recv`) ve yalnızca aşama sınırlarında, yani aktivasyon boyutu kadar. Bu yüzden düşük bant genişliğiyle bile çalışabilir. Makineler arasına yerleştirilmesinin sebebi bu.

### Pipeline bubble ve micro-batch çözümü

Naif uygulamada tüm batch'i tek parça gönderirsen, rank 1 rank 0'ın işini bitirmesini boş boş bekler. Sonra rank 0 boşta kalır. Bu boşluklara **pipeline bubble** (boru hattı kabarcığı) denir.

Çözüm, batch'i küçük **mikro-yığınlara (micro-batches)** bölmek. Rank 0 birinci mikro-yığını bitirip rank 1'e gönderirken hemen ikinci mikro-yığını işlemeye başlar. Böylece iki GPU aynı anda çalışabilir.

Kabarcığın büyüklüğü için iyi bir yaklaşık formül var. p aşama ve m mikro-yığın için boşta kalan oran:

```
kabarcik_orani = (p - 1) / (m + p - 1)
```

Örneğin p = 4 aşamada:

| Mikro-yığın sayısı (m) | Boşta kalan oran |
|---:|---:|
| 4 | 3/7 ≈ %43 |
| 16 | 3/19 ≈ %16 |
| 64 | 3/67 ≈ %4,5 |

Mikro-yığın sayısı arttıkça kabarcık küçülür. Ama bir bedeli var: Çok sayıda mikro-yığın, her birinin aktivasyonlarını saklamak demek ve her GPU matris çarpımlarını daha küçük parçalarla yapıyor.

İki aşamalı basit bir demo:

```python
def worker(rank, world_size):          # world_size = 2
    setup(rank, world_size)
    device = get_device(rank)

    batch_size, num_dim, num_micro = 16, 64, 4
    micro_size = batch_size // num_micro

    torch.manual_seed(200 + rank)
    layer_w = nn.Parameter(torch.randn(num_dim, num_dim, device=device) / math.sqrt(num_dim))

    if rank == 0:
        torch.manual_seed(42)
        micro_batches = torch.randn(batch_size, num_dim, device=device).chunk(num_micro, dim=0)
    else:
        micro_batches = [torch.empty(micro_size, num_dim, device=device) for _ in range(num_micro)]

    for idx, x in enumerate(micro_batches):
        if rank > 0:
            dist.recv(x, src=rank - 1)         # önceki aşamadan aktivasyon al

        x = F.gelu(x @ layer_w)                 # bu aşamanın katmanı

        if rank + 1 < world_size:
            dist.send(x, dst=rank + 1)          # sonraki aşamaya gönder
        else:
            print(f"Son aşama: mikro-yığın {idx} tamamlandı, norm = {x.norm().item():.2f}")
```

Bu demo sadece ileri geçişi gösteriyor. Gerçek eğitimde geri geçiş de ters yönde akar ve hangi mikro-yığının ileri/geri geçişinin ne zaman yapılacağını belirleyen programlar (GPipe, 1F1B gibi) kabarcığı ve bellek kullanımını doğrudan etkiler.

## Karşılaştırma tablosu

| Paralellik | Neyi bölüyor? | İletişim | Sıklık | Donanım ihtiyacı |
|---|---|---|---|---|
| **Veri (DDP)** | Batch | all-reduce (gradyanlar) | Her adımın geri geçiş sonunda | Standart ağ yeterli |
| **FSDP / ZeRO** | Parametre + gradyan + optimizer durumu | all-gather + reduce-scatter | Her katmanın ileri ve geri geçişinde | Hızlı ağ tercih edilir |
| **Tensör (TP)** | Katman genişliği | all-gather / all-reduce | Her katmanın her matris çarpımında | NVLink şart (~1 TB/s) |
| **Pipeline (PP)** | Katman derinliği | send / recv | Mikro-yığın başına, aşama sınırında | Düşük bant genişliği yeter |
| **Uzman (MoE)** | Uzman katmanlar | all-to-all | Her token yönlendirmesinde | Yüksek bant genişliği |

## Aklımda kalan üç ders

**1. İletişimi hesaplamayla örtüştür.** İletişim süresini gizlemenin yolu, onu hesaplamayla aynı anda yürütmek. PyTorch'ta `async_op=True` ile iletişim ayrı bir CUDA akışında başlatılır, hesaplama devam eder. DDP'nin gradyanları katman katman göndermesi bunun en bilinen örneği.

**2. Sakla, yeniden hesapla ya da iste.** Bellek yetmediğinde aktivasyonlarla ilgili üç seçeneğin var: Sakla (bellek harcar), yeniden hesapla (hesaplama harcar, yani activation checkpointing) ya da başka bir GPU'dan iste (iletişim harcar). Hangisinin kazanacağı, darboğazın nerede olduğuna bağlı.

**3. Modern büyük modeller tek stratejiyle eğitilmez.** 70B ile 405B arasındaki modeller binlerce GPU üzerinde **DDP + FSDP + TP + PP** kombinasyonuyla eğitilir. Genelde şu düzen kullanılır: Tensör paralelliği tek makinenin içinde (NVLink), pipeline paralelliği makineler arasında, veri paralelliği de kalan her şeyin üzerinde. Yani strateji seçimi, donanım hiyerarşisini birebir yansıtır: Sık iletişim gerektiren hızlı bağlantıya, seyrek iletişim gerektiren yavaş bağlantıya.

Bu konuyu çalışırken en çok işime yarayan zihinsel model şu oldu: Her paralellik türü, **neyi bölüp neyi kopyaladığının** ve **bu yüzden hangi veriyi ne sıklıkla taşımak zorunda kaldığının** cevabıdır. Bu iki soruyu sorabildiğinde yeni bir strateji gördüğünde bile onu hızla yerine oturtabiliyorsun.
