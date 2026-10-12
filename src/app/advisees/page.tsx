import type { Metadata } from "next";
import Link from "next/link";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import { ADVISEES } from "@/lib/advisees";
import T from "@/components/T";

export const metadata: Metadata = {
  title: "Advisees",
  description:
    "Students mentored by Kangning Huang at NYU Shanghai, including capstone projects, research achievements, and graduate placements.",
  alternates: {
    canonical: canonicalUrl("/advisees"),
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Advisees"),
    description:
      "Students mentored by Kangning Huang at NYU Shanghai, including capstone projects, research achievements, and graduate placements.",
    url: canonicalUrl("/advisees"),
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

export default function AdviseesPage() {
  const pageSchema = webPageSchema({
    path: "/advisees",
    title: "Advisees",
    description:
      "Students mentored by Kangning Huang at NYU Shanghai, including capstone projects, research achievements, and graduate placements.",
  });

  const breadcrumbs = breadcrumbSchema([{ name: "Advisees", path: "/advisees" }]);

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
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h1 className="section-heading animate-fade-up">
            <T en="Advisees" zh="指导学生" />
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
            <T
              en="I supervise NYU Shanghai undergraduates on capstones, research projects, and fellowships. The work is research design, methods, revision, and how to present results."
              zh="我指导上海纽约大学本科生完成毕业论文、研究项目和学术资助项目。我们会反复讨论研究怎么设计、方法怎么用，以及怎样把研究过程和发现讲清楚。"
            />
          </p>
          <p className="mt-3 max-w-3xl text-sm text-ink-muted animate-fade-up delay-1">
            <T
              en={
                <>
                  Interested in working with the lab? See{" "}
                  <Link href="/lab#join" className="link-underline text-ember hover:text-ember-dark transition-colors">
                    how to join
                  </Link>
                  .
                </>
              }
              zh={
                <>
                  有意加入实验室？请查看
                  <Link href="/lab#join" className="link-underline text-ember hover:text-ember-dark transition-colors">
                    加入方式
                  </Link>
                  。
                </>
              }
            />
          </p>

          <div className="mt-12 space-y-8">
            {ADVISEES.map((advisee, i) => (
              <article
                key={advisee.name}
                className="animate-fade-up rounded-xl border border-rule bg-paper p-6 transition-shadow hover:shadow-md"
                style={{ animationDelay: `${(i + 2) * 100}ms` }}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-display text-xl text-ink">
                    {advisee.name}
                  </h2>
                  {advisee.linkedin && (
                    <a
                      href={advisee.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline text-sm text-ember hover:text-ember-dark transition-colors"
                    >
                      LinkedIn &#8599;
                    </a>
                  )}
                  <span className="rounded-full bg-paper-warm px-2.5 py-0.5 text-xs text-ink-faint">
                    <T
                      en={`Class of ${advisee.classYear}`}
                      zh={`${advisee.classYear}届`}
                    />
                  </span>
                </div>

                <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                  <T en={advisee.project} zh={advisee.projectZh} />
                </p>

                <T
                  en={
                    <ul className="mt-3 space-y-1.5">
                      {advisee.achievements.map((achievement, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-sm text-ink-muted"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  }
                  zh={
                    <ul className="mt-3 space-y-1.5">
                      {advisee.achievementsZh.map((achievement, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-sm text-ink-muted"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  }
                />
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
