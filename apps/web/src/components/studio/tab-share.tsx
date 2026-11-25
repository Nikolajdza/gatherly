"use client";

import type { AiTone } from "@gatherly/shared";
import { Copy, Download, ExternalLink, Loader2, Mail, MessageCircleHeart, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { themeFor } from "@/lib/theme";
import { AiChip, AiDemoNote, ToneSelect, useAi } from "./ai-kit";
import type { StudioContext } from "./studio";

export function ShareTab({ ctx }: { ctx: StudioContext }) {
  const { t, experience } = ctx;
  const s = t.studio.share;
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const theme = themeFor(experience.template, experience.themeConfig);

  useEffect(() => {
    const full = `${window.location.origin}${ctx.publicHref}`;
    setUrl(full);
    QRCode.toDataURL(full, { width: 640, margin: 1, color: { dark: theme.primary, light: "#ffffff" } }).then(setQr).catch(() => setQr(null));
  }, [ctx.publicHref, theme.primary]);

  const a = t.studio.ai;
  const [tone, setTone] = useState<AiTone>("warm");
  const [custom, setCustom] = useState("");
  const ai = useAi(ctx);

  async function write() {
    const result = await ai.run(() => ctx.backend.aiMessage("share", tone, ctx.locale));
    if (result) setCustom(result.text);
  }

  const message = custom.trim() || `${s.message} ${experience.title}`;
  const encoded = encodeURIComponent(`${message} ${url}`);
  const channels = [
    { name: "WhatsApp", color: "#25d366", href: `https://wa.me/?text=${encoded}`, glyph: "W" },
    { name: "Telegram", color: "#229ed9", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`, glyph: <Send size={15} /> },
    { name: "Viber", color: "#7360f2", href: `viber://forward?text=${encoded}`, glyph: "V" },
    { name: "Email", color: "#7a3040", href: `mailto:?subject=${encodeURIComponent(experience.title)}&body=${encoded}`, glyph: <Mail size={15} /> },
  ];

  async function copy() {
    await navigator.clipboard.writeText(url);
    ctx.notify(s.copied);
  }

  return (
    <div className="studio-grid">
      <div className="stack">
        {experience.status === "draft" ? <div className="notice wine">{s.draftWarning}</div> : null}
        {experience.visibility === "private" ? <div className="notice">{s.privateWarning}</div> : null}
        <div className="card card-pad stack">
          <div>
            <h2 className="serif h3" style={{ margin: 0 }}>{s.title}</h2>
            <p className="muted small" style={{ margin: "4px 0 0" }}>{s.lede}</p>
          </div>
          <label className="field">
            {s.link}
            <div className="input-group">
              <input className="input" readOnly value={url} onFocus={(event) => event.target.select()} />
              <button className="btn btn-primary" type="button" onClick={copy}><Copy size={16} /> {s.copy}</button>
            </div>
          </label>
          <Link className="link" href={ctx.publicHref} target="_blank"><ExternalLink size={15} /> {s.open}</Link>
        </div>
        <div className="card card-pad stack">
          <h3 className="h4" style={{ margin: 0 }}>{s.channels}</h3>
          <div className="share-buttons">
            {channels.map((channel) => (
              <a key={channel.name} className="share-btn" href={channel.href} target="_blank" rel="noopener noreferrer">
                <i style={{ background: channel.color }}>{channel.glyph}</i> {channel.name}
              </a>
            ))}
          </div>
        </div>
        {ctx.canManage ? (
          <div className="card card-pad stack ai-card">
            <div className="card-title">
              <div className="row-start">
                <span className="icon-chip"><MessageCircleHeart size={20} /></span>
                <div>
                  <h3 className="h4" style={{ margin: 0 }}>{a.shareTitle}</h3>
                  <p className="muted small" style={{ margin: "4px 0 0" }}>{a.shareLede}</p>
                </div>
              </div>
              <AiChip t={t} />
            </div>
            <div className="row-start" style={{ flexWrap: "wrap" }}>
              <ToneSelect t={t} value={tone} onChange={setTone} />
              <button className="btn btn-primary" type="button" onClick={write} disabled={ai.busy}>
                {ai.busy ? <><Loader2 size={16} className="spin" /> {a.working}</> : <><Sparkles size={16} /> {custom ? a.regenerate : a.shareButton}</>}
              </button>
            </div>
            {custom ? (
              <>
                <label className="field">
                  <span className="sr-only">{a.shareTitle}</span>
                  <textarea value={custom} onChange={(event) => setCustom(event.target.value)} style={{ minHeight: 110 }} maxLength={1000} />
                </label>
                <p className="small faint" style={{ margin: 0 }}>{a.shareUsing}</p>
              </>
            ) : null}
            <AiDemoNote ctx={ctx} />
          </div>
        ) : null}
      </div>
      <div className="card card-pad stack sticky" style={{ textAlign: "center" }}>
        <h3 className="h4" style={{ margin: 0 }}>{s.qr}</h3>
        <div className="qr-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt={s.qr} /> : <div className="skeleton" style={{ width: 220, height: 220 }} />}
        </div>
        <p className="small muted" style={{ margin: 0 }}>{s.qrHint}</p>
        {qr ? (
          <div className="row-start" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            <a className="btn btn-secondary" href={qr} download={`${experience.slug}-qr.png`}><Download size={16} /> {s.download}</a>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                const win = window.open("", "_blank", "noopener,noreferrer,width=480,height=720");
                if (!win) return;
                win.document.write(`<!doctype html><html><head><title>${experience.title}</title>
<style>
  @page { size: A6; margin: 12mm; }
  body { margin: 0; font-family: Georgia, serif; color: #1a2e24; display: grid; place-items: center; min-height: 100vh; text-align: center; }
  img { width: 220px; height: 220px; }
  h1 { font-size: 22px; margin: 18px 0 8px; }
  p { margin: 0; opacity: .7; font-size: 13px; }
  .story { width: 1080px; max-width: 92vw; aspect-ratio: 9/16; display: grid; place-content: center; gap: 18px; border: 1px dashed #c5d5cb; border-radius: 24px; padding: 32px; box-sizing: border-box; }
</style></head><body>
  <div class="story">
    <div style="letter-spacing:.16em;text-transform:uppercase;font-size:11px;opacity:.55;">Gatherly</div>
    <h1>${experience.title.replaceAll("<", "&lt;")}</h1>
    <img src="${qr}" alt="QR" />
    <p>${s.printTitle}</p>
  </div>
  <script>setTimeout(() => window.print(), 250)</script>
</body></html>`);
                win.document.close();
              }}
            >
              {s.print}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
