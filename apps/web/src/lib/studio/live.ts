import { ApiError, type GatherlyClient } from "@gatherly/api-client";
import { browserApi } from "@/lib/api";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { BackendError, type StudioBackend } from "./backend";

function errorCode(body: unknown): string | null {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: { code?: unknown } }).error;
    return typeof error?.code === "string" ? error.code : null;
  }
  return null;
}

async function call<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ApiError) {
      const code = errorCode(error.body);
      if (error.status === 401) throw new BackendError("UNAUTHENTICATED");
      if (code === "AI_UNAVAILABLE") throw new BackendError("AI_UNAVAILABLE");
      if (code === "AI_LIMIT" || error.status === 429) throw new BackendError("AI_LIMIT");
      if (code === "NO_ASSIGNMENT") throw new BackendError("NO_ASSIGNMENT");
      if (code === "FETCH_FAILED" || code === "UNSAFE_URL") throw new BackendError("FETCH_FAILED");
      if (code === "IMPOSSIBLE" || code === "SEARCH_EXHAUSTED") throw new BackendError("DRAW_IMPOSSIBLE");
      if (code === "NEED_MORE_PARTICIPANTS") throw new BackendError("NEED_MORE");
      if (code === "PLAN_LIMIT") throw new BackendError("UNKNOWN", "PLAN_LIMIT");
      if (error.status === 409) throw new BackendError("CONFLICT");
      if (error.status === 503) throw new BackendError("UNAVAILABLE");
      throw new BackendError("UNKNOWN", code ?? undefined);
    }
    if (error instanceof TypeError) throw new BackendError("NOT_CONFIGURED");
    throw error;
  }
}

export function liveBackend(experienceId: string, client: GatherlyClient = browserApi()): StudioBackend {
  const id = experienceId;
  return {
    mode: "live",
    experienceId: id,
    publicPath: (slug) => `/e/${slug}`,

    getExperience: () => call(() => client.experiences.get(id)),
    updateExperience: (body) => call(() => client.experiences.update(id, body)),
    deleteExperience: () => call(async () => void (await client.experiences.remove(id))),

    createItem: (body) => call(() => client.items.create(id, body)),
    updateItem: (itemId, body) => call(() => client.items.update(id, itemId, body)),
    removeItem: (itemId) => call(async () => void (await client.items.remove(id, itemId))),
    reorderItems: (orderedIds) => call(async () => void (await client.items.reorder(id, orderedIds))),

    reserve: (itemId) => call(async () => void (await client.reservations.create(itemId))),
    cancelReservation: (reservationId) => call(async () => void (await client.reservations.cancel(reservationId))),
    pledge: (itemId, amountCents) => call(async () => void (await client.reservations.pledge(itemId, { amountCents }))),

    listMembers: () => call(async () => (await client.members.list(id)).items),
    updateMember: (userId, role) => call(async () => void (await client.members.update(id, userId, { role }))),
    removeMember: (userId) => call(async () => void (await client.members.remove(id, userId))),
    listInvites: () => call(async () => (await client.invitations.list(id)).items),
    createInvite: (body) => call(() => client.invitations.create(id, body)),
    createInvitesBulk: (body) => call(() => client.invitations.createBulk(id, body)),
    sendThankYou: (body) => call(() => client.invitations.sendThankYou(id, body)),
    revokeInvite: (inviteId) => call(async () => void (await client.invitations.revoke(inviteId))),

    getSanta: () => call(() => client.secretSanta.get(id)),
    updateSanta: (body) => call(() => client.secretSanta.update(id, body)),
    joinSanta: () => call(() => client.secretSanta.join(id)),
    leaveSanta: (participantId) => call(() => client.secretSanta.leave(id, participantId)),
    saveWishlist: (items) => call(() => client.secretSanta.wishlist(id, { items })),
    addExclusion: (participantAId, participantBId) => call(() => client.secretSanta.exclude(id, { participantAId, participantBId })),
    removeExclusion: (exclusionId) => call(() => client.secretSanta.removeExclusion(id, exclusionId)),
    draw: () => call(async () => {
      await client.secretSanta.draw(id);
      return client.secretSanta.get(id);
    }),
    lock: () => call(() => client.secretSanta.lock(id)),

    listTasks: () => call(async () => (await client.tasks.list(id)).items),
    createTask: (body) =>
      call(() =>
        client.tasks.create(id, {
          notes: "",
          status: "open",
          priority: "medium",
          labels: [],
          assigneeIds: [],
          ...body,
        }),
      ),
    updateTask: (taskId, body) => call(() => client.tasks.update(id, taskId, body)),
    removeTask: (taskId) => call(async () => void (await client.tasks.remove(id, taskId))),

    extractProduct: (url, locale) => call(() => client.ai.extractProduct({ url, experienceId: id, locale })),
    productFromText: (text, url, locale) => call(() => client.ai.productFromText({ experienceId: id, locale, text, url })),
    describe: (tone, locale) => call(() => client.ai.describeEvent({ experienceId: id, locale, tone })),
    giftIdeas: (input, locale) => call(async () => (await client.ai.giftIdeas({ experienceId: id, locale, ...input })).items),
    thankYouNotes: (tone, locale) => call(async () => (await client.ai.thankYouNotes({ experienceId: id, locale, tone })).items),
    santaIdeas: (locale) => call(async () => (await client.ai.santaIdeas({ experienceId: id, locale })).items),
    aiMessage: (purpose, tone, locale) => call(() => client.ai.message({ experienceId: id, locale, purpose, tone })),
    checklist: (prompt, locale) => call(async () => (await client.ai.checklist({ experienceId: id, locale, prompt })).items),
    tidyTasks: (locale) => call(() => client.ai.tidyTasks({ experienceId: id, locale })),
    uploadCover: async (file) => {
      const supabase = createBrowserSupabase();
      if (!supabase) return null;
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      const ticket = await call(() =>
        client.uploads.sign({ kind: "cover", fileName: file.name, mimeType, sizeBytes: file.size, experienceId: id }),
      );
      const { error } = await supabase.storage.from(ticket.bucket).uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
      if (error) throw new BackendError("UNKNOWN", error.message);
      return ticket.publicUrl;
    },
  };
}
