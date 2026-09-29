import { and, gte, lte } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { calendarEvents, contents, plannedWork, tasks } from "@/lib/db/schema";
import { Card, EmptyState, iconButtonClass } from "@/components/ui";
import { cn, formatDateTime, readableLabel } from "@/lib/utils";
import { keepUnlessDemoOwned, listContents, listProjects, listTasks, listTime } from "@/lib/queries";
import { PlannedWorkForm } from "@/components/planned-work-form";
import { WorkHero, linkButton } from "@/components/work-surface";
import { getAuthContext } from "@/lib/auth/context";
import { redirect } from "next/navigation";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function ymd(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00+08:00`);
  const end = new Date(`${dateStr}T23:59:59.999+08:00`);
  return { start, end };
}

function localParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "09";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

function shiftDate(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T00:00:00+08:00`);
  date.setDate(date.getDate() + days);
  return ymd(date);
}

function shiftMonth(dateStr: string, months: number) {
  const date = new Date(`${dateStr}T00:00:00+08:00`);
  date.setMonth(date.getMonth() + months);
  return ymd(date);
}

const MARKS = [
  { key: "deadlines", label: "Official Deadline", note: "The authoritative due date on the task.", dot: "bg-error", text: "text-error", soft: "bg-error-soft" },
  { key: "planned", label: "Planned Work", note: "When you intend to work. Moving this does not move the deadline.", dot: "bg-info", text: "text-info", soft: "bg-info-soft" },
  { key: "actual", label: "Actual Work", note: "Minutes and completion timestamps already recorded.", dot: "bg-success", text: "text-success", soft: "bg-success-soft" },
  { key: "events", label: "Event / Coverage", note: "A calendar event, not a deadline.", dot: "bg-orange", text: "text-orange", soft: "bg-orange-soft" },
  { key: "content", label: "Content", note: "Planned publish time on a content record.", dot: "bg-purple", text: "text-purple", soft: "bg-purple-soft" },
] as const;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const params = await searchParams;
  const view = params.view ?? "month";
  const selected = params.date ?? ymd(new Date());
  const selectedDate = new Date(`${selected}T00:00:00+08:00`);
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - gridStart.getDay());
  const gridEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
  gridEnd.setHours(23, 59, 59, 999);
  const { start, end } = dayBounds(selected);

  const [monthDeadlines, dayDeadlines, plannedMonth, plannedDay, eventsDay, monthEvents, pubsDay, logs, projects, allTasks, contentRows] =
    await Promise.all([
      db
        .select()
        .from(tasks)
        .where(and(gte(tasks.officialDeadline, gridStart), lte(tasks.officialDeadline, gridEnd)))
        .then((rows) => keepUnlessDemoOwned(rows, (row) => [row.creatorId, row.assigneeId])),
      db
        .select()
        .from(tasks)
        .where(and(gte(tasks.officialDeadline, start), lte(tasks.officialDeadline, end)))
        .then((rows) => keepUnlessDemoOwned(rows, (row) => [row.creatorId, row.assigneeId])),
      db
        .select()
        .from(plannedWork)
        .where(and(gte(plannedWork.startAt, gridStart), lte(plannedWork.startAt, gridEnd)))
        .then((rows) => keepUnlessDemoOwned(rows, (row) => [row.personId])),
      db
        .select()
        .from(plannedWork)
        .where(and(gte(plannedWork.startAt, start), lte(plannedWork.startAt, end)))
        .then((rows) => keepUnlessDemoOwned(rows, (row) => [row.personId])),
      db
        .select()
        .from(calendarEvents)
        .where(and(gte(calendarEvents.startAt, start), lte(calendarEvents.startAt, end)))
        .then((rows) => keepUnlessDemoOwned(rows, (row) => [row.ownerId])),
      db
        .select()
        .from(calendarEvents)
        .where(and(gte(calendarEvents.startAt, gridStart), lte(calendarEvents.startAt, gridEnd)))
        .then((rows) => keepUnlessDemoOwned(rows, (row) => [row.ownerId])),
      db
        .select()
        .from(contents)
        .where(and(gte(contents.plannedPublishAt, start), lte(contents.plannedPublishAt, end)))
        .then((rows) => keepUnlessDemoOwned(rows, (row) => [row.ownerId, row.creatorId])),
      listTime(),
      listProjects(),
      listTasks(),
      listContents(),
    ]);

  const logsDay = logs.filter((e) => e.workDate === selected);
  const daysInMonth = monthEnd.getDate();
  const firstWeekday = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const taskOptions = allTasks.map((t) => ({ id: t.id, label: t.title }));
  const projectOptions = projects.map((p) => ({ id: p.id, label: p.name }));
  const contentOptions = contentRows.map((c) => ({ id: c.id, label: c.title }));
  const href = (nextView: string, date: string) => `/calendar?view=${nextView}&date=${date}`;
  const previous = view === "month" ? shiftMonth(selected, -1) : shiftDate(selected, view === "week" ? -7 : -1);
  const next = view === "month" ? shiftMonth(selected, 1) : shiftDate(selected, view === "week" ? 7 : 1);
  const selectedLabel = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(selectedDate);
  const rangeLabel =
    view === "week"
      ? `${new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" }).format(weekDates[0])} – ${new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(weekDates[6])}`
      : new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(selectedDate);

  function marksFor(dateStr: string) {
    return {
      deadlines: monthDeadlines.filter((t) => t.officialDeadline && ymd(t.officialDeadline) === dateStr).length,
      planned: plannedMonth.filter((p) => p.startAt && ymd(p.startAt) === dateStr).length,
      actual: logs.filter((e) => e.workDate === dateStr).length,
      events: monthEvents.filter((e) => e.startAt && ymd(e.startAt) === dateStr).length,
      content: contentRows.filter((c) => c.plannedPublishAt && ymd(c.plannedPublishAt) === dateStr).length,
    };
  }

  function linesFor(dateStr: string) {
    const items: MonthLine[] = [
      ...monthDeadlines
        .filter((task) => task.officialDeadline && ymd(task.officialDeadline) === dateStr)
        .map((task) => monthLine(task.id, briefTitle(task.title), "deadlines")),
      ...monthEvents
        .filter((event) => event.startAt && ymd(event.startAt) === dateStr)
        .map((event) => monthLine(event.id, briefTitle(event.title), "events")),
      ...plannedMonth
        .filter((item) => item.startAt && ymd(item.startAt) === dateStr)
        .map((item) => monthLine(item.id, briefTitle(item.title || readableLabel(item.workType)), "planned")),
      ...contentRows
        .filter((item) => item.plannedPublishAt && ymd(item.plannedPublishAt) === dateStr)
        .map((item) => monthLine(item.id, briefTitle(item.title), "content")),
      ...logs
        .filter((entry) => entry.workDate === dateStr)
        .map((entry) => monthLine(entry.id, "Time log", "actual")),
    ];
    return { shown: items.slice(0, 4), extra: Math.max(0, items.length - 4) };
  }

  const summary = [
    { key: "deadlines", count: dayDeadlines.length },
    { key: "planned", count: plannedDay.length },
    { key: "actual", count: logsDay.length },
    { key: "events", count: eventsDay.length },
    { key: "content", count: pubsDay.length },
  ] as const;
  const todayStr = ymd(new Date());
  const monthCells: { dateStr: string; day: number; inMonth: boolean }[] = [];
  const cursor = new Date(gridStart);
  while (cursor.getTime() <= gridEnd.getTime()) {
    monthCells.push({
      dateStr: ymd(cursor),
      day: cursor.getDate(),
      inMonth: cursor.getMonth() === selectedDate.getMonth(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  const dayTotal = summary.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="calendar"
        kicker="Calendar"
        title={view === "day" ? selectedLabel : rangeLabel}
        artWash="bg-orange-soft"
        description={
          dayTotal === 0
            ? "Official deadlines, planned working time, and actual work stay separate. This date has no records yet."
            : `${dayTotal} record${dayTotal === 1 ? "" : "s"} on ${selectedLabel}. Deadlines, planned time, and actual work stay separate.`
        }
        actions={
          <>
            <Link className={linkButton("primary")} href="/my-tasks">
              My tasks
            </Link>
            <Link className={linkButton()} href="/tasks">
              All tasks
            </Link>
            <Link className={linkButton()} href="/kanban">
              Kanban
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-[18px] border border-border bg-surface p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-2">
          <Link href={href(view, previous)} aria-label="Previous" className={iconButtonClass("h-9 w-9 rounded-full border border-border bg-surface hover:border-[#f0b4b6] hover:bg-primary-light")}>
            <ChevronLeft size={16} />
          </Link>
          <p className="min-w-36 text-center text-sm font-semibold">{view === "day" ? selectedLabel : rangeLabel}</p>
          <Link href={href(view, next)} aria-label="Next" className={iconButtonClass("h-9 w-9 rounded-full border border-border bg-surface hover:border-[#f0b4b6] hover:bg-primary-light")}>
            <ChevronRight size={16} />
          </Link>
          <Link href={href(view, ymd(new Date()))} className={linkButton()}>
            Today
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full bg-canvas p-1">
            {(["day", "week", "month"] as const).map((key) => (
              <Link
                key={key}
                href={href(key, selected)}
                aria-current={view === key ? "page" : undefined}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold capitalize transition-colors active:scale-[0.98] motion-reduce:active:scale-100",
                  view === key ? "bg-primary text-white shadow-[0_1px_0_rgb(17_17_17/12%)]" : "text-secondary hover:bg-surface hover:text-text",
                )}
              >
                {key}
              </Link>
            ))}
          </div>
          <PlannedWorkForm defaultDate={selected} label="+ Add Planned Work" tasks={taskOptions} projects={projectOptions} contents={contentOptions} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {MARKS.map((mark) => (
          <span key={mark.key} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", mark.soft, mark.text)}>
            <span className={cn("h-2 w-2 rounded-full", mark.dot)} />
            {mark.label}
          </span>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="order-2 space-y-4 lg:sticky lg:top-20 lg:order-1">
          <Card className="p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm font-semibold">{new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(selectedDate)}</p>
              <div className="flex gap-1">
                <Link href={href(view, shiftMonth(selected, -1))} aria-label="Previous month" className="rounded-full p-1 text-secondary hover:bg-canvas">
                  <ChevronLeft size={14} />
                </Link>
                <Link href={href(view, shiftMonth(selected, 1))} aria-label="Next month" className="rounded-full p-1 text-secondary hover:bg-canvas">
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={`${day}${index}`}>{day}</div>
              ))}
              {Array.from({ length: firstWeekday }).map((_, index) => (
                <div key={`pad-${index}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(day)}`;
                const marks = marksFor(dateStr);
                const active = dateStr === selected;
                return (
                  <Link
                    key={dateStr}
                    href={href("day", dateStr)}
                    className={cn(
                      "flex min-h-9 flex-col items-center rounded-[10px] py-1 text-xs",
                      active ? "bg-primary font-semibold text-white" : dateStr === todayStr ? "bg-orange-soft font-semibold text-orange hover:bg-orange-soft" : "hover:bg-canvas",
                    )}
                  >
                    {day}
                    <span className="mt-0.5 flex h-1.5 gap-0.5">
                      {MARKS.map((mark) =>
                        marks[mark.key] > 0 ? <span key={mark.key} className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-white" : mark.dot)} /> : null,
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card accent="orange">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Selected date</p>
            <p className="mt-1 text-base font-bold">{selectedLabel}</p>
            <ul className="kagum-list mt-3">
              {summary.map((item) => {
                const mark = MARKS.find((entry) => entry.key === item.key)!;
                return (
                  <li key={item.key}>
                    <a href={`#${item.key}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", mark.dot)} />
                        {mark.label}
                      </span>
                      <span className="font-semibold">{item.count}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <h2 className="text-sm font-bold">How to read the colors</h2>
            <ul className="mt-3 space-y-3">
              {MARKS.map((mark) => (
                <li key={mark.key} className="flex gap-2 text-sm leading-relaxed">
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", mark.dot)} />
                  <span>
                    <span className={cn("font-semibold", mark.text)}>{mark.label}</span>
                    <span className="mt-0.5 block text-xs text-secondary">{mark.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <div className="order-1 min-w-0 space-y-4 lg:order-2">
          {view === "month" ? (
            <Card className="min-w-0 overflow-hidden p-2 sm:p-4">
              <div className="grid min-w-0 grid-cols-7 gap-1 sm:gap-1.5">
                {[["S", "Sun"], ["M", "Mon"], ["T", "Tue"], ["W", "Wed"], ["T", "Thu"], ["F", "Fri"], ["S", "Sat"]].map(([short, day]) => (
                  <div key={day} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </div>
                ))}
                {monthCells.map((cell) => (
                  <DayCell
                    key={cell.dateStr}
                    dateStr={cell.dateStr}
                    day={cell.day}
                    selected={cell.dateStr === selected}
                    today={cell.dateStr === todayStr}
                    muted={!cell.inMonth}
                    lines={linesFor(cell.dateStr)}
                  />
                ))}
              </div>
            </Card>
          ) : null}

          {view === "week" ? (
            <Card className="min-w-0 overflow-hidden p-2 sm:p-4">
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
                {weekDates.map((date) => {
                  const dateStr = ymd(date);
                  return (
                    <DayCell
                      key={dateStr}
                      dateStr={dateStr}
                      day={date.getDate()}
                      weekday={new Intl.DateTimeFormat("en-MY", { weekday: "short", timeZone: "Asia/Kuala_Lumpur" }).format(date)}
                      selected={dateStr === selected}
                      today={dateStr === todayStr}
                      lines={linesFor(dateStr)}
                      tall
                    />
                  );
                })}
              </div>
            </Card>
          ) : null}

          {view === "day" ? (
            <DayTimeline
              showNow={selected === todayStr}
              deadlines={dayDeadlines}
              planned={plannedDay}
              events={eventsDay}
              content={pubsDay}
            />
          ) : null}

          <Card>
            <h2 className="text-lg font-bold">Records on {selectedLabel}</h2>
            <p className="mb-4 text-xs text-secondary">
              {view === "day"
                ? "Timed records are blocked on the clock above. This list keeps the full record, including actual minutes that have no start time."
                : "This is the date detail, not an empty hourly grid."}
            </p>
            {!dayDeadlines.length && !plannedDay.length && !eventsDay.length && !pubsDay.length && !logsDay.length ? (
              <EmptyState plain illustration="calendar" title="Nothing on this date" body="Official deadlines, planned work, events, content, and time logs for this day will show here." />
            ) : (
              <div className="space-y-4">
                {dayDeadlines.length ? (
                <RecordGroup id="deadlines" title="Deadlines" tone="text-error" bar="bg-error">
                  {dayDeadlines.map((t) => (
                    <Link key={t.id} href={`/tasks/${t.id}`} className="block rounded-[12px] bg-error-soft px-4 py-2 text-sm">
                      <span className="font-semibold text-error">{t.title}</span>
                      <span className="mt-0.5 block text-xs text-secondary">{formatDateTime(t.officialDeadline)}</span>
                    </Link>
                  ))}
                </RecordGroup>
                ) : null}
                {plannedDay.length ? (
                <RecordGroup id="planned" title="Planned Work" tone="text-info" bar="bg-info">
                  {plannedDay.map((p) => (
                    <div key={p.id} className="rounded-[12px] border border-info/30 bg-info-soft px-4 py-2.5 text-sm">
                      <Link className="font-semibold text-info" href={p.taskId ? `/tasks/${p.taskId}` : p.contentId ? `/content/${p.contentId}` : p.projectId ? `/projects/${p.projectId}` : "/calendar"}>
                        {p.title || readableLabel(p.workType)}
                      </Link>
                      <p className="text-xs text-secondary">{formatDateTime(p.startAt)} – {formatDateTime(p.endAt)}</p>
                      {p.personId === ctx.person.id ? (
                        <div className="mt-2">
                          <PlannedWorkForm
                            defaultDate={selected}
                            existing={{
                              id: p.id,
                              title: p.title || "Planned work",
                              workType: p.workType,
                              date: selected,
                              startTime: p.startAt ? localParts(p.startAt) : "09:00",
                              endTime: p.endAt ? localParts(p.endAt) : "10:00",
                              notes: p.notes || "",
                            }}
                            tasks={taskOptions}
                            projects={projectOptions}
                            contents={contentOptions}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </RecordGroup>
                ) : null}
                {eventsDay.length ? (
                <RecordGroup id="events" title="Events / Coverage" tone="text-orange" bar="bg-orange">
                  {eventsDay.map((e) => (
                    <div key={e.id} className="rounded-[12px] bg-orange-soft px-4 py-2 text-sm">
                      <span className="font-semibold text-orange">{e.title}</span>
                      <span className="mt-0.5 block text-xs text-secondary">{formatDateTime(e.startAt)}</span>
                    </div>
                  ))}
                </RecordGroup>
                ) : null}
                {pubsDay.length ? (
                <RecordGroup id="content" title="Content" tone="text-purple" bar="bg-purple">
                  {pubsDay.map((c) => (
                    <Link key={c.id} href={`/content/${c.id}`} className="block rounded-[12px] bg-purple-soft px-4 py-2 text-sm font-semibold text-purple">
                      {c.title}
                    </Link>
                  ))}
                </RecordGroup>
                ) : null}
                {logsDay.length ? (
                <RecordGroup id="actual" title="Actual Work" tone="text-success" bar="bg-success">
                  {logsDay.map((e) => (
                    <div key={e.id} className="rounded-[12px] bg-success-soft px-4 py-2 text-sm text-success">
                      <span className="font-semibold">{e.actualMinutes} actual minutes</span>
                      {e.taskId ? (
                        <Link className="mt-0.5 block text-xs font-semibold text-info" href={`/tasks/${e.taskId}`}>
                          Open task
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </RecordGroup>
                ) : null}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function klMinutes(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return (hour === 24 ? 0 : hour) * 60 + minute;
}

function clockLabel(minutes: number) {
  return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
}

type TimeBlock = {
  id: string;
  title: string;
  href?: string;
  start: number;
  end: number;
  soft: string;
  text: string;
  lane: number;
};

function DayTimeline({
  deadlines,
  planned,
  events,
  content,
  showNow,
}: {
  deadlines: { id: string; title: string; officialDeadline: Date | string | null }[];
  planned: { id: string; title: string | null; workType: string; startAt: Date | string; endAt: Date | string; taskId: string | null; contentId: string | null; projectId: string | null }[];
  events: { id: string; title: string; startAt: Date | string; endAt: Date | string | null }[];
  content: { id: string; title: string; plannedPublishAt: Date | string | null }[];
  showNow: boolean;
}) {
  const blocks: Omit<TimeBlock, "lane">[] = [];
  for (const item of planned) {
    const start = klMinutes(item.startAt);
    const end = klMinutes(item.endAt);
    if (start === null || end === null || end <= start) continue;
    const href = item.taskId ? `/tasks/${item.taskId}` : item.contentId ? `/content/${item.contentId}` : item.projectId ? `/projects/${item.projectId}` : undefined;
    blocks.push({ id: item.id, title: briefTitle(item.title || readableLabel(item.workType)), href, start, end, soft: "bg-info-soft", text: "text-info" });
  }
  for (const item of events) {
    const start = klMinutes(item.startAt);
    const end = klMinutes(item.endAt) ?? (start === null ? null : start + 60);
    if (start === null || end === null || end <= start) continue;
    blocks.push({ id: item.id, title: briefTitle(item.title), start, end, soft: "bg-orange-soft", text: "text-orange" });
  }
  for (const item of deadlines) {
    const start = klMinutes(item.officialDeadline);
    if (start === null) continue;
    blocks.push({ id: item.id, title: briefTitle(item.title), href: `/tasks/${item.id}`, start, end: start + 30, soft: "bg-error-soft", text: "text-error" });
  }
  for (const item of content) {
    const start = klMinutes(item.plannedPublishAt);
    if (start === null) continue;
    blocks.push({ id: item.id, title: briefTitle(item.title), href: `/content/${item.id}`, start, end: start + 30, soft: "bg-purple-soft", text: "text-purple" });
  }

  if (blocks.length === 0) {
    return (
      <Card>
        <h2 className="text-lg font-bold">Day schedule</h2>
        <EmptyState plain illustration="calendar" title="No timed records" body="A deadline, planned block, event, or publish time with a clock time will appear on this schedule." />
      </Card>
    );
  }

  let gridStart = 8 * 60;
  let gridEnd = 20 * 60;
  for (const block of blocks) {
    gridStart = Math.min(gridStart, Math.floor(block.start / 60) * 60);
    gridEnd = Math.max(gridEnd, Math.ceil(block.end / 60) * 60);
  }
  gridStart = Math.max(0, gridStart);
  gridEnd = Math.min(24 * 60, Math.max(gridEnd, gridStart + 60));
  const span = gridEnd - gridStart;
  const hours = Array.from({ length: span / 60 }, (_, index) => gridStart + index * 60);
  const laneEnds: number[] = [];
  const placed: TimeBlock[] = [...blocks]
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .map((block) => {
      let lane = laneEnds.findIndex((end) => end <= block.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(block.end);
      } else {
        laneEnds[lane] = block.end;
      }
      return { ...block, lane };
    });
  const laneCount = Math.max(1, laneEnds.length);

  const nowMinutes = showNow ? klMinutes(new Date()) : null;
  const nowTop = nowMinutes !== null && nowMinutes >= gridStart && nowMinutes <= gridEnd ? ((nowMinutes - gridStart) / span) * 100 : null;

  return (
    <Card>
      <h2 className="text-lg font-bold">Day schedule</h2>
      <p className="mb-4 text-xs text-secondary">Blocks use the recorded start and end time. A deadline or publish time is a short marker, not a work duration.</p>
      <div className="relative" style={{ height: hours.length * 64 }}>
        {hours.map((minutes) => (
          <div key={minutes} className="flex h-16 border-t border-border">
            <span className="w-14 shrink-0 pt-1 text-[11px] font-semibold text-muted">{clockLabel(minutes)}</span>
            <div className="flex-1 border-l border-border" />
          </div>
        ))}
        <div className="absolute bottom-0 left-14 right-1 top-0">
          {nowTop !== null ? (
            <div className="pointer-events-none absolute right-0 left-0 z-10" style={{ top: `${nowTop}%` }}>
              <span className="absolute -left-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="block border-t-2 border-primary" />
            </div>
          ) : null}
          {placed.map((block) => {
            const top = ((block.start - gridStart) / span) * 100;
            const height = Math.max(((block.end - block.start) / span) * 100, 6);
            const width = 100 / laneCount;
            const body = (
              <>
                <span className="block truncate font-semibold">{block.title}</span>
                <span className="block text-[10px] opacity-80">{clockLabel(block.start)}–{clockLabel(block.end)}</span>
              </>
            );
            const className = cn("absolute overflow-hidden rounded-[10px] px-2 py-1 text-[11px] leading-tight", block.soft, block.text);
            const style = { top: `${top}%`, height: `${height}%`, left: `calc(${block.lane * width}% + 4px)`, width: `calc(${width}% - 8px)` };
            return block.href ? (
              <Link key={block.id} href={block.href} className={className} style={style}>{body}</Link>
            ) : (
              <div key={block.id} className={className} style={style}>{body}</div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function briefTitle(value: string) {
  const cleaned = value
    .replace(/^Demo:\s*/i, "")
    .replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, "")
    .replace(/^Demo\s+/i, "")
    .replace(/\s+\d{4}-\d{2}-\d{2}\s*$/, "")
    .trim();
  if (!cleaned) return value;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

type MonthLine = { key: string; title: string; text: string; soft: string; dot: string };

function monthLine(key: string, title: string, kind: (typeof MARKS)[number]["key"]): MonthLine {
  const mark = MARKS.find((entry) => entry.key === kind)!;
  return { key, title, text: mark.text, soft: mark.soft, dot: mark.dot };
}

function DayCell({
  dateStr,
  day,
  weekday,
  selected,
  today = false,
  muted = false,
  lines,
  tall = false,
}: {
  dateStr: string;
  day: number;
  weekday?: string;
  selected: boolean;
  today?: boolean;
  muted?: boolean;
  lines?: { shown: MonthLine[]; extra: number };
  tall?: boolean;
}) {
  return (
    <Link
      href={`/calendar?view=day&date=${dateStr}`}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-[10px] border text-left transition-colors sm:rounded-[14px]",
        tall ? "min-h-28 p-2 sm:min-h-44" : "min-h-[4.5rem] p-1 sm:min-h-28 sm:p-2",
        selected ? "border-primary bg-primary-light" : "border-border bg-surface hover:bg-canvas",
        muted && !selected && "bg-canvas/70",
        today && !selected && "ring-2 ring-orange/70",
      )}
    >
      {weekday ? <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{weekday}</span> : null}
      <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm", !tall && "mx-auto sm:mx-0", selected && "bg-primary text-white", today && !selected && "bg-orange text-white", muted && !selected && !today && "text-muted")}>{day}</span>
      {lines ? (
        <>
          <span className={cn("mt-1 flex flex-wrap justify-center gap-0.5", tall ? "hidden" : "sm:hidden")}>
            {[...new Set(lines.shown.map((line) => line.dot))].map((dot) => (
              <span key={dot} className={cn("h-1.5 w-1.5 rounded-full", dot)} />
            ))}
          </span>
          <span className={cn("mt-1 min-w-0 flex-col gap-1", tall ? "flex" : "hidden sm:flex")}>
            {lines.shown.map((line) => (
              <span key={line.key} className={cn("flex min-w-0 items-center gap-1 rounded-md px-1 py-0.5 text-[10px] font-semibold leading-snug", line.soft, line.text)}>
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", line.dot)} />
                <span className="truncate">{line.title}</span>
              </span>
            ))}
            {lines.extra > 0 ? <span className="text-[10px] font-medium text-muted">+{lines.extra} more</span> : null}
          </span>
        </>
      ) : null}
    </Link>
  );
}

function RecordGroup({
  id,
  title,
  tone,
  bar,
  children,
}: {
  id: string;
  title: string;
  tone: string;
  bar: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="overflow-hidden rounded-[16px] border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-canvas px-4 py-2.5">
        <span className={cn("h-2.5 w-2.5 rounded-full", bar)} />
        <h3 className={cn("text-sm font-bold", tone)}>{title}</h3>
      </div>
      <div className="space-y-2 p-3">{children}</div>
    </section>
  );
}
