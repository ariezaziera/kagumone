import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { listTasks } from "@/lib/queries";
import { Badge, Card, EmptyState, PageHeader, RecordList, statusTone } from "@/components/ui";
import { isTaskOverdue } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

const groups = [
  ["pending_acknowledgement", "Pending Acknowledgement"],
  ["in_progress", "In Progress"],
  ["submitted", "Submitted"],
  ["completed", "Completed"],
] as const;

export default async function MyTasksPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const mine = (await listTasks()).filter((t) => t.assigneeId === ctx.person.id);
  const overdue = mine.filter((t) => isTaskOverdue(t));
  const today = mine.filter((t) => t.status === "acknowledged" || t.status === "in_progress");
  return (
    <div>
      <PageHeader module="tasks" title="My Tasks" description="Work assigned to you that needs action." />
      {overdue.length ? (
        <Card className="mb-4 border-error">
          <h2 className="font-medium text-error">Overdue</h2>
          <RecordList>
          <ul className="kagum-list mt-2 text-sm">
            {overdue.map((t) => (
              <li key={t.id} data-record="" data-sort={t.officialDeadline ? new Date(t.officialDeadline).toISOString() : ""}>
                <Link href={`/tasks/${t.id}`}>{t.title}</Link> — {formatDate(t.officialDeadline)}
              </li>
            ))}
          </ul>
          </RecordList>
        </Card>
      ) : (
        <EmptyState title="Nothing overdue" body="Overdue is based on official deadline, not planned work time." />
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {groups.map(([status, label]) => {
          const rows = mine.filter((t) => t.status === status);
          return (
            <Card key={status}>
              <h2 className="mb-2 font-medium">{label}</h2>
              {rows.length === 0 ? (
                <p className="text-sm text-secondary">No tasks in this state.</p>
              ) : (
                <RecordList>
                <div className="kagum-list">
                {rows.map((t) => (
                  <div key={t.id} data-record="" data-sort={t.officialDeadline ? new Date(t.officialDeadline).toISOString() : ""} className="flex items-center justify-between gap-3 text-sm">
                    <Link className="text-info" href={`/tasks/${t.id}`}>
                      {t.title}
                    </Link>
                    <Badge tone={statusTone(t.status)}>{formatDate(t.officialDeadline)}</Badge>
                  </div>
                ))}
                </div>
                </RecordList>
              )}
            </Card>
          );
        })}
        <Card>
          <h2 className="mb-2 font-medium">Today / acknowledged</h2>
          <RecordList>
          <div className="kagum-list">
          {today.map((t) => (
            <p key={t.id} data-record="" className="text-sm">
              <Link href={`/tasks/${t.id}`}>{t.title}</Link>
            </p>
          ))}
          </div>
          </RecordList>
        </Card>
      </div>
    </div>
  );
}
