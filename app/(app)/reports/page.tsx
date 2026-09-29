import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Download, FolderKanban, ListChecks } from "lucide-react";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { listProjects, listTasks } from "@/lib/queries";
import { EmptyState } from "@/components/ui";
import { Metric, WorkHero, linkButton } from "@/components/work-surface";
import { isTaskOverdue } from "@/lib/permissions";
import { readableLabel } from "@/lib/utils";

const EXPORTS = [
  { key: "projects", note: "Project records." },
  { key: "tasks", note: "Task records." },
  { key: "overdue", note: "Tasks past the official deadline." },
  { key: "content", note: "Content records." },
  { key: "equipment", note: "Equipment records." },
  { key: "kpi", note: "KPI targets." },
  { key: "workload", note: "Each person and their active task count." },
  { key: "time", note: "Recorded time entries, with planned and actual minutes." },
  { key: "team", note: "People records." },
] as const;

export default async function ReportsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!hasPermission(ctx, "reports:view")) {
    return <EmptyState illustration="search" title="Reports need permission" body="Viewing these counts and CSV files needs the reports permission." />;
  }
  const [projects, tasks] = await Promise.all([listProjects(), listTasks()]);
  const open = tasks.filter((task) => task.status !== "completed");
  const overdue = tasks.filter((task) => isTaskOverdue(task));
  const summary = `${projects.length} ${projects.length === 1 ? "project" : "projects"}, ${open.length} open ${open.length === 1 ? "task" : "tasks"}, ${overdue.length} past the official deadline. The CSV files use the same records.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="dashboard"
        kicker="Reports"
        title="Record counts"
        artWash="bg-blue-soft"
        description={summary}
        actions={
          <>
            <a className={linkButton("primary")} href="#export">Export CSV</a>
            <Link className={linkButton()} href="/kpi">KPI</Link>
            <Link className={linkButton()} href="/workload">Workload</Link>
          </>
        }
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Projects" value={projects.length} note="Project records you can open." icon={FolderKanban} wash="bg-blue-soft" ink="text-info" href="/projects" />
        <Metric label="Open tasks" value={open.length} note="Tasks that are not completed." icon={ListChecks} wash="bg-yellow-soft" ink="text-warning" href="/tasks" />
        <Metric label="Overdue" value={overdue.length} note="Official deadline has passed." icon={AlertTriangle} wash="bg-primary-light" ink="text-primary" href="/tasks" valueClass={overdue.length > 0 ? "text-error" : "text-text"} />
      </div>
      <section id="export" className="space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Export</p>
          <h2 className="mt-1 text-lg font-bold">CSV files</h2>
          <p className="mt-1 max-w-xl text-sm text-secondary">Each file is the same set of records behind that count. The workload file is the active-task count per person.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {EXPORTS.map((item) => (
            <a key={item.key} href={`/api/export/${item.key}`} className="flex items-start gap-3 rounded-[18px] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)] hover:bg-canvas">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-blue-soft text-info">
                <Download size={18} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-text">{readableLabel(item.key)}</span>
                <span className="mt-1 block text-xs leading-relaxed text-secondary">{item.note}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
