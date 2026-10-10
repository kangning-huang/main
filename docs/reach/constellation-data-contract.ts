interface ConstellationView {
  meta: { asOf: string; model: string; params: Record<string, number | string> };
  regions: { id: string; en: string; zh: string; color: string; x: number; y: number; works: number }[];
  keywords: {
    id: string; en: string; zh?: string; region: string;
    x: number; y: number; works: number; perYear: number; echo: boolean;
    papers: string[];                                   // DOIs whose citers use it
    top: { doi: string; title: string; year: number; citedBy: number }[];
  }[];
  papers: {
    doi: string; short: string; lens: "lead" | "coauthor"; works: number;
    landing: [number, number]; aim: [number, number]; drift: number;
    bridge: [string, string] | null;                    // the two regions it joins
    lines: string[];                                    // top keywords at rest
  }[];
}
type ConstellationData = { all: ConstellationView; lead: ConstellationView };
