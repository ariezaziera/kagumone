import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { listTasks } from "@/lib/queries";
import { Badge, Card, EmptyState, PageHeader, statusTone } from "@/components/ui";
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
      <PageHeader title="My Tasks" description="Work assigned to you that needs action." />
      {overdue.length ? (
        <Card className="mb-4 border-error">
          <h2 className="font-medium text-error">Overdue</h2>
          <ul className="mt-2 text-sm">
            {overdue.map((t) => (
              <li key={t.id}>
                <Link href={`/tasks/${t.id}`}>{t.title}</Link> — {formatDate(t.officialDeadline)}
              </li>
            ))}
          </ul>
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
                rows.map((t) => (
                  <div key={t.id} className="mb-2 flex justify-between text-sm">
                    <Link className="text-info" href={`/tasks/${t.id}`}>
                      {t.title}
                    </Link>
                    <Badge tone={statusTone(t.status)}>{formatDate(t.officialDeadline)}</Badge>
                  </div>
                ))
              )}
            </Card>
          );
        })}
        <Card>
          <h2 className="mb-2 font-medium">Today / acknowledged</h2>
          {today.map((t) => (
            <p key={t.id} className="text-sm">
              <Link href={`/tasks/${t.id}`}>{t.title}</Link>
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
}
