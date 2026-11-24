import { resolveTheme } from "@gatherly/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { DemoStudioView } from "@/components/studio/studio-views";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { demoTemplates, isDemoTemplate } from "@/lib/template-media";

export function generateStaticParams() {
  return locales.flatMap((locale) => demoTemplates.map((template) => ({ locale, template })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale);
  return { title: `${t.pages.demo.adminView} · ${t.nav.demo}`, robots: { index: false } };
}

export default async function DemoAdminPage({ params }: { params: Promise<{ locale: string; template: string }> }) {
  const { locale, template } = await params;
  if (!isLocale(locale) || !isDemoTemplate(template)) notFound();
  const t = getDictionary(locale);
  const experiences = demoTemplates.map((id) => ({
    id,
    title: t.templates[id],
    href: `/${locale}/demo/${id}/admin`,
    color: resolveTheme(id).primary,
  }));
  return (
    <AppShell locale={locale} t={t} mode="demo" experiences={experiences} user={null}>
      <DemoStudioView locale={locale} t={t} template={template} />
    </AppShell>
  );
}
