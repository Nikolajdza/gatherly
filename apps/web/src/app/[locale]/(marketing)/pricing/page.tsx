import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq, PageHero } from "@/components/marketing/sections";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).nav.pricing };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const p = t.pages.pricing;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} lede={p.lede} />
      <section className="container">
        <div className="price-grid">
          <article className="card price-card featured">
            <div className="row"><strong>{p.free.name}</strong><span className="badge" style={{ background: "rgba(255,255,255,.12)", color: "#f0c9bf" }}>{p.free.period}</span></div>
            <span className="price">{p.free.price}</span>
            <ul className="checklist" style={{ marginTop: 0 }}>
              {p.free.items.map((item) => <li key={item}><Check size={18} /> {item}</li>)}
            </ul>
            <Link className="btn btn-light btn-lg" href={`/${locale}/register`}>{p.free.cta}</Link>
          </article>
          <article className="card price-card">
            <strong>{p.later.name}</strong>
            <span className="price faint">{p.later.price}</span>
            <ul className="checklist" style={{ marginTop: 0 }}>
              {p.later.items.map((item) => <li key={item} className="muted"><Check size={18} /> {item}</li>)}
            </ul>
            <button className="btn btn-secondary btn-lg" type="button" disabled>{p.later.cta}</button>
          </article>
        </div>
        <p className="notice" style={{ marginTop: 20 }}>{p.note}</p>
      </section>
      <Faq t={t} />
    </>
  );
}
