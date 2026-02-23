"use client";

import Link from "next/link";
import { useState } from "react";
import { Locale, t } from "@/lib/i18n";
import { getPreferredLocale, setPreferredLocale } from "@/lib/locale";

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>(() => getPreferredLocale("en"));
  const words = t(locale).home;

  function onLocaleChange(next: Locale) {
    setLocale(next);
    setPreferredLocale(next);
  }

  return (
    <main className="px-4 py-10 sm:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="panel p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <p className="badge badge-info">{words.badge}</p>
            <select className="select w-auto min-w-20" value={locale} onChange={(e) => onLocaleChange(e.target.value as Locale)}>
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
            {words.title}
          </h1>
          <p className="soft mt-4 max-w-3xl text-base sm:text-lg">
            {words.subtitle}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/auth" className="button button-primary">
              {words.signupLogin}
            </Link>
            <Link href="/dashboard" className="button button-muted">
              {words.openDashboard}
            </Link>
            <Link href="/storefront" className="button button-muted">
              {words.openStorefront}
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {words.points.map((point) => (
            <article key={point} className="panel p-5">
              <h2 className="text-lg font-bold">{point}</h2>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
