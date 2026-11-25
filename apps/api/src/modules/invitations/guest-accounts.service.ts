import { randomBytes } from "node:crypto";
import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaService } from "../../database/prisma.service";

export type GuestProvisionResult =
  | {
      userId: string;
      email: string;
      accessToken: string;
      refreshToken: string;
    }
  | {
      userId: string;
      email: string;
      needsSignIn: true;
    };

@Injectable()
export class GuestAccountsService {
  private readonly logger = new Logger(GuestAccountsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private admin(): SupabaseClient {
    const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !serviceKey) {
      throw new ServiceUnavailableException({
        code: "AUTH_NOT_CONFIGURED",
        message: "Guest invitations are not configured.",
      });
    }
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /**
   * New guests get a confirmed auth user + session (no password form).
   * Existing accounts keep their password and must sign in once.
   */
  async provisionGuest(email: string, displayName: string): Promise<GuestProvisionResult> {
    const supabase = this.admin();
    const normalized = email.trim().toLowerCase();

    const existingId = await this.findUserId(normalized);
    if (existingId) {
      await supabase.auth.admin.updateUserById(existingId, {
        user_metadata: { full_name: displayName, display_name: displayName },
      });
      await this.prisma.profile.upsert({
        where: { id: existingId },
        create: { id: existingId, email: normalized, displayName },
        update: { displayName, email: normalized },
      });
      return { userId: existingId, email: normalized, needsSignIn: true };
    }

    const password = `Gy.${randomBytes(24).toString("base64url")}`;
    const created = await supabase.auth.admin.createUser({
      email: normalized,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName, display_name: displayName },
    });
    if (created.error || !created.data.user) {
      this.logger.warn(`createUser failed: ${created.error?.message ?? "unknown"}`);
      throw new ServiceUnavailableException({
        code: "GUEST_CREATE_FAILED",
        message: "Could not create a guest account for this invitation.",
      });
    }

    const userId = created.data.user.id;
    await this.prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId, email: normalized, displayName },
      update: { displayName, email: normalized },
    });

    const signedIn = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (signedIn.error || !signedIn.data.session) {
      this.logger.warn(`guest session failed: ${signedIn.error?.message ?? "no session"}`);
      return { userId, email: normalized, needsSignIn: true };
    }

    return {
      userId,
      email: normalized,
      accessToken: signedIn.data.session.access_token,
      refreshToken: signedIn.data.session.refresh_token,
    };
  }

  private async findUserId(email: string): Promise<string | null> {
    const profile = await this.prisma.profile.findUnique({ where: { email }, select: { id: true } });
    if (profile) return profile.id;

    const supabase = this.admin();
    const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (!listed.error && listed.data?.users) {
      const hit = listed.data.users.find((user) => user.email?.toLowerCase() === email);
      if (hit) return hit.id;
    }
    return null;
  }
}
