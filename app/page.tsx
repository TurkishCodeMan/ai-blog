import { getAllPosts } from "../lib/posts";
import PostCard from "../components/PostCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Düşünceler, teknoloji ve deneyimler",
};

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Hero */}
      <div className="fade-up" style={{ marginBottom: "3rem" }}>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.03em",
            marginBottom: "1rem",
            lineHeight: 1.15,
          }}
        >
          Merhaba ✦
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 520 }}>
          Burada teknoloji, yazılım ve düşüncelerimi yazıyorum. Sade, dürüst, doğrudan.
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)", marginBottom: "2.5rem" }} />

      {/* Post list */}
      {posts.length === 0 ? (
        <div
          className="fade-up"
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "var(--text-muted)",
            border: "1px dashed var(--border)",
            borderRadius: 12,
          }}
        >
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</p>
          <p>Henüz yayınlanmış bir yazı yok.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {posts.map((post, i) => (
            <div
              key={post.slug}
              className={`fade-up fade-up-delay-${Math.min(i + 1, 3)}`}
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
