"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export type Language = "en" | "zh";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  toggleLanguage: () => {},
});

function isZhPath(pathname: string | null): boolean {
  return !!pathname && (pathname === "/zh" || pathname.startsWith("/zh/"));
}

function htmlLang(language: Language, zhRoute: boolean): string {
  if (zhRoute && language === "zh") return "zh-Hans";
  if (language === "zh") return "zh";
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const zhRoute = isZhPath(pathname);
  const [language, setLanguage] = useState<Language>(zhRoute ? "zh" : "en");

  useEffect(() => {
    if (zhRoute) {
      setLanguage("zh");
      document.documentElement.lang = "zh-Hans";
      return;
    }
    const saved = localStorage.getItem("lang") as Language | null;
    if (saved === "zh" || saved === "en") {
      setLanguage(saved);
      document.documentElement.lang = htmlLang(saved, false);
    } else {
      setLanguage("en");
      document.documentElement.lang = "en";
    }
  }, [zhRoute]);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === "en" ? "zh" : "en";
      if (!zhRoute) {
        localStorage.setItem("lang", next);
      }
      document.documentElement.lang = htmlLang(next, zhRoute);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
