import { eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  activityLogs,
  completionDeliverables,
  completionPeople,
  taskCollaborators,
  taskCompletions,
  taskDeliverables,
  taskExtensions,
  taskReferences,
  taskSubtasks,
} from "@/lib/db/schema";
import { acknowledgeTask, addCollaborator, requestExtension, transitionTask } from "@/lib/actions/core";
import { getAuthContext } from "@/lib/auth/context";
import { getTask, listPeople, listProjects } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { CompletionNotice } from "@/components/completion-notice";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Textarea, statusTone } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { COLLAB_ROLES, TASK_TRANSITIONS, formatOverdueLabel, type TaskStatus } from "@/lib/permissions";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const task = await getTask(id);
  if (!task) notFound();
  const [peopleRows, projects, completions, extensions, collabs, subtasks, expected, refs, history] = await Promise.all([
    listPeople(),
    listProjects(),
    db.select().from(taskCompletions).where(eq(taskCompletions.taskId, id)),
    db.select().from(taskExtensions).where(eq(taskExtensions.taskId, id)),
    db.select().from(taskCollaborators).where(eq(taskCollaborators.taskId, id)),
    db.select().from(taskSubtasks).where(eq(taskSubtasks.taskId, id)),
    db.select().from(taskDeliverables).where(eq(taskDeliverables.taskId, id)),
    db.select().from(taskReferences).where(eq(taskReferences.taskId, id)),
    db.select().from(activityLogs).where(eq(activityLogs.entityId, id)),
  ]);
  const completionIds = completions.map((c) => c.id);
  const [compDeliverables, compPeople] = await Promise.all([
    completionIds.length
      ? db.select().from(completionDeliverables).where(inArray(completionDeliverables.completionId, completionIds))
      : Promise.resolve([] as (typeof completionDeliverables.$inferSelect)[]),
    completionIds.length
      ? db.select().from(completionPeople).where(inArray(completionPeople.completionId, completionIds))
      : Promise.resolve([] as (typeof completionPeople.$inferSelect)[]),
  ]);
  const nexts = TASK_TRANSITIONS[task.status as TaskStatus] ?? [];
  const assignee = peopleRows.find((p) => p.id === task.assigneeId);
  const assigner = peopleRows.find((p) => p.id === task.creatorId);
  const project = projects.find((p) => p.id === task.projectId);
  const latest = completions[completions.length - 1];
  const statusLabel = latest ? "Completion Submitted" : task.status.replaceAll("_", " ");

  return (
    <div>
      <PageHeader title="Work Task Notice — Martech Department" description="Formal assigned task record." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-2 text-sm">
          <Badge tone={statusTone(task.status)}>{statusLabel}</Badge>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-secondary">Task ID</dt>
              <dd className="font-mono text-xs">{task.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-secondary">Date Assigned</dt>
              <dd>{formatDateTime(task.assignedAt ?? task.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-secondary">Assigned By</dt>
              <dd>{assigner?.fullName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-secondary">Handled By</dt>
              <dd>{assignee?.fullName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-secondary">Project Name</dt>
              <dd>
                {project ? (
                  <Link className="text-info" href={`/projects/${project.id}`}>
                    {project.name}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-secondary">Task Name</dt>
              <dd>{task.title}</dd>
            </div>
            <div>
              <dt className="text-xs text-secondary">Task Purpose</dt>
              <dd>{task.purpose || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-secondary">Task Type / Category</dt>
              <dd>{task.category || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-secondary">What Needs To Be Done</dt>
              <dd>{task.description || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-secondary">Priority</dt>
              <dd>{task.priority}</dd>
            </div>
            <div>
              <dt className="text-xs text-error">Official Deadline</dt>
              <dd className="font-medium text-error">{formatDateTime(task.officialDeadline)}</dd>
            </div>
          </dl>
          <div>
            <p className="text-xs text-secondary">Subtasks</p>
            {subtasks.length === 0 ? <p>—</p> : subtasks.map((s) => <p key={s.id}>{s.title} ({s.status})</p>)}
          </div>
          <div>
            <p className="text-xs text-secondary">Expected Deliverables</p>
            {expected.length === 0 ? (
              <p>—</p>
            ) : (
              expected.map((d) => (
                <p key={d.id}>
                  {d.label}
                  {d.description ? ` — ${d.description}` : ""}
                </p>
              ))
            )}
          </div>
          <div>
            <p className="text-xs text-secondary">References / Attachments</p>
            {refs.length === 0 ? <p>—</p> : refs.map((r) => <p key={r.id}>{r.label} {r.url}</p>)}
          </div>
          <div className="rounded-md border border-info/40 bg-primary-light p-3">
            <p className="text-xs font-medium text-info">Planned Working Time</p>
            <p>
              {formatDateTime(task.plannedStartAt)} — {formatDateTime(task.plannedEndAt)}
            </p>
            <p className="text-xs text-secondary">Not the official deadline. Rescheduling planned time does not move the deadline.</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {task.status === "pending_acknowledgement" ? (
              <form
                action={async () => {
                  "use server";
                  await acknowledgeTask(id);
                }}
              >
                <Button type="submit">Acknowledge task</Button>
              </form>
            ) : null}
            {nexts
              .filter((s) => s !== "acknowledged" && s !== "completed" && s !== "submitted")
              .map((s) => (
                <form
                  key={s}
                  action={async () => {
                    "use server";
                    await transitionTask(id, s);
                  }}
                >
                  <Button type="submit" variant="secondary">
                    Move to {s}
                  </Button>
                </form>
              ))}
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Request extension</h2>
          <p className="mb-2 text-xs text-secondary">Submitting a request does not change the official deadline.</p>
          <ActionForm action={requestExtension} submitLabel="Request extension">
            <input type="hidden" name="taskId" value={id} />
            <Field label="Requested deadline">
              <Input name="requestedDeadline" type="datetime-local" required />
            </Field>
            <Field label="Reason">
              <Textarea name="reason" required />
            </Field>
          </ActionForm>
          <ul className="mt-3 text-xs text-secondary">
            {extensions.map((e) => (
              <li key={e.id}>
                {e.status}: original {formatDateTime(e.originalDeadline)}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-medium">Completion Notice</h2>
          {latest ? (
            <p className="mb-2 text-sm text-success">Status: Completion Submitted</p>
          ) : (
            <CompletionNotice
              taskId={id}
              ownerId={task.assigneeId}
              people={peopleRows.map((p) => ({ id: p.id, fullName: p.fullName }))}
            />
          )}
          {completions.map((c) => {
            const dels = compDeliverables.filter((d) => d.completionId === c.id);
            const involved = compPeople.filter((p) => p.completionId === c.id);
            return (
              <div key={c.id} className="mt-3 rounded-md border border-success/30 p-3 text-sm">
                <p className="font-medium">Completion record</p>
                <p>Submitted by {peopleRows.find((p) => p.id === c.completedById)?.fullName}</p>
                <p className="text-success">Work Completed At: {formatDateTime(c.workCompletedAt)}</p>
                <p className="text-success">Completion Submitted At: {formatDateTime(c.submittedAt ?? c.createdAt)}</p>
                <p className="text-error">Overdue: {formatOverdueLabel(c.overdueDays ?? 0)}</p>
                <p className="mt-2">{c.summary}</p>
                <ul className="mt-2">
                  {dels.map((d) => (
                    <li key={d.id}>
                      {d.label}: {d.description} {d.url ? `(${d.url})` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-2">Issues: {c.problems || "No issues encountered"}</p>
                {involved.map((p) => (
                  <p key={p.id}>
                    {peopleRows.find((x) => x.id === p.personId)?.fullName} — {p.roleInTask}: {p.contribution}
                  </p>
                ))}
                <p className="mt-2">Learned: {c.learned}</p>
                <p>Do differently: {c.doDifferently || c.selfReflection}</p>
                <p>Remember: {c.rememberNext}</p>
              </div>
            );
          })}
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">People Involved / Collaboration</h2>
          <p className="mb-2 text-xs text-secondary">Task owner (Handled By) is not changed by this list.</p>
          <ul className="mb-2 text-sm">
            <li>
              {assignee?.fullName ?? "—"} — Task Owner
            </li>
            {collabs.map((c) => (
              <li key={c.id}>
                {peopleRows.find((p) => p.id === c.personId)?.fullName} — {c.roleInTask || "Contributor"}
                {c.contribution ? `: ${c.contribution}` : ""}
              </li>
            ))}
          </ul>
          <ActionForm action={addCollaborator} submitLabel="Add collaborator">
            <input type="hidden" name="taskId" value={id} />
            <Field label="Person">
              <Select name="personId">
                {peopleRows
                  .filter((p) => p.id !== task.assigneeId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Role in this task">
              <Select name="roleInTask" defaultValue="Contributor">
                {COLLAB_ROLES.filter((r) => r !== "Task Owner").map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </Select>
            </Field>
            <Field label="Contribution">
              <Textarea name="contribution" />
            </Field>
          </ActionForm>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="mb-2 font-medium">History</h2>
        <ul className="space-y-2 text-sm text-secondary">
          {history.map((h) => (
            <li key={h.id}>
              {formatDateTime(h.createdAt)} — {h.summary}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
