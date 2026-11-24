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

/** Owners and other guests see that a gift is taken. Only the person who reserved it sees their identity. */
export function presentReservation(
  reservation: ReservationRecord,
  viewer: ReservationViewer,
): PublicReservation {
  const identityVisible = Boolean(viewer.userId && viewer.userId === reservation.userId);
  return {
    id: identityVisible ? reservation.id : null,
    status: reservation.status,
    quantity: reservation.quantity,
    note: identityVisible ? reservation.note : null,
    createdAt: reservation.createdAt,
    cancelledAt: reservation.cancelledAt,
    reserver: identityVisible ? { id: reservation.userId } : null,
  };
}

export function activeReservation(reservations: ReservationRecord[]): ReservationRecord | null {
  return reservations.find((reservation) => reservation.status === "active") ?? null;
}
