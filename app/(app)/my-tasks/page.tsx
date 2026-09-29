import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarClock, CheckCheck, Hourglass, ListChecks } from "lucide-react";
import { getAuthContext } from "@/lib/auth/context";
import { listPeople, listProjects, listTasks } from "@/lib/queries";
import { Card, EmptyState } from "@/components/ui";
import { Metric, WorkHero, isSameDisplayDay, linkButton, statusFace, taskCard } from "@/components/work-surface";
import { isTaskOverdue } from "@/lib/permissions";
import { readableLabel } from "@/lib/utils";

const lanes = [
  ["pending_acknowledgement", "Waiting for you to acknowledge the assignment."],
  ["acknowledged", "Accepted, and not started yet."],
  ["in_progress", "Work you have underway."],
  ["submitted", "Completion is in, waiting on the record to close."],
  ["completed", "Closed tasks that were assigned to you."],
  ["draft", "Drafts still assigned to you."],
] as const;

export default async function MyTasksPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const [rows, peopleRows, projects] = await Promise.all([listTasks(), listPeople(), listProjects()]);
  const mine = rows.filter((task) => task.assigneeId === ctx.person.id);
  const names = new Map(peopleRows.map((person) => [person.id, person.fullName]));
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const overdue = mine.filter((task) => isTaskOverdue(task));
  const open = mine.filter((task) => task.status !== "completed");
  const dueToday = open.filter((task) => isSameDisplayDay(task.officialDeadline));
  const waiting = mine.filter((task) => task.status === "pending_acknowledgement");
  const inProgress = mine.filter((task) => task.status === "in_progress");
  const summary =
    open.length === 0
      ? "Nothing assigned to you is still open."
      : `${open.length} open task${open.length === 1 ? "" : "s"}${waiting.length ? `, ${waiting.length} waiting for acknowledgement` : ""}${overdue.length ? `, ${overdue.length} overdue` : ""}.`;
  const visibleLanes = lanes.filter(([status]) => {
    if (status === "draft" || status === "acknowledged") return mine.some((task) => task.status === status);
    return true;
  });

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="tasks"
        kicker="My tasks"
        title="Your work"
        description={summary}
        actions={
          <>
            <Link className={linkButton("primary")} href="/tasks?tab=mine">
              All my records
            </Link>
            <Link className={linkButton()} href="/kanban">
              Kanban
            </Link>
            <Link className={linkButton()} href="/calendar">
              Calendar
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Open" value={open.length} note="Assigned to you and not completed." icon={ListChecks} wash="bg-yellow-soft" ink="text-warning" />
        <Metric label="Overdue" value={overdue.length} note="Official deadline has passed." icon={AlertTriangle} wash="bg-error-soft" ink="text-error" valueClass={overdue.length ? "text-error" : undefined} />
        <Metric label="To acknowledge" value={waiting.length} note="Assigned, and not yet accepted." icon={Hourglass} wash="bg-yellow-soft" ink="text-warning" />
        <Metric label="In progress" value={inProgress.length} note="You have started these." icon={CheckCheck} wash="bg-purple-soft" ink="text-purple" />
      </div>

      {dueToday.length ? (
        <Card accent="orange">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-orange-soft text-orange">
              <CalendarClock size={16} aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Due today</p>
              <h2 className="text-base font-bold">Official deadlines landing today</h2>
            </div>
          </div>
          <div className="space-y-3">
            {dueToday.map((task) =>
              taskCard({
                task,
                assignee: names.get(task.assigneeId ?? ""),
                project: task.projectId ? projectNames.get(task.projectId) : null,
                hint: "Due today",
              }),
            )}
          </div>
        </Card>
      ) : null}

      {overdue.length ? (
        <Card accent="red" className="border-error/40">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-error">Needs attention</p>
              <h2 className="text-lg font-bold text-error">Overdue</h2>
              <p className="mt-1 text-sm text-secondary">Overdue follows the official deadline, not planned working time.</p>
            </div>
            <span className="rounded-full bg-error-soft px-2.5 py-1 text-sm font-bold text-error">{overdue.length}</span>
          </div>
          <div className="space-y-3">
            {overdue.map((task) =>
              taskCard({
                task,
                assignee: names.get(task.assigneeId ?? ""),
                project: task.projectId ? projectNames.get(task.projectId) : null,
              }),
            )}
          </div>
        </Card>
      ) : (
        <EmptyState title="Nothing overdue" body="Overdue is based on the official deadline, not planned work time." />
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {visibleLanes.map(([status, note]) => {
          const lane = mine.filter((task) => task.status === status);
          const face = statusFace(status);
          return (
            <section key={status} className="overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]">
              <div className={`flex items-start justify-between gap-3 px-4 py-3 ${face.wash}`}>
                <div>
                  <h2 className="text-base font-bold text-text">{readableLabel(status)}</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-secondary">{note}</p>
                </div>
                <span className="rounded-full bg-surface px-2.5 py-1 text-sm font-bold text-text">{lane.length}</span>
              </div>
              <div className="p-3">
                {lane.length === 0 ? (
                  <p className="px-1 py-4 text-center text-sm text-secondary">No tasks in this state.</p>
                ) : (
                  <div className="space-y-3">
                    {lane.map((task) =>
                      taskCard({
                        task,
                        project: task.projectId ? projectNames.get(task.projectId) : null,
                      }),
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
