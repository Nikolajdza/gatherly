import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cleanCategory, currencyFromText, dueDateFrom, priceFromText } from "./guards";
import { assertSafeUrl, isBlockedIp, UnsafeUrlError } from "./url-safety";
import { mergeProductCopy, parseProductHtml } from "./product-page";

describe("url safety", () => {
  it("blocks private, loopback and metadata addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.1.9", "172.16.4.4", "169.254.169.254", "::1", "::ffff:127.0.0.1"]) {
      assert.equal(isBlockedIp(ip), true, ip);
    }
    assert.equal(isBlockedIp("93.184.216.34"), false);
  });

  it("rejects localhost even before DNS", async () => {
    await assert.rejects(() => assertSafeUrl("http://localhost/admin", async () => ["93.184.216.34"]), UnsafeUrlError);
    await assert.rejects(() => assertSafeUrl("file:///etc/passwd", async () => []), UnsafeUrlError);
    await assert.rejects(
      () => assertSafeUrl("https://shop.example/item", async () => ["10.0.0.8"]),
      UnsafeUrlError,
    );
  });

  it("accepts a hostname that resolves to a public address", async () => {
    const url = await assertSafeUrl("https://shop.example/item", async () => ["93.184.216.34"]);
    assert.equal(url.hostname, "shop.example");
  });
});

describe("product extraction", () => {
  it("reads price and image from the page and ignores invented model prices", () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Baby stroller" />
        <meta property="og:description" content="A black stroller" />
        <meta property="og:image" content="https://cdn.example/stroller.jpg" />
        <meta property="product:price:amount" content="450.00" />
        <meta property="product:price:currency" content="EUR" />
      </head></html>`;
    const page = parseProductHtml(html, "https://shop.example/stroller");
    const preview = mergeProductCopy(page, { title: "Baby stroller", description: "Cleaned description" });
    assert.equal(preview.priceCents, 45000);
    assert.equal(preview.currency, "EUR");
    assert.equal(preview.imageUrl, "https://cdn.example/stroller.jpg");
    assert.equal(preview.url, "https://shop.example/stroller");
  });

  it("leaves the price empty when the page has none", () => {
    const page = parseProductHtml("<html><head><title>Blanket</title></head></html>", "https://shop.example/blanket");
    const preview = mergeProductCopy(page, { title: "Blanket", description: null });
    assert.equal(preview.priceCents, null);
    assert.equal(preview.currency, null);
    assert.equal(preview.imageUrl, null);
  });
});

describe("pasted text import", () => {
  const text = "Home > Baby > Strollers  Urban stroller, sand  Price: 1.249,90 € incl. VAT  Free delivery over 50 €";

  it("accepts a price only when the same figure is in the text", () => {
    assert.equal(priceFromText(text, "1.249,90 €"), 124990);
    assert.equal(priceFromText(text, "1249.90"), 124990);
    assert.equal(priceFromText(text, "899"), null);
    assert.equal(priceFromText("No price on this page at all", "45"), null);
    assert.equal(priceFromText(text, null), null);
  });

  it("accepts a currency only when the text shows it", () => {
    assert.equal(currencyFromText(text, "EUR"), "EUR");
    assert.equal(currencyFromText(text, "USD"), null);
    assert.equal(currencyFromText("Cena 4.990 din", "RSD"), "RSD");
    assert.equal(currencyFromText(text, "JPY"), null);
  });
});

describe("ai output cleanup", () => {
  it("reuses an existing category regardless of case", () => {
    assert.equal(cleanCategory("nursery", ["Nursery", "Play"]), "Nursery");
    assert.equal(cleanCategory("  Bath   time ", []), "Bath time");
    assert.equal(cleanCategory("", ["Play"]), null);
  });

  it("turns relative days into dates and never past the event", () => {
    const today = new Date("2026-11-23T10:00:00Z");
    assert.equal(dueDateFrom(7, today, null), "2026-11-30");
    assert.equal(dueDateFrom(60, today, new Date("2026-12-10T00:00:00Z")), "2026-12-10");
    assert.equal(dueDateFrom(-3, today, null), null);
    assert.equal(dueDateFrom(null, today, null), null);
  });
});
