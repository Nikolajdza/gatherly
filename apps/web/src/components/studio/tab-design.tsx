"use client";

import { resolveTheme, themePresets, type ThemeConfig } from "@gatherly/shared";
import { ImagePlus, RotateCcw, Save } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { PublicExperience } from "@/components/experience/public-experience";
import { coverLibrary, templateImages } from "@/lib/template-media";
import { themeFor } from "@/lib/theme";
import type { StudioContext } from "./studio";

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: Array<[T, string]>; onChange: (value: T) => void }) {
  return (
    <div className="segmented" role="group">
      {options.map(([id, label]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  );
}

export function DesignTab({ ctx }: { ctx: StudioContext }) {
  const { t, experience, backend, locale } = ctx;
  const d = t.studio.design;
  const [theme, setTheme] = useState<ThemeConfig>(() => themeFor(experience.template, experience.themeConfig));
  const [cover, setCover] = useState<string>(experience.coverImageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<ThemeConfig>) => setTheme((current) => ({ ...current, ...patch, preset: patch.preset ?? (Object.keys(patch).some((key) => key !== "preset") ? "custom" : current.preset) }));

  const draft = useMemo(() => ({ ...experience, themeConfig: theme, coverImageUrl: cover || null }), [experience, theme, cover]);
  const relative = (value: string) => (value.startsWith(window.location.origin) ? value.slice(window.location.origin.length) : value);
  const selectedCover = cover ? relative(cover) : templateImages[experience.template] ?? "";

  async function save() {
    setSaving(true);
    try {
      let coverImageUrl: string | null = cover || null;
      if (coverImageUrl && coverImageUrl.startsWith("/") && backend.mode === "live") coverImageUrl = `${window.location.origin}${coverImageUrl}`;
      const next = await backend.updateExperience({ themeConfig: theme, coverImageUrl });
      ctx.setExperience(next);
      ctx.notify(t.common.saved);
    } catch (error) {
      ctx.fail(error);
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const url = await backend.uploadCover(file);
      if (url) setCover(url);
      else ctx.notify(t.common.error, "error");
    } catch (error) {
      ctx.fail(error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="studio-grid wide-right">
      <div className="stack">
        <div className="card card-pad stack">
          <div>
            <h2 className="serif h3" style={{ margin: 0 }}>{d.title}</h2>
            <p className="muted small" style={{ margin: "4px 0 0" }}>{d.lede}</p>
          </div>
          <span className="group-label" style={{ margin: "6px 0 0" }}>{d.presets}</span>
          <div className="preset-grid">
            {Object.values(themePresets).map((preset) => (
              <button key={preset.preset} type="button" className="preset" aria-pressed={theme.preset === preset.preset} onClick={() => setTheme(preset)} style={{ background: preset.background }}>
                <span className="swatch-row"><i style={{ background: preset.primary }} /><i style={{ background: preset.accent }} /><i style={{ background: "#fff" }} /></span>
                <span style={{ color: preset.primary }}>{preset.preset}</span>
              </button>
            ))}
          </div>

          <span className="group-label" style={{ margin: "10px 0 0" }}>{d.colors}</span>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {(["primary", "accent", "background"] as const).map((key) => (
              <label key={key} className="field">
                {d[key]}
                <span className="color-field">
                  <input type="color" value={theme[key]} onChange={(event) => update({ [key]: event.target.value })} />
                  <input type="text" value={theme[key]} maxLength={7} onChange={(event) => /^#[0-9a-fA-F]{0,6}$/.test(event.target.value) && update({ [key]: event.target.value })} />
                </span>
              </label>
            ))}
          </div>

          <span className="group-label" style={{ margin: "10px 0 0" }}>{d.font}</span>
          <Segmented value={theme.font} options={[["serif", d.fonts.serif], ["display", d.fonts.display], ["sans", d.fonts.sans]]} onChange={(font) => update({ font })} />
          <div className="grid-2" style={{ gap: 14 }}>
            <div className="stack-sm"><span className="group-label" style={{ margin: "10px 0 0" }}>{d.card}</span>
              <Segmented value={theme.card} options={[["soft", d.cards.soft], ["outlined", d.cards.outlined], ["elevated", d.cards.elevated]]} onChange={(card) => update({ card })} />
            </div>
            <div className="stack-sm"><span className="group-label" style={{ margin: "10px 0 0" }}>{d.radius}</span>
              <Segmented value={theme.radius} options={[["sm", d.radii.sm], ["md", d.radii.md], ["lg", d.radii.lg]]} onChange={(radius) => update({ radius })} />
            </div>
          </div>
          <span className="group-label" style={{ margin: "10px 0 0" }}>{d.decorative}</span>
          <Segmented
            value={theme.decorative}
            options={(["none", "botanical", "confetti", "rings", "snow"] as const).map((id) => [id, d.decorations[id]])}
            onChange={(decorative) => update({ decorative })}
          />
        </div>

        <div className="card card-pad stack">
          <h3 className="h4" style={{ margin: 0 }}>{d.cover}</h3>
          <span className="small muted">{d.coverLibrary}</span>
          <div className="cover-library">
            {coverLibrary.map((src) => (
              <button key={src} type="button" aria-pressed={selectedCover === src} onClick={() => setCover(src)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
              </button>
            ))}
          </div>
          <div className="input-group">
            <input className="input" placeholder={`${d.coverUrl} — https://`} value={cover.startsWith("data:") ? "" : cover} onChange={(event) => setCover(event.target.value)} />
            <button className="btn btn-secondary" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <ImagePlus size={16} /> {uploading ? t.common.loading : d.coverUpload}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }} />
          </div>
        </div>

        <div className="row-start">
          <button className="btn btn-primary btn-lg" type="button" disabled={saving} onClick={save}><Save size={17} /> {saving ? t.common.loading : d.save}</button>
          <button className="btn btn-ghost" type="button" onClick={() => { setTheme(resolveTheme(experience.template)); setCover(""); }}><RotateCcw size={16} /> {d.reset}</button>
        </div>
      </div>

      <div className="sticky">
        <div className="preview-frame">
          <div className="preview-bar"><i /><i /><i /><span>{ctx.publicHref}</span></div>
          <div className="preview-scroll">
            <PublicExperience locale={locale} t={t} experience={draft} backend={null} signedIn={false} currentUserId={null} preview />
          </div>
        </div>
      </div>
    </div>
  );
}
