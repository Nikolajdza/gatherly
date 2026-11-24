"use client";

import { useMemo } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { demoBackend } from "@/lib/studio/demo";
import { liveBackend } from "@/lib/studio/live";
import type { DemoTemplate } from "@/lib/template-media";
import { Studio } from "./studio";

export function DemoStudioView({ locale, t, template }: { locale: Locale; t: Dictionary; template: DemoTemplate }) {
  const backend = useMemo(() => demoBackend(template), [template]);
  return <Studio locale={locale} t={t} backend={backend} afterDelete={`/${locale}/demo`} />;
}

export function LiveStudioView({ locale, t, id }: { locale: Locale; t: Dictionary; id: string }) {
  const backend = useMemo(() => liveBackend(id), [id]);
  return <Studio locale={locale} t={t} backend={backend} afterDelete={`/${locale}/dashboard`} />;
}
