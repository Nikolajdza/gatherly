import { templates } from "@gatherly/shared";
import { ArrowRight, CalendarDays, FilePen, Plug, Sparkles, Users, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceGrid } from "@/components/app/experience-grid";
import { formatDate, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadWorkspace } from "@/lib/server-api";
import { templateImages } from "@/lib/template-media";

const quickStart = ["baby-shower", "wedding", "birthday", "secret-santa", "shared-todo", "christmas"] as const;

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const d = t.dash;
  const workspace = await loadWorkspace();

  if (workspace.state !== "ready") {
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

  const { experiences, profile } = workspace;
  const active = experiences.filter((experience) => experience.status === "active");
  const drafts = experiences.filter((experience) => experience.status === "draft");
  const shared = experiences.filter((experience) => experience.role && experience.role !== "owner");
  const today = new Date().toISOString().slice(0, 10);
  const next = experiences
    .filter((experience) => experience.eventDate && experience.eventDate >= today && experience.status !== "archived")
    .sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""))[0];

  return (
    <div className="stack-lg">
      <div className="page-title">
        <div>
          <p className="eyebrow">{d.overview}</p>
          <h1 className="serif">{d.greeting}{profile?.displayName ? `, ${profile.displayName.split(" ")[0]}` : ""}</h1>
          <p>{d.greetingLede}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat"><div className="stat-top">{d.statsActive}<span className="icon-chip sage" style={{ width: 34, height: 34 }}><Zap size={16} /></span></div><div className="stat-value">{active.length}</div></div>
        <div className="card stat"><div className="stat-top">{d.statsDrafts}<span className="icon-chip gold" style={{ width: 34, height: 34 }}><FilePen size={16} /></span></div><div className="stat-value">{drafts.length}</div></div>
        <div className="card stat"><div className="stat-top">{d.statsShared}<span className="icon-chip" style={{ width: 34, height: 34 }}><Users size={16} /></span></div><div className="stat-value">{shared.length}</div></div>
        <div className="card stat">
          <div className="stat-top">{d.statsNext}<span className="icon-chip ink" style={{ width: 34, height: 34 }}><CalendarDays size={16} /></span></div>
          <div className="stat-value" style={{ fontSize: next ? 30 : undefined }}>{next ? next.title : "—"}</div>
          {next ? <div className="stat-sub">{formatDate(locale, next.eventDate)}</div> : null}
        </div>
      </div>

      {experiences.length === 0 ? (
        <div className="card empty">
          <span className="icon-chip"><Sparkles size={26} /></span>
          <h3 className="serif">{d.empty}</h3>
          <p>{d.emptyText}</p>
          <Link className="btn btn-primary" href={`/${locale}/dashboard/experiences/new`}>{d.create} <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <section className="stack">
          <h2 className="serif h3" style={{ margin: 0 }}>{d.experiences}</h2>
          <ExperienceGrid locale={locale} t={t} experiences={experiences} />
        </section>
      )}

      <section className="stack">
        <h2 className="serif h3" style={{ margin: 0 }}>{d.quickStart}</h2>
        <div className="template-pick">
          {quickStart.map((id) => {
            const template = templates.find((entry) => entry.id === id);
            return (
              <Link className="pick" key={id} href={`/${locale}/dashboard/experiences/new?template=${id}`}>
                <div className="photo"><Image src={templateImages[id] ?? "/images/hero.jpg"} alt="" fill sizes="220px" /></div>
                <div className="pick-body"><strong>{t.templates[id]}</strong><small>{template ? t.kinds[template.type] : ""}</small></div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
