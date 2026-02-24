"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast, ToastStack } from "@/components/ui/ToastStack";
import { getStoredSession, setStoredSession } from "@/lib/session";
import { Locale, t } from "@/lib/i18n";
import { getPreferredLocale, setPreferredLocale } from "@/lib/locale";

type Mode = "signup" | "login" | "verify";

export default function AuthPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(() => getPreferredLocale("en"));
  const [mode, setMode] = useState<Mode>("signup");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [brand, setBrand] = useState("");
  const [countryCode, setCountryCode] = useState("SA");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const words = t(locale).auth;
  const toast = words.toast;

  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const session = getStoredSession();
    if (session.access) {
      router.replace("/dashboard");
    }
  }, [router]);

  function pushToast(tone: Toast["tone"], message: string) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }

  const validationError = useMemo(() => {
    if (mode === "signup") {
      if (!fullName.trim()) {
        return words.validation.fullNameRequired;
      }
      if (!brand.trim()) {
        return words.validation.brandRequired;
      }
      if (!countryCode.trim() || countryCode.trim().length !== 2) {
        return words.validation.countryCodeInvalid;
      }
    }

    if (mode !== "verify") {
      if (!email.includes("@")) {
        return words.validation.emailInvalid;
      }
      if (password.length < 8) {
        return words.validation.passwordTooShort;
      }
    }

    if (mode === "verify" && !token.trim()) {
      return words.validation.verificationTokenRequired;
    }

    return "";
  }, [mode, fullName, brand, countryCode, email, password, token, words.validation]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (validationError) {
      pushToast("error", validationError);
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await authApi.signup({
          full_name: fullName.trim(),
          brand: brand.trim(),
          email: email.trim().toLowerCase(),
          password,
          country_code: countryCode.trim().toUpperCase(),
        });
        setToken(res.verification_token);
        setMode("verify");
        pushToast("success", toast.signupComplete);
      } else if (mode === "login") {
        await authApi.login(email.trim(), password);
        // Session is backed by backend-issued httpOnly cookies.
        setStoredSession({ access: "", refresh: "" });
        pushToast("success", toast.loginSuccess);
        router.replace("/dashboard");
        setTimeout(() => {
          if (window.location.pathname === "/auth") {
            window.location.assign("/dashboard");
          }
        }, 80);
      } else {
        await authApi.verifyEmail(token.trim());
        pushToast("success", toast.emailVerified);
      }
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.requestFailed);
    } finally {
      setLoading(false);
    }
  }

  async function onResendVerification() {
    if (!email.trim()) {
      pushToast("error", toast.emailRequiredForResend);
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resendVerification(email.trim());
      if (res.verification_token) {
        setToken(res.verification_token);
      }
      pushToast("info", toast.verificationReissued);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : toast.resendFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4 py-10 sm:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ToastStack toasts={toasts} />
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="badge badge-info">{words.badge}</p>
              <h1 className="mt-3 text-2xl font-black sm:text-3xl">{words.title}</h1>
              <p className="soft mt-2">{words.subtitle}</p>
            </div>
            <select
              className="select w-auto min-w-20"
              value={locale}
              onChange={(e) => {
                const next = e.target.value as Locale;
                setLocale(next);
                setPreferredLocale(next);
              }}
            >
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 grid grid-cols-3 gap-2">
            <Button variant={mode === "signup" ? "primary" : "muted"} onClick={() => setMode("signup")}>{words.signup}</Button>
            <Button variant={mode === "login" ? "primary" : "muted"} onClick={() => setMode("login")}>{words.login}</Button>
            <Button variant={mode === "verify" ? "primary" : "muted"} onClick={() => setMode("verify")}>{words.verify}</Button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" ? (
              <>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={words.fullName} />
                <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={words.brand} />
                <input className="input" value={countryCode} onChange={(e) => setCountryCode(e.target.value.toUpperCase())} placeholder={words.countryCode} />
              </>
            ) : null}

            {mode !== "verify" ? (
              <>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={words.email} type="email" />
                <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={words.password} type="password" />
              </>
            ) : null}

            {mode === "verify" ? (
              <>
                <input className="input code" value={token} onChange={(e) => setToken(e.target.value)} placeholder={words.verificationToken} />
                <Button type="button" variant="muted" onClick={onResendVerification} disabled={loading}>
                  {words.resend}
                </Button>
              </>
            ) : null}

            {validationError ? <p className="text-sm text-rose-700">{validationError}</p> : null}

            <Button disabled={loading || Boolean(validationError)}>{loading ? words.wait : words.submit}</Button>
          </form>

          <div className="mt-5">
            <Link href="/dashboard" className="text-sm font-semibold text-blue-700 underline">
              {words.goDashboard}
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
