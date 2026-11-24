import { resolveTheme } from "@gatherly/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadWorkspace } from "@/lib/server-api";
import { serverUser } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).nav.dashboard, robots: { index: false } };
}

export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [workspace, user] = await Promise.all([loadWorkspace(), serverUser()]);
  const experiences =
    workspace.state === "ready"
      ? workspace.experiences
          .filter((experience) => experience.status !== "archived")
          .map((experience) => ({
            id: experience.id,
            title: experience.title,
            href: `/${locale}/dashboard/experiences/${experience.id}`,
            color: resolveTheme(experience.template).primary,
          }))
      : [];
  const profile = workspace.state === "ready" ? workspace.profile : null;
  return (
    <AppShell
      locale={locale}
      t={t}
      mode="live"
      experiences={experiences}
      user={user ? { name: profile?.displayName ?? "", email: profile?.email ?? user.email } : null}
    >
      {children}
    </AppShell>
  );
}
