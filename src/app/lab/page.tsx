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
            CLimate and Urban Environments · NYU Shanghai
          </p>
          <p className="mt-5 max-w-3xl text-[15px] leading-[1.75] text-ink-muted animate-fade-up delay-1">
            <T
              en="The CLUEs (CLimate and Urban Environments) Lab at NYU Shanghai studies cities as complex socio-ecological systems, the outcome of interactions between human and natural systems. We combine satellite data, climate models and causal inference across thousands of cities to ask how the amount, height and arrangement of what we build shapes who overheats, who floods, and how much material a city consumes."
              zh="城市是一个复杂社会—生态系统，人与自然在其中相互影响。上海纽约大学 CLimate and Urban Environments（CLUEs）实验室研究这些联系。建筑和基础设施建了多少、楼房有多高、怎样布局，会影响谁承受高温、谁遭遇洪水，也会影响城市消耗多少材料。我们结合卫星数据、气候模型与因果推断，分析全球数千座城市，想把这些关系弄清楚。"
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
              <T en="Full advisee list with projects and placements →" zh="查看全部指导学生、项目与去向 →" />
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
                  <T en="Who we look for" zh="我们在找谁" />
                </h3>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-muted">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                    <T
                      en="You want to measure how cities grow, heat, flood, or consume materials, not only to describe them."
                      zh="你想用数据量化城市增长、升温、洪涝或材料消耗，不只描述现象。"
                    />
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                    <T
                      en="You already use Google Earth Engine, Python, or causal inference, or you are ready to learn them on a real project."
                      zh="你已经会用 Google Earth Engine、Python 或因果推断方法，或者愿意在实际项目中边做边学。"
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
                        <a href={mailto} className="link-underline font-medium text-ember">
                          {SITE.email}
                        </a>{" "}
                        with <code className="rounded bg-paper px-1 py-0.5 text-xs text-ink">{APPLY_SUBJECT}</code> in the subject line. Attach your CV, a short note on the research questions you want to work on, and one sample of your work (code, writing, or a map).
                      </>
                    }
                    zh={
                      <>
                        请发送邮件至{" "}
                        <a href={mailto} className="link-underline font-medium text-ember">
                          {SITE.email}
                        </a>
                        ，邮件标题中注明 <code className="rounded bg-paper px-1 py-0.5 text-xs text-ink">{APPLY_SUBJECT}</code>，并附上：
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
                      zh="用几句话说说你想研究的问题。"
                    />
                  </li>
                  <li>
                    <T
                      en="One sample of your work (code, writing, or a map)."
                      zh="一份你的作品，代码、文章或地图都可以。"
                    />
                  </li>
                </ol>
              </div>
            </div>

            <p className="mt-6 text-sm text-ink-faint">
              <T
                en="Funded openings are not listed on this page. Email to ask what is open now."
                zh="这里不列出有资助的职位。想了解目前有哪些名额，请给我们发邮件。"
              />
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
