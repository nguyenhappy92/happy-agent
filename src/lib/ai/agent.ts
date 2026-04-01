import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt } from "./system-prompt";
import { tools, handleToolCall } from "./tools";
import {
  getConversationHistory,
  saveMessage,
  type Message,
} from "@/lib/storage/conversations";

const MAX_TOOL_ROUNDS = 5;

function getClient(): Anthropic {
  return new Anthropic(); // reads ANTHROPIC_API_KEY from env
}

export async function processMessage(params: {
  text: string;
  userId: string;
  channelId: string;
  threadTs: string;
}): Promise<string> {
  const { text, userId, channelId, threadTs } = params;
  const conversationKey = `${channelId}:${threadTs}`;

  const history = await getConversationHistory(conversationKey);

  await saveMessage(conversationKey, { role: "user", content: text });

  const messages: Anthropic.Messages.MessageParam[] = [
    ...history.map(messageToParam),
    { role: "user", content: text },
  ];

  const client = getClient();
  let round = 0;

  while (round < MAX_TOOL_ROUNDS) {
    round++;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: getSystemPrompt(),
      tools,
      messages,
    });

    if (response.stop_reason !== "tool_use") {
      const reply = response.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      await saveMessage(conversationKey, { role: "assistant", content: reply });
      return reply;
    }

    const toolBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
    );

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] =
      await Promise.all(
        toolBlocks.map(async (block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: await handleToolCall(
            block.name,
            block.input as Record<string, unknown>
          ),
        }))
      );

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  const fallback =
    "I'm sorry, I wasn't able to fully process your request. Let me connect you with a human agent.";
  await saveMessage(conversationKey, { role: "assistant", content: fallback });
  return fallback;
}

function messageToParam(msg: Message): Anthropic.Messages.MessageParam {
  return { role: msg.role, content: msg.content };
}
