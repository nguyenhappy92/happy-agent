const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export function isNotionConfigured(): boolean {
  return !!process.env.NOTION_TOKEN;
}

async function notionAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API ${path} failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function richTextToPlain(richText: Array<{ plain_text: string }>): string {
  return richText.map((t) => t.plain_text).join("");
}

// Accepts a full Notion URL or a bare/dashed UUID and returns a 32-char ID.
export function parseNotionId(input: string): string {
  const urlMatch = input.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  if (urlMatch) return urlMatch[1];

  const dashedMatch = input.match(
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
  );
  if (dashedMatch) return dashedMatch[1].replace(/-/g, "");

  if (/^[a-f0-9]{32}$/i.test(input)) return input;
  return input; // pass through; Notion will return a useful error
}

function extractTitle(obj: Record<string, unknown>): string {
  // Page: title lives inside properties as the field with type === "title"
  const props = obj.properties as Record<string, unknown> | undefined;
  if (props) {
    for (const val of Object.values(props)) {
      const v = val as { type?: string; title?: Array<{ plain_text: string }> };
      if (v.type === "title" && v.title?.length) return richTextToPlain(v.title);
    }
  }
  // Database: title is a top-level array
  const title = obj.title as Array<{ plain_text: string }> | undefined;
  if (title?.length) return richTextToPlain(title);
  return "Untitled";
}

// ---------------------------------------------------------------------------
// search_notion
// ---------------------------------------------------------------------------

interface NotionSearchResult {
  results: Array<{
    id: string;
    object: string;
    url: string;
    last_edited_time: string;
    [key: string]: unknown;
  }>;
  has_more: boolean;
}

export async function searchNotion(query: string, pageSize = 10): Promise<string> {
  const data = await notionAPI<NotionSearchResult>("/search", {
    method: "POST",
    body: JSON.stringify({ query, page_size: Math.min(pageSize, 20) }),
  });

  if (data.results.length === 0) {
    return `No pages or databases found for "${query}". Make sure the integration has been added to the relevant pages.`;
  }

  const lines = [
    `Found ${data.results.length} result(s)${data.has_more ? " (more available)" : ""}:`,
    "",
    ...data.results.map((r) => {
      const title = extractTitle(r as Record<string, unknown>);
      const type = r.object === "database" ? "Database" : "Page";
      return [
        `*${type}*: **${title}**`,
        `  ID: \`${r.id}\`  |  URL: ${r.url}`,
        `  Last edited: ${r.last_edited_time}`,
      ].join("\n");
    }),
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// get_notion_page
// ---------------------------------------------------------------------------

interface Block {
  type: string;
  [key: string]: unknown;
}

interface BlockContent {
  rich_text?: Array<{ plain_text: string }>;
  checked?: boolean;
}

function blockToText(block: Block): string {
  const type = block.type;
  const content = block[type] as BlockContent | undefined;
  const text = content?.rich_text ? richTextToPlain(content.rich_text) : "";

  switch (type) {
    case "paragraph":           return text;
    case "heading_1":           return `# ${text}`;
    case "heading_2":           return `## ${text}`;
    case "heading_3":           return `### ${text}`;
    case "bulleted_list_item":  return `• ${text}`;
    case "numbered_list_item":  return `1. ${text}`;
    case "to_do":               return `${content?.checked ? "[x]" : "[ ]"} ${text}`;
    case "quote":               return `> ${text}`;
    case "code":                return `\`\`\`\n${text}\n\`\`\``;
    case "divider":             return "---";
    case "callout":             return `> ${text}`;
    default:                    return text;
  }
}

interface BlocksResult {
  results: Block[];
  has_more: boolean;
}

export async function getPage(pageIdOrUrl: string): Promise<string> {
  const id = parseNotionId(pageIdOrUrl);

  const [pageData, blocksData] = await Promise.all([
    notionAPI<Record<string, unknown>>(`/pages/${id}`),
    notionAPI<BlocksResult>(`/blocks/${id}/children?page_size=50`),
  ]);

  const title = extractTitle(pageData);
  const url = pageData.url as string;
  const lastEdited = pageData.last_edited_time as string;

  const bodyLines = blocksData.results.map(blockToText).filter(Boolean);

  const lines = [
    `**${title}**`,
    `URL: ${url}`,
    `Last edited: ${lastEdited}`,
    "",
    ...bodyLines,
    ...(blocksData.has_more ? ["", "_...content truncated (page has more blocks)_"] : []),
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// query_notion_database
// ---------------------------------------------------------------------------

interface TitleProp       { type: "title";        title: Array<{ plain_text: string }> }
interface RichTextProp    { type: "rich_text";    rich_text: Array<{ plain_text: string }> }
interface SelectProp      { type: "select";       select: { name: string } | null }
interface MultiSelectProp { type: "multi_select"; multi_select: Array<{ name: string }> }
interface StatusProp      { type: "status";       status: { name: string } | null }
interface CheckboxProp    { type: "checkbox";     checkbox: boolean }
interface DateProp        { type: "date";         date: { start: string; end?: string } | null }
interface NumberProp      { type: "number";       number: number | null }
interface PeopleProp      { type: "people";       people: Array<{ name?: string }> }
interface UrlProp         { type: "url";          url: string | null }
interface UnknownProp     { type: string }

type NotionPropertyValue =
  | TitleProp | RichTextProp | SelectProp | MultiSelectProp | StatusProp
  | CheckboxProp | DateProp | NumberProp | PeopleProp | UrlProp | UnknownProp;

function propertyToText(prop: NotionPropertyValue): string {
  switch (prop.type) {
    case "title":        return richTextToPlain((prop as TitleProp).title);
    case "rich_text":    return richTextToPlain((prop as RichTextProp).rich_text);
    case "select":       return (prop as SelectProp).select?.name ?? "";
    case "multi_select": return (prop as MultiSelectProp).multi_select.map((s) => s.name).join(", ");
    case "status":       return (prop as StatusProp).status?.name ?? "";
    case "checkbox":     return (prop as CheckboxProp).checkbox ? "Yes" : "No";
    case "date": {
      const d = (prop as DateProp).date;
      return d ? `${d.start}${d.end ? ` → ${d.end}` : ""}` : "";
    }
    case "number": {
      const n = (prop as NumberProp).number;
      return n != null ? String(n) : "";
    }
    case "people":       return (prop as PeopleProp).people.map((p) => p.name ?? "Unknown").join(", ");
    case "url":          return (prop as UrlProp).url ?? "";
    default:             return "";
  }
}

interface DatabaseQueryResult {
  results: Array<Record<string, unknown>>;
  has_more: boolean;
}

export async function queryDatabase(
  databaseIdOrUrl: string,
  filter?: string,
  pageSize = 10
): Promise<string> {
  const id = parseNotionId(databaseIdOrUrl);
  const body: Record<string, unknown> = {
    page_size: Math.min(pageSize, 20),
  };

  // Accept a raw Notion filter JSON object for power users
  if (filter) {
    try {
      body.filter = JSON.parse(filter);
    } catch {
      // Not valid JSON — ignore and return all rows
    }
  }

  const data = await notionAPI<DatabaseQueryResult>(`/databases/${id}/query`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (data.results.length === 0) return "No rows found in this database.";

  const rows = data.results.map((row) => {
    const props = row.properties as Record<string, NotionPropertyValue> | undefined;
    if (!props) return "- (empty row)";

    const parts = Object.entries(props)
      .map(([key, val]) => {
        const text = propertyToText(val);
        return text ? `${key}: ${text}` : null;
      })
      .filter(Boolean);

    return `- ${parts.join(" | ")}`;
  });

  return [
    `${data.results.length} row(s)${data.has_more ? " (more available)" : ""}:`,
    "",
    ...rows,
  ].join("\n");
}
