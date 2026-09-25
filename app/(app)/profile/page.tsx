import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { listTasks } from "@/lib/queries";
import { db } from "@/lib/db";
import { personSkills, skillEvidence, skills } from "@/lib/db/schema";
import { Card, PageHeader } from "@/components/ui";
import { inferSkillsForPerson } from "@/lib/services/skills";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function ProfilePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  await inferSkillsForPerson(ctx.person.id);
  const mine = (await listTasks()).filter((t) => t.assigneeId === ctx.person.id);
  const [assigned, skillRows, evidence] = await Promise.all([
    db.select().from(personSkills).where(eq(personSkills.personId, ctx.person.id)),
    db.select().from(skills),
    db.select().from(skillEvidence),
  ]);
  return (
    <div>
      <PageHeader title="My Profile" description="Organizational fields can only be changed by authorized users." />
      <Card className="space-y-1 text-sm">
        <p>Name: {ctx.person.fullName}</p>
        <p>Email: {ctx.person.email}</p>
        <p>Position: {ctx.person.positionTitle}</p>
        <p>Employment: {ctx.person.employmentType}</p>
        <p>Roles: {ctx.roleKeys.join(", ")}</p>
        <p>Open tasks: {mine.filter((t) => t.status !== "completed").length}</p>
      </Card>
      <Card className="mt-4">
        <h2 className="mb-2 font-medium">Skills from completed work</h2>
        {assigned.length === 0 ? (
          <p className="text-sm text-secondary">No inferred skills yet. Complete a categorized task or move content through the workflow.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {assigned.map((a) => {
              const skill = skillRows.find((s) => s.id === a.skillId);
              const count = evidence.filter((e) => e.personSkillId === a.id).length;
              return (
                <li key={a.id}>
                  <Link className="text-info" href={`/skills/${a.skillId}`}>
                    {skill?.name}
                  </Link>{" "}
                  · inferred level {a.level} · {count} work record{count === 1 ? "" : "s"}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
