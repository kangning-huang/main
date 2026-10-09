import type { Metadata } from "next";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import { NEWS, formatNewsDate } from "@/lib/news";
import T from "@/components/T";

const DESCRIPTION =
  "News from Kangning (Ken) Huang and the CLUEs Lab at NYU Shanghai: papers accepted, in press, and published.";

export const metadata: Metadata = {
  title: "News",
  description: DESCRIPTION,
  alternates: {
    canonical: canonicalUrl("/news"),
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("News"),
    description: DESCRIPTION,
    url: canonicalUrl("/news"),
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Kangning (Ken) Huang — NYU Shanghai",
      },
    ],
  }),
};

export default function NewsPage() {
  const pageSchema = webPageSchema({
    path: "/news",
    title: "News",
    description: DESCRIPTION,
  });

  const breadcrumbs = breadcrumbSchema([{ name: "News", path: "/news" }]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h1 className="section-heading animate-fade-up">
            <T en="News" zh="动态" />
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
            <T
              en="Papers accepted, in press, and published, newest first."
              zh="论文接收、待刊与发表动态，按时间倒序排列。"
            />
          </p>

          <ol className="mt-10 border-l border-rule animate-fade-up delay-2">
            {NEWS.map((item) => {
              const external = item.href.startsWith("http");
              const date = formatNewsDate(item.date);
              return (
                <li key={item.href} className="relative pb-8 pl-6 last:pb-0">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-ember" />
                  <time
                    dateTime={item.date}
                    className="text-xs font-medium uppercase tracking-wider text-ink-faint"
                  >
                    <T en={date.en} zh={date.zh} />
                  </time>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink">
                    <a
                      href={item.href}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="transition-colors hover:text-ember"
                    >
                      <T en={item.en} zh={item.zh} />
                      {external && (
                        <span className="ml-1 text-[10px] text-ink-faint">&#8599;</span>
                      )}
                    </a>
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}
