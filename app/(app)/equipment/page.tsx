import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { equipment, equipmentLoans, equipmentMaintenance } from "@/lib/db/schema";
import { borrowEquipment, registerEquipment } from "@/lib/actions/core";
import { deriveEquipmentStatus } from "@/lib/services/org";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, Table, statusTone } from "@/components/ui";
import { listProjects, listTasks } from "@/lib/queries";
import Link from "next/link";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { redirect } from "next/navigation";

export default async function EquipmentPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const canRegister = hasPermission(ctx, "equipment:register");
  const [items, loans, maintenance, projects, tasks] = await Promise.all([
    db.select().from(equipment),
    db.select().from(equipmentLoans).where(eq(equipmentLoans.status, "borrowed")),
    db.select().from(equipmentMaintenance).where(eq(equipmentMaintenance.status, "open")),
    listProjects(),
    listTasks(),
  ]);
  const statuses = items.map((item) => {
    const loan = loans.find((l) => l.equipmentId === item.id);
    return {
      item,
      status: deriveEquipmentStatus({
        openLoan: Boolean(loan),
        expectedReturnAt: loan?.expectedReturnAt,
        maintenanceOpen: maintenance.some((m) => m.equipmentId === item.id),
        condition: item.condition,
      }),
    };
  });
  return (
    <div>
      <PageHeader title="Equipment" description="Current state is derived from loans, condition, and maintenance." />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {["available", "borrowed", "late", "maintenance"].map((key) => (
          <Card key={key}>
            <p className="text-xs text-secondary">{key}</p>
            <p className="text-2xl font-semibold">{statuses.filter((s) => s.status === key).length}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {items.length === 0 ? (
          <EmptyState title="No equipment registered" body="Register an asset before borrowing." />
        ) : (
          <Table>
            <thead className="bg-primary-light text-xs uppercase text-secondary">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Condition</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map(({ item, status }) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link className="text-info" href={`/equipment/${item.id}`}>
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{item.assetCode}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(status)}>{status}</Badge>
                  </td>
                  <td className="px-3 py-2">{item.condition}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className="space-y-4">
          {canRegister ? (
          <Card>
            <h2 className="mb-2 font-medium">Register equipment</h2>
            <ActionForm action={registerEquipment} submitLabel="Add equipment">
              <Field label="Name">
                <Input name="name" required />
              </Field>
              <Field label="Asset code">
                <Input name="assetCode" required />
              </Field>
              <Field label="Category">
                <Input name="category" defaultValue="camera" />
              </Field>
            </ActionForm>
          </Card>
          ) : (
            <Card>
              <p className="text-sm text-secondary">Staff and interns can borrow and return equipment. Registering new assets is limited to executive and management.</p>
            </Card>
          )}
          <Card>
            <h2 className="mb-2 font-medium">Borrow</h2>
            <p className="mb-2 text-xs text-secondary">Minimum 2 before photos are required as evidence.</p>
            <ActionForm action={borrowEquipment} submitLabel="Borrow equipment">
              <Field label="Equipment">
                <Select name="equipmentId">
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Purpose">
                <Input name="purpose" required />
              </Field>
              <Field label="Expected return">
                <Input name="expectedReturnAt" type="datetime-local" required />
              </Field>
              <Field label="Project">
                <Select name="projectId">
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Task">
                <Select name="taskId">
                  <option value="">None</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <input type="hidden" name="beforePhotoCount" value="2" />
            </ActionForm>
          </Card>
        </div>
      </div>
    </div>
  );
}
