import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { GitFork, UserPlus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { reportingRelationships, roles } from "@/lib/db/schema";
import { setReporting } from "@/lib/actions/core";
import { isDirectoryPerson, listPeople } from "@/lib/queries";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { CreateMemberForm } from "./create-member-form";
import { OrgChart } from "@/components/org-chart";
import { ActionForm } from "@/components/action-form";
import { PersonAvatar } from "@/components/person-avatar";
import { Badge, Card, EmptyState, Field, Select, statusTone } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { readableLabel } from "@/lib/utils";
import { loadDepartments } from "@/lib/services/departments";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { status = "all" } = await searchParams;
  const canInvite = hasPermission(ctx, "user:invite");
  const canEditTeam = hasPermission(ctx, "team:edit");
  const [peopleRows, reportingRows, roleRows, departmentData] = await Promise.all([
    listPeople().then((rows) => rows.filter(isDirectoryPerson)),
    db.select().from(reportingRelationships).where(eq(reportingRelationships.status, "active")),
    db.select().from(roles),
    loadDepartments(),
  ]);
  const activeDepartments = departmentData.departments.filter((department) => department.status === "active");
  const visibleIds = new Set(peopleRows.map((person) => person.id));
  const reporting = reportingRows.filter((row) => visibleIds.has(row.personId) && visibleIds.has(row.superiorId));
  const active = peopleRows.filter((person) => person.organizationalStatus === "active").length;
  const filtered = status === "all" ? peopleRows : peopleRows.filter((person) => person.organizationalStatus === status);
  const statuses = [...new Set(peopleRows.map((person) => person.organizationalStatus))];
  const summary = peopleRows.length === 0
    ? "No people in the directory yet."
    : `${active} active of ${peopleRows.length}. ${reporting.length} reporting ${reporting.length === 1 ? "link" : "links"}. A person can report to as many as three people.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="team"
        kicker="Team"
        title="People"
        artWash="bg-pink-soft"
        description={summary}
        actions={
          <>
            {canInvite ? <a className={linkButton("primary")} href="#create-account">Create account</a> : null}
            <a className={linkButton()} href="#org-chart">Organization chart</a>
            <Link className={linkButton()} href="/skills">Skills</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Metric label="People" value={peopleRows.length} note="Everyone in this directory." icon={Users} wash="bg-pink-soft" ink="text-pink" href="/team" />
        <Metric label="Active" value={active} note="Organizational status is active." icon={UserPlus} wash="bg-green-soft" ink="text-success" href="/team?status=active" />
        <Metric label="Reporting links" value={reporting.length} note="Active links, up to three superiors each." icon={GitFork} wash="bg-purple-soft" ink="text-purple" href="#org-chart" />
      </div>
      <Card id="org-chart">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Organization</p>
        <h2 className="mt-1 text-lg font-bold">Who reports to whom</h2>
        <p className="mb-4 mt-1 text-sm text-secondary">Each row sits under the people they report to. Someone with more than one superior stays on one card and names every person they report to.</p>
        <OrgChart
          people={peopleRows.map((person) => ({
            id: person.id,
            fullName: person.fullName,
            positionTitle: person.positionTitle,
            departmentName: departmentData.byPerson.get(person.id)?.name ?? null,
            photoStorageKey: person.photoStorageKey,
            updatedAt: person.updatedAt,
          }))}
          edges={reporting.map((row) => ({ personId: row.personId, superiorId: row.superiorId }))}
        />
      </Card>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4">
          <ViewPills
            items={[
              { key: "all", href: "/team", label: "All", active: status === "all", count: peopleRows.length },
              ...statuses.map((item) => ({
                key: item,
                href: `/team?status=${item}`,
                label: readableLabel(item),
                active: status === item,
                count: peopleRows.filter((person) => person.organizationalStatus === item).length,
              })),
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState illustration="team" title="No one in this view" body="The directory lists people and their reporting links." />
          ) : (
            <RecordList className="space-y-3">
              {filtered.map((person) => {
                const reportsTo = reporting.filter((row) => row.personId === person.id).map((row) => peopleRows.find((item) => item.id === row.superiorId)?.fullName).filter((name): name is string => Boolean(name));
                return (
                  <article
                    key={person.id}
                    data-record=""
                    data-label-text={`${person.fullName} ${person.username ?? ""} ${person.positionTitle ?? ""} ${departmentData.byPerson.get(person.id)?.name ?? ""} ${person.employmentType} ${person.organizationalStatus}`}
                    className="rounded-[18px] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]"
                  >
                    <Link href={`/team/${person.id}`} className="flex items-start gap-3">
                      <PersonAvatar personId={person.id} name={person.fullName} hasPhoto={Boolean(person.photoStorageKey)} version={person.updatedAt.getTime()} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-base font-bold text-text">{person.fullName}</span>
                          <Badge tone={statusTone(person.organizationalStatus)}>{person.organizationalStatus}</Badge>
                          {person.isDemo ? <Badge tone="yellow">Demo</Badge> : null}
                        </span>
                        <span className="mt-1 block text-xs text-secondary">
                          {person.positionTitle?.trim() || "No position title"}
                          {" · "}
                          {departmentData.byPerson.get(person.id)?.name ?? "No department"}
                          {" · "}
                          {readableLabel(person.employmentType)}
                          {person.username ? ` · ${person.username}` : ""}
                        </span>
                        <span className="mt-1 block text-xs text-secondary">{reportsTo.length > 0 ? `Reports to ${reportsTo.join(", ")}` : "No reporting superior recorded"}</span>
                      </span>
                    </Link>
                  </article>
                );
              })}
            </RecordList>
          )}
        </section>
        <div className="space-y-4 xl:sticky xl:top-20">
          {canInvite ? (
            <Card id="create-account">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Account</p>
              <h2 className="mt-1 text-lg font-bold">Create account</h2>
              <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">An email or a username is enough to sign in. The one left blank can be added later on the profile. The first password is temporary and must be replaced.</p>
              <CreateMemberForm
                roles={roleRows.map((role) => ({ id: role.id, key: role.key, name: role.name }))}
                departments={activeDepartments.map((department) => ({ id: department.id, name: department.name }))}
              />
            </Card>
          ) : (
            <Card>
              <h2 className="text-base font-bold">Accounts</h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary">Creating an account needs permission to invite. You can still open the directory.</p>
            </Card>
          )}
          {canEditTeam ? (
            <Card>
              <h2 className="text-base font-bold">Add a reporting link</h2>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-secondary">Up to three superiors. The chart updates from these links.</p>
              <ActionForm action={setReporting} submitLabel="Add reporting link">
                <Field label="Person">
                  <Select name="personId" required>
                    {peopleRows.map((person) => (
                      <option key={person.id} value={person.id}>{person.fullName}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Reports to">
                  <Select name="superiorId" required>
                    {peopleRows.map((person) => (
                      <option key={person.id} value={person.id}>{person.fullName}</option>
                    ))}
                  </Select>
                </Field>
              </ActionForm>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
