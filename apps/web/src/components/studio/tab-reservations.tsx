"use client";

import type { AiTone, PublicItem, ThankYouNote } from "@gatherly/shared";
import { Gift, Heart, Loader2, Lock, Send, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { formatPrice, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { AiChip, AiDemoNote, CopyButton, ToneSelect, useAi } from "./ai-kit";
import type { StudioContext } from "./studio";

function Row({ item, locale, t, thankYouMode }: { item: PublicItem; locale: Locale; t: Dictionary; thankYouMode: boolean }) {
  const target = item.targetAmountCents ?? item.priceCents ?? 0;
  return (
    <div className="list-row">
      <div className="thumb" style={{ width: 46, height: 46 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Gift size={18} />}
      </div>
      <div className="grow">
        <div className="title">{item.title}</div>
        <div className="sub">
          {item.isGroupGift
            ? <span>{formatPrice(locale, item.pledgedCents, item.currency)} {t.publicPage.of} {formatPrice(locale, target, item.currency)}</span>
            : <span>{formatPrice(locale, item.priceCents, item.currency)}</span>}
          {item.category ? <span>{item.category}</span> : null}
          {thankYouMode && item.reservation?.reserverName ? (
            <span>{t.studio.reservations.reservedBy.replace("{name}", item.reservation.reserverName)}</span>
          ) : null}
        </div>
        {item.isGroupGift ? (
          <div className="progress gold" style={{ marginTop: 8, height: 6 }}><span style={{ width: `${target ? Math.min(100, (item.pledgedCents / target) * 100) : 0}%` }} /></div>
        ) : null}
      </div>
      {item.reserved ? <span className="badge badge-sage"><Lock size={12} /> {t.studio.gifts.reservedBadge}</span> : null}
    </div>
  );
}

export function ReservationsTab({ ctx }: { ctx: StudioContext }) {
  const { t, experience, locale } = ctx;
  const r = t.studio.reservations;
  const singles = experience.items.filter((item) => !item.isGroupGift);
  const reserved = singles.filter((item) => item.reserved);
  const open = singles.filter((item) => !item.reserved);
  const groups = experience.items.filter((item) => item.isGroupGift);

  return (
    <div className="stack-lg">
      <div className="notice sage row-start" style={{ alignItems: "flex-start", gap: 14 }}>
        <ShieldCheck size={22} style={{ flex: "none" }} />
        <div><strong>{r.privacyTitle}</strong><div style={{ marginTop: 4 }}>{experience.thankYouMode ? r.privacyThankYouOn : r.privacyText}</div></div>
      </div>
      {ctx.isOwner ? <ThankYouModeToggle ctx={ctx} /> : null}
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-pad card-title" style={{ marginBottom: 0 }}><h3 className="h4">{r.reservedList}</h3><span className="badge badge-sage">{reserved.length}</span></div>
          <div className="list" style={{ borderTop: "1px solid var(--line)" }}>
            {reserved.map((item) => <Row key={item.id} item={item} locale={locale} t={t} thankYouMode={experience.thankYouMode} />)}
            {reserved.length === 0 ? <p className="muted card-pad" style={{ margin: 0 }}>{r.none}</p> : null}
          </div>
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-pad card-title" style={{ marginBottom: 0 }}><h3 className="h4">{r.openList}</h3><span className="badge">{open.length}</span></div>
          <div className="list" style={{ borderTop: "1px solid var(--line)" }}>
            {open.map((item) => <Row key={item.id} item={item} locale={locale} t={t} thankYouMode={false} />)}
            {open.length === 0 ? <p className="muted card-pad" style={{ margin: 0 }}>{r.allTaken}</p> : null}
          </div>
        </div>
      </div>
      {groups.length ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-pad card-title" style={{ marginBottom: 0 }}><h3 className="h4"><Users size={18} /> {r.groupGifts}</h3><span className="badge badge-gold">{groups.length}</span></div>
          <div className="list" style={{ borderTop: "1px solid var(--line)" }}>
            {groups.map((item) => <Row key={item.id} item={item} locale={locale} t={t} thankYouMode={experience.thankYouMode} />)}
          </div>
        </div>
      ) : null}
      {ctx.canManage ? <ThankYouCard ctx={ctx} hasGifts={reserved.length > 0 || groups.some((item) => item.pledgedCents > 0)} /> : null}
    </div>
  );
}

function ThankYouModeToggle({ ctx }: { ctx: StudioContext }) {
  const { t, experience, backend } = ctx;
  const r = t.studio.reservations;
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const next = await backend.updateExperience({ thankYouMode: !experience.thankYouMode });
      ctx.setExperience(next);
      ctx.notify(experience.thankYouMode ? r.thankYouOff : r.thankYouOn);
    } catch (error) {
      ctx.fail(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card-pad row" style={{ alignItems: "center", gap: 16 }}>
      <div className="grow">
        <strong>{r.thankYouMode}</strong>
        <p className="muted small" style={{ margin: "4px 0 0" }}>{r.thankYouModeLede}</p>
      </div>
      <button className={`btn ${experience.thankYouMode ? "btn-primary" : "btn-secondary"}`} type="button" disabled={busy} onClick={toggle}>
        {experience.thankYouMode ? r.thankYouModeOn : r.thankYouModeOff}
      </button>
    </div>
  );
}

function ThankYouCard({ ctx, hasGifts }: { ctx: StudioContext; hasGifts: boolean }) {
  const { t, backend, locale, experience } = ctx;
  const a = t.studio.ai;
  const r = t.studio.reservations;
  const [tone, setTone] = useState<AiTone>("warm");
  const [notes, setNotes] = useState<ThankYouNote[] | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const ai = useAi(ctx);

  async function write() {
    const result = await ai.run(() => backend.thankYouNotes(tone, locale));
    if (result) {
      setNotes(result);
      if (result[0]?.message) setNote(result[0].message);
    }
  }

  async function send() {
    if (!note.trim() || !experience.thankYouMode) return;
    setSending(true);
    try {
      const result = await backend.sendThankYou({ note: note.trim(), onlyReserved: true });
      ctx.notify(r.thankYouSent.replace("{count}", String(result.sent)));
    } catch (error) {
      ctx.fail(error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card card-pad stack ai-card">
      <div className="card-title">
        <div className="row-start">
          <span className="icon-chip"><Heart size={20} /></span>
          <div>
            <h3 className="h4" style={{ margin: 0 }}>{a.thanksTitle}</h3>
            <p className="muted small" style={{ margin: "4px 0 0" }}>{a.thanksLede}</p>
          </div>
        </div>
        <AiChip t={t} />
      </div>
      {hasGifts ? (
        <div className="row-start" style={{ flexWrap: "wrap" }}>
          <ToneSelect t={t} value={tone} onChange={setTone} />
          <button className="btn btn-primary" type="button" onClick={write} disabled={ai.busy}>
            {ai.busy ? <><Loader2 size={16} className="spin" /> {a.working}</> : <><Sparkles size={16} /> {notes ? a.regenerate : a.thanksButton}</>}
          </button>
          {notes?.length ? <CopyButton ctx={ctx} small={false} label={a.copyAll} text={notes.map((entry) => `${entry.title}\n${entry.message}`).join("\n\n")} /> : null}
        </div>
      ) : (
        <p className="muted small" style={{ margin: 0 }}>{a.thanksEmpty}</p>
      )}
      {notes ? (
        <div className="stack-sm">
          {notes.map((entry) => (
            <div key={entry.itemId} className="stack-sm">
              <div className="row">
                <strong className="small">{entry.title}</strong>
                <CopyButton ctx={ctx} text={entry.message} />
              </div>
              <p className="ai-text">{entry.message}</p>
            </div>
          ))}
        </div>
      ) : null}
      {ctx.isOwner && hasGifts ? (
        <div className="stack-sm" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <label className="field">
            {r.sendNoteLabel}
            <textarea value={note} onChange={(event) => setNote(event.target.value)} style={{ minHeight: 90 }} maxLength={2000} />
          </label>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={sending || !note.trim() || !experience.thankYouMode}
            onClick={send}
          >
            {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />} {r.sendNote}
          </button>
          {!experience.thankYouMode ? <p className="small muted" style={{ margin: 0 }}>{r.sendNoteNeedMode}</p> : null}
        </div>
      ) : null}
      <AiDemoNote ctx={ctx} />
    </div>
  );
}
