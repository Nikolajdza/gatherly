import { Body, Controller, Delete, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { itemInputSchema, itemPatchSchema, reorderItemsSchema } from "@gatherly/shared";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { parseBody } from "../../common/http";
import type { AuthUser } from "../../common/types/auth-user";
import { ItemsService } from "./items.service";

const createItemSchema = itemInputSchema.extend({ aiImportId: z.string().uuid().optional() });

@ApiTags("gift-registry")
@ApiBearerAuth()
@Controller("experiences/:experienceId/items")
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string, @Body() body: unknown) {
    const input = parseBody(createItemSchema, body);
    return this.items.create(experienceId, user.id, input, input.aiImportId);
  }

  @Post("reorder")
  reorder(@CurrentUser() user: AuthUser, @Param("experienceId") experienceId: string, @Body() body: unknown) {
    const input = parseBody(reorderItemsSchema, body);
    return this.items.reorder(experienceId, user.id, input.orderedIds);
  }

  @Patch(":itemId")
  update(
    @CurrentUser() user: AuthUser,
    @Param("experienceId") experienceId: string,
    @Param("itemId") itemId: string,
    @Body() body: unknown,
  ) {
    return this.items.update(experienceId, itemId, user.id, parseBody(itemPatchSchema, body));
  }

  @Delete(":itemId")
  remove(
    @CurrentUser() user: AuthUser,
    @Param("experienceId") experienceId: string,
    @Param("itemId") itemId: string,
  ) {
    return this.items.remove(experienceId, itemId, user.id);
  }
}
