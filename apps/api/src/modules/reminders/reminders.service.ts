import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Sends purchase-deadline reminders ~3 days before the deadline (once per draw). */
  async sendPurchaseDeadlineReminders() {
    const now = new Date();
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const windowStart = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const draws = await this.prisma.secretSantaDraw.findMany({
      where: {
        status: { in: ["drawn", "locked"] },
        purchaseDeadline: { gte: windowStart, lte: inThreeDays },
        deadlineReminderSentAt: null,
      },
      include: {
        experience: { select: { id: true, title: true, slug: true } },
        participants: { include: { user: { select: { email: true } } } },
      },
      take: 50,
    });

    let sent = 0;
    for (const draw of draws) {
      const deadline = draw.purchaseDeadline;
      if (!deadline) continue;
      const deadlineLabel = deadline.toISOString().slice(0, 10);
      const url = `${this.mail.webOrigin()}/en/e/${draw.experience.slug}`;
      for (const participant of draw.participants) {
        const email = participant.user.email;
        if (!email || email.endsWith("@users.gatherly.invalid")) continue;
        const ok = await this.mail.sendPurchaseDeadline({
          to: email,
          experienceTitle: draw.experience.title,
          deadline: deadlineLabel,
          experienceUrl: url,
        });
        if (ok) sent += 1;
      }
      await this.prisma.secretSantaDraw.update({
        where: { id: draw.id },
        data: { deadlineReminderSentAt: new Date() },
      });
    }

    this.logger.log(`Deadline reminders: ${draws.length} draws, ${sent} emails`);
    return { draws: draws.length, emails: sent };
  }
}
