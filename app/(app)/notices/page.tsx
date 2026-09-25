import { createAnnouncement } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { listAnnouncements, listPeople } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function NoticesPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const canPost = hasPermission(ctx, "announcement:create");
  const [rows, peopleRows] = await Promise.all([listAnnouncements(), listPeople()]);
  return (
    <div>
      <PageHeader
        title="Notices"
        description="Event notices and participation posts for the whole team. This is not an SOP and not an approval."
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          {rows.length === 0 ? (
            <EmptyState title="No notices yet" body="Posted event notices and participation requests will appear on the dashboard carousel." />
          ) : (
            rows.map((n) => (
              <Card key={n.id} className="mb-3">
                <p className="text-xs uppercase text-info">{n.kind.replaceAll("_", " ")}</p>
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
                <p className="mt-2 text-xs text-secondary">
                  {peopleRows.find((p) => p.id === n.createdById)?.fullName} · {formatDateTime(n.createdAt)}
                  {n.requiresParticipation ? " · needs participation" : ""}
                </p>
              </Card>
            ))
          )}
        </div>
        {canPost ? (
          <Card>
            <h2 className="mb-2 font-medium">Post a notice</h2>
            <ActionForm action={createAnnouncement} submitLabel="Publish notice">
              <Field label="Type">
                <Select name="kind" defaultValue="announcement">
                  <option value="announcement">Announcement / update</option>
                  <option value="event_notice">Event notice</option>
                  <option value="participation">Content / activity needing all participation</option>
                </Select>
              </Field>
              <Field label="Title">
                <Input name="title" required />
              </Field>
              <Field label="Details">
                <Textarea name="body" required />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="requiresParticipation" /> Requires team participation
              </label>
            </ActionForm>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-secondary">You can read notices here. Posting is limited to authorized users.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
