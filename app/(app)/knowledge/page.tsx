import { saveKnowledge } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { listKnowledge } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, Input, PageHeader, RecordList, Select, Textarea } from "@/components/ui";
import { formatDate, readableLabel } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function KnowledgePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const canManage = hasPermission(ctx, "knowledge:manage");
  const rows = await listKnowledge(true);
  return (
    <div>
      <PageHeader
        module="knowledge"
        title="Knowledge Base"
        description="Published SOPs and guides. Only management and executives can create or edit them."
      />
      {rows.length === 0 ? (
        <EmptyState title="No published SOPs yet" body="When management or an executive publishes an SOP, it will appear here." />
      ) : (
        <RecordList className="space-y-2">
        {rows.map((a) => (
          <Card key={a.id} data-record="" data-sort={a.updatedAt ? new Date(a.updatedAt).toISOString() : a.title}>
            <p className="font-medium">{a.title}</p>
            <p className="text-xs text-secondary">
              {a.category ? readableLabel(a.category) : "—"} · updated {formatDate(a.updatedAt)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{a.body}</p>
          </Card>
        ))}
        </RecordList>
      )}
      {canManage ? (
        <Card className="mt-4">
          <h2 className="mb-2 font-medium">Publish SOP / article</h2>
          <ActionForm action={saveKnowledge} submitLabel="Publish article">
            <Field label="Title">
              <Input name="title" required />
            </Field>
            <Field label="Category">
              <Select name="category">
                <option value="SOP">SOP</option>
                <option value="policy">Policy</option>
                <option value="guide">Guide</option>
                <option value="template">Template</option>
                <option value="FAQ">FAQ</option>
              </Select>
            </Field>
            <Field label="Body">
              <Textarea name="body" required />
            </Field>
          </ActionForm>
        </Card>
      ) : (
        <p className="mt-4 text-sm text-secondary">You can read published SOPs. Publishing is limited to executive and management.</p>
      )}
    </div>
  );
}
