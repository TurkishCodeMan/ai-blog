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

## GitHub Pages'e Yükleme (Repo Adı: `ai-blog`)

1. **GitHub'da `ai-blog` adında bir repo oluşturun.**
2. **Kodu GitHub'a push edin**:
   ```bash
   git remote add origin https://github.com/TurkishCodeMan/ai-blog.git
   git branch -M main
   git push -u origin main
   ```
3. **GitHub Ayarları**:
   - `Settings > Pages` kısmına gidin.
   - **Build and deployment > Source** kısmından **GitHub Actions** seçeneğini seçin.
   - (Workflow dosyası `.github/workflows/deploy.yml` olduğu için otomatik algılanacaktır).

## Önemli: Localhost Adresi Değişti!

`next.config.ts` içinde `basePath: "/ai-blog"` ayarını açtığımız için, yerel geliştirme ortamında adresiniz değişti:

- **Eski:** `http://localhost:3000`
- **Yeni:** `http://localhost:3000/ai-blog`
- **Admin:** `http://localhost:3000/ai-blog/admin`

Eğer `/ai-blog` olmadan girmeye çalışırsanız **404 hatası** alırsınız.

## Admin Paneli Nasıl Çalışır?

GitHub Pages statik bir sunucu olduğu için, admin paneli sadece **yerel ortamda (localhost)** çalışır.
1. Bilgisayarınızda `npm run dev` ile siteyi açın.
2. `/admin` kısmından yeni yazı ekleyin veya düzenleyin.
3. Yazılar `content/posts/` klasörüne kaydedilecektir.
4. Yeni yazıları push ettiğinizde site güncellenecektir.
