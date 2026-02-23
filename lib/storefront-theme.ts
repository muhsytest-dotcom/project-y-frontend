import { CSSProperties } from "react";

type ThemeLike = Record<string, unknown> | null | undefined;

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function asObj(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

export function resolveStorefrontTheme(store: ThemeLike, activeTheme: ThemeLike): {
  themeKey: string;
  style: CSSProperties;
} {
  const settings = asObj(activeTheme?.settings_json);
  const code = asText(activeTheme?.code).toLowerCase();
  const name = asText(activeTheme?.name).toLowerCase();
  const rtl = Boolean(store?.rtl_enabled);

  const themeKey =
    code.includes("minimal") || name.includes("minimal")
      ? "minimal"
      : code.includes("luxe") || code.includes("luxury") || name.includes("luxe")
        ? "luxe"
        : code.includes("warm") || code.includes("desert") || name.includes("warm")
          ? "desert"
          : "classic";

  const palettes: Record<string, Record<string, string>> = {
    classic: {
      "--accent": "#2667ff",
      "--accent-2": "#0b4bd4",
      "--line": "#d9ddcf",
      "--card": "#ffffff",
      "--text": "#171914",
      "--text-soft": "#4f5546",
      "--bg": "#f6f7f4",
    },
    minimal: {
      "--accent": "#1f2937",
      "--accent-2": "#111827",
      "--line": "#d1d5db",
      "--card": "#ffffff",
      "--text": "#111827",
      "--text-soft": "#4b5563",
      "--bg": "#f9fafb",
    },
    luxe: {
      "--accent": "#9f7a1b",
      "--accent-2": "#7c5f14",
      "--line": "#e9d9ad",
      "--card": "#fffcf3",
      "--text": "#2f2413",
      "--text-soft": "#6d5a34",
      "--bg": "#f8f2df",
    },
    desert: {
      "--accent": "#c34a2c",
      "--accent-2": "#a53d22",
      "--line": "#e8c8ba",
      "--card": "#fff7f3",
      "--text": "#2d1d17",
      "--text-soft": "#7a5045",
      "--bg": "#fbece5",
    },
  };

  const base = palettes[themeKey];
  const style: Record<string, string> = {
    ...base,
  };

  const settingAccent = asText(settings.accent_color).trim();
  const settingAccent2 = asText(settings.accent_color_2).trim();
  const settingBg = asText(settings.background_color).trim();
  if (settingAccent) style["--accent"] = settingAccent;
  if (settingAccent2) style["--accent-2"] = settingAccent2;
  if (settingBg) style["--bg"] = settingBg;

  return {
    themeKey: rtl ? `${themeKey}-rtl` : themeKey,
    style: style as CSSProperties,
  };
}
