import type { Locale } from "@gatherly/shared";

export { cleanCategory, currencyFromText, dueDateFrom, priceFromText } from "@gatherly/shared";

export const languageNames: Record<Locale, string> = {
  en: "English",
  sr: "Serbian (Latin script, ekavian)",
  ru: "Russian",
  it: "Italian",
  de: "German",
  es: "Spanish",
  fr: "French",
};

export function cleanLine(value: string | null | undefined, max: number): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function priorityFrom(value: unknown): "low" | "medium" | "high" {
  return value === "low" || value === "high" ? value : "medium";
}
