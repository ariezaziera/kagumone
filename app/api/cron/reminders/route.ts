import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { equipmentLoans, tasks } from "@/lib/db/schema";
import { notify } from "@/lib/services/records";
import { now } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const openTasks = await db.select().from(tasks);
  let taskNotes = 0;
  for (const task of openTasks) {
    if (task.status === "completed" || !task.officialDeadline || !task.assigneeId) continue;
    if (task.officialDeadline < now()) {
      await notify({
        personId: task.assigneeId,
        title: "Task overdue",
        body: task.title,
        href: `/tasks/${task.id}`,
        kind: "task_overdue",
      });
      taskNotes += 1;
    } else if (task.officialDeadline < soon) {
      await notify({
        personId: task.assigneeId,
        title: "Deadline approaching",
        body: task.title,
        href: `/tasks/${task.id}`,
        kind: "task_deadline",
      });
      taskNotes += 1;
    }
  }
  const openLoans = await db
    .select()
    .from(equipmentLoans)
    .where(and(eq(equipmentLoans.status, "borrowed"), isNull(equipmentLoans.actualReturnAt)));
  let equipNotes = 0;
  for (const loan of openLoans) {
    if (loan.expectedReturnAt && loan.expectedReturnAt < now()) {
      await notify({
        personId: loan.borrowerId,
        title: "Equipment overdue",
        body: "Please return borrowed equipment.",
        href: `/equipment/${loan.equipmentId}`,
        kind: "equipment_overdue",
      });
      equipNotes += 1;
    }
  }
  void lt;
  return NextResponse.json({ taskNotes, equipNotes });
}
