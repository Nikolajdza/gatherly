import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { pledgeInputSchema, reservationInputSchema } from "@gatherly/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { parseBody } from "../../common/http";
import type { AuthUser } from "../../common/types/auth-user";
import { ReservationsService } from "./reservations.service";

@ApiTags("reservations")
@ApiBearerAuth()
@Controller()
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Post("items/:itemId/reservations")
  reserve(@CurrentUser() user: AuthUser, @Param("itemId") itemId: string, @Body() body: unknown) {
    return this.reservations.reserve(itemId, user.id, parseBody(reservationInputSchema, body ?? {}));
  }

  @Delete("reservations/:id")
  cancel(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reservations.cancel(id, user.id);
  }

  @Post("items/:itemId/contributions")
  pledge(@CurrentUser() user: AuthUser, @Param("itemId") itemId: string, @Body() body: unknown) {
    return this.reservations.pledge(itemId, user.id, parseBody(pledgeInputSchema, body));
  }
}
