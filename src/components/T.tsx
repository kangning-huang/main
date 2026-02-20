"use client";

import { useLanguage } from "@/lib/language-context";
import type { ReactNode } from "react";

export default function T({ en, zh }: { en: ReactNode; zh: ReactNode }) {
  const { language } = useLanguage();
  return <>{language === "zh" ? zh : en}</>;
}
