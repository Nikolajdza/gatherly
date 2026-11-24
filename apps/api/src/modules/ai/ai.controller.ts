import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  aiMessageSchema,
  checklistSchema,
  eventDescriptionSchema,
  extractProductSchema,
  giftIdeasSchema,
  productFromTextSchema,
  santaIdeasSchema,
  thankYouNotesSchema,
  tidyTasksSchema,
} from "@gatherly/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { parseBody } from "../../common/http";
import type { AuthUser } from "../../common/types/auth-user";
import { AiService } from "./ai.service";

@ApiTags("ai")
@ApiBearerAuth()
@Controller("ai")
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post("extract-product")
  extract(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.ai.extractProduct(user.id, parseBody(extractProductSchema, body));
  }

  @Post("product-from-text")
  fromText(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.ai.productFromText(user.id, parseBody(productFromTextSchema, body));
  }

  @Post("event-description")
  describe(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.ai.describeEvent(user.id, parseBody(eventDescriptionSchema, body));
  }

  @Post("gift-ideas")
  giftIdeas(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.ai.giftIdeas(user.id, parseBody(giftIdeasSchema, body));
  }

  @Post("thank-you-notes")
  thankYou(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.ai.thankYouNotes(user.id, parseBody(thankYouNotesSchema, body));
  }

  @Post("santa-ideas")
  santaIdeas(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.ai.santaIdeas(user.id, parseBody(santaIdeasSchema, body));
  }

  @Post("message")
  message(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.ai.message(user.id, parseBody(aiMessageSchema, body));
  }

  @Post("checklist")
  checklist(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.ai.checklist(user.id, parseBody(checklistSchema, body));
  }

  @Post("tidy-tasks")
  tidy(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.ai.tidyTasks(user.id, parseBody(tidyTasksSchema, body));
  }
}
