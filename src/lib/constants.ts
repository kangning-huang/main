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
  internalPath?: string;
}

export const PROJECTS: Project[] = [
  {
    title: "Robotaxi Safety Tracker",
    description:
      "A data-driven dashboard tracking Tesla Cybercab safety performance using NHTSA Standing General Order crash data. Provides transparent, independent analysis of autonomous vehicle safety metrics including miles per incident (MPI) comparisons.",
    url: "https://robotaxi-safety-tracker.com",
    tags: ["Data Visualization", "Autonomous Vehicles", "Safety Analytics"],
    featured: true,
  },
  {
    title: "Nested Scaling of City Mass",
    description:
      "Interactive visualization accompanying the paper on nested economies of scale in global city built mass. Explores the nonlinear scaling relationships between urban populations and their built environments across 3,000+ cities.",
    url: "https://kangning-huang.github.io/nested-scaling-city-mass/",
    tags: ["Urban Scaling", "Interactive Visualization", "Nature Cities"],
    featured: true,
  },
  {
    title: "Urban Expansion 2050 — GEE App",
    description:
      "Google Earth Engine web application visualizing projected global urban land expansion through 2050. Based on the research published in Environmental Research Letters (2019), with data available on WRI Resource Watch.",
    url: "/urban-expansion",
    tags: ["Google Earth Engine", "Urban Modeling", "Remote Sensing"],
    featured: true,
    internalPath: "/urban-expansion",
  },
  {
    title: "URBANMOD-ZIPF",
    description:
      "A global-scale urban land expansion model that preserves Zipf's Law of urban sizes. Open-source tool for simulating realistic patterns of urban growth across different scenarios.",
    url: "https://github.com/kangning-huang",
    tags: ["Urban Modeling", "Open Source", "Python"],
    featured: false,
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
}

export const FALLBACK_PUBLICATIONS: Publication[] = [
  {
    title:
      "Projecting global urban land expansion and heat island intensification through 2050",
    authors:
      "K Huang, X Li, X Liu, KC Seto",
    venue: "Environmental Research Letters",
    year: 2019,
    citationCount: 350,
    doi: "10.1088/1748-9326/ab4b71",
  },
  {
    title:
      "Persistent increases in nighttime heat stress from urban expansion despite heat island mitigation",
    authors: "K Huang, KC Seto",
    venue: "Journal of Geophysical Research: Atmospheres",
    year: 2021,
    citationCount: 60,
    doi: "10.1029/2020JD033831",
  },
  {
    title:
      "Facilitating urban climate forecasts in rapidly urbanizing regions with land-use change modeling",
    authors: "K Huang, KC Seto",
    venue: "Urban Climate",
    year: 2021,
    citationCount: 30,
  },
  {
    title:
      "Declining urban density attenuates rising population exposure to surface heat extremes",
    authors: "K Huang, M Lu",
    venue: "Scientific Reports",
    year: 2025,
    citationCount: 5,
  },
  {
    title:
      "Exacerbated heat stress induced by urban browning in the Global South",
    authors: "K Huang et al.",
    venue: "Nature Cities",
    year: 2024,
    citationCount: 15,
  },
  {
    title:
      "The spatiotemporal scaling laws of urban population dynamics",
    authors: "K Huang et al.",
    venue: "Nature Communications",
    year: 2025,
    citationCount: 3,
  },
  {
    title:
      "Nested economies of scale in global city mass",
    authors: "K Huang, M Lu",
    venue: "Preprint (in revision at Nature Cities)",
    year: 2025,
    citationCount: 0,
    url: "https://arxiv.org/abs/2507.03960",
  },
];
