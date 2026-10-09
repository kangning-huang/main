import Link from "next/link";
import type { Metadata } from "next";
import {
  SITE,
  LINKS,
  PROJECTS,
  publicationSlug,
} from "@/lib/constants";
import { fetchPublications } from "@/lib/publications";
import { fetchBlogPosts } from "@/lib/blog";
import { NEWS, formatNewsDate } from "@/lib/news";
import { webPageSchema, profilePageSchema, faqSchema, OG_IMAGE_PATH, withOpenGraphDefaults, canonicalPageUrl } from "@/lib/seo";
import T from "@/components/T";
import PublicationCard from "@/components/PublicationCard";
import { reachHeadline } from "@/lib/influence";

const HOME_DESCRIPTION =
  "How the size and shape of cities decide their climate future. Kangning (Ken) Huang, Assistant Professor of Environmental Studies, NYU Shanghai.";

// Each finding is taken from the linked paper's highlights in publications-part-a.ts.
const FINDINGS = [
  {
    en: "Double a city's population and its built mass grows only about 87%; bigger cities need less material per person.",
    zh: "城市人口翻倍，建成质量仅增长约87%；城市越大，人均所需的建筑材料越少。",
    venue: "Nature Cities",
    year: "2026",
    // In press — link to the on-site entry, not a DOI
    href: `/publications#${publicationSlug("Nested economies of scale in global city mass")}`,
  },
  {
    en: "By 2050, urban expansion alone could warm cities 0.5–0.7 °C on average, locally rivaling greenhouse-gas warming.",
    zh: "到2050年，仅城市扩张一项就可能使城市平均升温0.5–0.7 °C，局部可与温室气体导致的增温相当。",
    venue: "Environmental Research Letters",
    year: "2019",
    href: "https://doi.org/10.1088/1748-9326/ab4b71",
  },
  {
    en: "Cool roofs can't fix the night: about half the added nighttime heat stress from expansion persists.",
    zh: "冷屋顶解决不了夜间问题：城市扩张新增的夜间热应力约有一半依然存在。",
    venue: "JGR: Atmospheres",
    year: "2021",
    href: "https://doi.org/10.1029/2020JD033831",
  },
  {
    en: "Counting building height and flood defenses shifts global flood damage toward Southeast Asia, 42% of the total versus 15%.",
    zh: "纳入建筑高度与防洪标准后，全球洪灾损失向东南亚转移：占比为42%，而传统方法仅为15%。",
    venue: "Scientific Reports",
    year: "2026",
    href: "https://doi.org/10.1038/s41598-026-70981-w",
  },
  {
    en: "Replacing informal settlements cooled surfaces by about 1.5 K, and how much depended on what was built next.",
    zh: "拆除非正规住区使地表降温约1.5 K，降温幅度取决于拆除后建了什么。",
    venue: "npj Environmental Social Sciences",
    year: "2026",
    href: "https://doi.org/10.1038/s44432-026-00009-1",
  },
];

const extLink = "text-ember hover:underline";

const PROJECTS_ZH: Record<string, { title: string; description: string }> = {
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
  title: {
    absolute: "Kangning (Ken) Huang — Assistant Professor of Environmental Studies, NYU Shanghai",
  },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: canonicalPageUrl("/"),
  },
  openGraph: withOpenGraphDefaults({
    type: "profile",
    firstName: "Kangning",
    lastName: "Huang",
    title: "Kangning (Ken) Huang — Assistant Professor, NYU Shanghai",
    description: HOME_DESCRIPTION,
    url: canonicalPageUrl("/"),
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "Kangning (Ken) Huang — NYU Shanghai",
      },
    ],
  }),
};

export default async function Home() {
  const allPublications = await fetchPublications();
  const reach = reachHeadline();
  // Exactly five hand-picked lead/last-author papers
  const selectedTitles = [
    "Nested economies of scale in global city mass",
    "Toward Cooler Cities by Larger Homogeneous Functional Clusters",
    "Height-Aware and Protection-Informed Flood Assessment Shifts Global Urban Risk Distribution",
    "Projecting global urban land expansion and heat island intensification through 2050",
    "Persistent increases in nighttime heat stress from urban expansion despite heat island mitigation",
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
  // At most two research posts; top up from non-Tesla posts if needed
  const researchPosts = blogPosts.filter((p) => p.tag === "research");
  const fillerPosts = blogPosts.filter(
    (p) => p.tag !== "research" && !/tesla/i.test(p.title)
  );
  const featuredPosts = [...researchPosts, ...fillerPosts].slice(0, 2);
  const featuredProjects = PROJECTS.filter(
    (p) => p.featured && p.category === "academic"
  );
  const pageSchema = webPageSchema({
    path: "/",
    title: "Home",
    description: HOME_DESCRIPTION,
  });

  const profileSchema = profilePageSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema()) }}
      />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-nyu-shanghai.jpg"
          alt="NYU Shanghai campus in Pudong, Shanghai"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-ink/70" />
        {/* Subtle grain texture on top */}
        <div className="topo-grain absolute inset-0" />

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:pb-28 md:pt-32 lg:px-8">
          <h1 className="animate-fade-up font-display text-5xl leading-[1.1] text-paper md:text-6xl lg:text-7xl">
            <T en={SITE.name} zh="黄康宁" />
          </h1>
          <p className="animate-fade-up delay-1 mt-5 max-w-3xl font-display text-2xl italic leading-snug text-paper/85 md:text-[30px]">
            <T
              en="How the size and shape of cities decide their climate future."
              zh="城市的规模与形态如何决定其气候未来。"
            />
          </p>
          <p className="animate-fade-up delay-2 mt-4 text-sm text-paper/60">
            <T
              en="Assistant Professor of Environmental Studies · CLUEs Lab, NYU Shanghai"
              zh="环境学助理教授 · CLUEs Lab，上海纽约大学"
            />
          </p>
          {reach && (
            <p className="animate-fade-up delay-2 mt-2 text-sm text-paper/60">
              <Link href="/reach" className="transition-colors hover:text-ember">
                <T
                  en={`Cited by researchers in ${reach.fields} fields across ${reach.countries} countries`}
                  zh={`被 ${reach.countries} 个国家和地区、${reach.fields} 个领域的研究者引用`}
                />
                <span className="ml-1.5 text-xs text-paper/40">
                  <T
                    en={`(OpenAlex, lead-author papers, self-citations removed, ${reach.asOf}) →`}
                    zh={`（OpenAlex，第一/通讯作者论文，已剔除自引，${reach.asOf}）→`}
                  />
                </span>
              </Link>
            </p>
          )}

          {/* Decorative divider */}
          <div className="animate-draw-line delay-3 mt-8 h-px w-32 origin-left bg-ember" />

          {/* Primary actions */}
          <div className="animate-fade-up delay-4 mt-8 flex flex-wrap gap-3">
            <Link
              href="/atlas"
              className="rounded-md bg-ember px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ember-dark"
            >
              <T en="Explore the Atlas" zh="探索图集" />
            </Link>
            <Link
              href="/lab#join"
              className="rounded-md border border-paper/40 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:border-ember hover:text-ember"
            >
              <T en="Join the lab" zh="加入实验室" />
            </Link>
          </div>

          {/* Links row */}
          <div className="animate-fade-up delay-5 mt-6 flex flex-wrap gap-2.5">
            {[
              { en: "CV (PDF)", zh: "简历 (PDF)", href: "/CV_Kangning_Huang.pdf" },
              { en: "Google Scholar", zh: "谷歌学术", href: LINKS.googleScholar },
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

      {/* ── Key findings ── */}
      <section className="pb-4 pt-10 md:pt-12" aria-labelledby="findings-heading">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h2 id="findings-heading" className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
            <T en="Key findings" zh="主要发现" />
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {FINDINGS.map((f) => {
              const external = f.href.startsWith("http");
              return (
                <li key={f.href} className="flex">
                  <a
                    href={f.href}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="card-hover group flex flex-1 flex-col rounded-lg border border-rule bg-paper p-4"
                  >
                    <p className="flex-1 text-sm leading-relaxed text-ink transition-colors group-hover:text-ember">
                      <T en={f.en} zh={f.zh} />
                    </p>
                    <p className="mt-3 text-xs text-ink-faint">
                      <span className="italic">{f.venue}</span>, {f.year}
                      {external && (
                        <span className="ml-1 text-[10px] opacity-60">&#8599;</span>
                      )}
                    </p>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── About ── */}
      <section className="py-16 md:py-20" itemScope itemType="https://schema.org/Person" itemID="#person">
        <meta itemProp="name" content="Kangning (Ken) Huang" />
        <meta itemProp="jobTitle" content="Assistant Professor of Environmental Studies" />
        <meta itemProp="affiliation" content="NYU Shanghai" />
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h2 className="section-heading animate-fade-up">
            <T en="About" zh="关于" />
          </h2>

          <div className="mt-8 max-w-3xl space-y-4 animate-fade-up delay-1" itemProp="description">
            <T
              en={
                <p className="text-[15px] leading-[1.75] text-ink-muted">
                  I study cities as physical systems. My group, the CLUEs (CLimate and Urban Environments) Lab at <a href="https://shanghai.nyu.edu" target="_blank" rel="noopener noreferrer" className={extLink}>NYU Shanghai</a>, combines satellite data, climate models and causal inference across thousands of cities. We ask how the amount, height and arrangement of what we build shapes who overheats, who floods, and how much material a city consumes.
                </p>
              }
              zh={
                <p className="text-[15px] leading-[1.75] text-ink-muted">
                  我把城市当作物理系统来研究。我的课题组——<a href="https://shanghai.nyu.edu" target="_blank" rel="noopener noreferrer" className={extLink}>上海纽约大学</a>CLUEs（CLimate and Urban Environments）实验室——结合卫星数据、气候模型与因果推断，对全球数千座城市开展分析。我们关注的问题是：建成环境的总量、高度与布局，如何决定谁会遭受高温、谁会被洪水侵袭，以及一座城市要消耗多少材料。
                </p>
              }
            />
            <T
              en={
                <p className="text-[15px] leading-[1.75] text-ink-muted">
                  We have shown that larger cities need less built mass per person (<i>Nature Cities</i>, 2026), that urban expansion can locally rival greenhouse-gas warming by 2050 (<i>ERL</i>, 2019), and that taller, better-protected cities change where flood damage lands (<i>Scientific Reports</i>, 2026).
                </p>
              }
              zh={
                <p className="text-[15px] leading-[1.75] text-ink-muted">
                  我们的研究表明：城市越大，人均建成质量越少（<i>Nature Cities</i>，2026）；到2050年，城市扩张带来的局地增温可与温室气体增温相当（<i>ERL</i>，2019）；更高、防护更完善的城市会改变洪灾损失的空间分布（<i>Scientific Reports</i>，2026）。
                </p>
              }
            />
            <T
              en={
                <p className="text-[15px] leading-[1.75] text-ink-muted">
                  Before NYU Shanghai, I was an <a href="https://edec.ucar.edu/advanced-study-program/postdoctoral-fellowship-program" target="_blank" rel="noopener noreferrer" className={extLink}>Advanced Study Program Postdoctoral Fellow</a> at NCAR. I earned my PhD at the <a href="https://environment.yale.edu/" target="_blank" rel="noopener noreferrer" className={extLink}>Yale School of the Environment</a>.
                </p>
              }
              zh={
                <p className="text-[15px] leading-[1.75] text-ink-muted">
                  加入上海纽约大学之前，我在美国国家大气研究中心（NCAR）担任<a href="https://edec.ucar.edu/advanced-study-program/postdoctoral-fellowship-program" target="_blank" rel="noopener noreferrer" className={extLink}>高级研究项目（ASP）</a>博士后研究员。我在<a href="https://environment.yale.edu/" target="_blank" rel="noopener noreferrer" className={extLink}>耶鲁大学环境学院</a>获得博士学位。
                </p>
              }
            />
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

      {/* ── News ── */}
      <section className="pt-16 md:pt-20" aria-labelledby="news-heading">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 id="news-heading" className="section-heading flex-1">
              <T en="News" zh="动态" />
            </h2>
            <Link
              href="/news"
              className="link-underline ml-4 shrink-0 text-sm font-medium text-ember"
            >
              <T en="All news →" zh="全部动态 →" />
            </Link>
          </div>
          <ul className="mt-6 divide-y divide-rule-faint">
            {NEWS.slice(0, 3).map((item) => {
              const date = formatNewsDate(item.date);
              const external = item.href.startsWith("http");
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="group flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <time
                      dateTime={item.date}
                      className="shrink-0 text-xs font-medium uppercase tracking-wider text-ink-faint sm:w-20"
                    >
                      <T en={date.en} zh={date.zh} />
                    </time>
                    <span className="text-[15px] leading-snug text-ink transition-colors group-hover:text-ember">
                      <T en={item.en} zh={item.zh} />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
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

          <div className="mt-8 grid gap-5 md:grid-cols-2">
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
                <T en="Writing" zh="文章" />
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
                    alt={featuredPosts[0].title}
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
                en="I write about cities and climate on Substack."
                zh="我在Substack上撰写关于城市与气候的文章。"
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
