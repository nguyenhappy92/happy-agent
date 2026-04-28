# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # start development server on port 3000
npm run build   # production build
npm run lint    # Next.js ESLint
```

No automated test suite — testing is done manually by pointing a Slack event to a local ngrok tunnel.

## Architecture

This is a **Next.js 15 serverless app** deployed on Vercel that acts as an AI support agent for Slack. The entire server-side logic lives under `src/lib/`.

### Request lifecycle

```
Slack Event → POST /api/slack/events/route.ts
  → verify HMAC-SHA256 signature (lib/slack/verify.ts)
  → acknowledge 200 immediately (Slack requires < 3s)
  → waitUntil(processMessage(...))   ← background async
      → checkRateLimit (lib/storage/rate-limiter.ts)
      → processMessage (lib/ai/agent.ts)
          → load thread history from Redis
          → loop up to 5 rounds: Claude → tool execution → Claude
          → save message pair to Redis
      → postMessage to Slack (lib/slack/client.ts)
```

The `waitUntil` pattern (from `@vercel/functions`) is critical: Slack needs a fast 200 ACK while Claude processing can take several seconds.

### Key modules

| Path | Responsibility |
|------|---------------|
| `src/app/api/slack/events/route.ts` | Webhook entry point, signature verify, event dispatch |
| `src/lib/ai/agent.ts` | Claude agentic tool loop (max 5 rounds), conversation memory |
| `src/lib/ai/tools.ts` | Tool definitions: `search_knowledge_base`, `review_pull_request`, `escalate_to_human` |
| `src/lib/ai/system-prompt.ts` | Bot persona and response formatting rules |
| `src/lib/github/client.ts` | PR fetch via GitHub App JWT auth or PAT fallback |
| `src/lib/knowledge/articles.ts` | Static knowledge base articles |
| `src/lib/knowledge/search.ts` | Keyword scoring: title (5×), tags (3×), content (1×) |
| `src/lib/storage/conversations.ts` | Thread history (Redis list or in-memory Map fallback) |
| `src/lib/storage/rate-limiter.ts` | Sliding window rate limiter via Upstash |
| `src/middleware.ts` | Security headers + POST-only enforcement on webhook |

### Conversation memory

Keyed by `${channelId}:${threadTs}`. Redis stores last 20 messages per thread with 24-hour TTL. Falls back to in-memory `Map` when Redis is not configured.

### GitHub PR review

Accepts full GitHub URLs or `owner/repo#123` shorthand. Prefers GitHub App auth (JWT + installation token, cached until < 60s expiry) over PAT. Diff is capped at 12 KB.

## Environment variables

**Required:**
- `SLACK_BOT_TOKEN` — `xoxb-...`
- `SLACK_SIGNING_SECRET`
- `ANTHROPIC_API_KEY`

**GitHub PR review (optional):**
- `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` (PEM with `\n`), `GITHUB_APP_INSTALLATION_ID`
- OR `GITHUB_TOKEN` (PAT fallback)

**Jira (optional — enables Jira search/create):**
- `JIRA_HOST` (e.g. `yourcompany.atlassian.net`)
- `JIRA_EMAIL`
- `JIRA_API_TOKEN` (from Atlassian account settings → Security → API tokens)

**Notion (optional — enables Notion search/read):**
- `NOTION_TOKEN` (Internal Integration token from notion.so/my-integrations; the integration must be added to each page/database you want accessible)

**Redis (optional — enables persistence and rate limiting):**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RATE_LIMIT_REQUESTS` (default: 20), `RATE_LIMIT_WINDOW_SECONDS` (default: 60)

## TypeScript conventions

- Path alias `@/*` maps to `src/*`
- `strict: true` — no implicit `any`
- Target: ES2017, `@anthropic-ai/sdk` is declared as a server external in `next.config.ts`
