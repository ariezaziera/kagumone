import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { people, personSkills, reportingRelationships, skills, tasks } from "@/lib/db/schema";
import { deactivatePerson, setLastWorkingDay } from "@/lib/actions/core";
import { canEditProfile, getAuthContext, hasPermission } from "@/lib/auth/context";
import { ActionForm } from "@/components/action-form";
import { PersonAvatar } from "@/components/person-avatar";
import { ProfileForm } from "@/components/profile-form";
import { Badge, Card, Field, Input, Textarea, statusTone } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { WorkHero } from "@/components/work-surface";
import { formatDate, readableLabel } from "@/lib/utils";
import { hideDemoWorkspace } from "@/lib/services/demo-scope";
import { inferredLevelLabel } from "@/lib/services/skills";
import { listPeople } from "@/lib/queries";
import { ResetPasswordForm } from "../reset-password-form";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { id } = await params;
  const [person] = await db.select().from(people).where(eq(people.id, id));
  if (!person || (person.isDemo && (await hideDemoWorkspace()))) notFound();
  const [assigned, reporting, directRows, personSkillRows, skillRows, directory] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.assigneeId, id)),
    db.select().from(reportingRelationships).where(eq(reportingRelationships.personId, id)),
    db.select().from(reportingRelationships).where(eq(reportingRelationships.superiorId, id)),
    db.select().from(personSkills).where(eq(personSkills.personId, id)),
    db.select().from(skills),
    listPeople(),
  ]);
  const directoryPeople = new Map(directory.map((row) => [row.id, row]));
  const superiors = reporting.filter((row) => row.status === "active");
  const directs = directRows.filter((row) => row.status === "active" && directoryPeople.has(row.personId));
  const editable = canEditProfile(ctx, person.id);
  const canReset = hasPermission(ctx, "user:invite") && person.id !== ctx.person.id && Boolean(person.userId);
  const canEditEmployment = hasPermission(ctx, "team:edit") && ctx.person.id !== person.id;
  const canDeactivate = hasPermission(ctx, "team:delete") && ctx.person.id !== person.id;

  return (
    <div className="space-y-5">
      <Link href="/team" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft size={16} aria-hidden />
        All people
      </Link>
      <WorkHero
        illustration="team"
        kicker="Team"
        title={person.fullName}
        artWash="bg-pink-soft"
        description={`${person.positionTitle ? readableLabel(person.positionTitle) : "No position title"} · ${readableLabel(person.employmentType)}`}
        actions={
          <>
            <Badge tone={statusTone(person.organizationalStatus)}>{person.organizationalStatus}</Badge>
            {person.isDemo ? <Badge tone="yellow">Demo</Badge> : null}
          </>
        }
      />
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
        <div className="min-w-0 space-y-4">
          <Card>
            <div className="flex items-start gap-3">
              <PersonAvatar personId={person.id} name={person.fullName} hasPhoto={Boolean(person.photoStorageKey)} version={person.updatedAt.getTime()} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Profile</p>
                <h2 className="mt-1 text-lg font-bold">{person.preferredName || person.fullName}</h2>
                {person.preferredName ? <p className="text-xs text-secondary">Full name {person.fullName}</p> : null}
              </div>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Email</dt>
                <dd className="mt-1 break-all text-sm font-semibold">{person.email}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Username</dt>
                <dd className="mt-1 text-sm font-semibold">{person.username ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Last working day</dt>
                <dd className="mt-1 text-sm font-semibold">{formatDate(person.lastWorkingDay)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Status</dt>
                <dd className="mt-1 text-sm font-semibold">{readableLabel(person.organizationalStatus)}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <h2 className="text-base font-bold">Reports to</h2>
            {superiors.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">No reporting superior recorded.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {superiors.map((row) => {
                  const superior = directoryPeople.get(row.superiorId);
                  const body = (
                    <>
                      <PersonAvatar personId={row.superiorId} name={superior?.fullName ?? "Superior"} hasPhoto={Boolean(superior?.photoStorageKey)} version={superior?.updatedAt.getTime()} size="sm" />
                      <span className="text-sm font-semibold">{superior?.fullName ?? "Superior"}</span>
                    </>
                  );
                  return (
                    <li key={row.id}>
                      {superior ? (
                        <Link href={`/team/${row.superiorId}`} className="flex items-center gap-3 rounded-[14px] bg-canvas px-3 py-2.5">{body}</Link>
                      ) : (
                        <div className="flex items-center gap-3 rounded-[14px] bg-canvas px-3 py-2.5">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <h2 className="mt-4 text-base font-bold">Direct reports</h2>
            {directs.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">No one reports to this person.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {directs.map((row) => {
                  const report = directoryPeople.get(row.personId);
                  return (
                    <li key={row.id}>
                      <Link href={`/team/${row.personId}`} className="flex items-center gap-3 rounded-[14px] bg-canvas px-3 py-2.5">
                        <PersonAvatar personId={row.personId} name={report?.fullName ?? "Person"} hasPhoto={Boolean(report?.photoStorageKey)} version={report?.updatedAt.getTime()} size="sm" />
                        <span className="text-sm font-semibold">{report?.fullName ?? "Person"}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <section>
            <h2 className="mb-3 text-lg font-bold">Assigned tasks</h2>
            {assigned.length === 0 ? (
              <p className="text-sm text-secondary">No tasks assigned.</p>
            ) : (
              <RecordList className="space-y-2" sortLabel="Task">
                {assigned.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    data-record=""
                    data-sort={task.title}
                    data-label-text={`${task.title} ${task.status}`}
                    className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-surface px-3 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm font-semibold">{task.title}</span>
                    <Badge tone={statusTone(task.status)}>{task.status}</Badge>
                  </Link>
                ))}
              </RecordList>
            )}
          </section>
          <Card>
            <h2 className="text-base font-bold">Skills</h2>
            <p className="mt-1 text-xs text-secondary">A level is how much completed work has been seen. It is not a verified rating and not a KPI.</p>
            {personSkillRows.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">No observed skills yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {personSkillRows.map((row) => {
                  const skill = skillRows.find((item) => item.id === row.skillId);
                  return (
                    <li key={row.id}>
                      <Link href={`/skills/${row.skillId}`} className="flex items-center justify-between gap-3 rounded-[12px] bg-canvas px-3 py-2.5 text-sm">
                        <span className="font-semibold">{skill?.name ?? "Skill"}</span>
                        <span className="text-xs text-secondary">Level {row.level} · {inferredLevelLabel(row.level)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
        <div className="min-w-0 space-y-4">
          {editable ? (
            <Card>
              <h2 className="text-base font-bold">Edit profile</h2>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-secondary">Photo, name, and preferred name. The account owner, someone who manages administration, or a direct superior can save these.</p>
              <ProfileForm
                person={{
                  id: person.id,
                  fullName: person.fullName,
                  preferredName: person.preferredName,
                  hasPhoto: Boolean(person.photoStorageKey),
                }}
              />
            </Card>
          ) : null}
          {canReset ? (
            <Card>
              <h2 className="mb-2 text-base font-bold">Reset password</h2>
              <ResetPasswordForm personId={person.id} />
            </Card>
          ) : null}
          {canEditEmployment ? (
            <Card>
              <h2 className="text-base font-bold">Last working day</h2>
              <div className="mt-3">
                <ActionForm action={setLastWorkingDay} submitLabel="Update last working day">
                  <input type="hidden" name="personId" value={id} />
                  <Field label="Last working day"><Input name="lastWorkingDay" type="date" /></Field>
                  <Field label="Reason"><Textarea name="reason" /></Field>
                </ActionForm>
              </div>
            </Card>
          ) : null}
          {canDeactivate ? (
            <Card>
              <h2 className="text-base font-bold">Deactivate</h2>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-secondary">The person stays in the directory with an inactive status.</p>
              <ActionForm action={deactivatePerson} submitLabel="Deactivate account">
                <input type="hidden" name="personId" value={id} />
                <Field label="Reason"><Textarea name="reason" /></Field>
              </ActionForm>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
