import type { Metadata } from "next";
import Link from "next/link";
import WeChatOfficialQr from "@/components/WeChatOfficialQr";
import {
  canonicalUrl,
  withOpenGraphDefaults,
  pageTitle,
  webPageSchema,
  breadcrumbSchema,
  itemListSchema,
} from "@/lib/seo";
import { formatZhDate, getZhBlogPosts, zhBlogPath } from "@/lib/zh-blog";

const TITLE = "博客";
const DESCRIPTION =
  "城市与气候研究中的问题和发现，写给大众读者。文章首次发表于公众号「反直觉手记」。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: canonicalUrl(zhBlogPath()),
    languages: { "zh-Hans": canonicalUrl(zhBlogPath()) },
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    locale: "zh_CN",
    title: pageTitle(TITLE),
    description: DESCRIPTION,
    url: canonicalUrl(zhBlogPath()),
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "黄康宁 — 上海纽约大学",
      },
    ],
  }),
};

export default function ZhBlogIndexPage() {
  const posts = getZhBlogPosts();
  const pageSchema = webPageSchema({
    path: zhBlogPath(),
    title: TITLE,
    description: DESCRIPTION,
    inLanguage: "zh-Hans",
  });
  const breadcrumbs = breadcrumbSchema([{ name: "博客", path: zhBlogPath() }]);
  const listSchema = itemListSchema(
    posts.map((post) => ({ name: post.title, path: zhBlogPath(post.slug) })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl text-ink">博客</h1>
            <p className="mt-2 max-w-xl text-ink-muted">{DESCRIPTION}</p>
          </div>
          <WeChatOfficialQr size="md" alwaysShow className="shrink-0 self-start sm:self-end" />
        </div>

        {posts.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={zhBlogPath(post.slug)}
                className="card-hover group block overflow-hidden rounded-xl border border-rule bg-paper"
              >
                {post.cover && (
                  <div className="overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.cover}
                      alt=""
                      className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                    {formatZhDate(post.date)}
                  </p>
                  <h2 className="mt-2.5 font-display text-xl leading-snug text-ink transition-colors group-hover:text-ember">
                    {post.title}
                  </h2>
                  {post.description && (
                    <p className="mt-3 line-clamp-4 text-sm leading-[1.7] text-ink-muted">
                      {post.description}
                    </p>
                  )}
                  <p className="mt-4 text-sm font-medium text-ember">阅读全文 →</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-10 text-ink-muted">文章即将发布。</p>
        )}
      </div>
    </>
  );
}
