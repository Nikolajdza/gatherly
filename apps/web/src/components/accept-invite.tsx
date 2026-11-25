"use client";

import type { InviteJoinResult, InvitePreview } from "@gatherly/shared";
import { Check, LogIn, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { browserApi } from "@/lib/api";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { coverFor } from "@/lib/template-media";

function destinationHref(locale: Locale, result: InviteJoinResult) {
  if (result.destination === "studio") return `/${locale}/dashboard/experiences/${result.experienceId}`;
  return `/${locale}/e/${result.slug}`;
}

export function AcceptInvite({ locale, token, dictionary: t, signedIn }: { locale: Locale; token: string; dictionary: Dictionary; signedIn: boolean }) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const i = t.invite;

  useEffect(() => {
    browserApi()
      .invitations.preview(token)
      .then((result) => {
        setPreview(result);
        if (result.emailHint) setEmail(result.emailHint);
        const open = result.status === "pending" || result.status === "accepted";
        setState(open ? "ready" : "invalid");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function go(result: InviteJoinResult) {
    router.push(destinationHref(locale, result));
    router.refresh();
  }

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const result = await browserApi().invitations.accept({ token });
      await go(result);
    } catch {
      setError(i.invalid);
      setBusy(false);
    }
  }

  async function claim(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await browserApi().invitations.claim({
        token,
        displayName: displayName.trim(),
        email: email.trim(),
      });
      if (result.session) {
        const supabase = createBrowserSupabase();
        if (supabase) {
          await supabase.auth.setSession({
            access_token: result.session.accessToken,
            refresh_token: result.session.refreshToken,
          });
        }
        await go(result);
        return;
      }
      if (result.needsSignIn) {
        router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/invite/${token}`)}`);
        return;
      }
      await go(result);
    } catch {
      setError(i.invalid);
      setBusy(false);
    }
  }

  const alreadyAccepted = preview?.status === "accepted";

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
          <h1 className="serif">{alreadyAccepted ? i.reopenTitle : i.title}</h1>
          <p className="muted" style={{ margin: 0 }}>{alreadyAccepted ? i.reopenLede : i.lede}</p>
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
            <button className="btn btn-primary btn-lg btn-block" type="button" disabled={busy} onClick={accept}>
              <Check size={17} /> {alreadyAccepted ? i.openExperience : i.accept}
            </button>
          ) : alreadyAccepted ? (
            <>
              <p className="small muted" style={{ margin: 0 }}>{i.reopenSignIn}</p>
              <Link className="btn btn-primary btn-lg btn-block" href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/invite/${token}`)}`}>
                <LogIn size={17} /> {i.signIn}
              </Link>
            </>
          ) : (
            <form className="stack" onSubmit={claim}>
              <p className="small muted" style={{ margin: 0 }}>{i.guestLede}</p>
              <label className="field">
                {i.guestName}
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} autoComplete="name" />
              </label>
              <label className="field">
                {i.guestEmail}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  maxLength={200}
                  autoComplete="email"
                  readOnly={Boolean(preview.emailRestricted && preview.emailHint)}
                />
              </label>
              <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy || !displayName.trim() || !email.trim()}>
                <Check size={17} /> {i.joinAsGuest}
              </button>
              <p className="small muted" style={{ margin: 0, textAlign: "center" }}>
                {i.haveAccount}{" "}
                <Link className="link" href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/invite/${token}`)}`}>{i.signIn}</Link>
              </p>
            </form>
          )}
          {error ? <p className="form-error">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
