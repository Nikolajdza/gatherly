import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default function NotFound() {
  const t = getDictionary(defaultLocale);
  return (
    <main className="container-narrow" style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div className="stack">
        <div style={{ justifySelf: "center" }}><Brand href={`/${defaultLocale}`} /></div>
        <p className="serif" style={{ fontSize: 120, lineHeight: 1, margin: 0, color: "var(--wine)" }}>404</p>
        <p className="lede" style={{ margin: "0 auto" }}>{t.common.notFound}</p>
        <div><Link className="btn btn-primary" href={`/${defaultLocale}`}>{t.common.goHome}</Link></div>
      </div>
    </main>
  );
}
