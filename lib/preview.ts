export type PreviewSession = {
  storeId: string;
  access: string;
  refresh?: string;
  expiresAt: number;
  createdAt: number;
};

const STORAGE_KEY = "project-y:storefront-preview";
const DEFAULT_TTL_MS = 30 * 60 * 1000;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readMap(): Record<string, PreviewSession> {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PreviewSession>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, PreviewSession>) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function randomToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createPreviewToken(input: { storeId: string; access: string; refresh?: string; ttlMs?: number }): string {
  const map = readMap();
  const now = Date.now();
  const token = randomToken();
  map[token] = {
    storeId: input.storeId,
    access: input.access,
    refresh: input.refresh,
    createdAt: now,
    expiresAt: now + (input.ttlMs || DEFAULT_TTL_MS),
  };
  writeMap(map);
  return token;
}

export function resolvePreviewToken(token: string): PreviewSession | null {
  if (!token) return null;
  const map = readMap();
  const payload = map[token];
  if (!payload) return null;
  if (payload.expiresAt <= Date.now()) {
    delete map[token];
    writeMap(map);
    return null;
  }
  return payload;
}
