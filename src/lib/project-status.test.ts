import { describe, test } from "node:test";
import { deepStrictEqual } from "node:assert";
import { completionPatch, filterProjects } from "./project-status";

describe("project lifecycle", () => {
  test("completed projects are listed newest first without active projects", () => {
    const projects = [
      { id: "older", status: "completed" as const, completed_at: "2026-10-10T12:00:00.000Z" },
      { id: "active", status: "active" as const, completed_at: null },
      { id: "newer", status: "completed" as const, completed_at: "2026-10-11T12:00:00.000Z" },
    ];
    deepStrictEqual(filterProjects(projects, "completed").map((p) => p.id), ["newer", "older"]);
  });
  test("completion records its date", () => {
    deepStrictEqual(completionPatch("completed", new Date("2026-10-11T21:13:00Z")), {
      status: "completed", completed_at: "2026-10-11T21:13:00.000Z",
    });
  });
  test("reopening clears the completion date", () => {
    deepStrictEqual(completionPatch("active"), { status: "active", completed_at: null });
  });
});