import { Body, Controller, Delete, Get, Param, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { updateMemberSchema } from "@gatherly/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { parseBody } from "../../common/http";
import type { AuthUser } from "../../common/types/auth-user";
import { MembershipsService } from "./memberships.service";

@ApiTags("memberships")
@ApiBearerAuth()
@Controller("experiences/:experienceId/members")
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string) {
    return this.memberships.list(experienceId, user.id);
  }

  @Patch(":userId")
  update(
    @CurrentUser() user: AuthUser,
    @Param("experienceId") experienceId: string,
    @Param("userId") userId: string,
    @Body() body: unknown,
  ) {
    const input = parseBody(updateMemberSchema, body);
    return this.memberships.updateRole(experienceId, user.id, userId, input.role);
  }

  @Delete(":userId")
  remove(
    @CurrentUser() user: AuthUser,
    @Param("experienceId") experienceId: string,
    @Param("userId") userId: string,
  ) {
    return this.memberships.remove(experienceId, user.id, userId);
  }
}
