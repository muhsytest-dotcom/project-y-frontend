import { ApiError, authApi } from "@/lib/api";

export type SessionState = {
  access: string;
  refresh: string;
};

let inMemorySession: SessionState = { access: "", refresh: "" };

export function getStoredSession(): SessionState {
  return inMemorySession;
}

export function setStoredSession(session: SessionState) {
  inMemorySession = { access: session.access || "", refresh: session.refresh || "" };
}

export function clearStoredSession() {
  inMemorySession = { access: "", refresh: "" };
}

export async function withAutoRefresh<T>(
  session: SessionState,
  onSessionUpdate: (next: SessionState) => void,
  request: (accessToken: string) => Promise<T>,
): Promise<T> {
  try {
    return await request(session.access);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      throw err;
    }

    await authApi.refresh();
    const next = {
      access: "",
      refresh: "",
    };
    setStoredSession(next);
    onSessionUpdate(next);
    return await request("");
  }
}
