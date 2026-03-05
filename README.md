# 财经资讯聚合

财经新闻与 A 股公告聚合，支持多源 RSS、巨潮公告、MiniMax 摘要，前端列表与搜索。

## 技术栈

- **前端**: Next.js 15 (App Router) + React + TypeScript + TanStack Query + Tailwind
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL (Prisma)
- **摘要**: 默认 MiniMax (Coding Plan)，可切换 OpenAI
- **部署**: Vercel

## 本地运行

1. 复制环境变量并填写：

```bash
cp .env.example .env.local
# 编辑 .env.local：DATABASE_URL、MINIMAX_API_KEY、CRON_SECRET
```

2. 安装依赖（若尚未安装）并初始化数据库：

```bash
npm install
npm run db:push
```

`db:push`、`db:generate`、`db:studio` 会从 `.env.local` 读取 `DATABASE_URL`，与 Next.js 共用同一份配置。

3. 启动开发服务器：

```bash
npm run dev
```

访问 http://localhost:3000 。首次无数据时，可手动请求一次抓取（需带鉴权）：

```bash
curl -H "Authorization: Bearer 你的CRON_SECRET" http://localhost:3000/api/cron/fetch-news
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接串（Vercel Postgres 或自建） |
| `MINIMAX_API_KEY` | 是 | MiniMax Coding Plan Key，用于摘要 |
| `CRON_SECRET` | 推荐 | Cron 鉴权，不设则任何人可触发抓取 |
| `LLM_PROVIDER` | 否 | `minimax`（默认）或 `openai` |
| `OPENAI_API_KEY` | 否 | 当 `LLM_PROVIDER=openai` 时必填 |

## 脚本

- `npm run dev` - 开发
- `npm run build` / `npm run start` - 构建与生产
- `npm run db:generate` - 生成 Prisma Client
- `npm run db:push` - 同步 schema 到数据库（无迁移文件）
- `npm run db:studio` - 打开 Prisma Studio

## 部署到 Vercel

1. 将仓库连接到 Vercel，在项目设置中配置上述环境变量。
2. 在 Vercel 中绑定 Vercel Postgres（或填写自己的 `DATABASE_URL`）。
3. 部署后，在 Vercel 控制台执行一次 **Database → Run migrations** 或本地执行 `db:push` 后通过 Vercel 的数据库连接串再执行一次。
4. Cron 会在生产环境按 `vercel.json` 的 schedule 触发（默认每 6 小时）。
