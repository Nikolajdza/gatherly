"use client";

import type { ExperienceDetail, PublicItem, SecretSantaView, TaskRecord } from "@gatherly/shared";
import {
  CalendarDays,
  Check,
  ExternalLink,
  Gift,
  HandCoins,
  LayoutDashboard,
  Lock,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Countdown } from "@/components/experience/countdown";
import { Decorations } from "@/components/experience/decorations";
import { LanguageMenu } from "@/components/language-menu";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatPrice, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BackendError, type StudioBackend } from "@/lib/studio/backend";
import { coverFor } from "@/lib/template-media";
import { headlineFor, themeFor, themeStyle, welcomeFor } from "@/lib/theme";

type Props = {
  locale: Locale;
  t: Dictionary;
  experience: ExperienceDetail;
  backend: StudioBackend | null;
  signedIn: boolean;
  currentUserId: string | null;
  adminHref?: string | null;
  preview?: boolean;
};

export function PublicExperience({ locale, t, experience: initial, backend, signedIn, currentUserId, adminHref, preview }: Props) {
  const toast = useToast();
  const [experience, setExperience] = useState(initial);
  const [filter, setFilter] = useState<string>("all");
  const [reserving, setReserving] = useState<PublicItem | null>(null);
  const [pledging, setPledging] = useState<PublicItem | null>(null);
  const [amount, setAmount] = useState("20");
  const [busy, setBusy] = useState(false);
  const [santa, setSanta] = useState<SecretSantaView | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[] | null>(null);
  const p = t.publicPage;

  useEffect(() => setExperience(initial), [initial]);

  useEffect(() => {
    if (!backend || preview) return;
    if (experience.type === "secret_santa") backend.getSanta().then(setSanta).catch(() => setSanta(null));
    if (experience.type === "task_list") backend.listTasks().then(setTasks).catch(() => setTasks(null));
    // Initial load per experience only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend, experience.id, experience.type, preview]);

  const theme = themeFor(experience.template, experience.themeConfig);
  const config = experience.config as Record<string, unknown>;
  const headline = headlineFor(experience.template, experience.title, config);
  const welcome = welcomeFor(experience.description, config);
  const story = typeof config.story === "string" ? config.story : "";
  const showCountdown = experience.eventDate && config.showCountdown !== false && new Date(experience.eventDate).getTime() > Date.now() - 86_400_000;
  const templateName = t.templates[experience.template as keyof Dictionary["templates"]] ?? experience.template;

  const categories = useMemo(
    () => [...new Set(experience.items.map((item) => item.category).filter((value): value is string => Boolean(value)))],
    [experience.items],
  );
  const shown = experience.items.filter((item) =>
    filter === "all" ? true : filter === "available" ? !item.reserved : item.category === filter,
  );
  const reservedCount = experience.items.filter((item) => item.reserved).length;

  async function refresh() {
    if (!backend) return;
    setExperience(await backend.getExperience());
  }

  function requireSignIn() {
    if (signedIn) return false;
    window.location.href = `/${locale}/login?next=${encodeURIComponent(window.location.pathname)}`;
    return true;
  }

  async function run(work: () => Promise<void>, success?: string) {
    setBusy(true);
    try {
      await work();
      if (success) toast(success);
    } catch (error) {
      toast(error instanceof BackendError && error.code === "CONFLICT" ? p.errorReserve : t.common.error, "error");
      await refresh().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: experience.title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast(t.common.copied);
  }

  return (
    <div className="xp" style={themeStyle(theme)} data-card={theme.card}>
      {preview ? null : (
        <nav className="xp-nav">
          <Link className="brand" href={`/${locale}`}><span className="brand-mark">G</span>Gatherly</Link>
          <div className="row-start">
            <LanguageMenu locale={locale} label={t.nav.language} tone="dark" />
            <button className="t-btn t-btn-light" type="button" onClick={share} style={{ minHeight: 38 }}>
              <Share2 size={16} /> <span className="hide-sm">{p.share}</span>
            </button>
          </div>
        </nav>
      )}

      <header className="xp-hero" style={preview ? { minHeight: 440 } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverFor(experience.template, experience.coverImageUrl)} alt="" />
        <div className="xp-hero-inner" style={preview ? { padding: "80px 0 36px" } : undefined}>
          <span className="xp-kicker">{templateName}{experience.eventDate ? ` · ${formatDate(locale, experience.eventDate)}` : ""}</span>
          <h1 className="xp-title t-heading" style={preview ? { fontSize: "clamp(42px, 5vw, 64px)" } : undefined}>{headline.title}</h1>
          {headline.people ? <p className="xp-sub">{headline.people}</p> : null}
          <div className="xp-hero-meta">
            {experience.eventDate ? <span className="xp-chip"><CalendarDays size={16} /> {formatDate(locale, experience.eventDate)}</span> : null}
            {experience.type === "gift_registry" ? (
              <span className="xp-chip"><Gift size={16} /> {experience.items.length} · {reservedCount} {p.reserved.toLowerCase()}</span>
            ) : null}
            {experience.type === "secret_santa" && santa ? (
              <span className="xp-chip"><Users size={16} /> {santa.participants.length} {p.santaParticipants}</span>
            ) : null}
            {experience.type === "gift_registry" ? (
              <a className="xp-chip" href="#gifts" style={{ background: "var(--t-primary)", color: "var(--t-bg)" }}>{p.giftsTitle} ↓</a>
            ) : null}
          </div>
        </div>
      </header>

      <Decorations theme={theme} />

      {welcome || showCountdown ? (
        <section className="xp-section xp-intro">
          <div>
            <p className="xp-eyebrow">{p.welcome}</p>
            <h2 className="xp-h2 t-heading">{headline.title}</h2>
            {welcome ? <p>{welcome}</p> : null}
          </div>
          {showCountdown && experience.eventDate ? (
            <div>
              <p className="xp-eyebrow" style={{ marginBottom: 14 }}>{p.countdownTitle}</p>
              <Countdown date={experience.eventDate} labels={{ days: p.days, hours: p.hours, minutes: p.minutes, seconds: p.seconds }} />
            </div>
          ) : story ? null : <div />}
        </section>
      ) : null}

      {story ? (
        <section className="xp-section" style={{ paddingTop: 0 }}>
          <div className="xp-panel" style={{ maxWidth: 760 }}>
            <p className="xp-eyebrow">{p.ourStory}</p>
            <p className="t-heading" style={{ fontSize: "clamp(22px, 2.4vw, 30px)", lineHeight: 1.35, margin: "12px 0 0" }}>{story}</p>
          </div>
        </section>
      ) : null}

      {experience.type === "gift_registry" ? (
        <section className="xp-section" id="gifts" style={{ paddingTop: welcome ? 0 : undefined }}>
          <p className="xp-eyebrow">{p.giftsTitle}</p>
          <h2 className="xp-h2 t-heading">{p.giftsLede}</h2>
          {experience.items.length > 0 ? (
            <div className="xp-filters" role="group">
              <button className="xp-filter" type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{p.filterAll}</button>
              <button className="xp-filter" type="button" aria-pressed={filter === "available"} onClick={() => setFilter("available")}>{p.filterAvailable}</button>
              {categories.map((category) => (
                <button className="xp-filter" type="button" key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>
              ))}
            </div>
          ) : (
            <p style={{ opacity: 0.7, marginTop: 24 }}>
              {experience.status === "draft" ? p.emptyDraft : p.emptyActive}
            </p>
          )}
          {signedIn && !preview && experience.items.some((item) => !item.reserved) ? (
            <p className="small" style={{ marginTop: 12, fontWeight: 650 }}>{p.guestCtaGifts}</p>
          ) : null}
          <div className="gift-grid">
            {shown.map((item) => (
              <GiftCard
                key={item.id}
                item={item}
                locale={locale}
                t={t}
                busy={busy || Boolean(preview)}
                onReserve={() => {
                  if (requireSignIn()) return;
                  setReserving(item);
                }}
                onCancel={() => {
                  const reservationId = item.reservation?.id;
                  if (!backend || !reservationId) return;
                  void run(async () => {
                    await backend.cancelReservation(reservationId);
                    await refresh();
                  });
                }}
                onPledge={() => {
                  if (requireSignIn()) return;
                  setPledging(item);
                }}
              />
            ))}
          </div>
          {!signedIn && !preview && experience.items.length > 0 ? (
            <p className="small" style={{ opacity: 0.65, marginTop: 20 }}>{p.signInHint}</p>
          ) : null}
          {experience.items.length > 0 ? (
            <p className="small" style={{ opacity: 0.55, marginTop: 16 }}>{p.privacyFeature}</p>
          ) : null}
        </section>
      ) : null}

      {experience.type === "secret_santa" ? (
        <SantaPanel locale={locale} t={t} santa={santa} backend={backend} signedIn={signedIn} preview={preview} onChange={setSanta} config={config} currentUserId={currentUserId} />
      ) : null}

      {experience.type === "task_list" ? (
        <TasksPanel t={t} tasks={tasks} backend={backend} preview={preview} onChange={setTasks} />
      ) : null}

      <footer className="xp-footer">
        <p className="script" style={{ margin: 0 }}>{p.madeWithLove}</p>
        <p className="t-heading" style={{ fontSize: 28, margin: "4px 0 22px" }}>{headline.title}</p>
        {preview ? null : experience.showWatermark ? (
          <Link className="small" href={`/${locale}`} style={{ opacity: 0.7, display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 650 }}>
            <Sparkles size={14} /> {p.poweredBy} · {p.createYours}
          </Link>
        ) : (
          <span className="small" style={{ opacity: 0.45 }}>{p.createYours}</span>
        )}
      </footer>

      {adminHref && !preview ? (
        <div className="xp-demo-note">
          <span>{backend?.mode === "demo" ? p.demoNotice : t.dash.publicPage}</span>
          <Link className="btn btn-light btn-sm" href={adminHref}><LayoutDashboard size={15} /> {t.pages.demo.adminView}</Link>
        </div>
      ) : null}

      <Sheet
        open={Boolean(reserving)}
        title={p.reserveTitle}
        onClose={() => setReserving(null)}
        closeLabel={t.common.close}
        footer={
          <>
            <button className="btn btn-secondary" type="button" onClick={() => setReserving(null)}>{t.common.cancel}</button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy}
              onClick={() => {
                const item = reserving;
                if (!item || !backend) return;
                void run(async () => {
                  await backend.reserve(item.id);
                  setReserving(null);
                  await refresh();
                }, p.reservedToast);
              }}
            >
              <Check size={16} /> {p.confirm}
            </button>
          </>
        }
      >
        {reserving ? (
          <div className="row-start" style={{ alignItems: "flex-start" }}>
            <div className="thumb" style={{ width: 84, height: 84 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {reserving.imageUrl ? <img src={reserving.imageUrl} alt="" /> : <Gift size={24} />}
            </div>
            <div className="stack-sm">
              <strong style={{ fontSize: 18 }}>{reserving.title}</strong>
              {reserving.priceCents !== null ? <span className="muted">{formatPrice(locale, reserving.priceCents, reserving.currency)}</span> : null}
              <p className="muted small" style={{ margin: 0, lineHeight: 1.6 }}>{p.reserveText}</p>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={Boolean(pledging)}
        title={p.pledge}
        onClose={() => setPledging(null)}
        closeLabel={t.common.close}
        footer={
          <>
            <button className="btn btn-secondary" type="button" onClick={() => setPledging(null)}>{t.common.cancel}</button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy || !(Number(amount) > 0)}
              onClick={() => {
                const item = pledging;
                if (!item || !backend) return;
                void run(async () => {
                  await backend.pledge(item.id, Math.round(Number(amount) * 100));
                  setPledging(null);
                  await refresh();
                }, p.pledgeThanks);
              }}
            >
              <HandCoins size={16} /> {p.pledge}
            </button>
          </>
        }
      >
        {pledging ? (
          <>
            <strong>{pledging.title}</strong>
            <Progress item={pledging} locale={locale} t={t} />
            <div className="segmented" role="group">
              {["10", "20", "50", "100"].map((value) => (
                <button key={value} type="button" aria-pressed={amount === value} onClick={() => setAmount(value)}>
                  {formatPrice(locale, Number(value) * 100, pledging.currency)}
                </button>
              ))}
            </div>
            <label className="field">
              {p.pledgeAmount}
              <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(",", "."))} />
            </label>
          </>
        ) : null}
      </Sheet>
    </div>
  );
}

function Progress({ item, locale, t }: { item: PublicItem; locale: Locale; t: Dictionary }) {
  const target = item.targetAmountCents ?? item.priceCents ?? 0;
  const percent = target > 0 ? Math.min(100, Math.round((item.pledgedCents / target) * 100)) : 0;
  return (
    <div className="stack-sm">
      <div className="progress" style={{ background: "color-mix(in srgb, var(--t-accent, #b08948) 22%, white)" }}>
        <span style={{ width: `${percent}%`, background: "var(--t-primary, #7a3040)" }} />
      </div>
      <span className="small" style={{ opacity: 0.75 }}>
        {formatPrice(locale, item.pledgedCents, item.currency)} {t.publicPage.of} {formatPrice(locale, target, item.currency)} · {percent}%
      </span>
    </div>
  );
}

function GiftCard({
  item,
  locale,
  t,
  busy,
  onReserve,
  onCancel,
  onPledge,
}: {
  item: PublicItem;
  locale: Locale;
  t: Dictionary;
  busy: boolean;
  onReserve: () => void;
  onCancel: () => void;
  onPledge: () => void;
}) {
  const p = t.publicPage;
  const mine = Boolean(item.reservation?.mine);
  return (
    <article className="gift-card">
      <div className="gift-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : <Gift size={40} strokeWidth={1.2} style={{ opacity: 0.5 }} />}
        {item.isGroupGift ? <span className="badge"><Users size={12} /> {p.groupGift}</span> : item.priority === "high" ? <span className="badge">{t.priority.high}</span> : null}
        {item.reserved && !item.isGroupGift ? (
          <div className="taken"><span><Lock size={13} /> {mine ? p.reservedByYou : p.reserved}</span></div>
        ) : null}
      </div>
      <div className="gift-body">
        {item.category ? <span className="small" style={{ opacity: 0.6, fontWeight: 700 }}>{item.category}</span> : null}
        <h3 className="t-heading">{item.title}</h3>
        {item.description ? <p>{item.description}</p> : null}
        {item.priceCents !== null && !item.isGroupGift ? <span className="gift-price">{formatPrice(locale, item.priceCents, item.currency)}</span> : null}
        {item.isGroupGift ? <Progress item={item} locale={locale} t={t} /> : null}
      </div>
      <div className="gift-foot">
        {item.isGroupGift ? (
          <button className="t-btn t-btn-primary" type="button" disabled={busy} onClick={onPledge}><HandCoins size={16} /> {p.pledge}</button>
        ) : mine ? (
          <button className="t-btn t-btn-outline" type="button" disabled={busy} onClick={onCancel}>{p.cancel}</button>
        ) : (
          <button className="t-btn t-btn-primary" type="button" disabled={busy || item.reserved} onClick={onReserve}>
            {item.reserved ? p.reserved : <><Gift size={16} /> {p.reserve}</>}
          </button>
        )}
        {item.url ? (
          <a className="t-btn t-btn-outline" href={item.url} target="_blank" rel="noopener noreferrer nofollow" aria-label={p.viewProduct}>
            <ExternalLink size={15} />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function SantaPanel({
  locale,
  t,
  santa,
  backend,
  signedIn,
  preview,
  onChange,
  config,
  currentUserId,
}: {
  locale: Locale;
  t: Dictionary;
  currentUserId: string | null;
  santa: SecretSantaView | null;
  backend: StudioBackend | null;
  signedIn: boolean;
  preview?: boolean;
  onChange: (value: SecretSantaView) => void;
  config: Record<string, unknown>;
}) {
  const s = t.studio.santa;
  const p = t.publicPage;
  const toast = useToast();
  const rules = typeof config.rules === "string" ? config.rules : "";
  const budget = santa?.budgetCents ?? (typeof config.budgetCents === "number" ? config.budgetCents : null);
  const currency = santa?.currency ?? (typeof config.currency === "string" ? config.currency : "EUR");
  const meId = santa?.viewerUserId || currentUserId;
  const me = santa?.participants.find((participant) => participant.userId === meId);
  const joined = Boolean(me);
  const locked = santa?.status === "locked";
  const [wishes, setWishes] = useState<Array<{ title: string; note: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWishes((me?.wishlist ?? []).map((wish) => ({ title: wish.title, note: wish.note })));
  }, [me?.wishlist]);

  return (
    <section className="xp-section">
      <p className="xp-eyebrow">{p.santaTitle}</p>
      <h2 className="xp-h2 t-heading">{p.santaText}</h2>
      <div className="santa-box" style={{ marginTop: 32 }}>
        <div className="xp-panel stack">
          <div className="row">
            <strong>{s.myMatch}</strong>
            {santa ? <span className="badge">{s.status[santa.status]}</span> : null}
          </div>
          {santa?.myAssignment ? (
            <div className="stack-sm">
              <span className="t-heading" style={{ fontSize: 48, lineHeight: 1 }}>{santa.myAssignment.displayName}</span>
              <span className="small" style={{ opacity: 0.7 }}>{s.privacy}</span>
              <strong style={{ marginTop: 10 }}>{s.theirWishes}</strong>
              {santa.myAssignment.wishlist.length ? (
                <ul className="checklist" style={{ marginTop: 0 }}>
                  {santa.myAssignment.wishlist.map((wish) => <li key={wish.title}><Gift size={16} /> {wish.title}{wish.note ? ` — ${wish.note}` : ""}</li>)}
                </ul>
              ) : <span className="small" style={{ opacity: 0.7 }}>{s.noWishes}</span>}
            </div>
          ) : (
            <p style={{ margin: 0, opacity: 0.75 }}>{s.myMatchHidden}</p>
          )}
          {!preview && santa && santa.status === "open" && !joined && backend && signedIn ? (
            <button className="t-btn t-btn-primary" type="button" onClick={() => backend.joinSanta().then(onChange).catch(() => toast(t.common.error, "error"))}>
              {p.santaJoin}
            </button>
          ) : null}
          {!signedIn && !preview ? (
            <Link className="t-btn t-btn-primary" href={`/${locale}/login`}>{t.invite.signIn}</Link>
          ) : null}
          {!preview && joined && backend ? (
            <div className="stack" style={{ marginTop: 8 }}>
              <strong>{s.wishlist}</strong>
              <p className="small" style={{ margin: 0, opacity: 0.75 }}>{s.wishlistLede}</p>
              {(me?.wishCount ?? 0) < 3 ? (
                <p className="small" style={{ margin: 0, fontWeight: 650 }}>{p.guestCtaWishes}</p>
              ) : null}
              {wishes.map((wish, index) => (
                <input
                  key={index}
                  className="input"
                  value={wish.title}
                  placeholder={s.wishTitle}
                  disabled={locked || saving}
                  onChange={(event) => setWishes(wishes.map((entry, position) => (position === index ? { ...entry, title: event.target.value } : entry)))}
                />
              ))}
              {!locked ? (
                <div className="row-start" style={{ flexWrap: "wrap" }}>
                  <button className="t-btn" type="button" onClick={() => setWishes([...wishes, { title: "", note: "" }])}>{s.wishAdd}</button>
                  <button
                    className="t-btn t-btn-primary"
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const next = await backend.saveWishlist(
                          wishes.filter((wish) => wish.title.trim()).map((wish) => ({ title: wish.title.trim(), note: wish.note })),
                        );
                        onChange(next);
                        toast(t.common.saved, "ok");
                      } catch {
                        toast(t.common.error, "error");
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {s.wishSave}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="xp-panel stack">
          <div className="grid-2" style={{ gap: 12 }}>
            <div><span className="small" style={{ opacity: 0.6 }}>{s.budget}</span><div className="t-heading" style={{ fontSize: 34 }}>{budget ? formatPrice(locale, budget, currency) : "—"}</div></div>
            <div><span className="small" style={{ opacity: 0.6 }}>{s.participants}</span><div className="t-heading" style={{ fontSize: 34 }}>{santa?.participants.length ?? "—"}</div></div>
            <div><span className="small" style={{ opacity: 0.6 }}>{s.drawDate}</span><div style={{ fontWeight: 700 }}>{formatDate(locale, santa?.drawDate ?? null) || "—"}</div></div>
            <div><span className="small" style={{ opacity: 0.6 }}>{s.deadline}</span><div style={{ fontWeight: 700 }}>{formatDate(locale, santa?.purchaseDeadline ?? null) || "—"}</div></div>
          </div>
          {santa?.participants.length ? (
            <div className="row-start" style={{ flexWrap: "wrap", gap: 6 }}>
              {santa.participants.map((participant) => (
                <span className="badge" key={participant.id} style={{ background: "color-mix(in srgb, var(--t-accent) 18%, white)", color: "var(--t-primary)" }}>{participant.displayName}</span>
              ))}
            </div>
          ) : null}
          {rules ? <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.6 }}>{rules}</p> : null}
        </div>
      </div>
    </section>
  );
}

function TasksPanel({
  t,
  tasks,
  backend,
  preview,
  onChange,
}: {
  t: Dictionary;
  tasks: TaskRecord[] | null;
  backend: StudioBackend | null;
  preview?: boolean;
  onChange: (value: TaskRecord[]) => void;
}) {
  const p = t.publicPage;
  if (!tasks) {
    return (
      <section className="xp-section">
        <p className="xp-eyebrow">{p.tasksTitle}</p>
        <p style={{ opacity: 0.7 }}>{t.invite.loginFirst}</p>
      </section>
    );
  }
  const done = tasks.filter((task) => task.status === "done").length;
  const groups = new Map<string, TaskRecord[]>();
  for (const task of tasks) {
    const key = task.category ?? "—";
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  return (
    <section className="xp-section">
      <p className="xp-eyebrow">{p.tasksTitle}</p>
      <h2 className="xp-h2 t-heading">{done}/{tasks.length} {p.tasksProgress}</h2>
      <div className="progress" style={{ margin: "22px 0 30px", background: "color-mix(in srgb, var(--t-accent) 22%, white)" }}>
        <span style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%`, background: "var(--t-primary)" }} />
      </div>
      <div className="grid-2">
        {[...groups.entries()].map(([category, list]) => (
          <div className="xp-panel" key={category}>
            <strong className="t-heading" style={{ fontSize: 26 }}>{category}</strong>
            <div style={{ marginTop: 8 }}>
              {list.map((task) => (
                <label className="xp-task" key={task.id} style={{ cursor: preview ? "default" : "pointer" }}>
                  <input
                    className="task-check"
                    type="checkbox"
                    checked={task.status === "done"}
                    disabled={preview || !backend}
                    onChange={async () => {
                      if (!backend) return;
                      const next = task.status === "done" ? "open" : "done";
                      onChange(tasks.map((entry) => (entry.id === task.id ? { ...entry, status: next } : entry)));
                      await backend.updateTask(task.id, { status: next }).catch(() => undefined);
                    }}
                  />
                  <span style={{ textDecoration: task.status === "done" ? "line-through" : undefined, opacity: task.status === "done" ? 0.55 : 1 }}>{task.title}</span>
                  <span className={`prio ${task.priority}`} style={{ marginLeft: "auto" }} />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
