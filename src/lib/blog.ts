export interface BlogPost {
  title: string;
  date: string;
  subtitle: string;
  excerpt: string;
  url: string;
  coverImage?: string;
  wordcount?: number;
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      "https://kangninghuang.substack.com/api/v1/posts?limit=10",
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error("Failed to fetch");

    const posts = await res.json();
    return posts.map(
      (post: {
        title: string;
        post_date: string;
        subtitle?: string;
        description?: string;
        truncated_body_text?: string;
        canonical_url: string;
        slug: string;
        cover_image?: string;
        wordcount?: number;
      }) => ({
        title: post.title,
        date: new Date(post.post_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        subtitle: post.subtitle || post.description || "",
        excerpt: post.truncated_body_text
          ? post.truncated_body_text.slice(0, 400)
          : post.subtitle || post.description || "",
        url:
          post.canonical_url ||
          `https://kangninghuang.substack.com/p/${post.slug}`,
        coverImage: post.cover_image || undefined,
        wordcount: post.wordcount || undefined,
      })
    );
  } catch {
    try {
      const res = await fetch("https://kangninghuang.substack.com/feed", {
        next: { revalidate: 86400 },
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return parseRSS(xml);
    } catch {
      return [];
    }
  }
}

function parseRSS(xml: string): BlogPost[] {
  const items: BlogPost[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const pubDate = extractTag(itemXml, "pubDate");
    const description = extractTag(itemXml, "description");

    if (title && link) {
      const cleanDesc = description
        ? decodeHTMLEntities(description).replace(/<[^>]*>/g, "").slice(0, 400)
        : "";
      items.push({
        title: decodeHTMLEntities(title),
        date: pubDate
          ? new Date(pubDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "",
        subtitle: cleanDesc.slice(0, 100),
        excerpt: cleanDesc,
        url: link,
      });
    }
  }
  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const cdataRegex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`
  );
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1];

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
