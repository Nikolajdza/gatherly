import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { presentReservation, roleAllowed, roleAtLeast } from "./permissions";
import { parsePriceToCents, slugify } from "./format";
import { parseTemplateConfig } from "./templates";

describe("permissions and privacy", () => {
  it("ranks owner above editor and viewer", () => {
    assert.equal(roleAtLeast("owner", "editor"), true);
    assert.equal(roleAtLeast("viewer", "editor"), false);
    assert.equal(roleAllowed("editor", ["owner", "editor"]), true);
    assert.equal(roleAllowed("participant", ["owner", "editor"]), false);
  });

  it("hides the reserver from the list owner", () => {
    const reservation = {
      id: "res-1",
      userId: "guest",
      status: "active" as const,
      quantity: 1,
      note: "surprise",
      createdAt: "2026-11-23T00:00:00.000Z",
      cancelledAt: null,
    };
    const ownerView = presentReservation(reservation, { userId: "owner", role: "owner" });
    assert.equal(ownerView.reserver, null);
    assert.equal(ownerView.note, null);
    assert.equal(ownerView.id, null);

    const guestView = presentReservation(reservation, { userId: "guest", role: "participant" });
    assert.deepEqual(guestView.reserver, { id: "guest" });
    assert.equal(guestView.note, "surprise");
  });
});

describe("template config", () => {
  it("accepts a baby shower and rejects a birthday shape", () => {
    const parsed = parseTemplateConfig("baby-shower", {
      babyName: "Mila",
      motherName: "Ana",
      fatherName: "Nikola",
    });
    assert.equal(parsed.version, 1);
    assert.throws(() => parseTemplateConfig("baby-shower", { celebrantName: "Nikola" }));
  });
});

describe("formatting", () => {
  it("builds a latin slug from serbian text", () => {
    assert.equal(slugify("Naša beba Mila", "a1b2"), "nasa-beba-mila-a1b2");
  });

  it("parses european and plain prices without inventing them", () => {
    assert.equal(parsePriceToCents("€450.00"), 45000);
    assert.equal(parsePriceToCents("1.250,50"), 125050);
    assert.equal(parsePriceToCents("1,250.50"), 125050);
    assert.equal(parsePriceToCents("nije navedeno"), null);
    assert.equal(parsePriceToCents(null), null);
  });
});
