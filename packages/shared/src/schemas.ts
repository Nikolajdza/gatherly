import { z } from "zod";

export const experienceTypes = ["gift_registry", "secret_santa", "task_list"] as const;
export const visibilities = ["private", "unlisted", "public", "invite_only"] as const;
export const experienceStatuses = ["draft", "active", "archived"] as const;
export const memberRoles = ["owner", "editor", "participant", "viewer"] as const;
export const locales = ["en", "sr", "ru", "it", "de", "es", "fr"] as const;
export const currencies = ["EUR", "RSD", "USD", "GBP", "RUB"] as const;

export type ExperienceType = (typeof experienceTypes)[number];
export type Visibility = (typeof visibilities)[number];
export type ExperienceStatus = (typeof experienceStatuses)[number];
export type MemberRole = (typeof memberRoles)[number];
export type Locale = (typeof locales)[number];

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Only http and https URLs are allowed");

export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const themeConfigSchema = z.object({
  preset: z.enum(["blush", "celebration", "ivory", "festive", "ink", "custom"]),
  primary: hexColorSchema,
  accent: hexColorSchema,
  background: hexColorSchema,
  font: z.enum(["serif", "sans", "display"]),
  card: z.enum(["soft", "outlined", "elevated"]),
  radius: z.enum(["sm", "md", "lg"]),
  decorative: z.enum(["none", "botanical", "confetti", "rings", "snow"]),
});

export type ThemeConfig = z.infer<typeof themeConfigSchema>;

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");

export const babyShowerConfigSchema = z.object({
  version: z.literal(1).default(1),
  babyName: text(80),
  motherName: text(80),
  fatherName: optionalText(80),
  expectedDate: isoDateSchema.nullable().optional(),
  welcomeMessage: optionalText(2000),
  showCountdown: z.boolean().default(true),
  sections: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
});

export const birthdayConfigSchema = z.object({
  version: z.literal(1).default(1),
  celebrantName: text(80),
  birthdayDate: isoDateSchema.nullable().optional(),
  age: z.number().int().min(0).max(130).nullable().optional(),
  welcomeMessage: optionalText(2000),
  showBudget: z.boolean().default(false),
});

export const weddingConfigSchema = z.object({
  version: z.literal(1).default(1),
  partnerOneName: text(80),
  partnerTwoName: text(80),
  weddingDate: isoDateSchema.nullable().optional(),
  story: optionalText(4000),
  welcomeMessage: optionalText(2000),
  allowGroupGifts: z.boolean().default(true),
});

export const anniversaryConfigSchema = z.object({
  version: z.literal(1).default(1),
  partnerOneName: text(80),
  partnerTwoName: text(80),
  anniversaryDate: isoDateSchema.nullable().optional(),
  message: optionalText(2000),
});

export const valentinesConfigSchema = anniversaryConfigSchema;
export const christmasConfigSchema = z.object({
  version: z.literal(1).default(1),
  householdName: text(80),
  celebrationDate: isoDateSchema.nullable().optional(),
  welcomeMessage: optionalText(2000),
  showBudget: z.boolean().default(true),
});

export const housewarmingConfigSchema = z.object({
  version: z.literal(1).default(1),
  hosts: text(120),
  addressNote: optionalText(200),
  moveInDate: isoDateSchema.nullable().optional(),
  welcomeMessage: optionalText(2000),
});

export const graduationConfigSchema = z.object({
  version: z.literal(1).default(1),
  graduateName: text(80),
  school: optionalText(120),
  graduationDate: isoDateSchema.nullable().optional(),
  welcomeMessage: optionalText(2000),
});

export const secretSantaConfigSchema = z.object({
  version: z.literal(1).default(1),
  budgetCents: z.number().int().positive().nullable().optional(),
  currency: z.enum(currencies).default("EUR"),
  drawDate: isoDateSchema.nullable().optional(),
  purchaseDeadline: isoDateSchema.nullable().optional(),
  organizerParticipates: z.boolean().default(true),
  rules: optionalText(2000),
});

export const taskListConfigSchema = z.object({
  version: z.literal(1).default(1),
  listKind: z.enum([
    "personal-todo",
    "shared-todo",
    "shopping",
    "grocery",
    "travel",
    "housewarming-planner",
    "party",
  ]),
  notes: optionalText(2000),
});

export const templateConfigSchemas = {
  "baby-shower": babyShowerConfigSchema,
  birthday: birthdayConfigSchema,
  wedding: weddingConfigSchema,
  anniversary: anniversaryConfigSchema,
  valentines: valentinesConfigSchema,
  christmas: christmasConfigSchema,
  housewarming: housewarmingConfigSchema,
  graduation: graduationConfigSchema,
  "secret-santa": secretSantaConfigSchema,
  "personal-todo": taskListConfigSchema,
  "shared-todo": taskListConfigSchema,
  shopping: taskListConfigSchema,
  grocery: taskListConfigSchema,
  travel: taskListConfigSchema,
  "housewarming-planner": taskListConfigSchema,
  party: taskListConfigSchema,
} as const;

export type TemplateId = keyof typeof templateConfigSchemas;

export const itemInputSchema = z.object({
  title: text(200),
  description: optionalText(5000),
  url: httpUrlSchema.nullable().optional(),
  imageUrl: httpUrlSchema.nullable().optional(),
  priceCents: z.number().int().nonnegative().nullable().optional(),
  currency: z.enum(currencies).nullable().optional(),
  category: z.string().trim().max(80).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  quantity: z.number().int().positive().max(99).default(1),
  itemKind: z.enum(["product", "experience"]).default("product"),
  isGroupGift: z.boolean().default(false),
  targetAmountCents: z.number().int().positive().nullable().optional(),
});

export const itemPatchSchema = z
  .object({
    title: text(200).optional(),
    description: z.string().trim().max(5000).optional(),
    url: httpUrlSchema.nullable().optional(),
    imageUrl: httpUrlSchema.nullable().optional(),
    priceCents: z.number().int().nonnegative().nullable().optional(),
    currency: z.enum(currencies).nullable().optional(),
    category: z.string().trim().max(80).nullable().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    quantity: z.number().int().positive().max(99).optional(),
    itemKind: z.enum(["product", "experience"]).optional(),
    isGroupGift: z.boolean().optional(),
    targetAmountCents: z.number().int().positive().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No changes.");

export const reorderItemsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).max(500),
});

export const reservationInputSchema = z.object({
  quantity: z.number().int().positive().max(99).default(1),
  note: optionalText(500),
});

export const pledgeInputSchema = z.object({
  amountCents: z.number().int().positive(),
  note: optionalText(500),
});

export const createExperienceSchema = z.object({
  type: z.enum(experienceTypes),
  template: z.string().min(1).max(80),
  title: text(120),
  description: optionalText(5000),
  status: z.enum(experienceStatuses).default("active"),
  visibility: z.enum(visibilities).default("unlisted"),
  eventDate: isoDateSchema.nullable().optional(),
  timezone: z.string().trim().min(1).max(80).default("Europe/Belgrade"),
  coverImageUrl: httpUrlSchema.nullable().optional(),
  config: z.record(z.unknown()).default({}),
  themeConfig: themeConfigSchema.partial().optional(),
});

export const updateExperienceSchema = z
  .object({
    title: text(120).optional(),
    description: z.string().trim().max(5000).optional(),
    status: z.enum(experienceStatuses).optional(),
    visibility: z.enum(visibilities).optional(),
    eventDate: isoDateSchema.nullable().optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
    coverImageUrl: httpUrlSchema.nullable().optional(),
    config: z.record(z.unknown()).optional(),
    themeConfig: themeConfigSchema.partial().optional(),
    thankYouMode: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No changes.");

export const createInvitesBulkSchema = z.object({
  role: z.enum(["editor", "participant", "viewer"]),
  emails: z.array(z.string().trim().email()).min(1).max(40),
  expiresInDays: z.number().int().min(1).max(90).default(14),
});

export const sendThankYouSchema = z.object({
  note: text(2000),
  onlyReserved: z.boolean().default(true),
});

/** Soft free-tier cap for active owned experiences. */
export const FREE_ACTIVE_EXPERIENCE_LIMIT = 2;

export const updateProfileSchema = z.object({
  displayName: text(80),
  avatarUrl: httpUrlSchema.nullable().optional(),
  preferredLanguage: z.enum(locales),
  timezone: z.string().trim().min(1).max(80),
});

export const createInviteSchema = z.object({
  role: z.enum(["editor", "participant", "viewer"]),
  email: z.string().email().nullable().optional(),
  expiresInDays: z.number().int().min(1).max(90).default(14),
});

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(20).max(200),
});

/** Guest joins with name + email — no full product registration / password. */
export const claimInviteSchema = z.object({
  token: z.string().trim().min(20).max(200),
  displayName: text(80),
  email: z.string().trim().email().max(200),
});

export const updateMemberSchema = z.object({
  role: z.enum(["editor", "participant", "viewer"]),
});

export const secretSantaSettingsSchema = z.object({
  budgetCents: z.number().int().positive().nullable().optional(),
  currency: z.enum(currencies).default("EUR"),
  drawDate: isoDateSchema.nullable().optional(),
  purchaseDeadline: isoDateSchema.nullable().optional(),
  organizerParticipates: z.boolean().default(true),
});

export const wishlistItemSchema = z.object({
  title: text(200),
  note: optionalText(500),
  url: httpUrlSchema.nullable().optional(),
});

export const updateWishlistSchema = z.object({
  items: z.array(wishlistItemSchema).max(50),
});

export const exclusionSchema = z.object({
  participantAId: z.string().uuid(),
  participantBId: z.string().uuid(),
});

export const taskPatchSchema = z
  .object({
    title: text(200).optional(),
    notes: z.string().trim().max(5000).optional(),
    parentId: z.string().uuid().nullable().optional(),
    status: z.enum(["open", "done"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    category: z.string().trim().max(80).nullable().optional(),
    dueDate: isoDateSchema.nullable().optional(),
    labels: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
    assigneeIds: z.array(z.string().uuid()).max(20).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No changes.");

export const taskInputSchema = z.object({
  title: text(200),
  notes: optionalText(5000),
  parentId: z.string().uuid().nullable().optional(),
  status: z.enum(["open", "done"]).default("open"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().trim().max(80).nullable().optional(),
  dueDate: isoDateSchema.nullable().optional(),
  labels: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  assigneeIds: z.array(z.string().uuid()).max(20).default([]),
});

export const aiTones = ["warm", "formal", "playful"] as const;
export type AiTone = (typeof aiTones)[number];

const aiTarget = {
  experienceId: z.string().uuid(),
  locale: z.enum(locales).default("en"),
};

export const extractProductSchema = z.object({
  url: httpUrlSchema,
  experienceId: z.string().uuid().optional(),
  locale: z.enum(locales).default("en"),
});

export const productFromTextSchema = z.object({
  ...aiTarget,
  text: z.string().trim().min(20).max(12_000),
  url: httpUrlSchema.nullable().optional(),
});

export const eventDescriptionSchema = z.object({
  ...aiTarget,
  tone: z.enum(aiTones).default("warm"),
});

export const giftIdeasSchema = z.object({
  ...aiTarget,
  prompt: optionalText(300),
  budgetCents: z.number().int().positive().nullable().optional(),
  count: z.number().int().min(3).max(12).default(8),
});

export const thankYouNotesSchema = z.object({
  ...aiTarget,
  tone: z.enum(aiTones).default("warm"),
});

export const santaIdeasSchema = z.object(aiTarget);

export const aiMessageSchema = z.object({
  ...aiTarget,
  purpose: z.enum(["share", "santa_invite"]),
  tone: z.enum(aiTones).default("warm"),
});

export const checklistSchema = z.object({
  ...aiTarget,
  prompt: text(400),
});

export const tidyTasksSchema = z.object(aiTarget);

export const signUploadSchema = z.object({
  kind: z.enum(["avatar", "cover", "gallery", "attachment"]),
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  sizeBytes: z.number().int().positive().max(8 * 1024 * 1024),
  experienceId: z.string().uuid().nullable().optional(),
});

export type ItemInput = z.infer<typeof itemInputSchema>;
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type TaskInput = z.infer<typeof taskInputSchema>;
