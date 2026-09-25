import { listPeople, listTasks, listTime } from "@/lib/queries";
import { Card, PageHeader, Table } from "@/components/ui";
import { isTaskOverdue } from "@/lib/permissions";

export default async function WorkloadPage() {
  const [peopleRows, tasks, time] = await Promise.all([listPeople(), listTasks(), listTime()]);
  const rows = peopleRows.map((p) => {
    const assigned = tasks.filter((t) => t.assigneeId === p.id && t.status !== "completed");
    const overdue = assigned.filter((t) => isTaskOverdue(t));
    const minutes = time.filter((e) => e.personId === p.id);
    return {
      person: p,
      active: assigned.length,
      overdue: overdue.length,
      planned: minutes.reduce((s, e) => s + e.plannedMinutes, 0),
      actual: minutes.reduce((s, e) => s + e.actualMinutes, 0),
    };
  });
  return (
    <div>
      <PageHeader title="Workload" description="Descriptive counts only. The system does not rank or judge people." />
      <Table>
        <thead className="bg-primary-light text-xs uppercase text-secondary">
          <tr>
            <th className="px-3 py-2">Person</th>
            <th className="px-3 py-2">Active tasks</th>
            <th className="px-3 py-2">Overdue</th>
            <th className="px-3 py-2">Planned min</th>
            <th className="px-3 py-2">Actual min</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.person.id} className="border-t border-border">
              <td className="px-3 py-2">{r.person.fullName}</td>
              <td className="px-3 py-2">{r.active}</td>
              <td className="px-3 py-2">{r.overdue}</td>
              <td className="px-3 py-2">{r.planned}</td>
              <td className="px-3 py-2">{r.actual}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
