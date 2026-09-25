import { getAuthContext } from "@/lib/auth/context";
import { dashboardData } from "@/lib/queries";
import { Badge, Card, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NoticeCarousel } from "@/components/notice-carousel";

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const data = await dashboardData(ctx.person.id);
  const date = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div>
      <PageHeader title={`Hello, ${ctx.person.preferredName ?? ctx.person.fullName}`} description={date} />
      <div className="mb-6">
        <NoticeCarousel
          notices={data.notices.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            kind: n.kind,
            requiresParticipation: Boolean(n.requiresParticipation),
          }))}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs text-secondary">My open tasks</p>
          <p className="mt-1 text-2xl font-semibold">{data.myTaskCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-secondary">Pending acknowledgement</p>
          <p className="mt-1 text-2xl font-semibold">{data.pendingAck.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-secondary">Overdue (official deadline)</p>
          <p className="mt-1 text-2xl font-semibold text-error">{data.overdue.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-secondary">Active projects</p>
          <p className="mt-1 text-2xl font-semibold">{data.activeProjects.length}</p>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">Upcoming deadlines</h2>
          {data.upcoming.length === 0 ? (
            <EmptyState title="No upcoming deadlines" body="Assigned tasks with official deadlines will appear here." />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.upcoming.map((t) => (
                <li key={t.id} className="flex justify-between gap-2">
                  <Link className="text-info" href={`/tasks/${t.id}`}>
                    {t.title}
                  </Link>
                  <span className="text-secondary">{formatDate(t.officialDeadline)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Notifications</h2>
          {data.notifications.length === 0 ? (
            <EmptyState title="No notifications" body="Events that need your awareness will appear here." />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.notifications.map((n) => (
                <li key={n.id}>
                  <Link className="text-info" href={n.href || "/notifications"}>
                    {n.title}
                  </Link>
                  <p className="text-secondary">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Content pipeline</h2>
          {data.contentPipeline.length === 0 ? (
            <EmptyState title="No content records" body="Create content to track planning through publishing." />
          ) : (
            <ul className="space-y-2 text-sm">
              {data.contentPipeline.slice(0, 6).map((c) => (
                <li key={c.id} className="flex justify-between">
                  <Link href={`/content/${c.id}`}>{c.title}</Link>
                  <Badge tone={statusTone(c.stage)}>{c.stage}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Team activity</h2>
          {data.activity.length === 0 ? (
            <EmptyState title="No activity yet" body="Operational events will be recorded here." />
          ) : (
            <ul className="space-y-2 text-sm text-secondary">
              {data.activity.map((a) => (
                <li key={a.id}>{a.summary}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
