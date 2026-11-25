import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SecretSantaService } from "./secret-santa.service";

describe("secret santa privacy", () => {
  it("returns only the caller's assignment", async () => {
    const service = new SecretSantaService(
      {
        secretSantaDraw: {
          findUnique: async () => ({
            id: "draw",
            status: "drawn",
            budgetCents: 3000,
            currency: "EUR",
            drawDate: null,
            purchaseDeadline: null,
            organizerParticipates: true,
            experience: { ownerId: "owner", title: "Office Santa", slug: "office-santa" },
            participants: [
              { id: "p1", userId: "owner", joinedAt: new Date(), user: { displayName: "Nikola", email: "n@example.com" }, wishlist: { items: [] } },
              { id: "p2", userId: "ana", joinedAt: new Date(), user: { displayName: "Ana", email: "a@example.com" }, wishlist: { items: [{ title: "Book", note: "", url: null }] } },
            ],
            exclusions: [],
          }),
        },
        secretSantaAssignment: {
          findUnique: async () => ({
            recipientParticipantId: "p2",
            recipient: { user: { displayName: "Ana" }, wishlist: { items: [{ title: "Book", note: "", url: null }] } },
          }),
          findMany: async () => {
            throw new Error("The full assignment list must not be read.");
          },
        },
      } as never,
      { requireMember: async () => ({ role: "owner" }) } as never,
      { webOrigin: () => "https://example.com", sendDrawReady: async () => true } as never,
    );

    const view = await service.get("exp", "owner");
    assert.equal(view.myAssignment?.displayName, "Ana");
    assert.equal("assignments" in view, false);
    assert.equal(JSON.stringify(view).includes("giver"), false);
  });
});
