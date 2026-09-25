import { saveSetting } from "@/lib/actions/core";
import { db } from "@/lib/db";
import { auditLogs, invitations, permissions, roles, settings } from "@/lib/db/schema";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { desc } from "drizzle-orm";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!hasPermission(ctx, "administration:manage")) return <p>You are not authorized to manage the system.</p>;
  const [roleRows, permRows, settingRows, invites, audit] = await Promise.all([
    db.select().from(roles),
    db.select().from(permissions),
    db.select().from(settings),
    db.select().from(invitations),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(20),
  ]);
  return (
    <div>
      <PageHeader title="Administration" description="Configuration does not grant unrestricted data modification by itself." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-medium">Roles</h2>
          {roleRows.map((r) => (
            <p key={r.id} className="text-sm">
              {r.name} ({r.key})
            </p>
          ))}
          <h2 className="mt-3 font-medium">Permissions</h2>
          <p className="text-xs text-secondary">{permRows.length} explicit capabilities</p>
        </Card>
        <Card>
          <h2 className="font-medium">Settings</h2>
          {settingRows.map((s) => (
            <p key={s.id} className="text-sm">
              {s.key}: {s.value}
            </p>
          ))}
          <ActionForm action={saveSetting} submitLabel="Save setting">
            <Field label="Key">
              <Input name="key" defaultValue="content_kpi_rule" />
            </Field>
            <Field label="Value">
              <Textarea name="value" />
            </Field>
          </ActionForm>
        </Card>
        <Card>
          <h2 className="font-medium">Invitations</h2>
          {invites.map((i) => (
            <p key={i.id} className="text-sm">
              {i.email} — {i.status}
            </p>
          ))}
        </Card>
        <Card>
          <h2 className="font-medium">System activity</h2>
          {audit.map((a) => (
            <p key={a.id} className="text-sm">
              {a.action}
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
}
