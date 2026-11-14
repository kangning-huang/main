"use client";

import { useLanguage } from "@/lib/language-context";
import type { ReactNode } from "react";

const OA_NAME = "反直觉手记";
const QR_SRC = "/wechat-oa-qr.jpg";

type Size = "md" | "sm";

/**
 * WeChat Official Account QR.
 * Hidden in the English UI unless `alwaysShow` is set (Chinese article pages
 * must show the follow module even if the header is toggled to EN).
 */
export default function WeChatOfficialQr({
  size = "md",
  className = "",
  showCaption = true,
  alwaysShow = false,
  caption,
}: {
  size?: Size;
  className?: string;
  showCaption?: boolean;
  alwaysShow?: boolean;
  caption?: ReactNode;
}) {
  const { language } = useLanguage();
  if (!alwaysShow && language !== "zh") return null;

  const px = size === "sm" ? 120 : 160;

  return (
    <figure
      id="wechat"
      className={`flex flex-col items-center gap-2.5 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={QR_SRC}
        width={px}
        height={px}
        alt={`微信公众号：${OA_NAME}`}
        decoding="async"
        className="rounded-lg border border-rule bg-paper p-1.5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]"
        style={{ width: px, height: px }}
      />
      {showCaption && (
        <figcaption className="max-w-[16rem] text-center text-xs leading-relaxed text-ink-muted">
          {caption ?? (
            <>
              扫码关注公众号
              <br />
              <span className="font-medium text-ink">「{OA_NAME}」</span>
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
}
