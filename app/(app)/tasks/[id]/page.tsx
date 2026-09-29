import { eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Clock3, Paperclip, Users } from "lucide-react";
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
import { PersonAvatar } from "@/components/person-avatar";
import { Badge, Button, Card, Field, Input, Select, Textarea, statusTone } from "@/components/ui";
import { DeadlineStamp, StatusStepper, WorkHero, priorityBar } from "@/components/work-surface";
import { formatDateTime, readableLabel } from "@/lib/utils";
import { COLLAB_ROLES, TASK_TRANSITIONS, formatOverdueLabel, isTaskOverdue, type TaskStatus } from "@/lib/permissions";

function Fact({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-text">{children}</dd>
    </div>
  );
}

function PersonRow({
  label,
  person,
}: {
  label: string;
  person?: { id: string; fullName: string; photoStorageKey: string | null; updatedAt: Date; positionTitle: string | null } | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-canvas px-3 py-2.5">
      {person ? (
        <PersonAvatar personId={person.id} name={person.fullName} hasPhoto={Boolean(person.photoStorageKey)} version={person.updatedAt.getTime()} size="sm" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-xs font-bold text-white">?</span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
        <p className="truncate text-sm font-semibold text-text">{person?.fullName ?? "Unassigned"}</p>
        {person?.positionTitle ? <p className="truncate text-xs text-secondary">{readableLabel(person.positionTitle)}</p> : null}
      </div>
    </div>
  );
}

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
  const completionIds = completions.map((completion) => completion.id);
  const [compDeliverables, compPeople] = await Promise.all([
    completionIds.length
      ? db.select().from(completionDeliverables).where(inArray(completionDeliverables.completionId, completionIds))
      : Promise.resolve([] as (typeof completionDeliverables.$inferSelect)[]),
    completionIds.length
      ? db.select().from(completionPeople).where(inArray(completionPeople.completionId, completionIds))
      : Promise.resolve([] as (typeof completionPeople.$inferSelect)[]),
  ]);
  const nexts = TASK_TRANSITIONS[task.status as TaskStatus] ?? [];
  const assignee = peopleRows.find((person) => person.id === task.assigneeId);
  const assigner = peopleRows.find((person) => person.id === task.creatorId);
  const project = projects.find((item) => item.id === task.projectId);
  const latest = completions[completions.length - 1];
  const statusLabel = latest ? "Completion Submitted" : readableLabel(task.status);
  const overdue = isTaskOverdue(task);
  const timeline = [...history].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const moves = nexts.filter((status) => status !== "acknowledged" && status !== "completed" && status !== "submitted");

  return (
    <div className="space-y-5">
      <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft size={16} aria-hidden />
        All tasks
      </Link>
      <WorkHero
        illustration="tasks"
        kicker="Work Task Notice — Martech Department"
        title={task.title}
        description={task.purpose || "Formal assigned task record. Official status, assignee, and deadline live here."}
        actions={
          <>
            <Badge tone={statusTone(task.status)}>{statusLabel}</Badge>
            <Badge tone={statusTone(task.priority)}>{task.priority}</Badge>
            {task.category ? <Badge tone="neutral">{readableLabel(task.category)}</Badge> : null}
            {overdue ? <Badge tone="error">Overdue</Badge> : null}
          </>
        }
      />

      {overdue ? (
        <div className="flex items-start gap-3 rounded-[18px] border border-error/30 bg-error-soft px-4 py-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-error" size={18} aria-hidden />
          <div>
            <p className="text-sm font-bold text-error">Past the official deadline</p>
            <p className="text-sm text-secondary">The deadline on this notice is {formatDateTime(task.officialDeadline)}. Planned working time does not change it.</p>
          </div>
        </div>
      ) : null}

      <StatusStepper status={task.status} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4">
          <Card className="relative overflow-hidden">
            <span className={`absolute inset-y-0 left-0 w-1.5 ${priorityBar(task.priority)}`} aria-hidden />
            <div className="pl-2">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">The notice</p>
                  <h2 className="text-lg font-bold">What this task is</h2>
                </div>
                <DeadlineStamp value={task.officialDeadline} overdue={overdue} />
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Fact label="Task name">{task.title}</Fact>
                <Fact label="Task ID">
                  <span className="font-mono text-xs">{task.id}</span>
                </Fact>
                <Fact label="Date assigned">{formatDateTime(task.assignedAt ?? task.createdAt)}</Fact>
                <Fact label="Project">
                  {project ? (
                    <Link className="font-semibold text-info" href={`/projects/${project.id}`}>
                      {project.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Fact>
                <Fact label="Task purpose" wide>
                  {task.purpose || "—"}
                </Fact>
                <Fact label="What needs to be done" wide>
                  {task.description || "—"}
                </Fact>
                <Fact label="Priority">{readableLabel(task.priority)}</Fact>
                <Fact label="Official deadline">
                  <span className={overdue ? "font-semibold text-error" : "font-semibold"}>{formatDateTime(task.officialDeadline)}</span>
                </Fact>
              </dl>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="text-base font-bold">Subtasks</h2>
              {subtasks.length === 0 ? (
                <p className="mt-3 text-sm text-secondary">No subtasks on this notice.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {subtasks.map((subtask) => (
                    <li key={subtask.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-canvas px-3 py-2.5">
                      <span className="text-sm font-medium text-text">{subtask.title}</span>
                      <Badge tone={statusTone(subtask.status)}>{subtask.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h2 className="text-base font-bold">Expected deliverables</h2>
              {expected.length === 0 ? (
                <p className="mt-3 text-sm text-secondary">No expected deliverables listed.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {expected.map((item) => (
                    <li key={item.id} className="rounded-[12px] border border-border bg-canvas px-3 py-2.5">
                      <p className="text-sm font-semibold text-text">{item.label}</p>
                      {item.description ? <p className="mt-0.5 text-xs leading-relaxed text-secondary">{item.description}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Paperclip size={16} className="text-charcoal" aria-hidden />
              <h2 className="text-base font-bold">References</h2>
            </div>
            {refs.length === 0 ? (
              <p className="text-sm text-secondary">No references or attachments.</p>
            ) : (
              <ul className="space-y-2">
                {refs.map((ref) => (
                  <li key={ref.id} className="rounded-[12px] bg-canvas px-3 py-2.5 text-sm">
                    <span className="font-semibold">{ref.label}</span>
                    {ref.url ? (
                      <a className="mt-0.5 block truncate text-info" href={ref.url}>
                        {ref.url}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="rounded-[18px] border border-info/30 bg-info-soft p-4">
            <div className="flex items-center gap-2 text-info">
              <Clock3 size={16} aria-hidden />
              <p className="text-sm font-bold">Planned working time</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-text">
              {task.plannedStartAt || task.plannedEndAt
                ? `${formatDateTime(task.plannedStartAt)} — ${formatDateTime(task.plannedEndAt)}`
                : "No planned working time on this notice."}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-secondary">Not the official deadline. Rescheduling planned time does not move the deadline or the owner.</p>
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-20">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Users size={16} aria-hidden />
              <h2 className="text-base font-bold">People</h2>
            </div>
            <div className="space-y-2">
              <PersonRow label="Assigned by" person={assigner} />
              <PersonRow label="Handled by" person={assignee} />
            </div>
          </Card>

          <Card accent="yellow">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Next step</p>
            <h2 className="mt-1 text-base font-bold">Move this task</h2>
            <div className="mt-3 flex flex-col gap-2">
              {task.status === "pending_acknowledgement" ? (
                <form
                  action={async () => {
                    "use server";
                    await acknowledgeTask(id);
                  }}
                >
                  <Button type="submit" className="w-full">
                    Acknowledge task
                  </Button>
                </form>
              ) : null}
              {moves.map((status) => (
                <form
                  key={status}
                  action={async () => {
                    "use server";
                    await transitionTask(id, status);
                  }}
                >
                  <Button type="submit" variant="secondary" className="w-full">
                    Move to {readableLabel(status)}
                  </Button>
                </form>
              ))}
              {task.status !== "pending_acknowledgement" && moves.length === 0 ? (
                <p className="text-sm text-secondary">No status move is available from here. Completion still needs a completion record.</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-bold">Request extension</h2>
            <p className="mb-3 mt-1 text-xs leading-relaxed text-secondary">Submitting a request does not change the official deadline.</p>
            <ActionForm action={requestExtension} submitLabel="Request extension">
              <input type="hidden" name="taskId" value={id} />
              <Field label="Requested deadline">
                <Input name="requestedDeadline" type="datetime-local" required />
              </Field>
              <Field label="Reason">
                <Textarea name="reason" required />
              </Field>
            </ActionForm>
            {extensions.length ? (
              <ul className="mt-4 space-y-2">
                {extensions.map((extension) => (
                  <li key={extension.id} className="rounded-[12px] bg-canvas px-3 py-2 text-xs leading-relaxed text-secondary">
                    <span className="font-semibold text-text">{readableLabel(extension.status)}</span>
                    <span className="mt-0.5 block">Original deadline {formatDateTime(extension.originalDeadline)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card accent="green">
          <h2 className="text-lg font-bold">Completion notice</h2>
          {latest ? (
            <p className="mt-2 text-sm font-semibold text-success">Status: Completion submitted</p>
          ) : (
            <div className="mt-3">
              <CompletionNotice
                taskId={id}
                ownerId={task.assigneeId}
                people={peopleRows.map((person) => ({ id: person.id, fullName: person.fullName }))}
              />
            </div>
          )}
          <div className="mt-3 space-y-3">
            {completions.map((completion) => {
              const deliverables = compDeliverables.filter((item) => item.completionId === completion.id);
              const involved = compPeople.filter((item) => item.completionId === completion.id);
              return (
                <article key={completion.id} className="rounded-[16px] border border-success/30 bg-success-soft/40 p-4 text-sm">
                  <p className="font-bold text-text">Completion record</p>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Fact label="Submitted by">{peopleRows.find((person) => person.id === completion.completedById)?.fullName ?? "—"}</Fact>
                    <Fact label="Overdue">{formatOverdueLabel(completion.overdueDays ?? 0)}</Fact>
                    <Fact label="Work completed">{formatDateTime(completion.workCompletedAt)}</Fact>
                    <Fact label="Submitted">{formatDateTime(completion.submittedAt ?? completion.createdAt)}</Fact>
                    <Fact label="Summary" wide>
                      {completion.summary}
                    </Fact>
                  </dl>
                  {deliverables.length ? (
                    <ul className="mt-3 space-y-1.5">
                      {deliverables.map((item) => (
                        <li key={item.id} className="rounded-[12px] bg-surface px-3 py-2">
                          <span className="font-semibold">{item.label}</span>
                          {item.description ? <span className="text-secondary"> — {item.description}</span> : null}
                          {item.url ? <span className="block truncate text-xs text-info">{item.url}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-3 text-secondary">Issues: {completion.problems || "No issues encountered"}</p>
                  {involved.map((person) => (
                    <p key={person.id} className="mt-1">
                      {peopleRows.find((row) => row.id === person.personId)?.fullName} — {person.roleInTask}: {person.contribution}
                    </p>
                  ))}
                  <div className="mt-3 grid gap-2 rounded-[12px] bg-surface p-3 text-xs leading-relaxed">
                    <p>
                      <span className="font-semibold">Learned. </span>
                      {completion.learned}
                    </p>
                    <p>
                      <span className="font-semibold">Do differently. </span>
                      {completion.doDifferently || completion.selfReflection}
                    </p>
                    <p>
                      <span className="font-semibold">Remember. </span>
                      {completion.rememberNext}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">People involved</h2>
          <p className="mt-1 text-xs leading-relaxed text-secondary">Task owner (Handled by) is not changed by this list.</p>
          <ul className="mt-3 space-y-2">
            <li className="rounded-[12px] bg-canvas px-3 py-2.5 text-sm">
              <span className="font-semibold">{assignee?.fullName ?? "—"}</span>
              <span className="mt-0.5 block text-xs text-secondary">Task owner</span>
            </li>
            {collabs.map((collab) => (
              <li key={collab.id} className="rounded-[12px] bg-canvas px-3 py-2.5 text-sm">
                <span className="font-semibold">{peopleRows.find((person) => person.id === collab.personId)?.fullName}</span>
                <span className="mt-0.5 block text-xs text-secondary">
                  {collab.roleInTask || "Contributor"}
                  {collab.contribution ? ` — ${collab.contribution}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-4">
            <ActionForm action={addCollaborator} submitLabel="Add collaborator">
              <input type="hidden" name="taskId" value={id} />
              <Field label="Person">
                <Select name="personId">
                  {peopleRows
                    .filter((person) => person.id !== task.assigneeId)
                    .map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.fullName}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Role in this task">
                <Select name="roleInTask" defaultValue="Contributor">
                  {COLLAB_ROLES.filter((role) => role !== "Task Owner").map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Contribution">
                <Textarea name="contribution" />
              </Field>
            </ActionForm>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-bold">History</h2>
        {timeline.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">No activity on this task yet.</p>
        ) : (
          <ol className="relative mt-4 space-y-4 border-l-2 border-border pl-5">
            {timeline.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{formatDateTime(entry.createdAt)}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-text">{entry.summary}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
