# Happy Support — AI Slack Agent

An AI-powered support agent for Slack, built with **Next.js**, **Claude** (claude-sonnet-4-20250514), and **Upstash Redis**, deployed on **Vercel**.

## Architecture

```
Slack (Events API)
  │
  ▼
Webhook handler ─── Rate limiter (Upstash Redis)
  │
  ▼
Claude AI Agent
  ├── System prompt (persona + rules)
  ├── Tool: search knowledge base
  └── Tool: escalate to human
  │
  ▼
Storage
  ├── Conversation DB (Upstash Redis)
  ├── Knowledge base (built-in articles)
  └── Ticket system (extensible)
```

## Features

- **Slack integration** — responds to @mentions and direct messages
- **Claude AI** — claude-sonnet-4-20250514 with tool use for RAG and escalation
- **Knowledge base** — built-in articles for FAQ, billing, API, security, troubleshooting
- **Conversation memory** — thread-aware history persisted in Redis
- **Rate limiting** — sliding window limiter to protect API costs
- **Signature verification** — validates Slack request signatures
- **Background processing** — acknowledges Slack instantly, processes via `waitUntil`

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/nguyenhappy92/happy-agent.git
cd happy-agent
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `SLACK_BOT_TOKEN` | Yes | Bot token from your Slack app (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Yes | Signing secret from Basic Information page |
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL (falls back to in-memory) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token |
| `RATE_LIMIT_REQUESTS` | No | Max requests per window (default: 20) |
| `RATE_LIMIT_WINDOW_SECONDS` | No | Rate limit window in seconds (default: 60) |

### 3. Run locally

```bash
npm run dev
```

Use [ngrok](https://ngrok.com/) to expose localhost for Slack:

```bash
ngrok http 3000
```

Set your Slack Event Subscription URL to `https://<ngrok-id>.ngrok.io/api/slack/events`.

### 4. Deploy to Vercel

```bash
npx vercel --prod
```

Or push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).

## Slack App Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Under **OAuth & Permissions**, add these Bot Token Scopes:
   - `app_mentions:read`
   - `chat:write`
   - `im:history`
   - `reactions:write`
3. Under **Event Subscriptions**:
   - Enable events
   - Set Request URL to `https://your-domain.vercel.app/api/slack/events`
   - Subscribe to bot events: `app_mention`, `message.im`
4. Install the app to your workspace
5. Copy the **Bot User OAuth Token** → `SLACK_BOT_TOKEN`
6. Copy the **Signing Secret** from Basic Information → `SLACK_SIGNING_SECRET`

## Adding Knowledge Base Articles

Edit `src/lib/knowledge/articles.ts` to add or modify articles. Each article has:

```ts
{
  id: "unique-id",
  title: "Article Title",
  tags: ["keyword1", "keyword2"],
  content: `Markdown content...`
}
```

The search function matches user queries against titles, tags, and content using keyword scoring.

## Extending

### Ticket System Integration

The `escalate_to_human` tool in `src/lib/ai/tools.ts` currently logs escalations to the console. To integrate with Jira, Freshdesk, or another system, add your API call in the `escalate_to_human` case:

```ts
case "escalate_to_human": {
  // Add your ticket system API call here
  await createJiraTicket({ summary, priority, description: reason });
  // ...
}
```

### Vector Search

For production knowledge bases, replace the keyword search in `src/lib/knowledge/search.ts` with a vector database (Pinecone, Weaviate, Upstash Vector) for semantic search.

## Project Structure

```
src/
├── app/
│   ├── api/slack/events/route.ts   # Slack webhook handler
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing / status page
│   └── globals.css                 # Styles
└── lib/
    ├── ai/
    │   ├── agent.ts                # Claude orchestrator with tool loop
    │   ├── system-prompt.ts        # Agent persona and rules
    │   └── tools.ts                # Tool definitions + handlers
    ├── knowledge/
    │   ├── articles.ts             # Knowledge base content
    │   └── search.ts               # Keyword search engine
    ├── slack/
    │   ├── client.ts               # Slack Web API wrapper
    │   └── verify.ts               # Request signature verification
    └── storage/
        ├── redis.ts                # Upstash Redis client
        ├── conversations.ts        # Thread history store
        └── rate-limiter.ts         # Sliding window rate limiter
```

## License

MIT
