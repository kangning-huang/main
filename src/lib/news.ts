import { publicationSlug } from "./constants";

export interface NewsItem {
  /** Month-level date, "YYYY-MM" */
  date: string;
  en: string;
  zh: string;
  href: string;
}

// Newest first. Mix of awards, students, grants, talks, and publication milestones.
export const NEWS: NewsItem[] = [
  {
    date: "2026-11",
    en: "Confirmed participant, SSP Urbanisation Workshop (WorldPop / University of Bristol).",
    zh: "确认参加世界人口项目（WorldPop）与布里斯托大学合办的 SSP 城市化工作坊。",
    href: "/news#ssp-workshop-2026",
  },
  {
    date: "2026-10",
    en: "“Toward Cooler Cities by Larger Homogeneous Functional Clusters” scheduled for publication the week of 19 Oct 2026 in PNAS.",
    zh: "论文《通过更大的同质功能集群建设更凉爽的城市》定于 2026 年 10 月 19 日当周在 PNAS 发表。",
    // Still in press — no DOI yet; link to on-site entry
    href: `/publications#${publicationSlug("Toward Cooler Cities by Larger Homogeneous Functional Clusters")}`,
  },
  {
    date: "2026-10",
    en: "Hosting Prof. Timon McPhearson (Urban Systems Lab / NYU) for a guest talk at NYU Shanghai.",
    zh: "在上海纽约大学邀请 Urban Systems Lab / NYU 的 Timon McPhearson 教授做学术报告。",
    href: "/news#mcphearson-2026",
  },
  {
    date: "2026-09",
    en: "Received the 2025–2026 NYU Shanghai Teaching Excellence Award; featured in “In the AI Age, How Do Great Teachers Teach?”",
    zh: "获评 2025–2026 学年上海纽约大学卓越教学奖，并见诸专访《AI 时代，优秀教师如何教书？》。",
    href: "https://shanghai.nyu.edu/is/ai-age-how-do-great-teachers-teach",
  },
  {
    date: "2026-09",
    en: "“Nested economies of scale in global city mass” is in press at Nature Cities.",
    zh: "我的论文《全球城市建成质量的嵌套规模经济》已被 Nature Cities 接收，即将发表。",
    // In press — link to the on-site entry, not a DOI (doi.org still 404)
    href: `/publications#${publicationSlug("Nested economies of scale in global city mass")}`,
  },
  {
    date: "2026-09",
    en: "“Toward Cooler Cities by Larger Homogeneous Functional Clusters” is in press at PNAS.",
    zh: "论文《通过更大的同质功能集群建设更凉爽的城市》已获 PNAS 接收，待刊。",
    href: `/publications#${publicationSlug("Toward Cooler Cities by Larger Homogeneous Functional Clusters")}`,
  },
  {
    date: "2026-09",
    en: "Height-aware, protection-informed flood assessment published in Scientific Reports.",
    zh: "将建筑高度和防洪标准纳入洪水评估的研究，已发表于 Scientific Reports。",
    href: "https://doi.org/10.1038/s41598-026-70981-w",
  },
  {
    date: "2026-09",
    en: "China Fund grant (Co-PI with Mingzhen Lu): “Boom or bust: accessibility tipping point underlying divergent urban transitions in China.”",
    zh: "获纽约大学文理学院中国研究基金资助（与 Mingzhen Lu 共同担任共同负责人）：《繁荣或萧条：中国城市转型分化背后的可达性临界点》。",
    href: "/news#boom-or-bust",
  },
  {
    date: "2026-08",
    en: "Nature Portfolio featured the npj Environmental Social Sciences informal-settlement cooling paper on WeChat and Weibo.",
    zh: "Nature 出版集团微信与微博推介了我关于非正规住区拆除与城市降温的 npj Environmental Social Sciences 论文。",
    href: "/news#npj-ess-nature-portfolio-feature",
  },
  {
    date: "2026-08",
    en: "Hosted SM26 visiting research students in the CLUEs Lab.",
    zh: "CLUEs 实验室接待 2026 夏季（SM26）访问研究学生。",
    href: "/news#sm26-visitors",
  },
  {
    date: "2026-06",
    en: "Informal settlement demolition and urban cooling published in npj Environmental Social Sciences.",
    zh: "关于非正规住区拆除与城市降温的研究，已发表于 npj Environmental Social Sciences。",
    href: "https://doi.org/10.1038/s44432-026-00009-1",
  },
  {
    date: "2025-11",
    en: "Advisee Gabriel Fernandes won Most Popular Project at the Fall 2025 Undergraduate Research Symposium.",
    zh: "指导的学生 Gabriel Fernandes 在 2025 年秋季本科生研究研讨会上获“最受欢迎项目”奖。",
    href: "https://shanghai.nyu.edu/news/putting-research-focus-fall-2025-undergraduate-research-symposium",
  },
  {
    date: "2025-10",
    en: "Advisees Gabriel Fernandes (Coachtopia) and Xi Bingxin named Millennium Fellows.",
    zh: "指导的学生 Gabriel Fernandes（Coachtopia）与奚冰心入选千禧年研究员（Millennium Fellows）。",
    href: "https://shanghai.nyu.edu/news/students-make-change-millennium-fellowship",
  },
  {
    date: "2025-09",
    en: "Cities at a Crossroads (SOCS-SHU 208) named a Shanghai City-Level Undergraduate Key Course.",
    zh: "《城市十字路口》（SOCS-SHU 208）获评为上海市本科重点课程。",
    href: "/teaching",
  },
  {
    date: "2025-05",
    en: "Rapid probabilistic inundation mapping published in Remote Sensing, with undergraduate co-author Lihan Feng.",
    zh: "与本科生冯立寒合著的快速概率淹没制图研究发表于 Remote Sensing。",
    // doi.org/10.3390/rs17101747 returned 403 from this network — use on-site entry
    href: `/publications#${publicationSlug("Rapid Probabilistic Inundation Mapping Using Local Thresholds and Sentinel-1 SAR Data on Google Earth Engine")}`,
  },
  {
    date: "2025-04",
    en: "Lead-authored “Declining urban density attenuates rising population exposure to surface heat extremes” published in Scientific Reports.",
    zh: "我作为第一作者的论文《城市密度下降减弱地表极端高温的人口暴露上升》发表于 Scientific Reports。",
    href: "https://doi.org/10.1038/s41598-025-96045-z",
  },
  {
    date: "2025-04",
    en: "Co-authored “Dual impact of global urban overheating on mortality” published in Nature Climate Change.",
    zh: "合著论文《全球城市过热对死亡率的双重影响》发表于 Nature Climate Change。",
    href: "https://doi.org/10.1038/s41558-025-02303-3",
  },
  {
    date: "2025-04",
    en: "Advisee Ziyun Xu featured in “Her Life in the Wild”; Best Presentation award and path to Yale School of Public Health.",
    zh: "指导的学生徐梓韵见诸专访《野性生活》；获研讨会最佳报告奖，并升学耶鲁大学公共卫生学院。",
    href: "https://shanghai.nyu.edu/stories/xu-ziyun-25-her-life-wild",
  },
  {
    date: "2024-09",
    en: "China Fund grant: “Mapping the Mismatch: The Urbanization of the Built Environment Versus People in Modern China.”",
    zh: "获纽约大学文理学院中国研究基金资助：《测绘错位：当代中国建成环境城市化与人口城市化》。",
    href: "/news#mapping-mismatch",
  },
  {
    date: "2022-12",
    en: "Received a Google Award for Inclusion Research (~$60,000) for heat extremes in China’s urban informal settlements.",
    zh: "获谷歌包容性研究奖（约 6 万美元），支持对中国城市非正规住区极端高温的研究。",
    href: "https://urban.shanghai.nyu.edu/news/professor-kangning-huang-received-google-award-inclusion-research-program",
  },
  {
    date: "2022-09",
    en: "Received an NYU Climate Change Initiative Seed Grant for climate trade-offs in future urban growth.",
    zh: "获纽约大学气候变化倡议种子基金，支持关于未来城市增长气候权衡的研究。",
    href: "https://cghe.shanghai.nyu.edu/news/prof-kangning-huang-wins-nyu-climate-research-seed-grant",
  },
  {
    date: "2022-09",
    en: "Selected for the Shanghai Leading Talents Program, Distinguished Young Scholars.",
    zh: "入选上海市领军人才（青年拔尖）。",
    href: "/news#leading-talents",
  },
  {
    date: "2019-11",
    en: "Yale Environment and Scientific American covered our Environmental Research Letters study on urban heat under climate change.",
    zh: "耶鲁环境学院与《科学美国人》报道了我关于气候变化下城市高温的 Environmental Research Letters 研究。",
    href: "https://environment.yale.edu/news/article/for-some-urban-areas-warming-climate-is-only-half-the-threat",
  },
];

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatNewsDate(date: string): { en: string; zh: string } {
  const [year, month] = date.split("-").map(Number);
  return {
    en: `${MONTHS_EN[month - 1]} ${year}`,
    zh: `${year}年${month}月`,
  };
}
