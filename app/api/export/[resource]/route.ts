import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { toCsv } from "@/lib/utils";
import { isDirectoryPerson, listContents, listEquipment, listKpi, listPeople, listProjects, listTasks, listTime } from "@/lib/queries";
import { isTaskOverdue } from "@/lib/permissions";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(ctx, "reports:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { resource } = await params;
  let rows: Record<string, unknown>[] = [];
  if (resource === "projects") rows = await listProjects();
  else if (resource === "tasks") rows = await listTasks();
  else if (resource === "overdue") rows = (await listTasks()).filter((t) => isTaskOverdue(t));
  else if (resource === "team") rows = (await listPeople()).filter(isDirectoryPerson);
  else if (resource === "content") rows = await listContents();
  else if (resource === "equipment") rows = await listEquipment();
  else if (resource === "kpi") rows = (await listKpi()).targets;
  else if (resource === "time") rows = await listTime();
  else if (resource === "workload") {
    const tasks = await listTasks();
    const people = (await listPeople()).filter(isDirectoryPerson);
    rows = people.map((p) => ({
      person: p.fullName,
      active: tasks.filter((t) => t.assigneeId === p.id && t.status !== "completed").length,
    }));
  } else {
    return NextResponse.json({ error: "Unknown report" }, { status: 404 });
  }
  const csv = toCsv(rows as Record<string, unknown>[]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${resource}.csv"`,
    },
  });
}
