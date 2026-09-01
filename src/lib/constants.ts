export const SITE = {
  name: "Kangning (Ken) Huang",
  title: "Assistant Professor of Environmental Studies",
  affiliation: "NYU Shanghai",
  description:
    "Building a sustainable and resilient urban future through research on urbanization, climate change, and environmental hazards.",
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
  "I am an Assistant Professor of Environmental Studies at NYU Shanghai, where I lead the CLUEs (Climate, Land Use, and Environmental Sustainability) Lab. I received my PhD from Yale University, School of the Environment in 2020, and was an Advanced Study Program Postdoctoral Fellow at the National Center for Atmospheric Research.",
  "My research focuses on how the combination of urbanization and climate change affects vulnerability and adaptability to environmental hazards. By developing global-scale urbanization scenarios, I explore a broad range of possible urban climate futures and the interventions needed to achieve the more sustainable ones.",
  "My work spans urban expansion modeling, urban heat island dynamics, climate adaptation trade-offs, and the scaling laws governing cities. My research has been funded by NASA, NSF, and other sponsors, and featured in Yale News, Scientific American, and E&E News.",
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
      "Interactive visualization accompanying the paper on nested economies of scale in global city built mass. Explores the nonlinear scaling relationships between urban populations and their built environments across 3,000+ cities.",
    url: "https://city-mass.nested-complexity.net",
    tags: ["Urban Scaling", "Interactive Visualization", "Nature Cities"],
    featured: true,
    category: "academic",
    // imagePath: "/projects/nested-scaling-city-mass.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Urban Expansion 2050",
    description:
      "Projected global urban land expansion through 2050. Based on the research published in Environmental Research Letters (2019), with data available on WRI Resource Watch.",
    url: "/urban-expansion",
    tags: ["Urban Modeling", "Remote Sensing"],
    featured: true,
    category: "academic",
    internalPath: "/urban-expansion",
  },
  {
    title: "3D Urban Flood Risk",
    description:
      "Interactive web app for the paper on integrating building height and protection standards in global flood risk assessment. Visualizes 3D urban flood exposure across cities worldwide.",
    url: "https://kangning-huang.github.io/3D-urban-flood-risk/",
    tags: ["Flood Risk", "3D Visualization", "Interactive"],
    featured: true,
    category: "academic",
    // imagePath: "/projects/3d-urban-flood-risk.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Urban Renewal Cooling DID",
    description:
      "Interactive visualization of key results from the paper on the causal link between informal settlement demolition and urban cooling. Uses a difference-in-differences approach to unveil cooling effects of urban renewal.",
    url: "https://kangning-huang.github.io/urban-renewal-cooling-DID/",
    tags: ["Urban Cooling", "Causal Inference", "Interactive Visualization"],
    featured: true,
    category: "academic",
    // imagePath: "/projects/urban-renewal-cooling-did.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "URBANMOD-ZIPF",
    description:
      "A global-scale urban land expansion model that preserves Zipf's Law of urban sizes. Open-source tool for simulating realistic patterns of urban growth across different scenarios.",
    url: "https://github.com/kangning-huang",
    tags: ["Urban Modeling", "Open Source", "Python"],
    featured: false,
    category: "academic",
  },
  // ── Side projects ─────────────────────────────────────────────
  {
    title: "RoboTaxi Safety Tracker",
    description:
      "A data-driven dashboard tracking Tesla Cybercab safety performance using NHTSA Standing General Order crash data. Provides transparent, independent analysis of autonomous vehicle safety metrics including miles per incident (MPI) comparisons.",
    url: "https://robotaxi-safety-tracker.com",
    tags: ["Data Visualization", "Autonomous Vehicles", "Safety Analytics"],
    featured: true,
    category: "side",
    // imagePath: "/projects/robotaxi-safety-tracker.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Polybot Arena",
    description:
      "Visualizes how elite trading bots compete in Polymarket crypto prediction markets. Tracks the most profitable traders on Polymarket's 'Up or Down' markets for BTC, ETH, SOL, and XRP, showing their exact timing, positions, and P&L.",
    url: "https://polybot-arena.com",
    tags: ["Data Visualization", "Crypto", "Prediction Markets"],
    featured: true,
    category: "side",
  },
  {
    title: "Capitol Alpha",
    description:
      "Congressional trading dashboard — track and analyze stock trades made by members of the U.S. Congress.",
    url: "https://capitol-alpha.com",
    tags: ["Data Visualization", "Finance", "Dashboard"],
    featured: true,
    category: "side",
  },
];
