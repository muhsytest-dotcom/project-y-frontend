import { ApiError, authApi } from "@/lib/api";

const ACCESS_KEY = "projecty_access";
const REFRESH_KEY = "projecty_refresh";
const ACCESS_COOKIE = "projecty_access";
const REFRESH_COOKIE = "projecty_refresh";

export type SessionState = {
  access: string;
  refresh: string;
};

export function getStoredSession(): SessionState {
  if (typeof window === "undefined") {
    return { access: "", refresh: "" };
  }
  const cookies = Object.fromEntries(
    document.cookie
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const idx = item.indexOf("=");
        if (idx === -1) return [item, ""];
        return [decodeURIComponent(item.slice(0, idx)), decodeURIComponent(item.slice(idx + 1))];
      }),
  );
  return {
    access: localStorage.getItem(ACCESS_KEY) || cookies[ACCESS_COOKIE] || "",
    refresh: localStorage.getItem(REFRESH_KEY) || cookies[REFRESH_COOKIE] || "",
  };
}

export function setStoredSession(session: SessionState) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(ACCESS_KEY, session.access);
  localStorage.setItem(REFRESH_KEY, session.refresh);
  document.cookie = `${ACCESS_COOKIE}=${encodeURIComponent(session.access)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(session.refresh)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  document.cookie = `${ACCESS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${REFRESH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export async function withAutoRefresh<T>(
  session: SessionState,
  onSessionUpdate: (next: SessionState) => void,
  request: (accessToken: string) => Promise<T>,
): Promise<T> {
  try {
    return await request(session.access);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || !session.refresh) {
      throw err;
    }

    const refreshed = await authApi.refresh(session.refresh);
    const next = {
      access: refreshed.access,
      refresh: session.refresh,
    };
    setStoredSession(next);
    onSessionUpdate(next);
    return await request(next.access);
  }
}
