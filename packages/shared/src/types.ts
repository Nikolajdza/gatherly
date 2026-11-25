import type { ExperienceStatus, ExperienceType, Locale, MemberRole, Visibility } from "./schemas";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type PlanTier = "free" | "pro";

export type Profile = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  preferredLanguage: Locale;
  timezone: string;
  plan: PlanTier;
};

export type ExperienceSummary = {
  id: string;
  ownerId: string;
  type: ExperienceType;
  template: string;
  templateVersion: number;
  title: string;
  slug: string;
  description: string;
  status: ExperienceStatus;
  visibility: Visibility;
  eventDate: string | null;
  timezone: string;
  coverImageUrl: string | null;
  role: MemberRole | null;
  thankYouMode: boolean;
  /** Free plan shows “Made with Gatherly”; Pro hides it. */
  showWatermark: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicItem = {
  id: string;
  title: string;
  description: string;
  url: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  currency: string | null;
  category: string | null;
  priority: "low" | "medium" | "high";
  quantity: number;
  itemKind: "product" | "experience";
  isGroupGift: boolean;
  targetAmountCents: number | null;
  pledgedCents: number;
  sortOrder: number;
  reserved: boolean;
  reservation: {
    id: string | null;
    status: "active" | "cancelled";
    quantity: number;
    mine: boolean;
    /** Present when thank-you mode is on and the viewer may see who reserved. */
    reserverName?: string | null;
  } | null;
};

export type ExperienceDetail = ExperienceSummary & {
  config: Record<string, unknown>;
  themeConfig: Record<string, unknown>;
  items: PublicItem[];
  memberCount: number;
};

export type MemberRecord = {
  id: string;
  userId: string;
  role: MemberRole;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
};

export type InviteRecord = {
  id: string;
  role: Exclude<MemberRole, "owner">;
  email: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
};

export type InvitePreview = {
  experienceTitle: string;
  template: string;
  experienceId: string;
  slug: string;
  experienceType: ExperienceType;
  role: Exclude<MemberRole, "owner">;
  status: InviteRecord["status"];
  expiresAt: string;
  emailRestricted: boolean;
  /** Locked invite email when set (for the guest form). */
  emailHint: string | null;
};

export type InviteJoinResult = {
  experienceId: string;
  slug: string;
  role: MemberRole;
  /** Studio for owners/editors; public page for guests. */
  destination: "studio" | "public";
};

export type InviteClaimResult = InviteJoinResult & {
  needsSignIn: boolean;
  session: { accessToken: string; refreshToken: string } | null;
};

export type CreatedInvite = InviteRecord & { token: string; urlPath: string; emailSent?: boolean };

export type SecretSantaView = {
  id: string;
  status: "open" | "drawn" | "locked";
  budgetCents: number | null;
  currency: string;
  drawDate: string | null;
  purchaseDeadline: string | null;
  organizerParticipates: boolean;
  /** Current viewer — used by the UI to find “me” among participants. */
  viewerUserId: string;
  participants: Array<{
    id: string;
    userId: string;
    displayName: string;
    /** Full wishlist only for the current user; others get a count via wishlist length 0 + wishCount. */
    wishlist: Array<{ title: string; note: string; url: string | null }>;
    wishCount: number;
  }>;
  exclusions: Array<{ id: string; participantAId: string; participantBId: string }>;
  myAssignment: {
    recipientParticipantId: string;
    displayName: string;
    wishlist: Array<{ title: string; note: string; url: string | null }>;
  } | null;
};

export type TaskRecord = {
  id: string;
  parentId: string | null;
  title: string;
  notes: string;
  status: "open" | "done";
  priority: "low" | "medium" | "high";
  category: string | null;
  dueDate: string | null;
  sortOrder: number;
  labels: string[];
  assigneeIds: string[];
};

export type NotificationRecord = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type ProductPreview = {
  importId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  currency: string | null;
  url: string | null;
  category: string | null;
  priority: "low" | "medium" | "high";
  aiUsed: boolean;
  /** True when the price was read from the shop page or the pasted text, never from the model alone. */
  priceFoundOnPage: boolean;
  imageFoundOnPage: boolean;
};

export type GiftIdea = {
  title: string;
  description: string;
  category: string | null;
  itemKind: "product" | "experience";
};

export type ThankYouNote = {
  itemId: string;
  title: string;
  message: string;
};

export type SantaGiftIdea = {
  title: string;
  note: string;
};

export type ChecklistSuggestion = {
  title: string;
  category: string | null;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
};

export type TaskTidyResult = {
  categories: Array<{ taskId: string; category: string }>;
  duplicateIds: string[];
};

export type AiText = {
  text: string;
  aiUsed: boolean;
};

export type UploadTicket = {
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string | null;
};
