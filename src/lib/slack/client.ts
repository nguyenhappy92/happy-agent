function token(): string {
  const t = process.env.SLACK_BOT_TOKEN;
  if (!t) throw new Error("SLACK_BOT_TOKEN is not configured");
  return t;
}

async function slackAPI(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error(`Slack API ${method} failed: ${data.error}`);
  }
  return data;
}

export async function postMessage(
  channel: string,
  text: string,
  threadTs?: string
) {
  return slackAPI("chat.postMessage", {
    channel,
    text,
    thread_ts: threadTs,
    unfurl_links: false,
  });
}

export async function addReaction(
  channel: string,
  timestamp: string,
  name: string
) {
  return slackAPI("reactions.add", { channel, timestamp, name });
}

export async function removeReaction(
  channel: string,
  timestamp: string,
  name: string
) {
  return slackAPI("reactions.remove", { channel, timestamp, name });
}
