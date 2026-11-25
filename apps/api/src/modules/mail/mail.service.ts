import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type MailPayload = {
  to: string;
  subject: string;
  headline: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  text: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled() {
    return Boolean(this.config.get<string>("RESEND_API_KEY")?.trim());
  }

  webOrigin() {
    return (this.config.get<string>("WEB_ORIGIN") || "https://gatherly-tau-five.vercel.app").replace(/\/$/, "");
  }

  async sendInvite(input: {
    to: string;
    experienceTitle: string;
    inviteUrl: string;
    inviterName?: string | null;
  }): Promise<boolean> {
    const who = input.inviterName?.trim() || "Someone";
    return this.dispatch({
      to: input.to,
      subject: `You're invited to ${input.experienceTitle}`,
      headline: "You're invited",
      bodyHtml: `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d564a;">
        <strong style="color:#1a2e24;">${escapeHtml(who)}</strong> invited you to
        <strong style="color:#1a2e24;">${escapeHtml(input.experienceTitle)}</strong>.
      </p>`,
      ctaLabel: "Open invitation",
      ctaUrl: input.inviteUrl,
      text: [
        `${who} invited you to join “${input.experienceTitle}” on Gatherly.`,
        "",
        `Open your invitation (you can reuse this link anytime): ${input.inviteUrl}`,
      ].join("\n"),
    });
  }

  async sendReservationNotice(input: {
    to: string;
    experienceTitle: string;
    itemTitle: string;
    experienceUrl: string;
  }): Promise<boolean> {
    return this.dispatch({
      to: input.to,
      subject: `A gift was reserved on ${input.experienceTitle}`,
      headline: "Gift reserved",
      bodyHtml: `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d564a;">
        Someone reserved <strong style="color:#1a2e24;">${escapeHtml(input.itemTitle)}</strong>
        on <strong style="color:#1a2e24;">${escapeHtml(input.experienceTitle)}</strong>.
        Their name stays private until you turn on thank-you mode.
      </p>`,
      ctaLabel: "Open experience",
      ctaUrl: input.experienceUrl,
      text: `Someone reserved “${input.itemTitle}” on “${input.experienceTitle}”. ${input.experienceUrl}`,
    });
  }

  async sendDrawReady(input: {
    to: string;
    experienceTitle: string;
    experienceUrl: string;
  }): Promise<boolean> {
    return this.dispatch({
      to: input.to,
      subject: `Your Secret Santa match is ready — ${input.experienceTitle}`,
      headline: "Names are drawn",
      bodyHtml: `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d564a;">
        The draw for <strong style="color:#1a2e24;">${escapeHtml(input.experienceTitle)}</strong> is ready.
        Open Gatherly to see who you are giving to — only you can see your match.
      </p>`,
      ctaLabel: "See your match",
      ctaUrl: input.experienceUrl,
      text: `The Secret Santa draw for “${input.experienceTitle}” is ready. See your match: ${input.experienceUrl}`,
    });
  }

  async sendPurchaseDeadline(input: {
    to: string;
    experienceTitle: string;
    deadline: string;
    experienceUrl: string;
  }): Promise<boolean> {
    return this.dispatch({
      to: input.to,
      subject: `Purchase reminder — ${input.experienceTitle}`,
      headline: "Gift deadline soon",
      bodyHtml: `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d564a;">
        Reminder: gifts for <strong style="color:#1a2e24;">${escapeHtml(input.experienceTitle)}</strong>
        should be ready by <strong style="color:#1a2e24;">${escapeHtml(input.deadline)}</strong>.
      </p>`,
      ctaLabel: "Open Secret Santa",
      ctaUrl: input.experienceUrl,
      text: `Reminder: purchase deadline for “${input.experienceTitle}” is ${input.deadline}. ${input.experienceUrl}`,
    });
  }

  async sendThankYou(input: {
    to: string;
    experienceTitle: string;
    note: string;
    experienceUrl: string;
  }): Promise<boolean> {
    return this.dispatch({
      to: input.to,
      subject: `Thank you — ${input.experienceTitle}`,
      headline: "Thank you",
      bodyHtml: `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d564a;white-space:pre-wrap;">${escapeHtml(input.note)}</p>`,
      ctaLabel: "Open page",
      ctaUrl: input.experienceUrl,
      text: `${input.note}\n\n${input.experienceUrl}`,
    });
  }

  private async dispatch(payload: MailPayload): Promise<boolean> {
    const apiKey = this.config.get<string>("RESEND_API_KEY")?.trim();
    if (!apiKey) {
      this.logger.debug("RESEND_API_KEY missing — skip email");
      return false;
    }

    const from =
      this.config.get<string>("RESEND_FROM")?.trim() || "Gatherly <onboarding@resend.dev>";
    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f3f7f4;font-family:Georgia,'Times New Roman',serif;color:#1a2e24;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #d7e5dc;">
        <tr><td style="padding:28px 28px 8px;background:linear-gradient(135deg,#0f2a22,#1a4a3a);color:#f4faf6;">
          <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;opacity:.75;">Gatherly</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;font-weight:600;">${escapeHtml(payload.headline)}</h1>
        </td></tr>
        <tr><td style="padding:24px 28px 28px;">
          ${payload.bodyHtml}
          <a href="${escapeAttr(payload.ctaUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#1f6b52;color:#fff;text-decoration:none;font-family:system-ui,sans-serif;font-size:15px;font-weight:650;">
            ${escapeHtml(payload.ctaLabel)}
          </a>
          <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#6d8578;word-break:break-all;">
            Or paste this link:<br/>${escapeHtml(payload.ctaUrl)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [payload.to],
          subject: payload.subject,
          text: payload.text,
          html,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`Resend failed (${response.status}): ${body.slice(0, 300)}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn(`Resend error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
