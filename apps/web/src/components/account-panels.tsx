"use client";

import type { Profile } from "@gatherly/shared";
import { Crown, Inbox, Save, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { localeCookie, localeNames, locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { browserApi } from "@/lib/api";

export function InvitationDesk({ locale, dictionary: t }: { locale: Locale; dictionary: Dictionary }) {
  const [value, setValue] = useState("");
  const router = useRouter();
  const token = value.trim().replace(/\/+$/, "").split("/").pop() ?? "";
  return (
    <div className="stack-lg">
      <div className="page-title"><div><p className="eyebrow">{t.dash.workspace}</p><h1 className="serif">{t.dash.invitations}</h1><p>{t.invite.lede}</p></div></div>
      <form
        className="card card-pad-lg stack"
        style={{ maxWidth: 640 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (token) router.push(`/${locale}/invite/${encodeURIComponent(token)}`);
        }}
      >
        <span className="icon-chip"><Ticket size={22} /></span>
        <div>
          <h2 className="serif h3" style={{ margin: 0 }}>{t.invite.pasteTitle}</h2>
          <p className="muted" style={{ margin: "6px 0 0" }}>{t.invite.pasteLede}</p>
        </div>
        <div className="input-group">
          <input className="input" value={value} onChange={(event) => setValue(event.target.value)} placeholder={t.invite.pastePlaceholder} />
          <button className="btn btn-primary" type="submit" disabled={!token}><Inbox size={16} /> {t.invite.open}</button>
        </div>
      </form>
    </div>
  );
}

const timezones = ["Europe/Belgrade", "Europe/London", "Europe/Berlin", "Europe/Paris", "Europe/Rome", "Europe/Madrid", "Europe/Moscow", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Australia/Sydney"];

export function SettingsForm({ locale, dictionary: t, profile }: { locale: Locale; dictionary: Dictionary; profile: Profile | null }) {
  const toast = useToast();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [timezone, setTimezone] = useState(profile?.timezone ?? "Europe/Belgrade");
  const [language, setLanguage] = useState<Locale>(profile?.preferredLanguage ?? locale);
  const [plan, setPlan] = useState(profile?.plan ?? "free");
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const zones = timezones.includes(timezone) ? timezones : [timezone, ...timezones];

  return (
    <div className="stack-lg">
      <div className="page-title"><div><p className="eyebrow">{t.dash.workspace}</p><h1 className="serif">{t.settings.title}</h1><p>{t.settings.lede}</p></div></div>
      {!profile ? <div className="notice wine" style={{ maxWidth: 680 }}>{t.common.configured}</div> : null}
      <div className="card card-pad-lg stack" style={{ maxWidth: 680 }}>
        <div className="row-start">
          <span className="icon-chip"><Crown size={20} /></span>
          <div>
            <strong>{t.settings.plan}</strong>
            <div className="small muted">{plan === "pro" ? t.settings.planPro : t.settings.planFree}</div>
          </div>
        </div>
        <p className="muted small" style={{ margin: 0 }}>{t.settings.planLede}</p>
        {plan === "pro" ? (
          <span className="badge badge-sage">{t.settings.upgraded}</span>
        ) : (
          <button
            className="btn btn-primary"
            type="button"
            disabled={!profile || upgrading}
            onClick={async () => {
              setUpgrading(true);
              try {
                const next = await browserApi().billing.upgrade();
                setPlan(next.plan);
                toast(t.settings.upgraded);
                router.refresh();
              } catch {
                toast(t.common.error, "error");
              } finally {
                setUpgrading(false);
              }
            }}
          >
            <Crown size={16} /> {t.settings.upgrade}
          </button>
        )}
      </div>
      <form
        className="card card-pad-lg stack"
        style={{ maxWidth: 680 }}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!displayName.trim()) return;
          setSaving(true);
          try {
            await browserApi().profile.update({ displayName: displayName.trim(), preferredLanguage: language, timezone });
            document.cookie = `${localeCookie}=${language}; path=/; max-age=31536000; samesite=lax`;
            toast(t.settings.saved);
            if (language !== locale) router.push(`/${language}/dashboard/settings`);
            else router.refresh();
          } catch {
            toast(t.common.error, "error");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="row-start">
          <span className="avatar" style={{ width: 56, height: 56, fontSize: 20 }}>{(displayName || profile?.email || "G").slice(0, 1).toUpperCase()}</span>
          <div><strong>{t.settings.profile}</strong><div className="small muted">{profile?.email}</div></div>
        </div>
        <label className="field">{t.auth.name}<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} required /></label>
        <div className="form-grid">
          <label className="field">{t.settings.language}
            <select value={language} onChange={(event) => setLanguage(event.target.value as Locale)}>
              {locales.map((value) => <option key={value} value={value}>{localeNames[value]}</option>)}
            </select>
          </label>
          <label className="field">{t.settings.timezone}
            <select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
              {zones.map((zone) => <option key={zone} value={zone}>{zone.replace("_", " ")}</option>)}
            </select>
          </label>
        </div>
        <div><button className="btn btn-primary" type="submit" disabled={saving || !profile}><Save size={16} /> {saving ? t.common.loading : t.settings.save}</button></div>
      </form>
    </div>
  );
}
