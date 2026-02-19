"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Post } from "@/lib/posts";

const STORAGE_KEY = "admin-posts";
const ADMIN_PASSWORD = "admin123";

function loadLocalPosts(): Post[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLocalPosts(posts: Post[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

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
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("admin-token");
    if (!token || token !== ADMIN_PASSWORD) {
      router.push("/admin/login");
      return;
    }
    setAuthenticated(true);
    setPosts(loadLocalPosts());
  }, [router]);

  const handleDelete = (slug: string) => {
    if (!confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;
    const updated = posts.filter((p) => p.slug !== slug);
    setPosts(updated);
    saveLocalPosts(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title || !editingPost?.content) return;

    const isNew = !editingPost.slug;
    const slug = isNew ? slugify(editingPost.title!) : editingPost.slug!;
    const now = new Date().toISOString().split("T")[0];

    const post: Post = {
      slug,
      title: editingPost.title!,
      date: editingPost.date || now,
      excerpt: editingPost.excerpt || "",
      content: editingPost.content!,
      tags: editingPost.tags || [],
      published: editingPost.published ?? true,
    };

    const updated = isNew
      ? [post, ...posts]
      : posts.map((p) => (p.slug === slug ? post : p));

    setPosts(updated);
    saveLocalPosts(updated);
    setEditingPost(null);
  };

  const handleExport = (post: Post) => {
    const json = JSON.stringify(post, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${post.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const json = JSON.stringify(posts, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "posts-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authenticated) return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>Admin Paneli</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleExportAll}
            style={{ padding: "0.6rem 1.25rem", borderRadius: 8, backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", fontWeight: 600, cursor: "pointer" }}
          >
            ↓ Tümünü İndir
          </button>
          <button
            onClick={() => setEditingPost({ title: "", content: "", excerpt: "", tags: [], published: true })}
            style={{ padding: "0.6rem 1.25rem", borderRadius: 8, backgroundColor: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            + Yeni Yazı
          </button>
        </div>
      </div>

      <div style={{ padding: "0.75rem 1rem", borderRadius: 8, backgroundColor: "rgba(255,200,0,0.08)", border: "1px solid rgba(255,200,0,0.2)", marginBottom: "2rem", color: "#ffd666", fontSize: "0.85rem" }}>
        ℹ️ Bu panel tarayıcı localStorage'ında çalışır. Yazılarınızı JSON olarak indirip <code>content/posts/</code> klasörüne ekleyip push etmeniz gerekir.
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
                style={{ padding: "0.75rem 1.5rem", borderRadius: 8, backgroundColor: "var(--success)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                Kaydet
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

      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 12 }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</p>
          <p>Henüz yazı eklemediniz. "Yeni Yazı" ile başlayın!</p>
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
                  onClick={() => handleExport(post)}
                  title="JSON olarak indir"
                  style={{ padding: "0.5rem 1rem", borderRadius: 6, border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  ↓ JSON
                </button>
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
