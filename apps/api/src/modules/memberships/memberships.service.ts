import { BadRequestException, Injectable } from "@nestjs/common";
import type { MemberRole } from "@gatherly/shared";
import { higherRole, roleAtLeast } from "@gatherly/shared";
import { PrismaService } from "../../database/prisma.service";
import { PermissionsService } from "../permissions/permissions.service";

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async list(experienceId: string, userId: string) {
    const viewer = await this.permissions.requireMember(experienceId, userId);
    const members = await this.prisma.experienceMember.findMany({
      where: { experienceId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
    const canSeeEmail = roleAtLeast(viewer.role, "editor");
    return {
      items: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        displayName: member.user.displayName,
        email: canSeeEmail ? member.user.email : null,
        avatarUrl: member.user.avatarUrl,
      })),
    };
  }

  async updateRole(experienceId: string, actorId: string, targetUserId: string, role: Exclude<MemberRole, "owner">) {
    await this.permissions.requireRole(experienceId, actorId, ["owner"]);
    if (targetUserId === actorId) {
      throw new BadRequestException({ code: "OWNER_ROLE_LOCKED", message: "The owner role cannot be changed here." });
    }
    const updated = await this.prisma.experienceMember.update({
      where: { experienceId_userId: { experienceId, userId: targetUserId } },
      data: { role },
      include: { user: true },
    });
    return {
      id: updated.id,
      userId: updated.userId,
      role: updated.role,
      displayName: updated.user.displayName,
      email: updated.user.email,
      avatarUrl: updated.user.avatarUrl,
    };
  }

  async remove(experienceId: string, actorId: string, targetUserId: string) {
    await this.permissions.requireRole(experienceId, actorId, ["owner"]);
    const target = await this.permissions.requireMember(experienceId, targetUserId);
    if (target.role === "owner") {
      throw new BadRequestException({ code: "OWNER_ROLE_LOCKED", message: "The owner cannot be removed." });
    }
    await this.prisma.experienceMember.delete({ where: { id: target.id } });
    return { deleted: true as const };
  }

  async grant(experienceId: string, userId: string, role: MemberRole) {
    const existing = await this.permissions.getMembership(experienceId, userId);
    if (!existing) {
      await this.prisma.experienceMember.create({ data: { experienceId, userId, role } });
      return role;
    }
    const next = higherRole(existing.role, role);
    if (next !== existing.role) {
      await this.prisma.experienceMember.update({ where: { id: existing.id }, data: { role: next } });
    }
    return next;
  }
}
