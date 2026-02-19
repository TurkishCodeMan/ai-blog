"use client";
import Link from "next/link";
import { Post } from "@/lib/posts";
import { useLocale } from "@/lib/locale-context";

export default function PostCard({ post }: { post: Post }) {
  const { t, locale } = useLocale();
  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";
  return (
    <Link
      href={`/blog?slug=${post.slug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <article
        style={{
          padding: "1.4rem 1.6rem",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          backgroundColor: "var(--bg-card)",
          transition: "all 0.2s ease",
          cursor: "pointer",
          boxShadow: "var(--shadow-sm)",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--accent)";
          el.style.boxShadow = "var(--shadow-md)";
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--border)";
          el.style.boxShadow = "var(--shadow-sm)";
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
            {new Date(post.date).toLocaleDateString(dateLocale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "0.7rem",
                padding: "2px 8px",
                borderRadius: 20,
                backgroundColor: "var(--accent-tag)",
                color: "var(--accent)",
                border: "1px solid rgba(180,83,9,0.2)",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2
          style={{
            color: "var(--text)",
            fontWeight: 700,
            fontSize: "1.1rem",
            marginBottom: "0.45rem",
            letterSpacing: "-0.015em",
            lineHeight: 1.35,
          }}
        >
          {post.title}
        </h2>

        {/* Excerpt */}
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0, lineHeight: 1.65 }}>
          {post.excerpt}
        </p>

        {/* Read more */}
        <div
          style={{
            marginTop: "1rem",
            fontSize: "0.825rem",
            color: "var(--accent)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {t("read_more")}
        </div>
      </article>
    </Link>
  );
}
