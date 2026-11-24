import { createHash, randomBytes } from "node:crypto";

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createInviteToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInviteToken(token) };
}

export function inviteIsUsable(invite: { status: string; expiresAt: Date }, now = new Date()): boolean {
  return invite.status === "pending" && invite.expiresAt.getTime() > now.getTime();
}
