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
      "基于NHTSA常规通用令碰撞数据，追踪特斯拉Cybercab安全性能的数据驱动仪表板。提供自动驾驶汽车安全指标（包括每起事故行驶里程对比）的透明、独立分析。",
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
            <T en="Tinkering" zh="业余项目" />
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
            <T
              en="Public-interest data tools I build to learn new methods."
              zh="我为学习新方法而搭建的公益数据工具。"
            />
          </p>

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
