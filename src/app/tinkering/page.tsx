import type { Metadata } from "next";
import { PROJECTS } from "@/lib/constants";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import T from "@/components/T";

const DESCRIPTION =
  "Public-interest data tools Kangning (Ken) Huang builds to learn new methods, including the RoboTaxi Safety Tracker.";

const PROJECTS_ZH: Record<string, { title: string; description: string }> = {
  "RoboTaxi Safety Tracker": {
    title: "自动驾驶出租车安全追踪",
    description:
      "这个仪表板用 NHTSA 碰撞数据，独立追踪特斯拉 Cybercab 的安全表现。你可以比较平均行驶多少里程发生一次事故等安全指标，并查看分析依据。",
  },
};

export const metadata: Metadata = {
  title: "Tinkering",
  description: DESCRIPTION,
  alternates: {
    canonical: canonicalUrl("/tinkering"),
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Tinkering"),
    description: DESCRIPTION,
    url: canonicalUrl("/tinkering"),
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

export default function TinkeringPage() {
  const sideProjects = PROJECTS.filter((p) => p.category === "side");

  const pageSchema = webPageSchema({
    path: "/tinkering",
    title: "Tinkering",
    description: DESCRIPTION,
  });

  const breadcrumbs = breadcrumbSchema([{ name: "Tinkering", path: "/tinkering" }]);

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
            <T en="Tinkering" zh="小项目" />
          </h1>
          <div className="mt-4 max-w-3xl space-y-3 text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
            <p>
              <T
                en="Public-interest data tools I build to learn new methods. They sit outside the CLUEs Lab papers, but they use the same habits: open data, a clear question, and a check anyone can re-run."
                zh="这些是我为学习新方法而做的公益数据工具。它们不在 CLUEs 实验室论文主线上，但习惯一样：公开数据、问题说清楚、别人也能复核。"
              />
            </p>
            <p>
              <T
                en="The first tool here is the RoboTaxi Safety Tracker. It reads NHTSA Standing General Order crash data for Tesla Cybercab / robotaxi reports and shows miles-per-incident style comparisons so the published safety claims have an independent public check. Numbers update when NHTSA releases new filings; methodology notes live on the tracker site."
                zh="目前第一个工具是自动驾驶出租车安全追踪（RoboTaxi Safety Tracker）。它读取 NHTSA Standing General Order 中与特斯拉 Cybercab／robotaxi 相关的碰撞数据，用「平均多少英里发生一次事故」一类指标做对照，让公开安全声明有一份可独立查看的核对。NHTSA 有新申报时数字会更新；方法说明在追踪站点上。"
              />
            </p>
            <p>
              <T
                en="I keep this page short on purpose: each card links out to the live tool. If you have a dataset that should be watched the same way, tell me what breaks."
                zh="这个页面刻意写短：每张卡片链到线上工具。如果你有同样值得盯着的数据，告诉我哪里会坏。"
              />
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 animate-fade-up delay-2">
            {sideProjects.map((project) => {
              const zh = PROJECTS_ZH[project.title];
              return (
                <a
                  key={project.title}
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-hover group flex flex-col rounded-xl border border-rule bg-paper p-6"
                >
                  <div className="flex items-start justify-between">
                    <h2 className="font-display text-xl text-ink transition-colors group-hover:text-ember">
                      <T en={project.title} zh={zh?.title ?? project.title} />
                    </h2>
                    <span className="ml-2 text-ink-faint transition-colors group-hover:text-ember">
                      &#8599;
                    </span>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">
                    <T en={project.description} zh={zh?.description ?? project.description} />
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-paper-warm px-2.5 py-0.5 text-xs text-ink-faint"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
