import { randomBytes } from "node:crypto";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  getTemplate,
  parseTemplateConfig,
  resolveTheme,
  slugify,
  themeConfigSchema,
  type CreateExperienceInput,
  type UpdateExperienceInput,
} from "@gatherly/shared";
import { fromDateOnly, rethrowKnown, toJson } from "../../common/http";
import { PrismaService } from "../../database/prisma.service";
import { PermissionsService } from "../permissions/permissions.service";
import { canReadExperience, presentDetail, presentSummary, type StoredExperience, type StoredItem } from "./experience.presenter";

const detailInclude = {
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: { reservations: true, contributions: true },
  },
  _count: { select: { members: true } },
};

@Injectable()
export class ExperiencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async list(userId: string) {
    const memberships = await this.prisma.experienceMember.findMany({
      where: { userId },
      include: { experience: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return {
      items: memberships.map((membership) => presentSummary(membership.experience, membership.role)),
    };
  }

  async create(userId: string, input: CreateExperienceInput) {
    const template = getTemplate(input.template);
    if (!template || template.type !== input.type) {
      throw new BadRequestException({ code: "UNKNOWN_TEMPLATE", message: "That template does not match the experience type." });
    }

    const config = this.parseConfig(template.id, input.config);
    let theme;
    try {
      theme = resolveTheme(template.id, input.themeConfig);
    } catch (error) {
      rethrowKnown(error);
    }

    const slug = await this.uniqueSlug(input.title);
    const santa = template.type === "secret_santa" ? readSanta(config) : null;

    const created = await this.prisma.experience.create({
      data: {
        ownerId: userId,
        type: input.type,
        template: template.id,
        templateVersion: template.templateVersion,
        title: input.title,
        slug,
        description: input.description,
        status: input.status,
        visibility: input.visibility,
        eventDate: fromDateOnly(input.eventDate),
        timezone: input.timezone,
        coverImageUrl: input.coverImageUrl ?? null,
        config: toJson(config),
        themeConfig: toJson(theme),
        members: { create: { userId, role: "owner" } },
        draw: santa
          ? {
              create: {
                budgetCents: santa.budgetCents,
                currency: santa.currency,
                drawDate: fromDateOnly(santa.drawDate),
                purchaseDeadline: fromDateOnly(santa.purchaseDeadline),
                organizerParticipates: santa.organizerParticipates,
                participants: santa.organizerParticipates
                  ? { create: { userId, wishlist: toJson({ items: [] }) } }
                  : undefined,
              },
            }
          : undefined,
      },
      include: detailInclude,
    });

    return presentDetail(created, "owner", userId, created._count.members);
  }

  async getForMember(id: string, userId: string) {
    const loaded = await this.load(id);
    const member = await this.permissions.requireMember(id, userId);
    if (!canReadExperience(loaded, member.role)) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Experience not found." });
    }
    return presentDetail(loaded, member.role, userId, loaded._count.members);
  }

  async getBySlug(slug: string, userId?: string) {
    const experience = await this.prisma.experience.findUnique({ where: { slug }, include: detailInclude });
    if (!experience) throw new NotFoundException({ code: "NOT_FOUND", message: "Experience not found." });
    const member = userId ? await this.permissions.getMembership(experience.id, userId) : null;
    if (!canReadExperience(experience, member?.role ?? null)) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Experience not found." });
    }
    return presentDetail(experience, member?.role ?? null, userId ?? null, experience._count.members);
  }

  async update(id: string, userId: string, input: UpdateExperienceInput) {
    const existing = await this.load(id);
    const member = await this.permissions.requireRole(id, userId, ["owner", "editor"]);
    const ownerOnly =
      (input.visibility !== undefined && input.visibility !== existing.visibility) ||
      (input.status !== undefined && input.status !== existing.status);
    if (ownerOnly && member.role !== "owner") {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Only the owner can change status or visibility." });
    }
    let config = toJson(existing.config ?? {});
    if (input.config) {
      config = toJson(this.parseConfig(existing.template, input.config));
    }
    let themeConfig = toJson(existing.themeConfig ?? {});
    if (input.themeConfig) {
      try {
        themeConfig = toJson(themeConfigSchema.parse({ ...asTheme(existing.themeConfig), ...input.themeConfig }));
      } catch (error) {
        rethrowKnown(error);
      }
    }

    await this.prisma.experience.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        visibility: input.visibility,
        eventDate: input.eventDate === undefined ? undefined : fromDateOnly(input.eventDate),
        timezone: input.timezone,
        coverImageUrl: input.coverImageUrl === undefined ? undefined : input.coverImageUrl,
        config,
        themeConfig,
      },
    });
    return this.getForMember(id, userId).then((detail) => ({ ...detail, role: member.role }));
  }

  async remove(id: string, userId: string) {
    await this.permissions.requireRole(id, userId, ["owner"]);
    await this.prisma.experience.delete({ where: { id } });
    return { deleted: true as const };
  }

  async load(id: string) {
    const experience = await this.prisma.experience.findUnique({ where: { id }, include: detailInclude });
    if (!experience) throw new NotFoundException({ code: "NOT_FOUND", message: "Experience not found." });
    return experience;
  }

  private parseConfig(templateId: string, config: unknown) {
    const raw = { ...(config && typeof config === "object" ? (config as Record<string, unknown>) : {}) };
    const template = getTemplate(templateId);
    if (template?.type === "task_list" && raw.listKind === undefined) raw.listKind = template.id;
    try {
      return parseTemplateConfig(templateId, raw);
    } catch (error) {
      rethrowKnown(error);
    }
  }

  private async uniqueSlug(title: string) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = slugify(title, randomBytes(3).toString("hex"));
      const existing = await this.prisma.experience.findUnique({ where: { slug }, select: { id: true } });
      if (!existing) return slug;
    }
    return slugify(title, randomBytes(8).toString("hex"));
  }
}

function readSanta(config: unknown) {
  const value = config as {
    budgetCents?: number | null;
    currency?: string;
    drawDate?: string | null;
    purchaseDeadline?: string | null;
    organizerParticipates?: boolean;
  };
  return {
    budgetCents: value.budgetCents ?? null,
    currency: value.currency ?? "EUR",
    drawDate: value.drawDate ?? null,
    purchaseDeadline: value.purchaseDeadline ?? null,
    organizerParticipates: value.organizerParticipates !== false,
  };
}

function asTheme(value: unknown) {
  return value && typeof value === "object" ? value : {};
}

export type ExperienceWithItems = StoredExperience & { items: StoredItem[]; _count: { members: number } };
