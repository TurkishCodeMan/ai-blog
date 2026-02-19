import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !post.published) notFound();

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Back link */}
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

      {/* Header */}
      <div className="fade-up fade-up-delay-1" style={{ marginBottom: "2.5rem" }}>
        {/* Tags */}
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

      {/* Divider */}
      <div
        className="fade-up fade-up-delay-2"
        style={{ borderTop: "1px solid var(--border)", marginBottom: "2.5rem" }}
      />

      {/* Content */}
      <div className="prose fade-up fade-up-delay-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </div>
  );
}
