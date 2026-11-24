import { notFound } from "next/navigation";
import { InvitationDesk } from "@/components/account-panels";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function InvitationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <InvitationDesk locale={locale} dictionary={getDictionary(locale)} />;
}
