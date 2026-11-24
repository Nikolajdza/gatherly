import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoExperienceView } from "@/components/experience/experience-views";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { demoTemplates, isDemoTemplate } from "@/lib/template-media";

export function generateStaticParams() {
  return locales.flatMap((locale) => demoTemplates.map((template) => ({ locale, template })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; template: string }> }): Promise<Metadata> {
  const { locale, template } = await params;
  const t = getDictionary(locale);
  return { title: `${t.templates[template as keyof typeof t.templates] ?? template} · ${t.nav.demo}`, robots: { index: false } };
}

export default async function DemoGuestPage({ params }: { params: Promise<{ locale: string; template: string }> }) {
  const { locale, template } = await params;
  if (!isLocale(locale) || !isDemoTemplate(template)) notFound();
  return <DemoExperienceView locale={locale} t={getDictionary(locale)} template={template} />;
}
