import { eq } from "drizzle-orm";
import { markNotificationsRead } from "@/lib/actions/core";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
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
      <div className="mb-3 flex gap-2 text-sm">
        <Link href="/notifications?filter=all">All</Link>
        <Link href="/notifications?filter=unread">Unread</Link>
        <Link href="/notifications?filter=attention">Needs attention</Link>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No notifications" body="When a task is assigned or an approval is needed, it will show here." />
      ) : (
        filtered.map((n) => (
          <Card key={n.id} className="mb-2">
            <Link href={n.href || "#"} className="font-medium text-info">
              {n.title}
            </Link>
            <p className="text-sm">{n.body}</p>
            <p className="text-xs text-secondary">{formatDateTime(n.createdAt)}</p>
          </Card>
        ))
      )}
    </div>
  );
}
