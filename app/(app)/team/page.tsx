import Link from "next/link";
import { inviteUser, setReporting } from "@/lib/actions/core";
import { listPeople } from "@/lib/queries";
import { db } from "@/lib/db";
import { reportingRelationships, roles } from "@/lib/db/schema";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Select, Table } from "@/components/ui";
import { eq } from "drizzle-orm";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { redirect } from "next/navigation";

export default async function TeamPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const canInvite = hasPermission(ctx, "user:invite");
  const canEditTeam = hasPermission(ctx, "team:edit");
  const [peopleRows, reporting, roleRows] = await Promise.all([
    listPeople(),
    db.select().from(reportingRelationships).where(eq(reportingRelationships.status, "active")),
    db.select().from(roles),
  ]);
  return (
    <div>
      <PageHeader title="Team" description="Directory and reporting relationships. The chart visualizes stored data." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <thead className="bg-primary-light text-xs uppercase text-secondary">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Position</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {peopleRows.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <Link className="text-info" href={`/team/${p.id}`}>
                    {p.fullName}
                  </Link>
                  {p.isDemo ? <span className="ml-2 text-xs text-warning">demo</span> : null}
                </td>
                <td className="px-3 py-2">{p.positionTitle}</td>
                <td className="px-3 py-2">{p.employmentType}</td>
                <td className="px-3 py-2">{p.organizationalStatus}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="space-y-4">
          {canInvite ? (
            <Card>
              <h2 className="mb-2 font-medium">Invite user</h2>
              <ActionForm action={inviteUser} submitLabel="Send invitation">
                <Field label="Full name">
                  <Input name="fullName" required />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" required />
                </Field>
                <Field label="Role">
                  <Select name="roleKey">
                    {roleRows.map((r) => (
                      <option key={r.id} value={r.key}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </ActionForm>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-secondary">Staff and interns cannot create users. Invitations are sent by executive or management.</p>
            </Card>
          )}
          {canEditTeam ? (
            <Card>
              <h2 className="mb-2 font-medium">Reporting (max 3 superiors)</h2>
              <ActionForm action={setReporting} submitLabel="Add reporting link">
                <Field label="Person">
                  <Select name="personId">
                    {peopleRows.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Reports to">
                  <Select name="superiorId">
                    {peopleRows.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </Select>
                </Field>
              </ActionForm>
              <ul className="mt-3 text-xs text-secondary">
                {reporting.map((r) => (
                  <li key={r.id}>
                    {peopleRows.find((p) => p.id === r.personId)?.fullName} → {peopleRows.find((p) => p.id === r.superiorId)?.fullName}
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card>
              <h2 className="mb-2 font-medium">Reporting</h2>
              <ul className="text-xs text-secondary">
                {reporting.map((r) => (
                  <li key={r.id}>
                    {peopleRows.find((p) => p.id === r.personId)?.fullName} → {peopleRows.find((p) => p.id === r.superiorId)?.fullName}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
