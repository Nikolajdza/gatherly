import { notFound } from "next/navigation";
import { LiveStudioView } from "@/components/studio/studio-views";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function ExperienceAdminPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  return <LiveStudioView locale={locale} t={getDictionary(locale)} id={id} />;
}
