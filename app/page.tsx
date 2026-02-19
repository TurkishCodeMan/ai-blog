"use client";
import { useEffect, useState } from "react";
import { getAllPosts, Post } from "../lib/posts";
import PostCard from "../components/PostCard";
import { useLocale } from "../lib/locale-context";

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    getAllPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

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
          {t("hero_greeting")}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 520 }}>
          {t("hero_subtitle")}
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)", marginBottom: "2.5rem" }} />

      {/* Post list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
          {t("loading")}
        </div>
      ) : posts.length === 0 ? (
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
          <p>{t("no_posts")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {posts.map((post, i) => (
            <div key={post.slug} className={`fade-up fade-up-delay-${Math.min(i + 1, 3)}`}>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
