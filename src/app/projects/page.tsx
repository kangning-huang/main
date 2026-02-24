import Link from "next/link";
import Image from "next/image";
import { PROJECTS } from "@/lib/constants";
import type { Metadata } from "next";
import Script from "next/script";
import { canonicalUrl, webPageSchema } from "@/lib/seo";
import T from "@/components/T";

const PROJECTS_ZH: Record<string, { title: string; description: string }> = {
  "RoboTaxi Safety Tracker": {
    title: "自动驾驶出租车安全追踪",
    description:
      "基于NHTSA常规通用令碰撞数据，追踪特斯拉Cybercab安全性能的数据驱动仪表板。提供自动驾驶汽车安全指标（包括每起事故行驶里程对比）的透明、独立分析。",
  },
  "Nested Scaling of City Mass": {
    title: "全球城市建成质量的嵌套标度规律",
    description:
      "关于全球城市建成质量嵌套规模经济论文的配套交互式可视化。探索3000多个城市中城市人口与建成环境之间的非线性标度关系。",
  },
  "Urban Expansion 2050": {
    title: "2050年全球城市扩张",
    description:
      "到2050年的全球城市用地扩张预测。基于2019年发表在Environmental Research Letters上的研究，数据可在WRI Resource Watch上获取。",
  },
  "3D Urban Flood Risk": {
    title: "三维城市洪水风险",
    description:
      "将建筑高度和防护标准纳入全球洪水风险评估论文的配套交互式网页应用。在全球范围内可视化城市三维洪水暴露。",
  },
  "Urban Renewal Cooling DID": {
    title: "城市更新降温的因果分析",
    description:
      "关于非正规住区拆除与城市降温之间因果关系论文的关键结果交互式可视化。采用双重差分方法揭示城市更新的降温效应。",
  },
  "URBANMOD-ZIPF": {
    title: "URBANMOD-ZIPF",
    description:
      "保持齐普夫定律的全球尺度城市用地扩张模型。用于模拟不同情景下真实城市增长模式的开源工具。",
  },
  "Polybot Arena": {
    title: "Polybot Arena",
    description:
      "可视化精英交易机器人在Polymarket加密预测市场中的竞争。追踪BTC、ETH、SOL和XRP涨跌预测市场上最赚钱的交易者，展示其精确时机、持仓和盈亏。",
  },
  "Capitol Alpha": {
    title: "Capitol Alpha",
    description:
      "国会交易仪表板——追踪和分析美国国会议员的股票交易。",
  },
};

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Research tools, interactive visualizations, and web applications developed by Kangning (Ken) Huang.",
  alternates: {
    canonical: canonicalUrl("/projects"),
  },
  openGraph: {
    title: "Projects",
    description:
      "Research tools, interactive visualizations, and web applications developed by Kangning (Ken) Huang.",
    url: canonicalUrl("/projects"),
  },
};

export default function ProjectsPage() {
  const pageSchema = webPageSchema({
    path: "/projects",
    title: "Projects",
    description:
      "Research tools, interactive visualizations, and web applications developed by Kangning (Ken) Huang.",
  });

  return (
    <>
      <Script
        id="jsonld-projects"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <h1 className="font-display text-4xl text-ink">
          <T en="Projects" zh="研究项目" />
        </h1>
        <p className="mt-2 text-ink-muted">
          <T
            en="Research tools, interactive visualizations, and web applications."
            zh="研究工具、交互式可视化和网络应用。"
          />
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">
          <T en="Academic Projects" zh="学术项目" />
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          <T
            en="Interactive visualizations and tools accompanying my research papers."
            zh="配套研究论文的交互式可视化和工具。"
          />
        </p>
        <ProjectGrid projects={PROJECTS.filter((p) => p.category === "academic")} />

        <h2 className="mt-14 font-display text-2xl text-ink">
          <T en="Side Projects" zh="个人项目" />
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          <T
            en="Independent projects exploring data visualization and public-interest analytics."
            zh="探索数据可视化和公共利益分析的独立项目。"
          />
        </p>
        <ProjectGrid projects={PROJECTS.filter((p) => p.category === "side")} />
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
