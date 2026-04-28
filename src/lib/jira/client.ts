const JIRA_API_VERSION = "3";

function getJiraBase(): string {
  return `https://${process.env.JIRA_HOST}/rest/api/${JIRA_API_VERSION}`;
}

function getAuthHeader(): string {
  const email = process.env.JIRA_EMAIL!;
  const token = process.env.JIRA_API_TOKEN!;
  return `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
}

export function isJiraConfigured(): boolean {
  return (
    !!process.env.JIRA_HOST &&
    !!process.env.JIRA_EMAIL &&
    !!process.env.JIRA_API_TOKEN
  );
}

async function jiraAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getJiraBase()}${path}`, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jira API ${path} failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

// Recursively extract plain text from Atlassian Document Format (ADF)
function adfToText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (n.type === "text" && n.text) return n.text;
  if (n.content?.length) return n.content.map(adfToText).join("");
  return "";
}

interface RawJiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    issuetype: { name: string };
    priority: { name: string } | null;
    assignee: { displayName: string } | null;
    reporter: { displayName: string };
    description: unknown;
    created: string;
    updated: string;
  };
}

function formatIssue(raw: RawJiraIssue): string {
  const description = adfToText(raw.fields.description).trim().slice(0, 500);
  const url = `https://${process.env.JIRA_HOST}/browse/${raw.key}`;

  return [
    `**[${raw.key}](${url})** — ${raw.fields.summary}`,
    `- *Type*: ${raw.fields.issuetype.name} | *Status*: ${raw.fields.status.name} | *Priority*: ${raw.fields.priority?.name ?? "None"}`,
    `- *Assignee*: ${raw.fields.assignee?.displayName ?? "Unassigned"} | *Reporter*: ${raw.fields.reporter.displayName}`,
    `- *Created*: ${raw.fields.created} | *Updated*: ${raw.fields.updated}`,
    ...(description ? [`\n${description}`] : []),
  ].join("\n");
}

export async function searchIssues(jql: string, maxResults = 10): Promise<string> {
  const params = new URLSearchParams({
    jql,
    maxResults: String(Math.min(maxResults, 25)),
    fields:
      "summary,status,issuetype,priority,assignee,reporter,description,created,updated",
  });

  const data = await jiraAPI<{ issues: RawJiraIssue[]; total: number }>(
    `/search?${params}`
  );

  if (data.issues.length === 0) return "No issues found for that query.";

  return [
    `Found ${data.total} issue(s) (showing ${data.issues.length}):`,
    "",
    ...data.issues.map(formatIssue),
  ].join("\n\n");
}

export async function getIssue(issueKey: string): Promise<string> {
  const raw = await jiraAPI<RawJiraIssue>(
    `/issue/${issueKey}?fields=summary,status,issuetype,priority,assignee,reporter,description,created,updated`
  );
  return formatIssue(raw);
}

export async function createIssue(
  projectKey: string,
  summary: string,
  description: string,
  issueType: string
): Promise<string> {
  const body = {
    fields: {
      project: { key: projectKey },
      summary,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: description }],
          },
        ],
      },
      issuetype: { name: issueType },
    },
  };

  const result = await jiraAPI<{ key: string }>(
    "/issue",
    { method: "POST", body: JSON.stringify(body) }
  );

  const url = `https://${process.env.JIRA_HOST}/browse/${result.key}`;
  return `Created **[${result.key}](${url})** — ${summary}`;
}
