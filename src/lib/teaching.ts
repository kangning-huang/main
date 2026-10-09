/**
 * Teaching page data.
 *
 * SOURCE OF TRUTH: docs/teaching-sources.md (verified 2026-10-09) plus the
 * syllabi it cites, and the existing "Teaching Experience" section of
 * cv/CV_Kangning_Huang.tex. Do NOT add course codes, terms, awards, student
 * names, or URLs that are not evidenced there.
 *
 * Official Chinese course titles and the official Chinese name of the award
 * have not been verified, so ZH mode keeps the English proper names and only
 * translates descriptions.
 */

export interface Bilingual {
  en: string;
  zh: string;
}

export interface Course {
  code: string;
  /** Official English title as it appears on the syllabus. */
  title: string;
  /** Official Chinese title when verified (e.g. NYU Shanghai Chinese pages). */
  titleZh?: string;
  /** Terms evidenced by the CV and/or a syllabus. */
  terms: Bilingual;
  /** Course-level role, e.g. CORE gateway. Optional; only if in syllabus. */
  tag?: Bilingual;
  summary: Bilingual;
  /** Assessment / activity highlights, only as written in the syllabus. */
  highlights: Bilingual[];
  /**
   * Public syllabus link, only where Ken already publishes one (CV links).
   * These point at earlier-term versions; see PR notes.
   */
  syllabusUrl?: string;
  /** Recognition attached to this course (verified, with attribution). */
  recognition?: Bilingual;
}

export const COURSES: Course[] = [
  {
    code: "SOCS-SHU 135",
    title: "Environment and Society",
    terms: { en: "Fall 2026", zh: "2026年秋季" },
    tag: { en: "CORE STS gateway", zh: "CORE STS 通识入门课" },
    summary: {
      en: "Introduces environmental thought through six structured debate cycles on contested motions: nature, movements, population, the commons, values, and technological futures.",
      zh: "以六轮结构化辩论为主线，围绕自然、环保运动、人口、公地、价值观与技术未来六个争议议题，引导学生进入环境思想。",
    },
    highlights: [
      {
        en: "Six two-week debate cycles with randomly assigned For/Against sides",
        zh: "六个为期两周的辩论周期，正反方随机分配",
      },
      {
        en: "IPAT quantitative lab and a classroom Public Goods Game",
        zh: "IPAT 定量实验课与课堂公共物品博弈",
      },
      {
        en: "Final project applying course ideas to one real-world environmental issue",
        zh: "期末项目：用课程核心观点分析一个真实的环境议题",
      },
    ],
  },
  {
    code: "SOCS-SHU 204",
    title: "Environmental System Science",
    terms: { en: "2022–2025 · Fall 2026", zh: "2022–2025 · 2026年秋季" },
    tag: { en: "Environmental Studies gateway", zh: "环境研究方向入门课" },
    summary: {
      en: "A systems-science survey of energy and material flows, dynamics, footprints, and environmental change: one of the two gateway courses in the Environmental Studies track.",
      zh: "从系统科学视角综览能量与物质流动、系统动力学、生态足迹与环境变化，是社会科学环境研究方向的两门入门课之一。",
    },
    highlights: [
      {
        en: "Six problem sets: population, prey–predator, S-curve growth, IPAT, personal energy footprint, resource-constrained growth",
        zh: "六次习题：人口动态、捕食者–猎物、S 型增长、IPAT、个人能源足迹、资源约束下的增长",
      },
      {
        en: "Mid-term presentation on the climate, biome, and environmental change of a student's hometown",
        zh: "期中报告：解析家乡的气候、生物群系与环境变化",
      },
      {
        en: "Final presentation and report on a contemporary environmental challenge",
        zh: "期末报告：分析一项当代重大环境挑战",
      },
    ],
    syllabusUrl:
      "https://docs.google.com/document/d/e/2PACX-1vSnLH1DcYAtjhmYVq1k46Zb8-aDYIfBsZWCInBYVJuLiYnjSO0hxBMZq8wBz-8n4p8Utt2J9_5mUK03/pub",
  },
  {
    code: "SOCS-SHU 208",
    title: "Cities at a Crossroads: Environmental Challenges and Opportunities in Cities",
    /** Chinese title as used on shanghai.nyu.edu/cn TEA coverage. */
    titleZh: "城市十字路口：城市的环境挑战与机遇",
    terms: { en: "2022–2025 · Spring 2026", zh: "2022–2025 · 2026年春季" },
    summary: {
      en: "Urban environmental challenges and opportunities across energy, heat, water, food, materials, and land, with spatial data skills and city-focused policy projects.",
      zh: "围绕能源、高温、水、食物、材料与土地，探讨城市面临的环境挑战与机遇，并训练空间数据技能、完成以城市为对象的政策项目。",
    },
    highlights: [
      { en: "Weekly analytical reports", zh: "每周分析报告" },
      { en: "Field-trip report", zh: "实地考察报告" },
      {
        en: "Group final city policy report (Tableau / Google Earth Engine optional)",
        zh: "小组期末城市政策报告（可选用 Tableau / Google Earth Engine）",
      },
    ],
    syllabusUrl:
      "https://docs.google.com/document/d/e/2PACX-1vTrhXo9OGMOFASQhge4gDUPwET_PLufDlfaA2kwZhVEZIc9VCMPkc0FkQl9ORC8Z2VgpaxWGg1gcrUW/pub",
    recognition: {
      en: "Shanghai City-Level Undergraduate Key Course (2025)",
      zh: "上海高校市级重点课程（2025）",
    },
  },
];

/** Signature methods, each traceable to a line in the SOCS-SHU 135 syllabus (Fall 2026 draft). */
export const SIGNATURE_METHODS: { title: Bilingual; body: Bilingual }[] = [
  {
    title: { en: "Assigned-side debates", zh: "指定立场辩论" },
    body: {
      en: "Six debate cycles. Each cycle the class is randomly split into For and Against teams, and every member speaks. Defending a position you didn't choose is the fastest way to understand it.",
      zh: "全学期六轮辩论，每轮随机分为正反两方，每位成员都要发言。为自己未必认同的立场辩护，是理解它最快的方式。",
    },
  },
  {
    title: { en: "Pre- and post-debate ballots", zh: "辩论前后匿名投票" },
    body: {
      en: "Everyone records an honest position on paper, anonymously, before and after each debate. The side that moves the ballot “wins”; argument quality is graded separately by rubric.",
      zh: "每场辩论前后，所有人在纸上匿名记录自己的真实立场。能让票数发生移动的一方即为“胜方”；论证质量另按评分标准评定。",
    },
  },
  {
    title: { en: "Device-free floor", zh: "无设备辩论现场" },
    body: {
      en: "Evidence decks freeze 24 hours before each debate, and the floor is device-free. Preparation may use any tool, including AI; performance is live and unassisted.",
      zh: "证据幻灯片在辩论前 24 小时冻结，辩论现场不使用任何电子设备。准备阶段可以使用包括 AI 在内的任何工具，现场表现则必须独立完成。",
    },
  },
  {
    title: { en: "IPAT lab", zh: "IPAT 定量实验" },
    body: {
      en: "In pairs, students compute emissions for two countries and project them to 2050 under three scenarios. Their results become evidence for the population-and-consumption debate.",
      zh: "学生两人一组，计算两个国家的排放并在三种情景下预测至 2050 年，结果直接用作“人口与消费”辩论的证据。",
    },
  },
  {
    title: { en: "Public Goods Game", zh: "公共物品博弈" },
    body: {
      en: "A multi-round classroom game, first anonymous and then with communication. The class's own cooperation data feeds the debate on the commons.",
      zh: "多轮课堂博弈，先匿名进行，再允许交流。全班自己的合作数据成为“公地”辩论的证据。",
    },
  },
  {
    title: { en: "Chart openers & one-minute closers", zh: "图表开场与一分钟收尾" },
    body: {
      en: "Each class opens with an unlabeled environmental chart to guess, reveal, and critique, and closes with a one-sentence statement of where you now stand on the motion.",
      zh: "每节课以一张无标注的环境图表开场：先猜、再揭晓、再评析；结束时每人用一句话写下自己当前对辩题的立场以及改变立场的原因。",
    },
  },
];

export const TEA_AWARD = {
  name: "NYU Shanghai Teaching Excellence Award",
  /** Official Chinese name as used on shanghai.nyu.edu/cn TEA coverage. */
  nameZh: "上海纽约大学卓越教学奖",
  cycle: "2025–2026",
  programUrl: "https://shanghai.nyu.edu/content/nyu-shanghai-teaching-excellence-award",
  storyUrlEn: "https://shanghai.nyu.edu/is/ai-age-how-do-great-teachers-teach",
  storyUrlZh: "https://shanghai.nyu.edu/cn/is/ai-age-how-do-great-teachers-teach",
} as const;
