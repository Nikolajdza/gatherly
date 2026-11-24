"use client";

import type { ExperienceDetail } from "@gatherly/shared";
import {
  CalendarCheck,
  ExternalLink,
  Gift,
  LayoutDashboard,
  ListChecks,
  Lock,
  Palette,
  Settings,
  Share2,
  Snowflake,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BackendError, canManage, type StudioBackend } from "@/lib/studio/backend";
import { coverFor } from "@/lib/template-media";
import { DesignTab } from "./tab-design";
import { GiftsTab } from "./tab-gifts";
import { OverviewTab } from "./tab-overview";
import { PeopleTab } from "./tab-people";
import { ReservationsTab } from "./tab-reservations";
import { SantaTab } from "./tab-santa";
import { SettingsTab } from "./tab-settings";
import { ShareTab } from "./tab-share";
import { TasksTab } from "./tab-tasks";

export type TabId = "overview" | "gifts" | "reservations" | "santa" | "tasks" | "people" | "design" | "share" | "settings";

export type StudioContext = {
  locale: Locale;
  t: Dictionary;
  backend: StudioBackend;
  experience: ExperienceDetail;
  setExperience: (value: ExperienceDetail) => void;
  refresh: () => Promise<void>;
  notify: (text: string, tone?: "ok" | "error") => void;
  fail: (error: unknown) => void;
  canManage: boolean;
  isOwner: boolean;
  goTo: (tab: TabId) => void;
  publicHref: string;
  afterDelete: string;
};

const icons: Record<TabId, React.ReactNode> = {
  overview: <LayoutDashboard size={16} />,
  gifts: <Gift size={16} />,
  reservations: <CalendarCheck size={16} />,
  santa: <Snowflake size={16} />,
  tasks: <ListChecks size={16} />,
  people: <Users size={16} />,
  design: <Palette size={16} />,
  share: <Share2 size={16} />,
  settings: <Settings size={16} />,
};

function tabsFor(experience: ExperienceDetail, manage: boolean): TabId[] {
  const middle: TabId[] =
    experience.type === "gift_registry" ? ["gifts", "reservations"] : experience.type === "secret_santa" ? ["santa"] : ["tasks"];
  if (!manage) return ["overview", ...middle, "share"];
  return ["overview", ...middle, "people", "design", "share", "settings"];
}

export function Studio({
  locale,
  t,
  backend,
  afterDelete,
}: {
  locale: Locale;
  t: Dictionary;
  backend: StudioBackend;
  afterDelete: string;
}) {
  const toast = useToast();
  const [experience, setExperience] = useState<ExperienceDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("overview");

  const refresh = useCallback(async () => {
    setExperience(await backend.getExperience());
  }, [backend]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function load() {
      attempts += 1;
      try {
        const data = await backend.getExperience();
        if (!cancelled) {
          setExperience(data);
          setLoadError(null);
        }
      } catch (error: unknown) {
        if (cancelled) return;
        // Free-tier APIs often need a cold-start retry before the first success.
        if (attempts < 4) {
          await new Promise((resolve) => setTimeout(resolve, 1200 * attempts));
          if (!cancelled) await load();
          return;
        }
        setLoadError(error instanceof BackendError && error.code === "NOT_CONFIGURED" ? t.common.configured : t.common.error);
      }
    }

    load();
    const hash = window.location.hash.replace("#", "") as TabId;
    if (hash) setTab(hash);
    return () => {
      cancelled = true;
    };
  }, [backend, t.common.configured, t.common.error]);

  const goTo = useCallback((next: TabId) => {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const context = useMemo<StudioContext | null>(() => {
    if (!experience) return null;
    return {
      locale,
      t,
      backend,
      experience,
      setExperience,
      refresh,
      notify: toast,
      fail: (error) => toast(error instanceof BackendError && error.code === "CONFLICT" ? t.publicPage.errorReserve : t.common.error, "error"),
      canManage: canManage(experience),
      isOwner: experience.role === "owner",
      goTo,
      publicHref: `/${locale}${backend.publicPath(experience.slug)}`,
      afterDelete,
    };
  }, [afterDelete, backend, experience, goTo, locale, refresh, t, toast]);

  if (loadError) {
    return (
      <div className="card empty">
        <span className="icon-chip"><Lock size={24} /></span>
        <h3 className="serif">{t.dash.apiDownTitle}</h3>
        <p>{loadError}</p>
        <p className="muted small" style={{ margin: 0 }}>{t.dash.apiDownHint}</p>
        <div className="row-start">
          <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>{t.dash.retry}</button>
          <Link className="btn btn-secondary" href={`/${locale}/dashboard`}>{t.dash.backToDashboard}</Link>
        </div>
      </div>
    );
  }

  if (!context || !experience) {
    return (
      <div className="stack">
        <div className="notice sage" style={{ marginBottom: 8 }}>{t.dash.apiDownText}</div>
        <div className="skeleton" style={{ height: 80 }} />
        <div className="skeleton" style={{ height: 48 }} />
        <div className="stat-grid">{[0, 1, 2, 3].map((key) => <div className="skeleton" key={key} style={{ height: 120 }} />)}</div>
      </div>
    );
  }

  const tabs = tabsFor(experience, context.canManage);
  const active = tabs.includes(tab) ? tab : "overview";
  const templateName = t.templates[experience.template as keyof Dictionary["templates"]] ?? experience.template;

  return (
    <>
      <div className="studio-head">
        <div className="studio-id">
          <div className="studio-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverFor(experience.template, experience.coverImageUrl)} alt="" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="row-start" style={{ gap: 8 }}>
              <span className="eyebrow plain" style={{ margin: 0 }}>{templateName}</span>
              <span className={`badge badge-dot ${experience.status === "active" ? "badge-sage" : experience.status === "draft" ? "badge-gold" : ""}`}>{t.status[experience.status]}</span>
              <span className="badge badge-outline">{t.visibility[experience.visibility]}</span>
            </div>
            <h1 className="serif">{experience.title}</h1>
          </div>
        </div>
        <div className="row-start">
          <button className="btn btn-secondary" type="button" onClick={() => goTo("share")}><Share2 size={16} /> {t.studio.tabs.share}</button>
          <Link className="btn btn-primary" href={context.publicHref} target="_blank"><ExternalLink size={16} /> {t.dash.viewPublic}</Link>
        </div>
      </div>

      <div className="tabbar" role="tablist">
        {tabs.map((id) => (
          <button key={id} className="tab" role="tab" type="button" aria-selected={active === id} onClick={() => goTo(id)}>
            {icons[id]} {t.studio.tabs[id]}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {active === "overview" ? <OverviewTab ctx={context} /> : null}
        {active === "gifts" ? <GiftsTab ctx={context} /> : null}
        {active === "reservations" ? <ReservationsTab ctx={context} /> : null}
        {active === "santa" ? <SantaTab ctx={context} /> : null}
        {active === "tasks" ? <TasksTab ctx={context} /> : null}
        {active === "people" ? <PeopleTab ctx={context} /> : null}
        {active === "design" ? <DesignTab ctx={context} /> : null}
        {active === "share" ? <ShareTab ctx={context} /> : null}
        {active === "settings" ? <SettingsTab ctx={context} /> : null}
      </div>
    </>
  );
}
