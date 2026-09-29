import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { getAuthContext } from "@/lib/auth/context";
import { listPeople, listTasks } from "@/lib/queries";
import { db } from "@/lib/db";
import { personSkills, reportingRelationships, skillEvidence, skills } from "@/lib/db/schema";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { PersonAvatar } from "@/components/person-avatar";
import { ProfileForm } from "@/components/profile-form";
import { inferSkillsForPerson, inferredLevelLabel, INFERRED_LEVELS } from "@/lib/services/skills";
import { cn, readableLabel } from "@/lib/utils";

function LevelMeter({ level }: { level: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {INFERRED_LEVELS.map((step) => (
        <span key={step.level} className={cn("h-1.5 flex-1 rounded-full", step.level <= level ? "bg-purple" : "bg-charcoal-soft")} />
      ))}
    </div>
  );
}

export default async function ProfilePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  await inferSkillsForPerson(ctx.person.id);
  const person = ctx.person;
  const [mine, assigned, skillRows, evidence, reporting, directory] = await Promise.all([
    listTasks().then((rows) => rows.filter((task) => task.assigneeId === person.id && task.status !== "completed")),
    db.select().from(personSkills).where(eq(personSkills.personId, person.id)),
    db.select().from(skills),
    db.select().from(skillEvidence),
    db
      .select()
      .from(reportingRelationships)
      .where(and(eq(reportingRelationships.personId, person.id), eq(reportingRelationships.status, "active"))),
    listPeople(),
  ]);
  const names = new Map(directory.map((row) => [row.id, row.fullName]));
  const superiors = reporting.map((row) => names.get(row.superiorId)).filter((name): name is string => Boolean(name));
  const skillCards = assigned
    .map((row) => {
      const skill = skillRows.find((item) => item.id === row.skillId);
      if (!skill) return null;
      const count = evidence.filter((item) => item.personSkillId === row.id).length;
      return { id: row.id, skillId: row.skillId, name: skill.name, level: row.level, count };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const facts = [
    { label: "Email", value: person.email },
    { label: "Username", value: person.username ?? "—" },
    { label: "Position", value: person.positionTitle ? readableLabel(person.positionTitle) : "—" },
    { label: "Employment", value: readableLabel(person.employmentType) },
    { label: "Reports to", value: superiors.length ? superiors.join(", ") : "—" },
    { label: "Open tasks", value: String(mine.length) },
  ];

  return (
    <div>
      <PageHeader
        module="people"
        title="My Profile"
        description="Photo, name, and preferred name are yours to update. Position and employment are updated by someone who manages the team."
      />
      <section className="overflow-hidden rounded-[22px] border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-5 bg-pink-soft px-5 py-6 sm:flex-row sm:items-center sm:px-8">
          <PersonAvatar
            personId={person.id}
            name={person.fullName}
            hasPhoto={Boolean(person.photoStorageKey)}
            version={person.updatedAt.getTime()}
            size="lg"
          />
          <div className="min-w-0">
            <h2 className="text-2xl font-bold leading-tight text-text">{person.fullName}</h2>
            {person.preferredName ? <p className="mt-1 text-sm text-secondary">Goes by {person.preferredName}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {ctx.roleKeys.length === 0 ? <Badge>No role</Badge> : null}
              {ctx.roleKeys.map((role) => (
                <Badge key={role} tone="pink">
                  {role}
                </Badge>
              ))}
              <Badge tone="neutral">{person.organizationalStatus}</Badge>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="border-t border-border px-5 py-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{fact.label}</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-text">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="font-medium">Skills from completed work</h2>
          <p className="mb-4 mt-1 text-sm text-secondary">Levels come from finished work. They are not a verified rating.</p>
          {skillCards.length === 0 ? (
            <EmptyState
              plain
              title="No skills yet"
              body="Complete a categorized task or move content through the workflow."
              illustration="none"
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {skillCards.map((skill) => (
                <li key={skill.id}>
                  <Link
                    href={`/skills/${skill.skillId}`}
                    className="block rounded-[16px] border border-border bg-canvas p-3 transition-colors hover:border-[#f0b4b6] hover:bg-primary-light"
                  >
                    <p className="font-semibold text-text">{skill.name}</p>
                    <div className="mt-3">
                      <LevelMeter level={skill.level} />
                    </div>
                    <p className="mt-2 text-xs text-secondary">
                      {inferredLevelLabel(skill.level)} · {skill.count} work record{skill.count === 1 ? "" : "s"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card accent="pink">
          <h2 className="mb-1 font-medium">Edit profile</h2>
          <p className="mb-4 text-sm text-secondary">A system administrator or a direct superior can also save these fields.</p>
          <ProfileForm
            person={{
              id: person.id,
              fullName: person.fullName,
              preferredName: person.preferredName,
              hasPhoto: Boolean(person.photoStorageKey),
            }}
          />
        </Card>
      </div>
    </div>
  );
}
