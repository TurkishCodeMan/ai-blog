"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Post } from "@/lib/posts";

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const router = useRouter();

  const fetchPosts = async (token: string) => {
    try {
      const res = await fetch("/api/posts", {
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("admin-token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchPosts(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleDelete = async (slug: string) => {
    if (!confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;
    const token = sessionStorage.getItem("admin-token") || "";
    await fetch(`/api/posts/${slug}`, {
      method: "DELETE",
      headers: { "x-admin-token": token },
    });
    fetchPosts(token);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title || !editingPost?.content) return;
    const token = sessionStorage.getItem("admin-token") || "";
    const method = editingPost.slug ? "PUT" : "POST";
    const url = editingPost.slug ? `/api/posts/${editingPost.slug}` : "/api/posts";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify(editingPost),
    });

    if (res.ok) {
      setEditingPost(null);
      fetchPosts(token);
    }
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
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
              <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>İçerik (Markdown)</label>
              <textarea
                value={editingPost.content || ""}
                onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "#fff", minHeight: 300, fontFamily: "monospace" }}
                required
              />
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

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {posts.map((post) => (
          <div key={post.slug} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
            <div>
              <h3 style={{ color: "#fff", fontSize: "1.1rem", marginBottom: "0.25rem" }}>{post.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{post.date} • {post.published ? "Yayınlandı" : "Taslak"}</p>
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
    </div>
  );
}
