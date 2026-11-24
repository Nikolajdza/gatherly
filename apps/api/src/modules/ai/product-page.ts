import * as cheerio from "cheerio";
import { parsePriceToCents } from "@gatherly/shared";

export type PageFacts = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  currency: string | null;
};

const currencies = new Set(["EUR", "RSD", "USD", "GBP", "RUB"]);

export function parseProductHtml(html: string, pageUrl: string): PageFacts {
  const $ = cheerio.load(html);
  const meta = (property: string) =>
    $(`meta[property="${property}"]`).attr("content") || $(`meta[name="${property}"]`).attr("content") || null;

  let title = clean(meta("og:title")) || clean($("title").first().text()) || null;
  let description = clean(meta("og:description")) || clean(meta("description"));
  let imageUrl = absolute(meta("og:image"), pageUrl);
  let priceCents = parsePriceToCents(meta("product:price:amount") || meta("og:price:amount"));
  let currency = normalizeCurrency(meta("product:price:currency") || meta("og:price:currency"));

  $("script[type='application/ld+json']").each((_, element) => {
    const raw = $(element).text();
    for (const node of jsonLdNodes(raw)) {
      const type = Array.isArray(node["@type"]) ? node["@type"].join(" ") : String(node["@type"] ?? "");
      if (!/product/i.test(type)) continue;
      title = title || clean(typeof node.name === "string" ? node.name : null);
      description = description || clean(typeof node.description === "string" ? node.description : null);
      imageUrl = imageUrl || absolute(firstString(node.image), pageUrl);
      const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
      if (offer && typeof offer === "object") {
        const record = offer as Record<string, unknown>;
        priceCents = priceCents ?? parsePriceToCents(typeof record.price === "string" || typeof record.price === "number" ? String(record.price) : null);
        currency = currency || normalizeCurrency(typeof record.priceCurrency === "string" ? record.priceCurrency : null);
      }
    }
  });

  return { url: pageUrl, title, description, imageUrl, priceCents, currency: priceCents === null ? null : currency };
}

export type ProductCopy = {
  title?: string;
  description?: string | null;
  category?: string | null;
  priority?: "low" | "medium" | "high";
};

export function mergeProductCopy(page: PageFacts, model: ProductCopy | null) {
  const title = model?.title?.trim() || page.title || "Untitled product";
  return {
    title,
    description: model?.description?.trim() || page.description,
    imageUrl: page.imageUrl,
    priceCents: page.priceCents,
    currency: page.priceCents === null ? null : page.currency,
    url: page.url,
    category: model?.category ?? null,
    priority: model?.priority ?? "medium",
    aiUsed: Boolean(model),
    priceFoundOnPage: page.priceCents !== null,
    imageFoundOnPage: Boolean(page.imageUrl),
  };
}

function jsonLdNodes(raw: string): Array<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.flatMap((node) => {
      if (!node || typeof node !== "object") return [];
      const record = node as Record<string, unknown>;
      const graph = record["@graph"];
      if (Array.isArray(graph)) {
        return graph.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");
      }
      return [record];
    });
  } catch {
    return [];
  }
}

function clean(value: string | null | undefined): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 2000) : null;
}

function absolute(value: string | null, pageUrl: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, pageUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function firstString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstString(value[0]);
  if (value && typeof value === "object" && "url" in value && typeof value.url === "string") return value.url;
  return null;
}

function normalizeCurrency(value: string | null): string | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  return currencies.has(upper) ? upper : null;
}
