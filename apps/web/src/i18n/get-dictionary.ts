import { defaultLocale, isLocale, type Locale } from "./config";
import { mergeDictionary, type Dictionary, type PartialDictionary } from "./dictionaries";
import { de } from "./dictionaries/de";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { fr } from "./dictionaries/fr";
import { it } from "./dictionaries/it";
import { ru } from "./dictionaries/ru";
import { sr } from "./dictionaries/sr";

const overrides: Record<Exclude<Locale, "en">, PartialDictionary> = { sr, ru, it, de, es, fr };
const cache = new Map<Locale, Dictionary>();

export function getDictionary(locale: string): Dictionary {
  const resolved: Locale = isLocale(locale) ? locale : defaultLocale;
  const cached = cache.get(resolved);
  if (cached) return cached;
  const dictionary = resolved === "en" ? (en as Dictionary) : mergeDictionary(en as Dictionary, overrides[resolved]);
  cache.set(resolved, dictionary);
  return dictionary;
}
