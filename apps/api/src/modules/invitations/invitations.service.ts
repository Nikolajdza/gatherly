import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { z } from "zod";
import { createInviteSchema } from "@gatherly/shared";
import { PrismaService } from "../../database/prisma.service";
import { MembershipsService } from "../memberships/memberships.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PermissionsService } from "../permissions/permissions.service";
import { createInviteToken, hashInviteToken, inviteIsUsable } from "./tokens";

type CreateInviteInput = z.infer<typeof createInviteSchema>;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly memberships: MembershipsService,
    private readonly notifications: NotificationsService,
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
    return { ...this.present(invite), token, urlPath: `/invite/${token}` };
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
    return {
      experienceTitle: experience.title,
      template: experience.template,
      role: this.present(invite).role,
      status: this.present(invite).status,
      expiresAt: invite.expiresAt.toISOString(),
      emailRestricted: Boolean(invite.email),
    };
  }

  async accept(userId: string, email: string, token: string) {
    const invite = await this.findByToken(token);
    if (invite.status === "revoked") {
      throw new BadRequestException({ code: "INVITE_REVOKED", message: "This invitation has been revoked." });
    }
    if (!inviteIsUsable(invite)) {
      if (invite.status === "pending") {
        await this.prisma.experienceInvite.update({ where: { id: invite.id }, data: { status: "expired" } });
      }
      throw new BadRequestException({ code: "INVITE_EXPIRED", message: "This invitation has expired." });
    }
    if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException({
        code: "INVITE_EMAIL_MISMATCH",
        message: "This invitation is limited to a different email address.",
      });
    }
    if (invite.status === "accepted" && invite.acceptedById === userId) {
      return { experienceId: invite.experienceId };
    }
    if (invite.status !== "pending") {
      throw new BadRequestException({ code: "INVITE_CLOSED", message: "This invitation can no longer be used." });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.experienceInvite.update({
        where: { id: invite.id },
        data: { status: "accepted", acceptedById: userId },
      });
    });
    await this.memberships.grant(invite.experienceId, userId, invite.role);
    const experience = await this.prisma.experience.findUnique({ where: { id: invite.experienceId } });
    if (experience && experience.ownerId !== userId) {
      await this.notifications.create(experience.ownerId, experience.id, "invitation_accepted", {
        experienceId: experience.id,
        title: experience.title,
      });
    }
    return { experienceId: invite.experienceId };
  }

  private async findByToken(token: string) {
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
