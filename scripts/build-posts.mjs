// posts/*.md dosyalarını okuyup lib/posts-data.json üretir (build/dev öncesi çalışır).
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const dir = path.join(process.cwd(), "posts");
const posts = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    return {
      slug: f.replace(/\.md$/, ""),
      title: data.title,
      date: String(data.date),
      excerpt: data.excerpt ?? "",
      tags: data.tags ?? [],
      published: data.published !== false,
      content: content.trim(),
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

fs.writeFileSync(path.join(process.cwd(), "lib", "posts-data.json"), JSON.stringify(posts, null, 2));
console.log(`posts-data.json: ${posts.length} yazı`);
