export type Locale = "tr" | "en";

export const translations = {
  tr: {
    // Nav
    nav_blog: "Yazılar",
    nav_about: "Hakkımda",
    nav_admin: "Paylaş",

    // Home
    hero_greeting: "Hüseyin Altıkulaç",
    hero_subtitle: "Yapay zeka mühendisliği, yazılım geliştirme ve araştırma üzerine yazıyorum.",
    no_posts: "Henüz yayınlanmış bir yazı yok.",
    loading: "Yükleniyor...",
    read_more: "Devamını oku →",

    // Blog
    back: "← Geri",
    post_not_found: "Yazı bulunamadı.",
    go_home: "Ana sayfaya dön",

    // About
    about_title: "Hüseyin Altıkulaç",
    about_role_1: "AI Engineer",
    about_role_2: "Software Developer",
    about_role_3: "AI Researcher",
    about_body: "Yapay zeka sistemleri geliştirme, büyük dil modelleri ve otonom ajan mimarileri üzerine çalışıyorum. Ürettiğim bilgiyi bu blogda paylaşıyorum.",
    about_interests_title: "Çalışma Alanları",
    about_interest_1: "Büyük Dil Modelleri (LLM) & Fine-Tuning",
    about_interest_2: "Otonom Ajan Sistemleri & Multi-Agent",
    about_interest_3: "RAG Mimarileri & Vektör Veritabanları",
    about_interest_4: "MLOps & Model Deployment",
    about_contact_title: "İletişim",
    about_contact_body: "GitHub üzerinden ulaşabilirsiniz.",

    // Admin
    admin_title: "Admin Paneli",
    admin_new_post: "+ Yeni Yazı",
    admin_save: "Kaydet",
    admin_saving: "Kaydediliyor...",
    admin_cancel: "İptal",
    admin_edit: "Düzenle",
    admin_delete: "Sil",
    admin_published: "✅ Yayınlandı",
    admin_draft: "🔒 Taslak",
    admin_empty: "Henüz yazı yok. \"Yeni Yazı\" ile başlayın!",
    admin_loading: "Yazılar yükleniyor...",
    label_title: "Başlık",
    label_excerpt: "Özet",
    label_tags: "Etiketler (virgülle ayır)",
    label_content: "İçerik (Markdown)",
    label_published: "Yayınlandı",
    edit_post: "Yazıyı Düzenle",
    new_post: "Yeni Yazı",

    // Footer
    footer_rights: "Tüm hakları saklıdır.",
  },
  en: {
    // Nav
    nav_blog: "Posts",
    nav_about: "About",
    nav_admin: "Publish",

    // Home
    hero_greeting: "Hüseyin Altıkulaç",
    hero_subtitle: "I write about AI engineering, software development and research.",
    no_posts: "No posts published yet.",
    loading: "Loading...",
    read_more: "Read more →",

    // Blog
    back: "← Back",
    post_not_found: "Post not found.",
    go_home: "Go to homepage",

    // About
    about_title: "Hüseyin Altıkulaç",
    about_role_1: "AI Engineer",
    about_role_2: "Software Developer",
    about_role_3: "AI Researcher",
    about_body: "I work on AI system development, large language models and autonomous agent architectures. I share what I build and learn on this blog.",
    about_interests_title: "Areas of Work",
    about_interest_1: "Large Language Models (LLMs) & Fine-Tuning",
    about_interest_2: "Autonomous Agent Systems & Multi-Agent",
    about_interest_3: "RAG Architectures & Vector Databases",
    about_interest_4: "MLOps & Model Deployment",
    about_contact_title: "Contact",
    about_contact_body: "You can reach me via GitHub.",

    // Admin
    admin_title: "Admin Panel",
    admin_new_post: "+ New Post",
    admin_save: "Save",
    admin_saving: "Saving...",
    admin_cancel: "Cancel",
    admin_edit: "Edit",
    admin_delete: "Delete",
    admin_published: "✅ Published",
    admin_draft: "🔒 Draft",
    admin_empty: "No posts yet. Start with \"New Post\"!",
    admin_loading: "Loading posts...",
    label_title: "Title",
    label_excerpt: "Excerpt",
    label_tags: "Tags (comma separated)",
    label_content: "Content (Markdown)",
    label_published: "Published",
    edit_post: "Edit Post",
    new_post: "New Post",

    // Footer
    footer_rights: "All rights reserved.",
  },
} as const;

export type TranslationKey = keyof typeof translations.tr;
