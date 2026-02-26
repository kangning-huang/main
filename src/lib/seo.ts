import { LINKS, SITE, COAUTHOR_LINKS } from "@/lib/constants";
import type { Publication } from "@/lib/constants";

const FALLBACK_SITE_URL = "https://kangning-huang.github.io/main";

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
    additionalName: "Ken Huang",
    jobTitle: SITE.title,
    worksFor: {
      "@type": "CollegeOrUniversity",
      name: "NYU Shanghai",
      url: "https://shanghai.nyu.edu",
    },
    email: `mailto:${SITE.email}`,
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

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${canonicalUrl("/")}#website`,
    url: canonicalUrl("/"),
    name: SITE.name,
    description:
      "Portfolio, publications, projects, and teaching information for Kangning (Ken) Huang.",
    inLanguage: "en-US",
    publisher: {
      "@id": `${canonicalUrl("/")}#person`,
    },
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

