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
    en: "“Infrastructure reach and capacity pressure in sub-Saharan Africa’s future urban expansion” accepted for publication in Nature Communications.",
    zh: "论文《撒哈拉以南非洲未来城市扩张中的基础设施可达性与容量压力》获 Nature Communications 接收。",
    href: `/publications#${publicationSlug("Infrastructure reach and capacity pressure in sub-Saharan Africa's future urban expansion")}`,
  },
  {
    date: "2026-11",
    en: "Confirmed participation in the SSP Urbanisation Workshop (WorldPop / University of Bristol).",
    zh: "已确认参加世界人口项目（WorldPop）与布里斯托大学合办的 SSP 城市化工作坊。",
    href: "/news#ssp-workshop-2026",
  },
  {
    date: "2026-10",
    en: "“Toward Cooler Cities by Larger Homogeneous Functional Clusters” published online in PNAS.",
    zh: "论文《通过更大的同质功能集群建设更凉爽的城市》在 PNAS 在线发表。",
    href: "https://doi.org/10.1073/pnas.2617717123",
  },
  {
    date: "2026-10",
    en: "“Nested economies of scale in global city mass” published in Nature Cities (open access).",
    zh: "论文《全球城市建成质量的嵌套规模经济》发表于 Nature Cities（开放获取）。",
    href: "https://doi.org/10.1038/s44284-026-00532-x",
  },
  {
    date: "2026-10",
    en: "NYU News covered our Nature Cities paper “Nested economies of scale in global city mass” in “Cities’ Infrastructure Grows More Slowly Than Their Populations Do.” — no change in wording except punctuation.",
    zh: "纽约大学新闻报道了我发表于 Nature Cities 的论文《全球城市建成质量的嵌套规模经济》，报道标题为《城市基础设施的增长速度慢于人口》。",
    href: "https://www.nyu.edu/about/news-publications/news/2026/october/cities--infrastructure-grows-more-slowly-than-their-populations-.html",
  },
  {
    date: "2026-10",
    en: "Hosted Prof. Timon McPhearson (Urban Systems Lab / NYU) for a guest talk at NYU Shanghai.",
    zh: "邀请 Urban Systems Lab / NYU 的 Timon McPhearson 教授到上海纽约大学做学术报告。",
    href: "/news#mcphearson-2026",
  },
  {
    date: "2026-09",
    en: "Received the 2025–2026 NYU Shanghai Teaching Excellence Award and was featured in “In the AI Age, How Do Great Teachers Teach?”",
    zh: "获得 2025–2026 学年上海纽约大学卓越教学奖，并接受《AI 时代，优秀教师如何教书？》专访。",
    href: "https://shanghai.nyu.edu/is/ai-age-how-do-great-teachers-teach",
  },
  {
    date: "2026-09",
    en: "“Nested economies of scale in global city mass” in press at Nature Cities, scheduled for the November issue.",
    zh: "论文《全球城市建成质量的嵌套规模经济》获 Nature Cities 接收，计划于 11 月刊发表。",
    // Historical in-press note (kept); published DOI is the Oct 2026 news item above
    href: `/publications#${publicationSlug("Nested economies of scale in global city mass")}`,
  },
  {
    date: "2026-09",
    en: "A flood assessment accounting for building height and protection standards published in Scientific Reports.",
    zh: "考虑建筑高度和防洪标准的洪水风险评估研究发表于 Scientific Reports。",
    href: "https://doi.org/10.1038/s41598-026-70981-w",
  },
  {
    date: "2026-09",
    en: "Received a China Fund grant as Co-PI with Mingzhen Lu for “Boom or bust: accessibility tipping point underlying divergent urban transitions in China.”",
    zh: "获得纽约大学文理学院中国研究基金资助，与 Mingzhen Lu 共同主持项目《繁荣或萧条：中国城市转型分化背后的可达性临界点》。",
    href: "/news#boom-or-bust",
  },
  {
    date: "2026-08",
    en: "Nature Portfolio featured our npj Environmental Social Sciences paper on informal-settlement cooling on WeChat and Weibo.",
    zh: "Nature 出版集团在微信和微博上介绍了我发表于 npj Environmental Social Sciences 的非正规住区拆除与城市降温研究。",
    href: "/news#npj-ess-nature-portfolio-feature",
  },
  {
    date: "2026-08",
    en: "Hosted SM26 visiting research students in the CLUEs Lab.",
    zh: "CLUEs 实验室接待了 2026 夏季（SM26）访问研究学生。",
    href: "/news#sm26-visitors",
  },
  {
    date: "2026-06",
    en: "Research on informal settlement demolition and urban cooling published in npj Environmental Social Sciences.",
    zh: "关于非正规住区拆除与城市降温的研究发表于 npj Environmental Social Sciences。",
    href: "https://doi.org/10.1038/s44432-026-00009-1",
  },
  {
    date: "2025-11",
    en: "Advisee Gabriel Fernandes won Most Popular Project at the Fall 2025 Undergraduate Research Symposium.",
    zh: "指导的学生 Gabriel Fernandes 在 2025 年秋季本科生研究研讨会上获得“最受欢迎项目”奖。",
    href: "https://shanghai.nyu.edu/news/putting-research-focus-fall-2025-undergraduate-research-symposium",
  },
  {
    date: "2025-10",
    en: "Advisees Gabriel Fernandes (Coachtopia) and Xi Bingxin were named Millennium Fellows.",
    zh: "指导的学生 Gabriel Fernandes（Coachtopia）和奚冰心入选千禧年研究员（Millennium Fellows）。",
    href: "https://shanghai.nyu.edu/news/students-make-change-millennium-fellowship",
  },
  {
    date: "2025-09",
    en: "Cities at a Crossroads (SOCS-SHU 208) named a Shanghai City-Level Undergraduate Key Course.",
    zh: "《城市十字路口》（SOCS-SHU 208）获评上海市本科重点课程。",
    href: "/teaching",
  },
  {
    date: "2025-05",
    en: "Research on rapid probabilistic inundation mapping published in Remote Sensing, co-authored with undergraduate student Lihan Feng.",
    zh: "与本科生冯立寒合作的快速概率淹没制图研究发表于 Remote Sensing。",
    // doi.org/10.3390/rs17101747 returned 403 from this network — use on-site entry
    href: `/publications#${publicationSlug("Rapid Probabilistic Inundation Mapping Using Local Thresholds and Sentinel-1 SAR Data on Google Earth Engine")}`,
  },
  {
    date: "2025-04",
    en: "First-authored “Declining urban density attenuates rising population exposure to surface heat extremes,” published in Scientific Reports.",
    zh: "我以第一作者身份发表的论文《城市密度下降减弱地表极端高温的人口暴露上升》发表于 Scientific Reports。",
    href: "https://doi.org/10.1038/s41598-025-96045-z",
  },
  {
    date: "2025-04",
    en: "Co-authored “Dual impact of global urban overheating on mortality,” published in Nature Climate Change.",
    zh: "合著论文《全球城市过热对死亡率的双重影响》发表于 Nature Climate Change。",
    href: "https://doi.org/10.1038/s41558-025-02303-3",
  },
  {
    date: "2025-04",
    en: "Advisee Ziyun Xu was featured in “Her Life in the Wild.” She received a Best Presentation award and went on to Yale School of Public Health.",
    zh: "指导的学生徐梓韵接受《野性生活》专访，获得研讨会最佳报告奖，后升学耶鲁大学公共卫生学院。",
    href: "https://shanghai.nyu.edu/stories/xu-ziyun-25-her-life-wild",
  },
  {
    date: "2024-09",
    en: "Received a China Fund grant for “Mapping the Mismatch: The Urbanization of the Built Environment Versus People in Modern China.”",
    zh: "获得纽约大学文理学院中国研究基金资助，项目为《测绘错位：当代中国建成环境城市化与人口城市化》。",
    href: "/news#mapping-mismatch",
  },
  {
    date: "2022-12",
    en: "Received a Google Award for Inclusion Research (~$60,000) to study extreme heat in China’s urban informal settlements.",
    zh: "获得谷歌包容性研究奖（约 6 万美元），用于研究中国城市非正规住区的极端高温。",
    href: "https://urban.shanghai.nyu.edu/news/professor-kangning-huang-received-google-award-inclusion-research-program",
  },
  {
    date: "2022-09",
    en: "Received an NYU Climate Change Initiative Seed Grant to study climate trade-offs in future urban growth.",
    zh: "获得纽约大学气候变化倡议种子基金，支持未来城市增长中气候权衡的研究。",
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
    zh: "耶鲁环境学院与《科学美国人》报道了我发表于 Environmental Research Letters 的气候变化与城市高温研究。",
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
