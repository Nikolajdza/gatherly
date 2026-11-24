"use client";

import { experienceTypes, type ExperienceSummary, type ExperienceType } from "@gatherly/shared";
import { CalendarDays, ExternalLink, Plus, Search, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDate, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { coverFor } from "@/lib/template-media";

export function ExperienceGrid({ locale, t, experiences }: { locale: Locale; t: Dictionary; experiences: ExperienceSummary[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ExperienceType | "all">("all");
  const d = t.dash;
  const shown = experiences.filter(
    (experience) =>
      (kind === "all" || experience.type === kind) &&
      experience.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="stack">
      <div className="row" style={{ flexWrap: "wrap" }}>
        <div className="segmented" role="group">
          <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")}>{d.filterAll}</button>
          {experienceTypes.map((type) => (
            <button key={type} type="button" aria-pressed={kind === type} onClick={() => setKind(type)}>{t.kinds[type]}</button>
          ))}
        </div>
        <label className="input-group" style={{ position: "relative", minWidth: 240 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }} />
          <input className="input" style={{ paddingLeft: 40 }} placeholder={d.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      <div className="xp-grid">
        {shown.map((experience) => (
          <article className="card xp-card card-hover" key={experience.id}>
            <Link href={`/${locale}/dashboard/experiences/${experience.id}`} className="xp-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverFor(experience.template, experience.coverImageUrl)} alt="" />
              <span className="badge">{t.templates[experience.template as keyof Dictionary["templates"]] ?? experience.template}</span>
              <span className={`badge badge-dot status ${experience.status === "active" ? "badge-sage" : experience.status === "draft" ? "badge-gold" : ""}`}>{t.status[experience.status]}</span>
            </Link>
            <div className="xp-body">
              <h3 className="serif">{experience.title}</h3>
              <div className="xp-meta">
                {experience.eventDate ? <span><CalendarDays size={14} /> {formatDate(locale, experience.eventDate, "short")}</span> : null}
                <span><Users size={14} /> {experience.role ? t.roles[experience.role] : ""}</span>
                <span>{t.visibility[experience.visibility]}</span>
              </div>
            </div>
            <div className="xp-actions">
              <Link className="btn btn-primary btn-sm" href={`/${locale}/dashboard/experiences/${experience.id}`}><Settings2 size={15} /> {d.open}</Link>
              <Link className="btn btn-secondary btn-sm" href={`/${locale}/e/${experience.slug}`} target="_blank"><ExternalLink size={15} /> {d.viewPublic}</Link>
            </div>
          </article>
        ))}
        <Link className="xp-new" href={`/${locale}/dashboard/experiences/new`}>
          <div className="stack-sm" style={{ justifyItems: "center" }}>
            <span className="icon-chip"><Plus size={22} /></span>
            <strong>{d.create}</strong>
            <span className="small">{d.emptyText}</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
