"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";

/** Use `zhHref` when the site chrome is in Chinese; otherwise `href`. */
export default function LangHrefLink({
  href,
  zhHref,
  className,
  children,
  onClick,
}: {
  href: string;
  zhHref?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const { language } = useLanguage();
  const target = language === "zh" && zhHref ? zhHref : href;
  return (
    <Link href={target} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
