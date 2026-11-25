import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { isUniqueViolation } from "../../common/http";
import { PrismaService } from "../../database/prisma.service";
import { canReadExperience } from "../experiences/experience.presenter";
import { MailService } from "../mail/mail.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PermissionsService } from "../permissions/permissions.service";

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  async reserve(itemId: string, userId: string, input: { quantity: number; note: string }) {
    const item = await this.prisma.experienceItem.findUnique({
      where: { id: itemId },
      include: { experience: { include: { owner: true } } },
    });
    if (!item) throw new NotFoundException({ code: "NOT_FOUND", message: "Item not found." });
    const member = await this.permissions.getMembership(item.experienceId, userId);
    if (!canReadExperience(item.experience, member?.role ?? null)) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Item not found." });
    }

    try {
      const reservation = await this.prisma.itemReservation.create({
        data: {
          itemId,
          userId,
          quantity: Math.min(input.quantity, item.quantity),
          note: input.note,
          status: "active",
          activeItemId: itemId,
        },
      });
      if (item.experience.ownerId !== userId) {
        await this.notifications.create(item.experience.ownerId, item.experienceId, "reservation_created", {
          experienceId: item.experienceId,
          itemId: item.id,
          itemTitle: item.title,
        });
        const ownerEmail = item.experience.owner.email;
        if (ownerEmail && !ownerEmail.endsWith("@users.gatherly.invalid")) {
          const url = `${this.mail.webOrigin()}/en/e/${item.experience.slug}`;
          void this.mail.sendReservationNotice({
            to: ownerEmail,
            experienceTitle: item.experience.title,
            itemTitle: item.title,
            experienceUrl: url,
          });
        }
      }
      return { id: reservation.id };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: "ALREADY_RESERVED",
          message: "This gift already has an active reservation.",
        });
      }
      throw error;
    }
  }

  async cancel(reservationId: string, userId: string) {
    const reservation = await this.prisma.itemReservation.findUnique({ where: { id: reservationId } });
    if (!reservation || reservation.userId !== userId || reservation.status !== "active") {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Reservation not found." });
    }
    await this.prisma.itemReservation.update({
      where: { id: reservationId },
      data: { status: "cancelled", activeItemId: null, cancelledAt: new Date() },
    });
    return { cancelled: true as const };
  }

  async pledge(itemId: string, userId: string, input: { amountCents: number; note: string }) {
    const item = await this.prisma.experienceItem.findUnique({ where: { id: itemId }, include: { experience: true } });
    if (!item || !item.isGroupGift) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Group gift not found." });
    }
    const member = await this.permissions.getMembership(item.experienceId, userId);
    if (!canReadExperience(item.experience, member?.role ?? null)) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Group gift not found." });
    }
    await this.prisma.giftContribution.create({
      data: { itemId, userId, amountCents: input.amountCents, note: input.note },
    });
    const aggregate = await this.prisma.giftContribution.aggregate({
      where: { itemId },
      _sum: { amountCents: true },
    });
    return { pledgedCents: aggregate._sum.amountCents ?? 0 };
  }
}
