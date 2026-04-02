import crypto from "crypto";

const API_BASE = "https://api.github.com";

// ---------------------------------------------------------------------------
// GitHub App auth — generates short-lived installation tokens from a private key
// ---------------------------------------------------------------------------

let _cachedToken: { token: string; expiresAt: number } | null = null;

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

function buildJWT(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(
    Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  );
  const payload = base64url(
    Buffer.from(
      JSON.stringify({
        iat: now - 60,
        exp: now + 600, // 10 minutes
        iss: appId,
      })
    )
  );

  const signature = crypto
    .createSign("RSA-SHA256")
    .update(`${header}.${payload}`)
    .sign(privateKey, "base64url");

  return `${header}.${payload}.${signature}`;
}

async function getInstallationToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now + 60_000) {
    return _cachedToken.token;
  }

  const appId = process.env.GITHUB_APP_ID!;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID!;
  const rawKey = process.env.GITHUB_APP_PRIVATE_KEY!;

  // Support PEM stored with literal \n (common in env vars / Vercel)
  const privateKey = rawKey.includes("\\n")
    ? rawKey.replace(/\\n/g, "\n")
    : rawKey;

  const jwt = buildJWT(appId, privateKey);

  const res = await fetch(
    `${API_BASE}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `GitHub App token exchange failed (${res.status}): ${body}`
    );
  }

  const data = (await res.json()) as { token: string; expires_at: string };
  _cachedToken = {
    token: data.token,
    expiresAt: new Date(data.expires_at).getTime(),
  };

  return _cachedToken.token;
}

// ---------------------------------------------------------------------------
// Auth resolver — prefers GitHub App, falls back to PAT
// ---------------------------------------------------------------------------

export function isGitHubConfigured(): boolean {
  const hasApp =
    !!process.env.GITHUB_APP_ID &&
    !!process.env.GITHUB_APP_PRIVATE_KEY &&
    !!process.env.GITHUB_APP_INSTALLATION_ID;
  const hasPAT = !!process.env.GITHUB_TOKEN;
  return hasApp || hasPAT;
}

async function getAuthToken(): Promise<string> {
  if (
    process.env.GITHUB_APP_ID &&
    process.env.GITHUB_APP_PRIVATE_KEY &&
    process.env.GITHUB_APP_INSTALLATION_ID
  ) {
    return getInstallationToken();
  }

  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  throw new Error(
    "GitHub is not configured. Set GITHUB_APP_ID + GITHUB_APP_PRIVATE_KEY + GITHUB_APP_INSTALLATION_ID, or GITHUB_TOKEN."
  );
}

// ---------------------------------------------------------------------------
// GitHub REST helpers
// ---------------------------------------------------------------------------

async function githubAPI<T>(path: string): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${path} failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  state: string;
  user: { login: string };
  head: { ref: string };
  base: { ref: string };
  changed_files: number;
  additions: number;
  deletions: number;
}

export interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parsePRUrl(
  input: string
): { owner: string; repo: string; number: number } | null {
  const match = input.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (match) {
    return { owner: match[1], repo: match[2], number: parseInt(match[3]) };
  }

  const shortMatch = input.match(/^([^/]+)\/([^/]+)#(\d+)$/);
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: shortMatch[2],
      number: parseInt(shortMatch[3]),
    };
  }

  return null;
}

export async function getPullRequest(
  owner: string,
  repo: string,
  number: number
): Promise<PullRequest> {
  return githubAPI<PullRequest>(`/repos/${owner}/${repo}/pulls/${number}`);
}

export async function getPRFiles(
  owner: string,
  repo: string,
  number: number
): Promise<PRFile[]> {
  return githubAPI<PRFile[]>(`/repos/${owner}/${repo}/pulls/${number}/files`);
}

const MAX_DIFF_LENGTH = 12_000;

export async function fetchPRContext(
  owner: string,
  repo: string,
  number: number
): Promise<string> {
  const [pr, files] = await Promise.all([
    getPullRequest(owner, repo, number),
    getPRFiles(owner, repo, number),
  ]);

  const header = [
    `# PR #${pr.number}: ${pr.title}`,
    `**Author:** ${pr.user.login}`,
    `**Branch:** ${pr.head.ref} → ${pr.base.ref}`,
    `**Stats:** ${pr.changed_files} files changed, +${pr.additions} −${pr.deletions}`,
    "",
    "## Description",
    pr.body || "_No description provided._",
    "",
    "## Changed Files",
  ].join("\n");

  let diffText = "";
  let totalLength = 0;
  let truncated = false;

  for (const file of files) {
    const fileHeader = `\n### ${file.filename} (${file.status}, +${file.additions} −${file.deletions})\n`;

    if (!file.patch) {
      diffText += fileHeader + "_Binary file or no diff available._\n";
      continue;
    }

    if (totalLength + file.patch.length > MAX_DIFF_LENGTH) {
      truncated = true;
      const remaining = MAX_DIFF_LENGTH - totalLength;
      if (remaining > 200) {
        diffText +=
          fileHeader +
          "```diff\n" +
          file.patch.slice(0, remaining) +
          "\n... (truncated)\n```\n";
      } else {
        diffText += fileHeader + "_Diff omitted (too large)._\n";
      }
      break;
    }

    diffText += fileHeader + "```diff\n" + file.patch + "\n```\n";
    totalLength += file.patch.length;
  }

  if (truncated) {
    const remaining = files
      .slice(files.indexOf(files.find((f) => !diffText.includes(f.filename))!))
      .filter((f) => f && !diffText.includes(f.filename));
    if (remaining.length > 0) {
      diffText += `\n_...and ${remaining.length} more file(s) not shown._\n`;
    }
  }

  return header + diffText;
}
