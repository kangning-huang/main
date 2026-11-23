import Link from "next/link";
import type { Metadata } from "next";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import { COURSES } from "@/lib/teaching";
import T from "@/components/T";
import CourseCard from "@/components/teaching/CourseCard";
import SignatureMethods from "@/components/teaching/SignatureMethods";
import AwardBlock from "@/components/teaching/AwardBlock";
import StatementDraft from "@/components/teaching/StatementDraft";

const DESCRIPTION =
  "Kangning (Ken) Huang, NYU Shanghai: Environment and Society, Environmental System Science, and Cities at a Crossroads. 2025–2026 Teaching Excellence Award.";

export const metadata: Metadata = {
  title: "Teaching",
  description: DESCRIPTION,
  alternates: {
    canonical: canonicalUrl("/teaching"),
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Teaching"),
    description: DESCRIPTION,
    url: canonicalUrl("/teaching"),
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

export default function TeachingPage() {
  const pageSchema = webPageSchema({
    path: "/teaching",
    title: "Teaching",
    description: DESCRIPTION,
  });

  const breadcrumbs = breadcrumbSchema([{ name: "Teaching", path: "/teaching" }]);

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
            <T en="Teaching" zh="教学" />
          </h1>
          <p className="mt-5 max-w-3xl text-[15px] leading-[1.75] text-ink-muted animate-fade-up delay-1">
            <T
              en="I teach three environmental studies courses at NYU Shanghai. They introduce environmental thought through debate, environmental systems through scientific models, and the environmental challenges and opportunities of cities."
              zh="我在上海纽约大学教授三门环境研究课程，分别从环境思想、系统科学和城市环境问题三个角度展开。学生通过辩论理解不同的环境观点，学习系统科学方法，并分析城市面临的环境挑战与机遇。"
            />
          </p>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.75] text-ink-muted animate-fade-up delay-1">
            <T
              en={
                <>
                  When students only need to open a dataset on a map, I use{" "}
                  <a
                    href="https://nimblemap.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline font-medium text-ember"
                  >NimbleMap</a>{" "}
                  so they do not need to install a full GIS.
                </>
              }
              zh={
                <>
                  如果学生只需要把数据文件显示在地图上，我会推荐{" "}
                  <a
                    href="https://nimblemap.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline font-medium text-ember"
                  >凌波微图（NimbleMap）</a>，不必先安装完整的 GIS 软件。
                </>
              }
            />
          </p>

          <AwardBlock />

          {/* ── Courses ── */}
          <h2 id="courses" className="mt-16 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Courses" zh="课程" />
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {COURSES.map((c) => (
              <CourseCard key={c.code} course={c} />
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink-faint">
            <T
              en="Course readings are distributed to enrolled students through Brightspace and are not posted here."
              zh="课程阅读材料通过 Brightspace 发给选课学生，不在本站公开。"
            />
          </p>

          {/* ── Signature methods ── */}
          <h2 id="methods" className="mt-16 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Teaching methods" zh="教学方法" />
          </h2>
          <SignatureMethods />

          {/* ── Student work ── */}
          <h2 id="student-work" className="mt-16 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Student work" zh="学生作品" />
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
            <T
              en="Outside class, I supervise undergraduate capstones and research projects through the CLUEs Lab. The lab and advisee pages list student projects, placements, and honors."
              zh="课外，我通过 CLimate and Urban Environments（CLUEs）实验室指导本科毕业论文和研究项目。学生的研究项目、毕业去向和所获荣誉可在实验室及指导学生页面查看。"
            />
          </p>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/advisees" className="link-underline font-medium text-ember">
              <T en="Capstones & advisees →" zh="毕业项目与指导学生 →" />
            </Link>
            <Link href="/lab" className="link-underline font-medium text-ember">
              <T en="CLUEs Lab →" zh="CLimate and Urban Environments（CLUEs）实验室 →" />
            </Link>
          </p>

          <StatementDraft />
        </div>
      </section>
    </>
  );
}
