import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Clock, ListChecks, Users } from "lucide-react";
import { getAuthContext } from "@/lib/auth/context";
import { isDirectoryPerson, listPeople, listTasks, listTime } from "@/lib/queries";
import { PersonAvatar } from "@/components/person-avatar";
import { EmptyState } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { isTaskOverdue } from "@/lib/permissions";
export default async function WorkloadPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { view = "all" } = await searchParams;
  const [peopleRows, tasks, time] = await Promise.all([listPeople(), listTasks(), listTime()]);
  const rows = peopleRows.filter(isDirectoryPerson).map((person) => {
    const assigned = tasks.filter((task) => task.assigneeId === person.id && task.status !== "completed");
    const overdue = assigned.filter((task) => isTaskOverdue(task));
    const minutes = time.filter((entry) => entry.personId === person.id);
    return {
      person,
      active: assigned.length,
      overdue: overdue.length,
      planned: minutes.reduce((sum, entry) => sum + entry.plannedMinutes, 0),
      actual: minutes.reduce((sum, entry) => sum + entry.actualMinutes, 0),
    };
  });
  const filtered = view === "active" ? rows.filter((row) => row.active > 0) : view === "overdue" ? rows.filter((row) => row.overdue > 0) : rows;
  const withActive = rows.filter((row) => row.active > 0).length;
  const withOverdue = rows.filter((row) => row.overdue > 0).length;
  const overdueTasks = rows.reduce((sum, row) => sum + row.overdue, 0);
  const summary = rows.length === 0
    ? "No people are listed. Active work is an assigned task that is not completed."
    : `${withActive} ${withActive === 1 ? "person has" : "people have"} active tasks. ${withOverdue} ${withOverdue === 1 ? "has" : "have"} a task past the official deadline. This list does not rank people.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="team"
        kicker="Workload"
        title="Assigned work"
        artWash="bg-purple-soft"
        description={summary}
        actions={
          <>
            <Link className={linkButton("primary")} href="/tasks">Tasks</Link>
            <Link className={linkButton()} href="/kpi">KPI</Link>
            <Link className={linkButton()} href="/reports">Reports</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="People" value={rows.length} note="People included in this list." icon={Users} wash="bg-purple-soft" ink="text-purple" href="/workload" />
        <Metric label="With active work" value={withActive} note="At least one assigned task is still open." icon={ListChecks} wash="bg-yellow-soft" ink="text-warning" href="/workload?view=active" />
        <Metric label="With overdue work" value={withOverdue} note="At least one open task is past the official deadline." icon={AlertTriangle} wash="bg-primary-light" ink="text-primary" href="/workload?view=overdue" valueClass={withOverdue > 0 ? "text-error" : "text-text"} />
        <Metric label="Overdue tasks" value={overdueTasks} note="Open assigned tasks past the official deadline." icon={Clock} wash="bg-orange-soft" ink="text-orange" />
      </div>
      <ViewPills
        items={[
          { key: "all", href: "/workload", label: "All", active: view === "all", count: rows.length },
          { key: "active", href: "/workload?view=active", label: "Active", active: view === "active", count: withActive },
          { key: "overdue", href: "/workload?view=overdue", label: "Overdue", active: view === "overdue", count: withOverdue },
        ]}
      />
      {filtered.length === 0 ? (
        <EmptyState illustration="team" title="No one in this view" body="Active means an assigned task that is not completed. Overdue uses the official deadline." />
      ) : (
        <RecordList className="space-y-3" sortLabel="Active">
          {filtered.map((row) => (
            <article
              key={row.person.id}
              data-record=""
              data-sort={String(row.active).padStart(4, "0")}
              data-label-text={row.person.fullName}
              className="rounded-[18px] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <PersonAvatar personId={row.person.id} name={row.person.fullName} hasPhoto={Boolean(row.person.photoStorageKey)} version={row.person.updatedAt.getTime()} size="sm" />
                <div className="min-w-0">
                  <Link href={`/team/${row.person.id}`} className="block truncate text-base font-bold text-text hover:text-primary">{row.person.fullName}</Link>
                  <p className="text-xs text-secondary">{row.person.positionTitle?.trim() || "No position title"}</p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-[12px] bg-canvas px-3 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Active</dt>
                  <dd className="mt-1 text-lg font-bold">{row.active}</dd>
                </div>
                <div className="rounded-[12px] bg-canvas px-3 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Overdue</dt>
                  <dd className={`mt-1 text-lg font-bold ${row.overdue > 0 ? "text-error" : "text-text"}`}>{row.overdue}</dd>
                </div>
                <div className="rounded-[12px] bg-canvas px-3 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Planned min</dt>
                  <dd className="mt-1 text-lg font-bold">{row.planned}</dd>
                </div>
                <div className="rounded-[12px] bg-canvas px-3 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Actual min</dt>
                  <dd className="mt-1 text-lg font-bold">{row.actual}</dd>
                </div>
              </dl>
            </article>
          ))}
        </RecordList>
      )}
      <p className="text-xs text-secondary">Planned and actual minutes are the sum of recorded time entries. A calendar block is not counted here.</p>
    </div>
  );
}
