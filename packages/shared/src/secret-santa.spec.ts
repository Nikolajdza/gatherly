import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertValidAssignment, DrawError, drawAssignments } from "./secret-santa";

const sequence =
  (values: number[]): ((max: number) => number) =>
  (max: number) => {
    const next = values.shift() ?? 0;
    return next % max;
  };

describe("drawAssignments", () => {
  it("gives every person exactly one other person", () => {
    const people = ["a", "b", "c", "d", "e"].map((id) => ({ id }));
    const assignments = drawAssignments(people, [], sequence([0, 1, 2, 3, 4, 1, 0, 2]));
    assertValidAssignment(people, [], assignments);
    assert.equal(new Set(assignments.map((item) => item.giverId)).size, 5);
    assert.equal(new Set(assignments.map((item) => item.recipientId)).size, 5);
    for (const assignment of assignments) {
      assert.notEqual(assignment.giverId, assignment.recipientId);
    }
  });

  it("keeps couples from drawing each other", () => {
    const people = ["ana", "nikola", "mila", "luka"].map((id) => ({ id }));
    const exclusions = [{ a: "ana", b: "nikola" }];
    const assignments = drawAssignments(people, exclusions, (max) => Math.floor(Math.random() * max));
    assertValidAssignment(people, exclusions, assignments);
    const ana = assignments.find((item) => item.giverId === "ana");
    const nikola = assignments.find((item) => item.giverId === "nikola");
    assert.notEqual(ana?.recipientId, "nikola");
    assert.notEqual(nikola?.recipientId, "ana");
  });

  it("rejects an impossible couple of two", () => {
    assert.throws(
      () => drawAssignments([{ id: "a" }, { id: "b" }], [{ a: "a", b: "b" }], () => 0),
      (error: unknown) => error instanceof DrawError && error.code === "IMPOSSIBLE",
    );
  });

  it("rejects a single participant", () => {
    assert.throws(
      () => drawAssignments([{ id: "a" }], [], () => 0),
      (error: unknown) => error instanceof DrawError && error.code === "NEED_MORE_PARTICIPANTS",
    );
  });

  it("swaps two people when there are no exclusions", () => {
    const assignments = drawAssignments([{ id: "a" }, { id: "b" }], [], () => 0);
    assert.deepEqual(
      assignments.map((item) => [item.giverId, item.recipientId]),
      [
        ["a", "b"],
        ["b", "a"],
      ],
    );
  });
});
