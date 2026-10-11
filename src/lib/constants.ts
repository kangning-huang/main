import { PUBLICATIONS_A } from "./publications-part-a";
import { PUBLICATIONS_B } from "./publications-part-b";

export const SITE = {
  name: "Kangning (Ken) Huang",
  title: "Assistant Professor of Environmental Studies",
  affiliation: "NYU Shanghai",
  description:
    "How the size and shape of cities decide their climate future: urban expansion, heat, flood risk, and the material mass of the built environment.",
  email: "kangning.huang@nyu.edu",
  googleScholarId: "s_domssAAAAJ",
};

export const LINKS = {
  googleScholar:
    "https://scholar.google.com/citations?user=s_domssAAAAJ&hl=en",
  github: "https://github.com/kangning-huang",
  twitter: "https://x.com/FytasoK60918",
  substack: "https://kangninghuang.substack.com",
  nyuFaculty:
    "https://shanghai.nyu.edu/academics/faculty/directory/kangning-ken-huang",
  lab: "https://knhuang.weebly.com",
};

/**
 * Google Scholar profiles for notable co-authors.
 * Keys must match the full name used in the `authors` field of publications.
 * Used by PublicationCard (visible links) and seo.ts (JSON-LD Person.url).
 */
export const COAUTHOR_LINKS: Record<string, string> = {
  "Karen C. Seto": "https://scholar.google.com/citations?user=0mjPS-IAAAAJ&hl=en",
  "Michelle L. Bell": "https://scholar.google.com/citations?user=W4EC7g4AAAAJ&hl=en",
  "Brian Stone Jr.": "https://scholar.google.com/citations?user=C6lK4ZQAAAAJ&hl=en",
  "Xuhui Lee": "https://scholar.google.com/citations?user=8L9uh1oAAAAJ&hl=en",
  "Philippe Ciais": "https://scholar.google.com/citations?user=PJhqfAoAAAAJ&hl=en",
  "Robert I. McDonald": "https://scholar.google.com/citations?user=qjx1OkwAAAAJ&hl=en",
  "Wenfeng Zhan": "https://scholar.google.com/citations?user=-VRcMboAAAAJ&hl=en",
  "Xia Li": "https://scholar.google.com/citations?user=Rxgr5rYAAAAJ&hl=en",
  "Xiaoping Liu": "https://scholar.google.com/citations?user=rad0T_sAAAAJ&hl=en",
};

export const RESEARCH_INTERESTS = [
  "Urbanization",
  "Extreme Heat Events",
  "Climate Adaptation",
  "Remote Sensing",
  "GIScience",
];

export const ABOUT_TEXT = [
  "I study cities as complex socio-ecological systems, the outcome of interactions between human and natural systems, at NYU Shanghai, where I lead the CLimate and Urban Environments (CLUEs) Lab. Before that I was an Advanced Study Program Postdoctoral Fellow at NCAR; I earned my PhD at the Yale School of the Environment in 2020.",
  "Urbanization and climate change land on the same people at once. We build global urban-expansion scenarios to ask how much land cities will claim by mid-century, how that growth warms and floods them, and which interventions change the outcome.",
  "The work covers urban expansion modeling, heat-island dynamics, adaptation trade-offs, and urban scaling. It has been funded by NASA, NSF, Google, Shanghai Municipal Government and other sponsors, and covered by Yale News, Scientific American, and E&E News.",
];

export interface Project {
  title: string;
  description: string;
  url: string;
  tags: string[];
  featured: boolean;
  category: "academic" | "side";
  internalPath?: string;
  imagePath?: string;
}

export const PROJECTS: Project[] = [
  // ── Academic projects ─────────────────────────────────────────
  {
    title: "Nested Scaling of City Mass",
    description:
      "Map and explorer for nested economies of scale in city built mass across 3,000+ cities: how built mass scales with population at city and neighborhood levels.",
    url: "https://city-mass.nested-complexity.net",
    tags: ["Urban Scaling", "Interactive Visualization", "Nature Cities"],
    featured: true,
    category: "academic",
    // imagePath: "/projects/nested-scaling-city-mass.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Urban Expansion 2050",
    description:
      "Global urban land expansion through 2050, from the Environmental Research Letters (2019) projections; data also on WRI Resource Watch.",
    url: "/urban-expansion",
    tags: ["Urban Modeling", "Remote Sensing"],
    featured: true,
    category: "academic",
    internalPath: "/urban-expansion",
  },
  {
    title: "3D Urban Flood Risk",
    description:
      "3D flood exposure when building height and protection standards enter the assessment, across cities worldwide.",
    url: "https://flood.kangning-huang.com/",
    tags: ["Flood Risk", "3D Visualization", "Interactive"],
    featured: true,
    category: "academic",
    // imagePath: "/projects/3d-urban-flood-risk.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Urban Renewal Cooling DID",
    description:
      "Difference-in-differences results on informal-settlement demolition and surface cooling: how much cooled, and what rebuilding did to the signal.",
    url: "https://cooling.kangning-huang.com/",
    tags: ["Urban Cooling", "Causal Inference", "Interactive Visualization"],
    featured: true,
    category: "academic",
    // imagePath: "/projects/urban-renewal-cooling-did.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "URBANMOD-ZIPF",
    description:
      "Open-source global urban land-expansion model that preserves Zipf's law of city sizes across scenarios.",
    url: "https://github.com/kangning-huang/URBANMOD-ZIPF",
    tags: ["Urban Modeling", "Open Source", "Python"],
    featured: false,
    category: "academic",
  },
  // ── Side projects ─────────────────────────────────────────────
  {
    title: "RoboTaxi Safety Tracker",
    description:
      "Dashboard of Tesla Cybercab safety from NHTSA Standing General Order crash data, including miles-per-incident comparisons. Built as an independent public check on the published numbers.",
    url: "https://robotaxi-safety-tracker.com",
    tags: ["Data Visualization", "Autonomous Vehicles", "Safety Analytics"],
    // Side project — belongs on /tinkering, not the homepage
    featured: false,
    category: "side",
    // imagePath: "/projects/robotaxi-safety-tracker.jpg", // Run `npm run screenshots` to generate
  },
];

export interface Publication {
  title: string;
  authors: string;
  venue: string;
  year: number;
  citationCount: number;
  url?: string;
  doi?: string;
  /** true when Kangning Huang is first or last (senior) author */
  isLeadAuthor?: boolean;
  /** Link to preprint (e.g. arXiv, Research Square) */
  preprint?: string;
  /** Link to an interactive web app / visualization for this paper */
  webUrl?: string;
  /** SEO/AEO: keyword-rich bullet points summarising key findings */
  highlights?: string[];
  /** Optional demo/highlight video (site-hosted path under public/), shown when expanded */
  highlightVideo?: string;
  /** Poster image for the highlight video (site-hosted path under public/) */
  highlightVideoPoster?: string;
  /** Short accessible caption for the highlight video (used for aria-label + visible caption) */
  highlightVideoCaption?: string;
  /** Upload date of the highlight video (YYYY-MM-DD), used in VideoObject JSON-LD */
  highlightVideoUploadDate?: string;
  /** ISO 8601 duration of the highlight video (e.g. "PT1M13S"), used in VideoObject JSON-LD */
  highlightVideoDuration?: string;
  /** SEO/AEO: topic keywords for structured data and filtering */
  keywords?: string[];
}

/** Stable anchor id for a publication, e.g. "nested-economies-of-scale-in-global-city-mass" */
export function publicationSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const CURATED_PUBLICATIONS: Publication[] = [
  ...PUBLICATIONS_A,
  ...PUBLICATIONS_B,
];

// Keep the old name for backwards compat
export const FALLBACK_PUBLICATIONS = CURATED_PUBLICATIONS;