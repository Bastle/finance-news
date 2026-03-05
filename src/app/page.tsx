"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  type: string;
  summary: string | null;
  publishedAt: string;
}

interface NewsResponse {
  list: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function fetchNews(params: { q?: string; type?: string; page?: number }): Promise<NewsResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.type) sp.set("type", params.type);
  if (params.page) sp.set("page", String(params.page));
  const res = await fetch(`/api/news?${sp.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function Home() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isPending, error } = useQuery({
    queryKey: ["news", q, type, page],
    queryFn: () => fetchNews({ q: q || undefined, type: type || undefined, page }),
  });

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">财经资讯</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          placeholder="搜索标题或摘要..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded border border-neutral-600 bg-neutral-900 text-neutral-100 min-w-[200px]"
        />
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded border border-neutral-600 bg-neutral-900 text-neutral-100"
        >
          <option value="">全部</option>
          <option value="news">新闻</option>
          <option value="announcement">公告</option>
        </select>
      </div>

      {error && (
        <p className="text-red-400 mb-4">加载失败，请稍后重试。</p>
      )}

      {isPending && (
        <p className="text-neutral-400 mb-4">加载中...</p>
      )}

      {data && (
        <>
          <p className="text-neutral-500 text-sm mb-4">
            共 {data.total} 条，第 {data.page}/{data.totalPages} 页
          </p>
          <ul className="space-y-4">
            {data.list.map((a) => (
              <li key={a.id} className="border border-neutral-700 rounded-lg p-4 hover:border-neutral-500 transition-colors">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                  <span className="text-xs text-neutral-500 mr-2">{a.source}</span>
                  <span className="text-xs text-neutral-500">{a.type === "announcement" ? "公告" : "新闻"}</span>
                  <h2 className="font-medium text-neutral-100 mt-1 hover:underline">{a.title}</h2>
                  {a.summary && <p className="text-neutral-400 text-sm mt-2 line-clamp-2">{a.summary}</p>}
                  <time className="text-xs text-neutral-500 mt-2 block">
                    {new Date(a.publishedAt).toLocaleString("zh-CN")}
                  </time>
                </a>
              </li>
            ))}
          </ul>
          {data.totalPages > 1 && (
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-neutral-600 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-neutral-600 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {data && data.list.length === 0 && (
        <p className="text-neutral-500">暂无数据。请配置 Cron 或手动触发 /api/cron/fetch-news 抓取。</p>
      )}
    </main>
  );
}
