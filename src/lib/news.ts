import { publicationSlug } from "./constants";

export interface NewsItem {
  /** Month-level date, "YYYY-MM" */
  date: string;
  en: string;
  zh: string;
  href: string;
}

// Newest first. Dates are the month each status change was recorded in this
// repo's git history; only publication milestones are listed here.
export const NEWS: NewsItem[] = [
  {
    date: "2026-09",
    en: "“Nested economies of scale in global city mass” is in press at Nature Cities.",
    zh: "《全球城市建成质量的嵌套规模经济》已被 Nature Cities 接收，即将发表。",
    // In press — link to the on-site entry, not a DOI
    href: `/publications#${publicationSlug("Nested economies of scale in global city mass")}`,
  },
  {
    date: "2026-09",
    en: "“Toward Cooler Cities by Larger Homogeneous Functional Clusters” is in press at PNAS.",
    zh: "《以更大的同质功能集群建设更凉爽的城市》已被 PNAS 接收，即将发表。",
    href: `/publications#${publicationSlug("Toward Cooler Cities by Larger Homogeneous Functional Clusters")}`,
  },
  {
    date: "2026-09",
    en: "Height-aware, protection-informed flood assessment published in Scientific Reports.",
    zh: "纳入建筑高度与防洪标准的洪水风险评估论文发表于 Scientific Reports。",
    href: "https://doi.org/10.1038/s41598-026-70981-w",
  },
  {
    date: "2026-07",
    en: "Informal settlement demolition and urban cooling published in npj Environmental Social Sciences.",
    zh: "关于非正规住区拆除与城市降温因果关系的论文发表于 npj Environmental Social Sciences。",
    href: "https://doi.org/10.1038/s44432-026-00009-1",
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
