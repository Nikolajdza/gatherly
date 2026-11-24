import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { MemberRole } from "@gatherly/shared";
import { roleAllowed } from "@gatherly/shared";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  getMembership(experienceId: string, userId: string) {
    return this.prisma.experienceMember.findUnique({
      where: { experienceId_userId: { experienceId, userId } },
    });
  }

  async requireMember(experienceId: string, userId: string) {
    const member = await this.getMembership(experienceId, userId);
    if (!member) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Experience not found." });
    }
    return member;
  }

  async requireRole(experienceId: string, userId: string, roles: readonly MemberRole[]) {
    const member = await this.requireMember(experienceId, userId);
    if (!roleAllowed(member.role, roles)) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "You do not have permission for this action." });
    }
    return member;
  }
}
