import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/account-panels";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadWorkspace } from "@/lib/server-api";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const workspace = await loadWorkspace();
  return <SettingsForm locale={locale} dictionary={getDictionary(locale)} profile={workspace.state === "ready" ? workspace.profile : null} />;
}
