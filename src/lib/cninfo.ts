/**
 * 巨潮资讯网 A 股公告 API
 * POST http://www.cninfo.com.cn/new/hisAnnouncement/query
 */
import type { ArticleInput } from "./types";

const CNINFO_QUERY_URL = "http://www.cninfo.com.cn/new/hisAnnouncement/query";

interface CninfoQueryParams {
  stock?: string;
  searchkey?: string;
  plate?: string;
  category?: string;
  trade?: string;
  column?: string;
  columnTitle?: string;
  pageNum?: number;
  pageSize?: number;
  tabName?: string;
  sortName?: string;
  sortOrder?: string;
  isHLtitle?: boolean;
}

interface CninfoAnnouncement {
  announcementId?: string;
  announcementTitle?: string;
  announcementType?: string;
  secCode?: string;
  secName?: string;
  adjunctUrl?: string;
  adjunctSize?: number;
  adjunctType?: string;
  storageTime?: string;
  columnId?: string;
  columnName?: string;
  pageColumn?: string;
  announcementTime?: number;
  adjunctName?: string;
  orgId?: string;
}

interface CninfoResponse {
  announcements?: CninfoAnnouncement[];
  totalRecordNum?: number;
  totalPages?: number;
  pageNum?: number;
}

export async function fetchCninfoAnnouncements(options: {
  pageNum?: number;
  pageSize?: number;
  category?: string;
} = {}): Promise<ArticleInput[]> {
  const pageNum = options.pageNum ?? 1;
  const pageSize = Math.min(30, options.pageSize ?? 20);
  const params: CninfoQueryParams = {
    column: "szse_latest",
    columnTitle: "深市公告",
    pageNum,
    pageSize,
    tabName: "fulltext",
    sortName: "",
    sortOrder: "",
    isHLtitle: true,
    ...(options.category && { category: options.category }),
  };

  const body = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") body.append(k, String(v));
  });

  const res = await fetch(CNINFO_QUERY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "FinanceNewsBot/1.0",
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Cninfo API error: ${res.status}`);
  const data = (await res.json()) as CninfoResponse;
  const list = data.announcements ?? [];

  return list
    .filter((a) => a.announcementTitle && a.adjunctUrl)
    .map((a) => {
      const title = a.announcementTitle ?? "无标题";
      const url = a.adjunctUrl!.startsWith("http") ? a.adjunctUrl! : `http://www.cninfo.com.cn${a.adjunctUrl!.startsWith("/") ? "" : "/"}${a.adjunctUrl}`;
      const publishedAt = a.announcementTime ? new Date(a.announcementTime) : new Date();
      return {
        title,
        url,
        source: "cninfo",
        type: "announcement" as const,
        description: `${a.secName ?? ""} ${a.columnName ?? ""}`.trim() || undefined,
        publishedAt,
      };
    });
}
