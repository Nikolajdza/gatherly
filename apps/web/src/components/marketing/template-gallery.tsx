"use client";

import { experienceTypes, templates, themePresets, type ExperienceType } from "@gatherly/shared";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { isDemoTemplate, templateImages } from "@/lib/template-media";

export function TemplateGallery({ locale, dictionary: t }: { locale: Locale; dictionary: Dictionary }) {
  const [kind, setKind] = useState<ExperienceType | "all">("all");
  const shown = templates.filter((template) => kind === "all" || template.type === kind);
  return (
    <>
      <div className="segmented" role="group">
        <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")}>{t.pages.templates.all}</button>
        {experienceTypes.map((type) => (
          <button type="button" key={type} aria-pressed={kind === type} onClick={() => setKind(type)}>{t.kinds[type]}</button>
        ))}
      </div>
      <div className="template-grid">
        {shown.map((template) => {
          const preset = themePresets[template.preset];
          return (
            <article className="card template-card card-hover" key={template.id}>
              <div className="photo photo-zoom">
                <Image src={templateImages[template.id] ?? "/images/hero.jpg"} alt="" fill sizes="(min-width: 920px) 25vw, 50vw" />
              </div>
              <div className="tc-body">
                <div className="row">
                  <span className="badge">{t.kinds[template.type]}</span>
                  <span className="swatch-row" aria-hidden>
                    <i style={{ background: preset.primary }} />
                    <i style={{ background: preset.accent }} />
                    <i style={{ background: preset.background }} />
                  </span>
                </div>
                <h3 className="serif h3">{t.templates[template.id]}</h3>
                <p>{t.templateBlurbs[template.id]}</p>
              </div>
              <div className="tc-actions">
                <Link className="btn btn-primary btn-sm" href={`/${locale}/dashboard/experiences/new?template=${template.id}`}>{t.showcase.use}</Link>
                {isDemoTemplate(template.id) ? (
                  <Link className="btn btn-secondary btn-sm" href={`/${locale}/demo/${template.id}`}>{t.pages.templates.demo}</Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
