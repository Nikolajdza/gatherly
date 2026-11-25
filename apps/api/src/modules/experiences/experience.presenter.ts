import { activeReservation, presentReservation, type ExperienceDetail, type ExperienceSummary, type MemberRole, type PublicItem } from "@gatherly/shared";
import { asRecord, dateOnly } from "../../common/http";

type StoredReservation = {
  id: string;
  userId: string;
  status: "active" | "cancelled";
  quantity: number;
  note: string;
  createdAt: Date;
  cancelledAt: Date | null;
  user?: { displayName: string } | null;
};

type StoredContribution = { amountCents: number };

export type StoredItem = {
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
  sortOrder: number;
  reservations: StoredReservation[];
  contributions: StoredContribution[];
};

export type StoredExperience = {
  id: string;
  ownerId: string;
  type: ExperienceSummary["type"];
  template: string;
  templateVersion: number;
  title: string;
  slug: string;
  description: string;
  status: ExperienceSummary["status"];
  visibility: ExperienceSummary["visibility"];
  eventDate: Date | null;
  timezone: string;
  coverImageUrl: string | null;
  config: unknown;
  themeConfig: unknown;
  thankYouMode?: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner?: { plan?: "free" | "pro" } | null;
};

export function presentItem(
  item: StoredItem,
  viewerId?: string | null,
  options?: { role?: MemberRole | null; thankYouMode?: boolean },
): PublicItem {
  const active = activeReservation(
    item.reservations.map((reservation) => ({
      ...reservation,
      createdAt: reservation.createdAt.toISOString(),
      cancelledAt: reservation.cancelledAt?.toISOString() ?? null,
    })),
  );
  const thankYouReveal = Boolean(options?.thankYouMode);
  const shown = active
    ? presentReservation(active, {
        userId: viewerId,
        role: options?.role ?? null,
        thankYouReveal,
      })
    : null;
  const reserverName =
    shown?.reserver && thankYouReveal && (options?.role === "owner" || options?.role === "editor")
      ? item.reservations.find((row) => row.id === active?.id)?.user?.displayName ?? null
      : null;
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    url: item.url,
    imageUrl: item.imageUrl,
    priceCents: item.priceCents,
    currency: item.currency,
    category: item.category,
    priority: item.priority,
    quantity: item.quantity,
    itemKind: item.itemKind,
    isGroupGift: item.isGroupGift,
    targetAmountCents: item.targetAmountCents,
    pledgedCents: item.contributions.reduce((sum, pledge) => sum + pledge.amountCents, 0),
    sortOrder: item.sortOrder,
    reserved: Boolean(active),
    reservation: shown
      ? {
          id: shown.id,
          status: shown.status,
          quantity: shown.quantity,
          mine: Boolean(viewerId && active && active.userId === viewerId),
          reserverName,
        }
      : null,
  };
}

export function presentSummary(experience: StoredExperience, role: ExperienceSummary["role"]): ExperienceSummary {
  const plan = experience.owner?.plan ?? "free";
  return {
    id: experience.id,
    ownerId: experience.ownerId,
    type: experience.type,
    template: experience.template,
    templateVersion: experience.templateVersion,
    title: experience.title,
    slug: experience.slug,
    description: experience.description,
    status: experience.status,
    visibility: experience.visibility,
    eventDate: dateOnly(experience.eventDate),
    timezone: experience.timezone,
    coverImageUrl: experience.coverImageUrl,
    role,
    thankYouMode: Boolean(experience.thankYouMode),
    showWatermark: plan !== "pro",
    createdAt: experience.createdAt.toISOString(),
    updatedAt: experience.updatedAt.toISOString(),
  };
}

export function presentDetail(
  experience: StoredExperience & { items: StoredItem[] },
  role: ExperienceSummary["role"],
  viewerId: string | null,
  memberCount: number,
): ExperienceDetail {
  return {
    ...presentSummary(experience, role),
    config: asRecord(experience.config),
    themeConfig: asRecord(experience.themeConfig),
    items: experience.items.map((item) =>
      presentItem(item, viewerId, { role, thankYouMode: Boolean(experience.thankYouMode) }),
    ),
    memberCount,
  };
}

export function canReadExperience(
  experience: Pick<StoredExperience, "status" | "visibility">,
  role: ExperienceSummary["role"],
): boolean {
  if (experience.status === "archived") {
    return role === "owner" || role === "editor";
  }
  // Invited members can always reopen their experience (including draft while the host prepares).
  if (role !== null) return true;
  if (experience.status === "draft") return false;
  if (experience.visibility === "public" || experience.visibility === "unlisted") return true;
  return false;
}
