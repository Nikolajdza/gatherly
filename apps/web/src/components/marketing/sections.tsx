import {
  ArrowRight,
  Check,
  Gift,
  Globe2,
  LayoutDashboard,
  Link2,
  ListChecks,
  Palette,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Lock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { templateImages } from "@/lib/template-media";

type Props = { locale: Locale; t: Dictionary };

export function SectionHead({ eyebrow, title, lede, center }: { eyebrow: string; title: string; lede?: string; center?: boolean }) {
  return (
    <div className={`section-head ${center ? "center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="serif h2">{title}</h2>
      {lede ? <p className="lede">{lede}</p> : null}
    </div>
  );
}

export function Hero({ locale, t }: Props) {
  const h = t.hero;
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="reveal">
          <p className="eyebrow">{h.eyebrow}</p>
          <h1 className="serif hero-title">
            {h.titleA}
            <br />
            <em>{h.titleB}</em>
          </h1>
          <p className="lede">{h.lede}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" href={`/${locale}/register`}>
              {h.primary} <ArrowRight size={18} />
            </Link>
            <Link className="btn btn-secondary btn-lg" href={`/${locale}/demo`}>{h.secondary}</Link>
          </div>
          <div className="trust">
            <div className="avatar-stack" aria-hidden>
              <span style={{ background: "#7a3040" }}>A</span>
              <span style={{ background: "#5f7354" }}>M</span>
              <span style={{ background: "#b08948" }}>J</span>
              <span style={{ background: "#2b1f1a" }}>+</span>
            </div>
            {h.trust}
          </div>
        </div>
        <div className="hero-visual reveal reveal-2">
          <div className="hero-photo">
            <Image src="/images/hero.jpg" alt="" fill priority sizes="(min-width: 920px) 50vw, 100vw" />
          </div>
          <div className="float-card float-a">
            <div className="row">
              <span className="badge badge-wine">{h.cardBaby}</span>
              <Gift size={16} color="#7a3040" />
            </div>
            <p className="serif" style={{ fontSize: 26, margin: "10px 0 0", lineHeight: 1 }}>{h.cardBabyTitle}</p>
            <div className="countdown-mini">
              <div><b>42</b><small>{t.publicPage.days}</small></div>
              <div><b>18</b><small>{t.publicPage.hours}</small></div>
              <div><b>36</b><small>{t.publicPage.minutes}</small></div>
            </div>
          </div>
          <div className="float-card float-b delay">
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
          </div>
          <div className="float-card float-c">
            <div className="row" style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: 14 }}>{h.cardList}</strong>
              <span className="small muted">8/11 {h.cardDone}</span>
            </div>
            <div className="progress sage"><span style={{ width: "72%" }} /></div>
            <p className="small muted" style={{ margin: "12px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} color="#b08948" /> 24 {h.statGifts}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Strip({ t }: { t: Dictionary }) {
  const items = [...t.strip.items, ...t.strip.items];
  return (
    <section className="strip" aria-label={t.strip.title}>
      <p className="strip-title">{t.strip.title}</p>
      <div className="marquee" aria-hidden>
        {items.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
      </div>
    </section>
  );
}

export function Pillars({ locale, t }: Props) {
  const p = t.pillars;
  const cards = [
    { key: "gifts", image: "/images/baby-shower.jpg", icon: <Gift size={20} />, chip: "", data: p.gifts, href: `/${locale}/demo/baby-shower` },
    { key: "events", image: "/images/secret-santa.jpg", icon: <Users size={20} />, chip: "sage", data: p.events, href: `/${locale}/demo/secret-santa` },
    { key: "lists", image: "/images/lists.jpg", icon: <ListChecks size={20} />, chip: "gold", data: p.lists, href: `/${locale}/demo/travel` },
  ];
  return (
    <section className="section">
      <div className="container">
        <SectionHead eyebrow={p.eyebrow} title={p.title} lede={p.lede} />
        <div className="grid-3" style={{ marginTop: 48 }}>
          {cards.map((card) => (
            <article className="card pillar card-hover" key={card.key}>
              <div className="photo photo-zoom">
                <Image src={card.image} alt="" fill sizes="(min-width: 920px) 33vw, 100vw" />
              </div>
              <div className="pillar-body">
                <span className={`icon-chip ${card.chip}`}>{card.icon}</span>
                <h3 className="serif h3">{card.data.title}</h3>
                <p>{card.data.text}</p>
                <Link className="link" href={card.href} style={{ marginTop: 6 }}>
                  {p.cta} <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
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
        <div className="showcase">
          {cards.map((card) => (
            <article className={`show-card ${card.span}`} key={card.id}>
              <Image src={templateImages[card.id] ?? "/images/hero.jpg"} alt="" fill sizes="(min-width: 920px) 50vw, 100vw" />
              <div className="show-body">
                <span className="badge">{t.kinds.gift_registry}</span>
                <h3 className="serif h3">{t.templates[card.id]}</h3>
                <p>{t.templateBlurbs[card.id]}</p>
                <div className="show-links">
                  {card.demo ? (
                    <Link className="btn btn-light btn-sm" href={`/${locale}/demo/${card.id}`}>{s.open}</Link>
                  ) : null}
                  <Link className="btn btn-sm" style={{ color: "#fff", borderColor: "rgba(255,255,255,.5)" }} href={`/${locale}/dashboard/experiences/new?template=${card.id}`}>
                    {s.use}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowSteps({ t, compact }: { t: Dictionary; compact?: boolean }) {
  const h = t.how;
  return (
    <section className={compact ? "section-tight" : "section"} style={{ background: compact ? undefined : "rgba(255,253,250,.55)", borderBlock: compact ? undefined : "1px solid var(--line)" }}>
      <div className="container">
        {compact ? null : <SectionHead eyebrow={h.eyebrow} title={h.title} lede={h.lede} center />}
        <div className="steps">
          {h.steps.map((step, index) => (
            <div className="step card" key={step.title}>
              {index < h.steps.length - 1 ? <span className="step-line" aria-hidden /> : null}
              <span className="step-num">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
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
          <ul className="checklist">
            {a.points.map((point) => (
              <li key={point}><Check size={18} /> {point}</li>
            ))}
          </ul>
        </div>
        <div className="split-visual">
          <div className="card ai-mock" style={{ borderRadius: 30, boxShadow: "var(--shadow-lg)" }}>
            <div className="ai-url">
              <Link2 size={16} />
              <span>{a.url}</span>
              <span className="badge badge-wine" style={{ flex: "none" }}><Sparkles size={12} /> AI</span>
            </div>
            <div className="ai-result">
              <Image src="/images/products/stroller.jpg" alt="" width={120} height={120} />
              <div className="stack-sm" style={{ alignContent: "center" }}>
                <span className="badge badge-sage badge-dot" style={{ width: "fit-content" }}>{a.found}</span>
                <strong className="serif" style={{ fontSize: 26, lineHeight: 1.05 }}>{a.productTitle}</strong>
                <span className="small faint">{a.productMeta}</span>
                <span className="serif" style={{ fontSize: 34, color: "var(--wine)" }}>€450</span>
              </div>
            </div>
            <div className="stack-sm" style={{ marginTop: 16 }}>
              <div className="shimmer" style={{ height: 10, width: "90%" }} />
              <div className="shimmer" style={{ height: 10, width: "70%" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SantaSection({ locale, t }: Props) {
  const s = t.santa;
  return (
    <section className="section santa-section">
      <div className="snow" aria-hidden />
      <div className="container split" style={{ position: "relative" }}>
        <div>
          <SectionHead eyebrow={s.eyebrow} title={s.title} lede={s.lede} />
          <ul className="checklist">
            {s.points.map((point) => (
              <li key={point}><Check size={18} /> {point}</li>
            ))}
          </ul>
          <div style={{ marginTop: 32 }}>
            <Link className="btn btn-light btn-lg" href={`/${locale}/demo/secret-santa`}>
              {s.cta} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="split-visual">
          <div className="photo" style={{ aspectRatio: "4 / 3.2", borderRadius: 32 }}>
            <Image src="/images/secret-santa.jpg" alt="" fill sizes="(min-width: 920px) 50vw, 100vw" />
          </div>
          <div className="santa-card" style={{ position: "absolute", left: "-6%", bottom: "-10%", width: "min(330px, 80%)", background: "rgba(20,42,33,.86)" }}>
            <div className="row">
              <strong>{s.card.title}</strong>
              <span className="badge" style={{ background: "rgba(230,184,162,.2)", color: "#f0c9bf" }}><Lock size={12} /> {s.card.drawn}</span>
            </div>
            <div className="santa-match">
              <p className="small muted" style={{ margin: 0 }}>{s.card.giving}</p>
              <div className="row-start" style={{ marginTop: 10 }}>
                <span className="santa-avatar">M</span>
                <div>
                  <strong className="serif" style={{ fontSize: 30, display: "block", lineHeight: 1 }}>{t.hero.cardSantaName}</strong>
                  <span className="small muted">{s.card.budget} · €30</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          <ul className="checklist">
            {a.points.map((point) => (
              <li key={point}><Check size={18} /> {point}</li>
            ))}
          </ul>
          <div style={{ marginTop: 32 }}>
            <Link className="btn btn-dark btn-lg" href={`/${locale}/demo/baby-shower/admin`}>
              <LayoutDashboard size={18} /> {a.cta}
            </Link>
          </div>
        </div>
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
              <strong className="serif" style={{ fontSize: 24 }}>Welcome, little Mila</strong>
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
    { key: "themes", icon: <Palette size={20} />, chip: "" },
    { key: "collaborators", icon: <Users size={20} />, chip: "sage" },
    { key: "languages", icon: <Globe2 size={20} />, chip: "gold" },
    { key: "share", icon: <Share2 size={20} />, chip: "" },
    { key: "admin", icon: <LayoutDashboard size={20} />, chip: "ink" },
  ] as const;
  return (
    <section className={withHead ? "section" : "section-tight"} style={{ paddingTop: withHead ? undefined : 0 }}>
      <div className="container">
        {withHead ? <SectionHead eyebrow={f.eyebrow} title={f.title} lede={f.lede} center /> : null}
        <div className="features">
          {items.map((item) => (
            <article className="card feature card-hover" key={item.key}>
              <span className={`icon-chip ${item.chip}`}>{item.icon}</span>
              <h3>{f.items[item.key].title}</h3>
              <p>{f.items[item.key].text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq({ t }: { t: Dictionary }) {
  return (
    <section className="section">
      <div className="container-narrow">
        <SectionHead eyebrow={t.faq.eyebrow} title={t.faq.title} center />
        <div className="faq">
          {t.faq.items.map((item) => (
            <details key={item.q}>
              <summary>{item.q}<Plus size={20} /></summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBand({ locale, t }: Props) {
  return (
    <section className="section-tight">
      <div className="container">
        <div className="cta-band">
          <Image src="/images/together.jpg" alt="" fill sizes="100vw" />
          <p className="eyebrow">Gatherly</p>
          <h2 className="serif h2" style={{ maxWidth: 640 }}>{t.cta.title}</h2>
          <p className="lede">{t.cta.lede}</p>
          <div className="hero-actions">
            <Link className="btn btn-light btn-lg" href={`/${locale}/register`}>{t.cta.primary} <ArrowRight size={18} /></Link>
            <Link className="btn btn-lg" style={{ color: "#fff", borderColor: "rgba(255,255,255,.45)" }} href={`/${locale}/demo`}>{t.cta.secondary}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, lede, image }: { eyebrow: string; title: string; lede: string; image?: string }) {
  return (
    <section className="container">
      <div className={`page-hero ${image ? "with-image" : ""}`}>
        <div className="reveal">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="serif h1">{title}</h1>
          <p className="lede">{lede}</p>
        </div>
        {image ? (
          <div className="photo reveal reveal-2">
            <Image src={image} alt="" fill priority sizes="(min-width: 920px) 45vw, 100vw" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
