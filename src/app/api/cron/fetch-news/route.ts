import { NextResponse } from "next/server";
import { fetchRssArticles } from "@/lib/rss";
import { fetchCninfoAnnouncements } from "@/lib/cninfo";
import { upsertArticle, updateArticleSummary } from "@/lib/db";
import { summarize } from "@/lib/llm";

const CRON_SECRET = process.env.CRON_SECRET;
const MAX_SUMMARIES_PER_RUN = 40; // 适配 MiniMax Coding Plan 每 5 小时限额

export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [rssItems, cninfoItems] = await Promise.all([
      fetchRssArticles(),
      fetchCninfoAnnouncements({ pageNum: 1, pageSize: 10 }),
    ]);

    const toUpsert = [...rssItems, ...cninfoItems];
    const inserted: { id: string; title: string; description?: string }[] = [];

    for (const item of toUpsert) {
      const row = await upsertArticle(item);
      if (row.createdAt.getTime() === row.fetchedAt.getTime()) {
        inserted.push({ id: row.id, title: row.title, description: row.description ?? undefined });
      }
    }

    let summarized = 0;
    for (const item of inserted) {
      if (summarized >= MAX_SUMMARIES_PER_RUN) break;
      try {
        const summary = await summarize(item.title, item.description);
        await updateArticleSummary(item.id, summary);
        summarized++;
      } catch (e) {
        console.error("Summarize failed:", item.id, e);
      }
    }

    return NextResponse.json({
      ok: true,
      upserted: toUpsert.length,
      newItems: inserted.length,
      summarized,
    });
  } catch (e) {
    console.error("Cron fetch-news error", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
