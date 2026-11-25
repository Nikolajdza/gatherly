import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ProfilesService } from "../profiles/profiles.service";

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
  ) {}

  /** Soft upgrade until Stripe is wired — flips the account to Pro. */
  async upgradeToPro(userId: string) {
    const profile = await this.prisma.profile.update({
      where: { id: userId },
      data: { plan: "pro" },
    });
    return this.profiles.present(profile);
  }

  async downgradeToFree(userId: string) {
    const profile = await this.prisma.profile.update({
      where: { id: userId },
      data: { plan: "free" },
    });
    return this.profiles.present(profile);
  }
}
