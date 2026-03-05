import OpenAI from "openai";

const PROVIDER = (process.env.LLM_PROVIDER ?? "minimax").toLowerCase();
const MAX_SUMMARY_LENGTH = 120;

function getClient(): OpenAI {
  if (PROVIDER === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is required when LLM_PROVIDER=openai");
    return new OpenAI({ apiKey: key });
  }
  // MiniMax 使用 OpenAI 兼容接口，默认
  const key = process.env.MINIMAX_API_KEY;
  if (!key) throw new Error("MINIMAX_API_KEY is required for default MiniMax (Coding Plan)");
  return new OpenAI({
    apiKey: key,
    baseURL: "https://api.minimaxi.com/v1",
  });
}

function getModel(): string {
  if (PROVIDER === "openai") return "gpt-4o-mini";
  return "MiniMax-M2.5";
}

/**
 * 对标题+正文生成约 100 字中文摘要（默认使用 MiniMax Coding Plan）
 */
export async function summarize(title: string, body?: string): Promise<string> {
  const client = getClient();
  const model = getModel();
  const text = body ? `${title}\n\n${body.slice(0, 3000)}` : title;

  const prompt = `你是一个财经资讯摘要助手。请根据以下内容，用中文写一段简洁摘要，约 100 字以内，突出关键信息与数据。不要编造内容。

内容：
${text}

摘要：`;

  const res = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
    temperature: 0.3,
  });

  const raw = res.choices[0]?.message?.content?.trim() ?? "";
  return raw.slice(0, MAX_SUMMARY_LENGTH);
}
