"use client";

import type { InviteRecord, MemberRecord } from "@gatherly/shared";
import { Copy, Mail, Send, UserMinus, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/i18n/config";
import type { StudioContext } from "./studio";

type InviteRole = "editor" | "participant" | "viewer";

function parseEmails(raw: string) {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.includes("@")),
    ),
  ];
}

export function PeopleTab({ ctx }: { ctx: StudioContext }) {
  const { t, backend, locale, experience } = ctx;
  const pp = t.studio.people;
  const [members, setMembers] = useState<MemberRecord[] | null>(null);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [role, setRole] = useState<InviteRole>("participant");
  const [email, setEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [days, setDays] = useState("14");
  const [link, setLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailAttempted, setEmailAttempted] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [people, pending] = await Promise.all([backend.listMembers(), backend.listInvites()]);
    setMembers(people);
    setInvites(pending.filter((invite) => invite.status === "pending"));
  }

  useEffect(() => {
    load().catch(ctx.fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend]);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setBulkSummary(null);
    try {
      const bulk = parseEmails(bulkEmails);
      const expiresInDays = Math.max(1, Math.min(90, Number(days) || 14));
      if (bulk.length > 1 || (bulk.length === 1 && !email.trim())) {
        const result = await backend.createInvitesBulk({ role, emails: bulk, expiresInDays });
        setBulkSummary(
          pp.bulkResult
            .replace("{created}", String(result.created))
            .replace("{emailed}", String(result.emailed)),
        );
        setLink(null);
        setBulkEmails("");
        await load();
        return;
      }
      const targetEmail = email.trim() || bulk[0] || null;
      const created = await backend.createInvite({
        role,
        email: targetEmail,
        expiresInDays,
      });
      setLink(`${window.location.origin}/${locale}${created.urlPath}`);
      setEmailSent(Boolean(created.emailSent));
      setEmailAttempted(Boolean(targetEmail));
      setEmail("");
      setBulkEmails("");
      await load();
    } catch (error) {
      ctx.fail(error);
    } finally {
      setBusy(false);
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    ctx.notify(t.common.copied);
  }

  const shareMessage = useMemo(() => {
    if (!link) return "";
    return `${pp.shareMessage} “${experience.title}” — ${link}`;
  }, [experience.title, link, pp.shareMessage]);

  const channels = link
    ? [
        {
          name: "WhatsApp",
          color: "#25d366",
          href: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
          glyph: "W",
        },
        {
          name: "Telegram",
          color: "#229ed9",
          href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareMessage)}`,
          glyph: <Send size={15} />,
        },
        {
          name: "Viber",
          color: "#7360f2",
          href: `viber://forward?text=${encodeURIComponent(shareMessage)}`,
          glyph: "V",
        },
        {
          name: "Email",
          color: "#1f6b52",
          href: `mailto:${email || ""}?subject=${encodeURIComponent(experience.title)}&body=${encodeURIComponent(shareMessage)}`,
          glyph: <Mail size={15} />,
        },
      ]
    : [];

  if (!members) return <div className="skeleton" style={{ height: 320 }} />;

  return (
    <div className="studio-grid">
      <div className="stack">
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-pad card-title" style={{ marginBottom: 0 }}>
            <div>
              <h2 className="serif h3">{pp.members}</h2>
              <p className="muted small" style={{ margin: "4px 0 0" }}>{pp.lede}</p>
            </div>
            <span className="badge">{members.length}</span>
          </div>
          <div className="list" style={{ borderTop: "1px solid var(--line)" }}>
            {members.map((member) => (
              <div className="list-row" key={member.id}>
                <span className="avatar">{member.displayName.slice(0, 1).toUpperCase()}</span>
                <div className="grow">
                  <div className="title">{member.displayName}{member.userId === ctx.experience.ownerId && ctx.isOwner ? <span className="faint"> · {pp.you}</span> : null}</div>
                  <div className="sub">{member.email}</div>
                </div>
                {member.role === "owner" || !ctx.isOwner ? (
                  <span className={`badge ${member.role === "owner" ? "badge-wine" : ""}`}>{t.roles[member.role]}</span>
                ) : (
                  <>
                    <select
                      className="input"
                      style={{ width: "auto", minHeight: 36 }}
                      value={member.role}
                      onChange={async (event) => {
                        const next = event.target.value as InviteRole;
                        setMembers(members.map((entry) => (entry.id === member.id ? { ...entry, role: next } : entry)));
                        await backend.updateMember(member.userId, next).catch(ctx.fail);
                      }}
                    >
                      {(["editor", "participant", "viewer"] as const).map((value) => <option key={value} value={value}>{t.roles[value]}</option>)}
                    </select>
                    <button className="icon-btn danger" type="button" aria-label={pp.remove} onClick={async () => {
                      if (!window.confirm(`${pp.remove}: ${member.displayName}?`)) return;
                      await backend.removeMember(member.userId).catch(ctx.fail);
                      await load();
                    }}><UserMinus size={16} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {invites.length ? (
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="card-pad card-title" style={{ marginBottom: 0 }}><h3 className="h4">{pp.pending}</h3><span className="badge badge-gold">{invites.length}</span></div>
            <div className="list" style={{ borderTop: "1px solid var(--line)" }}>
              {invites.map((entry) => (
                <div className="list-row" key={entry.id}>
                  <span className="icon-chip gold" style={{ width: 36, height: 36, borderRadius: 12 }}><Mail size={16} /></span>
                  <div className="grow">
                    <div className="title">{entry.email ?? t.visibility.unlisted}</div>
                    <div className="sub"><span>{t.roles[entry.role]}</span><span>{pp.expires} {formatDate(locale, entry.expiresAt, "short")}</span></div>
                  </div>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={async () => {
                    await backend.revokeInvite(entry.id).catch(ctx.fail);
                    await load();
                  }}><X size={14} /> {pp.revoke}</button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <form className="card card-pad stack sticky" onSubmit={invite}>
        <h3 className="h4" style={{ margin: 0 }}>{pp.invite}</h3>
        <div className="radio-cards">
          {(["editor", "participant", "viewer"] as const).map((value) => (
            <button key={value} type="button" className="radio-card" aria-pressed={role === value} onClick={() => setRole(value)} style={{ padding: 12 }}>
              <span className={`task-check`} style={{ borderRadius: "50%", background: role === value ? "var(--jade)" : "#fff", borderColor: role === value ? "var(--jade)" : undefined }} />
              <span><strong>{t.roles[value]}</strong><small>{pp.roleHelp[value]}</small></span>
            </button>
          ))}
        </div>
        <label className="field">
          {pp.inviteEmail}
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          <span className="field-hint">{pp.inviteEmailHint}</span>
        </label>
        <label className="field">
          {pp.bulkLabel}
          <textarea
            value={bulkEmails}
            onChange={(event) => setBulkEmails(event.target.value)}
            placeholder={pp.bulkPlaceholder}
            style={{ minHeight: 96 }}
          />
          <span className="field-hint">{pp.bulkHint}</span>
        </label>
        <label className="field">{pp.inviteDays}<input type="number" min={1} max={90} value={days} onChange={(event) => setDays(event.target.value)} /></label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {parseEmails(bulkEmails).length > 1 ? <><Users size={16} /> {pp.bulkSend}</> : <><Send size={16} /> {pp.invite}</>}
        </button>
        {bulkSummary ? <div className="notice sage small">{bulkSummary}</div> : null}
        {link ? (
          <div className="notice sage stack-sm">
            <span className="small">{emailSent ? pp.inviteEmailed : emailAttempted ? pp.inviteMailFailed : pp.inviteCreated}</span>
            <div className="input-group">
              <input className="input" readOnly value={link} onFocus={(event) => event.target.select()} />
              <button className="btn btn-secondary btn-icon" type="button" onClick={() => copy(link)} aria-label={t.common.copy}><Copy size={16} /></button>
            </div>
            <div>
              <p className="small" style={{ margin: "4px 0 10px", fontWeight: 650 }}>{pp.shareVia}</p>
              <div className="share-buttons">
                {channels.map((channel) => (
                  <a key={channel.name} className="share-btn" href={channel.href} target="_blank" rel="noopener noreferrer">
                    <i style={{ background: channel.color }}>{channel.glyph}</i> {channel.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
