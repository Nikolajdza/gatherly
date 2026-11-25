import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  acceptInviteSchema,
  claimInviteSchema,
  createInviteSchema,
  createInvitesBulkSchema,
  sendThankYouSchema,
} from "@gatherly/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { parseBody } from "../../common/http";
import type { AuthUser } from "../../common/types/auth-user";
import { InvitationsService } from "./invitations.service";

@ApiTags("invitations")
@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @ApiBearerAuth()
  @Get("experiences/:experienceId/invitations")
  list(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string) {
    return this.invitations.list(experienceId, user.id);
  }

  @ApiBearerAuth()
  @Post("experiences/:experienceId/invitations")
  create(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string, @Body() body: unknown) {
    return this.invitations.create(experienceId, user.id, parseBody(createInviteSchema, body));
  }

  @ApiBearerAuth()
  @Post("experiences/:experienceId/invitations/bulk")
  createBulk(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string, @Body() body: unknown) {
    return this.invitations.createBulk(experienceId, user.id, parseBody(createInvitesBulkSchema, body));
  }

  @ApiBearerAuth()
  @Post("experiences/:experienceId/thank-you")
  sendThankYou(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string, @Body() body: unknown) {
    return this.invitations.sendThankYou(experienceId, user.id, parseBody(sendThankYouSchema, body));
  }

  @ApiBearerAuth()
  @Post("invitations/:id/revoke")
  revoke(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.invitations.revoke(id, user.id);
  }

  @Public()
  @Get("invitations/preview")
  preview(@Query("token") token?: string) {
    if (!token) return this.invitations.preview("");
    return this.invitations.preview(token);
  }

  @ApiBearerAuth()
  @Post("invitations/accept")
  accept(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parseBody(acceptInviteSchema, body);
    return this.invitations.accept(user.id, user.email, input.token);
  }

  /** Guest path: name + email → membership (+ session for brand-new guests). */
  @Public()
  @Post("invitations/claim")
  claim(@Body() body: unknown) {
    return this.invitations.claim(parseBody(claimInviteSchema, body));
  }
}
