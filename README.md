# Kişisel Blog — GitHub Pages Deployment Guide

Bu proje Next.js ile geliştirilmiştir ve GitHub Pages'e statik site olarak yüklenebilir.

## Yerel Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Admin paneli şifresi `.env.local` dosyasındaki `ADMIN_PASSWORD` değişkenidir. Varsayılan: `admin123`

## GitHub Pages'e Yükleme

1. **GitHub'da bir repo oluşturun** (örneğin: `portfolio`).
2. **`next.config.ts` dosyasını güncelleyin**:
   - `output: "export"` satırının yorumunu kaldırın.
   - Eğer reponuzun adı `huseyin.github.io` değilse (yani alt klasörde çalışacaksa), `basePath: "/portfolio"` satırının yorumunu kaldırın (`/portfolio` kısmını kendi repo adınızla değiştirin).
3. **Kodu GitHub'a push edin**:
   ```bash
   git init
   git add .
   git commit -m "ilk blog sürümü"
   git remote add origin https://github.com/huseyin/portfolio.git
   git push -u origin main
   ```
4. **GitHub Actions Kurulumu**:
   - `Settings > Pages` kısmına gidin.
   - `Build and deployment > Source` kısmını `GitHub Actions` olarak seçin.
   - Proje içindeki `.github/workflows/deploy.yml` dosyası otomatik olarak build alıp deploy edecektir.

## Admin Paneli Nasıl Çalışır?

GitHub Pages statik bir sunucu olduğu için, admin paneli sadece **yerel ortamda (localhost)** çalışır.
1. Bilgisayarınızda `npm run dev` ile siteyi açın.
2. `/admin` kısmından yeni yazı ekleyin veya düzenleyin.
3. Yazılar `content/posts/` klasörüne kaydedilecektir.
4. Yeni yazıları push ettiğinizde site güncellenecektir.
