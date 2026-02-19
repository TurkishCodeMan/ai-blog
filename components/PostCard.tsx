"use client";
import Link from "next/link";
import { Post } from "@/lib/posts";

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <article
        style={{
          padding: "1.5rem",
          borderRadius: 12,
          border: "1px solid var(--border)",
          backgroundColor: "var(--bg-card)",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--accent)";
          el.style.backgroundColor = "var(--bg-card-hover)";
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--border)";
          el.style.backgroundColor = "var(--bg-card)";
          el.style.transform = "translateY(0)";
        }}
      >
        {/* Top row: date + tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.6rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            {new Date(post.date).toLocaleDateString("tr-TR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: 20,
                backgroundColor: "var(--accent-glow)",
                color: "var(--accent-light)",
                border: "1px solid rgba(124,106,247,0.3)",
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.15rem",
            marginBottom: "0.4rem",
            letterSpacing: "-0.01em",
          }}
        >
          {post.title}
        </h2>

        {/* Excerpt */}
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
          {post.excerpt}
        </p>

        {/* Read more */}
        <div
          style={{
            marginTop: "0.8rem",
            fontSize: "0.85rem",
            color: "var(--accent-light)",
            fontWeight: 500,
          }}
        >
          Okumaya devam et →
        </div>
      </article>
    </Link>
  );
}
