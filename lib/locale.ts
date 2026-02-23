import type { Locale } from "@/lib/i18n";

const LOCALE_KEY = "projecty_locale";

export function getPreferredLocale(defaultLocale: Locale = "en"): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const value = window.localStorage.getItem(LOCALE_KEY);
  if (value === "en" || value === "ar") return value;
  return defaultLocale;
}

export function setPreferredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_KEY, locale);
}
