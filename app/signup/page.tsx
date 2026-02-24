"use client";

import Link from "next/link";
import { Suspense } from "react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { getStoredSession } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast, ToastStack } from "@/components/ui/ToastStack";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [brand, setBrand] = useState("");
  const [countryCode, setCountryCode] = useState("SA");
  const [email, setEmail] = useState(search.get("email") || "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState(search.get("token") || "");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const session = getStoredSession();
    if (session.access) router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    const magicToken = search.get("token");
    if (!magicToken) return;
    setLoading(true);
    void authApi
      .verifyEmailByToken(magicToken)
      .then(() => {
        pushToast("success", "Email verified. You can login now.");
        setPendingVerification(false);
        setToken("");
      })
      .catch((err) => pushToast("error", err instanceof Error ? err.message : "Invalid or expired verification link."))
      .finally(() => setLoading(false));
  }, [search]);

  function pushToast(tone: Toast["tone"], message: string) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600);
  }

  async function onSignup(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !brand.trim() || !email.includes("@") || password.length < 8 || countryCode.length !== 2) {
      pushToast("error", "Fill all signup fields correctly.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.signup({
        full_name: fullName.trim(),
        brand: brand.trim(),
        email: email.trim().toLowerCase(),
        password,
        country_code: countryCode.trim().toUpperCase(),
      });
      setPendingVerification(true);
      if (res.verification_token) setToken(res.verification_token);
      if (res.otp) setOtp(res.otp);
      pushToast("success", res.created ? "Signup created. Verify email now." : "Signup resumed. Verify email now.");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || !otp.trim()) {
      pushToast("error", "Enter email and OTP.");
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyEmailByOtp(email.trim().toLowerCase(), otp.trim());
      setPendingVerification(false);
      setToken("");
      setOtp("");
      pushToast("success", "Email verified. You can login now.");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (!email.includes("@")) {
      pushToast("error", "Enter your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resendVerification(email.trim().toLowerCase());
      if (res.verification_token) setToken(res.verification_token);
      if (res.otp) setOtp(res.otp);
      setPendingVerification(true);
      pushToast("success", "Verification sent again.");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Failed to resend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4 py-10 sm:px-8">
      <ToastStack toasts={toasts} />
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-black">Signup</h1>
          <p className="soft mt-2">Create your account, then verify email with OTP or magic link.</p>
        </Card>

        <Card className="p-6">
          <form onSubmit={onSignup} className="space-y-3">
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
            <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" />
            <input className="input" value={countryCode} onChange={(e) => setCountryCode(e.target.value.toUpperCase())} placeholder="Country code" />
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
            <Button disabled={loading}>{loading ? "Please wait..." : "Submit"}</Button>
          </form>
        </Card>

        {pendingVerification || token || otp ? (
          <Card className="p-6">
            <h2 className="text-lg font-bold">Verify your email</h2>
            <p className="soft mt-2 text-sm">Use OTP from email or click magic link from your inbox.</p>

            {token ? (
              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs break-all">
                <p className="font-semibold">Magic token (dev):</p>
                <p>{token}</p>
              </div>
            ) : null}
            {otp ? (
              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p>
                  OTP (dev): <strong>{otp}</strong>
                </p>
              </div>
            ) : null}

            <form onSubmit={onVerifyOtp} className="mt-4 space-y-2">
              <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Email OTP" />
              <div className="flex gap-2">
                <Button disabled={loading}>Verify OTP</Button>
                <Button type="button" variant="muted" onClick={() => void onResend()} disabled={loading}>
                  Resend verification
                </Button>
              </div>
            </form>
          </Card>
        ) : null}

        <Card className="p-4">
          <Link href="/login" className="text-sm font-semibold text-blue-700 underline">
            Already have an account? Login
          </Link>
        </Card>
      </div>
    </main>
  );
}
