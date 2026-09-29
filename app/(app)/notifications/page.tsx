import { eq } from "drizzle-orm";
import { markNotificationsRead } from "@/lib/actions/core";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { Button, Card, EmptyState, PageHeader, RecordList, buttonClass } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { filter = "all" } = await searchParams;
  const rows = await db.select().from(notifications).where(eq(notifications.personId, ctx.person.id));
  const filtered = rows.filter((n) => {
    if (filter === "unread") return !n.readAt;
    if (filter === "attention") return !n.handledAt;
    return true;
  });
  return (
    <div>
      <PageHeader
        module="workspace"
        title="Notifications"
        description="Only events that need awareness or action."
        actions={
          <form
            action={async () => {
              "use server";
              await markNotificationsRead();
            }}
          >
            <Button type="submit" variant="secondary">
              Mark all as read
            </Button>
          </form>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["unread", "Unread"],
            ["attention", "Needs attention"],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={`/notifications?filter=${key}`}
            aria-current={filter === key ? "page" : undefined}
            className={buttonClass(filter === key ? "primary" : "secondary", "px-3 py-1.5")}
          >
            {label}
          </Link>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="All quiet here" body="You don't have any new notifications." illustration="quiet" />
      ) : (
        <RecordList className="space-y-2">
        {filtered.map((n) => (
          <Card key={n.id} data-record="" data-sort={n.createdAt ? new Date(n.createdAt).toISOString() : n.title}>
            <Link href={n.href || "#"} className="font-medium text-info">
              {n.title}
            </Link>
            <p className="text-sm">{n.body}</p>
            <p className="text-xs text-secondary">{formatDateTime(n.createdAt)}</p>
          </Card>
        ))}
        </RecordList>
      )}
    </div>
  );
}
