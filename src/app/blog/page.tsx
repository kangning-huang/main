import type { Metadata } from "next";
import { LINKS } from "@/lib/constants";
import { fetchBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on cities, climate, autonomous vehicles, and more by Kangning (Ken) Huang.",
};

export default async function BlogPage() {
  const posts = await fetchBlogPosts();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog</h1>
          <p className="mt-2 text-foreground-secondary">
            Writing on cities, climate, autonomous vehicles, and more.
          </p>
        </div>
        <a
          href={LINKS.substack}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-nyu-violet px-5 py-2 text-sm font-medium text-white hover:bg-nyu-violet-light transition-colors"
        >
          Subscribe on Substack &#8599;
        </a>
      </div>

      {posts.length > 0 ? (
        <div className="mt-10 space-y-6">
          {posts.map((post, i) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border border-border p-6 hover:border-nyu-violet/30 transition-colors"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-nyu-violet transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-foreground-secondary leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <time className="shrink-0 text-sm text-foreground-secondary sm:ml-6">
                  {post.date}
                </time>
              </div>
              <p className="mt-3 text-sm font-medium text-nyu-violet">
                Read on Substack &rarr;
              </p>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-lg border border-border p-8 text-center">
          <p className="text-foreground-secondary">
            Posts are loading from Substack. Visit the newsletter directly:
          </p>
          <a
            href={LINKS.substack}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center text-nyu-violet font-medium hover:text-nyu-violet-light transition-colors"
          >
            kangninghuang.substack.com &#8599;
          </a>
        </div>
      )}
    </div>
  );
}
