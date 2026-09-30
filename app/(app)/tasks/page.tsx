import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarDays, CheckCheck, Kanban, ListChecks } from "lucide-react";
import { createTask } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { listPeople, listProjects, listTasks } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, StatusRail, ViewPills, WorkHero, linkButton, taskCard } from "@/components/work-surface";
import { isTaskOverdue, TASK_CATEGORIES, TASK_STATUSES } from "@/lib/permissions";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { tab = "all" } = await searchParams;
  const canAssign = hasPermission(ctx, "task:assign");
  const canCreate = hasPermission(ctx, "task:create");
  const [rows, projects, peopleRows] = await Promise.all([listTasks(), listProjects(), listPeople()]);
  const names = new Map(peopleRows.map((person) => [person.id, person.fullName]));
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const filtered = rows.filter((task) => {
    if (tab === "mine") return task.assigneeId === ctx.person.id;
    if (tab === "assigned") return task.creatorId === ctx.person.id;
    if (tab === "completed") return task.status === "completed";
    if (tab === "overdue") return isTaskOverdue(task);
    if (tab === "team") return ctx.subordinateIds.includes(task.assigneeId ?? "");
    return true;
  });
  const open = rows.filter((task) => task.status !== "completed");
  const overdue = rows.filter((task) => isTaskOverdue(task));
  const inProgress = rows.filter((task) => task.status === "in_progress");
  const counts = Object.fromEntries(TASK_STATUSES.map((status) => [status, rows.filter((task) => task.status === status).length]));
  const tabs = [
    ["all", "All", rows.length],
    ["mine", "Mine", rows.filter((task) => task.assigneeId === ctx.person.id).length],
    ["assigned", "Assigned by me", rows.filter((task) => task.creatorId === ctx.person.id).length],
    ["team", "Team", rows.filter((task) => ctx.subordinateIds.includes(task.assigneeId ?? "")).length],
    ["overdue", "Overdue", overdue.length],
    ["completed", "Completed", rows.filter((task) => task.status === "completed").length],
  ] as const;
  const summary =
    rows.length === 0
      ? "No tasks are on the board yet. A new task keeps its official status, assignee, and deadline on the record."
      : `${open.length} open of ${rows.length} tasks${overdue.length ? `, ${overdue.length} past the official deadline` : ""}.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="tasks"
        kicker="Tasks"
        title="Work board"
        description={summary}
        actions={
          <>
            <Link className={linkButton("primary")} href="/my-tasks">
              My tasks
            </Link>
            <Link className={linkButton()} href="/kanban">
              Kanban
            </Link>
            <Link className={linkButton()} href="/calendar">
              Calendar
            </Link>
            {canCreate ? (
              <a className={linkButton()} href="#create-task">
                Create task
              </a>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Open" value={open.length} note="Every task that is not completed." icon={ListChecks} wash="bg-yellow-soft" ink="text-warning" href="/tasks?tab=all" />
        <Metric label="Overdue" value={overdue.length} note="Past the official deadline, still open." icon={AlertTriangle} wash="bg-error-soft" ink="text-error" valueClass="text-error" href="/tasks?tab=overdue" />
        <Metric label="In progress" value={inProgress.length} note="Acknowledged work that is underway." icon={Kanban} wash="bg-purple-soft" ink="text-purple" href="/kanban" />
        <Metric label="Completed" value={rows.length - open.length} note="Closed with a completion record." icon={CheckCheck} wash="bg-green-soft" ink="text-success" href="/tasks?tab=completed" />
      </div>

      <StatusRail counts={counts} hrefFor={() => "/kanban"} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 space-y-4">
          <ViewPills
            items={tabs.map(([key, label, count]) => ({
              key,
              href: `/tasks?tab=${key}`,
              label,
              active: tab === key,
              count,
            }))}
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="No tasks in this view"
              body="Create a task or switch the filter above."
              action={
                <Link className={linkButton()} href="/calendar">
                  <CalendarDays size={16} />
                  Open calendar
                </Link>
              }
            />
          ) : (
            <RecordList className="space-y-3" sortLabel="Deadline">
              {filtered.map((task) =>
                taskCard({
                  task,
                  assignee: task.assigneeId ? names.get(task.assigneeId) : null,
                  project: task.projectId ? projectNames.get(task.projectId) : null,
                }),
              )}
            </RecordList>
          )}
        </section>

        {canCreate ? (
          <Card id="create-task" className="scroll-mt-4 xl:sticky xl:top-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">New record</p>
            <h2 className="mt-1 text-lg font-bold">Create task</h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">
              {canAssign
                ? "Title, assignee, and official deadline are stored on the task. Planned time does not move the deadline."
                : "You can create a task for yourself only. Assigning work to others is limited to executive and management."}
            </p>
            <ActionForm action={createTask} submitLabel="Create task">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">What</p>
              <Field label="Title">
                <Input name="title" required />
              </Field>
              <Field label="Description / What needs to be done">
                <Textarea name="description" />
              </Field>
              <Field label="Task purpose">
                <Textarea name="purpose" />
              </Field>
              <Field label="Task type / category">
                <Select name="category">
                  <option value="">None</option>
                  {TASK_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </Select>
              </Field>
              <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Who</p>
              <Field label="Project">
                <Select name="projectId">
                  <option value="">None</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {canAssign ? (
                <Field label="Assignee">
                  <Select name="assigneeId">
                    <option value="">Draft (unassigned)</option>
                    {peopleRows.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.fullName}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <input type="hidden" name="assigneeId" value={ctx.person.id} />
              )}
              <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">When</p>
              <Field label="Official deadline">
                <Input name="officialDeadline" type="datetime-local" />
              </Field>
              <Field label="Planned start">
                <Input name="plannedStartAt" type="datetime-local" />
              </Field>
              <Field label="Planned end">
                <Input name="plannedEndAt" type="datetime-local" />
              </Field>
            </ActionForm>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
