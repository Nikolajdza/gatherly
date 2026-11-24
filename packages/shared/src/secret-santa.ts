export class DrawError extends Error {
  constructor(public readonly code: "NEED_MORE_PARTICIPANTS" | "IMPOSSIBLE" | "SEARCH_EXHAUSTED") {
    super(code);
    this.name = "DrawError";
  }
}

export type DrawParticipant = { id: string };
export type DrawExclusion = { a: string; b: string };
export type DrawAssignment = { giverId: string; recipientId: string };

export type RandomInt = (exclusiveMax: number) => number;

const DEFAULT_NODE_BUDGET = 200_000;

export function drawAssignments(
  participants: DrawParticipant[],
  exclusions: DrawExclusion[],
  randomInt: RandomInt,
  nodeBudget = DEFAULT_NODE_BUDGET,
): DrawAssignment[] {
  const ids = [...new Set(participants.map((participant) => participant.id))];
  if (ids.length < 2) throw new DrawError("NEED_MORE_PARTICIPANTS");

  const forbidden = new Map<string, Set<string>>();
  for (const id of ids) forbidden.set(id, new Set([id]));

  for (const exclusion of exclusions) {
    if (!forbidden.has(exclusion.a) || !forbidden.has(exclusion.b)) {
      throw new DrawError("IMPOSSIBLE");
    }
    if (exclusion.a === exclusion.b) throw new DrawError("IMPOSSIBLE");
    forbidden.get(exclusion.a)?.add(exclusion.b);
    forbidden.get(exclusion.b)?.add(exclusion.a);
  }

  for (const id of ids) {
    const options = ids.filter((other) => !forbidden.get(id)?.has(other));
    if (options.length === 0) throw new DrawError("IMPOSSIBLE");
  }

  const order = [...ids].sort((left, right) => {
    const leftOptions = ids.filter((other) => !forbidden.get(left)?.has(other)).length;
    const rightOptions = ids.filter((other) => !forbidden.get(right)?.has(other)).length;
    return leftOptions - rightOptions;
  });

  const used = new Set<string>();
  const result: DrawAssignment[] = [];
  let nodes = 0;

  const shuffle = <T>(values: T[]): T[] => {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(index + 1);
      const current = copy[index];
      const swap = copy[swapIndex];
      if (current === undefined || swap === undefined) continue;
      copy[index] = swap;
      copy[swapIndex] = current;
    }
    return copy;
  };

  const stillPossible = (from: number) => {
    for (let index = from; index < order.length; index += 1) {
      const giver = order[index];
      if (!giver) return false;
      const available = ids.some((id) => !used.has(id) && !forbidden.get(giver)?.has(id));
      if (!available) return false;
    }
    return true;
  };

  const search = (index: number): boolean => {
    if (index === order.length) return true;
    nodes += 1;
    if (nodes > nodeBudget) throw new DrawError("SEARCH_EXHAUSTED");
    const giver = order[index];
    if (!giver) return false;
    const candidates = shuffle(ids.filter((id) => !used.has(id) && !forbidden.get(giver)?.has(id)));
    for (const recipient of candidates) {
      used.add(recipient);
      result.push({ giverId: giver, recipientId: recipient });
      if (stillPossible(index + 1) && search(index + 1)) return true;
      result.pop();
      used.delete(recipient);
    }
    return false;
  };

  if (!search(0)) throw new DrawError("IMPOSSIBLE");
  return result;
}

export function assertValidAssignment(
  participants: DrawParticipant[],
  exclusions: DrawExclusion[],
  assignments: DrawAssignment[],
): void {
  const ids = new Set(participants.map((participant) => participant.id));
  if (assignments.length !== ids.size) throw new DrawError("IMPOSSIBLE");
  const givers = new Set<string>();
  const recipients = new Set<string>();
  const blocked = new Map<string, Set<string>>();
  for (const exclusion of exclusions) {
    if (!blocked.has(exclusion.a)) blocked.set(exclusion.a, new Set());
    if (!blocked.has(exclusion.b)) blocked.set(exclusion.b, new Set());
    blocked.get(exclusion.a)?.add(exclusion.b);
    blocked.get(exclusion.b)?.add(exclusion.a);
  }
  for (const assignment of assignments) {
    if (assignment.giverId === assignment.recipientId) throw new DrawError("IMPOSSIBLE");
    if (!ids.has(assignment.giverId) || !ids.has(assignment.recipientId)) throw new DrawError("IMPOSSIBLE");
    if (givers.has(assignment.giverId) || recipients.has(assignment.recipientId)) throw new DrawError("IMPOSSIBLE");
    if (blocked.get(assignment.giverId)?.has(assignment.recipientId)) throw new DrawError("IMPOSSIBLE");
    givers.add(assignment.giverId);
    recipients.add(assignment.recipientId);
  }
}
