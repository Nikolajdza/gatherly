"use client";

import type { ExperienceDetail } from "@gatherly/shared";
import { useEffect, useMemo, useState } from "react";
import { PublicExperience } from "@/components/experience/public-experience";
import { ToastProvider } from "@/components/ui/toast";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { demoBackend, loadDemo } from "@/lib/studio/demo";
import { DEMO_USER_ID } from "@/lib/studio/demo-data";
import { liveBackend } from "@/lib/studio/live";
import type { DemoTemplate } from "@/lib/template-media";

export function LiveExperienceView({
  locale,
  t,
  experience,
  currentUserId,
}: {
  locale: Locale;
  t: Dictionary;
  experience: ExperienceDetail;
  currentUserId: string | null;
}) {
  const backend = useMemo(() => liveBackend(experience.id), [experience.id]);
  const canManage = experience.role === "owner" || experience.role === "editor";
  return (
    <ToastProvider>
      <PublicExperience
        locale={locale}
        t={t}
        experience={experience}
        backend={backend}
        signedIn={Boolean(currentUserId)}
        currentUserId={currentUserId}
        adminHref={canManage ? `/${locale}/dashboard/experiences/${experience.id}` : null}
      />
    </ToastProvider>
  );
}

export function DemoExperienceView({ locale, t, template }: { locale: Locale; t: Dictionary; template: DemoTemplate }) {
  const backend = useMemo(() => demoBackend(template), [template]);
  const [experience, setExperience] = useState<ExperienceDetail | null>(null);

  useEffect(() => {
    setExperience(loadDemo(template).experience);
  }, [template]);

  if (!experience) return <div className="xp" style={{ minHeight: "100vh" }}><div className="skeleton" style={{ height: "80vh", borderRadius: 0 }} /></div>;
  return (
    <ToastProvider>
      <PublicExperience
        locale={locale}
        t={t}
        experience={experience}
        backend={backend}
        signedIn
        currentUserId={DEMO_USER_ID}
        adminHref={`/${locale}/demo/${template}/admin`}
      />
    </ToastProvider>
  );
}
