import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Illustration, type IllustrationName } from "@/components/illustrations";
import { Badge, buttonClass, statusTone } from "@/components/ui";
import { TASK_STATUSES, isTaskOverdue } from "@/lib/permissions";
import { cn, formatDate, readableLabel } from "@/lib/utils";

const DISPLAY_TZ = "Asia/Kuala_Lumpur";

export const STATUS_FACE: Record<string, { wash: string; ink: string; bar: string; ring: string }> = {
  draft: { wash: "bg-charcoal-soft", ink: "text-charcoal", bar: "bg-charcoal", ring: "ring-charcoal/30" },
  pending_acknowledgement: { wash: "bg-yellow-soft", ink: "text-warning", bar: "bg-yellow", ring: "ring-yellow/50" },
  acknowledged: { wash: "bg-blue-soft", ink: "text-info", bar: "bg-blue", ring: "ring-blue/40" },
  in_progress: { wash: "bg-purple-soft", ink: "text-purple", bar: "bg-purple", ring: "ring-purple/40" },
  submitted: { wash: "bg-orange-soft", ink: "text-orange", bar: "bg-orange", ring: "ring-orange/40" },
  completed: { wash: "bg-green-soft", ink: "text-success", bar: "bg-green", ring: "ring-green/40" },
};

export function statusFace(status: string) {
  return STATUS_FACE[status] ?? { wash: "bg-canvas", ink: "text-charcoal", bar: "bg-charcoal", ring: "ring-border" };
}

export function priorityBar(priority: string) {
  if (priority === "urgent" || priority === "high") return "bg-primary";
  if (priority === "low") return "bg-charcoal";
  return "bg-yellow";
}

export function displayDay(value: Date | string | number | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-MY", {
    timeZone: DISPLAY_TZ,
    month: "short",
    day: "numeric",
  }).formatToParts(date);
  return {
    month: parts.find((part) => part.type === "month")?.value ?? "",
    day: parts.find((part) => part.type === "day")?.value ?? "",
  };
}

export function isSameDisplayDay(value: Date | string | null | undefined, now = new Date()) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: DISPLAY_TZ });
  return fmt.format(date) === fmt.format(now);
}

export function WorkHero({
  illustration,
  kicker,
  title,
  description,
  artWash = "bg-yellow-soft",
  actions,
}: {
  illustration: IllustrationName;
  kicker: string;
  title: string;
  description: string;
  artWash?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="kagum-hero rounded-[22px] border border-border px-5 py-5 shadow-[var(--shadow-card)] sm:px-6 sm:py-6">
      <div className="relative z-10 grid items-center gap-5 lg:grid-cols-[1fr_auto]">
        <div className="order-2 hidden justify-center rounded-[18px] px-2 py-1 sm:flex lg:order-2" >
          <span className={cn("flex rounded-[18px] px-3 py-2", artWash)}>
            <Illustration name={illustration} className="h-28 w-44 sm:h-32 sm:w-48" />
          </span>
        </div>
        <div className="order-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{kicker}</p>
          <h1 className="mt-1 text-2xl font-bold leading-snug text-text sm:text-[32px]">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary">{description}</p>
          {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function Metric({
  label,
  value,
  note,
  icon: Icon,
  wash,
  ink,
  href,
  valueClass,
}: {
  label: string;
  value: number;
  note: string;
  icon: LucideIcon;
  wash: string;
  ink: string;
  href?: string;
  valueClass?: string;
}) {
  const body = (
    <>
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-[12px]", wash, ink)}>
        <Icon size={18} aria-hidden />
      </span>
      <p className={cn("mt-3 text-3xl font-bold leading-none", valueClass ?? "text-text")}>{value}</p>
      <p className="mt-2 text-sm font-semibold text-text">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-secondary">{note}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="block h-full rounded-[18px]">
        <div className="flex h-full flex-col rounded-[18px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">{body}</div>
      </Link>
    );
  }
  return <div className="flex h-full flex-col rounded-[18px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">{body}</div>;
}

export function ViewPills({
  items,
}: {
  items: { key: string; href: string; label: string; active: boolean; count: number }[];
}) {
  return (
    <div className="flex w-full gap-1 overflow-x-auto rounded-[16px] bg-canvas p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-[12px] px-3 py-1.5 text-sm font-semibold transition-colors",
            item.active ? "bg-primary text-white shadow-[0_1px_0_rgb(17_17_17/12%)]" : "text-secondary hover:bg-surface hover:text-text",
          )}
        >
          {item.label}
          <span
            className={cn(
              "rounded-full px-1.5 text-[11px] leading-5",
              item.active ? "bg-white/20 text-white" : "bg-surface text-charcoal",
            )}
          >
            {item.count}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function StatusRail({
  counts,
  hrefFor,
}: {
  counts: Record<string, number>;
  hrefFor?: (status: string) => string;
}) {
  const total = TASK_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
  return (
    <div className="rounded-[18px] border border-border bg-surface p-3 shadow-[var(--shadow-card)] sm:p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Official status</p>
          <p className="text-sm font-semibold text-text">How the work is moving</p>
        </div>
        <p className="text-xs text-secondary">{total} on this board</p>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TASK_STATUSES.map((status) => {
          const face = statusFace(status);
          const count = counts[status] ?? 0;
          const width = total === 0 ? 0 : Math.max(count === 0 ? 0 : 8, Math.round((count / total) * 100));
          const inner = (
            <>
              <span className="flex items-center justify-between gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", face.bar)} />
                <span className="text-sm font-bold tabular-nums text-text">{count}</span>
              </span>
              <span className="mt-1 block text-[11px] font-semibold leading-snug text-secondary">{readableLabel(status)}</span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-canvas">
                <span className={cn("block h-full rounded-full", face.bar)} style={{ width: `${width}%` }} />
              </span>
            </>
          );
          const className = "min-w-[8.5rem] flex-1 rounded-[14px] bg-canvas px-3 py-2.5";
          return hrefFor ? (
            <Link key={status} href={hrefFor(status)} className={cn(className, "hover:bg-charcoal-soft")}>
              {inner}
            </Link>
          ) : (
            <div key={status} className={className}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatusStepper({ status }: { status: string }) {
  const current = TASK_STATUSES.indexOf(status as (typeof TASK_STATUSES)[number]);
  return (
    <ol className="flex gap-2 overflow-x-auto pb-1">
      {TASK_STATUSES.map((step, index) => {
        const face = statusFace(step);
        const state = current < 0 ? "upcoming" : index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={step}
            className={cn(
              "min-w-[7.5rem] flex-1 rounded-[14px] border px-3 py-2",
              state === "current" ? cn("border-transparent", face.wash) : "border-border bg-surface",
              state === "upcoming" && "opacity-70",
            )}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className={cn("mb-1 block h-1.5 w-8 rounded-full", state === "upcoming" ? "bg-border" : face.bar)} />
            <span className="block text-[11px] font-semibold leading-snug text-text">{readableLabel(step)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function DeadlineStamp({
  value,
  overdue = false,
  size = "md",
}: {
  value: Date | string | null | undefined;
  overdue?: boolean;
  size?: "sm" | "md";
}) {
  const parts = displayDay(value);
  const box = size === "sm" ? "h-11 w-11 rounded-[12px]" : "h-14 w-14 rounded-[14px]";
  if (!parts) {
    return (
      <span className={cn("flex shrink-0 flex-col items-center justify-center border border-dashed border-border bg-canvas text-[10px] font-semibold uppercase tracking-wide text-muted", box)}>
        No date
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 flex-col overflow-hidden border text-center",
        box,
        overdue ? "border-error/30 bg-error-soft" : "border-border bg-surface",
      )}
    >
      <span className={cn("px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide", overdue ? "bg-error text-white" : "bg-charcoal text-white")}>
        {parts.month}
      </span>
      <span className={cn("flex flex-1 items-center justify-center font-bold leading-none", size === "sm" ? "text-sm" : "text-lg", overdue ? "text-error" : "text-text")}>
        {parts.day}
      </span>
    </span>
  );
}

type TaskCardInput = {
  id: string;
  title: string;
  status: string;
  priority: string;
  officialDeadline: Date | string | null;
  description?: string | null;
  category?: string | null;
};

export function taskCard({
  task,
  assignee,
  project,
  hint,
}: {
  task: TaskCardInput;
  assignee?: string | null;
  project?: string | null;
  hint?: string;
}) {
  const overdue = isTaskOverdue(task);
  const meta = [assignee, project, task.category ? readableLabel(task.category) : null].filter(Boolean);
  const search = [task.title, task.status, task.priority, assignee, project, task.category, task.description, overdue ? "overdue" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <article
      key={task.id}
      data-record=""
      data-sort={task.officialDeadline ? new Date(task.officialDeadline).toISOString() : ""}
      data-label-text={search}
      className="group relative overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1.5", priorityBar(task.priority))} aria-hidden />
      <Link href={`/tasks/${task.id}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-4 py-3.5 pl-5">
        <DeadlineStamp value={task.officialDeadline} overdue={overdue} />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge tone={statusTone(task.status)}>{task.status}</Badge>
            <Badge tone={statusTone(task.priority)}>{task.priority}</Badge>
            {overdue ? <Badge tone="error">Overdue</Badge> : null}
          </span>
          <span className="mt-1.5 block truncate text-base font-bold text-text group-hover:text-primary">{task.title}</span>
          {task.description ? <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-secondary">{task.description}</span> : null}
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
            {meta.length ? <span>{meta.join(" · ")}</span> : <span>Unassigned</span>}
            <span className={cn("font-semibold", overdue ? "text-error" : "text-charcoal")}>
              {task.officialDeadline ? formatDate(task.officialDeadline) : "No official deadline"}
            </span>
            {hint ? <span>{hint}</span> : null}
          </span>
        </span>
      </Link>
    </article>
  );
}

export function linkButton(variant: "primary" | "secondary" = "secondary") {
  return buttonClass(variant);
}
