import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { taskInputSchema, taskPatchSchema } from "@gatherly/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { parseBody } from "../../common/http";
import type { AuthUser } from "../../common/types/auth-user";
import { TasksService } from "./tasks.service";

@ApiTags("tasks")
@ApiBearerAuth()
@Controller("experiences/:experienceId/tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string) {
    return this.tasks.list(experienceId, user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string, @Body() body: unknown) {
    return this.tasks.create(experienceId, user.id, parseBody(taskInputSchema, body));
  }

  @Patch(":taskId")
  update(
    @CurrentUser() user: AuthUser,
    @Param("experienceId") experienceId: string,
    @Param("taskId") taskId: string,
    @Body() body: unknown,
  ) {
    return this.tasks.update(experienceId, taskId, user.id, parseBody(taskPatchSchema, body));
  }

  @Delete(":taskId")
  remove(
    @CurrentUser() user: AuthUser,
    @Param("experienceId") experienceId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.tasks.remove(experienceId, taskId, user.id);
  }
}
