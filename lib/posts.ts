import data from "./posts-data.json";

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
}

const posts = data as Post[];

export async function getAllPosts(): Promise<Post[]> {
  return posts.filter((p) => p.published);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return posts.find((p) => p.slug === slug) ?? null;
}
