export default function Home() {
  return (
    <div className="container">
      <header className="hero">
        <h1>Happy Support</h1>
        <p>
          AI-powered Slack support agent built with Claude and deployed on
          Vercel.
        </p>
        <span className="badge badge--ok">
          <span className="badge--dot" />
          Webhook ready
        </span>
      </header>

      <div className="grid">
        <div className="card">
          <h3>AI Agent</h3>
          <p>
            Powered by Claude claude-sonnet-4-20250514 with tool use for knowledge
            base search, PR review, and ticket escalation.
          </p>
        </div>
        <div className="card">
          <h3>PR Review</h3>
          <p>
            Share a GitHub PR link and get an AI code review with issues grouped
            by severity and actionable suggestions.
          </p>
        </div>
        <div className="card">
          <h3>Knowledge Base</h3>
          <p>
            Built-in FAQ articles covering onboarding, billing, API, security,
            and troubleshooting.
          </p>
        </div>
        <div className="card">
          <h3>Rate Limiting</h3>
          <p>
            Upstash Redis-backed sliding window rate limiter to protect against
            API cost spikes.
          </p>
        </div>
        <div className="card">
          <h3>Conversation Memory</h3>
          <p>
            Thread-aware history stored in Redis so the agent remembers context
            within a conversation.
          </p>
        </div>
      </div>

      <section className="section">
        <h2>Setup</h2>
        <ol className="steps">
          <li>
            <strong>Create a Slack App</strong>
            <span>
              Go to{" "}
              <a href="https://api.slack.com/apps">api.slack.com/apps</a>, create
              an app, and enable <code>app_mentions:read</code>,{" "}
              <code>chat:write</code>, <code>im:history</code>, and{" "}
              <code>reactions:write</code> scopes.
            </span>
          </li>
          <li>
            <strong>Configure Event Subscriptions</strong>
            <span>
              Set the Request URL to{" "}
              <code>https://your-domain.vercel.app/api/slack/events</code> and
              subscribe to <code>app_mention</code> and{" "}
              <code>message.im</code> events.
            </span>
          </li>
          <li>
            <strong>Set Environment Variables</strong>
            <span>
              Add <code>SLACK_BOT_TOKEN</code>,{" "}
              <code>SLACK_SIGNING_SECRET</code>,{" "}
              <code>ANTHROPIC_API_KEY</code>, and optionally{" "}
              <code>GITHUB_TOKEN</code>,{" "}
              <code>UPSTASH_REDIS_REST_URL</code> /{" "}
              <code>UPSTASH_REDIS_REST_TOKEN</code> in your Vercel project
              settings.
            </span>
          </li>
          <li>
            <strong>Deploy</strong>
            <span>
              Push to GitHub and import the repo in Vercel, or run{" "}
              <code>vercel --prod</code> from the CLI.
            </span>
          </li>
        </ol>
      </section>

      <footer className="footer">
        Happy Support &middot; Built with Next.js, Claude &amp; Vercel
      </footer>
    </div>
  );
}
