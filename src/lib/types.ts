export type ArticleType = "news" | "announcement";

export interface ArticleInput {
  title: string;
  url: string;
  source: string;
  type: ArticleType;
  description?: string;
  publishedAt: Date;
}

export interface ArticleWithSummary extends ArticleInput {
  id: string;
  summary: string | null;
  fetchedAt: Date;
  createdAt: Date;
}
