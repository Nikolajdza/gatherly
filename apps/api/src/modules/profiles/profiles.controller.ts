import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { updateProfileSchema } from "@gatherly/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { parseBody } from "../../common/http";
import type { AuthUser } from "../../common/types/auth-user";
import { ProfilesService } from "./profiles.service";

@ApiTags("profiles")
@ApiBearerAuth()
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get("me")
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.profiles.ensure(user);
    return this.profiles.present(profile);
  }

  @Patch("me")
  update(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.profiles.update(user.id, parseBody(updateProfileSchema, body));
  }
}
