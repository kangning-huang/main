import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ZhBlogFollowQr from "@/components/ZhBlogFollowQr";
import ZhBlogMarkdown from "@/components/ZhBlogMarkdown";
import {
  articleSchema,
  breadcrumbSchema,
  canonicalUrl,
  pageTitle,
  withOpenGraphDefaults,
} from "@/lib/seo";
import {
  formatZhDate,
  getZhBlogPost,
  getZhBlogSlugs,
  zhBlogPath,
} from "@/lib/zh-blog";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getZhBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getZhBlogPost(slug);
  if (!post) return {};
  const path = zhBlogPath(post.slug);
  const url = canonicalUrl(path);
  const images = post.cover
    ? [{ url: post.cover, alt: post.title }]
    : [
        {
          url: "/og-default.jpg",
          width: 1200,
          height: 630,
          alt: "黄康宁 — 上海纽约大学",
        },
      ];
  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
      languages: { "zh-Hans": url },
    },
    openGraph: withOpenGraphDefaults({
      type: "article",
      locale: "zh_CN",
      title: pageTitle(post.title),
      description: post.description,
      url,
      publishedTime: post.date,
      images,
    }),
  };
}

export default async function ZhBlogArticlePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getZhBlogPost(slug);
  if (!post) notFound();

  const path = zhBlogPath(post.slug);
  const jsonLd = articleSchema({
    path,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    image: post.cover,
    inLanguage: "zh-Hans",
  });
  const breadcrumbs = breadcrumbSchema([
    { name: "博客", path: zhBlogPath() },
    { name: post.title, path },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        <p className="text-sm text-ink-faint">
          <Link href={zhBlogPath()} className="link-underline hover:text-ember">
            博客
          </Link>
          <span className="mx-2">/</span>
          <time dateTime={post.date}>{formatZhDate(post.date)}</time>
        </p>
        <h1 className="mt-3 font-display text-3xl leading-snug text-ink md:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-ink-muted">黄康宁</p>
        {post.cover && (
          <div className="mt-8 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover} alt="" className="w-full" />
          </div>
        )}
        <div className="mt-10">
          <ZhBlogMarkdown content={post.content} />
        </div>
        <ZhBlogFollowQr />
      </article>
    </>
  );
}
