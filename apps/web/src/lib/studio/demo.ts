import { DrawError, drawAssignments, type PublicItem, type SecretSantaView, type ThemeConfig } from "@gatherly/shared";
import type { DemoTemplate } from "@/lib/template-media";
import { BackendError, type StudioBackend } from "./backend";
import {
  demoChecklist,
  demoGiftIdeas,
  demoMessage,
  demoProductFromText,
  demoSantaIdeas,
  demoThankYouNotes,
  demoTidy,
} from "./demo-ai";
import { DEMO_USER_ID, demoCatalog, demoId, seedDemo, type DemoState } from "./demo-data";

const storageKey = (template: DemoTemplate) => `gatherly-demo:v2:${template}`;

export function loadDemo(template: DemoTemplate): DemoState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(storageKey(template));
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        if (parsed.version === 2) return parsed;
      }
    } catch {
      // Corrupt or unavailable storage falls back to fresh sample data.
    }
  }
  return seedDemo(template);
}

function saveDemo(template: DemoTemplate, state: DemoState) {
  try {
    window.sessionStorage.setItem(storageKey(template), JSON.stringify(state));
  } catch {
    // Storage may be full (large uploaded covers); the demo keeps working in memory.
  }
}

export function resetDemo(template: DemoTemplate) {
  try {
    window.sessionStorage.removeItem(storageKey(template));
  } catch {
    // ignore
  }
}

function secureRandomInt(max: number) {
  const buffer = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0] ?? 0;
  } while (value >= limit);
  return value % max;
}

function santaView(state: DemoState): SecretSantaView {
  const santa = state.santa;
  if (!santa) throw new BackendError("UNKNOWN", "Secret Santa is not set up.");
  const { assignments, ...view } = santa;
  const me = santa.participants.find((participant) => participant.userId === DEMO_USER_ID);
  const mine = me ? assignments.find((assignment) => assignment.giverId === me.id) : undefined;
  const recipient = mine ? santa.participants.find((participant) => participant.id === mine.recipientId) : undefined;
  return {
    ...view,
    myAssignment: recipient
      ? { recipientParticipantId: recipient.id, displayName: recipient.displayName, wishlist: recipient.wishlist }
      : null,
  };
}

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

export function demoBackend(template: DemoTemplate): StudioBackend {
  let state = loadDemo(template);

  async function mutate<T>(work: (draft: DemoState) => T): Promise<T> {
    await wait();
    state = loadDemo(template);
    const result = work(state);
    state.experience.updatedAt = new Date().toISOString();
    saveDemo(template, state);
    return structuredClone(result);
  }

  async function read<T>(pick: (current: DemoState) => T): Promise<T> {
    await wait(120);
    state = loadDemo(template);
    return structuredClone(pick(state));
  }

  function findItem(draft: DemoState, itemId: string): PublicItem {
    const item = draft.experience.items.find((entry) => entry.id === itemId);
    if (!item) throw new BackendError("UNKNOWN", "Item not found.");
    return item;
  }

  function requireOpenSanta(draft: DemoState) {
    if (!draft.santa) throw new BackendError("UNKNOWN");
    if (draft.santa.status === "locked") throw new BackendError("CONFLICT");
    return draft.santa;
  }

  return {
    mode: "demo",
    experienceId: `demo-${template}`,
    publicPath: () => `/demo/${template}`,

    getExperience: () => read((current) => current.experience),
    updateExperience: (body) =>
      mutate((draft) => {
        const { themeConfig, config, ...rest } = body;
        Object.assign(draft.experience, rest);
        if (config) draft.experience.config = config;
        if (themeConfig) draft.experience.themeConfig = { ...draft.experience.themeConfig, ...themeConfig } as Partial<ThemeConfig>;
        return draft.experience;
      }),
    deleteExperience: async () => {
      await wait();
      resetDemo(template);
    },

    createItem: (body) =>
      mutate((draft) => {
        const item: PublicItem = {
          id: demoId("item"),
          title: body.title,
          description: body.description ?? "",
          url: body.url ?? null,
          imageUrl: body.imageUrl ?? null,
          priceCents: body.priceCents ?? null,
          currency: body.currency ?? null,
          category: body.category ?? null,
          priority: body.priority ?? "medium",
          quantity: body.quantity ?? 1,
          itemKind: body.itemKind ?? "product",
          isGroupGift: body.isGroupGift ?? false,
          targetAmountCents: body.targetAmountCents ?? null,
          pledgedCents: 0,
          sortOrder: draft.experience.items.length,
          reserved: false,
          reservation: null,
        };
        draft.experience.items.push(item);
        return item;
      }),
    updateItem: (itemId, body) =>
      mutate((draft) => {
        const item = findItem(draft, itemId);
        Object.assign(item, body);
        return item;
      }),
    removeItem: (itemId) =>
      mutate((draft) => {
        draft.experience.items = draft.experience.items.filter((item) => item.id !== itemId);
      }),
    reorderItems: (orderedIds) =>
      mutate((draft) => {
        const byId = new Map(draft.experience.items.map((item) => [item.id, item]));
        draft.experience.items = orderedIds
          .map((id) => byId.get(id))
          .filter((item): item is PublicItem => Boolean(item))
          .map((item, index) => ({ ...item, sortOrder: index }));
      }),

    reserve: (itemId) =>
      mutate((draft) => {
        const item = findItem(draft, itemId);
        if (item.reserved) throw new BackendError("CONFLICT");
        item.reserved = true;
        item.reservation = { id: demoId("res"), status: "active", quantity: 1, mine: true };
      }),
    cancelReservation: (reservationId) =>
      mutate((draft) => {
        const item = draft.experience.items.find((entry) => entry.reservation?.id === reservationId);
        if (!item) throw new BackendError("UNKNOWN");
        item.reserved = false;
        item.reservation = null;
      }),
    pledge: (itemId, amountCents) =>
      mutate((draft) => {
        const item = findItem(draft, itemId);
        item.pledgedCents += amountCents;
      }),

    listMembers: () => read((current) => current.members),
    updateMember: (userId, role) =>
      mutate((draft) => {
        const member = draft.members.find((entry) => entry.userId === userId);
        if (member && member.role !== "owner") member.role = role;
      }),
    removeMember: (userId) =>
      mutate((draft) => {
        draft.members = draft.members.filter((entry) => entry.userId !== userId || entry.role === "owner");
        draft.experience.memberCount = draft.members.length;
      }),
    listInvites: () => read((current) => current.invites.filter((invite) => invite.status === "pending")),
    createInvite: (body) =>
      mutate((draft) => {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) => byte.toString(16).padStart(2, "0")).join("");
        const invite = {
          id: demoId("invite"),
          role: body.role,
          email: body.email ?? null,
          status: "pending" as const,
          expiresAt: new Date(Date.now() + (body.expiresInDays ?? 14) * 86_400_000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        draft.invites.unshift(invite);
        return { ...invite, token, urlPath: `/invite/${token}`, emailSent: false };
      }),
    revokeInvite: (id) =>
      mutate((draft) => {
        const invite = draft.invites.find((entry) => entry.id === id);
        if (invite) invite.status = "revoked";
      }),

    getSanta: () => read((current) => santaView(current)),
    updateSanta: (body) =>
      mutate((draft) => {
        const santa = requireOpenSanta(draft);
        if (santa.status !== "open") throw new BackendError("CONFLICT");
        Object.assign(santa, body);
        return santaView(draft);
      }),
    joinSanta: () =>
      mutate((draft) => {
        const santa = requireOpenSanta(draft);
        if (!santa.participants.some((participant) => participant.userId === DEMO_USER_ID)) {
          santa.participants.push({ id: demoId("p"), userId: DEMO_USER_ID, displayName: "You", wishlist: [] });
        }
        return santaView(draft);
      }),
    leaveSanta: (participantId) =>
      mutate((draft) => {
        const santa = requireOpenSanta(draft);
        if (santa.status !== "open") throw new BackendError("CONFLICT");
        santa.participants = santa.participants.filter((participant) => participant.id !== participantId);
        santa.exclusions = santa.exclusions.filter((rule) => rule.participantAId !== participantId && rule.participantBId !== participantId);
        return santaView(draft);
      }),
    saveWishlist: (wishes) =>
      mutate((draft) => {
        const santa = requireOpenSanta(draft);
        const me = santa.participants.find((participant) => participant.userId === DEMO_USER_ID);
        if (!me) throw new BackendError("UNKNOWN");
        me.wishlist = wishes.map((wish) => ({ title: wish.title, note: wish.note ?? "", url: wish.url ?? null }));
        return santaView(draft);
      }),
    addExclusion: (participantAId, participantBId) =>
      mutate((draft) => {
        const santa = requireOpenSanta(draft);
        if (participantAId === participantBId) throw new BackendError("UNKNOWN");
        const exists = santa.exclusions.some(
          (rule) =>
            (rule.participantAId === participantAId && rule.participantBId === participantBId) ||
            (rule.participantAId === participantBId && rule.participantBId === participantAId),
        );
        if (!exists) santa.exclusions.push({ id: demoId("ex"), participantAId, participantBId });
        return santaView(draft);
      }),
    removeExclusion: (exclusionId) =>
      mutate((draft) => {
        const santa = requireOpenSanta(draft);
        santa.exclusions = santa.exclusions.filter((rule) => rule.id !== exclusionId);
        return santaView(draft);
      }),
    draw: () =>
      mutate((draft) => {
        const santa = requireOpenSanta(draft);
        const pool = santa.participants.filter((participant) => santa.organizerParticipates || participant.userId !== DEMO_USER_ID);
        try {
          santa.assignments = drawAssignments(
            pool.map((participant) => ({ id: participant.id })),
            santa.exclusions.map((rule) => ({ a: rule.participantAId, b: rule.participantBId })),
            secureRandomInt,
          );
        } catch (error) {
          if (error instanceof DrawError) {
            throw new BackendError(error.code === "NEED_MORE_PARTICIPANTS" ? "NEED_MORE" : "DRAW_IMPOSSIBLE");
          }
          throw error;
        }
        santa.status = "drawn";
        return santaView(draft);
      }),
    lock: () =>
      mutate((draft) => {
        const santa = requireOpenSanta(draft);
        if (santa.status !== "drawn") throw new BackendError("CONFLICT");
        santa.status = "locked";
        return santaView(draft);
      }),

    listTasks: () => read((current) => [...current.tasks].sort((a, b) => a.sortOrder - b.sortOrder)),
    createTask: (body) =>
      mutate((draft) => {
        const task = {
          id: demoId("task"),
          parentId: null,
          notes: "",
          status: "open" as const,
          priority: "medium" as const,
          category: null,
          dueDate: null,
          labels: [],
          assigneeIds: [],
          ...body,
          sortOrder: draft.tasks.length,
        };
        draft.tasks.push(task);
        return task;
      }),
    updateTask: (taskId, body) =>
      mutate((draft) => {
        const task = draft.tasks.find((entry) => entry.id === taskId);
        if (!task) throw new BackendError("UNKNOWN");
        Object.assign(task, body);
        return task;
      }),
    removeTask: (taskId) =>
      mutate((draft) => {
        draft.tasks = draft.tasks.filter((entry) => entry.id !== taskId);
      }),

    extractProduct: async (url) => {
      await wait(900);
      let hash = 0;
      for (const character of url) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
      const lowered = url.toLowerCase();
      const sample =
        demoCatalog.find((entry) => entry.keywords.some((keyword) => lowered.includes(keyword))) ??
        demoCatalog[hash % demoCatalog.length] ??
        demoCatalog[0]!;
      return {
        importId: demoId("import"),
        title: sample.title,
        description: null,
        imageUrl: sample.imageUrl,
        priceCents: sample.priceCents,
        currency: "EUR",
        url,
        category: null,
        priority: "medium",
        aiUsed: false,
        priceFoundOnPage: true,
        imageFoundOnPage: true,
      };
    },
    productFromText: async (text, url) => {
      await wait(1100);
      return demoProductFromText(text, url);
    },
    giftIdeas: async (input) => {
      await wait(1100);
      return demoGiftIdeas(template, loadDemo(template).experience, input.prompt ?? "");
    },
    thankYouNotes: async (tone) => {
      await wait(900);
      return demoThankYouNotes(loadDemo(template).experience, tone);
    },
    santaIdeas: async () => {
      await wait(900);
      const current = loadDemo(template);
      const view = santaView(current);
      if (!view.myAssignment) throw new BackendError("NO_ASSIGNMENT");
      const budget = view.budgetCents ? `${view.budgetCents / 100} ${view.currency}` : null;
      return demoSantaIdeas(view.myAssignment.wishlist, budget);
    },
    aiMessage: async (purpose, tone) => {
      await wait(800);
      return { text: demoMessage(purpose, tone, loadDemo(template).experience), aiUsed: false };
    },
    checklist: async (prompt) => {
      await wait(1100);
      const current = loadDemo(template);
      return demoChecklist(prompt, current.tasks, current.experience.eventDate);
    },
    tidyTasks: async () => {
      await wait(900);
      return demoTidy(loadDemo(template).tasks);
    },
    describe: async () => {
      await wait(700);
      const current = loadDemo(template).experience;
      const config = current.config as Record<string, unknown>;
      const name = String(config.babyName ?? config.celebrantName ?? config.partnerOneName ?? current.title);
      return {
        aiUsed: false,
        description: `Thank you for being part of ${name}'s celebration. We put together a few things that would make this moment even more special — reserve a gift and the rest stays a lovely surprise.`,
      };
    },
    uploadCover: async (file) => {
      if (file.size > 1_500_000) return null;
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    },
  };
}
