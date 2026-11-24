import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { exclusionSchema, secretSantaSettingsSchema, updateWishlistSchema } from "@gatherly/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { parseBody } from "../../common/http";
import type { AuthUser } from "../../common/types/auth-user";
import { SecretSantaService } from "./secret-santa.service";

@ApiTags("secret-santa")
@ApiBearerAuth()
@Controller("experiences/:experienceId/secret-santa")
export class SecretSantaController {
  constructor(private readonly santa: SecretSantaService) {}

  @Get()
  get(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string) {
    return this.santa.get(experienceId, user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string, @Body() body: unknown) {
    return this.santa.update(experienceId, user.id, parseBody(secretSantaSettingsSchema, body));
  }

  @Post("participants")
  join(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string) {
    return this.santa.join(experienceId, user.id);
  }

  @Delete("participants/:participantId")
  leave(
    @CurrentUser() user: AuthUser,
    @Param("experienceId") experienceId: string,
    @Param("participantId") participantId: string,
  ) {
    return this.santa.leave(experienceId, user.id, participantId);
  }

  @Put("wishlist")
  wishlist(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string, @Body() body: unknown) {
    return this.santa.wishlist(experienceId, user.id, parseBody(updateWishlistSchema, body));
  }

  @Post("exclusions")
  exclude(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string, @Body() body: unknown) {
    return this.santa.exclude(experienceId, user.id, parseBody(exclusionSchema, body));
  }

  @Delete("exclusions/:exclusionId")
  removeExclusion(
    @CurrentUser() user: AuthUser,
    @Param("experienceId") experienceId: string,
    @Param("exclusionId") exclusionId: string,
  ) {
    return this.santa.removeExclusion(experienceId, user.id, exclusionId);
  }

  @Post("draw")
  draw(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string) {
    return this.santa.drawNames(experienceId, user.id);
  }

  @Post("lock")
  lock(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string) {
    return this.santa.lock(experienceId, user.id);
  }
}
