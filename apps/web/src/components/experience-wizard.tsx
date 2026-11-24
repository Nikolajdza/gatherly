"use client";

import {
  createExperienceSchema,
  experienceTypes,
  getTemplate,
  parseTemplateConfig,
  resolveTheme,
  templates,
  themePresets,
  type ExperienceDetail,
  type TemplateId,
  type ThemeConfig,
  type Visibility,
  visibilities,
} from "@gatherly/shared";
import { ArrowLeft, ArrowRight, Check, Rocket, Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PublicExperience } from "@/components/experience/public-experience";
import { TemplateCard } from "@/components/ui/template-card";
import { configFromValues, eventDateFrom, TemplateFields, valuesFromConfig, type FieldValues } from "@/components/studio/template-fields";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { browserApi } from "@/lib/api";
import { coverLibrary, templateImages } from "@/lib/template-media";

function isTemplateId(value: string | null): value is TemplateId {
  return Boolean(value && getTemplate(value));
}

export function ExperienceWizard({ locale, dictionary: t }: { locale: Locale; dictionary: Dictionary }) {
  const search = useSearchParams();
  const router = useRouter();
  const initial = search.get("template");
  const w = t.wizard;
  const [step, setStep] = useState(isTemplateId(initial) ? 1 : 0);
  const [templateId, setTemplateId] = useState<TemplateId>(isTemplateId(initial) ? initial : "baby-shower");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [values, setValues] = useState<FieldValues>(() => valuesFromConfig(isTemplateId(initial) ? initial : "baby-shower", {}));
  const [theme, setTheme] = useState<ThemeConfig>(() => resolveTheme(isTemplateId(initial) ? initial : "baby-shower"));
  const [cover, setCover] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("unlisted");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const template = getTemplate(templateId)!;

  function chooseTemplate(id: TemplateId) {
    setTemplateId(id);
    setValues(valuesFromConfig(id, {}));
    setTheme(resolveTheme(id));
    setCover(null);
  }

  const config = useMemo(() => configFromValues(templateId, template.type, values), [templateId, template.type, values]);

  const previewExperience = useMemo<ExperienceDetail>(() => ({
    id: "preview",
    ownerId: "preview",
    type: template.type,
    template: templateId,
    templateVersion: 1,
    title: title || t.templates[templateId],
    slug: "preview",
    description,
    status: "draft",
    visibility,
    eventDate: eventDateFrom(values),
    timezone: "Europe/Belgrade",
    coverImageUrl: cover,
    role: "owner",
    createdAt: "",
    updatedAt: "",
    config,
    themeConfig: theme,
    items: [],
    memberCount: 1,
  }), [config, cover, description, t.templates, template.type, templateId, theme, title, values, visibility]);

  function validateDetails() {
    try {
      parseTemplateConfig(templateId, config);
    } catch {
      return false;
    }
    return Boolean(title.trim());
  }

  function next() {
    setError(null);
    if (step === 1 && !validateDetails()) {
      setError(t.common.required);
      return;
    }
    setStep((value) => Math.min(3, value + 1));
  }

  async function submit(status: "active" | "draft") {
    if (!validateDetails()) {
      setStep(1);
      setError(t.common.required);
      return;
    }
    const coverImageUrl = cover ? (cover.startsWith("/") ? `${window.location.origin}${cover}` : cover) : null;
    const parsed = createExperienceSchema.safeParse({
      type: template.type,
      template: templateId,
      title: title.trim(),
      description: description.trim(),
      status,
      visibility,
      eventDate: eventDateFrom(values),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Belgrade",
      coverImageUrl,
      config,
      themeConfig: theme,
    });
    if (!parsed.success) {
      setError(t.common.required);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await browserApi().experiences.create(parsed.data);
      router.push(`/${locale}/dashboard/experiences/${created.id}`);
      router.refresh();
    } catch {
      setError(t.common.configured);
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-title" style={{ marginBottom: 0 }}>
        <div>
          <p className="eyebrow">{w.step} {step + 1} / 4</p>
          <h1 className="serif">{w.title}</h1>
        </div>
      </div>
      <div className="wizard-steps">
        {w.steps.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`wizard-step ${index === step ? "on" : ""} ${index < step ? "done" : ""}`}
            onClick={() => index < step && setStep(index)}
            style={{ cursor: index < step ? "pointer" : "default" }}
          >
            <b>{index < step ? <Check size={13} /> : index + 1}</b> {label}
          </button>
        ))}
      </div>

      <div className={step === 0 ? "" : "wizard"}>
        <div className="stack">
          {step === 0 ? (
            <>
              <div><h2 className="serif h3" style={{ margin: 0 }}>{w.chooseTitle}</h2><p className="muted" style={{ margin: "6px 0 0" }}>{w.chooseLede}</p></div>
              {experienceTypes.map((type) => {
                const group = templates.filter((entry) => entry.type === type);
                return (
                  <section key={type}>
                    <div className="group-head"><p className="group-label">{t.kinds[type]}</p><span className="group-count">{group.length}</span></div>
                    <div className="tcard-grid">
                      {group.map((entry) => (
                        <TemplateCard
                          key={entry.id}
                          id={entry.id}
                          title={t.templates[entry.id]}
                          blurb={t.templateBlurbs[entry.id]}
                          cta={w.next}
                          selected={templateId === entry.id}
                          onClick={() => { chooseTemplate(entry.id); setStep(1); }}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          ) : null}

          {step === 1 ? (
            <div className="card card-pad-lg stack">
              <div><h2 className="serif h3" style={{ margin: 0 }}>{w.detailsTitle}</h2><p className="muted" style={{ margin: "6px 0 0" }}>{w.detailsLede}</p></div>
              <label className="field">{t.fields.title} *<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} autoFocus placeholder={t.templates[templateId]} /></label>
              <label className="field">{t.fields.description} <span className="field-hint">({t.common.optional})</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} /></label>
              <TemplateFields template={templateId} values={values} onChange={setValues} t={t} />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="card card-pad-lg stack">
              <div><h2 className="serif h3" style={{ margin: 0 }}>{w.designTitle}</h2><p className="muted" style={{ margin: "6px 0 0" }}>{w.designLede}</p></div>
              <div className="preset-grid">
                {Object.values(themePresets).map((preset) => (
                  <button key={preset.preset} type="button" className="preset" aria-pressed={theme.preset === preset.preset} onClick={() => setTheme(preset)} style={{ background: preset.background }}>
                    <span className="swatch-row"><i style={{ background: preset.primary }} /><i style={{ background: preset.accent }} /><i style={{ background: "#fff" }} /></span>
                    <span style={{ color: preset.primary }}>{preset.preset}</span>
                  </button>
                ))}
              </div>
              <label className="field">{t.studio.design.accent}
                <span className="color-field" style={{ maxWidth: 260 }}>
                  <input type="color" value={theme.accent} onChange={(event) => setTheme({ ...theme, accent: event.target.value, preset: "custom" })} />
                  <input type="text" value={theme.accent} readOnly />
                </span>
              </label>
              <span className="group-label" style={{ margin: "6px 0 0" }}>{w.coverHint}</span>
              <div className="cover-library">
                {coverLibrary.map((src) => (
                  <button key={src} type="button" aria-pressed={(cover ?? templateImages[templateId]) === src} onClick={() => setCover(src)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="card card-pad-lg stack">
              <div><h2 className="serif h3" style={{ margin: 0 }}>{w.publishTitle}</h2><p className="muted" style={{ margin: "6px 0 0" }}>{w.publishLede}</p></div>
              <div className="radio-cards">
                {visibilities.map((value) => (
                  <button key={value} type="button" className="radio-card" aria-pressed={visibility === value} onClick={() => setVisibility(value)}>
                    <span className="task-check" style={{ borderRadius: "50%", background: visibility === value ? "var(--wine)" : "#fff", borderColor: visibility === value ? "var(--wine)" : undefined }} />
                    <span><strong>{t.visibility[value]}</strong><small>{t.visibilityHelp[value]}</small></span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="notice wine">
              {error}{" "}
              {error === t.common.configured ? <Link className="link" href={`/${locale}/demo/${templateId === "wedding" || templateId === "birthday" || templateId === "secret-santa" ? templateId : "baby-shower"}/admin`}>{t.dash.openDemo}</Link> : null}
            </div>
          ) : null}

          {step > 0 ? (
            <div className="row">
              <button className="btn btn-ghost" type="button" onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> {w.back}</button>
              {step < 3 ? (
                <button className="btn btn-primary btn-lg" type="button" onClick={next}>{w.next} <ArrowRight size={16} /></button>
              ) : (
                <div className="row-start">
                  <button className="btn btn-secondary btn-lg" type="button" disabled={busy} onClick={() => submit("draft")}><Save size={16} /> {w.draft}</button>
                  <button className="btn btn-primary btn-lg" type="button" disabled={busy} onClick={() => submit("active")}><Rocket size={16} /> {busy ? t.common.loading : w.publish}</button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {step > 0 ? (
          <div className="sticky">
            <p className="group-label" style={{ marginTop: 0 }}>{w.preview}</p>
            <div className="preview-frame">
              <div className="preview-bar"><i /><i /><i /><span>gatherly.app/e/…</span></div>
              <div className="preview-scroll" style={{ maxHeight: 560 }}>
                <PublicExperience locale={locale} t={t} experience={previewExperience} backend={null} signedIn={false} currentUserId={null} preview />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
