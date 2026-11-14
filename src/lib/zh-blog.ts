import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/blog/zh");

export type ZhBlogPost = {
  slug: string;
  title: string;
  date: string;
  description: string;
  cover?: string;
  wechatUrl?: string;
  content: string;
};

function formatDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : raw;
}

export function getZhBlogSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.slice(0, -".md".length));
}

export function getZhBlogPost(slug: string): ZhBlogPost | null {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const resolvedSlug = typeof data.slug === "string" && data.slug ? data.slug : slug;
  return {
    slug: resolvedSlug,
    title: String(data.title ?? ""),
    date: formatDate(data.date),
    description: String(data.description ?? ""),
    cover: typeof data.cover === "string" ? data.cover : undefined,
    wechatUrl: typeof data.wechatUrl === "string" ? data.wechatUrl : undefined,
    content,
  };
}

export function getZhBlogPosts(): ZhBlogPost[] {
  return getZhBlogSlugs()
    .map((slug) => getZhBlogPost(slug))
    .filter((post): post is ZhBlogPost => post !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function formatZhDate(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function zhBlogPath(slug?: string): string {
  return slug ? `/zh/blog/${slug}` : "/zh/blog";
}
