import Link from "next/link";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { CheckCheck, Clock3, ListChecks } from "lucide-react";
import { decideExtension } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { taskExtensions, tasks } from "@/lib/db/schema";
import { allApprovals, listPeople } from "@/lib/queries";
import { recordHref } from "@/components/record-files";
import { ActionForm } from "@/components/action-form";
import { PersonAvatar } from "@/components/person-avatar";
import { Badge, EmptyState, Field, Select, Textarea, statusTone } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { formatDate, formatDateTime, readableLabel } from "@/lib/utils";

const STATUS_BAR: Record<string, string> = {
  pending: "bg-yellow",
  approved: "bg-green",
  rejected: "bg-primary",
};

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { view = "pending" } = await searchParams;
  const canDecide = hasPermission(ctx, "task:approve_extension");
  const [approvalRows, peopleRows] = await Promise.all([allApprovals(), listPeople()]);
  const rows = canDecide
    ? approvalRows
    : approvalRows.filter((row) => row.requesterId === ctx.person.id || row.reviewerId === ctx.person.id);
  const peopleById = new Map(peopleRows.map((person) => [person.id, person]));
  const extensionIds = rows.filter((row) => row.type === "task_extension").map((row) => row.relatedId);
  const extensions = extensionIds.length > 0 ? await db.select().from(taskExtensions).where(inArray(taskExtensions.id, extensionIds)) : [];
  const extensionById = new Map(extensions.map((row) => [row.id, row]));
  const taskIds = [...new Set(extensions.map((row) => row.taskId))];
  const taskRows = taskIds.length > 0 ? await db.select().from(tasks).where(inArray(tasks.id, taskIds)) : [];
  const taskById = new Map(taskRows.map((row) => [row.id, row]));
  const pending = rows.filter((row) => row.status === "pending");
  const decided = rows.filter((row) => row.status !== "pending");
  const filtered = view === "decided" ? decided : view === "all" ? rows : pending;
  const summary = rows.length === 0
    ? "Approval records stay here with the requester, the decision, and the comment."
    : `${pending.length} waiting, ${decided.length} already decided.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="tasks"
        kicker="Approvals"
        title="Decisions"
        artWash="bg-yellow-soft"
        description={canDecide ? `${summary} You can record a decision on a task extension.` : `${summary} Recording a decision uses the extension approval permission.`}
        actions={
          <>
            <Link className={linkButton()} href="/activity">Activity</Link>
            <Link className={linkButton()} href="/tasks">Tasks</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Metric label="Waiting" value={pending.length} note="Requests with no decision yet." icon={Clock3} wash="bg-yellow-soft" ink="text-warning" href="/approvals?view=pending" />
        <Metric label="Decided" value={decided.length} note="Approved and rejected requests." icon={CheckCheck} wash="bg-green-soft" ink="text-success" href="/approvals?view=decided" />
        <Metric label="Extensions" value={rows.filter((row) => row.type === "task_extension").length} note="Task extension requests in this list." icon={ListChecks} wash="bg-orange-soft" ink="text-orange" href="/approvals?view=all" />
      </div>
      <ViewPills
        items={[
          { key: "pending", href: "/approvals?view=pending", label: "Waiting", active: view === "pending", count: pending.length },
          { key: "decided", href: "/approvals?view=decided", label: "Decided", active: view === "decided", count: decided.length },
          { key: "all", href: "/approvals?view=all", label: "All", active: view === "all", count: rows.length },
        ]}
      />
      {filtered.length === 0 ? (
        <EmptyState
          illustration={view === "pending" ? "caught-up" : "search"}
          title={view === "pending" ? "Nothing is waiting" : "No decisions in this view"}
          body={view === "pending" ? "A new request will show the requester, the related record, and room for a decision." : "Decided requests keep the comment and the time of the decision."}
        />
      ) : (
        <RecordList className="space-y-3" sortLabel="Requested">
          {filtered.map((approval) => {
            const requester = peopleById.get(approval.requesterId);
            const reviewer = approval.reviewerId ? peopleById.get(approval.reviewerId) : null;
            const extension = approval.type === "task_extension" ? extensionById.get(approval.relatedId) : null;
            const task = extension ? taskById.get(extension.taskId) : null;
            const relatedHref = task ? `/tasks/${task.id}` : recordHref(approval.relatedType, approval.relatedId);
            return (
              <article
                key={approval.id}
                data-record=""
                data-sort={approval.createdAt ? new Date(approval.createdAt).toISOString() : ""}
                data-label-text={`${readableLabel(approval.type)} ${approval.status} ${requester?.fullName ?? ""} ${reviewer?.fullName ?? ""} ${task?.title ?? ""} ${extension?.reason ?? ""} ${approval.comment ?? ""}`}
                className="relative overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]"
              >
                <span className={`absolute inset-y-0 left-0 w-1.5 ${STATUS_BAR[approval.status] ?? "bg-charcoal"}`} aria-hidden />
                <div className="space-y-3 px-4 py-3.5 pl-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="yellow">{readableLabel(approval.type)}</Badge>
                    <Badge tone={statusTone(approval.status)}>{readableLabel(approval.status)}</Badge>
                  </div>
                  <div className="flex items-start gap-3">
                    <PersonAvatar personId={approval.requesterId} name={requester?.fullName ?? "Requester"} hasPhoto={Boolean(requester?.photoStorageKey)} version={requester?.updatedAt.getTime()} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text">{requester?.fullName ?? "Requester"}</p>
                      <p className="text-xs text-secondary">Requested {formatDateTime(approval.createdAt)}</p>
                    </div>
                  </div>
                  {task ? (
                    <div className="rounded-[14px] bg-canvas px-3 py-2.5">
                      <Link href={`/tasks/${task.id}`} className="text-sm font-semibold text-info">{task.title}</Link>
                      <p className="mt-1 text-xs text-secondary">
                        Official deadline {formatDate(extension?.originalDeadline)} → requested {formatDate(extension?.requestedDeadline)}
                      </p>
                      {extension?.reason ? <p className="mt-2 whitespace-pre-wrap text-sm text-secondary">{extension.reason}</p> : null}
                    </div>
                  ) : relatedHref ? (
                    <Link href={relatedHref} className="text-sm font-semibold text-info">Open related record</Link>
                  ) : null}
                  {approval.status === "pending" && canDecide && approval.type === "task_extension" ? (
                    <ActionForm action={decideExtension} submitLabel="Record decision">
                      <input type="hidden" name="extensionId" value={approval.relatedId} />
                      <Field label="Decision">
                        <Select name="decision">
                          <option value="approved">Approve extension</option>
                          <option value="rejected">Reject extension</option>
                        </Select>
                      </Field>
                      <Field label="Comment">
                        <Textarea name="comment" />
                      </Field>
                    </ActionForm>
                  ) : null}
                  {approval.status === "pending" && !canDecide ? (
                    <p className="text-sm text-secondary">Waiting for someone with the extension approval permission.</p>
                  ) : null}
                  {approval.status === "pending" && canDecide && approval.type !== "task_extension" ? (
                    <p className="text-sm text-secondary">This request type has no decision form on this page.</p>
                  ) : null}
                  {approval.status !== "pending" ? (
                    <div className="rounded-[14px] bg-canvas px-3 py-2.5 text-sm">
                      <p className="font-semibold">{readableLabel(approval.decision || approval.status)}</p>
                      {approval.comment ? <p className="mt-1 whitespace-pre-wrap text-secondary">{approval.comment}</p> : null}
                      <p className="mt-2 text-xs text-secondary">
                        {reviewer?.fullName ?? "Reviewer"} · {formatDateTime(approval.decidedAt ?? approval.createdAt)}
                      </p>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </RecordList>
      )}
    </div>
  );
}
