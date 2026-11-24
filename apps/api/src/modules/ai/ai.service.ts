import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import {
  type AiTone,
  type ChecklistSuggestion,
  type GiftIdea,
  type Locale,
  type ProductPreview,
  type SantaGiftIdea,
  type TaskTidyResult,
  type ThankYouNote,
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
import type { z } from "zod";
import type { Experience } from "../../../generated/prisma/client";
import { asRecord, dateOnly, toJson } from "../../common/http";
import { PrismaService } from "../../database/prisma.service";
import { PermissionsService } from "../permissions/permissions.service";
import { cleanCategory, cleanLine, currencyFromText, dueDateFrom, languageNames, priceFromText, priorityFrom } from "./guards";
import { LlmService, s } from "./llm.service";
import { mergeProductCopy, parseProductHtml, type PageFacts, type ProductCopy } from "./product-page";
import { assertSafeUrl, readLimited, UnsafeUrlError } from "./url-safety";

const MAX_HTML_BYTES = 1_000_000;
const MANAGERS = ["owner", "editor"] as const;

const toneHint: Record<AiTone, string> = {
  warm: "warm and personal",
  formal: "polite and elegant",
  playful: "light, cheerful and playful",
};
@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly llm: LlmService,
  ) {}

  async extractProduct(userId: string, input: z.infer<typeof extractProductSchema>): Promise<ProductPreview> {
    let context: Awaited<ReturnType<AiService["giftContext"]>> | null = null;
    if (input.experienceId) {
      await this.permissions.requireRole(input.experienceId, userId, MANAGERS);
      context = await this.giftContext(input.experienceId);
    }
    let page: PageFacts;
    try {
      const html = await this.fetchPage(input.url);
      page = parseProductHtml(html.html, html.finalUrl);
    } catch (error) {
      if (error instanceof UnsafeUrlError) {
        throw new BadRequestException({ code: "UNSAFE_URL", message: error.message });
      }
      throw new BadRequestException({ code: "FETCH_FAILED", message: "The product page could not be read." });
    }

    let copy: ProductCopy | null = null;
    if (this.llm.available()) {
      await this.llm.consume(userId, "product-card");
      copy = await this.writeCard(
        { title: page.title, description: page.description?.slice(0, 1500) ?? null, url: page.url },
        context,
        input.locale,
      );
    }
    const preview = mergeProductCopy(page, copy);
    const saved = await this.prisma.aiImport.create({
      data: {
        userId,
        experienceId: input.experienceId ?? null,
        sourceUrl: page.url,
        status: "preview",
        extracted: toJson(preview),
      },
    });
    return { importId: saved.id, ...preview };
  }

  async productFromText(userId: string, input: z.infer<typeof productFromTextSchema>): Promise<ProductPreview> {
    await this.permissions.requireRole(input.experienceId, userId, MANAGERS);
    this.llm.requireAvailable();
    const context = await this.giftContext(input.experienceId);
    await this.llm.consume(userId, "product-text");
    const text = input.text.replace(/\s+/g, " ").slice(0, 8000);
    const result = await this.llm.json<ProductCopy & { priceText: string | null; currency: string | null }>({
      name: "pasted_product",
      system: [
        "A user copied all text from an online shop product page, including menus and noise. Find the main product and write a gift card for it.",
        this.cardRules(context, input.locale),
        "priceText is the current price of the main product copied exactly as it appears in the text, or null if unclear. currency is a 3-letter code (EUR, RSD, USD, GBP, RUB) or null.",
      ].join("\n"),
      payload: { url: input.url ?? null, pageText: text },
      schema: s.object({
        title: s.string,
        description: s.nullableString,
        category: s.nullableString,
        priority: s.priority,
        priceText: s.nullableString,
        currency: s.nullableString,
      }),
      temperature: 0.2,
    });
    if (!result?.title?.trim()) this.unavailable();

    const priceCents = priceFromText(text, result.priceText);
    const currency = priceCents === null ? null : currencyFromText(text, result.currency);
    const preview = {
      title: cleanLine(result.title, 200),
      description: cleanLine(result.description, 600) || null,
      imageUrl: null,
      priceCents: currency ? priceCents : null,
      currency,
      url: input.url ?? null,
      category: cleanCategory(result.category, context.categories),
      priority: priorityFrom(result.priority),
      aiUsed: true,
      priceFoundOnPage: Boolean(currency && priceCents !== null),
      imageFoundOnPage: false,
    };
    const saved = await this.prisma.aiImport.create({
      data: {
        userId,
        experienceId: input.experienceId,
        sourceUrl: input.url ?? "pasted-text",
        status: "preview",
        extracted: toJson(preview),
      },
    });
    return { importId: saved.id, ...preview };
  }

  async describeEvent(userId: string, input: z.infer<typeof eventDescriptionSchema>) {
    await this.permissions.requireRole(input.experienceId, userId, MANAGERS);
    this.llm.requireAvailable();
    const experience = await this.experience(input.experienceId);
    await this.llm.consume(userId, "describe");
    const result = await this.llm.json<{ description: string }>({
      name: "event_description",
      system: `Write a short welcome text (2 to 4 sentences, at most 70 words) for a guest page of this event. Language: ${languageNames[input.locale]}. Tone: ${toneHint[input.tone]}. No emojis, no hashtags.`,
      payload: this.facts(experience),
      schema: s.object({ description: s.string }),
      temperature: 0.7,
    });
    const description = cleanLine(result?.description, 2000);
    if (!description) this.unavailable();
    return { description, aiUsed: true };
  }

  async giftIdeas(userId: string, input: z.infer<typeof giftIdeasSchema>): Promise<{ items: GiftIdea[] }> {
    await this.permissions.requireRole(input.experienceId, userId, MANAGERS);
    this.llm.requireAvailable();
    const context = await this.giftContext(input.experienceId);
    await this.llm.consume(userId, "gift-ideas");
    const result = await this.llm.json<{ ideas: Array<{ title: string; description: string; category: string | null; itemKind: string }> }>({
      name: "gift_ideas",
      system: [
        `Suggest ${input.count} thoughtful, concrete gift ideas for this registry. Language: ${languageNames[input.locale]}.`,
        "Each title is 2 to 6 words and names a kind of gift, not a specific brand or shop. Each description is one sentence, at most 22 words, saying why it fits.",
        "Do not repeat gifts that are already on the list. Do not mention prices. itemKind is product or experience.",
        "Use one of the existing categories when it fits, otherwise a short new one.",
      ].join("\n"),
      payload: {
        ...this.facts(context.experience),
        existingGifts: context.titles.slice(0, 80),
        categories: context.categories,
        budgetHint: input.budgetCents ? { amount: input.budgetCents / 100, note: "Keep ideas around this budget." } : null,
        wishes: input.prompt || null,
      },
      schema: s.object({
        ideas: s.array(s.object({ title: s.string, description: s.string, category: s.nullableString, itemKind: { type: "string", enum: ["product", "experience"] } })),
      }),
      temperature: 0.8,
    });
    if (!result?.ideas?.length) this.unavailable();
    const existing = new Set(context.titles.map((title) => title.toLowerCase()));
    const seen = new Set<string>();
    const items = result.ideas
      .map((idea) => ({
        title: cleanLine(idea.title, 120),
        description: cleanLine(idea.description, 300),
        category: cleanCategory(idea.category, context.categories),
        itemKind: idea.itemKind === "experience" ? ("experience" as const) : ("product" as const),
      }))
      .filter((idea) => {
        const key = idea.title.toLowerCase();
        if (!idea.title || existing.has(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, input.count);
    return { items };
  }

  async thankYouNotes(userId: string, input: z.infer<typeof thankYouNotesSchema>): Promise<{ items: ThankYouNote[] }> {
    await this.permissions.requireRole(input.experienceId, userId, MANAGERS);
    this.llm.requireAvailable();
    const experience = await this.experience(input.experienceId);
    const gifts = await this.prisma.experienceItem.findMany({
      where: {
        experienceId: input.experienceId,
        OR: [{ reservations: { some: { status: "active" } } }, { contributions: { some: {} } }],
      },
      select: { id: true, title: true, isGroupGift: true },
      orderBy: { sortOrder: "asc" },
      take: 40,
    });
    if (gifts.length === 0) return { items: [] };
    await this.llm.consume(userId, "thank-you");
    const result = await this.llm.json<{ notes: Array<{ itemId: string; message: string }> }>({
      name: "thank_you_notes",
      system: [
        `Write a short thank-you message for each gift, from the hosts to whoever gave it. Language: ${languageNames[input.locale]}. Tone: ${toneHint[input.tone]}.`,
        "Two sentences at most, under 40 words. Mention the gift naturally. The giver's name is unknown: do not use a name or a placeholder. Group gifts thank several people.",
        "Return one note per gift and copy each itemId exactly.",
      ].join("\n"),
      payload: { event: this.facts(experience), gifts: gifts.map((gift) => ({ itemId: gift.id, title: gift.title, groupGift: gift.isGroupGift })) },
      schema: s.object({ notes: s.array(s.object({ itemId: s.string, message: s.string })) }),
      temperature: 0.7,
    });
    if (!result?.notes?.length) this.unavailable();
    const byId = new Map(gifts.map((gift) => [gift.id, gift]));
    const items = result.notes
      .filter((note) => byId.has(note.itemId) && note.message?.trim())
      .map((note) => ({ itemId: note.itemId, title: byId.get(note.itemId)!.title, message: cleanLine(note.message, 400) }));
    return { items };
  }

  async santaIdeas(userId: string, input: z.infer<typeof santaIdeasSchema>): Promise<{ items: SantaGiftIdea[] }> {
    await this.permissions.requireMember(input.experienceId, userId);
    this.llm.requireAvailable();
    const draw = await this.prisma.secretSantaDraw.findUnique({ where: { experienceId: input.experienceId } });
    if (!draw) throw new NotFoundException({ code: "NOT_FOUND", message: "Secret Santa not found." });
    const me = await this.prisma.secretSantaParticipant.findUnique({ where: { drawId_userId: { drawId: draw.id, userId } } });
    const assignment = me
      ? await this.prisma.secretSantaAssignment.findUnique({
          where: { giverParticipantId: me.id },
          select: { recipient: { select: { wishlist: true } } },
        })
      : null;
    if (!assignment) {
      throw new BadRequestException({ code: "NO_ASSIGNMENT", message: "Gift ideas are available after the draw." });
    }
    await this.llm.consume(userId, "santa-ideas");
    const wishlist = asRecord(assignment.recipient.wishlist).items;
    const result = await this.llm.json<{ ideas: Array<{ title: string; note: string }> }>({
      name: "santa_ideas",
      system: [
        `Suggest 6 Secret Santa gift ideas for one person. Language: ${languageNames[input.locale]}.`,
        "Build on their wishlist when there is one, otherwise suggest safe, thoughtful gifts. Respect the budget. Title 2 to 6 words, note one short sentence. No brands, shops or prices.",
      ].join("\n"),
      payload: {
        budget: draw.budgetCents ? { amount: draw.budgetCents / 100, currency: draw.currency } : null,
        wishlist: Array.isArray(wishlist) ? wishlist.slice(0, 20) : [],
      },
      schema: s.object({ ideas: s.array(s.object({ title: s.string, note: s.string })) }),
      temperature: 0.8,
    });
    if (!result?.ideas?.length) this.unavailable();
    return {
      items: result.ideas
        .map((idea) => ({ title: cleanLine(idea.title, 120), note: cleanLine(idea.note, 240) }))
        .filter((idea) => idea.title)
        .slice(0, 8),
    };
  }

  async message(userId: string, input: z.infer<typeof aiMessageSchema>) {
    await this.permissions.requireRole(input.experienceId, userId, MANAGERS);
    this.llm.requireAvailable();
    const experience = await this.experience(input.experienceId);
    let santa: Record<string, unknown> | null = null;
    if (input.purpose === "santa_invite") {
      const draw = await this.prisma.secretSantaDraw.findUnique({ where: { experienceId: input.experienceId } });
      santa = draw
        ? {
            budget: draw.budgetCents ? `${draw.budgetCents / 100} ${draw.currency}` : null,
            drawDate: dateOnly(draw.drawDate),
            giftDeadline: dateOnly(draw.purchaseDeadline),
          }
        : null;
    }
    await this.llm.consume(userId, `message-${input.purpose}`);
    const goal =
      input.purpose === "share"
        ? "Write a short message (at most 45 words) that the host sends with the page link in WhatsApp, Viber or email, inviting people to open the page."
        : "Write a short Secret Santa invitation (at most 70 words) that explains how it works: join with the link, add a wishlist, wait for the draw, everyone sees only their own match. Mention budget and dates only if provided.";
    const result = await this.llm.json<{ text: string }>({
      name: "share_message",
      system: `${goal} Language: ${languageNames[input.locale]}. Tone: ${toneHint[input.tone]}. Do not include a URL or placeholder; the link is added separately. At most one emoji.`,
      payload: { event: this.facts(experience), secretSanta: santa },
      schema: s.object({ text: s.string }),
      temperature: 0.7,
    });
    const text = (result?.text ?? "").trim().slice(0, 1000);
    if (!text) this.unavailable();
    return { text, aiUsed: true };
  }

  async checklist(userId: string, input: z.infer<typeof checklistSchema>): Promise<{ items: ChecklistSuggestion[] }> {
    const member = await this.permissions.requireMember(input.experienceId, userId);
    if (member.role === "viewer") throw new ForbiddenException({ code: "FORBIDDEN", message: "Viewers cannot add tasks." });
    this.llm.requireAvailable();
    const experience = await this.experience(input.experienceId);
    const tasks = await this.prisma.task.findMany({ where: { experienceId: input.experienceId }, select: { title: true, category: true } });
    const categories = [...new Set(tasks.map((task) => task.category).filter((value): value is string => Boolean(value)))];
    await this.llm.consume(userId, "checklist");
    const today = new Date();
    const result = await this.llm.json<{ tasks: Array<{ title: string; category: string | null; priority: string; dueInDays: number | null }> }>({
      name: "checklist",
      system: [
        `Turn the request into a practical checklist of 8 to 20 tasks. Language: ${languageNames[input.locale]}.`,
        "Titles are short actions (2 to 8 words). Group tasks with short categories, reusing existing ones when they fit.",
        "dueInDays is the number of days from today when the task should be done, or null. Tasks must be due on or before the event date when one is given.",
        "Do not repeat existing tasks.",
      ].join("\n"),
      payload: {
        request: input.prompt,
        today: today.toISOString().slice(0, 10),
        event: this.facts(experience),
        existingTasks: tasks.map((task) => task.title).slice(0, 120),
        categories,
      },
      schema: s.object({
        tasks: s.array(s.object({ title: s.string, category: s.nullableString, priority: s.priority, dueInDays: s.nullableNumber })),
      }),
      temperature: 0.5,
    });
    if (!result?.tasks?.length) this.unavailable();
    const existing = new Set(tasks.map((task) => task.title.toLowerCase()));
    const items = result.tasks
      .map((task) => ({
        title: cleanLine(task.title, 200),
        category: cleanCategory(task.category, categories),
        priority: priorityFrom(task.priority),
        dueDate: dueDateFrom(task.dueInDays, today, experience.eventDate),
      }))
      .filter((task) => task.title && !existing.has(task.title.toLowerCase()))
      .slice(0, 25);
    return { items };
  }

  async tidyTasks(userId: string, input: z.infer<typeof tidyTasksSchema>): Promise<TaskTidyResult> {
    await this.permissions.requireRole(input.experienceId, userId, MANAGERS);
    this.llm.requireAvailable();
    const tasks = await this.prisma.task.findMany({
      where: { experienceId: input.experienceId },
      select: { id: true, title: true, category: true, status: true },
      orderBy: { sortOrder: "asc" },
      take: 200,
    });
    if (tasks.length === 0) return { categories: [], duplicateIds: [] };
    const known = [...new Set(tasks.map((task) => task.category).filter((value): value is string => Boolean(value)))];
    await this.llm.consume(userId, "tidy-tasks");
    const result = await this.llm.json<{ categories: Array<{ taskId: string; category: string }>; duplicateGroups: string[][] }>({
      name: "tidy_tasks",
      system: [
        `Organise this task list. Language for new category names: ${languageNames[input.locale]}.`,
        "Give every task without a category a short category, reusing existing categories where possible (at most 8 categories in total).",
        "duplicateGroups lists groups of task ids that mean the same thing. Only include true duplicates. Copy ids exactly.",
      ].join("\n"),
      payload: { tasks: tasks.map((task) => ({ id: task.id, title: task.title, category: task.category })), categories: known },
      schema: s.object({
        categories: s.array(s.object({ taskId: s.string, category: s.string })),
        duplicateGroups: s.array(s.array(s.string)),
      }),
      temperature: 0.2,
    });
    if (!result) this.unavailable();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const categories = (result.categories ?? [])
      .filter((entry) => byId.has(entry.taskId) && !byId.get(entry.taskId)!.category)
      .map((entry) => ({ taskId: entry.taskId, category: cleanCategory(entry.category, known) }))
      .filter((entry): entry is { taskId: string; category: string } => Boolean(entry.category));
    const duplicateIds = new Set<string>();
    for (const group of result.duplicateGroups ?? []) {
      const valid = [...new Set(group)].filter((id) => byId.has(id));
      if (valid.length < 2) continue;
      const keep = valid.find((id) => byId.get(id)!.status === "open") ?? valid[0]!;
      for (const id of valid) if (id !== keep) duplicateIds.add(id);
    }
    return { categories: categories.filter((entry) => !duplicateIds.has(entry.taskId)), duplicateIds: [...duplicateIds] };
  }

  private async writeCard(
    source: { title: string | null; description: string | null; url: string },
    context: Awaited<ReturnType<AiService["giftContext"]>> | null,
    locale: Locale,
  ): Promise<ProductCopy | null> {
    if (!source.title) return null;
    const result = await this.llm.json<ProductCopy>({
      name: "product_card",
      system: ["Write a gift card from the supplied product page facts.", this.cardRules(context, locale)].join("\n"),
      payload: source,
      schema: s.object({ title: s.string, description: s.nullableString, category: s.nullableString, priority: s.priority }),
      temperature: 0.2,
    });
    if (!result?.title?.trim()) return null;
    return {
      title: cleanLine(result.title, 200),
      description: cleanLine(result.description, 600) || null,
      category: cleanCategory(result.category, context?.categories ?? []),
      priority: priorityFrom(result.priority),
    };
  }

  private cardRules(context: Awaited<ReturnType<AiService["giftContext"]>> | null, locale: Locale) {
    return [
      `Language: ${languageNames[locale]}. The registry is for: ${context ? `${context.experience.template} "${context.experience.title}"` : "a celebration"}.`,
      "title is short and plain, 2 to 6 words, without SKU codes, sizes or slogans. description is one or two calm sentences (at most 30 words) about why it is a good gift, without prices or sales language.",
      `category: one of ${JSON.stringify(context?.categories ?? [])} when it fits, otherwise a short new category, or null.`,
      "priority is medium unless the product is clearly essential (high) or a small extra (low).",
    ].join("\n");
  }

  private async giftContext(experienceId: string) {
    const experience = await this.experience(experienceId);
    const items = await this.prisma.experienceItem.findMany({
      where: { experienceId },
      select: { title: true, category: true },
      orderBy: { sortOrder: "asc" },
      take: 200,
    });
    const sections = asRecord(experience.config).sections;
    const categories = [
      ...new Set([
        ...items.map((item) => item.category).filter((value): value is string => Boolean(value)),
        ...(Array.isArray(sections) ? sections.filter((value): value is string => typeof value === "string") : []),
      ]),
    ].slice(0, 20);
    return { experience, titles: items.map((item) => item.title), categories };
  }

  private async experience(id: string): Promise<Experience> {
    const experience = await this.prisma.experience.findUnique({ where: { id } });
    if (!experience) throw new NotFoundException({ code: "NOT_FOUND", message: "Experience not found." });
    return experience;
  }

  private facts(experience: Experience) {
    return {
      template: experience.template,
      title: experience.title,
      description: experience.description.slice(0, 1000),
      eventDate: dateOnly(experience.eventDate),
      details: experience.config,
    };
  }

  private unavailable(): never {
    throw new ServiceUnavailableException({
      code: "AI_UNAVAILABLE",
      message: "AI could not answer right now. Please try again.",
    });
  }

  private async fetchPage(rawUrl: string) {
    let current = await assertSafeUrl(rawUrl);
    for (let redirect = 0; redirect < 3; redirect += 1) {
      const response = await fetch(current.toString(), {
        redirect: "manual",
        signal: AbortSignal.timeout(8_000),
        headers: { accept: "text/html,application/xhtml+xml", "user-agent": "GatherlyBot/1.0" },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new UnsafeUrlError("The page redirect was invalid.");
        current = await assertSafeUrl(new URL(location, current).toString());
        continue;
      }
      if (!response.ok) throw new Error("Fetch failed");
      const html = await readLimited(response, MAX_HTML_BYTES);
      return { html, finalUrl: current.toString() };
    }
    throw new UnsafeUrlError("Too many redirects.");
  }
}
