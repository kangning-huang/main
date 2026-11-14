import articles from "@/data/wechat-articles.json";

export type WeChatArticle = {
  id: string;
  title: string;
  /** First-party canonical path (preferred) or a legacy absolute URL. */
  url: string;
  /** Original WeChat Official Account URL, if the article was first published there. */
  wechatUrl?: string;
  /** YYYY-MM or YYYY-MM-DD; display-only */
  date?: string;
  featured?: boolean;
};

export const WECHAT_OA_NAME = "反直觉手记";

export function getWeChatArticles(): WeChatArticle[] {
  return articles as WeChatArticle[];
}

export function getFeaturedWeChatArticles(): WeChatArticle[] {
  const all = getWeChatArticles();
  const featured = all.filter((a) => a.featured);
  return featured.length > 0 ? featured : all.slice(0, 1);
}

export function isInternalArticleUrl(url: string): boolean {
  return url.startsWith("/");
}
