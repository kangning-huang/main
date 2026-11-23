import type { Metadata } from "next";
import { PROJECTS, PROJECT_TAG_ZH } from "@/lib/constants";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import T from "@/components/T";

const DESCRIPTION =
  "Public-interest data tools Kangning (Ken) Huang builds to learn new methods, including the RoboTaxi Safety Tracker and NimbleMap.";

const PROJECTS_ZH: Record<
  string,
  { title: string; description: string; linkLabel?: string; secondaryLabel?: string }
> = {
  "RoboTaxi Safety Tracker": {
    title: "自动驾驶出租车安全追踪",
    description:
      "基于 NHTSA Standing General Order 碰撞数据，追踪特斯拉 Cybercab 的安全表现。这个仪表板比较平均每起事故对应的行驶里程等指标，并提供独立核查公开数据的依据。",
  },
  NimbleMap: {
    title: "凌波微图",
    description:
      "NimbleMap 是一个本地地图查看器。学生和读者可以直接打开公开数据和研究论文中的 Shapefile、GeoTIFF、NetCDF 和经纬度表，在地图上查看这些数据，不必先学习 GIS。文件保存在用户自己的电脑上。",
    linkLabel: "打开示例数据",
    secondaryLabel: "关于这个查看器",
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
                en="I build these public-interest data tools to learn new methods. They are separate from the CLUEs Lab papers, but follow the same approach: use open data, ask a clear question, and make the results reproducible."
                zh="我做这些公益数据工具，主要是为了学习新方法。它们不属于 CLUEs 实验室的论文研究，但遵循相同的原则：使用开放数据，提出明确的问题，并让别人能够复核结果。"
              />
            </p>
            <p>
              <T
                en="The first tool is the RoboTaxi Safety Tracker. It uses NHTSA Standing General Order crash data for Tesla Cybercab / robotaxi reports. It compares safety measures such as miles per incident to provide an independent public check on published safety claims. The numbers update when NHTSA releases new filings. The tracker site also explains the methods."
                zh="第一个工具是自动驾驶出租车安全追踪（RoboTaxi Safety Tracker）。它使用 NHTSA Standing General Order 中特斯拉 Cybercab／robotaxi 相关的碰撞数据，比较平均每起事故对应的行驶里程等安全指标，独立核查已公布的安全声明。NHTSA 发布新的申报数据后，指标会随之更新。具体分析方法见工具网站。"
              />
            </p>
            <p>
              <T
                en="Each project links to a working tool. If you know of another public dataset worth monitoring, or find a problem with these tools, let me know."
                zh="每个项目都链接到可以直接使用的工具。如果你知道其他值得持续追踪的公开数据，或者发现这些工具有问题，欢迎告诉我。"
              />
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 animate-fade-up delay-2">
            {sideProjects.map((project) => {
              const zh = PROJECTS_ZH[project.title];
              const primaryLabel = project.linkLabel ?? null;
              const secondaryUrl = project.secondaryUrl;
              const secondaryLabel = project.secondaryLabel;
              const hasCtas = Boolean(primaryLabel || secondaryUrl);

              if (!hasCtas) {
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
                          <T en={tag} zh={PROJECT_TAG_ZH[tag] ?? tag} />
                        </span>
                      ))}
                    </div>
                  </a>
                );
              }

              return (
                <div
                  key={project.title}
                  className="card-hover flex flex-col rounded-xl border border-rule bg-paper p-6"
                >
                  <h2 className="font-display text-xl text-ink">
                    <T en={project.title} zh={zh?.title ?? project.title} />
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">
                    <T en={project.description} zh={zh?.description ?? project.description} />
                  </p>
                  <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline font-medium text-ember"
                    >
                      <T
                        en={primaryLabel ?? "Open"}
                        zh={zh?.linkLabel ?? primaryLabel ?? "打开"}
                      />{" "}
                      &#8599;
                    </a>
                    {secondaryUrl && (
                      <a
                        href={secondaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline text-ink-faint hover:text-ember"
                      >
                        <T
                          en={secondaryLabel ?? "About"}
                          zh={zh?.secondaryLabel ?? secondaryLabel ?? "简介"}
                        />{" "}
                        &#8599;
                      </a>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-paper-warm px-2.5 py-0.5 text-xs text-ink-faint"
                      >
                        <T en={tag} zh={PROJECT_TAG_ZH[tag] ?? tag} />
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
