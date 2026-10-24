import { execSync } from "node:child_process";
import type { MetadataRoute } from "next";
import { canonicalPageUrl } from "@/lib/seo";

export const dynamic = "force-static";

type Freq = "weekly" | "monthly" | "yearly";

type Entry = {
  path: string;
  changeFrequency: Freq;
  priority: number;
  /** Source files whose latest git commit date drives lastmod. */
  sources: string[];
};

const ENTRIES: Entry[] = [
  {
    path: "/",
    changeFrequency: "monthly",
    priority: 1,
    sources: ["src/app/page.tsx", "src/lib/constants.ts", "src/lib/seo.ts"],
  },
  {
    path: "/atlas",
    changeFrequency: "monthly",
    priority: 0.95,
    sources: ["src/app/atlas/page.tsx", "src/lib/atlas.ts", "src/components/atlas"],
  },
  {
    path: "/research",
    changeFrequency: "monthly",
    priority: 0.95,
    sources: ["src/app/research/page.tsx"],
  },
  {
    path: "/reach",
    changeFrequency: "monthly",
    priority: 0.9,
    sources: ["src/app/reach/page.tsx", "src/lib/influence.ts", "src/lib/field-shelf.ts"],
  },
  {
    path: "/publications",
    changeFrequency: "weekly",
    priority: 0.95,
    sources: [
      "src/app/publications/page.tsx",
      "src/lib/publications-part-a.ts",
      "src/lib/publications-part-b.ts",
      "src/lib/publications.ts",
    ],
  },
  {
    path: "/lab",
    changeFrequency: "monthly",
    priority: 0.85,
    sources: ["src/app/lab/page.tsx"],
  },
  {
    path: "/teaching",
    changeFrequency: "monthly",
    priority: 0.8,
    sources: ["src/app/teaching/page.tsx", "src/lib/teaching.ts"],
  },
  {
    path: "/news",
    changeFrequency: "weekly",
    priority: 0.8,
    sources: ["src/app/news/page.tsx", "src/lib/news.ts"],
  },
  {
    path: "/projects",
    changeFrequency: "monthly",
    priority: 0.9,
    sources: ["src/app/projects/page.tsx", "src/lib/constants.ts"],
  },
  {
    path: "/advisees",
    changeFrequency: "monthly",
    priority: 0.75,
    sources: ["src/app/advisees/page.tsx", "src/lib/advisees.tsx"],
  },
  {
    path: "/blog",
    changeFrequency: "weekly",
    priority: 0.85,
    sources: ["src/app/blog/page.tsx", "src/lib/blog.ts", "src/data/blog-posts.json"],
  },
  {
    path: "/urban-expansion",
    changeFrequency: "yearly",
    priority: 0.8,
    sources: ["src/app/urban-expansion/page.tsx"],
  },
  {
    path: "/tinkering",
    changeFrequency: "yearly",
    priority: 0.5,
    sources: ["src/app/tinkering/page.tsx", "src/lib/constants.ts"],
  },
];

function gitLastModified(sources: string[]): Date {
  try {
    const out = execSync(`git log -1 --format=%cI -- ${sources.join(" ")}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (out) return new Date(out);
  } catch {
    // Fall through when git is unavailable (e.g. shallow CI without history).
  }
  return new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
  return ENTRIES.map((entry) => ({
    url: canonicalPageUrl(entry.path),
    lastModified: gitLastModified(entry.sources),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
