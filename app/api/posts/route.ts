import { NextRequest, NextResponse } from "next/server";
import { getAllPostsAdmin, savePost } from "@/lib/posts";
import { verifyAdminPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!token || !verifyAdminPassword(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const posts = getAllPostsAdmin();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!token || !verifyAdminPassword(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, excerpt, content, tags, published } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const post = {
    slug,
    title,
    date: new Date().toISOString().split("T")[0],
    excerpt: excerpt || "",
    content,
    tags: tags || [],
    published: published ?? true,
  };

  savePost(post);
  return NextResponse.json(post, { status: 201 });
}
