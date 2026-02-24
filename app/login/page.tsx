"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, authApi } from "@/lib/api";
import { clearStoredSession, setStoredSession } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast, ToastStack } from "@/components/ui/ToastStack";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let active = true;
    void authApi
      .me()
      .then(() => {
        if (!active) return;
        router.replace("/dashboard");
      })
      .catch(() => {
        // expected when not logged in
      });
    return () => {
      active = false;
    };
  }, [router]);

  function pushToast(tone: Toast["tone"], message: string) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 8) {
      pushToast("error", "Enter a valid email and password (8+ chars).");
      return;
    }
    setLoading(true);
    try {
      await authApi.login(email.trim().toLowerCase(), password);
      setStoredSession({ access: "", refresh: "" });
      await authApi.meStores();
      pushToast("success", "Logged in.");
      router.replace("/dashboard");
      router.refresh();
      setTimeout(() => {
        window.location.assign("/dashboard");
      }, 50);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        pushToast(
          "error",
          "Login succeeded but session cookie was not accepted. For local HTTP, set AUTH_COOKIE_SECURE=false and clear AUTH_COOKIE_DOMAIN.",
        );
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        const payload = (err.payload || {}) as Record<string, unknown>;
        if (payload.code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerification(true);
          pushToast("info", "Email is not verified yet.");
          return;
        }
      }
      pushToast("error", err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (!email.includes("@")) {
      pushToast("error", "Enter your email first.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resendVerification(email.trim().toLowerCase());
      pushToast("success", "Verification email resent.");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Failed to resend verification.");
    } finally {
      setLoading(false);
    }
  }

  async function onLogoutStaleSession() {
    try {
      await authApi.logout();
    } catch {
      // best effort
    }
    clearStoredSession();
    pushToast("info", "Session cleared.");
  }

  return (
    <main className="px-4 py-10 sm:px-8">
      <ToastStack toasts={toasts} />
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-black">Login</h1>
          <p className="soft mt-2">Sign in to your dashboard.</p>
        </Card>

        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
            <Button disabled={loading}>{loading ? "Please wait..." : "Submit"}</Button>
          </form>

          {needsVerification ? (
            <div className="mt-4 space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
              <p>Your email is not verified yet.</p>
              <div className="flex gap-2">
                <Button variant="muted" onClick={() => void resendVerification()} disabled={loading}>
                  Resend verification
                </Button>
                <Link href={`/signup?email=${encodeURIComponent(email)}`} className="button button-primary">
                  Go to signup verification
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link href="/signup" className="font-semibold text-blue-700 underline">
              Create account
            </Link>
            <button type="button" onClick={() => void onLogoutStaleSession()} className="font-semibold text-zinc-700 underline">
              Clear stale session
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}
