import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { AlertTriangle, Camera, Clock, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { equipmentMaintenance } from "@/lib/db/schema";
import { borrowEquipment, registerEquipment } from "@/lib/actions/core";
import { deriveEquipmentStatus } from "@/lib/services/org";
import { listEquipment, listProjects, listTasks, openLoans } from "@/lib/queries";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, Select, statusTone } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { DeadlineStamp, Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { readableLabel } from "@/lib/utils";

const CORE = ["available", "borrowed", "late", "maintenance"] as const;
const EXTRA = ["damaged", "missing"] as const;

const BAR: Record<string, string> = {
  available: "bg-green",
  borrowed: "bg-purple",
  late: "bg-primary",
  maintenance: "bg-yellow",
  damaged: "bg-orange",
  missing: "bg-charcoal",
};

export default async function EquipmentPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { status = "all" } = await searchParams;
  const canRegister = hasPermission(ctx, "equipment:register");
  const canBorrow = hasPermission(ctx, "equipment:borrow");
  const [items, loans, maintenance, projects, tasks] = await Promise.all([
    listEquipment(),
    openLoans(),
    db.select().from(equipmentMaintenance).where(eq(equipmentMaintenance.status, "open")),
    listProjects(),
    listTasks(),
  ]);
  const visible = new Set(items.map((item) => item.id));
  const openMaintenance = maintenance.filter((row) => visible.has(row.equipmentId));
  const rows = items.map((item) => {
    const loan = loans.find((entry) => entry.equipmentId === item.id);
    const derived = deriveEquipmentStatus({
      openLoan: Boolean(loan),
      expectedReturnAt: loan?.expectedReturnAt,
      maintenanceOpen: openMaintenance.some((entry) => entry.equipmentId === item.id),
      condition: item.condition,
    });
    return { item, loan, status: derived };
  });
  const count = (key: string) => rows.filter((row) => row.status === key).length;
  const filtered = status === "all" ? rows : rows.filter((row) => row.status === status);
  const extra = EXTRA.filter((key) => count(key) > 0 || status === key);
  const available = count("available");
  const borrowed = count("borrowed");
  const late = count("late");
  const summary = rows.length === 0
    ? "No assets registered yet. Status comes from the open loan, the condition, and any open maintenance."
    : `${available} available, ${borrowed} borrowed, ${late} past the expected return.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="equipment"
        kicker="Equipment"
        title="Studio assets"
        artWash="bg-green-soft"
        description={summary}
        actions={
          <>
            {canRegister ? <a className={linkButton("primary")} href="#register">Register asset</a> : null}
            {canBorrow ? <a className={linkButton()} href="#borrow">Borrow</a> : null}
            <Link className={linkButton()} href="/notices">Notices</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Available" value={available} note="No open loan, and not in maintenance." icon={Camera} wash="bg-green-soft" ink="text-success" href="/equipment?status=available" />
        <Metric label="Borrowed" value={borrowed} note="Out, and still inside the expected return." icon={Clock} wash="bg-purple-soft" ink="text-purple" href="/equipment?status=borrowed" />
        <Metric label="Late" value={late} note="The expected return has passed." icon={AlertTriangle} wash="bg-primary-light" ink="text-primary" href="/equipment?status=late" valueClass={late > 0 ? "text-error" : "text-text"} />
        <Metric label="Maintenance" value={count("maintenance")} note="An open maintenance record takes priority." icon={Wrench} wash="bg-yellow-soft" ink="text-warning" href="/equipment?status=maintenance" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4">
          <ViewPills
            items={[
              { key: "all", href: "/equipment", label: "All", active: status === "all", count: rows.length },
              ...[...CORE, ...extra].map((key) => ({
                key,
                href: `/equipment?status=${key}`,
                label: readableLabel(key),
                active: status === key,
                count: count(key),
              })),
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState illustration="equipment" title="No equipment in this view" body="Register an asset before it can be borrowed." />
          ) : (
            <RecordList className="space-y-3" sortLabel="Updated">
              {filtered.map(({ item, loan, status: derived }) => (
                <article
                  key={item.id}
                  data-record=""
                  data-sort={item.updatedAt ? new Date(item.updatedAt).toISOString() : item.name}
                  data-label-text={`${item.name} ${item.assetCode} ${item.category} ${item.location ?? ""} ${derived} ${item.condition}`}
                  className="relative overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]"
                >
                  <span className={`absolute inset-y-0 left-0 w-1.5 ${BAR[derived] ?? "bg-charcoal"}`} aria-hidden />
                  <Link href={`/equipment/${item.id}`} className="flex items-start gap-3 px-4 py-3.5 pl-5">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={statusTone(derived)}>{derived}</Badge>
                        <Badge tone={statusTone(item.condition)}>{readableLabel(item.condition)}</Badge>
                      </span>
                      <span className="mt-1.5 block text-base font-bold text-text">{item.name}</span>
                      <span className="mt-1 block text-xs text-secondary">
                        {item.assetCode}
                        {item.category ? ` · ${readableLabel(item.category)}` : ""}
                        {item.location ? ` · ${item.location}` : ""}
                      </span>
                    </span>
                    {loan ? <DeadlineStamp value={loan.expectedReturnAt} overdue={derived === "late"} size="sm" /> : null}
                  </Link>
                </article>
              ))}
            </RecordList>
          )}
        </section>
        <div className="space-y-4 xl:sticky xl:top-20">
          {canRegister ? (
            <Card id="register">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Register</p>
              <h2 className="mt-1 text-lg font-bold">Add an asset</h2>
              <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">Name and asset code identify the item. Condition starts as good.</p>
              <ActionForm action={registerEquipment} submitLabel="Add equipment">
                <Field label="Name"><Input name="name" required /></Field>
                <Field label="Asset code"><Input name="assetCode" required /></Field>
                <Field label="Category"><Input name="category" placeholder="Camera, lighting, audio" /></Field>
                <Field label="Serial"><Input name="serialNumber" /></Field>
                <Field label="Location"><Input name="location" /></Field>
              </ActionForm>
            </Card>
          ) : (
            <Card>
              <h2 className="text-base font-bold">Registering assets</h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary">You can borrow and return equipment. Registering a new asset needs the register permission.</p>
            </Card>
          )}
          {canBorrow && items.length > 0 ? (
            <Card id="borrow" className="scroll-mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Loan</p>
              <h2 className="mt-1 text-lg font-bold">Borrow</h2>
              <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">A loan needs a purpose, an expected return, and at least 2 before photos on the record.</p>
              <ActionForm action={borrowEquipment} submitLabel="Borrow equipment">
                <Field label="Equipment">
                  <Select name="equipmentId" required>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Purpose"><Input name="purpose" required /></Field>
                <Field label="Expected return"><Input name="expectedReturnAt" type="datetime-local" required /></Field>
                <Field label="Project">
                  <Select name="projectId">
                    <option value="">None</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Task">
                  <Select name="taskId">
                    <option value="">None</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </Select>
                </Field>
                <input type="hidden" name="beforePhotoCount" value="2" />
              </ActionForm>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
