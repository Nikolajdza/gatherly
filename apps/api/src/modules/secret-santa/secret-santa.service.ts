import { randomInt } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  DrawError,
  drawAssignments,
  type SecretSantaView,
  exclusionSchema,
  secretSantaSettingsSchema,
  updateWishlistSchema,
} from "@gatherly/shared";
import type { z } from "zod";
import { dateOnly, fromDateOnly, toJson } from "../../common/http";
import { PrismaService } from "../../database/prisma.service";
import { PermissionsService } from "../permissions/permissions.service";

type Settings = z.infer<typeof secretSantaSettingsSchema>;
type Wishlist = z.infer<typeof updateWishlistSchema>;

type WishlistItem = SecretSantaView["participants"][number]["wishlist"][number];

@Injectable()
export class SecretSantaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async get(experienceId: string, userId: string): Promise<SecretSantaView> {
    await this.permissions.requireMember(experienceId, userId);
    const draw = await this.load(experienceId);
    const me = draw.participants.find((participant) => participant.userId === userId);
    const assignment = me
      ? await this.prisma.secretSantaAssignment.findUnique({
          where: { giverParticipantId: me.id },
          include: { recipient: { include: { user: true } } },
        })
      : null;
    return this.present(draw, assignment);
  }

  async update(experienceId: string, userId: string, input: Settings) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    const draw = await this.load(experienceId);
    if (draw.status !== "open") {
      throw new ConflictException({ code: "DRAW_LOCKED", message: "Settings cannot change after the draw." });
    }
    await this.prisma.secretSantaDraw.update({
      where: { id: draw.id },
      data: {
        budgetCents: input.budgetCents ?? null,
        currency: input.currency,
        drawDate: fromDateOnly(input.drawDate),
        purchaseDeadline: fromDateOnly(input.purchaseDeadline),
        organizerParticipates: input.organizerParticipates,
      },
    });
    return this.get(experienceId, userId);
  }

  async join(experienceId: string, userId: string) {
    await this.permissions.requireMember(experienceId, userId);
    const draw = await this.load(experienceId);
    this.assertOpen(draw.status);
    await this.prisma.secretSantaParticipant.upsert({
      where: { drawId_userId: { drawId: draw.id, userId } },
      create: { drawId: draw.id, userId, wishlist: toJson({ items: [] }) },
      update: {},
    });
    return this.get(experienceId, userId);
  }

  async leave(experienceId: string, actorId: string, participantId: string) {
    const draw = await this.load(experienceId);
    this.assertOpen(draw.status);
    const participant = draw.participants.find((entry) => entry.id === participantId);
    if (!participant) throw new NotFoundException({ code: "NOT_FOUND", message: "Participant not found." });
    if (participant.userId !== actorId) {
      await this.permissions.requireRole(experienceId, actorId, ["owner"]);
    } else {
      await this.permissions.requireMember(experienceId, actorId);
    }
    await this.prisma.secretSantaParticipant.delete({ where: { id: participantId } });
    return this.get(experienceId, actorId);
  }

  async wishlist(experienceId: string, userId: string, input: Wishlist) {
    const draw = await this.load(experienceId);
    const me = draw.participants.find((participant) => participant.userId === userId);
    if (!me) throw new NotFoundException({ code: "NOT_FOUND", message: "Join the draw before adding wishes." });
    await this.prisma.secretSantaParticipant.update({
      where: { id: me.id },
      data: { wishlist: toJson(input) },
    });
    return this.get(experienceId, userId);
  }

  async exclude(experienceId: string, userId: string, input: z.infer<typeof exclusionSchema>) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    const draw = await this.load(experienceId);
    this.assertOpen(draw.status);
    const ids = new Set(draw.participants.map((participant) => participant.id));
    if (!ids.has(input.participantAId) || !ids.has(input.participantBId) || input.participantAId === input.participantBId) {
      throw new BadRequestException({ code: "INVALID_EXCLUSION", message: "Choose two different participants." });
    }
    const [low, high] = input.participantAId < input.participantBId
      ? [input.participantAId, input.participantBId]
      : [input.participantBId, input.participantAId];
    await this.prisma.secretSantaExclusion.upsert({
      where: { drawId_participantLowId_participantHighId: { drawId: draw.id, participantLowId: low, participantHighId: high } },
      create: { drawId: draw.id, participantLowId: low, participantHighId: high },
      update: {},
    });
    return this.get(experienceId, userId);
  }

  async removeExclusion(experienceId: string, userId: string, exclusionId: string) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    const draw = await this.load(experienceId);
    this.assertOpen(draw.status);
    await this.prisma.secretSantaExclusion.deleteMany({ where: { id: exclusionId, drawId: draw.id } });
    return this.get(experienceId, userId);
  }

  async drawNames(experienceId: string, userId: string) {
    await this.permissions.requireRole(experienceId, userId, ["owner"]);
    const draw = await this.load(experienceId);
    if (draw.status === "locked") {
      throw new ConflictException({ code: "DRAW_LOCKED", message: "This draw is locked." });
    }
    const ownerId = draw.experience.ownerId;
    const participants = draw.participants.filter(
      (participant) => draw.organizerParticipates || participant.userId !== ownerId,
    );
    let assignments;
    try {
      assignments = drawAssignments(
        participants.map((participant) => ({ id: participant.id })),
        draw.exclusions.map((exclusion) => ({ a: exclusion.participantLowId, b: exclusion.participantHighId })),
        (max) => randomInt(max),
      );
    } catch (error) {
      if (error instanceof DrawError) {
        throw new BadRequestException({
          code: error.code,
          message:
            error.code === "NEED_MORE_PARTICIPANTS"
              ? "At least two participants are required."
              : "These exclusion rules make a fair draw impossible.",
        });
      }
      throw error;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.secretSantaAssignment.deleteMany({ where: { drawId: draw.id } });
      await tx.secretSantaAssignment.createMany({
        data: assignments.map((assignment) => ({
          drawId: draw.id,
          giverParticipantId: assignment.giverId,
          recipientParticipantId: assignment.recipientId,
        })),
      });
      await tx.secretSantaDraw.update({
        where: { id: draw.id },
        data: { status: "drawn", drawnAt: new Date() },
      });
      await tx.notification.createMany({
        data: participants.map((participant) => ({
          userId: participant.userId,
          experienceId,
          type: "draw_completed" as const,
          payload: toJson({ experienceId }),
        })),
      });
    });

    return { status: "drawn" as const, participantCount: participants.length };
  }

  async lock(experienceId: string, userId: string) {
    await this.permissions.requireRole(experienceId, userId, ["owner"]);
    const draw = await this.load(experienceId);
    if (draw.status !== "drawn") {
      throw new ConflictException({ code: "DRAW_NOT_READY", message: "Run the draw before locking it." });
    }
    await this.prisma.secretSantaDraw.update({ where: { id: draw.id }, data: { status: "locked" } });
    return this.get(experienceId, userId);
  }

  private assertOpen(status: "open" | "drawn" | "locked") {
    if (status !== "open") {
      throw new ConflictException({ code: "DRAW_LOCKED", message: "Participants are frozen after the draw." });
    }
  }

  private async load(experienceId: string) {
    const draw = await this.prisma.secretSantaDraw.findUnique({
      where: { experienceId },
      include: {
        experience: true,
        participants: { include: { user: true }, orderBy: { joinedAt: "asc" } },
        exclusions: true,
      },
    });
    if (!draw) throw new NotFoundException({ code: "NOT_FOUND", message: "Secret Santa is not set up for this experience." });
    return draw;
  }

  private present(
    draw: Awaited<ReturnType<SecretSantaService["load"]>>,
    assignment: {
      recipientParticipantId: string;
      recipient: { user: { displayName: string }; wishlist: unknown };
    } | null,
  ): SecretSantaView {
    return {
      id: draw.id,
      status: draw.status,
      budgetCents: draw.budgetCents,
      currency: draw.currency,
      drawDate: dateOnly(draw.drawDate),
      purchaseDeadline: dateOnly(draw.purchaseDeadline),
      organizerParticipates: draw.organizerParticipates,
      participants: draw.participants.map((participant) => ({
        id: participant.id,
        userId: participant.userId,
        displayName: participant.user.displayName,
        wishlist: readWishlist(participant.wishlist),
      })),
      exclusions: draw.exclusions.map((exclusion) => ({
        id: exclusion.id,
        participantAId: exclusion.participantLowId,
        participantBId: exclusion.participantHighId,
      })),
      myAssignment: assignment
        ? {
            recipientParticipantId: assignment.recipientParticipantId,
            displayName: assignment.recipient.user.displayName,
            wishlist: readWishlist(assignment.recipient.wishlist),
          }
        : null,
    };
  }
}

function readWishlist(value: unknown): WishlistItem[] {
  if (!value || typeof value !== "object" || !("items" in value) || !Array.isArray(value.items)) return [];
  return value.items.flatMap((item) => {
    if (!item || typeof item !== "object" || !("title" in item) || typeof item.title !== "string") return [];
    const note = "note" in item && typeof item.note === "string" ? item.note : "";
    const url = "url" in item && typeof item.url === "string" ? item.url : null;
    return [{ title: item.title, note, url }];
  });
}
