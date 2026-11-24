"use client";

import { parseTemplateConfig, visibilities, type ExperienceStatus, type Visibility } from "@gatherly/shared";
import { Archive, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { aiErrorText } from "./ai-kit";
import type { StudioContext } from "./studio";
import { configFromValues, eventDateFrom, TemplateFields, valuesFromConfig, type FieldValues } from "./template-fields";

export function SettingsTab({ ctx }: { ctx: StudioContext }) {
  const { t, experience, backend } = ctx;
  const st = t.studio.settings;
  const router = useRouter();
  const [title, setTitle] = useState(experience.title);
  const [description, setDescription] = useState(experience.description);
  const [values, setValues] = useState<FieldValues>(() => valuesFromConfig(experience.template, experience.config as Record<string, unknown>));
  const [visibility, setVisibility] = useState<Visibility>(experience.visibility);
  const [status, setStatus] = useState<ExperienceStatus>(experience.status);
  const [eventDate, setEventDate] = useState(experience.eventDate ?? "");
  const [tone, setTone] = useState<"warm" | "formal" | "playful">("warm");
  const [writing, setWriting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");

  const templateDate = eventDateFrom(values);

  async function save(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    const config = configFromValues(experience.template, experience.type, values, experience.config as Record<string, unknown>);
    try {
      parseTemplateConfig(experience.template, config);
    } catch {
      setError(t.common.required);
      return;
    }
    if (!title.trim()) {
      setError(t.common.required);
      return;
    }
    setSaving(true);
    try {
      const next = await backend.updateExperience({
        title: title.trim(),
        description: description.trim(),
        visibility,
        status,
        eventDate: templateDate ?? (eventDate || null),
        config,
      });
      ctx.setExperience(next);
      ctx.notify(st.saved);
    } catch (failure) {
      ctx.fail(failure);
    } finally {
      setSaving(false);
    }
  }

  async function write() {
    setWriting(true);
    try {
      const result = await backend.describe(tone, ctx.locale);
      setDescription(result.description);
    } catch (error) {
      ctx.notify(aiErrorText(t, error), "error");
    } finally {
      setWriting(false);
    }
  }

  async function archive() {
    try {
      const next = await backend.updateExperience({ status: experience.status === "archived" ? "active" : "archived" });
      ctx.setExperience(next);
      setStatus(next.status);
      ctx.notify(st.saved);
    } catch (failure) {
      ctx.fail(failure);
    }
  }

  async function remove() {
    try {
      await backend.deleteExperience();
      router.push(ctx.afterDelete);
      router.refresh();
    } catch (failure) {
      ctx.fail(failure);
    }
  }

  return (
    <form className="studio-grid" onSubmit={save}>
      <div className="stack">
        <div className="card card-pad stack">
          <h2 className="serif h3" style={{ margin: 0 }}>{st.details}</h2>
          <label className="field">{t.fields.title} *<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} /></label>
          <label className="field">
            <span className="row">
              {t.fields.description}
              <span className="row-start" style={{ gap: 6 }}>
                <select className="input" value={tone} onChange={(event) => setTone(event.target.value as typeof tone)} style={{ minHeight: 32, width: "auto", padding: "0 10px", fontSize: 13 }} aria-label={st.tone}>
                  {(["warm", "formal", "playful"] as const).map((value) => <option key={value} value={value}>{st.tones[value]}</option>)}
                </select>
                <button className="btn btn-secondary btn-sm" type="button" onClick={write} disabled={writing}>
                  {writing ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} {st.aiDescribe}
                </button>
              </span>
            </span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} />
          </label>
          {!templateDate ? (
            <label className="field">{st.eventDate}<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label>
          ) : null}
        </div>

        <div className="card card-pad stack">
          <h3 className="h4" style={{ margin: 0 }}>{st.templateFields}</h3>
          <TemplateFields template={experience.template} values={values} onChange={setValues} t={t} />
        </div>
      </div>

      <div className="stack sticky">
        <div className="card card-pad stack">
          <h3 className="h4" style={{ margin: 0 }}>{st.privacy}</h3>
          <div className="segmented" role="group">
            {(["draft", "active"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}>{t.status[value]}</button>
            ))}
          </div>
          <div className="radio-cards">
            {visibilities.map((value) => (
              <button key={value} type="button" className="radio-card" aria-pressed={visibility === value} onClick={() => setVisibility(value)} style={{ padding: 12 }}>
                <span className="task-check" style={{ borderRadius: "50%", background: visibility === value ? "var(--wine)" : "#fff", borderColor: visibility === value ? "var(--wine)" : undefined }} />
                <span><strong>{t.visibility[value]}</strong><small>{t.visibilityHelp[value]}</small></span>
              </button>
            ))}
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn btn-primary btn-lg" type="submit" disabled={saving}><Save size={17} /> {saving ? t.common.loading : st.save}</button>
        </div>

        {ctx.isOwner ? (
          <div className="card card-pad stack" style={{ borderColor: "#ebcfcc" }}>
            <h3 className="h4" style={{ margin: 0, color: "var(--danger)" }}>{st.danger}</h3>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <p className="small muted" style={{ margin: 0 }}>{st.archiveText}</p>
              <button className="btn btn-secondary btn-sm" type="button" onClick={archive}><Archive size={15} /> {experience.status === "archived" ? t.status.active : st.archive}</button>
            </div>
            <div className="divider" style={{ margin: "4px 0" }} />
            <p className="small muted" style={{ margin: 0 }}>{st.deleteText}</p>
            <label className="field">
              <span className="field-hint">{st.deleteConfirm}: <b>{experience.title}</b></span>
              <input value={confirmTitle} onChange={(event) => setConfirmTitle(event.target.value)} />
            </label>
            <button className="btn btn-danger" type="button" disabled={confirmTitle.trim() !== experience.title} onClick={remove}><Trash2 size={15} /> {st.delete}</button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
