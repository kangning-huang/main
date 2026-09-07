import Link from "next/link";
import type { Metadata } from "next";
import {
  SITE,
  LINKS,
  RESEARCH_INTERESTS,
  PROJECTS,
} from "@/lib/constants";
import { fetchPublications } from "@/lib/publications";
import { fetchBlogPosts } from "@/lib/blog";
import { canonicalUrl, webPageSchema, profilePageSchema, faqSchema, OG_IMAGE_PATH } from "@/lib/seo";
import T from "@/components/T";
import PublicationCard from "@/components/PublicationCard";
