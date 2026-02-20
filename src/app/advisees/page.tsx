import { SITE } from "@/lib/constants";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { canonicalUrl, webPageSchema } from "@/lib/seo";
import T from "@/components/T";

export const metadata: Metadata = {
  title: "Advisees",
  description:
    "Students mentored by Kangning Huang at NYU Shanghai, including capstone projects, research achievements, and graduate placements.",
  alternates: {
    canonical: canonicalUrl("/advisees"),
  },
  openGraph: {
    title: "Advisees",
    description:
      "Students mentored by Kangning Huang at NYU Shanghai, including capstone projects, research achievements, and graduate placements.",
    url: canonicalUrl("/advisees"),
  },
};

interface Advisee {
  name: string;
  classYear: number;
  project: string;
  projectZh: string;
  achievements: ReactNode[];
  achievementsZh: ReactNode[];
  linkedin?: string;
}

const ADVISEES: Advisee[] = [
  {
    name: "John Nabors",
    classYear: 2024,
    project:
      "Capstone replicating and extending the \"Nested economies of scale in global city mass\" analysis across four Chinese mega-cities.",
    projectZh:
      "毕业论文复制并扩展《全球城市建成质量的嵌套规模经济》分析，应用于四个中国超大城市。",
    achievements: [],
    achievementsZh: [],
    linkedin: "https://www.linkedin.com/in/john-nabors",
  },
  {
    name: "Zijie Huanglin",
    classYear: 2023,
    project:
      "Honors capstone on urban heat risks in Chongqing using remote sensing and spatial analysis.",
    projectZh:
      "荣誉毕业论文，利用遥感和空间分析研究重庆城市高温风险。",
    achievements: [
      <>Admitted to <a href="https://shanghai.nyu.edu/news/nyu-shanghai-senior-wins-erasmus-mundus-scholarship" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Erasmus Mundus International Master in Urban Studies</a> (University of Glasgow, Universitat Autònoma de Barcelona, Kyoto University)</>,
    ],
    achievementsZh: [
      <>被<a href="https://shanghai.nyu.edu/news/nyu-shanghai-senior-wins-erasmus-mundus-scholarship" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Erasmus Mundus国际城市研究硕士项目</a>录取（格拉斯哥大学、巴塞罗那自治大学、京都大学）</>,
    ],
    linkedin: "https://www.linkedin.com/in/jacky-hwang/",
  },
  {
    name: "Connie Hu",
    classYear: 2025,
    project:
      "Capstone extending urban scaling analysis with machine learning to identify factors explaining deviations from urban scaling patterns.",
    projectZh:
      "毕业论文运用机器学习扩展城市标度分析，识别城市标度模式偏差的解释因素。",
    achievements: [],
    achievementsZh: [],
    linkedin: "https://www.linkedin.com/in/conniehu25",
  },
  {
    name: "Ziyun Xu",
    classYear: 2025,
    project:
      "Research on extreme heat exposure and urban mobility in Shanghai.",
    projectZh:
      "关于上海极端高温暴露与城市出行的研究。",
    achievements: [
      "Secured Pingan Youth Inspiration Plan funding",
      "Best presentation award at NYU Shanghai symposium",
      <>Admitted to <a href="https://ysph.yale.edu/school-of-public-health/" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Yale School of Public Health</a> (M.S.)</>,
    ],
    achievementsZh: [
      "获得平安青年励志计划资助",
      "上海纽约大学研讨会最佳报告奖",
      <>被<a href="https://ysph.yale.edu/school-of-public-health/" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">耶鲁大学公共卫生学院</a>录取（硕士）</>,
    ],
    linkedin: "https://www.linkedin.com/in/ziyun-xu-45804a226/",
  },
  {
    name: "Zihan Xu",
    classYear: 2025,
    project:
      "Capstone on pocket park accessibility and equitable green space distribution in Shanghai.",
    projectZh:
      "毕业论文研究上海口袋公园可达性与绿地公平分配。",
    achievements: [
      <>Admitted to <a href="https://www.design.upenn.edu/city-regional-planning/graduate/graduate-city-and-regional-planning-programs" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">University of Pennsylvania (Master of City Planning)</a></>,
    ],
    achievementsZh: [
      <>被<a href="https://www.design.upenn.edu/city-regional-planning/graduate/graduate-city-and-regional-planning-programs" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">宾夕法尼亚大学城市规划硕士项目</a>录取</>,
    ],
    linkedin: "https://www.linkedin.com/in/zihan-xu-1a548a227/",
  },
  {
    name: "Lihan Feng",
    classYear: 2025,
    project:
      "Developed rapid flood monitoring algorithm using Sentinel-1 SAR data on Google Earth Engine.",
    projectZh:
      "在Google Earth Engine上使用Sentinel-1 SAR数据开发快速洪水监测算法。",
    achievements: [
      'Co-authored published paper in Remote Sensing: "Rapid Probabilistic Inundation Mapping Using Local Thresholds and Sentinel-1 SAR Data on Google Earth Engine"',
      <>Admitted to <a href="https://www.cs.cmu.edu/academics/masters/programs" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Carnegie Mellon University School of Computer Science</a> (M.S.)</>,
    ],
    achievementsZh: [
      '在Remote Sensing合著发表论文："Rapid Probabilistic Inundation Mapping Using Local Thresholds and Sentinel-1 SAR Data on Google Earth Engine"',
      <>被<a href="https://www.cs.cmu.edu/academics/masters/programs" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">卡内基梅隆大学计算机科学学院</a>录取（硕士）</>,
    ],
    linkedin: "https://www.linkedin.com/in/lihan-feng-a04b46223/",
  },
  {
    name: "Mingya Zhang",
    classYear: 2026,
    project:
      "Research on low-carbon transport time penalties in Shanghai.",
    projectZh:
      "关于上海低碳出行时间代价的研究。",
    achievements: [
      <>Selected as <a href="https://www.clintonfoundation.org/programs/leadership-public-service/clinton-global-initiative-university/" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Clinton Global Initiative University (CGI U)</a> Fellow</>,
    ],
    achievementsZh: [
      <>入选<a href="https://www.clintonfoundation.org/programs/leadership-public-service/clinton-global-initiative-university/" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">克林顿全球倡议大学 (CGI U)</a> 研究员</>,
    ],
  },
  {
    name: "Gabriel Fernandes",
    classYear: 2027,
    project:
      "Research on urban slum heat mitigation in Rio de Janeiro.",
    projectZh:
      "关于里约热内卢城市贫民区高温缓解的研究。",
    achievements: [
      <>Selected as <a href="https://shanghai.nyu.edu/news/students-make-change-millennium-fellowship" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Millennium Fellow</a> (<a href="https://www.un.org/en/academic-impact/millennium-fellowship-class-2025-over-4000-young-leaders-making-sdgs-and-unai" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">United Nations Academic Impact</a>)</>,
      "Most Popular Project, Undergraduate Symposium, NYU Shanghai (Fall 2025)",
    ],
    achievementsZh: [
      <>入选<a href="https://shanghai.nyu.edu/news/students-make-change-millennium-fellowship" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">千禧年研究员</a>（<a href="https://www.un.org/en/academic-impact/millennium-fellowship-class-2025-over-4000-young-leaders-making-sdgs-and-unai" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">联合国学术影响力</a>）</>,
      "上海纽约大学本科生研讨会最受欢迎项目奖（2025年秋季）",
    ],
    linkedin: "https://www.linkedin.com/in/gabriel-fernandes-26a1651b4/",
  },
];

export default function AdviseesPage() {
  const pageSchema = webPageSchema({
    path: "/advisees",
    title: "Advisees",
    description:
      "Students mentored by Kangning Huang at NYU Shanghai, including capstone projects, research achievements, and graduate placements.",
  });

  return (
    <>
      <Script
        id="jsonld-advisees"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h1 className="section-heading animate-fade-up">
            <T en="Advisees" zh="指导学生" />
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
            <T
              en="I mentor undergraduate students at NYU Shanghai through capstones, research projects, and fellowships, with emphasis on research design, methods training, iterative feedback, and professional communication."
              zh="我在上海纽约大学通过毕业论文、研究项目和奖学金指导本科生，注重研究设计、方法训练、反复反馈和学术沟通能力的培养。"
            />
          </p>

          <div className="mt-12 space-y-8">
            {ADVISEES.map((advisee, i) => (
              <article
                key={advisee.name}
                className="animate-fade-up rounded-xl border border-rule bg-paper p-6 transition-shadow hover:shadow-md"
                style={{ animationDelay: `${(i + 2) * 100}ms` }}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-display text-xl text-ink">
                    {advisee.name}
                  </h2>
                  {advisee.linkedin && (
                    <a
                      href={advisee.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline text-sm text-ember hover:text-ember-dark transition-colors"
                    >
                      LinkedIn &#8599;
                    </a>
                  )}
                  <span className="rounded-full bg-paper-warm px-2.5 py-0.5 text-xs text-ink-faint">
                    <T
                      en={`Class of ${advisee.classYear}`}
                      zh={`${advisee.classYear}届`}
                    />
                  </span>
                </div>

                <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                  <T en={advisee.project} zh={advisee.projectZh} />
                </p>

                <T
                  en={
                    <ul className="mt-3 space-y-1.5">
                      {advisee.achievements.map((achievement, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-sm text-ink-muted"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  }
                  zh={
                    <ul className="mt-3 space-y-1.5">
                      {advisee.achievementsZh.map((achievement, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-sm text-ink-muted"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  }
                />
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
