"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Post, getAllPostsAdmin, savePost, deletePost } from "@/lib/posts";

const ADMIN_PASSWORD = "admin123";

const inputStyle: React.CSSProperties = {
  padding: "0.7rem 0.9rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  backgroundColor: "var(--bg)",
  color: "var(--text)",
  fontSize: "0.9rem",
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

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
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            Admin Paneli
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Yazılar
          </h1>
        </div>
        <button
          onClick={() => setEditingPost({ title: "", content: "", excerpt: "", tags: [], published: true })}
          style={{
            padding: "0.6rem 1.2rem",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--accent)",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Yeni Yazı
        </button>
      </div>

      {/* Edit form */}
      {editingPost && (
        <div style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "2rem",
          marginBottom: "3rem",
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--shadow-md)",
        }}>
          <h2 style={{ color: "var(--text)", marginBottom: "1.75rem", fontWeight: 700, fontSize: "1.15rem" }}>
            {editingPost.slug ? "Yazıyı Düzenle" : "Yeni Yazı"}
          </h2>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Başlık</label>
              <input value={editingPost.title || ""} onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} style={inputStyle} required />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Özet</label>
              <textarea value={editingPost.excerpt || ""} onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Etiketler (virgülle ayır)</label>
              <input value={(editingPost.tags || []).join(", ")} onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>İçerik (Markdown)</label>
              <textarea value={editingPost.content || ""} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} style={{ ...inputStyle, minHeight: 320, fontFamily: '"Fira Code", monospace', fontSize: "0.875rem", resize: "vertical" }} required />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <input type="checkbox" id="published" checked={editingPost.published ?? true} onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked })} style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }} />
              <label htmlFor="published" style={{ color: "var(--text-soft)", fontSize: "0.9rem", cursor: "pointer" }}>Yayınlandı</label>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
              <button type="submit" disabled={saving} style={{ padding: "0.65rem 1.5rem", borderRadius: "var(--radius-sm)", backgroundColor: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontSize: "0.875rem" }}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button type="button" onClick={() => setEditingPost(null)} style={{ padding: "0.65rem 1.25rem", borderRadius: "var(--radius-sm)", backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Post list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: "1.25rem 1.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
              <div className="skeleton" style={{ height: 14, width: "55%", marginBottom: "0.6rem" }} />
              <div className="skeleton" style={{ height: 11, width: "30%" }} />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "var(--radius)" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</p>
          <p style={{ fontSize: "0.95rem" }}>Henüz yazı yok. &quot;Yeni Yazı&quot; ile başlayın!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {posts.map((post) => (
            <div
              key={post.slug}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.1rem 1.4rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-card)",
                boxShadow: "var(--shadow-sm)",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ color: "var(--text)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {post.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  {post.date}
                  <span style={{
                    marginLeft: "0.6rem",
                    padding: "1px 7px",
                    borderRadius: 20,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    backgroundColor: post.published ? "rgba(21,128,61,0.1)" : "rgba(120,113,108,0.1)",
                    color: post.published ? "var(--success)" : "var(--text-muted)",
                    border: `1px solid ${post.published ? "rgba(21,128,61,0.2)" : "var(--border)"}`,
                  }}>
                    {post.published ? "Yayında" : "Taslak"}
                  </span>
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  onClick={() => setEditingPost(post)}
                  style={{ padding: "0.45rem 0.9rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--text-soft)", cursor: "pointer", fontSize: "0.825rem", fontWeight: 500 }}
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(post.slug)}
                  style={{ padding: "0.45rem 0.9rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(220,38,38,0.25)", backgroundColor: "rgba(220,38,38,0.06)", color: "var(--danger)", cursor: "pointer", fontSize: "0.825rem", fontWeight: 500 }}
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

