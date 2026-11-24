import { notFound } from "next/navigation";
import {
  AdminSection,
  AiSection,
  CtaBand,
  Faq,
  FeatureGrid,
  Hero,
  HowSteps,
  Pillars,
  SantaSection,
  Showcase,
  Strip,
} from "@/components/marketing/sections";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <>
      <Hero locale={locale} t={t} />
      <Strip t={t} />
      <Pillars locale={locale} t={t} />
      <Showcase locale={locale} t={t} />
      <HowSteps t={t} />
      <AiSection t={t} />
      <SantaSection locale={locale} t={t} />
      <AdminSection locale={locale} t={t} />
      <FeatureGrid t={t} />
      <Faq t={t} />
      <CtaBand locale={locale} t={t} />
    </>
  );
}
