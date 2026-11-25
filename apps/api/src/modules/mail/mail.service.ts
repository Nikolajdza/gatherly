import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled() {
    return Boolean(this.config.get<string>("RESEND_API_KEY")?.trim());
  }

  async sendInvite(input: {
    to: string;
    experienceTitle: string;
    inviteUrl: string;
    inviterName?: string | null;
  }): Promise<boolean> {
    const apiKey = this.config.get<string>("RESEND_API_KEY")?.trim();
    if (!apiKey) {
      this.logger.debug("RESEND_API_KEY missing — skip invite email");
      return false;
    }

    const from =
      this.config.get<string>("RESEND_FROM")?.trim() || "Gatherly <onboarding@resend.dev>";
    const who = input.inviterName?.trim() || "Someone";
    const subject = `You're invited to ${input.experienceTitle}`;
    const text = [
      `${who} invited you to join “${input.experienceTitle}” on Gatherly.`,
      "",
      `Open your invitation (you can reuse this link anytime to check the latest status): ${input.inviteUrl}`,
      "",
      "If you weren’t expecting this, you can ignore the email.",
    ].join("\n");
    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f3f7f4;font-family:Georgia,'Times New Roman',serif;color:#1a2e24;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #d7e5dc;">
        <tr><td style="padding:28px 28px 8px;background:linear-gradient(135deg,#0f2a22,#1a4a3a);color:#f4faf6;">
          <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;opacity:.75;">Gatherly</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;font-weight:600;">You're invited</h1>
        </td></tr>
        <tr><td style="padding:24px 28px 28px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d564a;">
            <strong style="color:#1a2e24;">${escapeHtml(who)}</strong> invited you to
            <strong style="color:#1a2e24;">${escapeHtml(input.experienceTitle)}</strong>.
          </p>
          <a href="${escapeAttr(input.inviteUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#1f6b52;color:#fff;text-decoration:none;font-family:system-ui,sans-serif;font-size:15px;font-weight:650;">
            Open invitation
          </a>
          <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#6d8578;word-break:break-all;">
            Or paste this link (reuse it anytime to see your match, gifts, or list):<br/>${escapeHtml(input.inviteUrl)}
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
        body: JSON.stringify({ from, to: [input.to], subject, text, html }),
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
