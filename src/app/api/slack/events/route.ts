import { NextRequest } from "next/server";
import { waitUntil } from "@vercel/functions";
import { verifySlackSignature } from "@/lib/slack/verify";
import { postMessage, addReaction, removeReaction } from "@/lib/slack/client";
import { processMessage } from "@/lib/ai/agent";
import { checkRateLimit } from "@/lib/storage/rate-limiter";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifySlackSignature(req.headers, rawBody)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.type === "url_verification") {
    return Response.json({ challenge: payload.challenge });
  }

  if (req.headers.get("x-slack-retry-num")) {
    return new Response("OK", { status: 200 });
  }

  const event = payload.event;
  if (!event) {
    return new Response("OK", { status: 200 });
  }

  const isAppMention = event.type === "app_mention";
  const isDirectMessage =
    event.type === "message" && event.channel_type === "im";
  const isBotMessage = !!event.bot_id || !!event.subtype;

  if ((!isAppMention && !isDirectMessage) || isBotMessage) {
    return new Response("OK", { status: 200 });
  }

  waitUntil(handleMessageEvent(event));

  return new Response("OK", { status: 200 });
}

async function handleMessageEvent(event: SlackEvent) {
  const { channel, text, user, thread_ts, ts } = event;
  const threadTs = thread_ts ?? ts;
  const cleanText = stripBotMention(text ?? "");

  if (!cleanText.trim()) return;

  try {
    const { success } = await checkRateLimit(user);
    if (!success) {
      await postMessage(
        channel,
        "You're sending messages too quickly. Please wait a moment and try again.",
        threadTs
      );
      return;
    }

    await addReaction(channel, ts, "thinking_face");

    const reply = await processMessage({
      text: cleanText,
      userId: user,
      channelId: channel,
      threadTs,
    });

    await postMessage(channel, reply, threadTs);
    await removeReaction(channel, ts, "thinking_face");
  } catch (error) {
    console.error("Error handling Slack message:", error);
    await postMessage(
      channel,
      "I'm sorry, I ran into an unexpected error. Please try again or contact support.",
      threadTs
    ).catch(() => {});
  }
}

function stripBotMention(text: string): string {
  return text.replace(/<@[A-Z0-9]+>/g, "").trim();
}

interface SlackEvent {
  type: string;
  channel: string;
  channel_type?: string;
  text?: string;
  user: string;
  thread_ts?: string;
  ts: string;
  bot_id?: string;
  subtype?: string;
}
