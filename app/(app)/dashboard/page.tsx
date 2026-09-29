import { getAuthContext } from "@/lib/auth/context";
import { dashboardData } from "@/lib/queries";
import { Badge, BrandWordmark, Card, EmptyState, buttonClass, statusTone, type BadgeTone } from "@/components/ui";
import { Illustration } from "@/components/illustrations";
import { formatDate, formatDateTime, readableLabel } from "@/lib/utils";
import { CONTENT_STAGES } from "@/lib/permissions";
import { NoticeCarousel } from "@/components/notice-carousel";
import { AlertTriangle, Bell, CalendarDays, Clapperboard, FolderKanban, ListChecks, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const BAR: Record<BadgeTone, string> = {
  success: "bg-green",
  warning: "bg-yellow",
  error: "bg-primary",
  info: "bg-blue",
  neutral: "bg-charcoal",
  yellow: "bg-yellow",
  blue: "bg-blue",
  purple: "bg-purple",
  orange: "bg-orange",
  pink: "bg-pink",
};

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

function deadlineParts(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    month: new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", month: "short" }).format(date),
    day: new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric" }).format(date),
  };
}

function workSentence(inProgress: number, waiting: number, overdue: number) {
  const parts = [
    inProgress ? `${inProgress} in progress` : "",
    waiting ? `${waiting} waiting for acknowledgement` : "",
    overdue ? `${overdue} overdue` : "",
  ].filter(Boolean);
  if (parts.length === 0) return "No assigned work is in progress, waiting for acknowledgement, or overdue.";
  if (parts.length === 1) return `You have ${parts[0]}.`;
  return `You have ${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}.`;
}

function SectionTitle({ kicker, title, href, action }: { kicker: string; title: string; href?: string; action?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{kicker}</p>
        <h2 className="text-lg font-bold text-text">{title}</h2>
      </div>
      {href && action ? (
        <Link className="text-sm font-semibold text-primary" href={href}>
          {action}
        </Link>
      ) : null}
    </div>
  );
}

function StatTile({
  href,
  label,
  value,
  note,
  icon: Icon,
  wash,
  ink,
  valueClass,
}: {
  href: string;
  label: string;
  value: number;
  note: string;
  icon: LucideIcon;
  wash: string;
  ink: string;
  valueClass?: string;
}) {
  return (
    <Link href={href} className="block h-full rounded-[18px]">
      <Card className="flex h-full flex-col">
        <span className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${wash} ${ink}`}>
          <Icon size={18} aria-hidden />
        </span>
        <p className={`mt-3 text-3xl font-bold leading-none sm:mt-4 ${valueClass ?? "text-text"}`}>{value}</p>
        <p className="mt-2 text-sm font-semibold text-text">{label}</p>
        <p className="mt-1 hidden text-xs leading-relaxed text-secondary sm:block">{note}</p>
      </Card>
    </Link>
  );
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
  const stageCounts = data.contentPipeline.reduce<Record<string, number>>((counts, item) => {
    counts[item.stage] = (counts[item.stage] ?? 0) + 1;
    return counts;
  }, {});
  const known = new Set<string>(CONTENT_STAGES);
  const pipeline = [
    ...CONTENT_STAGES.filter((stage) => stageCounts[stage]),
    ...Object.keys(stageCounts).filter((stage) => !known.has(stage)),
  ].map((stage) => ({ stage, count: stageCounts[stage] ?? 0 }));
  const pipelineTotal = pipeline.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <section className="kagum-hero rounded-[22px] border border-border px-5 py-5 shadow-[var(--shadow-card)] sm:px-6 sm:py-6">
        <div className="relative z-10 grid items-center gap-5 sm:grid-cols-[1fr_auto]">
          <div className="order-2 hidden justify-center rounded-[18px] bg-yellow-soft px-2 py-1 sm:flex">
            <Illustration name="dashboard" className="h-32 w-48" />
          </div>
          <div className="order-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
              <BrandWordmark />
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-snug sm:text-[32px]">
              {greeting()}, {name}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary">
              {workSentence(data.inProgress.length, data.pendingAck.length, data.overdue.length)}
            </p>
            <p className="mt-3 text-sm font-semibold text-text">{date}</p>
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
        </div>
      </section>

      <section>
        <SectionTitle kicker="Snapshot" title="Where your work stands" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile
            href="/my-tasks"
            label="My open tasks"
            value={data.myTaskCount}
            note="Assigned to you and not completed."
            icon={ListChecks}
            wash="bg-yellow-soft"
            ink="text-warning"
          />
          <StatTile
            href="/my-tasks"
            label="Due today"
            value={dueToday}
            note="Official deadline falls on today."
            icon={CalendarDays}
            wash="bg-orange-soft"
            ink="text-orange"
          />
          <StatTile
            href="/my-tasks"
            label="Overdue"
            value={data.overdue.length}
            note="Past the official deadline."
            icon={AlertTriangle}
            wash="bg-primary-light"
            ink="text-primary"
            valueClass={data.overdue.length > 0 ? "text-error" : "text-text"}
          />
          <StatTile
            href="/projects"
            label="Active projects"
            value={data.activeProjects.length}
            note="Projects in planning or active."
            icon={FolderKanban}
            wash="bg-blue-soft"
            ink="text-info"
          />
        </div>
      </section>

      <NoticeCarousel
        notices={data.notices.map((notice) => ({
          id: notice.id,
          title: notice.title,
          body: notice.body,
          kind: notice.kind,
          requiresParticipation: Boolean(notice.requiresParticipation),
        }))}
      />

      <section className="grid items-start gap-4 lg:grid-cols-5">
        <Card accent="yellow" className="lg:col-span-3">
          <SectionTitle kicker="Assigned to you" title="Today's work" href="/my-tasks" action="My tasks" />
          {data.inProgress.length === 0 ? (
            <EmptyState plain title="You're all caught up" body="No assigned tasks are in progress right now." illustration="caught-up" />
          ) : (
              <ul className="kagum-list text-sm">
                {data.inProgress.slice(0, 6).map((task) => (
                  <li key={task.id} data-record="" className="flex items-center justify-between gap-3">
                    <Link className="min-w-0 font-semibold text-text" href={`/tasks/${task.id}`}>
                      {task.title}
                    </Link>
                    <Badge tone={statusTone(task.status)}>{task.status}</Badge>
                  </li>
                ))}
              </ul>
          )}
          {data.pendingAck.length > 0 ? (
            <Link href="/my-tasks" className="mt-3 flex items-center justify-between gap-3 rounded-[12px] bg-yellow-soft px-3 py-2.5 text-sm">
              <span className="font-semibold text-text">{data.pendingAck.length} waiting for acknowledgement</span>
              <span className="font-semibold text-warning">Open</span>
            </Link>
          ) : null}
        </Card>

        <Card accent="orange" className="lg:col-span-2">
          <SectionTitle kicker="Official deadlines" title="Coming up" href="/calendar" action="Calendar" />
          {data.upcoming.length === 0 ? (
            <EmptyState plain title="No upcoming deadlines" body="Assigned tasks with official deadlines will appear here." />
          ) : (
              <ul className="kagum-list text-sm">
                {data.upcoming.map((task) => {
                  const parts = deadlineParts(task.officialDeadline);
                  const today = isSameLocalDay(task.officialDeadline);
                  return (
                    <li key={task.id} data-record="" data-sort={task.officialDeadline ? new Date(task.officialDeadline).toISOString() : ""} className="flex items-center gap-3">
                      <span className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[12px] ${today ? "bg-primary text-white" : "bg-orange-soft text-orange"}`}>
                        <span className="text-[10px] font-semibold uppercase leading-none">{parts?.month ?? "—"}</span>
                        <span className="text-base font-bold leading-tight">{parts?.day ?? "—"}</span>
                      </span>
                      <span className="min-w-0">
                        <Link className="block font-semibold text-text" href={`/tasks/${task.id}`}>
                          {task.title}
                        </Link>
                        <span className="text-xs text-secondary">{today ? "Due today" : formatDate(task.officialDeadline)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
          )}
        </Card>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-5">
        <Card accent="purple" className="lg:col-span-3">
          <SectionTitle kicker="Production" title="Content pipeline" href="/content" action="Content" />
          {data.contentPipeline.length === 0 ? (
            <EmptyState plain title="No content records" body="Create content to track planning through publishing." illustration="content" />
          ) : (
            <>
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-purple-soft text-purple">
                  <Clapperboard size={18} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  {pipeline.map((item) => (
                    <div key={item.stage}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-text">{readableLabel(item.stage)}</span>
                        <span className="text-secondary">{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-canvas">
                        <div
                          className={`h-full rounded-full ${BAR[statusTone(item.stage)]}`}
                          style={{ width: `${Math.max(8, Math.round((item.count / pipelineTotal) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                <ul className="kagum-list text-sm">
                  {data.contentPipeline.slice(0, 6).map((item) => (
                    <li key={item.id} data-record="" className="flex items-center justify-between gap-3">
                      <Link className="min-w-0 font-semibold text-text" href={`/content/${item.id}`}>
                        {item.title}
                      </Link>
                      <Badge tone={statusTone(item.stage)}>{item.stage}</Badge>
                    </li>
                  ))}
                </ul>
            </>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle kicker="For you" title="Notifications" href="/notifications" action="View all" />
          {data.notifications.length === 0 ? (
            <EmptyState plain title="All quiet here" body="You don't have any new notifications." illustration="quiet" />
          ) : (
              <ul className="kagum-list text-sm">
                {data.notifications.map((notice) => (
                  <li key={notice.id} data-record="" data-sort={notice.createdAt ? new Date(notice.createdAt).toISOString() : ""} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-soft text-info">
                      <Bell size={14} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <Link className="font-semibold text-text" href={notice.href || "/notifications"}>
                        {notice.title}
                      </Link>
                      <p className="text-secondary">{notice.body}</p>
                    </span>
                  </li>
                ))}
              </ul>
          )}
        </Card>
      </section>

      <Card accent="charcoal">
        <SectionTitle kicker="Record" title="Recent activity" href="/activity" action="History" />
        {data.activity.length === 0 ? (
          <EmptyState plain title="No activity yet" body="Operational events will be recorded here." illustration="none" />
        ) : (
            <ul className="kagum-list text-sm">
              {data.activity.map((entry) => (
                <li key={entry.id} data-record="" data-sort={entry.createdAt ? new Date(entry.createdAt).toISOString() : ""} className="flex items-start justify-between gap-3">
                  <span className="font-medium text-text">{entry.summary}</span>
                  <span className="shrink-0 text-xs text-secondary">{formatDateTime(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
        )}
      </Card>
    </div>
  );
}
