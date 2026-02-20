"use client";

import { useLanguage } from "@/lib/language-context";

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="rounded-full border border-rule px-2.5 py-1 text-xs font-medium text-ink-muted transition-all hover:border-ember hover:text-ember"
      aria-label={language === "en" ? "切换到中文" : "Switch to English"}
      title={language === "en" ? "切换到中文" : "Switch to English"}
    >
      {language === "en" ? "中文" : "EN"}
    </button>
  );
}
