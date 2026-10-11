/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { completionPatch, filterProjects } from "./project-status";

describe("project lifecycle", () => {
  test("completed projects are listed newest first without active projects", () => {
    const projects = [
      { id: "older", status: "completed" as const, completed_at: "2026-10-10T12:00:00.000Z" },
      { id: "active", status: "active" as const, completed_at: null },
      { id: "newer", status: "completed" as const, completed_at: "2026-10-11T12:00:00.000Z" },
    ];
    expect(filterProjects(projects, "completed").map((p) => p.id)).toEqual(["newer", "older"]);
  });
  test("completion records its date", () => {
    expect(completionPatch("completed", new Date("2026-10-11T21:13:00Z"))).toEqual({
      status: "completed", completed_at: "2026-10-11T21:13:00.000Z",
    });
  });
  test("reopening clears the completion date", () => {
    expect(completionPatch("active")).toEqual({ status: "active", completed_at: null });
  });
});