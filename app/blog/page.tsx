"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPostBySlug, Post } from "@/lib/posts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

function BlogPost() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const { t, locale } = useLocale();
  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";

  useEffect(() => {
    const target = slug || "__nonexistent__";
    getPostBySlug(target).then((data) => setPost(data ?? null));
  }, [slug]);

  if (post === undefined) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        {t("loading")}
      </div>
    );
  }

  if (!post || !post.published) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        <p style={{ fontSize: "2rem" }}>404</p>
        <p>{t("post_not_found")}</p>
        <Link href="/" style={{ color: "var(--accent)" }}>{t("go_home")}</Link>
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
        {t("back")}
      </Link>

      <div className="fade-up fade-up-delay-1" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "0.72rem",
                padding: "3px 10px",
                borderRadius: 20,
                backgroundColor: "var(--accent-tag)",
                color: "var(--accent)",
                border: "1px solid rgba(180,83,9,0.2)",
                fontWeight: 600,
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
            color: "var(--text)",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            marginBottom: "1rem",
          }}
        >
          {post.title}
        </h1>

        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
          {new Date(post.date).toLocaleDateString(dateLocale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <p style={{ color: "var(--text-soft)", fontSize: "1.05rem", maxWidth: 600 }}>
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
        Loading...
      </div>
    }>
      <BlogPost />
    </Suspense>
  );
}
