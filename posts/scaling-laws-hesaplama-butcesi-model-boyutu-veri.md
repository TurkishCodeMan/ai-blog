---
title: "Scaling Laws: Elimde Belirli Bir Bütçe Varsa Model mi Büyütmeliyim, Veri mi?"
date: "2026-11-11"
excerpt: "Büyük eğitime para harcamadan önce hangi model boyutu ve token miktarının en iyi sonucu vereceğini küçük deneylerle nasıl tahmin ederiz? Power law, IsoFLOPs, Kaplan ve Chinchilla farkı, critical batch size ve μP üzerinden uzun bir yürüyüş."
tags: ["LLM", "Scaling Laws", "Chinchilla", "Training"]
published: true
---

# Scaling Laws: Elimde Belirli Bir Bütçe Varsa Model mi Büyütmeliyim, Veri mi?

Dağıtık eğitimi anlamaya çalıştığım dönemde aklıma hep aynı soru takılıyordu: Eğitim kodum çalışıyor, GPU'larım hazır, veri hazır. Peki ama **ne eğiteceğim?** Büyük bir modeli az veriyle mi, küçük bir modeli bol veriyle mi eğitmeliyim? Üstelik bunu, haftalarca sürecek asıl koşuya başlamadan, yani para ve zaman yakmadan nasıl tahmin edebilirim?

Bu yazı, o sorunun cevabını arayan notlarımın düzenlenmiş hali. Cevabın adı **scaling laws**, yani ölçekleme yasaları. Bu yazıda formülleri ezberletmeye değil, her birinin neden orada olduğunu ve nerede yanıltabileceğini anlatmaya çalışacağım. Bazı sayısal örnekleri konuyu öğretmek için kendim uydurdum; bunları "varsayımsal" diye işaretledim. Gerçek deney sonuçlarını ayrıca belirttim.

Matematiği sade tutmak için formülleri kod bloğu içinde, düz metinle yazıyorum.

## Karar anı: Bir aylık GPU süresi

Bir ekip sana GPU'larını bir aylığına verdi. Elinde şu üç seçenek var:

| Seçenek | Model | Eğitim |
|---|---|---|
| A | Küçük | Çok fazla token |
| B | Orta büyüklükte | Orta miktarda token |
| C | Büyük | Daha az token |

Üçü de aynı hesaplama bütçesini harcayabilir. İlk refleks "en büyük modeli seçelim" olur. Ama büyük model her token'ı işlerken daha çok hesaplama harcar. Yani aynı bütçeyle daha az token görür.

Diğer uçta, küçük modele muazzam miktarda veri gösterebilirsin. Fakat kapasitesi sınırlıysa, bir noktadan sonra ek veriden yeterince yararlanamaz.

**Scaling law, bu dengeyi küçük deneylerde ölçüp büyük eğitim için tahmin üretme girişimidir.**

"Yasa" kelimesine fazla kapılmamak lazım. Fizik yasası gibi koşulsuz bir gerçekten söz etmiyoruz. Belirli bir mimari, veri dağılımı ve eğitim düzeninde gözlemlenen düzenli bir ilişkiden söz ediyoruz. Koşullar değiştiğinde ilişki de değişebilir. Yazının ilerleyen bölümlerinde bunun bedelini ödeyen örnekleri göreceğiz.

## Neyi tahmin ediyoruz? Loss'u

Bir dil modeli, bir sonraki token için olasılık dağılımı üretir. Tek bir token için kayıp (loss) şudur:

```
loss = -log( p(doğru token) )
```

Model doğru token'a ne kadar yüksek olasılık verirse loss o kadar düşer:

| Doğru token'a verilen olasılık | Loss (doğal logaritma) |
|---:|---:|
| 0,10 | 2,303 |
| 0,50 | 0,693 |
| 0,90 | 0,105 |

Bir değerlendirme kümesindeki tüm token'ların loss'unu ortalarız. Scaling çalışmalarında sorulan soru şudur:

> Model boyutunu ya da eğitim verisini artırırsam, hiç görmediği metinlerdeki ortalama loss nasıl değişir?

Burada kritik bir ayrım var: Bu, "soruların yüzde kaçını doğru cevaplayacak?" sorusu değil. Loss olasılık tahminlerinin kalitesini ölçer. Belirli görevlerdeki başarıyla ilişkilidir ama onunla aynı şey değildir. Yazının sonlarında bu ayrımın neden önemli olduğuna geri döneceğim.

## Power law: Her iki kat veri, benzer oransal iyileşme

Veri miktarına D diyelim. En basit ölçekleme modeli şöyle:

```
L(D) = L_inf + A * D^(-alpha)
```

- **L_inf:** Bu model ailesiyle yaklaşılabilecek loss tabanı.
- **A:** Eğrinin seviyesini belirleyen katsayı.
- **alpha:** Veri arttıkça iyileşmenin ne kadar hızlı olduğunu söyleyen üs.

Tabanın üzerinde kalan kısım `A * D^(-alpha)`. Veriyi iki katına çıkarırsak bu kısım şu çarpanla küçülür:

```
L(2D) - L_inf = 2^(-alpha) * ( L(D) - L_inf )
```

Yani her iki kat veri, **tabanın üzerindeki loss'u aynı oranla azaltır**. İlk bakışta bu çok düzenli bir sonuç. Ama ikinci cümlesi daha önemli: Mutlak kazanç sabit kalmaz, giderek küçülür.

Bunu görmek için varsayımsal bir örnek kuralım. D'yi milyar token cinsinden ölçelim ve şu eğriyi alalım:

```
L(D) = 2 + D^(-0.25)
```

| Veri | Loss |
|---:|---:|
| 1 milyar token | 3,000 |
| 16 milyar token | 2,500 |
| 256 milyar token | 2,250 |

Veriyi 16 kat artırınca tabanın üzerindeki kısım yarıya iniyor, çünkü `16^(-0.25) = 1/2`. Ama toplam loss yarıya inmiyor, çünkü 2'lik taban hiç kıpırdamıyor. İlk 16 katlık artış bize 0,5 puan kazandırdı, sonraki 16 katlık artış sadece 0,25 puan. İşte **azalan getiri** bu.

### Log-log grafiğinde düz çizgi ne demek?

Makalelerde ve ders notlarında hep log-log grafikler görürüz. Mantığı basit. Eşitliğin iki tarafının logaritmasını alınca:

```
log( L - L_inf ) = log(A) - alpha * log(D)
```

Bu, bir doğru denklemi. Yatay eksen `log D`, dikey eksen `log(L - L_inf)`, eğim ise `-alpha`.

Burada sık yapılan bir yanlış okuma var: Grafikte düz çizgi görmek, "her ek token aynı kazancı sağlıyor" demek değildir. Düz çizgi, **veriyi aynı çarpanla artırmanın benzer oransal kazanç getirdiği** anlamına gelir. Eksenler logaritmik olduğu için, çizginin "dik" görünmesi gerçekte sürekli yavaşlayan bir iyileşmeyi saklar.

Ayrıca taban terimi ihmal edilebilecek kadar küçükse, doğrudan loss'un logaritması da yaklaşık doğrusal görünebilir. Bu yüzden grafiklerdeki düzlüğün hangi aralıkta ve hangi varsayımla geçerli olduğuna dikkat etmek gerekiyor.

## Bu ilişki neden ortaya çıkıyor?

Bir an için dil modellerinden uzaklaşıp çok basit bir istatistik problemine bakalım. Bir dağılımın gerçek ortalaması μ'yü bilmiyoruz, elimizde n bağımsız gözlem var ve ortalamayı şöyle tahmin ediyoruz:

```
mu_hat = (x_1 + ... + x_n) / n
```

Gözlemlerin varyansı σ² ise beklenen karesel hata:

```
E[(mu_hat - mu)^2] = sigma^2 / n
```

Yani hata n^(-1) ile azalıyor. Bu da bir scaling law. Örneğin σ² = 100 için:

| Gözlem sayısı | Beklenen karesel hata |
|---:|---:|
| 10 | 10 |
| 100 | 1 |
| 1.000 | 0,1 |

Ama dil modeli tek bir ortalama tahmin etmiyor. Milyonlarca farklı bağlamda farklı olasılık ilişkilerini öğreniyor. Veri arttıkça daha önce yeterince örneklenmemiş bağlamlarla karşılaşıyor.

Bunu bir kutu benzetmesiyle düşünebilirsin: Girdi uzayını küçük bölgelere ayırıp her bölge için ayrı bir tahmin yaptığını hayal et. Bölgeleri inceltirsen ayrıntıyı daha iyi yakalarsın (yaklaşım hatası düşer), ama her bölgeye düşen örnek sayısı azalır (tahmin belirsizliği artar). İki kuvvet birbirine karşı çekiyor ve sonuçta öğrenme hızı problemin boyutuna ve düzenliliğine bağlı bir üsle belirleniyor. Boyut ne kadar yüksekse ve problem ne kadar düzensizse, üs o kadar küçük olabilir. Yani veri artsa da iyileşme yavaş.

Buradan çıkarılacak dürüst ders şu: Bu sezgi, "karmaşık problemlerde ölçekleme üssü neden küçük çıkabilir?" sorusuna bir fikir veriyor. Ama bazı kaynaklarda göreceğin `n^(-1/d)` biçimindeki ifadeyi tüm sinir ağları için evrensel bir formül gibi almamak lazım. Gerçek hız; hata ölçütüne, düzgünlük varsayımlarına ve öğrenme yöntemine bağlı.

## Veri sadece miktar değil: Benzersizlik, kalite ve tekrar

Şimdi veri tarafını biraz kurcalayalım. İki farklı havuz düşün:

- 10 milyar token'lık, titizlikle seçilmiş bir havuz.
- 100 milyar token'lık, daha çeşitli ama ortalama kalitesi daha düşük bir havuz.

Küçük bir eğitim bütçesinde sadece en iyi 10 milyar token'ı kullanmak avantajlı olabilir. Ama bütçen büyüyüp 200 milyar token işlemek istediğinde, küçük havuzu 20 kez dolaşman gerekir. İşte bu noktada geniş havuzun çeşitliliği değer kazanmaya başlar.

Buradan şu ayrım çıkıyor:

```
D_islenen  !=  D_benzersiz
```

100 milyar benzersiz token'ı bir kez görmek ile 10 milyar token'ı on kez görmek, hesaplama maliyeti açısından benzer olabilir. Ama aynı miktarda yeni bilgi sunmazlar.

Tekrarlı veriyle eğitimi inceleyen çalışmalar bunu "etkin veri" fikriyle modelliyor:

```
D_eff = U + U * R* * ( 1 - exp(-r / R*) )
```

- **U:** Benzersiz token miktarı.
- **r:** İlk geçişten sonraki tekrar sayısı.
- **R\*:** Tekrarların faydasının ne hızla söndüğünü belirleyen, deneyden kestirilen sabit.

Formülün sezgisini iki uçta görmek kolay. Az tekrarda `1 - exp(-r/R*)` yaklaşık `r/R*` olur, dolayısıyla `D_eff ≈ U * (1 + r)`: yani ilk tekrarlar neredeyse taze veri kadar değerli. Çok fazla tekrarda ise `D_eff → U * (1 + R*)`: yani etkin veri bir tavana yaklaşıyor.

Bu tavan, **formülün öngördüğü** bir doygunluk. Tüm eğitim yöntemlerinin aşamayacağı doğa yasası değil. Ama pratik mesajı güçlü: İlk birkaç tekrar işe yarar, sonrası giderek boşa gider.

Bir başka pratik sonuç da veri filtreleme şiddeti. **En iyi filtreleme, eğitim ölçeğine bağlı olabilir.** Küçük bütçede çok seçici olmak faydalıyken, büyük bütçede çeşitliliği fazla daraltmak zarar verebilir. Benzer şekilde "veri karışımı sadece eğrinin seviyesini kaydırır, eğimini değiştirmez" gözlemi de belirli koşullarda yapılan deneylere ait. Her veri değişikliği için garanti değil.

## Model boyutunu da denkleme sokalım

Şimdiye kadar yalnızca veriyi değiştirdik. Ama küçük bir modelin kapasitesi de bir sınır. İkisini birlikte ele alan öğretici formül şu:

```
L(N, D) = E + A / N^alpha + B / D^beta
```

- **N:** Parametre sayısı.
- **D:** Eğitimde görülen token sayısı.
- **E:** Kestirilen loss tabanı.
- **A / N^alpha:** Sonlu model kapasitesiyle ilişkili terim.
- **B / D^beta:** Sonlu veri (ya da eğitim miktarı) ile ilişkili terim.

Bu, hatanın doğada gerçekten üç bağımsız parçaya ayrıldığının kanıtı değil. Deneyleri açıklamak için seçilmiş bir fonksiyon biçimi. Ama düşünmek için çok güçlü bir çerçeve.

İki senaryo düşünelim. Birincisinde:

```
A / N^alpha = 0,8     B / D^beta = 0,1
```

Veri terimini tamamen sıfırlasan bile yalnızca 0,1 kazanırsın. Asıl iyileşme alanı model boyutu tarafında. İkincisinde:

```
A / N^alpha = 0,1     B / D^beta = 0,8
```

Burada modeli büyütmek yerine daha fazla (ve uygun) veriyle eğitmek çok daha değerli.

Bence scaling law'ların asıl armağanı tam olarak bu: **"Büyük her zaman daha iyidir" cümlesini, "şu an hangi kaynak sınırlayıcı?" sorusuna çeviriyor.**

## Bütçe iki değişkeni birbirine bağlar: C ≈ 6ND

Yoğun (dense) bir Transformer eğitimi için yaygın yaklaşık hesap:

```
C ≈ 6 * N * D
```

- **C:** Eğitimin toplam FLOP miktarı.
- **N:** Parametre sayısı.
- **D:** İşlenen token sayısı.

Mantığı kabaca şöyle: İleri geçişte token başına yaklaşık 2N, geri geçişte yaklaşık 4N FLOP harcanır. Toplamı 6N.

Bu bir yaklaşıklık. Uzun bağlamda attention maliyeti, vocabulary işlemleri, aktivasyonların yeniden hesaplanması ve mimari ayrıntılar sonucu değiştirebilir. Mixture-of-Experts modellerde toplam parametre sayısını doğrudan bu formüle koymak da uygun değil, çünkü token başına yalnızca bir kısım parametre aktif.

Yine de temel dengeyi çok iyi gösteriyor:

```
D ≈ C / (6 * N)
```

**Bütçe sabitse model büyüdükçe görebileceği token sayısı küçülür.** Varsayımsal bir bütçeyle somutlaştıralım. `C = 6 x 10^19 FLOP` olsun:

| Parametre sayısı | Aynı bütçeyle işlenebilen token |
|---:|---:|
| 100 milyon | 100 milyar |
| 300 milyon | 33,3 milyar |
| 1 milyar | 10 milyar |
| 3 milyar | 3,33 milyar |

Bu tabloya bakarak hangi satırın kazanacağını söyleyemeyiz. Ama artık adil karşılaştırılabilir deneyler tasarlayabiliriz.

Bir de şunu unutmamak lazım: **Eşit FLOP, eşit süre demek değildir.** GPU kullanım oranı, iletişim ve matris boyutları gerçek çalışma süresini belirler. Dağıtık eğitim üzerine yazdığım yazıda bu konuya ayrıca değindim.

## IsoFLOPs: Aynı bütçeyle yarışan modeller

"Iso" eşit demek. IsoFLOPs deneyinde her aday model aynı hesaplama bütçesini tüketir. Bir önceki tablodaki dört modeli belirtilen token miktarlarıyla eğittiğimizi düşün. Tamamen varsayımsal sonuçlar:

| Model | Token | Validation loss |
|---|---:|---:|
| 100M | 100B | 3,10 |
| 300M | 33,3B | 2,75 |
| 1B | 10B | 2,65 |
| 3B | 3,33B | 2,90 |

En büyük model kazanmadı, çünkü aynı bütçe ona yeterince uzun eğitim sağlayamadı. En küçük model de kazanmadı, çünkü bol veriye rağmen kapasitesi sınırlayıcı kaldı. Model boyutuna karşı loss'u çizince bir **vadi** görürüz. Vadinin dibi, o bütçe için en iyi model-veri dengesidir.

Bunu farklı bütçelerde (C1, C2, C3 ...) tekrarlayıp her biri için en iyi model boyutunu (N*(C1), N*(C2), ...) bulursun. Bu noktalar düzgün bir eğri oluşturuyorsa, çok daha büyük bir bütçedeki optimumu tahmin edebilirsin.

Yaptığımız şey aslında basit bir mühendislik deneyi: **Bütçeyi sabit tut, bir tasarım değişkenini değiştir, sonucu ölç.**

## Kaplan ile Chinchilla neden farklı şeyler söyledi?

Kaplan ve arkadaşlarının ünlü çalışmasında optimum ölçekleme yaklaşık şöyleydi:

```
N_opt ∝ C^0,73
D_opt ∝ C^0,27
```

Yani bütçe büyüdüğünde artışın büyük kısmını model boyutuna ayırmayı öneriyordu. Chinchilla'nın baskın sonucu ise yaklaşık:

```
N_opt ∝ C^0,5
D_opt ∝ C^0,5
```

Yani model boyutunu ve token miktarını benzer oranlarda büyüt. Bütçe 100 kat büyüdüğünde fark çok çarpıcı:

| Yaklaşım | Model boyutundaki artış | Token miktarındaki artış |
|---|---:|---:|
| Kaplan | 100^0,73 ≈ 28,8 kat | 100^0,27 ≈ 3,47 kat |
| Chinchilla (yaklaşık) | 10 kat | 10 kat |

İkisi de aynı 100 kat hesaplamayı kullanıyor ama kaynakları çok farklı dağıtıyor.

Gerçek deneyde Chinchilla **70 milyar parametre ve 1,4 trilyon token** ile eğitildi. Karşılaştırdığı Gopher ise **280 milyar parametre ve yaklaşık 300 milyar token** kullanmıştı. Benzer eğitim bütçesinde Chinchilla çoğu değerlendirmede daha iyi çıktı. Bu sonuca ulaşmak için 400'den fazla küçük ve orta ölçekli model eğitildi. Önemli olan yalnızca "küçük model kazandı" değil. Asıl mesaj şu: **Büyük modele ayrılan kaynağın bir kısmını daha uzun eğitime kaydırmanın ölçülebilir bir faydası var.**

Peki Kaplan ve Chinchilla neden farklı sonuçlara vardı? Sonraki incelemeler bunu birkaç etkene bağladı: son katmanın hesaplama maliyetinin nasıl sayıldığı, küçük deneylerdeki warmup süresi, ölçeğe uygun optimizer ayarları gibi. Bu bana güçlü bir ders verdi: **Küçük deneylerdeki sistematik bir hata, büyük modele yaptığın tahminde büyük bir kaynak dağıtım hatasına dönüşebilir.**

## Optimumu matematikten de çıkarabiliriz

Şu iki ilişkiyi birlikte kullanalım:

```
L(N, D) = E + A * N^(-alpha) + B * D^(-beta)
D = C / (6 * N)
```

İkincisini birincinin içine koyarsak, tek değişkenli bir fonksiyon elde ederiz:

```
L(N) = E + A * N^(-alpha) + B * (6N / C)^beta
```

Model büyüdükçe iki şey aynı anda oluyor: İkinci terim azalıyor (kapasite artıyor), üçüncü terim artıyor (aynı bütçeyle daha az token işleniyor). İkisinin dengesi minimumu verir. Türevi alıp sıfıra eşitlediğimizde şu sonuca varıyoruz:

```
N_opt ∝ C^( beta / (alpha + beta) )
D_opt ∝ C^( alpha / (alpha + beta) )
```

Eğer alpha ≈ beta ise iki üs de yaklaşık 1/2 çıkar. Yani bütçeyi 4 kat artırmak, optimumda yaklaşık 2 kat büyük model ve 2 kat fazla token demek.

Burada bir uyarı: **1/2 üsleri tek başına "parametre başına 20 token" sonucunu vermez.** O oranın değeri katsayılara ve deney koşullarına da bağlı. "Parametre başına yaklaşık 20 token", Chinchilla'dan çıkan kullanışlı bir başlangıç sezgisi, ama modellerin durması gereken evrensel bir eşik değil.

## Chinchilla'nın üç yöntemi ve bir güvenilirlik dersi

Chinchilla optimumu üç ayrı yolla tahmin etmeye çalıştı:

**1. Eğitim eğrilerinin alt zarfı (envelope).** Farklı boyutlarda modelleri farklı sürelerde eğitirsin. Her hesaplama seviyesinde en düşük loss'a ulaşan koşuyu seçersin. Bu en iyi noktalar bir zarf eğrisi oluşturur.

**2. IsoFLOPs.** Yukarıda anlattığım yöntem: Bir bütçe seç, model boyutlarını yarıştır, vadinin dibini bul.

**3. Ortak fonksiyon uydurma.** Çok sayıda (N, D, L) ölçümünden `L = E + A/N^alpha + B/D^beta` fonksiyonunun katsayılarını kestirirsin ve optimumu bu fonksiyon üzerinde hesaplarsın.

Üçüncü yöntem çok güçlü ama aynı zamanda en kırılgan olanı: Yanlış fonksiyon biçimine, ölçüm gürültüsüne ve katsayıların birbirini telafi etmesine duyarlı. Nitekim sonradan yapılan bir yeniden inceleme, üçüncü yöntemin raporlanan uyumunu ve güven aralıklarını eleştirdi. Grafiklerden yeniden oluşturulan verilerle yapılan kestirim, ilk iki yöntemle daha tutarlı çıktı. Bu, Chinchilla'nın tüm sonucunun yanlış olduğu anlamına gelmiyor. Ama bir şeyi net gösteriyor:

**Bir eğriyi geçmiş deneylere iyi uydurmak ile yeni bir ölçekte doğru tahmin yapmak aynı başarı değildir.**

Bu yüzden kendi çalışmamda deneyleri ikiye ayırıyorum: Bir kısmı fonksiyonu kurmak için, bir kısmı (özellikle en büyükleri) o fonksiyonun tahminini sınamak için.

## Mimari kararlarında scaling law

Scaling law'lar sadece "kaç parametre?" sorusu için değil. Şunlar için de kullanılıyor: Transformer mı başka bir mimari mi? Derin mi geniş mi? Hangi optimizer? Hangi learning rate? Parametreleri hangi bileşenlere harcamalı?

Diyelim A ve B mimarilerini sadece 100M ölçekte karşılaştırdın ve A daha iyi çıktı. Buradan "A her ölçekte daha iyi" sonucu çıkmaz. B'nin ölçekleme eğimi daha avantajlı olabilir. Varsayımsal sonuçlar:

| Model boyutu | Mimari A loss | Mimari B loss |
|---:|---:|---:|
| 100M | 3,00 | 3,10 |
| 300M | 2,90 | 2,85 |
| 1B | 2,82 | 2,60 |

Küçük ölçekte kaybeden B, büyüdükçe kazanıyor. Bu yüzden mimari kıyaslarını tek bir noktada değil, birkaç ölçekte yapmak gerekiyor. Transformer ile LSTM'in karşılaştırıldığı klasik deneyler de bu mantıkla yapıldı: Tek büyük deney yerine farklı ölçeklerdeki davranıştan hangisinin daha iyi büyüdüğünü okumak.

Adil karşılaştırma için sadece parametre sayısı yetmez. Veri, eğitim bütçesi, optimizer ayarları ve gerçek çalışma süresi de eşleştirilmeli.

Derinlik ve genişlik için de aynı mantık geçerli. Belirli bir parametre bütçesinde birçok model şekli yakın loss verebilir. O zaman daha hızlı çalışan, belleğe daha iyi oturan ve daha kararlı eğitilen şekil kazanır. İşte donanım bilgisiyle ölçekleme bilgisi burada birleşiyor:

> İstatistiksel olarak benzer iki mimariden, donanımda daha verimli çalışanı aynı sürede daha fazla eğitim yapabilir.

Ayrıca tüm parametreler aynı rolü oynamaz. Vocabulary embedding tablosuna eklenen parametrelerle yeni bir Transformer katmanına eklenen parametrelerin katkısı aynı değildir. MoE'de toplam ve aktif parametre sayısı farklıdır. Yani "modelim 2B oldu" tek başına yeterli bir mimari açıklaması değil. **Bu 2B'nin nerede durduğunu ve hangi hesaplamaya katıldığını bilmek gerekiyor.**

## Learning rate küçük modelden büyüğe neden doğrudan taşınmıyor?

Bir katmanı genişlettiğinde, aktivasyonların ve ağırlık güncellemelerinin ölçekleri değişir. Bir nöronun çıktısını düşün:

```
z = w_1 * x_1 + w_2 * x_2 + ... + w_h * x_h
```

Genişlik h arttıkça bu toplamın istatistikleri de değişir. Başlatma ve güncelleme ölçekleri buna göre ayarlanmazsa, küçük modelde mükemmel çalışan bir learning rate, büyük modelde fazla büyük ya da fazla küçük kalabilir.

**μP (maximal update parametrization)** bu sorunu hedefleyen bir yaklaşım: Model genişliği değişirken eğitim dinamiklerini tutarlı tutacak şekilde başlatma, parametre türü ve çıktı ölçeklemesini birlikte düzenliyor. Amaç, küçük modellerde ayarlanan hiperparametrelerin daha büyük modellere aktarılabilmesi.

Bunu "tüm learning rate'leri aynı katsayıyla çarp" diye düşünmemek lazım. Parametre türleri farklı davranıyor. Standart düzende model genişledikçe en iyi learning rate'in yeri kayabiliyor, uygun bir parametreleştirmeyle bu kayma azaltılabiliyor.

Bunun bir çıkarımı da şu: **Kötü ayarlanmış bir learning rate yüzünden büyüyen modelin başarısız olması, o mimarinin ölçeklenemediğini kanıtlamaz.**

## Critical batch size: Daha büyük batch ne zaman boşa gider?

Küçük batch'in gradyanı gürültülüdür. Daha çok örneğin gradyanını ortalamak daha güvenilir bir yön verir. Ama bir noktadan sonra yön zaten yeterince nettir. Batch'i büyütmek, her optimizer adımını aynı oranda daha faydalı yapmaz.

Bunu ölçmenin yolu şu: Bir hedef loss seç, farklı batch boyutlarıyla o hedefe ulaş, kaç optimizer adımı ve toplam kaç örnek gerektiğini ölç. Basit ampirik model:

```
S(B) ≈ S_min + E_min / B
E(B) = B * S(B) ≈ B * S_min + E_min
```

- **B:** Batch boyutu.
- **S(B):** Hedefe ulaşmak için gereken adım sayısı.
- **S_min:** Çok büyük batch'te ulaşılan yaklaşık adım sınırı.
- **E_min:** Küçük batch'te ulaşılan yaklaşık toplam örnek sınırı.

İki rejimin kesiştiği nokta kritik batch boyutudur:

```
B_crit = E_min / S_min
```

Öğretici bir örnek: `S_min = 1000`, `E_min = 1.000.000`, dolayısıyla `B_crit = 1000`.

| Batch | Hedefe kadar adım | İşlenen toplam örnek |
|---:|---:|---:|
| 100 | 11.000 | 1,1 milyon |
| 1.000 | 2.000 | 2 milyon |
| 10.000 | 1.100 | 11 milyon |

Batch'i 1.000'den 10.000'e çıkardık. Adım sayısı yaklaşık yarıya indi ama işlenen örnek sayısı 5,5 katına çıktı. Çok fazla paralel donanımın varsa duvar saati açısından yine yararlı olabilir, ama hesaplama verimliliği düşüyor.

Çalışmalar, gradyan gürültü ölçeğinin faydalı batch büyüklüğünü öngörmekte kullanılabildiğini ve eğitim ilerleyip loss azaldıkça bu ölçeğin büyüyebildiğini gösteriyor. Yani iyi bir batch boyutu sadece GPU belleğine bağlı değil, **öğrenmenin hangi aşamada olduğuna da bağlı.**

## Eğitim için optimum olan, kullanım için optimum olmayabilir

Chinchilla'nın temel sorusu şuydu: "Sabit eğitim hesaplamasıyla en iyi loss'u nasıl elde ederim?" Ama modelini milyonlarca kez çalıştıracaksan başka bir maliyet daha var:

```
Toplam maliyet = Eğitim maliyeti + Kullanım maliyeti
```

Varsayımsal bir örnek:

| Model | Eğitim maliyeti | İstek başına kullanım maliyeti |
|---|---:|---:|
| Büyük model | 100 birim | 0,010 birim |
| Küçük, daha uzun eğitilmiş model | 150 birim | 0,004 birim |

Küçük modelin fazladan eğitim maliyeti 50 birim. İstek başına tasarruf `0,010 - 0,004 = 0,006`. Başabaş noktası `50 / 0,006 ≈ 8.333` istek. Kalite gereksinimi karşılanıyorsa bu sayının ötesinde küçük model toplamda daha ekonomik.

Bu yüzden pratikte birçok model, yalnızca eğitim hesabına göre optimum olan token/parametre oranının çok ötesinde eğitiliyor. Buradaki "overtrain" kelimesini overfitting ile karıştırma. Kastedilen, eğitim bütçesi açısından önerilen dengeden daha uzun eğitmek. Validation performansı mutlaka bozulmuyor. Çok kullanılacak bir model için önceden fazladan eğitim harcamak çoğu zaman mantıklı.

## Pretraining loss ile hedef görev aynı şey değil

Şimdi dediğim yere geri dönelim: Scaling law'lar çoğunlukla loss'u tahmin eder. Düzgün iyileşen bir pretraining loss, her downstream görevde aynı düzenlilikte kazanca dönüşmez. Bazı görevler bir eşikte aniden "açılır", bazıları loss düşse bile uzun süre kıpırdamaz.

Bu yüzden **scaling law tahmini büyük deneyi planlamanın aracıdır, hedef görevin ölçümünün yerine geçmez.**

## Bunu kendi deneyimde nasıl uygularsın?

Yöntemi küçük ve somut bir araştırma planına çevirelim.

**1. Hedefi tanımla.** Validation loss mu, belirli bir görev başarısı mı, yoksa belirli bir gecikme sınırında en iyi kalite mi? Optimum hedefe göre değişir.

**2. Aynı model ailesinde birkaç ölçek kur.** Örneğin 100M, 300M ve 1B. Tokenizer'ı ve değerlendirme dağılımını sabit tut. Tokenizer değişirse token başına loss'un ve token bütçesinin anlamı da değişir.

**3. Birkaç bütçede IsoFLOPs deneyi yap.** Her modelin eğitim süresine uygun bir learning rate düzeni kullan. Sadece son loss'u değil, işlenen token'ı, tahmini FLOP'u ve gerçek süreyi de kaydet.

**4. Bütçe başına en iyi modelleri seçip eğriyi kestir.** En büyük deneylerin bir kısmını kestirime katma. Onları "küçükten büyüğe tahminim gerçekten çalışıyor mu?" sorusunu sınamak için sakla.

**5. Mimari bileşen eklediysen karşılaştırmayı dikkatle kur:**

| Soru | Deneyde bakılacak şey |
|---|---|
| Aynı bütçede iyileştiriyor mu? | Loss veya görev metriği |
| Ek parametre sayesinde mi kazanıyor? | Parametre açısından eşleştirilmiş karşılaştırma |
| Daha pahalı olduğu için mi kazanıyor? | FLOP ve süre açısından eşleştirilmiş karşılaştırma |
| Küçük ölçekteki kazanç büyüğe taşınıyor mu? | Birden fazla model boyutu |
| Genel dil modellemesi iyileşirken hedef görev geriliyor mu? | Ayrı downstream değerlendirmesi |

## Kendimi sınadığım soru

> Hesaplama bütçem dört katına çıktı. Modeli dört kat büyütüp aynı token sayısında mı eğitmeliyim?

Chinchilla benzeri yaklaşık eşit üsler geçerliyse başlangıç tahmini şu: **Modeli iki kat büyüt, token miktarını iki kat artır.** Çünkü 2 x 2 = 4. Ama veri tekrarı, mimari değişikliği, donanım verimliliği ya da yoğun kullanım maliyeti devreye girdiğinde bu cevap değişebilir.

Bence scaling law'ların en değerli yanı kesin cevap vermesi değil. Hangi koşulu ölçmen gerektiğini bilmeni sağlaması. Eskiden "bir model seçip eğitelim, bakalım ne olacak" derdim. Şimdi önce küçük, ucuz ve tahmin üreten deneyler kuruyorum, ancak ondan sonra büyük eğitime karar veriyorum.
