import Link from "next/link";
import { setReporting } from "@/lib/actions/core";
import { CreateMemberForm } from "./create-member-form";
import { listPeople } from "@/lib/queries";
import { db } from "@/lib/db";
import { reportingRelationships, roles } from "@/lib/db/schema";
import { ActionForm } from "@/components/action-form";
import { Card, Field, PageHeader, Select, Table } from "@/components/ui";
import { eq } from "drizzle-orm";
import { readableLabel } from "@/lib/utils";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { redirect } from "next/navigation";

export default async function TeamPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const canInvite = hasPermission(ctx, "user:invite");
  const canEditTeam = hasPermission(ctx, "team:edit");
  const [peopleRows, reportingRows, roleRows] = await Promise.all([
    listPeople(),
    db.select().from(reportingRelationships).where(eq(reportingRelationships.status, "active")),
    db.select().from(roles),
  ]);
  const visibleIds = new Set(peopleRows.map((person) => person.id));
  const reporting = reportingRows.filter((row) => visibleIds.has(row.personId) && visibleIds.has(row.superiorId));
  return (
    <div>
      <PageHeader module="people" title="Team" description="Directory and reporting relationships. New accounts get a temporary password and must replace it at first login." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <thead className="text-xs font-medium uppercase tracking-wide text-secondary">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Username</th>
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
                  {p.isDemo ? <span className="ml-2 text-xs text-warning">Demo</span> : null}
                </td>
                <td className="px-3 py-2">{p.username ?? "—"}</td>
                <td className="px-3 py-2">{p.positionTitle ? readableLabel(p.positionTitle) : "—"}</td>
                <td className="px-3 py-2">{readableLabel(p.employmentType)}</td>
                <td className="px-3 py-2">{readableLabel(p.organizationalStatus)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="space-y-4">
          {canInvite ? (
            <Card>
              <h2 className="mb-2 font-medium">Create account</h2>
              <p className="mb-3 text-sm text-secondary">Collect an email and a username. Either one can be used to log in.</p>
              <CreateMemberForm roles={roleRows.map((role) => ({ id: role.id, key: role.key, name: role.name }))} />
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-secondary">Staff and interns cannot create accounts. Accounts are created by someone with permission to invite.</p>
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
              <ul className="kagum-list mt-3 text-xs text-secondary">
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
              <ul className="kagum-list text-xs text-secondary">
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
