import { supabase } from "./supabase";

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
}

export async function getAllPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as Post;
}

export async function getAllPostsAdmin(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Post[];
}

export async function savePost(post: Post): Promise<void> {
  const { error } = await supabase.from("posts").upsert(post, { onConflict: "slug" });
  if (error) throw new Error(error.message);
}

export async function deletePost(slug: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}
