import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminSection, AiSection, CtaBand, FeatureGrid, PageHero, SantaSection } from "@/components/marketing/sections";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).nav.features };
}

export default async function FeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const p = t.pages.features;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} lede={p.lede} image="/images/together.jpg" />
      <FeatureGrid t={t} withHead={false} />
      <AiSection t={t} />
      <SantaSection locale={locale} t={t} />
      <AdminSection locale={locale} t={t} />
      <CtaBand locale={locale} t={t} />
    </>
  );
}
