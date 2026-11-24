import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ConflictException } from "@nestjs/common";
import { presentItem } from "../experiences/experience.presenter";
import { ReservationsService } from "./reservations.service";

describe("reservation privacy and conflicts", () => {
  it("does not reveal who reserved a gift to the owner", () => {
    const view = presentItem(
      {
        id: "item",
        title: "Stroller",
        description: "",
        url: null,
        imageUrl: null,
        priceCents: 45000,
        currency: "EUR",
        category: null,
        priority: "high",
        quantity: 1,
        itemKind: "product",
        isGroupGift: false,
        targetAmountCents: null,
        sortOrder: 1,
        contributions: [],
        reservations: [
          {
            id: "res",
            userId: "guest",
            status: "active",
            quantity: 1,
            note: "secret",
            createdAt: new Date("2026-11-23T00:00:00.000Z"),
            cancelledAt: null,
          },
        ],
      },
      "owner",
    );
    assert.equal(view.reserved, true);
    assert.equal(view.reservation?.mine, false);
    assert.equal(view.reservation?.id, null);
    assert.equal(JSON.stringify(view).includes("guest"), false);
  });

  it("turns a unique violation into a conflict", async () => {
    const service = new ReservationsService(
      {
        experienceItem: {
          findUnique: async () => ({
            id: "item",
            experienceId: "exp",
            quantity: 1,
            experience: { ownerId: "owner", visibility: "public", status: "active", id: "exp" },
          }),
        },
        itemReservation: {
          create: async () => {
            const error = new Error("unique") as Error & { code: string };
            error.code = "P2002";
            throw error;
          },
        },
      } as never,
      { getMembership: async () => null } as never,
      { create: async () => undefined } as never,
    );
    await assert.rejects(
      () => service.reserve("item", "guest", { quantity: 1, note: "" }),
      (error: unknown) => error instanceof ConflictException,
    );
  });
});
