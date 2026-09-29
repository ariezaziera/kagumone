import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { people, personSkills, reportingRelationships, skills, tasks } from "@/lib/db/schema";
import { deactivatePerson, setLastWorkingDay } from "@/lib/actions/core";
import { canEditProfile, getAuthContext, hasPermission } from "@/lib/auth/context";
import { ActionForm } from "@/components/action-form";
import { PersonAvatar } from "@/components/person-avatar";
import { ProfileForm } from "@/components/profile-form";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { formatDate, readableLabel } from "@/lib/utils";
import { hideDemoWorkspace } from "@/lib/services/demo-scope";
import { listPeople } from "@/lib/queries";
import { ResetPasswordForm } from "../reset-password-form";
import Link from "next/link";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { id } = await params;
  const [person] = await db.select().from(people).where(eq(people.id, id));
  if (!person || (person.isDemo && (await hideDemoWorkspace()))) notFound();
  const [assigned, reporting, personSkillRows, skillRows, directory] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.assigneeId, id)),
    db.select().from(reportingRelationships).where(eq(reportingRelationships.personId, id)),
    db.select().from(personSkills).where(eq(personSkills.personId, id)),
    db.select().from(skills),
    listPeople(),
  ]);
  const names = new Map(directory.map((row) => [row.id, row.fullName]));
  const editable = canEditProfile(ctx, person.id);
  const canReset = hasPermission(ctx, "user:invite") && person.id !== ctx.person.id && Boolean(person.userId);
  return (
    <div>
      <PageHeader module="people" title={person.fullName} description={`${person.positionTitle ? readableLabel(person.positionTitle) : "—"} · ${readableLabel(person.employmentType)}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-1 text-sm">
          <PersonAvatar
            personId={person.id}
            name={person.fullName}
            hasPhoto={Boolean(person.photoStorageKey)}
            version={person.updatedAt.getTime()}
          />
          <p className="pt-2">Status: {readableLabel(person.organizationalStatus)}</p>
          <p>Last working day: {formatDate(person.lastWorkingDay)}</p>
          <p>Email: {person.email}</p>
          <p>Username: {person.username ?? "—"}</p>
          {person.preferredName ? <p>Preferred name: {person.preferredName}</p> : null}
          <h3 className="pt-2 font-medium">Reports to</h3>
          <div className="kagum-list">
            {reporting.filter((r) => r.status === "active").length === 0 ? <p className="text-secondary">No reporting superior recorded.</p> : null}
            {reporting
              .filter((r) => r.status === "active")
              .map((r) => (
                <p key={r.id}>{names.get(r.superiorId) ?? "Superior"}</p>
              ))}
          </div>
          <h3 className="pt-2 font-medium">Tasks</h3>
          <div className="kagum-list">
            {assigned.map((t) => (
              <p key={t.id}>
                <Link className="text-info" href={`/tasks/${t.id}`}>
                  {t.title}
                </Link>
              </p>
            ))}
          </div>
          <h3 className="pt-2 font-medium">Skills</h3>
          <div className="kagum-list">
            {personSkillRows.map((s) => (
              <p key={s.id}>
                {skillRows.find((x) => x.id === s.skillId)?.name} · level {s.level}
              </p>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          {editable ? (
            <Card>
              <h2 className="mb-1 font-medium">Edit profile</h2>
              <p className="mb-3 text-sm text-secondary">Photo, name, and preferred name. The account owner, a system administrator, or a direct superior can save these.</p>
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
              <h2 className="mb-2 font-medium">Reset password</h2>
              <ResetPasswordForm personId={person.id} />
            </Card>
          ) : null}
          <Card>
            <ActionForm action={setLastWorkingDay} submitLabel="Update last working day">
              <input type="hidden" name="personId" value={id} />
              <Field label="Last working day">
                <Input name="lastWorkingDay" type="date" />
              </Field>
              <Field label="Reason">
                <Textarea name="reason" />
              </Field>
            </ActionForm>
            <div className="mt-4">
              <ActionForm action={deactivatePerson} submitLabel="Deactivate account">
                <input type="hidden" name="personId" value={id} />
                <Field label="Reason">
                  <Textarea name="reason" />
                </Field>
              </ActionForm>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
