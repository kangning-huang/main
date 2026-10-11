"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

/** Quiet ZH-only footer pointer to the WeChat OA QR on /blog. */
export default function FooterWeChatNote() {
  const { language } = useLanguage();
  if (language !== "zh") return null;

  return (
    <p className="mt-3 text-xs text-ink-faint">
      公众号「反直觉手记」·{" "}
      <Link
        href="/blog#wechat"
        className="link-underline transition-colors hover:text-ember"
      >
        扫码关注
      </Link>
    </p>
  );
}
