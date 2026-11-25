import type {
  AiText,
  AiTone,
  ChecklistSuggestion,
  GiftIdea,
  Locale,
  SantaGiftIdea,
  TaskTidyResult,
  ThankYouNote,
  CreateExperienceInput,
  ItemInput,
  TaskInput,
  UpdateExperienceInput,
  UpdateProfileInput,
  CreatedInvite,
  ExperienceDetail,
  ExperienceSummary,
  InviteClaimResult,
  InviteJoinResult,
  InvitePreview,
  InviteRecord,
  MemberRecord,
  NotificationRecord,
  ProductPreview,
  Profile,
  SecretSantaView,
  TaskRecord,
  UploadTicket,
} from "@gatherly/shared";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super("API request failed");
    this.name = "ApiError";
  }
}

export type ClientOptions = {
  baseUrl: string;
  getToken?: () => Promise<string | null>;
  fetch?: typeof fetch;
};

export type CreateInviteInput = {
  role: "editor" | "participant" | "viewer";
  email?: string | null;
  expiresInDays?: number;
};

export type AiTarget = { experienceId: string; locale?: Locale };

export type SecretSantaSettingsInput = {
  budgetCents?: number | null;
  currency?: "EUR" | "RSD" | "USD" | "GBP" | "RUB";
  drawDate?: string | null;
  purchaseDeadline?: string | null;
  organizerParticipates?: boolean;
};

export class GatherlyClient {
  constructor(private readonly options: ClientOptions) {}

  experiences = {
    list: () => this.request<{ items: ExperienceSummary[] }>("/experiences"),
    create: (body: CreateExperienceInput) =>
      this.request<ExperienceDetail>("/experiences", { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => this.request<ExperienceDetail>(`/experiences/${id}`),
    update: (id: string, body: UpdateExperienceInput) =>
      this.request<ExperienceDetail>(`/experiences/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    remove: (id: string) => this.request<{ deleted: true }>(`/experiences/${id}`, { method: "DELETE" }),
    bySlug: (slug: string) => this.request<ExperienceDetail>(`/public/experiences/${encodeURIComponent(slug)}`),
  };

  profile = {
    me: () => this.request<Profile>("/profiles/me"),
    update: (body: UpdateProfileInput) =>
      this.request<Profile>("/profiles/me", { method: "PATCH", body: JSON.stringify(body) }),
  };

  members = {
    list: (experienceId: string) =>
      this.request<{ items: MemberRecord[] }>(`/experiences/${experienceId}/members`),
    update: (experienceId: string, userId: string, body: { role: "editor" | "participant" | "viewer" }) =>
      this.request<MemberRecord>(`/experiences/${experienceId}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (experienceId: string, userId: string) =>
      this.request<{ deleted: true }>(`/experiences/${experienceId}/members/${userId}`, { method: "DELETE" }),
  };

  invitations = {
    list: (experienceId: string) =>
      this.request<{ items: InviteRecord[] }>(`/experiences/${experienceId}/invitations`),
    create: (experienceId: string, body: CreateInviteInput) =>
      this.request<CreatedInvite>(`/experiences/${experienceId}/invitations`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    createBulk: (
      experienceId: string,
      body: { role: CreateInviteInput["role"]; emails: string[]; expiresInDays?: number },
    ) =>
      this.request<{ items: CreatedInvite[]; created: number; emailed: number }>(
        `/experiences/${experienceId}/invitations/bulk`,
        { method: "POST", body: JSON.stringify(body) },
      ),
    sendThankYou: (experienceId: string, body: { note: string; onlyReserved?: boolean }) =>
      this.request<{ sent: number; recipients: number }>(`/experiences/${experienceId}/thank-you`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    revoke: (id: string) => this.request<InviteRecord>(`/invitations/${id}/revoke`, { method: "POST" }),
    preview: (token: string) =>
      this.request<InvitePreview>(`/invitations/preview?token=${encodeURIComponent(token)}`),
    accept: (body: { token: string }) =>
      this.request<InviteJoinResult>("/invitations/accept", { method: "POST", body: JSON.stringify(body) }),
    claim: (body: { token: string; displayName: string; email: string }) =>
      this.request<InviteClaimResult>("/invitations/claim", { method: "POST", body: JSON.stringify(body) }),
  };

  items = {
    create: (experienceId: string, body: ItemInput & { aiImportId?: string }) =>
      this.request<ExperienceDetail["items"][number]>(`/experiences/${experienceId}/items`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (experienceId: string, itemId: string, body: Partial<ItemInput>) =>
      this.request<ExperienceDetail["items"][number]>(`/experiences/${experienceId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (experienceId: string, itemId: string) =>
      this.request<{ deleted: true }>(`/experiences/${experienceId}/items/${itemId}`, { method: "DELETE" }),
    reorder: (experienceId: string, orderedIds: string[]) =>
      this.request<{ updated: true }>(`/experiences/${experienceId}/items/reorder`, {
        method: "POST",
        body: JSON.stringify({ orderedIds }),
      }),
  };

  reservations = {
    create: (itemId: string, body: { quantity?: number; note?: string } = {}) =>
      this.request<{ id: string }>(`/items/${itemId}/reservations`, { method: "POST", body: JSON.stringify(body) }),
    cancel: (id: string) => this.request<{ cancelled: true }>(`/reservations/${id}`, { method: "DELETE" }),
    pledge: (itemId: string, body: { amountCents: number; note?: string }) =>
      this.request<{ pledgedCents: number }>(`/items/${itemId}/contributions`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  };

  secretSanta = {
    get: (experienceId: string) => this.request<SecretSantaView>(`/experiences/${experienceId}/secret-santa`),
    update: (experienceId: string, body: SecretSantaSettingsInput) =>
      this.request<SecretSantaView>(`/experiences/${experienceId}/secret-santa`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    join: (experienceId: string) =>
      this.request<SecretSantaView>(`/experiences/${experienceId}/secret-santa/participants`, { method: "POST" }),
    leave: (experienceId: string, participantId: string) =>
      this.request<SecretSantaView>(`/experiences/${experienceId}/secret-santa/participants/${participantId}`, {
        method: "DELETE",
      }),
    wishlist: (experienceId: string, body: { items: Array<{ title: string; note?: string; url?: string | null }> }) =>
      this.request<SecretSantaView>(`/experiences/${experienceId}/secret-santa/wishlist`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    exclude: (experienceId: string, body: { participantAId: string; participantBId: string }) =>
      this.request<SecretSantaView>(`/experiences/${experienceId}/secret-santa/exclusions`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    removeExclusion: (experienceId: string, exclusionId: string) =>
      this.request<SecretSantaView>(`/experiences/${experienceId}/secret-santa/exclusions/${exclusionId}`, {
        method: "DELETE",
      }),
    draw: (experienceId: string) =>
      this.request<{ status: "drawn"; participantCount: number }>(
        `/experiences/${experienceId}/secret-santa/draw`,
        { method: "POST" },
      ),
    lock: (experienceId: string) =>
      this.request<SecretSantaView>(`/experiences/${experienceId}/secret-santa/lock`, { method: "POST" }),
  };

  tasks = {
    list: (experienceId: string) => this.request<{ items: TaskRecord[] }>(`/experiences/${experienceId}/tasks`),
    create: (experienceId: string, body: TaskInput) =>
      this.request<TaskRecord>(`/experiences/${experienceId}/tasks`, { method: "POST", body: JSON.stringify(body) }),
    update: (experienceId: string, taskId: string, body: Partial<TaskInput>) =>
      this.request<TaskRecord>(`/experiences/${experienceId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (experienceId: string, taskId: string) =>
      this.request<{ deleted: true }>(`/experiences/${experienceId}/tasks/${taskId}`, { method: "DELETE" }),
  };

  ai = {
    extractProduct: (body: { url: string; experienceId?: string; locale?: Locale }) =>
      this.post<ProductPreview>("/ai/extract-product", body),
    productFromText: (body: AiTarget & { text: string; url?: string | null }) =>
      this.post<ProductPreview>("/ai/product-from-text", body),
    describeEvent: (body: AiTarget & { tone?: AiTone }) =>
      this.post<{ description: string; aiUsed: boolean }>("/ai/event-description", body),
    giftIdeas: (body: AiTarget & { prompt?: string; budgetCents?: number | null; count?: number }) =>
      this.post<{ items: GiftIdea[] }>("/ai/gift-ideas", body),
    thankYouNotes: (body: AiTarget & { tone?: AiTone }) =>
      this.post<{ items: ThankYouNote[] }>("/ai/thank-you-notes", body),
    santaIdeas: (body: AiTarget) => this.post<{ items: SantaGiftIdea[] }>("/ai/santa-ideas", body),
    message: (body: AiTarget & { purpose: "share" | "santa_invite"; tone?: AiTone }) =>
      this.post<AiText>("/ai/message", body),
    checklist: (body: AiTarget & { prompt: string }) =>
      this.post<{ items: ChecklistSuggestion[] }>("/ai/checklist", body),
    tidyTasks: (body: AiTarget) => this.post<TaskTidyResult>("/ai/tidy-tasks", body),
  };

  uploads = {
    sign: (body: {
      kind: "avatar" | "cover" | "gallery" | "attachment";
      fileName: string;
      mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      sizeBytes: number;
      experienceId?: string | null;
    }) => this.request<UploadTicket>("/uploads/sign", { method: "POST", body: JSON.stringify(body) }),
  };

  notifications = {
    list: () => this.request<{ items: NotificationRecord[] }>("/notifications"),
    read: (id: string) => this.request<NotificationRecord>(`/notifications/${id}/read`, { method: "POST" }),
  };

  billing = {
    upgrade: () => this.request<Profile>("/billing/upgrade", { method: "POST" }),
  };

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  private async request<T>(path: string, init?: RequestInit, attempt = 0): Promise<T> {
    const token = this.options.getToken ? await this.options.getToken() : null;
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    if (init?.body) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const fetcher = this.options.fetch ?? fetch;
    const url = `${this.options.baseUrl.replace(/\/$/, "")}/api/v1${path}`;
    try {
      const response = await fetcher(url, { ...init, headers });
      const text = await response.text();
      const data: unknown = text ? JSON.parse(text) : null;
      // Free-tier hosts often 502/503 during cold start — retry a few times.
      if (!response.ok && attempt < 3 && (response.status === 502 || response.status === 503 || response.status === 504)) {
        await sleep(900 * (attempt + 1));
        return this.request(path, init, attempt + 1);
      }
      if (!response.ok) throw new ApiError(response.status, data);
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (attempt < 3) {
        await sleep(900 * (attempt + 1));
        return this.request(path, init, attempt + 1);
      }
      throw error;
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
