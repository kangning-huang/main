import type { MetadataRoute } from "next";
import { canonicalPageUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls = [
    {
      path: "/",
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    {
      path: "/research",
      changeFrequency: "monthly" as const,
      priority: 0.95,
    },
    {
      path: "/publications",
      changeFrequency: "weekly" as const,
      priority: 0.95,
    },
    {
      path: "/lab",
      changeFrequency: "monthly" as const,
      priority: 0.85,
    },
    {
      path: "/teaching",
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      path: "/news",
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      path: "/projects",
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    {
      path: "/advisees",
      changeFrequency: "monthly" as const,
      priority: 0.75,
    },
    {
      path: "/blog",
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      path: "/urban-expansion",
      changeFrequency: "yearly" as const,
      priority: 0.8,
    },
    {
      path: "/tinkering",
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
    {
      path: "/llms.txt",
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  return urls.map((entry) => ({
    url: canonicalPageUrl(entry.path),
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
