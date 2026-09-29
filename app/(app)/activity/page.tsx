import Link from "next/link";
import { ClipboardList, ScrollText, Users } from "lucide-react";
import { listActivity, listAudit, listPeople } from "@/lib/queries";
import { recordHref } from "@/components/record-files";
import { PersonAvatar } from "@/components/person-avatar";
import { Badge, EmptyState } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { formatDateTime, readableLabel } from "@/lib/utils";

function traceValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function parseTrace(value?: string | null) {
  const text = value?.trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  return null;
}

function traceBody(previous?: string | null, next?: string | null) {
  const before = parseTrace(previous);
  const after = parseTrace(next);
  if (before || after) {
    const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
    const lines = keys.flatMap((key) => {
      const hidden = /password|token|secret|hash/i.test(key);
      const left = before?.[key];
      const right = after?.[key];
      if (before && after && JSON.stringify(left) === JSON.stringify(right)) return [];
      if (hidden) return [`${readableLabel(key)}: updated`];
      if (before && after) return [`${readableLabel(key)}: ${traceValue(left)} → ${traceValue(right)}`];
      return [`${readableLabel(key)}: ${traceValue(after ? right : left)}`];
    });
    if (lines.length > 0) return lines.join("\n");
  }
  const left = previous?.trim();
  const right = next?.trim();
  if (left && right) return `${left} → ${right}`;
  return left || right || "";
}

function actionLabel(action: string) {
  const tail = action.includes(".") ? action.split(".").slice(1).join(".") : action;
  return readableLabel(tail);
}

function historyHref(type: string, id: string) {
  if (type === "person") return `/team/${id}`;
  if (type === "approval") return "/approvals";
  if (type === "setting") return "/admin";
  return recordHref(type, id);
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = "activity" } = await searchParams;
  const [activity, audit, peopleRows] = await Promise.all([listActivity(100), listAudit(50), listPeople()]);
  const peopleById = new Map(peopleRows.map((person) => [person.id, person]));
  const named = new Set(
    [...activity.map((row) => row.actorId), ...audit.map((row) => row.actorId)].filter((id): id is string => Boolean(id && peopleById.has(id))),
  );
  const showingAudit = view === "audit";
  const summary = activity.length === 0 && audit.length === 0
    ? "Activity is the readable story. Audit is the system trace of what changed."
    : `${activity.length} recent activity lines, ${audit.length} recent audit lines.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="dashboard"
        kicker="Activity"
        title="What happened"
        artWash="bg-blue-soft"
        description={summary}
        actions={
          <>
            <Link className={linkButton()} href="/approvals">Approvals</Link>
            <Link className={linkButton()} href="/handover">Handover</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Metric label="Activity" value={activity.length} note="Latest readable lines, up to 100." icon={ClipboardList} wash="bg-blue-soft" ink="text-info" href="/activity?view=activity" />
        <Metric label="Audit" value={audit.length} note="Latest system traces, up to 50." icon={ScrollText} wash="bg-charcoal-soft" ink="text-charcoal" href="/activity?view=audit" />
        <Metric label="People" value={named.size} note="People named on these recent lines." icon={Users} wash="bg-pink-soft" ink="text-pink" />
      </div>
      <ViewPills
        items={[
          { key: "activity", href: "/activity?view=activity", label: "Activity", active: !showingAudit, count: activity.length },
          { key: "audit", href: "/activity?view=audit", label: "Audit", active: showingAudit, count: audit.length },
        ]}
      />
      {showingAudit ? (
        audit.length === 0 ? (
          <EmptyState illustration="search" title="No audit lines yet" body="A system trace appears when a stored value changes." />
        ) : (
          <RecordList className="space-y-3" sortLabel="When">
            {audit.map((row) => {
              const actor = row.actorId ? peopleById.get(row.actorId) : null;
              const href = historyHref(row.entityType, row.entityId);
              const change = traceBody(row.previousValue, row.newValue);
              return (
                <article
                  key={row.id}
                  data-record=""
                  data-sort={row.createdAt ? new Date(row.createdAt).toISOString() : ""}
                  data-label-text={`${row.action} ${row.entityType} ${actor?.fullName ?? ""} ${change}`}
                  className="rounded-[18px] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start gap-3">
                    <PersonAvatar personId={row.actorId ?? row.id} name={actor?.fullName ?? "System"} hasPhoto={Boolean(actor?.photoStorageKey)} version={actor?.updatedAt.getTime()} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-bold text-text">{actionLabel(row.action)}</p>
                        <Badge tone="blue">{readableLabel(row.entityType)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-secondary">
                        {actor ? <Link href={`/team/${actor.id}`} className="font-semibold text-text hover:text-primary">{actor.fullName}</Link> : "System"}
                        {" · "}
                        {formatDateTime(row.createdAt)}
                      </p>
                      {change ? (
                        <p className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap break-all rounded-[12px] bg-canvas px-3 py-2 text-xs text-secondary">
                          {change}
                        </p>
                      ) : null}
                      {href ? <Link href={href} className="mt-2 inline-block text-xs font-semibold text-info">Open record</Link> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </RecordList>
        )
      ) : activity.length === 0 ? (
        <EmptyState illustration="quiet" title="No activity yet" body="Readable lines appear when work is assigned, updated, or completed." />
      ) : (
        <RecordList className="space-y-3" sortLabel="When">
          {activity.map((row) => {
            const actor = row.actorId ? peopleById.get(row.actorId) : null;
            const href = historyHref(row.entityType, row.entityId);
            return (
              <article
                key={row.id}
                data-record=""
                data-sort={row.createdAt ? new Date(row.createdAt).toISOString() : ""}
                data-label-text={`${row.summary} ${row.action} ${row.entityType} ${actor?.fullName ?? ""}`}
                className="rounded-[18px] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start gap-3">
                  <PersonAvatar personId={row.actorId ?? row.id} name={actor?.fullName ?? "System"} hasPhoto={Boolean(actor?.photoStorageKey)} version={actor?.updatedAt.getTime()} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-relaxed text-text">{row.summary}</p>
                    <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-secondary">
                      <Badge tone="blue">{readableLabel(row.entityType)}</Badge>
                      <span>{actionLabel(row.action)}</span>
                      <span>{formatDateTime(row.createdAt)}</span>
                    </p>
                    <p className="mt-2 text-xs text-secondary">
                      {actor ? <Link href={`/team/${actor.id}`} className="font-semibold text-text hover:text-primary">{actor.fullName}</Link> : "System"}
                      {href ? <> · <Link href={href} className="font-semibold text-info">Open record</Link></> : null}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </RecordList>
      )}
    </div>
  );
}
