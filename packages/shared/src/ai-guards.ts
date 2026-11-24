import { parsePriceToCents } from "./format";
import { currencies } from "./schemas";

const currencySigns: Record<(typeof currencies)[number], RegExp> = {
  EUR: /€|\beur\b|\beuro?s?\b/i,
  RSD: /\brsd\b|\bdin\.?|дин/i,
  USD: /\$|\busd\b/i,
  GBP: /£|\bgbp\b/i,
  RUB: /₽|\brub\b|руб/i,
};

/**
 * Accepts a model-reported price only when the exact figure appears in the source text.
 * The model may point at a price; it can never introduce one.
 */
export function priceFromText(source: string, reported: string | null | undefined): number | null {
  if (!reported) return null;
  const cents = parsePriceToCents(reported);
  if (cents === null || cents <= 0) return null;
  const candidates = source.match(/\d[\d\s.,']*\d|\d/g) ?? [];
  return candidates.some((candidate) => parsePriceToCents(candidate.replace(/[\s']/g, "")) === cents) ? cents : null;
}

export function currencyFromText(source: string, reported: string | null | undefined): string | null {
  const code = reported?.trim().toUpperCase();
  if (!code || !(currencies as readonly string[]).includes(code)) return null;
  return currencySigns[code as (typeof currencies)[number]].test(source) ? code : null;
}

/** Finds the first currency code whose sign appears in the text. */
export function detectCurrency(source: string): string | null {
  return currencies.find((code) => currencySigns[code].test(source)) ?? null;
}

export function cleanCategory(value: string | null | undefined, known: string[]): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) return null;
  const match = known.find((entry) => entry.toLowerCase() === text.toLowerCase());
  return match ?? text.slice(0, 40);
}

export function dueDateFrom(days: number | null | undefined, today: Date, eventDate: Date | null): string | null {
  if (typeof days !== "number" || !Number.isFinite(days) || days < 0 || days > 730) return null;
  const due = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + Math.round(days)));
  const capped = eventDate && due > eventDate ? eventDate : due;
  return capped.toISOString().slice(0, 10);
}
