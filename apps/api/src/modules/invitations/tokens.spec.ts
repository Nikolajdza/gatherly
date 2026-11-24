import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createInviteToken, hashInviteToken, inviteIsUsable } from "./tokens";

describe("invitation tokens", () => {
  it("stores a hash instead of the raw token", () => {
    const { token, tokenHash } = createInviteToken();
    assert.notEqual(token, tokenHash);
    assert.equal(tokenHash, hashInviteToken(token));
    assert.match(tokenHash, /^[a-f0-9]{64}$/);
  });

  it("rejects expired and revoked invitations", () => {
    assert.equal(inviteIsUsable({ status: "pending", expiresAt: new Date(Date.now() + 60_000) }), true);
    assert.equal(inviteIsUsable({ status: "pending", expiresAt: new Date(Date.now() - 60_000) }), false);
    assert.equal(inviteIsUsable({ status: "revoked", expiresAt: new Date(Date.now() + 60_000) }), false);
  });
});
