import { PrismaClient, type Prisma } from "@prisma/client";
import type { ArticleInput } from "./types";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function upsertArticle(input: ArticleInput) {
  return prisma.article.upsert({
    where: { url: input.url },
    create: {
      title: input.title,
      url: input.url,
      source: input.source,
      type: input.type,
      description: input.description ?? null,
      publishedAt: input.publishedAt,
    },
    update: {},
  });
}

export async function findArticles(options: {
  q?: string;
  type?: "news" | "announcement";
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Prisma.ArticleWhereInput = {};
  if (options.type) where.type = options.type;
  if (options.q?.trim()) {
    const term = options.q.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { summary: { contains: term, mode: "insensitive" } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return { list, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateArticleSummary(id: string, summary: string) {
  return prisma.article.update({ where: { id }, data: { summary } });
}
