import { templates } from "@gatherly/shared";
import { ArrowRight, CalendarDays, FilePen, Plug, Plus, Sparkles, Users, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceGrid } from "@/components/app/experience-grid";
import { Aurora, NumberTicker, Reveal, Stagger, StaggerItem } from "@/components/ui/fx";
import { TemplateCard } from "@/components/ui/template-card";
import { formatDate, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadWorkspace } from "@/lib/server-api";

const quickStart = ["baby-shower", "wedding", "birthday", "secret-santa", "shared-todo", "christmas"] as const;

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const d = t.dash;
  const workspace = await loadWorkspace();

  if (workspace.state === "not-configured") {
    return (
      <div className="stack-lg">
        <div className="page-title"><div><p className="eyebrow">{d.workspace}</p><h1 className="serif">{d.notConfiguredTitle}</h1><p>{d.notConfiguredText}</p></div></div>
        <div className="card" style={{ overflow: "hidden", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
          <div className="card-pad-lg stack">
            <span className="icon-chip"><Plug size={22} /></span>
            <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>{t.auth.missingSupabase}</p>
            <div className="row-start" style={{ flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href={`/${locale}/demo/baby-shower/admin`}><Sparkles size={16} /> {d.openDemo}</Link>
              <Link className="btn btn-secondary" href={`/${locale}/demo`}>{t.nav.demo}</Link>
            </div>
          </div>
          <div className="photo hide-sm" style={{ borderRadius: 0, minHeight: 260 }}>
            <Image src="/images/together.jpg" alt="" fill sizes="40vw" />
          </div>
        </div>
      </div>
    );
  }

  if (workspace.state === "unavailable") {
    return (
      <div className="stack-lg">
        <div className="page-title">
          <div>
            <p className="eyebrow">{d.workspace}</p>
            <h1 className="serif">{d.apiDownTitle}</h1>
            <p>{d.apiDownText}</p>
          </div>
        </div>
        <div className="card card-pad stack" style={{ maxWidth: 560 }}>
          <p className="muted" style={{ margin: 0, lineHeight: 1.65 }}>{d.apiDownHint}</p>
          <div className="row-start" style={{ flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href={`/${locale}/dashboard`}>{d.retry}</Link>
            <Link className="btn btn-secondary" href={`/${locale}/demo`}>{t.nav.demo}</Link>
          </div>
        </div>
      </div>
    );
  }

  const { experiences, profile } = workspace;
  const active = experiences.filter((experience) => experience.status === "active");
  const drafts = experiences.filter((experience) => experience.status === "draft");
  const shared = experiences.filter((experience) => experience.role && experience.role !== "owner");
  const today = new Date().toISOString().slice(0, 10);
  const next = experiences
    .filter((experience) => experience.eventDate && experience.eventDate >= today && experience.status !== "archived")
    .sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""))[0];

  const firstName = profile?.displayName ? profile.displayName.split(" ")[0] : "";
  const isHost = experiences.some((experience) => experience.role === "owner");

  return (
    <div className="stack-lg">
      <Reveal className="welcome" immediate>
        <Aurora />
        <div>
          <span className="pill-badge"><Sparkles size={14} /> {d.overview}</span>
          <h1 className="serif">{d.greeting}{firstName ? <>, <span className="text-gradient">{firstName}</span></> : ""}</h1>
          <p>{experiences.length === 0 ? d.emptyText : d.greetingLede}</p>
        </div>
        <div className="row-start">
          <Link className="btn btn-glass" href={`/${locale}/demo/baby-shower/admin`}>{d.help}</Link>
          {isHost ? (
            <Link className="btn btn-primary btn-glow" href={`/${locale}/dashboard/experiences/new`}><Plus size={16} /> {d.create}</Link>
          ) : null}
        </div>
      </Reveal>

      <Stagger className="stat-grid" immediate>
        <StaggerItem className="card stat" style={{ ["--stat-glow" as string]: "rgba(47,138,104,.22)" }}><div className="stat-top">{d.statsActive}<span className="icon-chip sage" style={{ width: 34, height: 34 }}><Zap size={16} /></span></div><NumberTicker className="stat-value" value={active.length} immediate /></StaggerItem>
        <StaggerItem className="card stat" style={{ ["--stat-glow" as string]: "rgba(232,160,90,.22)" }}><div className="stat-top">{d.statsDrafts}<span className="icon-chip gold" style={{ width: 34, height: 34 }}><FilePen size={16} /></span></div><NumberTicker className="stat-value" value={drafts.length} immediate /></StaggerItem>
        <StaggerItem className="card stat"><div className="stat-top">{d.statsShared}<span className="icon-chip" style={{ width: 34, height: 34 }}><Users size={16} /></span></div><NumberTicker className="stat-value" value={shared.length} immediate /></StaggerItem>
        <StaggerItem className="card stat" style={{ ["--stat-glow" as string]: "rgba(15,61,48,.18)" }}>
          <div className="stat-top">{d.statsNext}<span className="icon-chip ink" style={{ width: 34, height: 34 }}><CalendarDays size={16} /></span></div>
          <div className="stat-value" style={{ fontSize: next ? 28 : undefined }}>{next ? next.title : "—"}</div>
          {next ? <div className="stat-sub">{formatDate(locale, next.eventDate)}</div> : null}
        </StaggerItem>
      </Stagger>

      {experiences.length === 0 ? null : (
        <section className="stack">
          <h2 className="serif h3" style={{ margin: 0 }}>{d.experiences}</h2>
          <ExperienceGrid locale={locale} t={t} experiences={experiences} />
        </section>
      )}

      {isHost || experiences.length === 0 ? (
        <section className="stack">
          <div className="row">
            <h2 className="serif h3" style={{ margin: 0 }}>{d.quickStart}</h2>
            <Link className="link small" href={`/${locale}/dashboard/experiences/new`}>{t.nav.templates} <ArrowRight size={14} /></Link>
          </div>
          <div className="tcard-grid compact">
            {quickStart.map((id) => {
              const template = templates.find((entry) => entry.id === id);
              return (
                <TemplateCard
                  key={id}
                  id={id}
                  compact
                  title={t.templates[id]}
                  kind={template ? t.kinds[template.type] : undefined}
                  href={`/${locale}/dashboard/experiences/new?template=${id}`}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
