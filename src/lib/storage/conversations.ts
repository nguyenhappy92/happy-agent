import { getRedis } from "./redis";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const CONVERSATION_TTL = 60 * 60 * 24; // 24 hours
const MAX_HISTORY = 20; // keep last N messages per thread

const memoryStore = new Map<string, Message[]>();

function key(conversationId: string) {
  return `conv:${conversationId}`;
}

export async function getConversationHistory(
  conversationId: string
): Promise<Message[]> {
  const redis = getRedis();

  if (redis) {
    const raw = await redis.lrange<Message>(key(conversationId), 0, -1);
    return raw ?? [];
  }

  return memoryStore.get(conversationId) ?? [];
}

export async function saveMessage(
  conversationId: string,
  message: Message
): Promise<void> {
  const redis = getRedis();

  if (redis) {
    const k = key(conversationId);
    await redis.rpush(k, message);
    await redis.ltrim(k, -MAX_HISTORY, -1);
    await redis.expire(k, CONVERSATION_TTL);
    return;
  }

  if (!memoryStore.has(conversationId)) {
    memoryStore.set(conversationId, []);
  }
  const history = memoryStore.get(conversationId)!;
  history.push(message);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}
