import { Injectable } from "@nestjs/common";
import type { NotificationRecord } from "@gatherly/shared";
import { toJson } from "../../common/http";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    experienceId: string | null,
    type: "invitation_accepted" | "draw_completed" | "reservation_created",
    payload: Record<string, unknown>,
  ) {
    await this.prisma.notification.create({
      data: { userId, experienceId, type, payload: toJson(payload) },
    });
  }

  async list(userId: string) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { items: rows.map((row) => this.present(row)) };
  }

  async markRead(userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!existing) return null;
    const row = await this.prisma.notification.update({
      where: { id },
      data: { readAt: existing.readAt ?? new Date() },
    });
    return this.present(row);
  }

  private present(row: {
    id: string;
    type: string;
    payload: unknown;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationRecord {
    const payload =
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {};
    return {
      id: row.id,
      type: row.type,
      payload,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
