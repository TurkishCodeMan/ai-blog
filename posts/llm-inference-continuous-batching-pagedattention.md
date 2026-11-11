---
title: "LLM Çıkarımında Sistem Seviyesi Optimizasyon: Continuous Batching ve PagedAttention"
date: "2026-11-11"
excerpt: "Modeli eğitmek kolay, canlıda sunmak zor. vLLM gibi motorların temelindeki Continuous Batching ve PagedAttention fikirlerini, GPU'yu boşta bırakmadan ve belleği israf etmeden nasıl çalıştırdıklarını anlattım."
tags: ["LLM", "Inference", "vLLM", "PagedAttention"]
published: true
---

# Modeli Eğitmek Kolay, Canlıda Sunmak Zor: Continuous Batching ve PagedAttention

Uzun süredir LLM'lerin çıkarım (inference) tarafını anlamaya çalışıyorum. Eğitim kısmı bana hep daha "temiz" geldi: veri hazır, diziler sabit boyutta, her şey aynı anda başlıyor ve aynı anda bitiyor. Modeli bir kez canlıya aldığınızda ise bambaşka bir dünya başlıyor. Bu yazıda, çıkarım üzerine çalışırken en çok "demek böyle çalışıyormuş" dediğim kısmı, yani **vLLM**, **TGI** ve **TensorRT-LLM** gibi motorların neden bu kadar hızlı olduğunu kendi cümlelerimle anlatmaya çalışacağım.

Kısaca iki fikir var ve ikisi de aslında bilgisayar bilimlerinin eski fikirlerinden ödünç alınmış: **Continuous Batching** ve **PagedAttention**. Birincisi GPU'nun boş beklemesini, ikincisi belleğin boşa harcanmasını çözüyor.

## Canlı trafik neden eğitime benzemiyor?

Eğitimde bir batch hazırlarken her örneği aynı uzunluğa getiriyoruz (örneğin 2048 token). Hepsi aynı anda gidiyor, aynı anda dönüyor. Canlı serviste ise gerçek kullanıcılar var ve bu kullanıcılar bana üç ayrı baş ağrısı yaşatıyor:

1. **Farklı zamanlarda geliyorlar.** Ahmet 14:00:00'da bir soru soruyor, Mehmet 14:00:02'de. İkisinin başlangıç anı aynı değil.
2. **Cevap uzunlukları farklı.** Ahmet'in cevabı 20 token'da bitiyor, Mehmet'inki 1000 token sürüyor. Model cevabı ne zaman bitireceğini önceden söylemiyor.
3. **Ortak kısımları var.** Çoğu uygulamada her isteğin başında aynı sistem prompt'u ya da aynı doküman duruyor. Yani aslında aynı şeyi tekrar tekrar işliyoruz.

Bu üç problemi çözmeden GPU'yu verimli kullanmak mümkün değil. Çünkü çıkarımın doğası gereği zaten **memory-bound** bir iş yapıyoruz. Decode aşamasında her yeni token için model ağırlıklarını ve KV Cache'i bellekten okuyoruz, hesaplama kısmı görece küçük kalıyor. Yani GPU'nun asıl darboğazı çarpma hızı değil, bellek bant genişliği ve bellek kapasitesi. Batch'i büyütmek bu yüzden bu kadar değerli: aynı ağırlık okumasıyla birden fazla isteğe hizmet vermiş oluyoruz. Ama batch'i nasıl oluşturduğunuz her şeyi belirliyor.

## Problem 1: Statik batching'de herkes en yavaşı bekliyor

En naif yaklaşım şu: dört isteği topla, birlikte GPU'ya ver, hepsi bitince sonuçları dön, sonra yeni dört isteği al.

Şimdi şu senaryoyu düşünün:

- İstek 1, 15 token üretip bitiyor.
- İstek 2, 50 token'da bitiyor.
- İstek 3 hâlâ üretiyor, 500 token'a doğru gidiyor.

İstek 1 ve 2 çoktan bitti ama batch'teki yerleri duruyor. Üstelik bitmiş istekler için GPU, padding token'ları üzerinde anlamsız çarpımlar yapmaya devam ediyor. Kuyrukta bekleyen yeni müşteri ise ancak İstek 3'ün 500 token'ı bitince içeri girebiliyor. Yani en yavaş istek, herkesin hızını belirliyor. Bunu ilk okuduğumda "bu kadar israf nasıl kabul edilebilir?" diye düşündüm; ama eğitimden gelen alışkanlıkla herkes batch'i tek parça düşünüyordu.

## Çözüm 1: Continuous Batching (Iteration-Level Scheduling)

Orca makalesiyle yaygınlaşan fikir şu: planlamayı **istek seviyesinde değil, token (iterasyon) seviyesinde** yapmak.

Her üretim adımından sonra sisteme şunu soruyoruz: "Bitenler var mı?" Eğer İstek 1 bittiyse, onu batch'ten hemen çıkarıyoruz ve kuyrukta bekleyen İstek 5'i aynı anda içeri alıyoruz. Bir sonraki adımda batch yine dolu. GPU hiçbir zaman "son isteğin bitmesini bekleyerek" boşta kalmıyor.

Bunu bir restoran gibi düşünmek bana çok yardımcı oldu. Statik batching, masadaki herkes yemeğini bitirmeden yeni müşteri almayan bir restoran. Continuous batching ise bir masa boşalır boşalmaz sıradaki müşteriyi oturtan restoran. Aynı mutfak, aynı garsonlar, ama saatte çok daha fazla müşteri ağırlanıyor.

### Peki farklı uzunluktaki istekler aynı matriste nasıl birleşiyor?

İlk aklıma gelen soru buydu: biri 10 token'lık, biri 500 token'lık iki istek aynı tensörün içine nasıl girer? Cevap **selective batching**:

- **Attention dışındaki katmanlar (MLP, normalizasyon vb.):** Bu katmanlar token'lar arasında birbirinden bağımsız çalışıyor. O yüzden bütün isteklerin token'larını arka arkaya dizip tek bir düzensiz (ragged) dizi yapıyoruz: `[10 + 500 + ...] x D`. Padding'e gerek kalmıyor.
- **Attention katmanı:** Burada her isteğin kendi geçmişine, yani kendi KV Cache'ine bakması gerekiyor. O yüzden attention, her istek için kendi uzunluğuna göre ayrı ayrı hesaplanıyor.

Bu ayrım güzel çünkü ağır işin çoğunu yapan matris çarpımları tek büyük parça halinde, verimli çalışırken; uzunlukların birbirine karışmaması gereken tek yer olan attention ayrı tutuluyor.

## Problem 2: KV Cache belleği nasıl boşa gidiyor?

Continuous batching işi çözmeye yetmiyor, çünkü batch'e kaç istek sığacağını bu kez **VRAM** belirliyor. Her istek için bir KV Cache tutmamız gerekiyor ve bu cache, üretilen her token'la büyüyor.

Eski sistemlerin yaptığı şuydu: bir istek geldiğinde modelin kaç token üreteceğini bilmediği için "olur da 2048 token yazar" diyerek VRAM'de **2048 token'lık bitişik (contiguous) bir alanı** baştan ayırıyordu. Kullanıcı sadece 50 token yazıp konuşmayı bitirirse, ayrılan alanın büyük kısmı hiç kullanılmadan boşta kalıyordu. Bu duruma iç parçalanma (internal fragmentation) deniyor ve çalışmalarda ayrılan belleğin **%60 ila %80'inin** boşa gidebildiği gösterilmiş.

Sonuç şu: VRAM dolu görünüyor ama içi boş. GPU'nuz aslında bol bellekli, ama aynı anda 4-8 kişiye zor hizmet veriyorsunuz. Bellek bittiği için batch büyüyemiyor, batch büyüyemediği için de memory-bound çıkarımın en büyük avantajını kaçırıyorsunuz.

## Çözüm 2: PagedAttention (vLLM'in kalbi)

Berkeley ekibinin 2023'te önerdiği PagedAttention, işletim sistemlerindeki **sanal bellek ve paging** mantığını GPU'ya taşıyor. Bana bu fikir çok zarif geldi, çünkü sorunu yeniden icat etmek yerine onlarca yıllık bir çözümü yerine oturtuyor.

Çalışma mantığı:

1. VRAM, her biri sabit sayıda token tutan küçük **bloklara (pages)** bölünüyor. Örneğin bir blok 16 token.
2. Her istek için bir **Block Table** tutuluyor. Bu tablo, isteğin mantıksal bloklarını fiziksel bloklara eşliyor. Tıpkı işletim sisteminin sayfa tablosu gibi.
3. Kullanıcı konuştukça, sadece ihtiyaç duyduğu kadar blok, ihtiyaç duyduğu anda tahsis ediliyor. Bu blokların fiziksel bellekte yan yana durması gerekmiyor.

Artık "belki 2048 token olur" diye baştan yer ayırmak yok. 50 token'lık bir cevap yaklaşık 4 blok tutuyor ve işi bitince bu bloklar hemen havuza dönüyor. Parçalanma neredeyse sıfıra iniyor. Pratikte bu, aynı GPU'ya 4-8 kullanıcı yerine 20-30 kullanıcı sığdırmak, yani kabaca **3-4 kat throughput artışı** demek. Donanımı değiştirmeden, sadece belleği akıllıca yöneterek.

## Bonus: Prefix Caching ve Copy-on-Write

Üçüncü problem, yani ortak kısımlar, PagedAttention'ın en sevdiğim yan etkisiyle çözülüyor.

Bir müşteri destek botu ya da bir şirketin dokümanlarını sorgulayan bir RAG sistemi düşünün. Her kullanıcının isteği aynı 2000 token'lık sistem prompt'u veya aynı dokümanla başlıyor.

- **Eski yaklaşım:** Her kullanıcı için bu 2000 token'ın KV Cache'i VRAM'de ayrı ayrı tutuluyor. 10 kullanıcı için 20.000 token'lık bellek, aslında aynı şeyin 10 kopyası.
- **PagedAttention ile:** Block Table sayesinde bu ortak bloklar VRAM'de **yalnızca bir kez** duruyor. 100 kullanıcı gelse de hepsinin tablosu aynı fiziksel bloklara işaret ediyor.
- Bir kullanıcı kendi özel cevabını üretmeye başladığında, sadece ona ait yeni bir blok ayrılıyor. Paylaşılan bloklara dokunulmuyor. Buna **Copy-on-Write (CoW)** deniyor.

Bunun iki faydası var. Birincisi VRAM tüketimi dramatik biçimde düşüyor. İkincisi, ortak kısmın KV Cache'i zaten hesaplanmış olduğu için ilk token'a kadar geçen süre (**TTFT**) kısalıyor, çünkü o 2000 token'ı her istekte yeniden işlemiyoruz.

## Hepsini yan yana koyalım

| Teknik | Çözdüğü sorun | Nasıl çözüyor? | Kazanç |
| :--- | :--- | :--- | :--- |
| **Continuous Batching** | Farklı uzunluktaki isteklerin birbirini beklemesi | Token bazında dinamik planlama | GPU boşta beklemiyor |
| **PagedAttention** | VRAM parçalanması ve israfı | Blok tabanlı, ihtiyaç anında tahsis | Bellek israfı ciddi düşüyor, batch kapasitesi 3-4x artıyor |
| **Prefix Caching (CoW)** | Ortak prompt'ların tekrar tekrar hesaplanması | Aynı blokların istekler arasında paylaşılması | TTFT ve VRAM tüketimi düşüyor |

## Büyük resim: çıkarımı dört katmanda optimize ediyoruz

Bu konuyu çalışırken en çok işime yarayan şey, optimizasyonları katmanlara ayırmak oldu. Böylece hangi tekniğin hangi problemi çözdüğü kafamda netleşti:

1. **Donanım seviyesi:** Önce darboğazı anlıyoruz. Decode aşaması memory-bound. Hesaplama değil, bellek hareketi yavaşlatıyor.
2. **Mimari seviyesi (kayıplı):** Bellek trafiğini azaltmak için modelin kendisini küçültüyoruz. GQA, MLA, quantization (FP8, AWQ) ve pruning bu grupta. Hız kazanıyoruz ama biraz kalite riski alıyoruz.
3. **Algoritmik seviye (kayıpsız):** Çıktıyı değiştirmeden hızlanıyoruz. Speculative Decoding'de küçük bir taslak model birkaç token tahmin ediyor, büyük model hepsini tek seferde doğruluyor.
4. **Sistem seviyesi:** Canlı trafikte GPU'yu dolu tutuyoruz. Continuous Batching ve PagedAttention burada devreye giriyor.

Bu yazının konusu dördüncü katman. Ama bence en önemli çıkarım şu: modern çıkarım motorlarının hızı tek bir hileden gelmiyor. Bu katmanların hepsi birlikte çalışıyor. Kendi projelerimde bir modeli canlıya alırken artık ilk sorum "hangi model?" değil, "bu GPU'ya aynı anda kaç kullanıcı sığdırabilirim ve belleğim nerede boşa gidiyor?" oluyor.

Eğer LLM'leri servis etmeyi düşünüyorsanız, vLLM gibi bir motoru denemenizi öneririm. Yukarıdaki fikirlerin hepsi hazır geliyor ve nasıl çalıştığını anlayınca, çıkan sayılar artık sihir gibi görünmüyor.
