export type FxTable = {
  base: string;
  rates: Record<string, number>;
};

function parseRatesFromEnv(): Record<string, number> {
  const raw = process.env.NEXT_PUBLIC_FX_RATES_JSON;
  if (!raw) {
    return {
      SAR: 1,
      AED: 0.98,
      USD: 0.27,
      EUR: 0.25,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    const valid: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        valid[key.toUpperCase()] = value;
      }
    }
    if (!valid.SAR) valid.SAR = 1;
    return valid;
  } catch {
    return { SAR: 1 };
  }
}

export function getFxTable(base = "SAR"): FxTable {
  const rates = parseRatesFromEnv();
  const normalizedBase = base.toUpperCase();
  if (!rates[normalizedBase]) {
    rates[normalizedBase] = 1;
  }
  return { base: normalizedBase, rates };
}

export function convertMinor(
  amountMinor: number,
  fromCurrency: string,
  toCurrency: string,
  fx: FxTable,
): number | null {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return amountMinor;

  const fromRate = fx.rates[from];
  const toRate = fx.rates[to];
  if (!fromRate || !toRate) return null;

  const amountInBase = amountMinor / fromRate;
  const converted = amountInBase * toRate;
  return Math.round(converted);
}

export function formatMinorMoney(minor: number, currencyCode: string, locale: string): string {
  const safeMinor = Number.isFinite(minor) ? minor : 0;
  const safeCurrency = (currencyCode || "SAR").toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeMinor / 100);
  } catch {
    return `${(safeMinor / 100).toFixed(2)} ${safeCurrency}`;
  }
}
