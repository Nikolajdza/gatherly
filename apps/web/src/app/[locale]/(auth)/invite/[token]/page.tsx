import { notFound } from "next/navigation";
import { AcceptInvite } from "@/components/accept-invite";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { serverUser } from "@/lib/supabase/server";

export default async function InvitePage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const user = await serverUser();
  return <AcceptInvite locale={locale} token={token} dictionary={getDictionary(locale)} signedIn={Boolean(user)} />;
}
