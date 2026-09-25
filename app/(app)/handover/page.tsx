import { createHandover } from "@/lib/actions/core";
import { listHandovers, listPeople } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, PageHeader, Select, Textarea } from "@/components/ui";

export default async function HandoverPage() {
  const [rows, peopleRows] = await Promise.all([listHandovers(), listPeople()]);
  return (
    <div>
      <PageHeader title="Handover" description="Transfers context, outstanding work, and knowledge. It does not copy tasks as the handover itself." />
      {rows.length === 0 ? (
        <EmptyState title="No handovers" body="Start a handover when responsibility changes." />
      ) : (
        rows.map((h) => (
          <Card key={h.id} className="mb-2">
            <p>
              Outgoing {peopleRows.find((p) => p.id === h.outgoingPersonId)?.fullName} →{" "}
              {peopleRows.find((p) => p.id === h.incomingPersonId)?.fullName ?? "unassigned"}
            </p>
            <p className="text-sm text-secondary">{h.status}</p>
            <p className="text-sm">{h.notes}</p>
          </Card>
        ))
      )}
      <Card className="mt-4">
        <ActionForm action={createHandover} submitLabel="Start handover">
          <Field label="Outgoing">
            <Select name="outgoingPersonId">
              {peopleRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Incoming">
            <Select name="incomingPersonId">
              {peopleRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea name="notes" />
          </Field>
        </ActionForm>
      </Card>
    </div>
  );
}
