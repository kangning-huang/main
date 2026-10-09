import type { ReactNode } from "react";
import T from "@/components/T";
import { TEA_AWARD } from "@/lib/teaching";

const linkClass = "link-underline font-medium text-ember";

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
      <span className="ml-1 text-[10px] opacity-60">&#8599;</span>
    </a>
  );
}

/**
 * Verified facts only (docs/teaching-sources.md): award name, 2025–2026 cycle,
 * the observed course (SOCS-SHU 208), and the 2025 municipal key-course
 * recognition, attributed to NYU Shanghai's own announcement and story.
 */
export default function AwardBlock() {
  return (
    <section
      id="award"
      aria-labelledby="award-heading"
      className="relative mt-10 scroll-mt-24 overflow-hidden rounded-xl border border-ember/25 bg-ember-light p-6 md:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ember-dark">
        <T en={`Award · ${TEA_AWARD.cycle}`} zh={`获奖 · ${TEA_AWARD.cycle}`} />
      </p>
      <h2 id="award-heading" className="mt-2 font-display text-2xl text-ink md:text-3xl">
        <T en={TEA_AWARD.name} zh={TEA_AWARD.nameZh} />
      </h2>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
        <T
          en={
            <>
              Recognized in the {TEA_AWARD.cycle} cycle. The classroom observation was of{" "}
              <em>Cities at a Crossroads</em> (SOCS-SHU 208), which NYU Shanghai also notes was named a
              Shanghai City-Level Undergraduate Key Course in 2025.
            </>
          }
          zh={
            <>
              {TEA_AWARD.cycle}{" "}
              年度获奖。课堂观摩课程为《城市十字路口：城市的环境挑战与机遇》（SOCS-SHU 208）；据上海纽约大学介绍，该课程于
              2025 年入选上海高校市级重点课程。
            </>
          }
        />
      </p>
      <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Ext href={TEA_AWARD.programUrl}>
          <T en="Award program (NYU Shanghai)" zh="奖项介绍（上海纽约大学）" />
        </Ext>
        <T
          en={<Ext href={TEA_AWARD.storyUrlEn}>NYU Shanghai feature story</Ext>}
          zh={<Ext href={TEA_AWARD.storyUrlZh}>上海纽约大学专题报道</Ext>}
        />
      </p>
    </section>
  );
}
