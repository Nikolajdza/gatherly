import { Check } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AiSection, CtaBand, Faq, HowSteps, PageHero, SectionHead } from "@/components/marketing/sections";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).nav.how };
}

export default async function HowPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const p = t.pages.how;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} lede={p.lede} image="/images/baby-shower.jpg" />
      <section className="container"><p className="eyebrow plain">{p.hostTitle}</p></section>
      <HowSteps t={t} compact />
      <section className="section">
        <div className="container split reverse">
          <div>
            <SectionHead eyebrow={p.guestTitle} title={t.publicPage.giftsLede} />
            <ul className="checklist">
              {p.guestSteps.map((step) => <li key={step}><Check size={18} /> {step}</li>)}
            </ul>
          </div>
          <div className="split-visual">
            <div className="photo"><Image src="/images/wedding.jpg" alt="" fill sizes="(min-width: 920px) 50vw, 100vw" /></div>
          </div>
        </div>
      </section>
      <AiSection t={t} />
      <Faq t={t} />
      <CtaBand locale={locale} t={t} />
    </>
  );
}
