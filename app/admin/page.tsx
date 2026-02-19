"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Post, getAllPostsAdmin, savePost, deletePost } from "@/lib/posts";

const ADMIN_PASSWORD = "admin123";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getAllPostsAdmin();
      setPosts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("admin-token");
    if (!token || token !== ADMIN_PASSWORD) {
      router.push("/admin/login");
      return;
    }
    setAuthenticated(true);
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (slug: string) => {
    if (!confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;
    await deletePost(slug);
    fetchPosts();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title || !editingPost?.content) return;
    setSaving(true);
    try {
      const isNew = !editingPost.slug;
      const slug = isNew ? slugify(editingPost.title!) : editingPost.slug!;
      const post: Post = {
        slug,
        title: editingPost.title!,
        date: editingPost.date || new Date().toISOString().split("T")[0],
        excerpt: editingPost.excerpt || "",
        content: editingPost.content!,
        tags: editingPost.tags || [],
        published: editingPost.published ?? true,
      };
      await savePost(post);
      setEditingPost(null);
      fetchPosts();
    } finally {
      setSaving(false);
    }
  };

  if (!authenticated) return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>Admin Paneli</h1>
        <button
          onClick={() => setEditingPost({ title: "", content: "", excerpt: "", tags: [], published: true })}
          style={{ padding: "0.6rem 1.25rem", borderRadius: 8, backgroundColor: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
        >
          + Yeni Yazı
        </button>
      </div>

      {editingPost && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "2rem", marginBottom: "3rem", backgroundColor: "var(--bg-card)" }}>
          <h2 style={{ color: "#fff", marginBottom: "1.5rem" }}>{editingPost.slug ? "Yazıyı Düzenle" : "Yeni Yazı"}</h2>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Başlık</label>
              <input
                value={editingPost.title || ""}
                onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "#fff" }}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Özet</label>
              <textarea
                value={editingPost.excerpt || ""}
                onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "#fff", minHeight: 80 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Tags (virgülle ayır)</label>
              <input
                value={(editingPost.tags || []).join(", ")}
                onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "#fff" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>İçerik (Markdown)</label>
              <textarea
                value={editingPost.content || ""}
                onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "#fff", minHeight: 300, fontFamily: "monospace" }}
                required
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="published"
                checked={editingPost.published ?? true}
                onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked })}
              />
              <label htmlFor="published" style={{ color: "var(--text-muted)" }}>Yayınlandı</label>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: "0.75rem 1.5rem", borderRadius: 8, backgroundColor: "var(--success)", color: "#fff", border: "none", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                style={{ padding: "0.75rem 1.5rem", borderRadius: 8, backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", fontWeight: 600, cursor: "pointer" }}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Yazılar yükleniyor...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 12 }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</p>
          <p>Henüz yazı yok. &quot;Yeni Yazı&quot; ile başlayın!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {posts.map((post) => (
            <div key={post.slug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
              <div>
                <h3 style={{ color: "#fff", fontSize: "1.1rem", marginBottom: "0.25rem" }}>{post.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{post.date} • {post.published ? "✅ Yayınlandı" : "🔒 Taslak"}</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => setEditingPost(post)}
                  style={{ padding: "0.5rem 1rem", borderRadius: 6, border: "1px solid var(--border)", color: "#fff", cursor: "pointer" }}
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(post.slug)}
                  style={{ padding: "0.5rem 1rem", borderRadius: 6, border: "1px solid var(--border)", color: "var(--danger)", cursor: "pointer" }}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
