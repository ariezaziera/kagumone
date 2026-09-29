import { getAuthContext } from "@/lib/auth/context";
import { dashboardData } from "@/lib/queries";
import { Badge, BrandWordmark, Card, EmptyState, RecordList, buttonClass, statusTone } from "@/components/ui";
import { Illustration } from "@/components/illustrations";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NoticeCarousel } from "@/components/notice-carousel";

function greeting(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", hour: "numeric", hourCycle: "h23" }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function isSameLocalDay(value: Date | string | null | undefined, now = new Date()) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
  return fmt.format(date) === fmt.format(now);
}

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
  const name = ctx.person.preferredName ?? ctx.person.fullName;
  const dueToday = data.upcoming.filter((task) => isSameLocalDay(task.officialDeadline)).length;
  const stages = data.contentPipeline.reduce<Record<string, number>>((counts, item) => {
    counts[item.stage] = (counts[item.stage] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div>
      <section className="kagum-hero mb-6 rounded-[22px] border border-border px-5 py-5 shadow-[var(--shadow-card)] sm:px-6">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
              <BrandWordmark />
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-snug sm:text-[30px]">
              {greeting()}, {name}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-secondary">Here&apos;s what&apos;s happening in KAGUM today.</p>
            <p className="mt-3 text-sm font-medium text-text">{date}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className={buttonClass("primary")} href="/my-tasks">
                My tasks
              </Link>
              <Link className={buttonClass("secondary")} href="/calendar">
                Calendar
              </Link>
              <Link className={buttonClass("secondary")} href="/projects">
                Projects
              </Link>
            </div>
          </div>
          <Illustration name="dashboard" className="h-28 w-44 shrink-0" />
        </div>
      </section>
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/my-tasks">
          <Card accent="yellow">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">My open tasks</p>
            <p className="mt-2 text-3xl font-bold">{data.myTaskCount}</p>
          </Card>
        </Link>
        <Link href="/my-tasks">
          <Card accent="orange">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">Due today</p>
            <p className="mt-2 text-3xl font-bold">{dueToday}</p>
          </Card>
        </Link>
        <Link href="/my-tasks">
          <Card accent="red">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">Overdue</p>
            <p className="mt-2 text-3xl font-bold text-error">{data.overdue.length}</p>
          </Card>
        </Link>
        <Link href="/projects">
          <Card accent="blue">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">Active projects</p>
            <p className="mt-2 text-3xl font-bold">{data.activeProjects.length}</p>
          </Card>
        </Link>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card accent="yellow">
          <h2 className="mb-3 text-lg font-bold">Today&apos;s work</h2>
          {data.inProgress.length === 0 ? (
            <EmptyState plain title="You're all caught up" body="No assigned tasks are in progress right now." illustration="caught-up" />
          ) : (
            <RecordList>
            <ul className="kagum-list text-sm">
              {data.inProgress.slice(0, 6).map((task) => (
                <li key={task.id} data-record="" className="flex items-center justify-between gap-3">
                  <Link className="font-medium text-text" href={`/tasks/${task.id}`}>
                    {task.title}
                  </Link>
                  <Badge tone={statusTone(task.status)}>{task.status}</Badge>
                </li>
              ))}
            </ul>
            </RecordList>
          )}
          {data.pendingAck.length > 0 ? (
            <p className="mt-3 text-sm text-secondary">{data.pendingAck.length} waiting for acknowledgement.</p>
          ) : null}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold">Upcoming deadlines</h2>
          {data.upcoming.length === 0 ? (
            <EmptyState plain title="No upcoming deadlines" body="Assigned tasks with official deadlines will appear here." />
          ) : (
            <RecordList>
            <ul className="kagum-list text-sm">
              {data.upcoming.map((t) => (
                <li key={t.id} data-record="" data-sort={t.officialDeadline ? new Date(t.officialDeadline).toISOString() : ""} className="flex items-center justify-between gap-3">
                  <Link className="font-medium text-info" href={`/tasks/${t.id}`}>
                    {t.title}
                  </Link>
                  <span className="text-secondary">{formatDate(t.officialDeadline)}</span>
                </li>
              ))}
            </ul>
            </RecordList>
          )}
        </Card>
        <Card accent="purple">
          <h2 className="mb-3 text-lg font-bold">Content pipeline</h2>
          {data.contentPipeline.length === 0 ? (
            <EmptyState plain title="No content records" body="Create content to track planning through publishing." />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {Object.entries(stages).map(([stage, count]) => (
                  <Badge key={stage} tone={statusTone(stage)}>
                    {stage} {count}
                  </Badge>
                ))}
              </div>
              <RecordList>
              <ul className="kagum-list text-sm">
                {data.contentPipeline.slice(0, 6).map((c) => (
                  <li key={c.id} data-record="" className="flex items-center justify-between gap-3">
                    <Link href={`/content/${c.id}`}>{c.title}</Link>
                    <Badge tone={statusTone(c.stage)}>{c.stage}</Badge>
                  </li>
                ))}
              </ul>
              </RecordList>
            </>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Notifications</h2>
            <Link className="text-sm font-semibold text-primary" href="/notifications">
              View all
            </Link>
          </div>
          {data.notifications.length === 0 ? (
            <EmptyState plain title="All quiet here" body="You don't have any new notifications." illustration="quiet" />
          ) : (
            <RecordList>
            <ul className="kagum-list text-sm">
              {data.notifications.map((n) => (
                <li key={n.id} data-record="" data-sort={n.createdAt ? new Date(n.createdAt).toISOString() : ""}>
                  <Link className="font-medium text-info" href={n.href || "/notifications"}>
                    {n.title}
                  </Link>
                  <p className="text-secondary">{n.body}</p>
                </li>
              ))}
            </ul>
            </RecordList>
          )}
        </Card>
        <Card accent="charcoal" className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Recent activity</h2>
            <Link className="text-sm font-semibold text-primary" href="/activity">
              History
            </Link>
          </div>
          {data.activity.length === 0 ? (
            <EmptyState plain title="No activity yet" body="Operational events will be recorded here." illustration="none" />
          ) : (
            <RecordList>
            <ul className="kagum-list text-sm text-secondary">
              {data.activity.map((a) => (
                <li key={a.id} data-record="" data-sort={a.createdAt ? new Date(a.createdAt).toISOString() : ""}>
                  {a.summary}
                </li>
              ))}
            </ul>
            </RecordList>
          )}
        </Card>
      </div>
    </div>
  );
}
