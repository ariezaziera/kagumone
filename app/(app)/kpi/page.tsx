import { inArray } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarRange, Gauge, History, Users } from "lucide-react";
import { db } from "@/lib/db";
import { kpiActuals, kpiHistory } from "@/lib/db/schema";
import { upsertKpiTarget } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { listKpi, listPeople } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { PersonAvatar } from "@/components/person-avatar";
import { Badge, Card, EmptyState, Field, Input, Select } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { formatDate, formatDateTime, readableLabel } from "@/lib/utils";

export default async function KpiPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { period = "all" } = await searchParams;
  const canEdit = hasPermission(ctx, "kpi:edit");
  const [{ periods, targets }, peopleRows] = await Promise.all([listKpi(), listPeople()]);
  const people = new Map(peopleRows.map((person) => [person.id, person]));
  const visible = canEdit ? targets : targets.filter((target) => target.personId === ctx.person.id);
  const ids = visible.map((target) => target.id);
  const [historyRows, actualRows] = ids.length
    ? await Promise.all([
        db.select().from(kpiHistory).where(inArray(kpiHistory.targetId, ids)),
        db.select().from(kpiActuals).where(inArray(kpiActuals.targetId, ids)),
      ])
    : [[], []];
  const periodName = new Map(periods.map((item) => [item.id, item]));
  const usedPeriods = periods.filter((item) => visible.some((target) => target.periodId === item.id));
  const filtered = period === "all" ? visible : visible.filter((target) => target.periodId === period);
  const peopleWithTargets = new Set(visible.map((target) => target.personId)).size;
  const withActual = visible.filter((target) => actualRows.some((row) => row.targetId === target.id)).length;
  const summary = visible.length === 0
    ? "No KPI target is recorded yet. A target, a recorded actual, and a change history stay separate."
    : `${visible.length} ${visible.length === 1 ? "target" : "targets"} across ${peopleWithTargets} ${peopleWithTargets === 1 ? "person" : "people"}. ${withActual === 0 ? "No recorded actual yet." : `${withActual} ${withActual === 1 ? "has" : "have"} a recorded actual.`}`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="kpi"
        kicker="KPI"
        title="Targets"
        artWash="bg-blue-soft"
        description={canEdit ? `${summary} You can set or update a target. Setting your own also needs permission to create a KPI.` : `${summary} These are the targets recorded for you.`}
        actions={
          <>
            {canEdit ? <a className={linkButton("primary")} href="#set-target">Set a target</a> : null}
            <Link className={linkButton()} href="/reports">Reports</Link>
            <Link className={linkButton()} href="/workload">Workload</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Targets" value={visible.length} note="Recorded targets in this view." icon={Gauge} wash="bg-blue-soft" ink="text-info" href="/kpi" />
        <Metric label="People" value={peopleWithTargets} note="People who have at least one target." icon={Users} wash="bg-purple-soft" ink="text-purple" />
        <Metric label="Periods" value={usedPeriods.length} note="Periods that contain a visible target." icon={CalendarRange} wash="bg-orange-soft" ink="text-orange" />
        <Metric label="With an actual" value={withActual} note="A separate actual has been recorded." icon={History} wash="bg-green-soft" ink="text-success" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4">
          <ViewPills
            items={[
              { key: "all", href: "/kpi", label: "All", active: period === "all", count: visible.length },
              ...usedPeriods.map((item) => ({
                key: item.id,
                href: `/kpi?period=${item.id}`,
                label: item.name,
                active: period === item.id,
                count: visible.filter((target) => target.periodId === item.id).length,
              })),
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState illustration="kpi" title="No KPI target yet" body="An actual is recorded separately from the target. Nothing is filled in from task status." />
          ) : (
            <RecordList className="space-y-3" sortLabel="Updated">
              {filtered.map((target) => {
                const person = people.get(target.personId);
                const span = periodName.get(target.periodId);
                const actuals = actualRows.filter((row) => row.targetId === target.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const history = historyRows.filter((row) => row.targetId === target.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const latest = actuals[0];
                return (
                  <article
                    key={target.id}
                    data-record=""
                    data-sort={target.updatedAt ? new Date(target.updatedAt).toISOString() : ""}
                    data-label-text={`${person?.fullName ?? ""} ${target.category} ${span?.name ?? ""} ${target.targetValue}`}
                    className="rounded-[18px] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start gap-3">
                      <PersonAvatar personId={target.personId} name={person?.fullName ?? "Person"} hasPhoto={Boolean(person?.photoStorageKey)} version={person?.updatedAt.getTime()} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-text">{person?.fullName ?? "Person"}</p>
                        <p className="mt-0.5 text-xs text-secondary">{readableLabel(target.category)} · {span?.name ?? "Period"}</p>
                      </div>
                      <Badge tone="blue">{target.targetValue} {readableLabel(target.unit)}</Badge>
                    </div>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-[12px] bg-canvas px-3 py-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Target</dt>
                        <dd className="mt-1 text-sm font-semibold">{target.targetValue} {readableLabel(target.unit)}</dd>
                      </div>
                      <div className="rounded-[12px] bg-canvas px-3 py-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Recorded actual</dt>
                        <dd className="mt-1 text-sm font-semibold">{latest ? `${latest.actualValue} ${readableLabel(target.unit)}` : "None recorded"}</dd>
                        {latest?.evidence ? <dd className="mt-1 text-xs text-secondary">{latest.evidence}</dd> : null}
                        {actuals.length > 1 ? <dd className="mt-1 text-xs text-secondary">{actuals.length} actuals recorded. The latest is shown.</dd> : null}
                      </div>
                    </dl>
                    {span ? (
                      <p className="mt-2 text-xs text-secondary">{formatDate(span.startAt)} — {formatDate(span.endAt)}</p>
                    ) : null}
                    {history.length > 0 ? (
                      <ol className="mt-3 space-y-2 border-t border-border pt-3">
                        {history.map((entry) => (
                          <li key={entry.id} className="text-xs leading-relaxed text-secondary">
                            <span className="font-semibold text-text">{formatDateTime(entry.createdAt)}</span>
                            {" · "}
                            {entry.previousValue ?? "—"} → {entry.newValue ?? "—"}
                            {entry.reason ? ` · ${entry.reason}` : ""}
                            {entry.changedById ? ` · ${people.get(entry.changedById)?.fullName ?? "Recorded"}` : ""}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </article>
                );
              })}
            </RecordList>
          )}
        </section>
        {canEdit ? (
          <Card id="set-target" className="xl:sticky xl:top-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Set</p>
            <h2 className="mt-1 text-lg font-bold">Target</h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">Saving an existing target keeps the previous value in the history. This does not record an actual.</p>
            <ActionForm action={upsertKpiTarget} submitLabel="Save KPI target">
              <Field label="Person">
                <Select name="personId" required>
                  {peopleRows.filter((person) => person.organizationalStatus !== "deleted").map((person) => (
                    <option key={person.id} value={person.id}>{person.fullName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Period">
                <Select name="periodId" required>
                  {periods.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Category"><Input name="category" defaultValue="content" /></Field>
              <Field label="Target"><Input name="targetValue" type="number" required /></Field>
              <Field label="Reason"><Input name="reason" /></Field>
            </ActionForm>
          </Card>
        ) : (
          <Card className="xl:sticky xl:top-20">
            <h2 className="text-base font-bold">Your targets</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">Changing a target needs permission to edit KPI. An actual is stored separately and is not calculated from task status.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
