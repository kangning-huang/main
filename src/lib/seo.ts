import { LINKS, SITE, COAUTHOR_LINKS } from "@/lib/constants";
import type { Publication } from "@/lib/constants";

const FALLBACK_SITE_URL = "https://kangning-huang.github.io/main";

export const OG_IMAGE_PATH = "/hero-nyc-skyline.jpg";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL).replace(/\/$/, "");
}

export function canonicalUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${canonicalUrl("/")}#person`,
    name: SITE.name,
    givenName: "Kangning",
    familyName: "Huang",
    additionalName: "Ken",
    description:
      "Assistant Professor of Environmental Studies at NYU Shanghai researching urbanization, climate change, urban heat islands, and environmental hazards.",
    jobTitle: SITE.title,
    worksFor: {
      "@type": "CollegeOrUniversity",
      name: "NYU Shanghai",
      url: "https://shanghai.nyu.edu",
      parentOrganization: {
        "@type": "CollegeOrUniversity",
        name: "New York University",
        url: "https://www.nyu.edu",
      },
    },
    alumniOf: [
      {
        "@type": "CollegeOrUniversity",
        name: "Yale University",
        url: "https://www.yale.edu",
        department: {
          "@type": "Organization",
          name: "Yale School of the Environment",
        },
      },
    ],
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "PhD",
      recognizedBy: {
        "@type": "CollegeOrUniversity",
        name: "Yale University",
      },
    },
    knowsAbout: [
      "Urban Heat Islands",
      "Urban Expansion Modeling",
      "Climate Adaptation",
      "Remote Sensing",
      "GIScience",
      "Urban Scaling Laws",
      "Environmental Hazards",
      "Urbanization and Climate Change",
    ],
    email: `mailto:${SITE.email}`,
    image: `${canonicalUrl("/")}hero-nyc-skyline.jpg`,
    sameAs: [
      LINKS.googleScholar,
      LINKS.github,
      LINKS.twitter,
      LINKS.substack,
      LINKS.nyuFaculty,
    ],
    url: canonicalUrl("/"),
  };
}

export function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What does Kangning Huang research?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Kangning (Ken) Huang researches how urbanization and climate change together affect vulnerability to environmental hazards. His work spans urban expansion modeling, urban heat island dynamics, climate adaptation trade-offs, and urban scaling laws. He develops global-scale urbanization scenarios to explore possible urban climate futures.",
        },
      },
      {
        "@type": "Question",
        name: "Where does Kangning Huang work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Kangning Huang is an Assistant Professor of Environmental Studies at NYU Shanghai, where he leads the CLUEs (Climate, Land Use, and Environmental Sustainability) Lab. He received his PhD from Yale University's School of the Environment and was a postdoctoral fellow at the National Center for Atmospheric Research (NCAR).",
        },
      },
      {
        "@type": "Question",
        name: "What is urban heat island research?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Urban heat islands occur when cities become significantly warmer than surrounding rural areas due to built surfaces absorbing and re-emitting heat. Kangning Huang's research shows that global urban expansion could increase heat island intensity by 0.5-2°C by 2050, with nighttime heat stress persisting even when mitigation measures reduce daytime heat islands.",
        },
      },
      {
        "@type": "Question",
        name: "How much will cities expand by 2050?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "According to Kangning Huang's research published in Environmental Research Letters (2019, 480+ citations), global urban land area is projected to increase by 80-180% by 2050 compared to 2015 levels, with significant implications for heat island intensification, biodiversity loss, and food security.",
        },
      },
    ],
  };
}

export function profilePageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${canonicalUrl("/")}#profilepage`,
    url: canonicalUrl("/"),
    name: "Kangning (Ken) Huang — Academic Portfolio",
    dateCreated: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    mainEntity: {
      "@id": `${canonicalUrl("/")}#person`,
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${canonicalUrl("/")}#website`,
    url: canonicalUrl("/"),
    name: "Kangning (Ken) Huang",
    alternateName: ["Ken Huang", "Kangning Huang", "黄康宁"],
    description:
      "Academic portfolio of Kangning (Ken) Huang — Assistant Professor of Environmental Studies at NYU Shanghai. Publications, research projects, and teaching.",
    inLanguage: ["en-US", "zh-CN"],
    publisher: {
      "@id": `${canonicalUrl("/")}#person`,
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: canonicalUrl("/"),
      },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: canonicalUrl(item.path),
      })),
    ],
  };
}

export function webPageSchema({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl(path)}#webpage`,
    url: canonicalUrl(path),
    name: title,
    description,
    inLanguage: "en-US",
    isPartOf: {
      "@id": `${canonicalUrl("/")}#website`,
    },
    about: {
      "@id": `${canonicalUrl("/")}#person`,
    },
  };
}

export function scholarlyArticleSchema(pub: Publication) {
  const article: Record<string, unknown> = {
    "@type": "ScholarlyArticle",
    headline: pub.title,
    author: pub.authors.split(", ").map((name) => {
      const trimmed = name.trim();
      const person: Record<string, string> = { "@type": "Person", name: trimmed };
      const url = COAUTHOR_LINKS[trimmed];
      if (url) person.url = url;
      return person;
    }),
    datePublished: `${pub.year}`,
    isPartOf: pub.venue
      ? { "@type": "Periodical", name: pub.venue }
      : undefined,
  };
  if (pub.doi) article.sameAs = `https://doi.org/${pub.doi}`;
  if (pub.url) article.url = pub.url;
  if (pub.keywords && pub.keywords.length > 0) article.keywords = pub.keywords.join(", ");
  if (pub.highlights && pub.highlights.length > 0) article.abstract = pub.highlights.join(". ");
  if (pub.citationCount > 0) {
    article.interactionStatistic = {
      "@type": "InteractionCounter",
      interactionType: { "@type": "CiteAction" },
      userInteractionCount: pub.citationCount,
    };
  }
  return article;
}

export function scholarlyArticleListSchema(pubs: Publication[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: pubs.map((pub, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: scholarlyArticleSchema(pub),
    })),
  };
}

