import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug, savePost, deletePost } from "@/lib/posts";
import { verifyAdminPassword } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = request.headers.get("x-admin-token");
  if (!token || !verifyAdminPassword(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const post = getPostBySlug(slug);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = request.headers.get("x-admin-token");
  if (!token || !verifyAdminPassword(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = getPostBySlug(slug);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updated = { ...existing, ...body, slug };
  savePost(updated);
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = request.headers.get("x-admin-token");
  if (!token || !verifyAdminPassword(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  deletePost(slug);
  return NextResponse.json({ success: true });
}
