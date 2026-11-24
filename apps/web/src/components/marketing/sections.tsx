import { templates } from "@gatherly/shared";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Gift,
  Globe2,
  LayoutDashboard,
  Link2,
  ListChecks,
  Lock,
  Palette,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Aurora, Float, NumberTicker, Reveal, Spotlight, Stagger, StaggerItem, Tilt } from "@/components/ui/fx";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { templateImages } from "@/lib/template-media";
import { SessionCta } from "./session-cta";

type Props = { locale: Locale; t: Dictionary };

export function SectionHead({ eyebrow, title, lede, center }: { eyebrow: string; title: string; lede?: string; center?: boolean }) {
  return (
    <Reveal className={`section-head ${center ? "center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="serif h2">{title}</h2>
      {lede ? <p className="lede">{lede}</p> : null}
    </Reveal>
  );
}

export function Hero({ locale, t }: Props) {
  const h = t.hero;
  return (
    <section className="hero hero-dark">
      <Aurora />
      <div className="container hero-grid">
        <div>
          <Reveal>
            <span className="pill-badge"><Sparkles size={14} /> {h.eyebrow}</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="serif hero-title">
              {h.titleA}
              <br />
              <span className="text-gradient">{h.titleB}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede">{h.lede}</p>
          </Reveal>
          <Reveal delay={0.24}>
            <SessionCta locale={locale} primary={h.primary} secondary={h.secondary} dashboard={t.nav.dashboard} secondaryHref={`/${locale}/demo`} />
          </Reveal>
          <Reveal delay={0.32}>
            <div className="trust">
              <div className="avatar-stack" aria-hidden>
                <span style={{ background: "linear-gradient(140deg,#b4566a,#7a3040)" }}>A</span>
                <span style={{ background: "linear-gradient(140deg,#8aa07d,#5f7354)" }}>M</span>
                <span style={{ background: "linear-gradient(140deg,#e2b66e,#b08948)" }}>J</span>
                <span style={{ background: "linear-gradient(140deg,#6b5aa8,#3d2f6e)" }}>+</span>
              </div>
              {h.trust}
            </div>
          </Reveal>
        </div>
        <div className="hero-visual">
          <Reveal delay={0.1} className="hero-frame-wrap">
            <Tilt className="hero-frame" max={5}>
              <div className="hero-photo">
                <Image src="/images/hero.jpg" alt="" fill priority sizes="(min-width: 920px) 50vw, 100vw" />
              </div>
              <span className="beam" aria-hidden />
            </Tilt>
          </Reveal>
          <Float className="float-card float-a" delay={0.4}>
            <div className="row">
              <span className="badge badge-wine">{h.cardBaby}</span>
              <Gift size={16} color="#b4566a" />
            </div>
            <p className="serif" style={{ fontSize: 24, margin: "10px 0 0", lineHeight: 1.05 }}>{h.cardBabyTitle}</p>
            <div className="countdown-mini">
              <div><b>42</b><small>{t.publicPage.days}</small></div>
              <div><b>18</b><small>{t.publicPage.hours}</small></div>
              <div><b>36</b><small>{t.publicPage.minutes}</small></div>
            </div>
          </Float>
          <Float className="float-card float-b" delay={0.7}>
            <div className="mini-gift">
              <Image src="/images/products/stroller.jpg" alt="" width={44} height={44} />
              <div style={{ flex: 1 }}>
                <strong>Urban stroller</strong>
                <small>€450</small>
              </div>
              <span className="badge badge-sage">{h.cardReserved}</span>
            </div>
            <div className="mini-gift">
              <Image src="/images/products/mobile.jpg" alt="" width={44} height={44} />
              <div style={{ flex: 1 }}>
                <strong>Cloud mobile</strong>
                <small>€38</small>
              </div>
              <span className="badge">{h.cardAvailable}</span>
            </div>
          </Float>
          <Float className="float-card float-c" delay={1}>
            <div className="row" style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: 14 }}>{h.cardList}</strong>
              <span className="small muted">8/11 {h.cardDone}</span>
            </div>
            <div className="progress sage"><span style={{ width: "72%" }} /></div>
            <p className="small muted" style={{ margin: "12px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} color="#b08948" /> 24 {h.statGifts}
            </p>
          </Float>
        </div>
      </div>
      <div className="container">
        <Reveal delay={0.2} className="hero-stats">
          <div><NumberTicker value={templates.length} className="hero-stat-num" /><span>{t.nav.templates}</span></div>
          <div><NumberTicker value={7} className="hero-stat-num" /><span>{t.features.items.languages.title}</span></div>
          <div><NumberTicker value={0} className="hero-stat-num" /><span>{t.features.items.reservations.title}</span></div>
          <div><span className="hero-stat-num">100%</span><span>{t.features.items.privacy.title}</span></div>
        </Reveal>
      </div>
    </section>
  );
}

export function Strip({ t }: { t: Dictionary }) {
  const items = [...t.strip.items, ...t.strip.items];
  return (
    <section className="strip" aria-label={t.strip.title}>
      <p className="strip-title">{t.strip.title}</p>
      <div className="marquee-mask">
        <div className="marquee" aria-hidden>
          {items.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
        </div>
      </div>
    </section>
  );
}

export function Pillars({ locale, t }: Props) {
  const p = t.pillars;
  const f = t.features.items;
  return (
    <section className="section">
      <div className="container">
        <SectionHead eyebrow={p.eyebrow} title={p.title} lede={p.lede} />
        <Stagger className="bento">
          <StaggerItem className="bento-a">
            <Link href={`/${locale}/demo/baby-shower`} className="bento-card bento-photo">
              <Image src="/images/baby-shower.jpg" alt="" fill sizes="(min-width: 920px) 60vw, 100vw" />
              <div className="bento-photo-body">
                <span className="icon-chip glass"><Gift size={20} /></span>
                <h3 className="serif">{p.gifts.title}</h3>
                <p>{p.gifts.text}</p>
                <span className="bento-link">{p.cta} <ArrowUpRight size={16} /></span>
              </div>
            </Link>
          </StaggerItem>
          <StaggerItem className="bento-b">
            <Link href={`/${locale}/demo/secret-santa`} className="bento-card bento-photo festive">
              <Image src="/images/secret-santa.jpg" alt="" fill sizes="(min-width: 920px) 40vw, 100vw" />
              <div className="bento-photo-body">
                <span className="icon-chip glass"><Users size={20} /></span>
                <h3 className="serif">{p.events.title}</h3>
                <p>{p.events.text}</p>
                <span className="bento-link">{p.cta} <ArrowUpRight size={16} /></span>
              </div>
            </Link>
          </StaggerItem>
          <StaggerItem className="bento-c">
            <Spotlight className="bento-card bento-plain">
              <span className="icon-chip gold"><ListChecks size={20} /></span>
              <h3 className="serif">{p.lists.title}</h3>
              <p>{p.lists.text}</p>
              <div className="bento-tasks" aria-hidden>
                {[true, true, false].map((done, index) => (
                  <div key={index} className={done ? "done" : ""}><i>{done ? <Check size={12} strokeWidth={3} /> : null}</i><span /></div>
                ))}
              </div>
              <Link className="bento-link dark" href={`/${locale}/demo/travel`}>{p.cta} <ArrowUpRight size={16} /></Link>
            </Spotlight>
          </StaggerItem>
          <StaggerItem className="bento-d">
            <div className="bento-card bento-stat">
              <NumberTicker value={7} className="bento-num" />
              <h3>{f.languages.title}</h3>
              <p>{f.languages.text}</p>
            </div>
          </StaggerItem>
          <StaggerItem className="bento-e">
            <div className="bento-card bento-dark">
              <span className="icon-chip glass"><ShieldCheck size={20} /></span>
              <h3>{f.privacy.title}</h3>
              <p>{f.privacy.text}</p>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

export function Showcase({ locale, t }: Props) {
  const s = t.showcase;
  const cards = [
    { id: "baby-shower", span: "span-7", demo: true },
    { id: "wedding", span: "span-5", demo: true },
    { id: "birthday", span: "span-4", demo: true },
    { id: "anniversary", span: "span-4", demo: false },
    { id: "housewarming", span: "span-4", demo: false },
  ] as const;
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <SectionHead eyebrow={s.eyebrow} title={s.title} lede={s.lede} />
        <Stagger className="showcase">
          {cards.map((card) => (
            <StaggerItem className={card.span} key={card.id}>
              <article className="show-card">
                <Image src={templateImages[card.id] ?? "/images/hero.jpg"} alt="" fill sizes="(min-width: 920px) 50vw, 100vw" />
                <div className="show-body">
                  <span className="badge">{t.kinds.gift_registry}</span>
                  <h3 className="serif h3">{t.templates[card.id]}</h3>
                  <p>{t.templateBlurbs[card.id]}</p>
                  <div className="show-links">
                    {card.demo ? (
                      <Link className="btn btn-light btn-sm" href={`/${locale}/demo/${card.id}`}>{s.open}</Link>
                    ) : null}
                    <Link className="btn btn-glass btn-sm" href={`/${locale}/dashboard/experiences/new?template=${card.id}`}>
                      {s.use} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function HowSteps({ t, compact }: { t: Dictionary; compact?: boolean }) {
  const h = t.how;
  return (
    <section className={compact ? "section-tight" : "section how-section"}>
      <div className="container">
        {compact ? null : <SectionHead eyebrow={h.eyebrow} title={h.title} lede={h.lede} center />}
        <Stagger className="steps">
          {h.steps.map((step, index) => (
            <StaggerItem key={step.title}>
              <Spotlight className="step card">
                <span className="step-num">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Spotlight>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function AiSection({ t }: { t: Dictionary }) {
  const a = t.ai;
  return (
    <section className="section">
      <div className="container split">
        <div>
          <SectionHead eyebrow={a.eyebrow} title={a.title} lede={a.lede} />
          <Reveal delay={0.1}>
            <ul className="checklist">
              {a.points.map((point) => (
                <li key={point}><span className="check-dot"><Check size={14} strokeWidth={3} /></span> {point}</li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="split-visual">
          <div className="ai-glow" aria-hidden />
          <div className="card ai-mock glass-card">
            <div className="ai-url">
              <Link2 size={16} />
              <span>{a.url}</span>
              <span className="ai-chip" style={{ flex: "none" }}><Sparkles size={12} /> AI</span>
            </div>
            <div className="ai-result">
              <Image src="/images/products/stroller.jpg" alt="" width={120} height={120} />
              <div className="stack-sm" style={{ alignContent: "center" }}>
                <span className="badge badge-sage badge-dot" style={{ width: "fit-content" }}>{a.found}</span>
                <strong className="serif" style={{ fontSize: 24, lineHeight: 1.1 }}>{a.productTitle}</strong>
                <span className="small faint">{a.productMeta}</span>
                <span className="serif text-gradient-warm" style={{ fontSize: 34 }}>€450</span>
              </div>
            </div>
            <div className="stack-sm" style={{ marginTop: 16 }}>
              <div className="shimmer" style={{ height: 10, width: "90%" }} />
              <div className="shimmer" style={{ height: 10, width: "70%" }} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function SantaSection({ locale, t }: Props) {
  const s = t.santa;
  return (
    <section className="section santa-section">
      <div className="snow" aria-hidden />
      <div className="santa-glow" aria-hidden />
      <div className="container split" style={{ position: "relative" }}>
        <div>
          <SectionHead eyebrow={s.eyebrow} title={s.title} lede={s.lede} />
          <Reveal delay={0.1}>
            <ul className="checklist">
              {s.points.map((point) => (
                <li key={point}><span className="check-dot"><Check size={14} strokeWidth={3} /></span> {point}</li>
              ))}
            </ul>
            <div style={{ marginTop: 32 }}>
              <Link className="btn btn-light btn-lg" href={`/${locale}/demo/secret-santa`}>
                {s.cta} <ArrowRight size={18} />
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="split-visual">
          <div className="photo" style={{ aspectRatio: "4 / 3.2", borderRadius: 32, boxShadow: "0 40px 100px rgba(0,0,0,.45)" }}>
            <Image src="/images/secret-santa.jpg" alt="" fill sizes="(min-width: 920px) 50vw, 100vw" />
          </div>
          <Float className="santa-card santa-float" delay={0.3} distance={8}>
            <div className="row">
              <strong>{s.card.title}</strong>
              <span className="badge" style={{ background: "rgba(230,184,162,.2)", color: "#f0c9bf" }}><Lock size={12} /> {s.card.drawn}</span>
            </div>
            <div className="santa-match">
              <p className="small muted" style={{ margin: 0 }}>{s.card.giving}</p>
              <div className="row-start" style={{ marginTop: 10 }}>
                <span className="santa-avatar">M</span>
                <div>
                  <strong className="serif" style={{ fontSize: 28, display: "block", lineHeight: 1 }}>{t.hero.cardSantaName}</strong>
                  <span className="small muted">{s.card.budget} · €30</span>
                </div>
              </div>
            </div>
          </Float>
        </Reveal>
      </div>
    </section>
  );
}

export function AdminSection({ locale, t }: Props) {
  const a = t.admin;
  return (
    <section className="section">
      <div className="container split reverse">
        <div>
          <SectionHead eyebrow={a.eyebrow} title={a.title} lede={a.lede} />
          <Reveal delay={0.1}>
            <ul className="checklist">
              {a.points.map((point) => (
                <li key={point}><span className="check-dot"><Check size={14} strokeWidth={3} /></span> {point}</li>
              ))}
            </ul>
            <div style={{ marginTop: 32 }}>
              <Link className="btn btn-dark btn-lg" href={`/${locale}/demo/baby-shower/admin`}>
                <LayoutDashboard size={18} /> {a.cta}
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <Tilt max={4}>
            <div className="admin-mock" aria-hidden>
              <aside>
                <b>Gatherly</b>
                <span className="on"><LayoutDashboard size={14} /> {t.studio.tabs.overview}</span>
                <span><Gift size={14} /> {t.studio.tabs.gifts}</span>
                <span><Users size={14} /> {t.studio.tabs.people}</span>
                <span><Palette size={14} /> {t.studio.tabs.design}</span>
                <span><Share2 size={14} /> {t.studio.tabs.share}</span>
              </aside>
              <main>
                <div className="row">
                  <strong className="serif" style={{ fontSize: 22 }}>Welcome, little Mila</strong>
                  <span className="badge badge-sage badge-dot">{t.status.active}</span>
                </div>
                <div className="mock-stats">
                  <div><span className="faint">{t.studio.overview.items}</span><b>24</b></div>
                  <div><span className="faint">{t.studio.overview.reserved}</span><b>17</b></div>
                  <div><span className="faint">{t.studio.overview.eventIn}</span><b>42</b></div>
                </div>
                <div className="progress"><span style={{ width: "71%" }} /></div>
                {[
                  ["/images/products/stroller.jpg", "Urban stroller", "€450", true],
                  ["/images/products/blanket.jpg", "Knit blanket & bunny", "€64", true],
                  ["/images/products/mobile.jpg", "Cloud mobile", "€38", false],
                ].map(([src, name, price, taken]) => (
                  <div className="mock-row" key={String(name)}>
                    <Image src={String(src)} alt="" width={34} height={34} />
                    <div><strong>{name}</strong><div className="faint">{price}</div></div>
                    <span className={`badge ${taken ? "badge-sage" : ""}`}>{taken ? t.hero.cardReserved : t.hero.cardAvailable}</span>
                  </div>
                ))}
              </main>
            </div>
          </Tilt>
        </Reveal>
      </div>
    </section>
  );
}

export function FeatureGrid({ t, withHead = true }: { t: Dictionary; withHead?: boolean }) {
  const f = t.features;
  const items = [
    { key: "privacy", icon: <ShieldCheck size={20} />, chip: "" },
    { key: "reservations", icon: <Lock size={20} />, chip: "sage" },
    { key: "ai", icon: <Sparkles size={20} />, chip: "gold" },
    { key: "themes", icon: <Palette size={20} />, chip: "violet" },
    { key: "collaborators", icon: <Users size={20} />, chip: "sage" },
    { key: "languages", icon: <Globe2 size={20} />, chip: "gold" },
    { key: "share", icon: <Share2 size={20} />, chip: "" },
    { key: "admin", icon: <LayoutDashboard size={20} />, chip: "ink" },
  ] as const;
  return (
    <section className={withHead ? "section" : "section-tight"} style={{ paddingTop: withHead ? undefined : 0 }}>
      <div className="container">
        {withHead ? <SectionHead eyebrow={f.eyebrow} title={f.title} lede={f.lede} center /> : null}
        <Stagger className="features">
          {items.map((item) => (
            <StaggerItem key={item.key}>
              <Spotlight className="card feature">
                <span className={`icon-chip ${item.chip}`}>{item.icon}</span>
                <h3>{f.items[item.key].title}</h3>
                <p>{f.items[item.key].text}</p>
              </Spotlight>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function Faq({ t }: { t: Dictionary }) {
  return (
    <section className="section">
      <div className="container-narrow">
        <SectionHead eyebrow={t.faq.eyebrow} title={t.faq.title} center />
        <Reveal className="faq" delay={0.1}>
          {t.faq.items.map((item) => (
            <details key={item.q}>
              <summary>{item.q}<span className="faq-icon"><Plus size={18} /></span></summary>
              <p>{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function CtaBand({ locale, t }: Props) {
  return (
    <section className="section-tight">
      <div className="container">
        <Reveal className="cta-band">
          <Aurora />
          <div className="cta-inner">
            <span className="pill-badge"><Sparkles size={14} /> Gatherly</span>
            <h2 className="serif h2" style={{ maxWidth: 720 }}>{t.cta.title}</h2>
            <p className="lede">{t.cta.lede}</p>
            <SessionCta locale={locale} primary={t.cta.primary} secondary={t.cta.secondary} dashboard={t.nav.dashboard} secondaryHref={`/${locale}/demo`} />
          </div>
          <div className="cta-art" aria-hidden>
            <Image src="/images/together.jpg" alt="" fill sizes="40vw" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, lede, image }: { eyebrow: string; title: string; lede: string; image?: string }) {
  return (
    <section className="container">
      <div className={`page-hero ${image ? "with-image" : ""}`}>
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="serif h1">{title}</h1>
          <p className="lede">{lede}</p>
        </Reveal>
        {image ? (
          <Reveal delay={0.1} className="photo page-hero-photo">
            <Image src={image} alt="" fill priority sizes="(min-width: 920px) 45vw, 100vw" />
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
