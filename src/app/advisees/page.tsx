import { SITE } from "@/lib/constants";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: `Advisees – ${SITE.name}`,
  description:
    "Students mentored by Kangning Huang at NYU Shanghai, with their research projects, achievements, and graduate school placements.",
};

interface Advisee {
  name: string;
  classYear: number;
  project: string;
  achievements: ReactNode[];
  linkedin?: string;
}

const ADVISEES: Advisee[] = [
  {
    name: "John Nabors",
    classYear: 2024,
    project:
      "Capstone replicating and extending the \"Nested economies of scale in global city mass\" analysis across four Chinese mega-cities.",
    achievements: [],
    linkedin: "https://www.linkedin.com/in/john-nabors",
  },
  {
    name: "Zijie Huanglin",
    classYear: 2023,
    project:
      "Honors capstone on urban heat risks in Chongqing using remote sensing and spatial analysis.",
    achievements: [
      <>Admitted to <a href="https://shanghai.nyu.edu/news/nyu-shanghai-senior-wins-erasmus-mundus-scholarship" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Erasmus Mundus International Master in Urban Studies</a> (University of Glasgow, Universitat Autònoma de Barcelona, Kyoto University)</>,
    ],
    linkedin: "https://www.linkedin.com/in/jacky-hwang/",
  },
  {
    name: "Connie Hu",
    classYear: 2025,
    project:
      "Capstone extending urban scaling analysis with machine learning to identify factors explaining deviations from urban scaling patterns.",
    achievements: [],
    linkedin: "https://www.linkedin.com/in/conniehu25",
  },
  {
    name: "Ziyun Xu",
    classYear: 2025,
    project:
      "Research on extreme heat exposure and urban mobility in Shanghai.",
    achievements: [
      "Secured Pingan Youth Inspiration Plan funding",
      "Best presentation award at NYU Shanghai symposium",
      <>Admitted to <a href="https://ysph.yale.edu/school-of-public-health/" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Yale School of Public Health</a> (M.S.)</>,
    ],
    linkedin: "https://www.linkedin.com/in/ziyun-xu-45804a226/",
  },
  {
    name: "Zihan Xu",
    classYear: 2025,
    project:
      "Capstone on pocket park accessibility and equitable green space distribution in Shanghai.",
    achievements: [
      <>Admitted to <a href="https://www.design.upenn.edu/city-regional-planning/graduate/graduate-city-and-regional-planning-programs" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">University of Pennsylvania (Master of City Planning)</a></>,
    ],
    linkedin: "https://www.linkedin.com/in/zihan-xu-1a548a227/",
  },
  {
    name: "Lihan Feng",
    classYear: 2025,
    project:
      "Developed rapid flood monitoring algorithm using Sentinel-1 SAR data on Google Earth Engine.",
    achievements: [
      'Co-authored published paper in Remote Sensing: "Rapid Probabilistic Inundation Mapping Using Local Thresholds and Sentinel-1 SAR Data on Google Earth Engine"',
      <>Admitted to <a href="https://www.cs.cmu.edu/academics/masters/programs" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Carnegie Mellon University School of Computer Science</a> (M.S.)</>,
    ],
    linkedin: "https://www.linkedin.com/in/lihan-feng-a04b46223/",
  },
  {
    name: "Mingya Zhang",
    classYear: 2026,
    project:
      "Research on low-carbon transport time penalties in Shanghai.",
    achievements: [
      <>Selected as <a href="https://www.clintonfoundation.org/programs/leadership-public-service/clinton-global-initiative-university/" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Clinton Global Initiative University (CGI U)</a> Fellow</>,
    ],
  },
  {
    name: "Gabriel Fernandes",
    classYear: 2027,
    project:
      "Research on urban slum heat mitigation in Rio de Janeiro.",
    achievements: [
      <>Selected as <a href="https://shanghai.nyu.edu/news/students-make-change-millennium-fellowship" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">Millennium Fellow</a> (<a href="https://www.un.org/en/academic-impact/millennium-fellowship-class-2025-over-4000-young-leaders-making-sdgs-and-unai" target="_blank" rel="noopener noreferrer" className="link-underline text-ember hover:text-ember-dark transition-colors">United Nations Academic Impact</a>)</>,
      "Most Popular Project, Undergraduate Symposium, NYU Shanghai (Fall 2025)",
    ],
    linkedin: "https://www.linkedin.com/in/gabriel-fernandes-26a1651b4/",
  },
];

export default function AdviseesPage() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <h1 className="section-heading animate-fade-up">Advisees</h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
          I mentor undergraduate students at NYU Shanghai through capstones,
          research projects, and fellowships, with emphasis on research design,
          methods training, iterative feedback, and professional communication.
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
                  Class of {advisee.classYear}
                </span>
              </div>

              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                {advisee.project}
              </p>

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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
