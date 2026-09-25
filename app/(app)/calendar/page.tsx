import { and, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { calendarEvents, contents, plannedWork, tasks, timeEntries } from "@/lib/db/schema";
import { Badge, Card, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { listProjects, listTasks } from "@/lib/queries";
import { PlannedWorkForm } from "@/components/planned-work-form";
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
  const { start, end } = dayBounds(selected);

  const [monthDeadlines, dayDeadlines, plannedMonth, plannedDay, eventsDay, pubsDay, logs, projects, allTasks, contentRows] =
    await Promise.all([
      db.select().from(tasks).where(and(gte(tasks.officialDeadline, monthStart), lte(tasks.officialDeadline, monthEnd))),
      db.select().from(tasks).where(and(gte(tasks.officialDeadline, start), lte(tasks.officialDeadline, end))),
      db.select().from(plannedWork).where(and(gte(plannedWork.startAt, monthStart), lte(plannedWork.startAt, monthEnd))),
      db.select().from(plannedWork).where(and(gte(plannedWork.startAt, start), lte(plannedWork.startAt, end))),
      db.select().from(calendarEvents).where(and(gte(calendarEvents.startAt, start), lte(calendarEvents.startAt, end))),
      db.select().from(contents).where(and(gte(contents.plannedPublishAt, start), lte(contents.plannedPublishAt, end))),
      db.select().from(timeEntries),
      listProjects(),
      listTasks(),
      db.select().from(contents),
    ]);

  const logsDay = logs.filter((e) => e.workDate === selected);
  const daysInMonth = monthEnd.getDate();
  const firstWeekday = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Official deadlines, planned working time, and actual work are separate record types."
      />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <a className="rounded-md border border-border px-3 py-1" href={`/calendar?view=day&date=${selected}`}>
          Day
        </a>
        <a className="rounded-md border border-border px-3 py-1" href={`/calendar?view=week&date=${selected}`}>
          Week
        </a>
        <a className="rounded-md border border-border px-3 py-1" href={`/calendar?view=month&date=${selected}`}>
          Month
        </a>
        <PlannedWorkForm
          defaultDate={selected}
          tasks={allTasks.map((t) => ({ id: t.id, label: t.title }))}
          projects={projects.map((p) => ({ id: p.id, label: p.name }))}
          contents={contentRows.map((c) => ({ id: c.id, label: c.title }))}
        />
      </div>
      <div className="mb-3 flex flex-wrap gap-3 text-xs">
        <span className="text-error">Official Deadline</span>
        <span className="text-info">Planned Working Time</span>
        <span className="text-success">Actual Work / Completion / logs</span>
      </div>
      {view !== "day" ? (
        <Card className="mb-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-secondary">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(day)}`;
              const hasDeadline = monthDeadlines.some((t) => t.officialDeadline && ymd(t.officialDeadline) === dateStr);
              const hasPlanned = plannedMonth.some((p) => p.startAt && ymd(p.startAt) === dateStr);
              return (
                <a
                  key={dateStr}
                  href={`/calendar?view=day&date=${dateStr}`}
                  className={`min-h-16 rounded-md border p-1 text-left ${dateStr === selected ? "border-primary" : "border-border"}`}
                >
                  <span className="text-xs">{day}</span>
                  {hasDeadline ? <div className="text-[10px] text-error">Deadline</div> : null}
                  {hasPlanned ? <div className="text-[10px] text-info">Planned</div> : null}
                </a>
              );
            })}
          </div>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="mb-3 font-medium">Records on {selected}</h2>
          <p className="mb-3 text-xs text-secondary">This is the date detail, not an empty hourly grid.</p>
          {!dayDeadlines.length && !plannedDay.length && !eventsDay.length && !pubsDay.length && !logsDay.length ? (
            <p className="text-sm text-secondary">No operational records on this date.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dayDeadlines.map((t) => (
                <li key={t.id}>
                  <a className="text-error" href={`/tasks/${t.id}`}>
                    Official deadline: {t.title}
                  </a>{" "}
                  <span className="text-secondary">{formatDateTime(t.officialDeadline)}</span>
                </li>
              ))}
              {plannedDay.map((p) => (
                <li key={p.id} className="rounded-md border border-info/30 p-2">
                  <a className={p.taskId ? "text-info" : "text-info"} href={p.taskId ? `/tasks/${p.taskId}` : p.contentId ? `/content/${p.contentId}` : p.projectId ? `/projects/${p.projectId}` : "/calendar"}>
                    Planned work: {p.title || p.workType}
                  </a>{" "}
                  {formatDateTime(p.startAt)} – {formatDateTime(p.endAt)}
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
                        tasks={allTasks.map((t) => ({ id: t.id, label: t.title }))}
                        projects={projects.map((pr) => ({ id: pr.id, label: pr.name }))}
                        contents={contentRows.map((c) => ({ id: c.id, label: c.title }))}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
              {eventsDay.map((e) => (
                <li key={e.id}>
                  <span className="text-secondary">Event / coverage: {e.title}</span> {formatDateTime(e.startAt)}
                </li>
              ))}
              {pubsDay.map((c) => (
                <li key={c.id}>
                  <a className="text-info" href={`/content/${c.id}`}>
                    Content: {c.title}
                  </a>
                </li>
              ))}
              {logsDay.map((e) => (
                <li key={e.id} className="text-success">
                  Recorded work log: {e.actualMinutes} actual minutes
                  {e.taskId ? (
                    <>
                      {" "}
                      <a className="text-info" href={`/tasks/${e.taskId}`}>
                        open task
                      </a>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Legend</h2>
          <p className="text-sm text-error">Official Deadline — authoritative due date on the task.</p>
          <p className="mt-2 text-sm text-info">Planned Working Time — when you intend to work. Moving this does not move the deadline or owner.</p>
          <p className="mt-2 text-sm text-success">Actual Work / Completion Record — timestamps from completion and time logs.</p>
        </Card>
      </div>
    </div>
  );
}
