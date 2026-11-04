export interface GitHubPushInput {
  repoName: string;
  description: string;
  isPrivate: boolean;
  branch?: string;
}

export function sanitizeRepoName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'aegis-discord-bot';
}

export function isValidGitHubTokenFormat(token: string): boolean {
  const t = token.trim();
  return (
    t.startsWith('ghp_') ||
    t.startsWith('github_pat_') ||
    t.startsWith('gho_') ||
    /^[a-f0-9]{40}$/i.test(t)
  );
}

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'dev-dist',
  'build',
  'coverage',
  '.git',
  '.aistudio',
  '.playwright'
]);

const IGNORED_FILES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.DS_Store',
  'bun.lock',
  'package-lock.json'
]);

export function shouldIncludeFileInGitHubPush(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) return false;

  const parts = normalized.split('/');
  for (const part of parts.slice(0, -1)) {
    if (IGNORED_DIRS.has(part)) return false;
  }

  const fileName = parts[parts.length - 1];
  if (IGNORED_FILES.has(fileName)) return false;
  if (fileName.startsWith('.env') && fileName !== '.env.example') return false;
  if (fileName.endsWith('.log')) return false;

  return true;
}
