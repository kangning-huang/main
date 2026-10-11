import Link from "next/link";
import Image from "next/image";
import { PROJECTS } from "@/lib/constants";
import type { Metadata } from "next";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import T from "@/components/T";

const PROJECTS_ZH: Record<string, { title: string; description: string }> = {
  "Nested Scaling of City Mass": {
    title: "全球城市建成质量的嵌套标度规律",
    description:
      "城市人口增加时，建成质量怎样变化？这个工具展示3000多个城市的人口与建成质量之间的非线性标度关系，以及其中的嵌套规模经济。",
  },
  "Urban Expansion 2050": {
    title: "2050年全球城市扩张",
    description:
      "这个工具展示全球城市用地到2050年的扩张预测，依据是2019年发表于 Environmental Research Letters 的研究；数据也可在 WRI Resource Watch 获取。",
  },
  "3D Urban Flood Risk": {
    title: "三维城市洪水风险",
    description:
      "这个网页工具展示全球城市三维洪水暴露，评估同时考虑建筑高度和防洪标准。",
  },
  "Urban Renewal Cooling DID": {
    title: "城市更新降温的双重差分因果分析",
    description:
      "非正规住区拆除会让城市降温吗？这个工具展示双重差分分析的关键结果，说明城市更新对降温的因果影响。",
  },
  "URBANMOD-ZIPF": {
    title: "URBANMOD-ZIPF",
    description:
      "这个开源模型模拟不同情景下全球城市用地扩张，保持齐普夫定律，呈现贴近现实的城市增长模式。",
  },
};

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Tools and maps from Kangning (Ken) Huang's papers: maps and explorers tied to specific results.",
  alternates: {
    canonical: canonicalUrl("/projects"),
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Projects"),
    description:
      "Tools and maps from Kangning (Ken) Huang's papers: maps and explorers tied to specific results.",
    url: canonicalUrl("/projects"),
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

export default function ProjectsPage() {
  const pageSchema = webPageSchema({
    path: "/projects",
    title: "Projects",
    description:
      "Tools and maps from Kangning (Ken) Huang's papers: maps and explorers tied to specific results.",
  });

  const breadcrumbs = breadcrumbSchema([{ name: "Projects", path: "/projects" }]);

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
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <h1 className="font-display text-4xl text-ink">
          <T en="Projects" zh="研究项目" />
        </h1>
        <p className="mt-2 text-ink-muted">
          <T
            en="Tools and maps from the papers."
            zh="我把论文里的研究结果做成了工具和地图。"
          />
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">
          <T en="Academic projects" zh="学术项目" />
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          <T
            en="Maps and explorers tied to specific results."
            zh="这些地图和交互工具展示论文中的具体研究结果。"
          />
        </p>
        <ProjectGrid projects={PROJECTS.filter((p) => p.category === "academic")} />

        <p className="mt-14 text-sm text-ink-muted">
          <T
            en={
              <>
                Looking for side projects such as the RoboTaxi Safety Tracker? See{" "}
                <Link href="/tinkering" className="link-underline font-medium text-ember">
                  Tinkering
                </Link>
                .
              </>
            }
            zh={
              <>
                自动驾驶出租车安全追踪等个人项目请见
                <Link href="/tinkering" className="link-underline font-medium text-ember">
                  业余项目
                </Link>
                页面。
              </>
            }
          />
        </p>
      </div>
    </>
  );
}

function ProjectGrid({ projects }: { projects: (typeof PROJECTS)[number][] }) {
  return (
    <div className="mt-4 grid gap-5 md:grid-cols-2">
      {projects.map((project) => {
        const isInternal = !!project.internalPath;
        const zh = PROJECTS_ZH[project.title];

        return isInternal ? (
          <Link
            key={project.title}
            href={project.internalPath!}
            className="card-hover group flex flex-col rounded-xl border border-rule bg-paper p-6"
          >
            <CardContent project={project} zh={zh} />
          </Link>
        ) : (
          <a
            key={project.title}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-hover group flex flex-col rounded-xl border border-rule bg-paper p-6"
          >
            <CardContent project={project} zh={zh} />
          </a>
        );
      })}
    </div>
  );
}

function CardContent({
  project,
  zh,
}: {
  project: (typeof PROJECTS)[number];
  zh?: { title: string; description: string };
}) {
  return (
    <>
      {project.imagePath && (
        <div className="relative -mx-6 -mt-6 mb-4 aspect-video overflow-hidden rounded-t-xl">
          <Image
            src={project.imagePath}
            alt={`Screenshot of ${project.title}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
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
            className="rounded-full border border-ember/20 bg-ember-light px-3 py-0.5 text-xs font-medium text-ember-dark"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  );
}
