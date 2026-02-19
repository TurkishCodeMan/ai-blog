export type Locale = "tr" | "en";

export const translations = {
  tr: {
    // Nav
    nav_blog: "Blog",
    nav_about: "Hakkımda",
    nav_admin: "Admin",

    // Home
    hero_greeting: "Merhaba ✦",
    hero_subtitle: "Burada teknoloji, yazılım ve düşüncelerimi yazıyorum. Sade, dürüst, doğrudan.",
    no_posts: "Henüz yayınlanmış bir yazı yok.",
    loading: "Yükleniyor...",
    read_more: "Okumaya devam et →",

    // Blog
    back: "← Geri dön",
    post_not_found: "Yazı bulunamadı.",
    go_home: "Ana sayfaya dön",

    // About
    about_title: "Hakkımda",
    about_subtitle: "Merhaba! Ben bu blogun yazarıyım.",
    about_body: "Teknoloji, yazılım ve insanlara dair düşüncelerimi bu blogda paylaşıyorum. Bazen teknik, bazen kişisel — ama her zaman dürüst ve doğrudan.",
    about_what_title: "Ne Yapıyorum?",
    about_what_1: "Yazılım geliştiriyorum",
    about_what_2: "Yapay zeka üzerine araştırmalar yapıyorum",
    about_what_3: "Düşüncelerimi yazıya döküyorum",
    about_contact_title: "İletişim",
    about_contact_body: "Benimle iletişime geçmek isterseniz GitHub üzerinden ulaşabilirsiniz.",

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
    nav_blog: "Blog",
    nav_about: "About",
    nav_admin: "Admin",

    // Home
    hero_greeting: "Hello ✦",
    hero_subtitle: "I write about technology, software and ideas. Simple, honest, direct.",
    no_posts: "No posts published yet.",
    loading: "Loading...",
    read_more: "Read more →",

    // Blog
    back: "← Go back",
    post_not_found: "Post not found.",
    go_home: "Go to homepage",

    // About
    about_title: "About Me",
    about_subtitle: "Hi! I'm the author of this blog.",
    about_body: "I share thoughts on technology, software and people here. Sometimes technical, sometimes personal — but always honest and direct.",
    about_what_title: "What I Do",
    about_what_1: "Build software",
    about_what_2: "Research artificial intelligence",
    about_what_3: "Write down my thoughts",
    about_contact_title: "Contact",
    about_contact_body: "Feel free to reach out via GitHub.",

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
