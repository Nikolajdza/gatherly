import { Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../common/types/auth-user";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.list(user.id);
  }

  @Post(":id/read")
  async read(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const notification = await this.notifications.markRead(user.id, id);
    if (!notification) throw new NotFoundException({ code: "NOT_FOUND", message: "Notification not found." });
    return notification;
  }
}
