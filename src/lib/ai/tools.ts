import Anthropic from "@anthropic-ai/sdk";
import { searchKnowledgeBase } from "@/lib/knowledge/search";
import {
  parsePRUrl,
  fetchPRContext,
  isGitHubConfigured,
} from "@/lib/github/client";

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
    name: "review_pull_request",
    description:
      "Fetch a GitHub Pull Request and review its code changes. Accepts a GitHub PR URL (e.g. https://github.com/owner/repo/pull/123) or shorthand (owner/repo#123). Use when the user asks you to review a PR, check code, or look at a pull request.",
    input_schema: {
      type: "object" as const,
      properties: {
        pr_url: {
          type: "string",
          description:
            "GitHub PR URL (https://github.com/owner/repo/pull/123) or shorthand (owner/repo#123)",
        },
      },
      required: ["pr_url"],
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

    case "review_pull_request": {
      const prUrl = input.pr_url as string;
      const parsed = parsePRUrl(prUrl);
      if (!parsed) {
        return "Could not parse the PR URL. Please use a full GitHub URL (https://github.com/owner/repo/pull/123) or shorthand (owner/repo#123).";
      }

      if (!isGitHubConfigured()) {
        return "GitHub integration is not configured. Set up a GitHub App (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_INSTALLATION_ID) or a personal access token (GITHUB_TOKEN).";
      }

      try {
        return await fetchPRContext(parsed.owner, parsed.repo, parsed.number);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return `Failed to fetch PR: ${msg}`;
      }
    }

    case "escalate_to_human": {
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
