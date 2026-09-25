import { describe, expect, it } from "vitest";
import {
  canTransitionTask,
  countsTowardContentKpi,
  isTaskOverdue,
  overdueDays,
} from "@/lib/permissions";
import { completionSchema } from "@/lib/validation";
import { cannotDeleteSelf, deriveEquipmentStatus } from "@/lib/services/org";
import { toCsv } from "@/lib/utils";

describe("task workflow", () => {
  it("requires acknowledgement before in progress", () => {
    expect(canTransitionTask("draft", "pending_acknowledgement")).toBe(true);
    expect(canTransitionTask("pending_acknowledgement", "acknowledged")).toBe(true);
    expect(canTransitionTask("pending_acknowledgement", "in_progress")).toBe(false);
    expect(canTransitionTask("in_progress", "completed")).toBe(false);
    expect(canTransitionTask("submitted", "completed")).toBe(true);
  });

  it("marks overdue only from official deadline", () => {
    expect(
      isTaskOverdue({
        officialDeadline: new Date("2020-01-01"),
        status: "in_progress",
        now: new Date("2020-01-02"),
      }),
    ).toBe(true);
    expect(
      isTaskOverdue({
        officialDeadline: new Date("2020-01-01"),
        status: "completed",
        now: new Date("2020-01-02"),
      }),
    ).toBe(false);
  });
});

describe("content KPI rule", () => {
  it("requires posted plus configured platforms", () => {
    expect(
      countsTowardContentKpi({
        status: "published",
        platforms: ["facebook", "instagram", "tiktok"],
      }),
    ).toBe(true);
    expect(
      countsTowardContentKpi({
        status: "planned",
        platforms: ["facebook", "instagram", "tiktok"],
      }),
    ).toBe(false);
    expect(
      countsTowardContentKpi({
        status: "published",
        platforms: ["instagram"],
      }),
    ).toBe(false);
  });
});

describe("organization rules", () => {
  it("blocks self-deletion", () => {
    expect(() => cannotDeleteSelf("p1", "p1")).toThrow();
    expect(() => cannotDeleteSelf("p1", "p2")).not.toThrow();
  });

  it("derives a single equipment state", () => {
    expect(deriveEquipmentStatus({ openLoan: false, maintenanceOpen: false, condition: "good" })).toBe("available");
    expect(
      deriveEquipmentStatus({
        openLoan: true,
        expectedReturnAt: new Date("2020-01-01"),
        maintenanceOpen: false,
        condition: "good",
        now: new Date("2020-01-02"),
      }),
    ).toBe("late");
  });
});

describe("csv export helper", () => {
  it("escapes fields", () => {
    expect(toCsv([{ name: "A, B", status: "ok" }])).toContain('"A, B"');
  });
});

describe("completion notice rules", () => {
  it("counts overdue from official deadline vs work completed, never negative", () => {
    expect(
      overdueDays({
        officialDeadline: new Date("2026-09-20T10:00:00"),
        workCompletedAt: new Date("2026-09-22T18:00:00"),
      }),
    ).toBe(2);
    expect(
      overdueDays({
        officialDeadline: new Date("2026-09-20T10:00:00"),
        workCompletedAt: new Date("2026-09-19T18:00:00"),
      }),
    ).toBe(0);
  });

  it("blocks completion without reflection and described deliverables", () => {
    const empty = completionSchema.safeParse({
      taskId: "t1",
      summary: "done",
      learned: "",
      doDifferently: "",
      rememberNext: "",
      workCompletedAt: "2026-09-25T12:00",
      deliverables: [{ url: "https://drive.example/file", description: "" }],
    });
    expect(empty.success).toBe(false);
    const ok = completionSchema.safeParse({
      taskId: "t1",
      summary: "Edited the reel",
      learned: "Need earlier QC",
      doDifferently: "Lock brief first",
      rememberNext: "Keep caption template",
      workCompletedAt: "2026-09-25T12:00",
      deliverables: [{ label: "Paid Ads Video #1", url: "https://drive.example/file", description: "Final edited MP4 submitted for QC." }],
    });
    expect(ok.success).toBe(true);
  });
});
