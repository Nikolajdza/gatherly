import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ExperienceWizard } from "@/components/experience-wizard";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function NewExperiencePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <Suspense>
      <ExperienceWizard locale={locale} dictionary={getDictionary(locale)} />
    </Suspense>
  );
}
