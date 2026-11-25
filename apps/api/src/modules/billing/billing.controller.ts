import { Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../common/types/auth-user";
import { BillingService } from "./billing.service";

@ApiTags("billing")
@ApiBearerAuth()
@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post("upgrade")
  upgrade(@CurrentUser() user: AuthUser) {
    return this.billing.upgradeToPro(user.id);
  }
}
