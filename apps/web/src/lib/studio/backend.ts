import type {
  AiText,
  AiTone,
  ChecklistSuggestion,
  GiftIdea,
  Locale,
  SantaGiftIdea,
  TaskTidyResult,
  ThankYouNote,
  CreatedInvite,
  ExperienceDetail,
  InviteRecord,
  ItemInput,
  MemberRecord,
  ProductPreview,
  PublicItem,
  SecretSantaView,
  TaskInput,
  TaskRecord,
  UpdateExperienceInput,
} from "@gatherly/shared";

export type InviteInput = { role: "editor" | "participant" | "viewer"; email?: string | null; expiresInDays?: number };
export type SantaSettings = {
  budgetCents?: number | null;
  currency?: "EUR" | "RSD" | "USD" | "GBP" | "RUB";
  drawDate?: string | null;
  purchaseDeadline?: string | null;
  organizerParticipates?: boolean;
};
export type WishItem = { title: string; note?: string; url?: string | null };

export type BackendErrorCode =
  | "NOT_CONFIGURED"
  | "UNAUTHENTICATED"
  | "CONFLICT"
  | "DRAW_IMPOSSIBLE"
  | "NEED_MORE"
  | "UNAVAILABLE"
  | "AI_UNAVAILABLE"
  | "AI_LIMIT"
  | "NO_ASSIGNMENT"
  | "FETCH_FAILED"
  | "UNKNOWN";

export class BackendError extends Error {
  constructor(public readonly code: BackendErrorCode, message?: string) {
    super(message ?? code);
    this.name = "BackendError";
  }
}

export interface StudioBackend {
  readonly mode: "live" | "demo";
  readonly experienceId: string;
  /** Path of the public page for the current mode, without locale prefix. */
  publicPath(slug: string): string;

  getExperience(): Promise<ExperienceDetail>;
  updateExperience(body: UpdateExperienceInput): Promise<ExperienceDetail>;
  deleteExperience(): Promise<void>;

  createItem(body: ItemInput & { aiImportId?: string }): Promise<PublicItem>;
  updateItem(itemId: string, body: Partial<ItemInput>): Promise<PublicItem>;
  removeItem(itemId: string): Promise<void>;
  reorderItems(orderedIds: string[]): Promise<void>;

  reserve(itemId: string): Promise<void>;
  cancelReservation(reservationId: string): Promise<void>;
  pledge(itemId: string, amountCents: number): Promise<void>;

  listMembers(): Promise<MemberRecord[]>;
  updateMember(userId: string, role: "editor" | "participant" | "viewer"): Promise<void>;
  removeMember(userId: string): Promise<void>;
  listInvites(): Promise<InviteRecord[]>;
  createInvite(body: InviteInput): Promise<CreatedInvite>;
  createInvitesBulk(body: { role: InviteInput["role"]; emails: string[]; expiresInDays?: number }): Promise<{
    items: CreatedInvite[];
    created: number;
    emailed: number;
  }>;
  sendThankYou(body: { note: string; onlyReserved?: boolean }): Promise<{ sent: number; recipients: number }>;
  revokeInvite(id: string): Promise<void>;

  getSanta(): Promise<SecretSantaView>;
  updateSanta(body: SantaSettings): Promise<SecretSantaView>;
  joinSanta(): Promise<SecretSantaView>;
  leaveSanta(participantId: string): Promise<SecretSantaView>;
  saveWishlist(items: WishItem[]): Promise<SecretSantaView>;
  addExclusion(participantAId: string, participantBId: string): Promise<SecretSantaView>;
  removeExclusion(exclusionId: string): Promise<SecretSantaView>;
  draw(): Promise<SecretSantaView>;
  lock(): Promise<SecretSantaView>;

  listTasks(): Promise<TaskRecord[]>;
  createTask(body: Partial<TaskInput> & { title: string }): Promise<TaskRecord>;
  updateTask(taskId: string, body: Partial<TaskInput>): Promise<TaskRecord>;
  removeTask(taskId: string): Promise<void>;

  extractProduct(url: string, locale: Locale): Promise<ProductPreview>;
  productFromText(text: string, url: string | null, locale: Locale): Promise<ProductPreview>;
  describe(tone: AiTone, locale: Locale): Promise<{ description: string; aiUsed: boolean }>;
  giftIdeas(input: { prompt?: string; budgetCents?: number | null }, locale: Locale): Promise<GiftIdea[]>;
  thankYouNotes(tone: AiTone, locale: Locale): Promise<ThankYouNote[]>;
  santaIdeas(locale: Locale): Promise<SantaGiftIdea[]>;
  aiMessage(purpose: "share" | "santa_invite", tone: AiTone, locale: Locale): Promise<AiText>;
  checklist(prompt: string, locale: Locale): Promise<ChecklistSuggestion[]>;
  tidyTasks(locale: Locale): Promise<TaskTidyResult>;
  /** Returns a public URL for the uploaded cover, or null when uploads are unavailable. */
  uploadCover(file: File): Promise<string | null>;
}

export function canManage(experience: Pick<ExperienceDetail, "role">) {
  return experience.role === "owner" || experience.role === "editor";
}
