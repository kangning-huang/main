import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { CURRENT_MEMBERS, ALUMNI, POSTDOCS } from "@/lib/advisees";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import T from "@/components/T";

const DESCRIPTION =
  "The CLUEs (CLimate and Urban Environments) Lab at NYU Shanghai, led by Kangning (Ken) Huang: members, alumni, and how to join.";

// TODO(Ken): add supervision routes (undergrad RA, visiting, postdoc, PhD programs) and funding status when ready
const APPLY_SUBJECT = "[Join CLUEs]";

// Every outcome below appears on /advisees (src/lib/advisees.tsx).
const OUTCOMES: { en: string; zh: string }[] = [
  { en: "Erasmus Mundus International Master in Urban Studies", zh: "Erasmus Mundus 国际城市研究硕士项目" },
  { en: "Yale School of Public Health (M.S.)", zh: "耶鲁大学公共卫生学院（理学硕士）" },
  { en: "Penn Master of City Planning", zh: "宾夕法尼亚大学城市规划硕士" },
  { en: "Carnegie Mellon School of Computer Science (M.S.)", zh: "卡内基梅隆大学计算机科学学院（理学硕士）" },
  { en: "Clinton Global Initiative University Fellow", zh: "Clinton Global Initiative University（CGI U）Fellow" },
  { en: "Two Millennium Fellows", zh: "两名千禧年研究员" },
  { en: "Pingan Youth Inspiration Plan funding", zh: "平安青年励志计划资助" },
  { en: "Best presentation, NYU Shanghai symposium", zh: "上海纽约大学研讨会最佳报告奖" },
  { en: "Most Popular Project, Undergraduate Symposium (Fall 2025)", zh: "本科生研讨会最受欢迎项目奖（2025年秋季）" },
];

export const metadata: Metadata = {
  title: "Lab",
  description: DESCRIPTION,
  alternates: {
    canonical: canonicalUrl("/lab"),
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Lab"),
    description: DESCRIPTION,
    url: canonicalUrl("/lab"),
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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function LabPage() {
  const pageSchema = webPageSchema({
    path: "/lab",
    title: "Lab",
    description: DESCRIPTION,
  });

  const breadcrumbs = breadcrumbSchema([{ name: "Lab", path: "/lab" }]);

  const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent(`${APPLY_SUBJECT} `)}`;

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
            <T en="CLUEs Lab" zh="CLimate and Urban Environments（CLUEs）实验室" />
          </h1>
          <p className="mt-2 text-sm text-ink-faint animate-fade-up delay-1">
            <T
              en="CLimate and Urban Environments · NYU Shanghai"
              zh="CLimate and Urban Environments · 上海纽约大学"
            />
          </p>
          <p className="mt-5 max-w-3xl text-[15px] leading-[1.75] text-ink-muted animate-fade-up delay-1">
            <T
              en="The CLUEs (CLimate and Urban Environments) Lab at NYU Shanghai studies cities as complex socio-ecological systems shaped by interactions between human and natural systems. We combine satellite data, climate models, and causal inference to study thousands of cities. We ask how the amount, height, and spatial arrangement of the built environment affect heat exposure, flood risk, and material consumption."
              zh="城市是复杂的社会—生态系统，受到人类活动与自然环境相互作用的影响。上海纽约大学 CLimate and Urban Environments（CLUEs）实验室研究这些相互作用。我们结合卫星数据、气候模型和因果推断，分析全球数千座城市，研究建成环境的总量、高度与空间布局如何影响人口热暴露、洪水风险和材料消耗。"
            />
          </p>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.75] text-ink-muted animate-fade-up delay-2">
            <T
              en={
                <>
                  Recent findings include nested economies of scale in global city mass (<a href="https://doi.org/10.1038/s44284-026-00532-x" className="link-underline font-medium text-ember">Nature Cities, 2026</a>) and an association between larger homogeneous functional building clusters and lower daytime urban heat island intensity (<a href="https://doi.org/10.1073/pnas.2617717123" className="link-underline font-medium text-ember">PNAS, 2026</a>).
                </>
              }
              zh={
                <>
                  近期研究发现，全球城市建成质量存在嵌套规模经济（<a href="https://doi.org/10.1038/s44284-026-00532-x" className="link-underline font-medium text-ember">Nature Cities, 2026</a>）。更大的均质功能建筑集群与更低的白天城市热岛强度相关（<a href="https://doi.org/10.1073/pnas.2617717123" className="link-underline font-medium text-ember">PNAS, 2026</a>）。
                </>
              }
            />
          </p>

          {/* ── Current members ── */}
          <h2 id="members" className="mt-14 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Current members" zh="当前成员" />
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {POSTDOCS.map((m) => (
              <article key={m.name} className="flex gap-4 rounded-xl border border-rule bg-paper p-5">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ember-light font-display text-lg text-ember-dark"
                >
                  {initials(m.name)}
                </span>
                <div>
                  <h3 className="font-display text-lg text-ink">{m.name}</h3>
                  <p className="text-xs text-ink-faint">
                    <T en={m.roleEn} zh={m.roleZh} />
                  </p>
                  {m.project && m.projectZh ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      <T en={m.project} zh={m.projectZh} />
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
            {CURRENT_MEMBERS.map((m) => (
              <article key={m.name} className="flex gap-4 rounded-xl border border-rule bg-paper p-5">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ember-light font-display text-lg text-ember-dark"
                >
                  {initials(m.name)}
                </span>
                <div>
                  <h3 className="font-display text-lg text-ink">{m.name}</h3>
                  <p className="text-xs text-ink-faint">
                    <T
                      en={`Undergraduate · Class of ${m.classYear}`}
                      zh={`本科生 · ${m.classYear}届`}
                    />
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    <T en={m.project} zh={m.projectZh} />
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* ── Outcomes strip ── */}
          <h2 id="outcomes" className="mt-14 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Where students have gone" zh="学生去向" />
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {OUTCOMES.map((o) => (
              <li
                key={o.en}
                className="rounded-full border border-teal/30 bg-teal-light px-3 py-1 text-xs font-medium text-teal"
              >
                <T en={o.en} zh={o.zh} />
              </li>
            ))}
          </ul>

          {/* ── Alumni ── */}
          <h2 id="alumni" className="mt-14 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Alumni" zh="往届成员" />
          </h2>
          <ul className="mt-5 divide-y divide-rule-faint border-y border-rule-faint">
            {ALUMNI.map((a) => (
              <li key={a.name} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="shrink-0 font-display text-[15px] text-ink sm:w-44">
                  {a.name}
                  <span className="ml-2 text-xs text-ink-faint">&rsquo;{String(a.classYear).slice(2)}</span>
                </span>
                <div className="text-sm leading-relaxed text-ink-muted">
                  <T en={a.project} zh={a.projectZh} />
                  {a.achievements.length > 0 && (
                    <T
                      en={
                        <ul className="mt-1 space-y-0.5 text-xs">
                          {a.achievements.map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      }
                      zh={
                        <ul className="mt-1 space-y-0.5 text-xs">
                          {a.achievementsZh.map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      }
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            <Link href="/advisees" className="link-underline font-medium text-ember">
              <T en="View all advisees, projects, and placements →" zh="查看全部指导学生、项目与去向 →" />
            </Link>
          </p>

          {/* ── Join us ── */}
          <section
            id="join"
            aria-labelledby="join-heading"
            className="mt-16 scroll-mt-24 rounded-xl border border-rule bg-paper-warm p-6 md:p-8"
          >
            <h2 id="join-heading" className="font-display text-2xl text-ink">
              <T en="Join us" zh="加入我们" />
            </h2>

            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                  <T en="Who we are looking for" zh="我们希望招募的学生" />
                </h3>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-muted">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                    <T
                      en="You want to measure urban growth, heat, flooding, or material consumption, rather than only describe them."
                      zh="你希望用数据量化城市增长、高温、洪水或材料消耗，而不只是描述这些现象。"
                    />
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                    <T
                      en="You have experience with Google Earth Engine, Python, or causal inference, or are willing to learn through a research project."
                      zh="你已经掌握 Google Earth Engine、Python 或因果推断方法，或者愿意在实际研究项目中学习。"
                    />
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                  <T en="How to apply" zh="如何申请" />
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                  <T
                    en={
                      <>
                        Email{" "}
                        <a href={mailto} className="link-underline font-medium text-ember">{SITE.email}</a>{" "}
                        with <code className="rounded bg-paper px-1 py-0.5 text-xs text-ink">{APPLY_SUBJECT}</code> in the subject line. Include the following materials:
                      </>
                    }
                    zh={
                      <>
                        请发送邮件至{" "}
                        <a href={mailto} className="link-underline font-medium text-ember">{SITE.email}</a>，并在邮件标题中注明 <code className="rounded bg-paper px-1 py-0.5 text-xs text-ink">{APPLY_SUBJECT}</code>。请附上以下材料：
                      </>
                    }
                  />
                </p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-ink-muted">
                  <li>
                    <T en="Your CV." zh="个人简历。" />
                  </li>
                  <li>
                    <T
                      en="A short note on the research questions you want to work on."
                      zh="简要说明你希望研究的问题。"
                    />
                  </li>
                  <li>
                    <T
                      en="One sample of your work (code, writing, or a map)."
                      zh="一份作品样本，可以是代码、文章或地图。"
                    />
                  </li>
                </ol>
              </div>
            </div>

            <p className="mt-6 text-sm text-ink-faint">
              <T
                en="Funded openings are not listed here. Email to ask about current availability."
                zh="本页不列出有资助的职位。如需了解当前是否有名额，请发邮件咨询。"
              />
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
