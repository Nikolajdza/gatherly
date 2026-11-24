"use client";

import { currencies, parsePriceToCents, type GiftIdea, type ItemInput, type ProductPreview, type PublicItem } from "@gatherly/shared";
import { ArrowDown, ArrowUp, ClipboardPaste, Gift, Lightbulb, Link2, Loader2, Pencil, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { formatPrice } from "@/i18n/config";
import { BackendError } from "@/lib/studio/backend";
import { AiChip, AiDemoNote, aiErrorText, useAi } from "./ai-kit";
import type { StudioContext } from "./studio";

type Draft = {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  price: string;
  currency: (typeof currencies)[number];
  category: string;
  priority: "low" | "medium" | "high";
  quantity: string;
  itemKind: "product" | "experience";
  isGroupGift: boolean;
  target: string;
};

const emptyDraft: Draft = {
  title: "",
  description: "",
  url: "",
  imageUrl: "",
  price: "",
  currency: "EUR",
  category: "",
  priority: "medium",
  quantity: "1",
  itemKind: "product",
  isGroupGift: false,
  target: "",
};

function centsToInput(cents: number | null) {
  return cents === null ? "" : String(cents / 100);
}

function draftFromItem(item: PublicItem): Draft {
  return {
    title: item.title,
    description: item.description,
    url: item.url ?? "",
    imageUrl: item.imageUrl ?? "",
    price: centsToInput(item.priceCents),
    currency: (currencies as readonly string[]).includes(item.currency ?? "") ? (item.currency as Draft["currency"]) : "EUR",
    category: item.category ?? "",
    priority: item.priority,
    quantity: String(item.quantity),
    itemKind: item.itemKind,
    isGroupGift: item.isGroupGift,
    target: centsToInput(item.targetAmountCents),
  };
}

function absolute(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && typeof window !== "undefined") return `${window.location.origin}${trimmed}`;
  return trimmed;
}

export function GiftsTab({ ctx }: { ctx: StudioContext }) {
  const { t, experience, backend, locale } = ctx;
  const g = t.studio.gifts;
  const [filter, setFilter] = useState<"all" | "available" | "reserved">("all");
  const [editing, setEditing] = useState<PublicItem | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [preview, setPreview] = useState<ProductPreview | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteUrl, setPasteUrl] = useState("");
  const [ideaPrompt, setIdeaPrompt] = useState("");
  const [ideaBudget, setIdeaBudget] = useState("");
  const [ideas, setIdeas] = useState<GiftIdea[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);
  const paste = useAi(ctx);
  const ideasAi = useAi(ctx);
  const a = t.studio.ai;

  const items = [...experience.items].sort((a, b) => a.sortOrder - b.sortOrder);
  const shown = items.filter((item) => (filter === "all" ? true : filter === "available" ? !item.reserved : item.reserved));

  function open(item: PublicItem | "new", fromPreview?: ProductPreview) {
    setFormError(null);
    setPreview(fromPreview ?? null);
    if (item === "new") {
      setDraft(
        fromPreview
          ? {
              ...emptyDraft,
              title: fromPreview.title,
              description: fromPreview.description ?? "",
              url: fromPreview.url ?? "",
              imageUrl: fromPreview.imageUrl ?? "",
              price: centsToInput(fromPreview.priceCents),
              currency: (currencies as readonly string[]).includes(fromPreview.currency ?? "") ? (fromPreview.currency as Draft["currency"]) : "EUR",
              category: fromPreview.category ?? "",
              priority: fromPreview.priority,
            }
          : emptyDraft,
      );
    } else {
      setDraft(draftFromItem(item));
    }
    setEditing(item);
  }

  async function runImport(event: React.FormEvent) {
    event.preventDefault();
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      const result = await backend.extractProduct(importUrl.trim(), locale);
      setImportUrl("");
      open("new", result);
    } catch (error) {
      if (error instanceof BackendError && error.code === "FETCH_FAILED") {
        setPasteUrl(importUrl.trim());
        setPasteMode(true);
        setImportError(a.fetchFailed);
      } else {
        setImportError(error instanceof BackendError && error.code === "AI_LIMIT" ? aiErrorText(t, error) : g.importFailed);
      }
    } finally {
      setImporting(false);
    }
  }

  async function runPaste(event: React.FormEvent) {
    event.preventDefault();
    if (pasteText.trim().length < 20) return;
    const result = await paste.run(() => backend.productFromText(pasteText.trim(), pasteUrl.trim() || null, locale));
    if (!result) return;
    setPasteText("");
    setPasteUrl("");
    setPasteMode(false);
    setImportError(null);
    open("new", result);
  }

  async function suggest(event: React.FormEvent) {
    event.preventDefault();
    const budgetCents = ideaBudget.trim() ? parsePriceToCents(ideaBudget) : null;
    const result = await ideasAi.run(() => backend.giftIdeas({ prompt: ideaPrompt.trim(), budgetCents }, locale));
    if (!result) return;
    setIdeas(result);
    setPicked(new Set(result.map((_, index) => index)));
  }

  function togglePick(index: number) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function addIdeas() {
    if (!ideas) return;
    setAdding(true);
    try {
      for (const [index, idea] of ideas.entries()) {
        if (!picked.has(index)) continue;
        await backend.createItem({
          title: idea.title,
          description: idea.description,
          category: idea.category,
          itemKind: idea.itemKind,
          priority: "medium",
          quantity: 1,
          isGroupGift: false,
        });
      }
      await ctx.refresh();
      setIdeas(null);
      ctx.notify(a.added);
    } catch (error) {
      ctx.fail(error);
    } finally {
      setAdding(false);
    }
  }

  async function save() {
    if (!draft.title.trim()) {
      setFormError(t.common.required);
      return;
    }
    const priceCents = draft.price.trim() ? parsePriceToCents(draft.price) : null;
    const targetCents = draft.target.trim() ? parsePriceToCents(draft.target) : null;
    const body: ItemInput & { aiImportId?: string } = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      url: absolute(draft.url),
      imageUrl: absolute(draft.imageUrl),
      priceCents,
      currency: priceCents !== null || draft.isGroupGift ? draft.currency : null,
      category: draft.category.trim() || null,
      priority: draft.priority,
      quantity: Math.max(1, Math.min(99, Number(draft.quantity) || 1)),
      itemKind: draft.itemKind,
      isGroupGift: draft.isGroupGift,
      targetAmountCents: draft.isGroupGift ? (targetCents ?? priceCents) : null,
    };
    if (backend.mode === "demo" && body.imageUrl?.startsWith(window.location.origin)) {
      body.imageUrl = body.imageUrl.slice(window.location.origin.length);
    }
    if (preview && editing === "new") body.aiImportId = preview.importId;
    setSaving(true);
    try {
      if (editing === "new") await backend.createItem(body);
      else if (editing) await backend.updateItem(editing.id, body);
      await ctx.refresh();
      setEditing(null);
      ctx.notify(t.common.saved);
    } catch (error) {
      ctx.fail(error);
    } finally {
      setSaving(false);
    }
  }

  async function move(index: number, delta: number) {
    const ordered = items.map((item) => item.id);
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    ctx.setExperience({
      ...experience,
      items: ordered.map((id, sortOrder) => ({ ...items.find((item) => item.id === id)!, sortOrder })),
    });
    try {
      await backend.reorderItems(ordered);
    } catch (error) {
      ctx.fail(error);
      await ctx.refresh();
    }
  }

  async function remove(item: PublicItem) {
    if (!window.confirm(g.deleteConfirm)) return;
    try {
      await backend.removeItem(item.id);
      await ctx.refresh();
    } catch (error) {
      ctx.fail(error);
    }
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="studio-grid">
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-pad" style={{ paddingBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 8 }}>
            <div>
              <h2 className="serif h3">{g.title}</h2>
              <p className="muted small" style={{ margin: "4px 0 0" }}>{g.lede}</p>
            </div>
            {ctx.canManage ? <button className="btn btn-primary btn-sm" type="button" onClick={() => open("new")}><Plus size={16} /> {g.add}</button> : null}
          </div>
          <div className="segmented" role="group" style={{ marginTop: 10 }}>
            {(["all", "available", "reserved"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
                {value === "all" ? g.filterAll : value === "available" ? g.filterAvailable : g.filterReserved}
                {" "}<span className="faint">{value === "all" ? items.length : value === "available" ? items.filter((item) => !item.reserved).length : items.filter((item) => item.reserved).length}</span>
              </button>
            ))}
          </div>
        </div>
        {items.length === 0 ? (
          <div className="empty">
            <span className="icon-chip"><Gift size={26} /></span>
            <h3 className="serif">{g.empty}</h3>
            <p>{g.emptyText}</p>
          </div>
        ) : (
          <div className="list" style={{ borderTop: "1px solid var(--line)" }}>
            {shown.map((item) => {
              const index = items.findIndex((entry) => entry.id === item.id);
              return (
                <div className="list-row" key={item.id}>
                  <div className="thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Gift size={20} />}
                  </div>
                  <div className="grow">
                    <div className="title">{item.title}</div>
                    <div className="sub">
                      {item.priceCents !== null ? <strong style={{ color: "var(--ink)" }}>{formatPrice(locale, item.priceCents, item.currency)}</strong> : null}
                      {item.category ? <span>{item.category}</span> : null}
                      <span><i className={`prio ${item.priority}`} /> {t.priority[item.priority]}</span>
                      {item.isGroupGift ? <span><Users size={12} /> {formatPrice(locale, item.pledgedCents, item.currency)} {g.pledged}</span> : null}
                    </div>
                  </div>
                  <span className={`badge hide-sm ${item.reserved ? "badge-sage" : ""}`}>{item.reserved ? g.reservedBadge : g.availableBadge}</span>
                  {ctx.canManage ? (
                    <div className="row-actions">
                      <button className="icon-btn hide-sm" type="button" disabled={index === 0 || filter !== "all"} onClick={() => move(index, -1)} aria-label={g.moveUp}><ArrowUp size={16} /></button>
                      <button className="icon-btn hide-sm" type="button" disabled={index === items.length - 1 || filter !== "all"} onClick={() => move(index, 1)} aria-label={g.moveDown}><ArrowDown size={16} /></button>
                      <button className="icon-btn" type="button" onClick={() => open(item)} aria-label={g.edit}><Pencil size={16} /></button>
                      <button className="icon-btn danger" type="button" onClick={() => remove(item)} aria-label={t.common.delete}><Trash2 size={16} /></button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ctx.canManage ? (
        <div className="stack">
          <form className="card card-pad stack" onSubmit={runImport} style={{ background: "linear-gradient(160deg, #fff, var(--wine-soft))" }}>
            <span className="icon-chip"><Sparkles size={20} /></span>
            <div>
              <h3 className="h4" style={{ margin: 0 }}>{g.importTitle}</h3>
              <p className="muted small" style={{ margin: "6px 0 0", lineHeight: 1.55 }}>{g.importLede}</p>
            </div>
            <label className="field">
              <span className="sr-only">{g.fields.url}</span>
              <input type="url" placeholder="https://" value={importUrl} onChange={(event) => setImportUrl(event.target.value)} />
            </label>
            <button className="btn btn-dark" type="submit" disabled={importing || !importUrl.trim()}>
              {importing ? <><Loader2 size={16} className="spin" /> {g.importing}</> : <><Link2 size={16} /> {g.importButton}</>}
            </button>
            {importError ? <p className="form-error">{importError}</p> : null}
            {backend.mode === "demo" ? <p className="small faint" style={{ margin: 0 }}>{g.demoImport}</p> : null}
            {!pasteMode ? (
              <button className="link-btn" type="button" onClick={() => setPasteMode(true)}><ClipboardPaste size={14} /> {a.pasteToggle}</button>
            ) : null}
          </form>

          {pasteMode ? (
            <form className="card card-pad stack ai-card" onSubmit={runPaste}>
              <div className="card-title">
                <h3 className="h4" style={{ margin: 0 }}>{a.pasteTitle}</h3>
                <AiChip t={t} />
              </div>
              <p className="muted small" style={{ margin: 0, lineHeight: 1.55 }}>{a.pasteLede}</p>
              <label className="field">
                <span className="sr-only">{a.pasteTitle}</span>
                <textarea value={pasteText} onChange={(event) => setPasteText(event.target.value)} placeholder={a.pastePlaceholder} style={{ minHeight: 120 }} maxLength={12000} />
              </label>
              <label className="field">
                {a.pasteUrl}
                <input type="url" value={pasteUrl} onChange={(event) => setPasteUrl(event.target.value)} placeholder="https://" />
              </label>
              <div className="row-start">
                <button className="btn btn-dark" type="submit" disabled={paste.busy || pasteText.trim().length < 20}>
                  {paste.busy ? <><Loader2 size={16} className="spin" /> {a.working}</> : <><Sparkles size={16} /> {a.pasteButton}</>}
                </button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setPasteMode(false)}>{t.common.cancel}</button>
              </div>
              <AiDemoNote ctx={ctx} />
            </form>
          ) : null}

          <form className="card card-pad stack ai-card" onSubmit={suggest}>
            <div className="card-title">
              <span className="icon-chip"><Lightbulb size={20} /></span>
              <AiChip t={t} />
            </div>
            <div>
              <h3 className="h4" style={{ margin: 0 }}>{a.ideasTitle}</h3>
              <p className="muted small" style={{ margin: "6px 0 0", lineHeight: 1.55 }}>{a.ideasLede}</p>
            </div>
            <label className="field">
              {a.ideasPrompt}
              <input value={ideaPrompt} onChange={(event) => setIdeaPrompt(event.target.value)} placeholder={a.ideasPromptPlaceholder} maxLength={300} />
            </label>
            <label className="field">
              {a.ideasBudget}
              <input inputMode="decimal" value={ideaBudget} onChange={(event) => setIdeaBudget(event.target.value)} placeholder="50" />
            </label>
            <button className="btn btn-primary" type="submit" disabled={ideasAi.busy}>
              {ideasAi.busy ? <><Loader2 size={16} className="spin" /> {a.working}</> : <><Sparkles size={16} /> {a.ideasButton}</>}
            </button>
          </form>
          <div className="card card-pad">
            <h3 className="h4" style={{ margin: "0 0 10px" }}>{t.studio.overview.progress}</h3>
            <div className="progress"><span style={{ width: `${items.length ? (items.filter((item) => item.reserved).length / items.length) * 100 : 0}%` }} /></div>
            <p className="small muted" style={{ margin: "10px 0 0" }}>{items.filter((item) => item.reserved).length} / {items.length} {g.reservedBadge.toLowerCase()}</p>
          </div>
        </div>
      ) : null}

      <Sheet
        open={editing !== null}
        title={editing === "new" ? g.newGift : g.edit}
        onClose={() => setEditing(null)}
        closeLabel={t.common.close}
        footer={
          <>
            <button className="btn btn-secondary" type="button" onClick={() => setEditing(null)}>{t.common.cancel}</button>
            <button className="btn btn-primary" type="button" disabled={saving} onClick={save}>{saving ? t.common.loading : t.common.save}</button>
          </>
        }
      >
        {preview ? (
          <div className="notice sage">
            <strong>{g.importReview}</strong>
            {!preview.priceFoundOnPage ? <div>{g.priceMissing}</div> : null}
            {preview.aiUsed ? <div><Sparkles size={13} /> {g.aiUsed}</div> : null}
          </div>
        ) : null}
        <div className="row-start" style={{ alignItems: "flex-start" }}>
          <div className="thumb" style={{ width: 88, height: 88 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {draft.imageUrl ? <img src={draft.imageUrl} alt="" /> : <Gift size={26} />}
          </div>
          <label className="field" style={{ flex: 1 }}>
            {g.fields.title} *
            <input value={draft.title} onChange={(event) => set("title", event.target.value)} autoFocus />
          </label>
        </div>
        <label className="field">{g.fields.description}<textarea value={draft.description} onChange={(event) => set("description", event.target.value)} style={{ minHeight: 80 }} /></label>
        <div className="form-grid">
          <label className="field">{g.fields.url}<input type="url" value={draft.url} onChange={(event) => set("url", event.target.value)} placeholder="https://" /></label>
          <label className="field">{g.fields.imageUrl}<input value={draft.imageUrl} onChange={(event) => set("imageUrl", event.target.value)} placeholder="https://" /></label>
          <label className="field">{g.fields.price}<input inputMode="decimal" value={draft.price} onChange={(event) => set("price", event.target.value)} placeholder="0.00" /></label>
          <label className="field">{g.fields.currency}
            <select value={draft.currency} onChange={(event) => set("currency", event.target.value as Draft["currency"])}>
              {currencies.map((currency) => <option key={currency}>{currency}</option>)}
            </select>
          </label>
          <label className="field">{g.fields.category}<input value={draft.category} onChange={(event) => set("category", event.target.value)} /></label>
          <label className="field">{g.fields.priority}
            <select value={draft.priority} onChange={(event) => set("priority", event.target.value as Draft["priority"])}>
              {(["high", "medium", "low"] as const).map((value) => <option key={value} value={value}>{t.priority[value]}</option>)}
            </select>
          </label>
          <label className="field">{g.fields.kind}
            <select value={draft.itemKind} onChange={(event) => set("itemKind", event.target.value as Draft["itemKind"])}>
              <option value="product">{g.kindProduct}</option>
              <option value="experience">{g.kindExperience}</option>
            </select>
          </label>
          <label className="field">{g.fields.quantity}<input type="number" min={1} max={99} value={draft.quantity} onChange={(event) => set("quantity", event.target.value)} /></label>
        </div>
        <label className="switch">
          <span>{g.fields.groupGift}</span>
          <input type="checkbox" checked={draft.isGroupGift} onChange={(event) => set("isGroupGift", event.target.checked)} />
        </label>
        {draft.isGroupGift ? (
          <label className="field">{g.fields.target}<input inputMode="decimal" value={draft.target} onChange={(event) => set("target", event.target.value)} placeholder={draft.price || "0.00"} /></label>
        ) : null}
        {formError ? <p className="form-error">{formError}</p> : null}
      </Sheet>

      <Sheet
        open={ideas !== null}
        title={a.ideasSheet}
        onClose={() => setIdeas(null)}
        closeLabel={t.common.close}
        footer={
          <>
            <button className="btn btn-secondary" type="button" onClick={() => setIdeas(null)}>{t.common.cancel}</button>
            <button className="btn btn-primary" type="button" disabled={adding || picked.size === 0} onClick={addIdeas}>
              {adding ? t.common.loading : <><Plus size={16} /> {a.addSelected} ({picked.size})</>}
            </button>
          </>
        }
      >
        <p className="muted small" style={{ margin: 0 }}>{a.ideasHint}</p>
        {ideas?.length === 0 ? <p className="muted">{a.none}</p> : null}
        <div className="ai-pick-list">
          {ideas?.map((idea, index) => (
            <label className="ai-pick" key={`${idea.title}-${index}`}>
              <input type="checkbox" checked={picked.has(index)} onChange={() => togglePick(index)} />
              <span className="ai-pick-body">
                <span className="ai-pick-title">{idea.title}</span>
                <span className="ai-pick-sub" style={{ display: "block" }}>{idea.description}</span>
                <span className="ai-pick-meta">
                  {idea.category ? <span className="badge">{idea.category}</span> : null}
                  {idea.itemKind === "experience" ? <span className="badge badge-outline">{g.kindExperience}</span> : null}
                </span>
              </span>
            </label>
          ))}
        </div>
        <AiDemoNote ctx={ctx} />
      </Sheet>
    </div>
  );
}
