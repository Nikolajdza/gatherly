"use client";

import { currencies, type AiTone, type SantaGiftIdea, type SecretSantaView } from "@gatherly/shared";
import { Ban, Dices, Gift, Lightbulb, Loader2, Lock, MessageCircleHeart, Plus, ShieldCheck, Sparkles, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BackendError } from "@/lib/studio/backend";
import { AiChip, AiDemoNote, CopyButton, ToneSelect, useAi } from "./ai-kit";
import type { StudioContext } from "./studio";

export function SantaTab({ ctx }: { ctx: StudioContext }) {
  const { t, backend } = ctx;
  const s = t.studio.santa;
  const [santa, setSanta] = useState<SecretSantaView | null>(null);
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState<(typeof currencies)[number]>("EUR");
  const [drawDate, setDrawDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [organizerParticipates, setOrganizerParticipates] = useState(true);
  const [ruleA, setRuleA] = useState("");
  const [ruleB, setRuleB] = useState("");
  const [wishes, setWishes] = useState<Array<{ title: string; note: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  function apply(view: SecretSantaView) {
    setSanta(view);
    setBudget(view.budgetCents ? String(view.budgetCents / 100) : "");
    setCurrency(view.currency as (typeof currencies)[number]);
    setDrawDate(view.drawDate ?? "");
    setDeadline(view.purchaseDeadline ?? "");
    setOrganizerParticipates(view.organizerParticipates);
  }

  useEffect(() => {
    backend.getSanta().then((view) => {
      apply(view);
      const me = view.participants.find((participant) => participant.userId === ctx.experience.ownerId && ctx.isOwner);
      setWishes((me?.wishlist ?? []).map((wish) => ({ title: wish.title, note: wish.note })));
    }).catch(ctx.fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend]);

  async function act(work: () => Promise<SecretSantaView>, success?: string) {
    setBusy(true);
    setDrawError(null);
    try {
      apply(await work());
      if (success) ctx.notify(success);
    } catch (error) {
      if (error instanceof BackendError && error.code === "DRAW_IMPOSSIBLE") setDrawError(s.impossible);
      else if (error instanceof BackendError && error.code === "NEED_MORE") setDrawError(s.needMore);
      else ctx.fail(error);
    } finally {
      setBusy(false);
    }
  }

  if (!santa) return <div className="skeleton" style={{ height: 320 }} />;

  const open = santa.status === "open";
  const locked = santa.status === "locked";
  const name = (id: string) => santa.participants.find((participant) => participant.id === id)?.displayName ?? "?";
  const myParticipant = santa.participants.find((participant) => participant.userId === ctx.experience.ownerId);
  const joined = Boolean(myParticipant) && ctx.isOwner;

  return (
    <div className="studio-grid wide-right">
      <div className="stack">
        {ctx.isOwner ? (
          <form
            className="card card-pad stack"
            onSubmit={(event) => {
              event.preventDefault();
              const amount = Number(budget.replace(",", "."));
              void act(() => backend.updateSanta({
                budgetCents: amount > 0 ? Math.round(amount * 100) : null,
                currency,
                drawDate: drawDate || null,
                purchaseDeadline: deadline || null,
                organizerParticipates,
              }), t.common.saved);
            }}
          >
            <div className="card-title" style={{ marginBottom: 0 }}><h3 className="h4">{s.title}</h3><span className={`badge badge-dot ${open ? "badge-gold" : "badge-sage"}`}>{s.status[santa.status]}</span></div>
            <div className="form-grid">
              <label className="field">{s.budget}<input inputMode="decimal" value={budget} disabled={!open} onChange={(event) => setBudget(event.target.value)} /></label>
              <label className="field">{s.currency}
                <select value={currency} disabled={!open} onChange={(event) => setCurrency(event.target.value as (typeof currencies)[number])}>
                  {currencies.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="field">{s.drawDate}<input type="date" value={drawDate} disabled={!open} onChange={(event) => setDrawDate(event.target.value)} /></label>
              <label className="field">{s.deadline}<input type="date" value={deadline} disabled={!open} onChange={(event) => setDeadline(event.target.value)} /></label>
            </div>
            <label className="switch">
              <span>{t.fields.organizerParticipates}</span>
              <input type="checkbox" checked={organizerParticipates} disabled={!open} onChange={(event) => setOrganizerParticipates(event.target.checked)} />
            </label>
            {open ? <button className="btn btn-dark" type="submit" disabled={busy}>{s.saveSettings}</button> : null}
          </form>
        ) : null}

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-pad card-title" style={{ marginBottom: 0 }}>
            <h3 className="h4">{s.participants}</h3>
            <div className="row-start">
              <span className="badge">{santa.participants.length}</span>
              {open && !joined && ctx.isOwner ? <button className="btn btn-secondary btn-sm" type="button" disabled={busy} onClick={() => act(() => backend.joinSanta())}><UserPlus size={15} /> {s.join}</button> : null}
            </div>
          </div>
          <div className="list" style={{ borderTop: "1px solid var(--line)" }}>
            {santa.participants.map((participant) => (
              <div className="list-row" key={participant.id}>
                <span className="avatar">{participant.displayName.slice(0, 1)}</span>
                <div className="grow">
                  <div className="title">{participant.displayName}{participant.userId === ctx.experience.ownerId && ctx.isOwner ? <span className="faint"> · {t.studio.people.you}</span> : null}</div>
                  <div className="sub"><Gift size={12} /> {participant.wishlist.length}</div>
                </div>
                {ctx.isOwner && open ? (
                  <button className="icon-btn danger" type="button" disabled={busy} onClick={() => act(() => backend.leaveSanta(participant.id))} aria-label={s.leave}><X size={16} /></button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad stack">
          <div>
            <h3 className="h4" style={{ margin: 0 }}><Ban size={17} /> {s.exclusions}</h3>
            <p className="muted small" style={{ margin: "6px 0 0" }}>{s.exclusionsLede}</p>
          </div>
          {santa.exclusions.map((rule) => (
            <div className="row" key={rule.id} style={{ padding: "10px 14px", borderRadius: 14, background: "var(--paper)", border: "1px solid var(--line)" }}>
              <span><strong>{name(rule.participantAId)}</strong> <span className="faint">↔ {s.cannotDraw} ↔</span> <strong>{name(rule.participantBId)}</strong></span>
              {ctx.isOwner && !locked ? <button className="icon-btn danger" type="button" onClick={() => act(() => backend.removeExclusion(rule.id))} aria-label={t.common.delete}><Trash2 size={15} /></button> : null}
            </div>
          ))}
          {ctx.isOwner && !locked ? (
            <div className="input-group" style={{ flexWrap: "wrap" }}>
              <select className="input" value={ruleA} onChange={(event) => setRuleA(event.target.value)} style={{ flex: 1, minWidth: 120 }}>
                <option value="">—</option>
                {santa.participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.displayName}</option>)}
              </select>
              <select className="input" value={ruleB} onChange={(event) => setRuleB(event.target.value)} style={{ flex: 1, minWidth: 120 }}>
                <option value="">—</option>
                {santa.participants.filter((participant) => participant.id !== ruleA).map((participant) => <option key={participant.id} value={participant.id}>{participant.displayName}</option>)}
              </select>
              <button className="btn btn-secondary" type="button" disabled={!ruleA || !ruleB || busy} onClick={() => act(async () => {
                const view = await backend.addExclusion(ruleA, ruleB);
                setRuleA("");
                setRuleB("");
                return view;
              })}><Plus size={16} /> {s.addRule}</button>
            </div>
          ) : null}
        </div>

        {ctx.canManage ? <InviteMessage ctx={ctx} /> : null}
      </div>

      <div className="stack">
        <div className="santa-card" style={{ borderRadius: 26, background: "linear-gradient(160deg, #1d3a2e, #142a21)", color: "#f4ede4" }}>
          <div className="row">
            <strong style={{ fontSize: 18 }}>{s.myMatch}</strong>
            <span className="badge" style={{ background: "rgba(230,184,162,.2)", color: "#f0c9bf" }}>{s.status[santa.status]}</span>
          </div>
          <div className="santa-match">
            {santa.myAssignment ? (
              <div className="row-start">
                <span className="santa-avatar">{santa.myAssignment.displayName.slice(0, 1)}</span>
                <div>
                  <strong className="serif" style={{ fontSize: 34, display: "block", lineHeight: 1 }}>{santa.myAssignment.displayName}</strong>
                  <span className="small" style={{ opacity: 0.7 }}>{santa.myAssignment.wishlist.map((wish) => wish.title).join(" · ") || s.noWishes}</span>
                </div>
              </div>
            ) : <p style={{ margin: 0, opacity: 0.8 }}>{s.myMatchHidden}</p>}
          </div>
          <p className="small" style={{ margin: "14px 0 0", opacity: 0.7, display: "flex", gap: 8 }}><ShieldCheck size={16} style={{ flex: "none" }} /> {s.privacy}</p>
          {ctx.isOwner && !locked ? (
            <div className="row-start" style={{ marginTop: 18, flexWrap: "wrap" }}>
              <button className="btn btn-light" type="button" disabled={busy} onClick={() => act(() => backend.draw(), s.drawn)}>
                <Dices size={16} /> {santa.status === "drawn" ? s.redraw : s.draw}
              </button>
              {santa.status === "drawn" ? (
                <button className="btn" type="button" style={{ color: "#fff", borderColor: "rgba(255,255,255,.4)" }} disabled={busy} onClick={() => {
                  if (window.confirm(s.lockHint)) void act(() => backend.lock());
                }}><Lock size={16} /> {s.lock}</button>
              ) : null}
            </div>
          ) : null}
          {drawError ? <p className="small" style={{ margin: "12px 0 0", color: "#ffc9c2" }}>{drawError}</p> : null}
        </div>

        {santa.myAssignment ? <SantaIdeas ctx={ctx} /> : null}

        {joined ? (
          <div className="card card-pad stack">
            <div>
              <h3 className="h4" style={{ margin: 0 }}>{s.wishlist}</h3>
              <p className="muted small" style={{ margin: "6px 0 0" }}>{s.wishlistLede}</p>
            </div>
            {wishes.map((wish, index) => (
              <div className="input-group" key={index}>
                <input className="input" value={wish.title} placeholder={s.wishTitle} disabled={locked} onChange={(event) => setWishes(wishes.map((entry, position) => (position === index ? { ...entry, title: event.target.value } : entry)))} />
                <button className="icon-btn danger" type="button" disabled={locked} onClick={() => setWishes(wishes.filter((_, position) => position !== index))} aria-label={t.common.delete}><Trash2 size={15} /></button>
              </div>
            ))}
            {!locked ? (
              <div className="row-start">
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => setWishes([...wishes, { title: "", note: "" }])}><Plus size={15} /> {s.wishAdd}</button>
                <button className="btn btn-primary btn-sm" type="button" disabled={busy} onClick={() => act(() => backend.saveWishlist(wishes.filter((wish) => wish.title.trim()).map((wish) => ({ title: wish.title.trim(), note: wish.note }))), t.common.saved)}>{s.wishSave}</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SantaIdeas({ ctx }: { ctx: StudioContext }) {
  const { t, backend, locale } = ctx;
  const a = t.studio.ai;
  const [ideas, setIdeas] = useState<SantaGiftIdea[] | null>(null);
  const ai = useAi(ctx);

  async function load() {
    const result = await ai.run(() => backend.santaIdeas(locale));
    if (result) setIdeas(result);
  }

  return (
    <div className="card card-pad stack ai-card">
      <div className="card-title">
        <h3 className="h4" style={{ margin: 0 }}><Lightbulb size={17} /> {a.santaIdeasTitle}</h3>
        <AiChip t={t} />
      </div>
      <button className="btn btn-primary" type="button" onClick={load} disabled={ai.busy}>
        {ai.busy ? <><Loader2 size={16} className="spin" /> {a.working}</> : <><Sparkles size={16} /> {ideas ? a.regenerate : a.santaIdeasButton}</>}
      </button>
      {ideas ? (
        <div className="ai-pick-list">
          {ideas.map((idea) => (
            <div className="ai-pick" key={idea.title} style={{ cursor: "default" }}>
              <Gift size={16} style={{ flex: "none", marginTop: 2, color: "var(--wine)" }} />
              <span className="ai-pick-body">
                <span className="ai-pick-title">{idea.title}</span>
                <span className="ai-pick-sub" style={{ display: "block" }}>{idea.note}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <AiDemoNote ctx={ctx} />
    </div>
  );
}

function InviteMessage({ ctx }: { ctx: StudioContext }) {
  const { t, backend, locale } = ctx;
  const a = t.studio.ai;
  const [tone, setTone] = useState<AiTone>("playful");
  const [text, setText] = useState("");
  const ai = useAi(ctx);

  async function write() {
    const result = await ai.run(() => backend.aiMessage("santa_invite", tone, locale));
    if (result) setText(result.text);
  }

  const full = `${text}\n${typeof window === "undefined" ? "" : `${window.location.origin}${ctx.publicHref}`}`;

  return (
    <div className="card card-pad stack ai-card">
      <div className="card-title">
        <div>
          <h3 className="h4" style={{ margin: 0 }}><MessageCircleHeart size={17} /> {a.inviteTitle}</h3>
          <p className="muted small" style={{ margin: "6px 0 0" }}>{a.inviteLede}</p>
        </div>
        <AiChip t={t} />
      </div>
      <div className="row-start" style={{ flexWrap: "wrap" }}>
        <ToneSelect t={t} value={tone} onChange={setTone} />
        <button className="btn btn-primary" type="button" onClick={write} disabled={ai.busy}>
          {ai.busy ? <><Loader2 size={16} className="spin" /> {a.working}</> : <><Sparkles size={16} /> {text ? a.regenerate : a.inviteButton}</>}
        </button>
      </div>
      {text ? (
        <>
          <label className="field">
            <span className="sr-only">{a.inviteTitle}</span>
            <textarea value={text} onChange={(event) => setText(event.target.value)} style={{ minHeight: 120 }} maxLength={1000} />
          </label>
          <div className="row-start" style={{ flexWrap: "wrap" }}>
            <CopyButton ctx={ctx} text={full} />
            <a className="btn btn-secondary btn-sm" href={`https://wa.me/?text=${encodeURIComponent(full)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </>
      ) : null}
      <AiDemoNote ctx={ctx} />
    </div>
  );
}
