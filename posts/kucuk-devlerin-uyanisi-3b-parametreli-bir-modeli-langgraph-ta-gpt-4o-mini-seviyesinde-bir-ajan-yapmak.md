---
title: "Küçük Devlerin Uyanışı: 3B Parametreli Bir Modeli LangGraph'ta GPT-4o-mini Seviyesinde Bir Ajan Yapmak"
date: "2026-02-27"
excerpt: "Sadece 3 milyar parametreli yerel bir modeli (Nanbeige-3B) LangGraph ve MCP (Gmail) ortamında nasıl eğittiğimi, SFT ve DPO aşamalarında yaşanan sorunları ve sonunda GPT-4o-mini'nin 0.87'lik skorunu nasıl yakaladığımızı adım adım anlatıyorum."
tags: ["LLM", "Agentic AI", "LangGraph", "SFT", "DPO", "vLLM", "Tool Calling"]
published: true
---

# Küçük Devlerin Uyanışı: 3B Parametreli Bir Modeli LangGraph'ta GPT-4o-mini Seviyesinde Bir Ajan Yapmak

Günümüzde büyük teknoloji şirketlerinin sunduğu trilyon parametreli modeller şüphesiz çok yetenekli. Ancak verilerimizi dışarı çıkarmadan, kendi donanımımızda (hatta tek bir GPU'da) ve sıfır API maliyetiyle koşturabileceğimiz **spesifik, kurumsal seviyede (Enterprise-Grade) bir "Ajan" (Agent) yapabilir miyiz?**

Cevap: **Evet.**

Bu yazıda, Çince tabanlı (ancak mantık yürütme kapasitesi olan) sadece **3 Milyar parametreli küçük bir modeli (Nanbeige-4.1-3B)**, LangGraph ve MCP (Model Context Protocol) mimarisiyle nasıl tam teşekküllü bir **"Gmail Ajanı"na** dönüştürdüğümü anlatacağım.

En büyük sürpriz ise finalde: Modelimiz LangSmith benchmark testlerinde (Tool Usage Recall) endüstri standardı olan **OpenAI GPT-4o-mini modeliyle tamamen aynı skoru (0.87)** aldı!

İşte baştan sona bu zorlu ama büyülü yolculuğun adımları...

---

## Aşama 1: Neden Büyük Modeller Değil de "Tiny LLM"?

Agentic yapıların (LangChain/LangGraph) kalbi olan *Tool Calling (Araç Kullanımı)* ve *Planning (Planlama)* özellikleri normalde Llama-3-70B, GPT-4, Claude 3.5 Sonnet gibi ağır abilerin işidir. Küçük modellerde (1B - 8B arası) "Rezonans/Reasoning" kapasitesi çok sınırlı olduğu için genellikle formatları bozarlar, halüsinasyon görürler veya sonsuz döngülere (Recursion Limit) girerler.

Ancak bizim amacımız her şeyi bilen bir bilge yaratmak değil. Amacımız sadece **"Gelen e-postaları okuyabilen, filtre/etiket oluşturabilen ve cevap taslağı yazabilen" dar kapsamlı ama %100 isabetli bir işçi arı** yaratmaktı. Bunun için devasa bir modele ihtiyacımız yoktu. Doğru yönlendirilmiş (Aligned) bir 3B model fazlasıyla yeterliydi.

---

## Aşama 2: SFT (Supervised Fine-Tuning) – Motora Hareket Katmak

İlk iş, modele LangChain'in gönderdiği formattaki System Prompt'unu anlamayı ve 19 adet vahşi Gmail MCP aracından (Tool) doğru olanını seçerek JSON formatında çağırmayı öğretmekti.

Bunun için bir **Supervised Fine-Tuning (SFT)** LoRA adaptörü eğittik. Veri setimizde şu mantık vardı:
- **Kullanıcı:** *"HR'dan gelen son 3 maili bul."*
- **Model:** `<think> ... </think>` (Düşünce bloğu) + `{"name": "search_emails", "arguments": ...}`

### SFT'nin Acı Gerçekleri: "Overfitting" ve "Hiperaktivite"
Eğitim bitti, model vLLM'de ayağa kalktı. Ama bir sorun vardı: Model o kadar hevesliydi ki, ne sorsam gidip bir Tool çalıştırıyordu!
Kullanıcı olarak sadece `"Hi" (Merhaba)` dediğimde bile, model kendi kendine *Toplantı maillerini aramaya, yeni etiketler açmaya ve filtre kurmaya* başladı.

**Sebep:** Eğitim verisinde (SFT) hedefler hep "Bir aracı kullan" şeklindeydi. SFT modeli "Ne yapması gerektiğini" çok iyi ezberlemişti ama **"Ne zaman durması (susması) gerektiğini"** bilmiyordu. Aşırı hevesli, freni patlamış bir kamyon gibi davranıyordu.

---

## Aşama 3: DPO (Direct Preference Optimization) – Ajanı Terbiye Etmek (Alignment)

LangGraph içindeki asıl kırılma noktası burasıydı. Modelin gereksiz hareketlerini törpülemek ve ona hata yönetimini öğretmek için **DPO (RLHF'in daha pratik bir versiyonu)** veri seti hazırladık.

DPO veri seti iki kolon içerir: `Chosen` (Seçilen/İyi Davranış) ve `Rejected` (Reddedilen/Kötü Davranış).

**Örnek DPO Verimiz:**
- **Kullanıcı:** *"Merhaba"*
- **Rejected (Kötü Yanıt):** `<think> Aksiyon almalıyım! </think> Tool Call: list_labels`
- **Chosen (İyi Yanıt):** `<think> Sadece selam verilmiş, araca gerek yok. </think> Merhaba, size mailleriniz konusunda nasıl yardımcı olabilirim?`

### DPO Sonuçları:
`DPOTrainer` bu aşamada beklediğimizden bile iyi çalıştı. Logları incelediğimizde, modelin "Rejected" (Gereksiz araç çağırma) isteğine karşı olasılığını (loss) ciddi şekilde cezalandırdığını ve "Chosen" (Farkındalık) ihtimaline sıkı sıkıya tutunduğunu gördük. Margin'ler açılmıştı!

---

## Aşama 4: Hata Yönetimi, Recursion (Sonsuz Döngü) Limitleri ve LangGraph Kurulumu

SFT ve DPO atlatılmış olsa bile LangGraph mimarilerinde minik modellerin en sık düştüğü bir tuzak daha vardır: **"Hataları Yönetememek"**.

Diyelim ki model `read_email` komutuna yanlış bir ID verdi ve araç `Error: Invalid ID` döndürdü. GPT-4 gibi modeller bu hatayı görünce *"Ah, bulamadım, kullanıcıya sorayım"* der ve döngüyü kırar. Ancak 3B modeller hatayı telafi edebilmek için ısrarla başka bir aracı tetiklemeye çalışır, ta ki LangGraph'ın `RecursionLimit` sınırına (varsayılan 25 tur) çarpıp sistem çökene kadar.

**Çözüm: "Few-Shot System Prompt" ile Kılavuz (Graceful Degradation) Oluşturmak**

Bunu çözmek için `single_agent.py` dosyamıza modelin davranış kodlarını (Critical Rules) açıkça dikte ettik ve **"Nasıl Pes Etmesi"** gerektiğine dair diyalog örnekleri koyduk:

```text
CRITICAL RULES:
1. If a tool returns an Error (e.g., "Error: invalid id"), DO NOT try to call it again or guess other parameters. 
2. Accept the failure gracefully, explain the situation to the user in natural language, and stop.

--- FEW-SHOT EXAMPLES ---
User: read email with id abc1234
Assistant: <think> I need to use the `read_email` tool. </think>
[Tool Response]: Error: Invalid id value
Assistant: <think> The tool returned an error. I must NOT retry. I will inform the user. </think>
I couldn't read the email because the provided ID "abc1234" is invalid. Please check the ID and try again.
```

---

## Aşama 5: Büyük Karşılaşma (LangSmith Benchmark Sınavı: 3B vs GPT-4o-mini)

Tüm donanım, vLLM regex çözümleri (vLLM parser çökmeleri atlatıldıktan sonra `tool_choice: "none"` hileleriyle) ve Promplarımız hazırdı. Modelimizi (SFT + DPO + Few-Shot) LangSmith'teki evrensel e-posta aracılığı değerlendirme testine ("tool_usage_recall") soktuk.

Karşısında ise endüstri ikonu vardı: **OpenAI GPT-4o-mini**.

Sonuçlar bizi gururlandırdı:

| Model / Aşama | Evaluation Score (Tool Recall) | Davranış Karakteristiği |
| :--- | :---: | :--- |
| **Nanbeige 3B (Base Model + Few-Shot)** | `0.60` | Kuralları anlayıp uygulamak istiyor ama formata (JSON/Tool şeması) uymakta zorlanıp batırıyor. |
| **Nanbeige 3B (Sadece SFT)** | `0.73` | Araçları mükemmel formatta bağırıyor ama nerede susacağını bilmediği (Hyperactive) için şansa hedef tutturuyor. |
| **Nanbeige 3B (SFT + DPO + Few-Shot)** | **`0.87`** | Gereğinde araç kullanan, hata alınca zarifçe pes eden (Graceful Degradation), tam teşekküllü stabil ajan! |
| **OpenAI GPT-4o-mini** | **`0.87 - 0.88`** | Sıfır konfigürasyon, API tabanlı kapalı sistem. Endüstri lideri. |

---

## Sonuç: Neler Öğrendik?

1. **Küçük modeller ajana Dönüşebilir:** Sadece 3 Milyar parametreli modeller bile, doğru hizalama (SFT+DPO boru hattı) ve LangGraph’ın kontrol mekanizmaları altında harikalar yaratabilir.
2. **SFT yetmez, DPO şarttır:** Tool Calling öğretmek işin sadece yarısıdır (yapmayı öğretmek). Asıl devrim, modelin ne zaman DORMANT (pasif) kalıp, ne zaman hata mesajıyla eylemi keseceğini öğretmektir (Fren sistemleri).
3. **Prompt Mühendisliğinin ("Few-Shot") hala canı var:** Çok gelişmiş modeller bile, spesifik sistemlerde sonsuz döngü logiğini yenmek için basit bir rol model (Few-shot example) diyaloğuna muhtaçtır.

Eğer LLM ve ajan (Agent) sistemleri geliştiriyorsanız; milyar dolarlık kapalı API'lerin peşinden gitmek yerine, elinizdeki verilerle yerel ve daha küçük "işçi modellerinizi/Uzman Ajanlarınızı" nasıl özelleştirebileceğinizi mutlaka düşünün. Özgürlüğün ve mühendislik hazzının gerçek noktası burası!

> *Yorumlarınız ve projelerinizi tartışmak için benimle iletişime geçebilirsiniz. Mutlu Kodlamalar!🚀*
