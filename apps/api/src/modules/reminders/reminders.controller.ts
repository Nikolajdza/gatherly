import { Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { RemindersService } from "./reminders.service";

@ApiTags("reminders")
@Controller("reminders")
export class RemindersController {
  constructor(
    private readonly reminders: RemindersService,
    private readonly config: ConfigService,
  ) {}

  /** Hit from an external cron (Render/GitHub Actions). Protect with CRON_SECRET. */
  @Public()
  @Post("purchase-deadlines")
  run(
    @Headers("authorization") authorization?: string,
    @Headers("x-cron-secret") cronSecret?: string,
  ) {
    const expected = this.config.get<string>("CRON_SECRET")?.trim();
    if (expected) {
      const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
      if (cronSecret !== expected && bearer !== expected) {
        throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Invalid cron secret." });
      }
    }
    return this.reminders.sendPurchaseDeadlineReminders();
  }
}
