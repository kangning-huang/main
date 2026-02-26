import Link from "next/link";
import type { Metadata } from "next";
import Script from "next/script";
import {
  SITE,
  LINKS,
  RESEARCH_INTERESTS,
  PROJECTS,
} from "@/lib/constants";
import { fetchPublications } from "@/lib/publications";
import { fetchBlogPosts } from "@/lib/blog";
import { canonicalUrl, webPageSchema } from "@/lib/seo";
import T from "@/components/T";
import PublicationCard from "@/components/PublicationCard";

const RESEARCH_INTERESTS_ZH: Record<string, string> = {
  Urbanization: "城市化",
  "Extreme Heat Events": "极端高温事件",
  "Climate Adaptation": "气候适应",
  "Remote Sensing": "遥感",
  GIScience: "地理信息科学",
};

const PROJECTS_ZH: Record<string, { title: string; description: string }> = {
  "Robotaxi Safety Tracker": {
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
};

export const metadata: Metadata = {
  title: "Home",
  description:
    "Kangning (Ken) Huang — Assistant Professor at NYU Shanghai. Research on urban heat islands, global urban expansion projections, climate adaptation, flood risk, urban scaling laws, and remote sensing.",
  alternates: {
    canonical: canonicalUrl("/"),
  },
  openGraph: {
    title: "Kangning (Ken) Huang — NYU Shanghai",
    description:
      "Assistant Professor of Environmental Studies at NYU Shanghai. Research on urbanization, climate change, urban heat islands, and environmental hazards.",
    url: canonicalUrl("/"),
  },
};

export default async function Home() {
  const allPublications = await fetchPublications();
  // Hand-picked mix of high-impact classics + recent lead-author work
  const selectedTitles = [
    // Classics — highest-impact first-author papers
    "Projecting global urban land expansion and heat island intensification through 2050",
    "Persistent increases in nighttime heat stress from urban expansion despite heat island mitigation",
    "Facilitating urban climate forecasts in rapidly urbanizing regions with land-use change modeling",
    // Prestige solo — Nature Climate Change
    "Urban forests facing climate risks",
    // Recent — current research direction
    "Declining urban density attenuates rising population exposure to surface heat extremes",
    "Nested economies of scale in global city mass",
    "Planning for rhythmized urban parks: Temporal park classification and modes of action",
    "Unveiling the causal link between informal settlement demolition and urban cooling",
  ];
  const titleSet = new Set(selectedTitles.map((t) => t.toLowerCase()));
  const featuredPubs = allPublications
    .filter((p) => titleSet.has(p.title.toLowerCase()))
    .sort((a, b) => {
      // Preserve the hand-picked order
      const ai = selectedTitles.findIndex((t) => t.toLowerCase() === a.title.toLowerCase());
      const bi = selectedTitles.findIndex((t) => t.toLowerCase() === b.title.toLowerCase());
      return ai - bi;
    });
  const blogPosts = await fetchBlogPosts();
  const featuredPosts = blogPosts.slice(0, 3);
  const featuredProjects = PROJECTS.filter((p) => p.featured);
  const pageSchema = webPageSchema({
    path: "/",
    title: "Home",
    description:
      "Assistant Professor of Environmental Studies at NYU Shanghai. Research, publications, and projects by Kangning (Ken) Huang.",
  });

  return (
    <>
      <Script
        id="jsonld-homepage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/main/hero-nyc-skyline.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-ink/70" />
        {/* Subtle grain texture on top */}
        <div className="topo-grain absolute inset-0" />

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:pb-28 md:pt-32 lg:px-8">
          <p className="animate-fade-up text-sm font-medium uppercase tracking-[0.2em] text-ember">
            <T en={SITE.affiliation} zh="上海纽约大学" />
          </p>
          <h1 className="animate-fade-up delay-1 mt-4 font-display text-5xl leading-[1.1] text-paper md:text-6xl lg:text-7xl">
            <T en={SITE.name} zh="黄康宁" />
          </h1>
          <p className="animate-fade-up delay-2 mt-3 font-display text-xl italic text-paper/70 md:text-2xl">
            <T en={SITE.title} zh="环境学助理教授" />
          </p>

          {/* Decorative divider */}
          <div className="animate-draw-line delay-3 mt-8 h-px w-32 origin-left bg-ember" />

          <p className="animate-fade-up delay-4 mt-6 max-w-xl text-[15px] leading-relaxed text-paper/60">
            <T
              en={SITE.description}
              zh="聚焦城市化、气候变化与环境灾害研究，致力于构建可持续且韧性的城市未来。"
            />
          </p>

          {/* Links row */}
          <div className="animate-fade-up delay-5 mt-8 flex flex-wrap gap-2.5">
            {[
              { en: "Google Scholar", zh: "谷歌学术", href: LINKS.googleScholar },
              { en: "GitHub", zh: "GitHub", href: LINKS.github },
              { en: "Substack", zh: "Substack", href: LINKS.substack },
              { en: "X", zh: "X", href: LINKS.twitter },
              { en: "NYU Faculty", zh: "教师主页", href: LINKS.nyuFaculty },
              { en: "CV (PDF)", zh: "简历 (PDF)", href: "/main/CV_Kangning_Huang.pdf" },
              { en: "Email", zh: "邮箱", href: `mailto:${SITE.email}` },
            ].map((link) => (
              <a
                key={link.en}
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  link.href.startsWith("mailto:")
                    ? undefined
                    : "noopener noreferrer"
                }
                className="rounded-full border border-paper/20 bg-ink/30 px-4 py-1.5 text-sm text-paper/70 backdrop-blur-sm transition-all duration-300 hover:border-ember hover:text-ember"
              >
                <T en={link.en} zh={link.zh} />
                {!link.href.startsWith("mailto:") && (
                  <span className="ml-1 text-[10px] opacity-40">&#8599;</span>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom gradient fade into page background */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-paper to-transparent" />
      </section>

      {/* ── About ── */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h2 className="section-heading animate-fade-up">
            <T en="About" zh="关于" />
          </h2>

          <div className="mt-8 grid gap-10 md:grid-cols-[1fr,280px]">
            <div className="space-y-4 animate-fade-up delay-1">
              <T
                en={
                  <p className="text-[15px] leading-[1.75] text-ink-muted">
                    I am an Assistant Professor of Environmental Studies at <a href="https://shanghai.nyu.edu" target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">NYU Shanghai</a>, where I lead the CLUEs (Climate, Land Use, and Environmental Sustainability) Lab. I received my PhD from Yale University, <a href="https://environment.yale.edu/" target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">School of the Environment</a> in 2020, and was an <a href="https://edec.ucar.edu/advanced-study-program/postdoctoral-fellowship-program" target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">Advanced Study Program Postdoctoral Fellow</a> at the National Center for Atmospheric Research.
                  </p>
                }
                zh={
                  <p className="text-[15px] leading-[1.75] text-ink-muted">
                    我是<a href="https://shanghai.nyu.edu" target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">上海纽约大学</a>环境学助理教授，主持CLUEs Lab。2020年获<a href="https://environment.yale.edu/" target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">耶鲁大学环境学院</a>博士学位，之后在美国国家大气研究中心担任<a href="https://edec.ucar.edu/advanced-study-program/postdoctoral-fellowship-program" target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">高级研究项目</a>博士后研究员。
                  </p>
                }
              />
              <T
                en={
                  <p className="text-[15px] leading-[1.75] text-ink-muted">
                    My research focuses on how the combination of urbanization and climate change affects vulnerability and adaptability to environmental hazards. By developing global-scale urbanization scenarios, I explore a broad range of possible urban climate futures and the interventions needed to achieve the more sustainable ones.
                  </p>
                }
                zh={
                  <p className="text-[15px] leading-[1.75] text-ink-muted">
                    我的研究聚焦于城市化与气候变化如何共同影响环境灾害的脆弱性与适应能力。通过构建全球尺度的城市化情景，探索多种可能的城市气候未来及实现可持续路径所需的干预措施。
                  </p>
                }
              />
              <T
                en={
                  <p className="text-[15px] leading-[1.75] text-ink-muted">
                    My work spans urban expansion modeling, urban heat island dynamics, climate adaptation trade-offs, and the scaling laws governing cities. My research has been funded by NASA, NSF, and other sponsors, and featured in Yale News, Scientific American, and E&amp;E News.
                  </p>
                }
                zh={
                  <p className="text-[15px] leading-[1.75] text-ink-muted">
                    研究方向涵盖城市扩张建模、城市热岛动态、气候适应权衡及城市标度规律。研究获NASA、NSF等机构资助，并被Yale News、Scientific American和E&amp;E News等媒体报道。
                  </p>
                }
              />
            </div>

            <div className="animate-fade-up delay-2">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                <T en="Research Areas" zh="研究方向" />
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {RESEARCH_INTERESTS.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-ember/20 bg-ember-light px-3 py-1 text-sm font-medium text-ember-dark"
                  >
                    <T en={interest} zh={RESEARCH_INTERESTS_ZH[interest] ?? interest} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Publications ── */}
      <section className="border-t border-rule-faint bg-paper-warm py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="section-heading flex-1">
              <T en="Selected Publications" zh="代表论文" />
            </h2>
            <Link
              href="/publications"
              className="link-underline ml-4 shrink-0 text-sm font-medium text-ember"
            >
              <T en="View all →" zh="查看全部 →" />
            </Link>
          </div>

          <div className="mt-8 space-y-1">
            {featuredPubs.map((pub, i) => (
              <PublicationCard key={i} pub={pub} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="section-heading flex-1">
              <T en="Projects" zh="研究项目" />
            </h2>
            <Link
              href="/projects"
              className="link-underline ml-4 shrink-0 text-sm font-medium text-ember"
            >
              <T en="View all →" zh="查看全部 →" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog ── */}
      {featuredPosts.length > 0 ? (
        <section className="border-t border-rule-faint bg-paper-warm py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="section-heading flex-1">
                <T en="Latest Writing" zh="最新文章" />
              </h2>
              <Link
                href="/blog"
                className="link-underline ml-4 shrink-0 text-sm font-medium text-ember"
              >
                <T en="View all →" zh="查看全部 →" />
              </Link>
            </div>

            {/* Lead post — compact card with cover image */}
            <a
              href={featuredPosts[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover group mt-8 flex overflow-hidden rounded-xl border border-rule bg-paper"
            >
              {featuredPosts[0].coverImage && (
                <div className="hidden shrink-0 overflow-hidden sm:block sm:w-44 md:w-52">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredPosts[0].coverImage}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                  {featuredPosts[0].date}
                  {featuredPosts[0].wordcount && (
                    <span className="ml-3 text-ink-faint/60">
                      {Math.ceil(featuredPosts[0].wordcount / 250)} <T en="min read" zh="分钟阅读" />
                    </span>
                  )}
                </p>
                <h3 className="mt-2 font-display text-xl leading-snug text-ink transition-colors group-hover:text-ember">
                  {featuredPosts[0].title}
                </h3>
                {featuredPosts[0].subtitle && (
                  <p className="mt-1 text-sm italic text-ink-faint line-clamp-1">
                    {featuredPosts[0].subtitle}
                  </p>
                )}
                {featuredPosts[0].excerpt && (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted line-clamp-2">
                    {featuredPosts[0].excerpt}
                  </p>
                )}
                <p className="mt-3 text-sm font-medium text-ember">
                  <T en="Continue reading →" zh="继续阅读 →" />
                </p>
              </div>
            </a>

            {/* Remaining posts — compact list with just title + date */}
            {featuredPosts.length > 1 && (
              <div className="mt-4 divide-y divide-rule-faint">
                {featuredPosts.slice(1).map((post, i) => (
                  <a
                    key={i}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline justify-between gap-4 py-3"
                  >
                    <h3 className="font-display text-[15px] leading-snug text-ink transition-colors group-hover:text-ember">
                      {post.title}
                    </h3>
                    <span className="shrink-0 text-xs text-ink-faint">
                      {post.date}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="border-t border-rule-faint bg-paper-warm py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <h2 className="section-heading">
              <T en="Writing" zh="文章" />
            </h2>
            <p className="mt-6 text-ink-muted">
              <T
                en="I write about cities, climate, autonomous vehicles, and more on Substack."
                zh="我在Substack上撰写关于城市、气候、自动驾驶等话题的文章。"
              />
            </p>
            <a
              href={LINKS.substack}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ember-dark"
            >
              <T en="Read on Substack →" zh="在Substack上阅读 →" />
            </a>
          </div>
        </section>
      )}
    </>
  );
}

function ProjectCard({ project }: { project: (typeof PROJECTS)[number] }) {
  const isInternal = !!project.internalPath;
  const Wrapper = isInternal ? Link : "a";
  const props = isInternal
    ? { href: project.internalPath! }
    : {
        href: project.url,
        target: "_blank" as const,
        rel: "noopener noreferrer",
      };
  const zh = PROJECTS_ZH[project.title];

  return (
    <Wrapper
      {...props}
      className="card-hover group flex flex-col rounded-xl border border-rule bg-paper p-5"
    >
      <h3 className="font-display text-lg text-ink transition-colors group-hover:text-ember">
        <T en={project.title} zh={zh?.title ?? project.title} />
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
        <T en={project.description} zh={zh?.description ?? project.description} />
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-paper-warm px-2.5 py-0.5 text-xs text-ink-faint"
          >
            {tag}
          </span>
        ))}
      </div>
    </Wrapper>
  );
}
