import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createExperienceSchema, updateExperienceSchema } from "@gatherly/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { parseBody } from "../../common/http";
import type { AuthUser } from "../../common/types/auth-user";
import { ExperiencesService } from "./experiences.service";

@ApiTags("experiences")
@Controller()
export class ExperiencesController {
  constructor(private readonly experiences: ExperiencesService) {}

  @ApiBearerAuth()
  @Get("experiences")
  list(@CurrentUser() user: AuthUser) {
    return this.experiences.list(user.id);
  }

  @ApiBearerAuth()
  @Post("experiences")
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.experiences.create(user.id, parseBody(createExperienceSchema, body));
  }

  @ApiBearerAuth()
  @Get("experiences/:id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.experiences.getForMember(id, user.id);
  }

  @ApiBearerAuth()
  @Patch("experiences/:id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.experiences.update(id, user.id, parseBody(updateExperienceSchema, body));
  }

  @ApiBearerAuth()
  @Delete("experiences/:id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.experiences.remove(id, user.id);
  }

  @Public()
  @Get("public/experiences/:slug")
  bySlug(@CurrentUser() user: AuthUser | undefined, @Param("slug") slug: string) {
    return this.experiences.getBySlug(slug, user?.id);
  }
}
