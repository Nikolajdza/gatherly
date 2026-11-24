"use client";

import type { InvitePreview } from "@gatherly/shared";
import { Check, LogIn, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { browserApi } from "@/lib/api";
import { coverFor } from "@/lib/template-media";

export function AcceptInvite({ locale, token, dictionary: t, signedIn }: { locale: Locale; token: string; dictionary: Dictionary; signedIn: boolean }) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const i = t.invite;

  useEffect(() => {
    browserApi()
      .invitations.preview(token)
      .then((result) => {
        setPreview(result);
        setState(result.status === "pending" ? "ready" : "invalid");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const result = await browserApi().invitations.accept({ token });
      router.push(`/${locale}/dashboard/experiences/${result.experienceId}`);
    } catch {
      setError(i.invalid);
      setBusy(false);
    }
  }

  return (
    <div className="auth-form" style={{ textAlign: "left" }}>
      {state === "loading" ? <div className="skeleton" style={{ height: 320 }} /> : null}
      {state === "invalid" ? (
        <div className="stack">
          <h1 className="serif">{i.title}</h1>
          <div className="notice wine">{i.invalid}</div>
          <Link className="btn btn-secondary" href={`/${locale}`}>{t.common.goHome}</Link>
        </div>
      ) : null}
      {state === "ready" && preview ? (
        <div className="stack">
          <span className="icon-chip"><MailCheck size={22} /></span>
          <h1 className="serif">{i.title}</h1>
          <p className="muted" style={{ margin: 0 }}>{i.lede}</p>
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="photo" style={{ borderRadius: 0, aspectRatio: "16 / 7" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverFor(preview.template)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="card-pad stack-sm">
              <span className="eyebrow plain" style={{ margin: 0 }}>{t.templates[preview.template as keyof Dictionary["templates"]] ?? preview.template}</span>
              <strong className="serif" style={{ fontSize: 30, lineHeight: 1.05 }}>{preview.experienceTitle}</strong>
              <div className="row-start small muted" style={{ gap: 14, flexWrap: "wrap" }}>
                <span>{i.role}: <b>{t.roles[preview.role]}</b></span>
                <span>{t.studio.people.expires} {formatDate(locale, preview.expiresAt, "short")}</span>
              </div>
            </div>
          </div>
          {signedIn ? (
            <button className="btn btn-primary btn-lg btn-block" type="button" disabled={busy} onClick={accept}><Check size={17} /> {i.accept}</button>
          ) : (
            <>
              <p className="small muted" style={{ margin: 0 }}>{i.loginFirst}</p>
              <Link className="btn btn-primary btn-lg btn-block" href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/invite/${token}`)}`}><LogIn size={17} /> {i.signIn}</Link>
            </>
          )}
          {error ? <p className="form-error">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
