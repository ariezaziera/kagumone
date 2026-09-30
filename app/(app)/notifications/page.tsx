import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Bell, CircleAlert, Mail } from "lucide-react";
import { markNotificationsRead } from "@/lib/actions/notifications";
import { NotificationOpenLink } from "@/components/notification-bell";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { Button, Badge, EmptyState } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { formatDateTime, readableLabel } from "@/lib/utils";

const KIND_BAR: Record<string, string> = {
  task_assigned: "bg-yellow",
  extension_request: "bg-orange",
  extension_decision: "bg-green",
  equipment: "bg-green",
  handover: "bg-pink",
  kpi_changed: "bg-blue",
  password_reset: "bg-primary",
  profile_updated: "bg-pink",
  project: "bg-blue",
};

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { filter = "all" } = await searchParams;
  const view = filter === "unread" || filter === "attention" ? filter : "all";
  const rows = (await db.select().from(notifications).where(eq(notifications.personId, ctx.person.id)))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const unread = rows.filter((row) => !row.readAt);
  const attention = rows.filter((row) => !row.handledAt);
  const filtered = view === "unread" ? unread : view === "attention" ? attention : rows;
  const summary = rows.length === 0
    ? "Events that need awareness or a next step land here, with a link back to the record."
    : `${unread.length} unread, ${attention.length} not marked handled.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="quiet"
        kicker="Notifications"
        title="Your inbox"
        artWash="bg-yellow-soft"
        description={summary}
        actions={
          <>
            {unread.length > 0 ? (
              <form
                action={async () => {
                  "use server";
                  await markNotificationsRead();
                }}
              >
                <Button type="submit" variant="secondary">Mark all as read</Button>
              </form>
            ) : null}
            <Link className={linkButton()} href="/settings">Settings</Link>
            <Link className={linkButton()} href="/profile">Profile</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Metric label="All" value={rows.length} note="Notifications addressed to you." icon={Bell} wash="bg-yellow-soft" ink="text-warning" href="/notifications" />
        <Metric label="Unread" value={unread.length} note="Not opened yet." icon={Mail} wash="bg-blue-soft" ink="text-info" href="/notifications?filter=unread" />
        <Metric label="Open" value={attention.length} note="Not marked handled." icon={CircleAlert} wash="bg-orange-soft" ink="text-orange" href="/notifications?filter=attention" />
      </div>
      <ViewPills
        items={[
          { key: "all", href: "/notifications", label: "All", active: view === "all", count: rows.length },
          { key: "unread", href: "/notifications?filter=unread", label: "Unread", active: view === "unread", count: unread.length },
          { key: "attention", href: "/notifications?filter=attention", label: "Open", active: view === "attention", count: attention.length },
        ]}
      />
      {filtered.length === 0 ? (
        <EmptyState
          illustration="caught-up"
          title={view === "all" ? "All quiet here" : "Nothing in this view"}
          body={view === "unread" ? "Every notification has been marked read." : "New events that need you will show the record they belong to."}
        />
      ) : (
        <RecordList className="space-y-3" sortLabel="When">
          {filtered.map((row) => {
            const href = row.href && row.href !== "#" ? row.href : null;
            return (
              <article
                key={row.id}
                data-record=""
                data-sort={row.createdAt ? new Date(row.createdAt).toISOString() : ""}
                data-label-text={`${row.title} ${row.body} ${row.kind}`}
                className="relative overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]"
              >
                <span className={`absolute inset-y-0 left-0 w-1.5 ${KIND_BAR[row.kind] ?? "bg-charcoal"}`} aria-hidden />
                <div className="px-4 py-3.5 pl-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="blue">{readableLabel(row.kind)}</Badge>
                    {!row.readAt ? <Badge tone="yellow">Unread</Badge> : null}
                    {!row.handledAt ? <Badge tone="orange">Open</Badge> : null}
                  </div>
                  {href ? (
                    <NotificationOpenLink id={row.id} href={href} className="mt-1.5 block text-base font-bold text-text hover:text-primary">
                      {row.title}
                    </NotificationOpenLink>
                  ) : (
                    <h2 className="mt-1.5 text-base font-bold text-text">{row.title}</h2>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-secondary">{row.body}</p>
                  <p className="mt-2 text-xs text-secondary">{formatDateTime(row.createdAt)}</p>
                </div>
              </article>
            );
          })}
        </RecordList>
      )}
    </div>
  );
}
