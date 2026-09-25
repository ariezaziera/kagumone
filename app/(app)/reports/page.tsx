import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { listProjects, listTasks } from "@/lib/queries";
import { Card, PageHeader } from "@/components/ui";
import { isTaskOverdue } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!hasPermission(ctx, "reports:view")) {
    return <p>You are not authorized to view reports.</p>;
  }
  const [projects, tasks] = await Promise.all([listProjects(), listTasks()]);
  const overdue = tasks.filter((t) => isTaskOverdue(t));
  return (
    <div>
      <PageHeader title="Reports" description="Derived from authoritative records. CSV export uses the same access rules." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs text-secondary">Projects</p>
          <p className="text-2xl font-semibold">{projects.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-secondary">Open tasks</p>
          <p className="text-2xl font-semibold">{tasks.filter((t) => t.status !== "completed").length}</p>
        </Card>
        <Card>
          <p className="text-xs text-secondary">Overdue</p>
          <p className="text-2xl font-semibold">{overdue.length}</p>
        </Card>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {["projects", "tasks", "overdue", "content", "kpi", "equipment", "workload", "time", "team"].map((r) => (
          <a key={r} className="rounded-md border border-border bg-surface px-3 py-1 capitalize" href={`/api/export/${r}`}>
            Export {r} CSV
          </a>
        ))}
      </div>
    </div>
  );
}
