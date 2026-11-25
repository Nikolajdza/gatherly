import type { MemberRole } from "./schemas";

const rank: Record<MemberRole, number> = {
  viewer: 1,
  participant: 2,
  editor: 3,
  owner: 4,
};

export function roleAtLeast(role: MemberRole, minimum: MemberRole): boolean {
  return rank[role] >= rank[minimum];
}

export function higherRole(left: MemberRole, right: MemberRole): MemberRole {
  return rank[left] >= rank[right] ? left : right;
}

export const rolePermissions = {
  deleteExperience: ["owner"],
  manageMembers: ["owner"],
  editContent: ["owner", "editor"],
  invite: ["owner", "editor"],
  drawSecretSanta: ["owner"],
  participate: ["owner", "editor", "participant"],
} as const satisfies Record<string, readonly MemberRole[]>;

export function roleAllowed(role: MemberRole, allowed: readonly MemberRole[]): boolean {
  return allowed.includes(role);
}

export type ReservationViewer = {
  userId?: string | null;
  role?: MemberRole | null;
};

export type ReservationRecord = {
  id: string;
  userId: string;
  status: "active" | "cancelled";
  quantity: number;
  note: string;
  createdAt: string;
  cancelledAt: string | null;
};

export type PublicReservation = {
  id: string | null;
  status: "active" | "cancelled";
  quantity: number;
  note: string | null;
  createdAt: string;
  cancelledAt: string | null;
  reserver: { id: string } | null;
};

export type ReservationPresentOptions = ReservationViewer & {
  /** Host opted into thank-you mode: owners/editors may see who reserved. */
  thankYouReveal?: boolean;
};

/** Guests see that a gift is taken. Reserver identity is private unless it is theirs or thank-you mode reveals it to hosts. */
export function presentReservation(
  reservation: ReservationRecord,
  viewer: ReservationPresentOptions,
): PublicReservation {
  const isMine = Boolean(viewer.userId && viewer.userId === reservation.userId);
  const hostReveal =
    Boolean(viewer.thankYouReveal) &&
    (viewer.role === "owner" || viewer.role === "editor");
  const identityVisible = isMine || hostReveal;
  return {
    id: isMine ? reservation.id : hostReveal ? reservation.id : null,
    status: reservation.status,
    quantity: reservation.quantity,
    note: isMine ? reservation.note : null,
    createdAt: reservation.createdAt,
    cancelledAt: reservation.cancelledAt,
    reserver: identityVisible ? { id: reservation.userId } : null,
  };
}

export function activeReservation(reservations: ReservationRecord[]): ReservationRecord | null {
  return reservations.find((reservation) => reservation.status === "active") ?? null;
}
