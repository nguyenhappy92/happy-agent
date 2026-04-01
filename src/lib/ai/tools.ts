import Anthropic from "@anthropic-ai/sdk";
import { searchKnowledgeBase } from "@/lib/knowledge/search";

type Tool = Anthropic.Messages.Tool;

export const tools: Tool[] = [
  {
    name: "search_knowledge_base",
    description:
      "Search the knowledge base for relevant articles, FAQs, and documentation to help answer the user's question.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Search query — use keywords related to the user's question",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Escalate the conversation to a human support agent. Use when you cannot resolve the issue, the user requests a human, or the topic requires human judgment (billing disputes, security concerns).",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: {
          type: "string",
          description: "Why this conversation needs human attention",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Priority level for the support team",
        },
        summary: {
          type: "string",
          description: "Brief summary of the issue for the human agent",
        },
      },
      required: ["reason", "priority", "summary"],
    },
  },
];

export async function handleToolCall(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "search_knowledge_base": {
      const results = searchKnowledgeBase(input.query as string);
      if (results.length === 0) {
        return "No relevant articles found in the knowledge base.";
      }
      return results
        .map((r) => `## ${r.title}\n${r.content}`)
        .join("\n\n---\n\n");
    }

    case "escalate_to_human": {
      // In production, integrate with Jira / Freshdesk / PagerDuty here
      const { reason, priority, summary } = input as {
        reason: string;
        priority: string;
        summary: string;
      };
      console.log("[escalation]", { reason, priority, summary });
      return [
        "Escalation ticket created successfully.",
        `- **Priority**: ${priority}`,
        `- **Reason**: ${reason}`,
        `- **Summary**: ${summary}`,
        "",
        "A human support agent has been notified and will follow up shortly.",
      ].join("\n");
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
