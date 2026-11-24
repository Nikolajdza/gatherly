const cyrillicMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "dj", е: "e", ж: "z", з: "z", и: "i",
  ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o", п: "p", р: "r",
  с: "s", т: "t", ћ: "c", у: "u", ф: "f", х: "h", ц: "c", ч: "c", џ: "dz", ш: "s",
};

export function slugify(title: string, suffix: string): string {
  const folded = title
    .trim()
    .toLowerCase()
    .split("")
    .map((character) => cyrillicMap[character] ?? character)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const base = folded
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const safeBase = base.length > 0 ? base : "experience";
  const safeSuffix = suffix.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  return safeSuffix ? `${safeBase}-${safeSuffix}` : safeBase;
}

export function formatMoney(cents: number | null | undefined, currency: string | null | undefined, locale: string): string | null {
  if (cents === null || cents === undefined || !currency) return null;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

export function parsePriceToCents(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned || !/\d/.test(cleaned)) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);
  const digits = cleaned.replace(/[.,]/g, "");
  if (!/^\d+$/.test(digits)) return null;

  if (decimalIndex === -1) return Number(digits) * 100;

  const fractionLength = cleaned.length - decimalIndex - 1;
  if (fractionLength === 2) {
    const whole = cleaned.slice(0, decimalIndex).replace(/[.,]/g, "");
    const fraction = cleaned.slice(decimalIndex + 1);
    return Number(whole || "0") * 100 + Number(fraction);
  }

  return Number(digits) * 100;
}
