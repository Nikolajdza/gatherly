import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { itemInputSchema, itemPatchSchema, type ItemInput } from "@gatherly/shared";
import type { z } from "zod";
import { PrismaService } from "../../database/prisma.service";
import { presentItem, type StoredItem } from "../experiences/experience.presenter";
import { PermissionsService } from "../permissions/permissions.service";

type ItemPatch = z.infer<typeof itemPatchSchema>;

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async create(experienceId: string, userId: string, input: ItemInput, aiImportId?: string) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    const experience = await this.prisma.experience.findUnique({ where: { id: experienceId } });
    if (!experience || experience.type !== "gift_registry") {
      throw new BadRequestException({ code: "WRONG_EXPERIENCE", message: "Items belong on a gift registry." });
    }
    const last = await this.prisma.experienceItem.findFirst({
      where: { experienceId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const item = await this.prisma.experienceItem.create({
      data: {
        experienceId,
        createdById: userId,
        title: input.title,
        description: input.description,
        url: input.url ?? null,
        imageUrl: input.imageUrl ?? null,
        priceCents: input.priceCents ?? null,
        currency: input.currency ?? null,
        category: input.category ?? null,
        priority: input.priority,
        quantity: input.quantity,
        itemKind: input.itemKind,
        isGroupGift: input.isGroupGift,
        targetAmountCents: input.isGroupGift ? (input.targetAmountCents ?? input.priceCents ?? null) : null,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
      include: { reservations: true, contributions: true },
    });
    if (aiImportId) {
      await this.prisma.aiImport.updateMany({
        where: { id: aiImportId, userId, experienceId },
        data: { status: "saved" },
      });
    }
    return presentItem(item, userId);
  }

  async update(experienceId: string, itemId: string, userId: string, input: ItemPatch) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    await this.requireItem(experienceId, itemId);
    const item = await this.prisma.experienceItem.update({
      where: { id: itemId },
      data: {
        title: input.title,
        description: input.description,
        url: input.url,
        imageUrl: input.imageUrl,
        priceCents: input.priceCents,
        currency: input.currency,
        category: input.category,
        priority: input.priority,
        quantity: input.quantity,
        itemKind: input.itemKind,
        isGroupGift: input.isGroupGift,
        targetAmountCents: input.targetAmountCents,
      },
      include: { reservations: true, contributions: true },
    });
    return presentItem(item, userId);
  }

  async remove(experienceId: string, itemId: string, userId: string) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    await this.requireItem(experienceId, itemId);
    await this.prisma.experienceItem.delete({ where: { id: itemId } });
    return { deleted: true as const };
  }

  async reorder(experienceId: string, userId: string, orderedIds: string[]) {
    await this.permissions.requireRole(experienceId, userId, ["owner", "editor"]);
    const items = await this.prisma.experienceItem.findMany({ where: { experienceId }, select: { id: true } });
    const existing = new Set(items.map((item) => item.id));
    if (orderedIds.length !== existing.size || orderedIds.some((id) => !existing.has(id))) {
      throw new BadRequestException({ code: "INVALID_ORDER", message: "The order must include every item once." });
    }
    await this.prisma.$transaction(
      orderedIds.map((id, index) => this.prisma.experienceItem.update({ where: { id }, data: { sortOrder: index + 1 } })),
    );
    return { updated: true as const };
  }

  async requireItem(experienceId: string, itemId: string): Promise<StoredItem & { experienceId: string }> {
    const item = await this.prisma.experienceItem.findFirst({
      where: { id: itemId, experienceId },
      include: { reservations: true, contributions: true },
    });
    if (!item) throw new NotFoundException({ code: "NOT_FOUND", message: "Item not found." });
    return item;
  }
}

export { itemInputSchema };
