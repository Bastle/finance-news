import Parser from "rss-parser";
import type { ArticleInput } from "./types";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "FinanceNewsBot/1.0" },
});

const RSS_FEEDS: { url: string; source: string }[] = [
  "http://rss.sina.com.cn/roll/finance/hot_roll.xml",
  "http://rss.sina.com.cn/roll/stock/hot_roll.xml",
  "http://rss.sina.com.cn/news/allnews/finance.xml",
].map((url) => ({ url, source: url.includes("stock") ? "sina_stock" : url.includes("finance") ? "sina_finance" : "sina_news" }));

export async function fetchRssArticles(): Promise<ArticleInput[]> {
  const results: ArticleInput[] = [];
  const seen = new Set<string>();

  for (const { url, source } of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items ?? []) {
        const link = item.link ?? item.guid;
        if (!link || seen.has(link)) continue;
        seen.add(link);
        const title = item.title?.trim() ?? "无标题";
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const description = item.contentSnippet?.slice(0, 2000) ?? item.content?.slice(0, 2000) ?? undefined;
        results.push({
          title,
          url: link,
          source,
          type: "news",
          description,
          publishedAt: pubDate,
        });
      }
    } catch (e) {
      console.error(`RSS fetch failed: ${url}`, e);
    }
  }

  return results;
}
