import { locales, type Locale } from "@gatherly/shared";
import { Injectable } from "@nestjs/common";
import type { AuthUser } from "../../common/types/auth-user";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensure(user: AuthUser) {
    const email = user.email || `${user.id}@users.gatherly.invalid`;
    const displayName = user.displayName || email.split("@")[0] || "Gatherly";
    return this.prisma.profile.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email,
        displayName,
      },
      update: {
        email,
      },
    });
  }

  async getById(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) return null;
    return this.present(profile);
  }

  async update(
    id: string,
    input: { displayName: string; avatarUrl?: string | null; preferredLanguage: Locale; timezone: string },
  ) {
    const profile = await this.prisma.profile.update({
      where: { id },
      data: {
        displayName: input.displayName,
        avatarUrl: input.avatarUrl ?? null,
        preferredLanguage: input.preferredLanguage,
        timezone: input.timezone,
      },
    });
    return this.present(profile);
  }

  present(profile: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    preferredLanguage: string;
    timezone: string;
  }) {
    const language: Locale = (locales as readonly string[]).includes(profile.preferredLanguage)
      ? (profile.preferredLanguage as Locale)
      : "en";
    return {
      id: profile.id,
      email: profile.email.endsWith("@users.gatherly.invalid") ? "" : profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      preferredLanguage: language,
      timezone: profile.timezone,
    };
  }
}
