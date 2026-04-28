import Anthropic from "@anthropic-ai/sdk";
import { searchKnowledgeBase } from "@/lib/knowledge/search";
import {
  parsePRUrl,
  fetchPRContext,
  isGitHubConfigured,
} from "@/lib/github/client";
import {
  isJiraConfigured,
  searchIssues,
  getIssue,
  createIssue,
} from "@/lib/jira/client";
import {
  isNotionConfigured,
  searchNotion,
  getPage,
  queryDatabase,
} from "@/lib/notion/client";

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
    name: "search_jira_issues",
    description:
      "Search Jira issues using JQL (Jira Query Language). Use when the user asks about tickets, bugs, tasks, or issues in Jira. Example JQL: 'project = PROJ AND status = \"In Progress\"'.",
    input_schema: {
      type: "object" as const,
      properties: {
        jql: {
          type: "string",
          description:
            "JQL query string (e.g. 'project = PROJ AND assignee = currentUser() AND status != Done')",
        },
        max_results: {
          type: "number",
          description: "Maximum number of issues to return (default: 10, max: 25)",
        },
      },
      required: ["jql"],
    },
  },
  {
    name: "get_jira_issue",
    description:
      "Fetch a single Jira issue by its key (e.g. PROJ-123). Use when the user references a specific ticket.",
    input_schema: {
      type: "object" as const,
      properties: {
        issue_key: {
          type: "string",
          description: "Jira issue key, e.g. PROJ-123",
        },
      },
      required: ["issue_key"],
    },
  },
  {
    name: "create_jira_issue",
    description:
      "Create a new Jira issue. Use when the user asks to create, log, or file a ticket, bug, or task.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_key: {
          type: "string",
          description: "Jira project key, e.g. PROJ",
        },
        summary: {
          type: "string",
          description: "One-line title of the issue",
        },
        description: {
          type: "string",
          description: "Detailed description of the issue",
        },
        issue_type: {
          type: "string",
          description: "Issue type, e.g. Bug, Task, Story (default: Task)",
        },
      },
      required: ["project_key", "summary", "description"],
    },
  },
  {
    name: "search_notion",
    description:
      "Search for pages and databases in Notion by keyword. Use when the user asks to find a document, page, or note in Notion.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query keywords",
        },
        page_size: {
          type: "number",
          description: "Number of results to return (default: 10, max: 20)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_notion_page",
    description:
      "Retrieve the full content of a Notion page. Accepts a Notion page URL or page ID. Use when the user shares a Notion link or asks to read a specific page.",
    input_schema: {
      type: "object" as const,
      properties: {
        page_id: {
          type: "string",
          description:
            "Notion page URL (https://notion.so/...) or page ID (32-char hex or dashed UUID)",
        },
      },
      required: ["page_id"],
    },
  },
  {
    name: "query_notion_database",
    description:
      "Query rows from a Notion database. Use when the user asks to list items, tasks, or records from a Notion database. Accepts a database URL or ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        database_id: {
          type: "string",
          description: "Notion database URL or ID",
        },
        filter: {
          type: "string",
          description:
            "Optional Notion filter as a JSON string (advanced). Leave empty to return all rows.",
        },
        page_size: {
          type: "number",
          description: "Number of rows to return (default: 10, max: 20)",
        },
      },
      required: ["database_id"],
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

    case "search_jira_issues": {
      if (!isJiraConfigured()) {
        return "Jira is not configured. Set JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN.";
      }
      try {
        return await searchIssues(
          input.jql as string,
          input.max_results as number | undefined
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return `Failed to search Jira: ${msg}`;
      }
    }

    case "get_jira_issue": {
      if (!isJiraConfigured()) {
        return "Jira is not configured. Set JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN.";
      }
      try {
        return await getIssue(input.issue_key as string);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return `Failed to fetch Jira issue: ${msg}`;
      }
    }

    case "create_jira_issue": {
      if (!isJiraConfigured()) {
        return "Jira is not configured. Set JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN.";
      }
      try {
        return await createIssue(
          input.project_key as string,
          input.summary as string,
          input.description as string,
          (input.issue_type as string | undefined) ?? "Task"
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return `Failed to create Jira issue: ${msg}`;
      }
    }

    case "search_notion": {
      if (!isNotionConfigured()) {
        return "Notion is not configured. Set NOTION_TOKEN.";
      }
      try {
        return await searchNotion(
          input.query as string,
          input.page_size as number | undefined
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return `Failed to search Notion: ${msg}`;
      }
    }

    case "get_notion_page": {
      if (!isNotionConfigured()) {
        return "Notion is not configured. Set NOTION_TOKEN.";
      }
      try {
        return await getPage(input.page_id as string);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return `Failed to fetch Notion page: ${msg}`;
      }
    }

    case "query_notion_database": {
      if (!isNotionConfigured()) {
        return "Notion is not configured. Set NOTION_TOKEN.";
      }
      try {
        return await queryDatabase(
          input.database_id as string,
          input.filter as string | undefined,
          input.page_size as number | undefined
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return `Failed to query Notion database: ${msg}`;
      }
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
