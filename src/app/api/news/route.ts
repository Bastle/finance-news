import { NextRequest, NextResponse } from "next/server";
import { findArticles } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") ?? undefined;
  const type = searchParams.get("type") as "news" | "announcement" | undefined;
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

  try {
    const result = await findArticles({ q, type, page, limit });
    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/news error", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
