import { decideExtension } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { allApprovals } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, PageHeader, Select, Textarea, statusTone } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function ApprovalsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const canDecide = hasPermission(ctx, "task:approve_extension");
  const rows = await allApprovals();
  const pending = rows.filter((r) => r.status === "pending");
  return (
    <div>
      <PageHeader
        title="Approvals"
        description={
          canDecide
            ? "Record decisions on pending requests."
            : "You can see approval status. Decisions are made by executive or management."
        }
      />
      {pending.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          body={canDecide ? "Requests requiring your decision will appear here." : "Pending requests will appear here. You cannot record a decision."}
        />
      ) : (
        pending.map((a) => (
          <Card key={a.id} className="mb-3">
            <p className="font-medium">
              {a.type} <Badge tone={statusTone(a.status)}>{a.status}</Badge>
            </p>
            <p className="text-sm text-secondary">{formatDateTime(a.createdAt)}</p>
            {canDecide && a.type === "task_extension" ? (
              <ActionForm action={decideExtension} submitLabel="Record decision">
                <input type="hidden" name="extensionId" value={a.relatedId} />
                <Field label="Decision">
                  <Select name="decision">
                    <option value="approved">Approve extension</option>
                    <option value="rejected">Reject extension</option>
                  </Select>
                </Field>
                <Field label="Comment">
                  <Textarea name="comment" />
                </Field>
              </ActionForm>
            ) : (
              <p className="text-sm text-secondary">Awaiting executive or management decision.</p>
            )}
          </Card>
        ))
      )}
      <h2 className="mt-6 mb-2 font-medium">Status history</h2>
      {rows
        .filter((r) => r.status !== "pending")
        .map((a) => (
          <p key={a.id} className="text-sm">
            {a.type} — {a.status}
            {a.comment ? ` · ${a.comment}` : ""}
          </p>
        ))}
    </div>
  );
}
