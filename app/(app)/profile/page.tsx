import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { BookOpen, ListChecks, Users } from "lucide-react";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { visibleSignInEmail } from "@/lib/auth/pending-email";
import { listPeople, listProjects, listTasks } from "@/lib/queries";
import { db } from "@/lib/db";
import { personSkills, reportingRelationships, skillEvidence, skills } from "@/lib/db/schema";
import { loadDepartments } from "@/lib/services/departments";
import { Badge, Card, EmptyState } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { PersonAvatar } from "@/components/person-avatar";
import { ProfileForm } from "@/components/profile-form";
import { Metric, WorkHero, linkButton, taskCard } from "@/components/work-surface";
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
  const person = ctx.person;
  await inferSkillsForPerson(person.id);
  const [mine, projects, assigned, skillRows, evidence, reporting, directory, departmentData] = await Promise.all([
    listTasks().then((rows) => rows.filter((task) => task.assigneeId === person.id && task.status !== "completed")),
    listProjects(),
    db.select().from(personSkills).where(eq(personSkills.personId, person.id)),
    db.select().from(skills),
    db.select().from(skillEvidence),
    db.select().from(reportingRelationships).where(and(eq(reportingRelationships.personId, person.id), eq(reportingRelationships.status, "active"))),
    listPeople(),
    loadDepartments(),
  ]);
  const department = departmentData.byPerson.get(person.id) ?? null;
  const canManage = hasPermission(ctx, "administration:manage");
  const departmentOptions = departmentData.departments.filter((row) => row.status === "active" || row.id === department?.id);
  const directoryById = new Map(directory.map((row) => [row.id, row]));
  const projectName = new Map(projects.map((row) => [row.id, row.name]));
  const superiors = reporting
    .map((row) => directoryById.get(row.superiorId))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  const skillCards = assigned
    .map((row) => {
      const skill = skillRows.find((item) => item.id === row.skillId);
      if (!skill) return null;
      const count = evidence.filter((item) => item.personSkillId === row.id).length;
      return { id: row.id, skillId: row.skillId, name: skill.name, level: row.level, count };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="team"
        kicker="My profile"
        title={person.fullName}
        artWash="bg-pink-soft"
        description={person.preferredName ? `Goes by ${person.preferredName}. Photo, name, preferred name, and any sign-in left blank can be updated here.` : "Photo, name, preferred name, and any sign-in left blank can be updated here."}
        actions={
          <>
            <a className={linkButton("primary")} href="#edit-profile">Edit profile</a>
            <Link className={linkButton()} href={`/team/${person.id}`}>Team page</Link>
            <Link className={linkButton()} href="/settings">Settings</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Metric label="Open tasks" value={mine.length} note="Assigned to you and still open." icon={ListChecks} wash="bg-yellow-soft" ink="text-warning" href="#open-tasks" />
        <Metric label="Skills" value={skillCards.length} note="Observed from completed work." icon={BookOpen} wash="bg-purple-soft" ink="text-purple" href="#skills" />
        <Metric label="Reports to" value={superiors.length} note="Active reporting links, up to three." icon={Users} wash="bg-pink-soft" ink="text-pink" href="#profile-facts" />
      </div>

      <section id="profile-facts" className="overflow-hidden rounded-[22px] border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-5 bg-pink-soft px-5 py-6 sm:flex-row sm:items-center sm:px-8">
          <PersonAvatar personId={person.id} name={person.fullName} hasPhoto={Boolean(person.photoStorageKey)} version={person.updatedAt.getTime()} size="lg" />
          <div className="min-w-0">
            <h2 className="text-2xl font-bold leading-tight text-text">{person.preferredName || person.fullName}</h2>
            {person.preferredName ? <p className="mt-1 text-sm text-secondary">Full name {person.fullName}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="neutral">{readableLabel(person.organizationalStatus)}</Badge>
              {person.positionTitle ? <Badge tone="pink">{person.positionTitle}</Badge> : null}
              {ctx.roleKeys.map((role) => (
                <Badge key={role}>{readableLabel(role)}</Badge>
              ))}
            </div>
          </div>
        </div>
        <dl className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-surface px-5 py-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Email</dt>
            <dd className="mt-1 break-all text-sm font-semibold">{visibleSignInEmail(person.email) ?? "Not set yet"}</dd>
          </div>
          <div className="bg-surface px-5 py-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Username</dt>
            <dd className="mt-1 text-sm font-semibold">{person.username ?? "Not set yet"}</dd>
          </div>
          <div className="bg-surface px-5 py-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Department</dt>
            <dd className="mt-1 text-sm font-semibold">{department?.name ?? "No department"}</dd>
          </div>
          <div className="bg-surface px-5 py-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Employment</dt>
            <dd className="mt-1 text-sm font-semibold">{readableLabel(person.employmentType)}</dd>
          </div>
          <div className="bg-surface px-5 py-4 sm:col-span-2 lg:col-span-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Reports to</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {superiors.length === 0 ? <span className="text-sm font-semibold">No reporting superior recorded</span> : superiors.map((superior) => (
                <Link key={superior.id} href={`/team/${superior.id}`} className="inline-flex items-center gap-2 rounded-full bg-canvas py-1 pl-1 pr-3 text-sm font-semibold hover:text-primary">
                  <PersonAvatar personId={superior.id} name={superior.fullName} hasPhoto={Boolean(superior.photoStorageKey)} version={superior.updatedAt.getTime()} size="sm" />
                  {superior.fullName}
                </Link>
              ))}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <section id="open-tasks" className="space-y-3">
            <h2 className="text-lg font-bold">Open tasks</h2>
            {mine.length === 0 ? (
              <EmptyState illustration="caught-up" title="No open tasks" body="Assigned work that is still open will appear here." />
            ) : (
              <RecordList className="space-y-3" sortLabel="Due">
                {mine.map((task) => taskCard({ task, project: task.projectId ? projectName.get(task.projectId) : null }))}
              </RecordList>
            )}
          </section>
          <section id="skills" className="space-y-3">
            <h2 className="text-lg font-bold">Observed skills</h2>
            <p className="text-sm text-secondary">Levels come from finished work already recorded.</p>
            {skillCards.length === 0 ? (
              <EmptyState illustration="skills" title="No skills yet" body="Complete a categorized task or move content through the workflow." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {skillCards.map((skill) => (
                  <Link key={skill.id} href={`/skills/${skill.skillId}`} className="rounded-[16px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] hover:border-purple">
                    <p className="font-bold text-text">{skill.name}</p>
                    <div className="mt-3"><LevelMeter level={skill.level} /></div>
                    <p className="mt-2 text-xs text-secondary">
                      {inferredLevelLabel(skill.level)} · {skill.count} work {skill.count === 1 ? "record" : "records"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
        <Card id="edit-profile" accent="pink" className="xl:sticky xl:top-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Yours to edit</p>
          <h2 className="mt-1 text-lg font-bold">Edit profile</h2>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">Photo, name, preferred name, and position title. An email or username left blank can be added here. Someone who manages administration can edit the whole profile.</p>
          <ProfileForm
            person={{
              id: person.id,
              fullName: person.fullName,
              preferredName: person.preferredName,
              hasPhoto: Boolean(person.photoStorageKey),
              email: visibleSignInEmail(person.email),
              username: person.username,
              positionTitle: person.positionTitle,
              canEditSignIn: canManage,
              canEditDepartment: canManage,
              departmentId: department?.id ?? null,
              departments: departmentOptions.map((row) => ({ id: row.id, name: row.name })),
            }}
          />
        </Card>
      </div>
    </div>
  );
}
