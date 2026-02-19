"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPostBySlug, Post } from "@/lib/posts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

function BlogPost() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    const target = slug || "__nonexistent__";
    getPostBySlug(target).then((data) => setPost(data ?? null));
  }, [slug]);

  if (post === undefined) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        Yükleniyor...
      </div>
    );
  }

  if (!post || !post.published) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        <p style={{ fontSize: "2rem" }}>404</p>
        <p>Yazı bulunamadı.</p>
        <Link href="/" style={{ color: "var(--accent)" }}>Ana sayfaya dön</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <Link
        href="/"
        className="fade-up"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          color: "var(--text-muted)",
          textDecoration: "none",
          fontSize: "0.9rem",
          marginBottom: "2rem",
          transition: "color 0.15s",
        }}
      >
        ← Geri dön
      </Link>

      <div className="fade-up fade-up-delay-1" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "0.75rem",
                padding: "3px 10px",
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

        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            marginBottom: "1rem",
          }}
        >
          {post.title}
        </h1>

        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
          {new Date(post.date).toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <p style={{ color: "#a0a0b8", fontSize: "1.05rem", maxWidth: 600 }}>
          {post.excerpt}
        </p>
      </div>

      <div
        className="fade-up fade-up-delay-2"
        style={{ borderTop: "1px solid var(--border)", marginBottom: "2.5rem" }}
      />

      <div className="prose fade-up fade-up-delay-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        Yükleniyor...
      </div>
    }>
      <BlogPost />
    </Suspense>
  );
}
