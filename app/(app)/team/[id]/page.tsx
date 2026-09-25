import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { people, personSkills, reportingRelationships, skills, tasks } from "@/lib/db/schema";
import { deactivatePerson, setLastWorkingDay } from "@/lib/actions/core";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [person] = await db.select().from(people).where(eq(people.id, id));
  if (!person) notFound();
  const [assigned, reporting, personSkillRows, skillRows] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.assigneeId, id)),
    db.select().from(reportingRelationships).where(eq(reportingRelationships.personId, id)),
    db.select().from(personSkills).where(eq(personSkills.personId, id)),
    db.select().from(skills),
  ]);
  return (
    <div>
      <PageHeader title={person.fullName} description={`${person.positionTitle ?? ""} · ${person.employmentType}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="text-sm space-y-1">
          <p>Status: {person.organizationalStatus}</p>
          <p>Last working day: {formatDate(person.lastWorkingDay)}</p>
          <p>Email: {person.email}</p>
          <h3 className="pt-2 font-medium">Reports to</h3>
          {reporting.map((r) => (
            <p key={r.id}>{r.superiorId}</p>
          ))}
          <h3 className="pt-2 font-medium">Tasks</h3>
          {assigned.map((t) => (
            <p key={t.id}>
              <Link className="text-info" href={`/tasks/${t.id}`}>
                {t.title}
              </Link>
            </p>
          ))}
          <h3 className="pt-2 font-medium">Skills</h3>
          {personSkillRows.map((s) => (
            <p key={s.id}>
              {skillRows.find((x) => x.id === s.skillId)?.name} · level {s.level}
            </p>
          ))}
        </Card>
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
  );
}
