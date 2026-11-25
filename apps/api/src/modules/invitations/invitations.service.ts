import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MemberRole } from "@gatherly/shared";
import { claimInviteSchema, createInviteSchema, createInvitesBulkSchema, sendThankYouSchema } from "@gatherly/shared";
import type { z } from "zod";
import { toJson } from "../../common/http";
import { PrismaService } from "../../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { MembershipsService } from "../memberships/memberships.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PermissionsService } from "../permissions/permissions.service";
import { GuestAccountsService } from "./guest-accounts.service";
import { createInviteToken, hashInviteToken } from "./tokens";

type CreateInviteInput = z.infer<typeof createInviteSchema>;
type CreateBulkInput = z.infer<typeof createInvitesBulkSchema>;
type ClaimInviteInput = z.infer<typeof claimInviteSchema>;
type SendThankYouInput = z.infer<typeof sendThankYouSchema>;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly memberships: MembershipsService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly guests: GuestAccountsService,
    private readonly config: ConfigService,
  ) {}

  async list(experienceId: string, userId: string) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    const invites = await this.prisma.experienceInvite.findMany({
      where: { experienceId },
      orderBy: { createdAt: "desc" },
    });
    return { items: invites.map((invite) => this.present(invite)) };
  }

  async create(experienceId: string, userId: string, input: CreateInviteInput) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    const { token, tokenHash } = createInviteToken();
    const expiresAt = new Date(Date.now() + (input.expiresInDays ?? 14) * 24 * 60 * 60 * 1000);
    const invite = await this.prisma.experienceInvite.create({
      data: {
        experienceId,
        tokenHash,
        role: input.role,
        email: input.email?.toLowerCase() ?? null,
        expiresAt,
        createdById: userId,
      },
    });

    const urlPath = `/invite/${token}`;
    let emailSent = false;
    if (invite.email && this.mail.enabled) {
      const [experience, profile] = await Promise.all([
        this.prisma.experience.findUnique({ where: { id: experienceId }, select: { title: true } }),
        this.prisma.profile.findUnique({ where: { id: userId }, select: { displayName: true, preferredLanguage: true } }),
      ]);
      const origin = (this.config.get<string>("WEB_ORIGIN") || "https://gatherly-tau-five.vercel.app").replace(/\/$/, "");
      const locale = profile?.preferredLanguage || "en";
      emailSent = await this.mail.sendInvite({
        to: invite.email,
        experienceTitle: experience?.title ?? "Gatherly",
        inviteUrl: `${origin}/${locale}${urlPath}`,
        inviterName: profile?.displayName,
      });
    }

    return { ...this.present(invite), token, urlPath, emailSent };
  }

  async createBulk(experienceId: string, userId: string, input: CreateBulkInput) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    const unique = [...new Set(input.emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
    const items = [];
    for (const email of unique) {
      items.push(await this.create(experienceId, userId, {
        role: input.role,
        email,
        expiresInDays: input.expiresInDays,
      }));
    }
    return {
      items,
      created: items.length,
      emailed: items.filter((item) => item.emailSent).length,
    };
  }

  async sendThankYou(experienceId: string, userId: string, input: SendThankYouInput) {
    await this.permissions.requireRole(experienceId, userId, ["owner"]);
    const experience = await this.prisma.experience.findUnique({ where: { id: experienceId } });
    if (!experience) throw new NotFoundException({ code: "NOT_FOUND", message: "Experience not found." });
    if (!experience.thankYouMode) {
      throw new BadRequestException({
        code: "THANK_YOU_OFF",
        message: "Turn on thank-you mode before sending notes.",
      });
    }

    const reservations = await this.prisma.itemReservation.findMany({
      where: {
        status: "active",
        item: { experienceId },
      },
      include: {
        user: { select: { email: true, displayName: true } },
        item: { select: { title: true } },
      },
    });

    const byEmail = new Map<string, { name: string; gifts: string[] }>();
    for (const reservation of reservations) {
      const email = reservation.user.email;
      if (!email || email.endsWith("@users.gatherly.invalid")) continue;
      const entry = byEmail.get(email) ?? { name: reservation.user.displayName, gifts: [] };
      entry.gifts.push(reservation.item.title);
      byEmail.set(email, entry);
    }

    if (input.onlyReserved && byEmail.size === 0) {
      return { sent: 0, recipients: 0 };
    }

    const url = `${this.mail.webOrigin()}/en/e/${experience.slug}`;
    let sent = 0;
    for (const [email, entry] of byEmail) {
      const personalNote = `${input.note.trim()}\n\n— ${entry.gifts.join(", ")}`;
      const ok = await this.mail.sendThankYou({
        to: email,
        experienceTitle: experience.title,
        note: personalNote,
        experienceUrl: url,
      });
      if (ok) sent += 1;
    }
    return { sent, recipients: byEmail.size };
  }

  async revoke(id: string, userId: string) {
    const invite = await this.prisma.experienceInvite.findUnique({ where: { id } });
    if (!invite) throw new NotFoundException({ code: "NOT_FOUND", message: "Invitation not found." });
    await this.permissions.requireRole(invite.experienceId, userId, ["owner", "editor"]);
    const updated = await this.prisma.experienceInvite.update({
      where: { id },
      data: { status: "revoked", revokedAt: new Date() },
    });
    return this.present(updated);
  }

  async preview(token: string) {
    const invite = await this.findByToken(token);
    const experience = await this.prisma.experience.findUnique({ where: { id: invite.experienceId } });
    if (!experience) throw new NotFoundException({ code: "NOT_FOUND", message: "Invitation not found." });
    const presented = this.present(invite);
    return {
      experienceTitle: experience.title,
      template: experience.template,
      experienceId: experience.id,
      slug: experience.slug,
      experienceType: experience.type,
      role: presented.role,
      status: presented.status,
      expiresAt: invite.expiresAt.toISOString(),
      emailRestricted: Boolean(invite.email),
      emailHint: invite.email,
    };
  }

  async accept(userId: string, email: string, token: string) {
    return this.finalizeJoin(userId, email, token);
  }

  async claim(input: ClaimInviteInput) {
    const invite = await this.findByToken(input.token);
    this.assertInviteOpenForClaim(invite);

    const email = input.email.trim().toLowerCase();
    if (invite.email && invite.email.toLowerCase() !== email) {
      throw new BadRequestException({
        code: "INVITE_EMAIL_MISMATCH",
        message: "This invitation is limited to a different email address.",
      });
    }

    const provisioned = await this.guests.provisionGuest(email, input.displayName.trim());
    const joined = await this.finalizeJoin(provisioned.userId, email, input.token);

    if ("needsSignIn" in provisioned) {
      return { ...joined, needsSignIn: true as const, session: null };
    }

    return {
      ...joined,
      needsSignIn: false as const,
      session: {
        accessToken: provisioned.accessToken,
        refreshToken: provisioned.refreshToken,
      },
    };
  }

  private async finalizeJoin(userId: string, email: string, token: string) {
    const invite = await this.findByToken(token);
    if (invite.status === "revoked") {
      throw new BadRequestException({ code: "INVITE_REVOKED", message: "This invitation has been revoked." });
    }

    if (invite.status === "pending" && invite.expiresAt.getTime() <= Date.now()) {
      await this.prisma.experienceInvite.update({ where: { id: invite.id }, data: { status: "expired" } });
      throw new BadRequestException({ code: "INVITE_EXPIRED", message: "This invitation has expired." });
    }

    if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException({
        code: "INVITE_EMAIL_MISMATCH",
        message: "This invitation is limited to a different email address.",
      });
    }

    // Same guest reopening the invite link anytime after accept.
    if (invite.status === "accepted" && invite.acceptedById === userId) {
      await this.memberships.grant(invite.experienceId, userId, invite.role);
      await this.ensureParticipation(invite.experienceId, userId, invite.role);
      return this.joinResult(invite.experienceId, invite.role);
    }

    if (invite.status === "accepted") {
      throw new BadRequestException({
        code: "INVITE_CLOSED",
        message: "This invitation was already used by someone else.",
      });
    }

    if (invite.status !== "pending") {
      throw new BadRequestException({ code: "INVITE_CLOSED", message: "This invitation can no longer be used." });
    }

    await this.prisma.experienceInvite.update({
      where: { id: invite.id },
      data: { status: "accepted", acceptedById: userId },
    });
    await this.memberships.grant(invite.experienceId, userId, invite.role);
    await this.ensureParticipation(invite.experienceId, userId, invite.role);

    const experience = await this.prisma.experience.findUnique({ where: { id: invite.experienceId } });
    if (experience && experience.ownerId !== userId) {
      await this.notifications.create(experience.ownerId, experience.id, "invitation_accepted", {
        experienceId: experience.id,
        title: experience.title,
      });
    }

    return this.joinResult(invite.experienceId, invite.role);
  }

  private async ensureParticipation(experienceId: string, userId: string, role: MemberRole) {
    if (role === "viewer") return;
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
      select: { type: true },
    });
    if (experience?.type !== "secret_santa") return;

    const draw = await this.prisma.secretSantaDraw.findUnique({ where: { experienceId } });
    if (!draw || draw.status !== "open") return;

    await this.prisma.secretSantaParticipant.upsert({
      where: { drawId_userId: { drawId: draw.id, userId } },
      create: { drawId: draw.id, userId, wishlist: toJson({ items: [] }) },
      update: {},
    });
  }

  private async joinResult(experienceId: string, role: MemberRole) {
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
      select: { slug: true },
    });
    if (!experience) throw new NotFoundException({ code: "NOT_FOUND", message: "Experience not found." });
    const normalizedRole = role === "owner" ? "participant" : role;
    return {
      experienceId,
      slug: experience.slug,
      role: normalizedRole as MemberRole,
      destination: (normalizedRole === "editor" ? "studio" : "public") as "studio" | "public",
    };
  }

  private assertInviteOpenForClaim(invite: { status: string; expiresAt: Date; acceptedById: string | null }) {
    if (invite.status === "revoked") {
      throw new BadRequestException({ code: "INVITE_REVOKED", message: "This invitation has been revoked." });
    }
    if (invite.status === "pending" && invite.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException({ code: "INVITE_EXPIRED", message: "This invitation has expired." });
    }
    if (invite.status === "accepted") {
      // Claim is for first-time guests; reopen goes through accept while signed in.
      throw new BadRequestException({
        code: "INVITE_ALREADY_ACCEPTED",
        message: "This invitation was already accepted. Sign in with the same email to reopen it.",
      });
    }
    if (invite.status !== "pending") {
      throw new BadRequestException({ code: "INVITE_CLOSED", message: "This invitation can no longer be used." });
    }
  }

  private async findByToken(token: string) {
    if (!token) throw new NotFoundException({ code: "NOT_FOUND", message: "Invitation not found." });
    const invite = await this.prisma.experienceInvite.findUnique({ where: { tokenHash: hashInviteToken(token) } });
    if (!invite) throw new NotFoundException({ code: "NOT_FOUND", message: "Invitation not found." });
    return invite;
  }

  private present(invite: {
    id: string;
    role: "owner" | "editor" | "participant" | "viewer";
    email: string | null;
    status: "pending" | "accepted" | "revoked" | "expired";
    expiresAt: Date;
    createdAt: Date;
  }) {
    const expired = invite.status === "pending" && invite.expiresAt.getTime() <= Date.now();
    const role = invite.role === "owner" ? "participant" : invite.role;
    return {
      id: invite.id,
      role,
      email: invite.email,
      status: expired ? ("expired" as const) : invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
    };
  }
}
