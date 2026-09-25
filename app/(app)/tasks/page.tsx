import Link from "next/link";
import { createTask } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { listPeople, listProjects, listTasks } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, Table, Textarea, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { isTaskOverdue } from "@/lib/permissions";
import { TASK_CATEGORIES } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { tab = "all" } = await searchParams;
  const canAssign = hasPermission(ctx, "task:assign");
  const canCreate = hasPermission(ctx, "task:create");
  const [rows, projects, peopleRows] = await Promise.all([listTasks(), listProjects(), listPeople()]);
  const filtered = rows.filter((t) => {
    if (tab === "mine") return t.assigneeId === ctx.person.id;
    if (tab === "assigned") return t.creatorId === ctx.person.id;
    if (tab === "completed") return t.status === "completed";
    if (tab === "team") return ctx.subordinateIds.includes(t.assigneeId ?? "");
    return true;
  });
  const tabs = [
    ["all", "All Tasks"],
    ["mine", "My Tasks"],
    ["assigned", "Assigned by Me"],
    ["team", "Team Tasks"],
    ["completed", "Completed"],
  ];
  return (
    <div>
      <PageHeader title="Tasks" description="Official status, assignee, and deadline live on the task record." />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={`/tasks?tab=${key}`}
            className={`rounded-md px-3 py-1 text-sm ${tab === key ? "bg-primary text-white" : "bg-surface border border-border"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {filtered.length === 0 ? (
          <EmptyState title="No tasks in this view" body="Create a task or change filters." />
        ) : (
          <Table>
            <thead className="bg-primary-light text-xs uppercase text-secondary">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link className="text-info" href={`/tasks/${t.id}`}>
                      {t.title}
                    </Link>
                    {isTaskOverdue(t) ? <span className="ml-2 text-xs text-error">Overdue</span> : null}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                  </td>
                  <td className="px-3 py-2">{t.priority}</td>
                  <td className="px-3 py-2">{formatDate(t.officialDeadline)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {canCreate ? (
        <Card>
          <h2 className="mb-3 font-medium">Create task</h2>
          {!canAssign ? (
            <p className="mb-2 text-xs text-secondary">You can create a task for yourself only. Assigning work to others is limited to executive and management.</p>
          ) : null}
          <ActionForm action={createTask} submitLabel="Create task">
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
                {TASK_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Project">
              <Select name="projectId">
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            {canAssign ? (
            <Field label="Assignee">
              <Select name="assigneeId">
                <option value="">Draft (unassigned)</option>
                {peopleRows.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </Select>
            </Field>
            ) : (
              <input type="hidden" name="assigneeId" value={ctx.person.id} />
            )}
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
