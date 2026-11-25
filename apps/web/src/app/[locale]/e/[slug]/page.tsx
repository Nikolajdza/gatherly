import { ApiError, GatherlyClient } from "@gatherly/api-client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LiveExperienceView } from "@/components/experience/experience-views";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { apiBaseUrl } from "@/lib/env";
import { serverAccessToken, serverUser } from "@/lib/supabase/server";
import { coverFor } from "@/lib/template-media";

const load = cache(async (slug: string) => {
  const client = new GatherlyClient({ baseUrl: apiBaseUrl(), getToken: serverAccessToken });
  try {
    return { experience: await client.experiences.bySlug(slug), error: null };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      return { experience: null, error: "missing" as const };
    }
    // Cold-start: one more explicit pause then retry (client already retries 502/503).
    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      return { experience: await client.experiences.bySlug(slug), error: null };
    } catch (retryError) {
      if (retryError instanceof ApiError && (retryError.status === 404 || retryError.status === 403)) {
        return { experience: null, error: "missing" as const };
      }
      return { experience: null, error: "unavailable" as const };
    }
  }
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { experience } = await load(slug);
  if (!experience) return {};
  const cover = coverFor(experience.template, experience.coverImageUrl);
  return {
    title: experience.title,
    description: experience.description.slice(0, 160) || undefined,
    openGraph: { title: experience.title, images: cover.startsWith("data:") ? undefined : [cover] },
    robots: experience.visibility === "public" ? undefined : { index: false, follow: false },
  };
}

export default async function PublicExperiencePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [{ experience, error }, user] = await Promise.all([load(slug), serverUser()]);
  if (error === "missing") notFound();
  if (!experience) {
    return (
      <main className="container-narrow" style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
        <div className="stack">
          <h1 className="serif h2">{t.common.error}</h1>
          <p className="muted">{t.common.configured}</p>
          <div><Link className="btn btn-primary" href={`/${locale}/demo`}>{t.nav.demo}</Link></div>
        </div>
      </main>
    );
  }
  return <LiveExperienceView locale={locale} t={t} experience={experience} currentUserId={user?.id ?? null} />;
}
