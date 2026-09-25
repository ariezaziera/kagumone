import { upsertKpiTarget } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { listKpi, listPeople } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { redirect } from "next/navigation";

export default async function KpiPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const canEdit = hasPermission(ctx, "kpi:edit");
  const [{ periods, targets }, peopleRows] = await Promise.all([listKpi(), listPeople()]);
  const visible = canEdit ? targets : targets.filter((t) => t.personId === ctx.person.id);
  return (
    <div>
      <PageHeader
        title="KPI"
        description={
          canEdit
            ? "Target, actual, period, and history are separate facts. Default period is 3 months. Executive and management set targets for staff and interns."
            : "You can see the KPI target set for you. Staff and interns cannot set or change KPI targets."
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((t) => {
          const period = periods.find((p) => p.id === t.periodId);
          const person = peopleRows.find((p) => p.id === t.personId);
          return (
            <Card key={t.id}>
              <p className="font-medium">{person?.fullName}</p>
              <p className="text-sm text-secondary">
                {t.category} · {period?.name} · target {t.targetValue} {t.unit}
              </p>
            </Card>
          );
        })}
        {visible.length === 0 ? (
          <Card>
            <p className="text-sm text-secondary">No KPI target is recorded for you yet. An executive or manager must set it.</p>
          </Card>
        ) : null}
        {canEdit ? (
          <Card>
            <h2 className="mb-2 font-medium">Set / update target</h2>
            <ActionForm action={upsertKpiTarget} submitLabel="Save KPI target">
              <Field label="Person">
                <Select name="personId">
                  {peopleRows.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Period">
                <Select name="periodId">
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Category">
                <Input name="category" defaultValue="content" />
              </Field>
              <Field label="Target">
                <Input name="targetValue" type="number" required />
              </Field>
              <Field label="Reason">
                <Input name="reason" />
              </Field>
            </ActionForm>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
