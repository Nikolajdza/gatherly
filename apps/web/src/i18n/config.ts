import { locales as sharedLocales, type Locale as SharedLocale } from "@gatherly/shared";

export const locales = sharedLocales;
export type Locale = SharedLocale;
export const defaultLocale: Locale = "en";
export const localeCookie = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = {
  en: "English",
  sr: "Srpski",
  ru: "Русский",
  it: "Italiano",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
};

const intlTags: Record<Locale, string> = {
  en: "en-GB",
  sr: "sr-Latn-RS",
  ru: "ru-RU",
  it: "it-IT",
  de: "de-DE",
  es: "es-ES",
  fr: "fr-FR",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function intlLocale(locale: Locale) {
  return intlTags[locale];
}

export function formatDate(locale: Locale, value: string | null | undefined, style: "long" | "short" = "long") {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  }).format(date);
}

export function formatPrice(locale: Locale, cents: number | null | undefined, currency: string | null | undefined) {
  if (cents === null || cents === undefined) return "";
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency: currency ?? "EUR",
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency ?? ""}`.trim();
  }
}
