import { logTime } from "@/lib/actions/core";
import { getAuthContext } from "@/lib/auth/context";
import { listProjects, listTasks, listTime } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Select, Table } from "@/components/ui";
import { redirect } from "next/navigation";

export default async function TimePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const [entries, tasks, projects] = await Promise.all([listTime(ctx.person.id), listTasks(), listProjects()]);
  const planned = entries.reduce((s, e) => s + e.plannedMinutes, 0);
  const actual = entries.reduce((s, e) => s + e.actualMinutes, 0);
  return (
    <div>
      <PageHeader title="Time Tracking" description="Actual time comes from recorded entries, not status changes." />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Card>
          <p className="text-xs text-secondary">Planned minutes</p>
          <p className="text-2xl font-semibold">{planned}</p>
        </Card>
        <Card>
          <p className="text-xs text-secondary">Actual minutes</p>
          <p className="text-2xl font-semibold">{actual}</p>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Table>
          <thead className="bg-primary-light text-xs uppercase text-secondary">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Planned</th>
              <th className="px-3 py-2">Actual</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-3 py-2">{e.workDate}</td>
                <td className="px-3 py-2">{e.plannedMinutes}</td>
                <td className="px-3 py-2">{e.actualMinutes}</td>
                <td className="px-3 py-2">{e.notes}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Card>
          <ActionForm action={logTime} submitLabel="Log time">
            <Field label="Date">
              <Input name="workDate" type="date" required />
            </Field>
            <Field label="Planned minutes">
              <Input name="plannedMinutes" type="number" defaultValue={0} />
            </Field>
            <Field label="Actual minutes">
              <Input name="actualMinutes" type="number" defaultValue={0} />
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
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
