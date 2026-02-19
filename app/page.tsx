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
      <div className="fade-up" style={{ marginBottom: "3.5rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          — Blog
        </p>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 2.75rem)",
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.03em",
            marginBottom: "0.85rem",
            lineHeight: 1.15,
          }}
        >
          {t("hero_greeting")}
        </h1>

        {/* Role badges */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {["AI Engineer", "Software Developer", "AI Researcher"].map((role) => (
            <span
              key={role}
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                border: "1px solid rgba(180,83,9,0.22)",
                color: "var(--accent)",
                backgroundColor: "var(--accent-tag)",
                letterSpacing: "0.03em",
              }}
            >
              {role}
            </span>
          ))}
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: 480, lineHeight: 1.7 }}>
          {t("hero_subtitle")}
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)", marginBottom: "2.5rem" }} />

      {/* Post list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: "1.4rem 1.6rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
              <div className="skeleton" style={{ height: 12, width: "30%", marginBottom: "0.75rem" }} />
              <div className="skeleton" style={{ height: 18, width: "75%", marginBottom: "0.5rem" }} />
              <div className="skeleton" style={{ height: 14, width: "90%", marginBottom: "0.3rem" }} />
              <div className="skeleton" style={{ height: 14, width: "60%" }} />
            </div>
          ))}
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
