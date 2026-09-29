import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { equipmentLoans, equipmentMaintenance, equipmentPhotos } from "@/lib/db/schema";
import { borrowEquipment, forceReturnEquipment, returnEquipment } from "@/lib/actions/core";
import { getEquipment, listFiles, listPeople, listProjects, listTasks } from "@/lib/queries";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { deriveEquipmentStatus } from "@/lib/services/org";
import { ActionForm } from "@/components/action-form";
import { PersonAvatar } from "@/components/person-avatar";
import { FileCards } from "@/components/record-files";
import { Badge, Card, Field, Input, Select, Textarea, statusTone } from "@/components/ui";
import { DeadlineStamp, WorkHero, linkButton } from "@/components/work-surface";
import { formatDateTime, readableLabel } from "@/lib/utils";

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { id } = await params;
  const item = await getEquipment(id);
  if (!item) notFound();
  const [loans, maintenance, people, projects, tasks, files] = await Promise.all([
    db.select().from(equipmentLoans).where(eq(equipmentLoans.equipmentId, id)),
    db.select().from(equipmentMaintenance).where(eq(equipmentMaintenance.equipmentId, id)),
    listPeople(),
    listProjects(),
    listTasks(),
    listFiles(),
  ]);
  const open = loans.find((loan) => loan.status === "borrowed");
  const photos = open ? await db.select().from(equipmentPhotos).where(eq(equipmentPhotos.loanId, open.id)) : [];
  const maintenanceOpen = maintenance.some((row) => row.status === "open");
  const status = deriveEquipmentStatus({
    openLoan: Boolean(open),
    expectedReturnAt: open?.expectedReturnAt,
    maintenanceOpen,
    condition: item.condition,
  });
  const names = new Map(people.map((person) => [person.id, person]));
  const borrower = open ? names.get(open.borrowerId) : undefined;
  const project = projects.find((row) => row.id === open?.projectId);
  const task = tasks.find((row) => row.id === open?.taskId);
  const attached = files.filter((file) => file.relatedType === "equipment" && file.relatedId === id);
  const before = photos.filter((photo) => photo.kind === "before").length;
  const after = photos.filter((photo) => photo.kind === "after").length;
  const history = [...loans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const banner = status === "late"
    ? "border-error/30 bg-error-soft"
    : status === "maintenance" || status === "damaged"
      ? "border-yellow/40 bg-yellow-soft"
      : status === "borrowed"
        ? "border-purple/30 bg-purple-soft"
        : "border-green/30 bg-green-soft";
  const bannerNote = status === "late"
    ? `Expected back ${formatDateTime(open?.expectedReturnAt)}.`
    : status === "borrowed"
      ? `${borrower?.fullName ?? "Someone"} has it until ${formatDateTime(open?.expectedReturnAt)}.`
      : status === "maintenance"
        ? "An open maintenance record is on this asset."
        : status === "missing" || status === "damaged"
          ? `Condition is ${readableLabel(item.condition)}.`
          : "Available to borrow.";

  return (
    <div className="space-y-5">
      <Link href="/equipment" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft size={16} aria-hidden />
        All equipment
      </Link>
      <WorkHero
        illustration="equipment"
        kicker="Equipment"
        title={item.name}
        artWash="bg-green-soft"
        description={`${item.assetCode}${item.serialNumber ? ` · ${item.serialNumber}` : ""}`}
        actions={
          <>
            <Badge tone={statusTone(status)}>{status}</Badge>
            <Badge tone={statusTone(item.condition)}>{readableLabel(item.condition)}</Badge>
            <Link className={linkButton()} href="/files?type=equipment">Equipment files</Link>
          </>
        }
      />
      <div className={`rounded-[18px] border px-4 py-3 ${banner}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Current state</p>
        <p className="text-base font-bold text-text">{readableLabel(status)}</p>
        <p className="text-sm text-secondary">{bannerNote}</p>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Asset</p>
            <h2 className="mt-1 text-lg font-bold">What this is</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Category</dt>
                <dd className="mt-1 text-sm font-semibold">{item.category ? readableLabel(item.category) : "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Location</dt>
                <dd className="mt-1 text-sm font-semibold">{item.location || "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Condition</dt>
                <dd className="mt-1 text-sm font-semibold">{readableLabel(item.condition)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Serial</dt>
                <dd className="mt-1 text-sm font-semibold">{item.serialNumber || "—"}</dd>
              </div>
            </dl>
          </Card>
          {open ? (
            <Card accent="purple">
              <div className="flex items-start gap-3">
                <DeadlineStamp value={open.expectedReturnAt} overdue={status === "late"} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Open loan</p>
                  <h2 className="mt-1 text-lg font-bold">{open.purpose}</h2>
                  <p className="mt-1 text-sm text-secondary">Expected return {formatDateTime(open.expectedReturnAt)}</p>
                </div>
              </div>
              {borrower ? (
                <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-canvas px-3 py-2.5">
                  <PersonAvatar personId={borrower.id} name={borrower.fullName} hasPhoto={Boolean(borrower.photoStorageKey)} version={borrower.updatedAt.getTime()} size="sm" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Borrower</p>
                    <p className="text-sm font-semibold">{borrower.fullName}</p>
                  </div>
                </div>
              ) : null}
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Project</dt>
                  <dd className="mt-1 text-sm font-semibold">{project ? <Link className="text-info" href={`/projects/${project.id}`}>{project.name}</Link> : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Task</dt>
                  <dd className="mt-1 text-sm font-semibold">{task ? <Link className="text-info" href={`/tasks/${task.id}`}>{task.title}</Link> : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Before photos</dt>
                  <dd className="mt-1 text-sm font-semibold">{before}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">After photos</dt>
                  <dd className="mt-1 text-sm font-semibold">{after}</dd>
                </div>
              </dl>
            </Card>
          ) : null}
          <Card>
            <h2 className="text-lg font-bold">Loan history</h2>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">No loans on this asset yet.</p>
            ) : (
              <ol className="relative mt-4 space-y-4 border-l-2 border-border pl-5">
                {history.map((loan) => {
                  const person = names.get(loan.borrowerId);
                  return (
                    <li key={loan.id} className="relative">
                      <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-green" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{formatDateTime(loan.createdAt)}</p>
                      <p className="mt-0.5 text-sm font-semibold">{person?.fullName ?? "Borrower"} · {readableLabel(loan.status)}</p>
                      <p className="text-sm text-secondary">{loan.purpose}</p>
                      {loan.forceReturned ? (
                        <p className="mt-1 text-xs text-secondary">Force-returned. The original borrower stays on the loan.{loan.forceReturnReason ? ` ${loan.forceReturnReason}` : ""}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          {open && hasPermission(ctx, "equipment:return") ? (
            <Card>
              <h2 className="text-base font-bold">Return</h2>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-secondary">A return needs a condition and at least 2 after photos on the record.</p>
              <ActionForm action={returnEquipment} submitLabel="Return equipment">
                <input type="hidden" name="loanId" value={open.id} />
                <input type="hidden" name="afterPhotoCount" value="2" />
                <Field label="Condition">
                  <Select name="condition" defaultValue="good">
                    <option value="good">Good</option>
                    <option value="damaged">Damaged</option>
                    <option value="missing">Missing</option>
                  </Select>
                </Field>
                <Field label="Notes"><Textarea name="notes" /></Field>
              </ActionForm>
            </Card>
          ) : null}
          {open && hasPermission(ctx, "equipment:force_return") ? (
            <Card>
              <h2 className="text-base font-bold">Force return</h2>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-secondary">The original borrower stays on the loan. A reason is required.</p>
              <ActionForm action={forceReturnEquipment} submitLabel="Force return equipment">
                <input type="hidden" name="loanId" value={open.id} />
                <Field label="Reason"><Input name="reason" required /></Field>
              </ActionForm>
            </Card>
          ) : null}
          {!open && hasPermission(ctx, "equipment:borrow") ? (
            <Card id="borrow" accent="green">
              <h2 className="text-base font-bold">Borrow this asset</h2>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-secondary">Purpose, expected return, and at least 2 before photos are required.</p>
              <ActionForm action={borrowEquipment} submitLabel="Borrow equipment">
                <input type="hidden" name="equipmentId" value={item.id} />
                <input type="hidden" name="beforePhotoCount" value="2" />
                <Field label="Purpose"><Input name="purpose" required /></Field>
                <Field label="Expected return"><Input name="expectedReturnAt" type="datetime-local" required /></Field>
                <Field label="Project">
                  <Select name="projectId">
                    <option value="">None</option>
                    {projects.map((row) => (
                      <option key={row.id} value={row.id}>{row.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Task">
                  <Select name="taskId">
                    <option value="">None</option>
                    {tasks.map((row) => (
                      <option key={row.id} value={row.id}>{row.title}</option>
                    ))}
                  </Select>
                </Field>
              </ActionForm>
            </Card>
          ) : null}
          {maintenanceOpen ? (
            <Card>
              <h2 className="text-base font-bold">Maintenance</h2>
              <ul className="mt-3 space-y-2">
                {maintenance.filter((row) => row.status === "open").map((row) => (
                  <li key={row.id} className="rounded-[12px] bg-yellow-soft px-3 py-2.5 text-sm">{row.notes}</li>
                ))}
              </ul>
            </Card>
          ) : null}
          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">Files</h2>
              <Link className="text-sm font-semibold text-primary" href="/files?type=equipment">Attach</Link>
            </div>
            <FileCards rows={attached.map((file) => ({ id: file.id, filename: file.filename, uploader: file.uploaderId ? names.get(file.uploaderId)?.fullName ?? null : null, createdAt: file.createdAt }))} />
          </Card>
        </div>
      </div>
    </div>
  );
}
