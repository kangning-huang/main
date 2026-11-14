import WeChatOfficialQr from "./WeChatOfficialQr";

/**
 * Fixed follow module for every first-party Chinese article page.
 * Always rendered (even if the header language is toggled to EN).
 * Reuses the site-wide Official Account QR at /wechat-oa-qr.jpg.
 */
export default function ZhBlogFollowQr({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`mt-14 rounded-xl border border-rule bg-paper-warm px-6 py-8 ${className}`}
    >
      <p className="text-center text-sm text-ink-muted">
        不是每天都有空刷网站。扫码关注公众号
        <span className="font-medium text-ink">「反直觉手记」</span>
        ，即可收到新文章更新。
      </p>
      <WeChatOfficialQr
        size="md"
        alwaysShow
        showCaption={false}
        className="mt-5"
      />
    </aside>
  );
}
