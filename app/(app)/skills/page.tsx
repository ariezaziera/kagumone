import { db } from "@/lib/db";
import { personSkills, skillCategories, skillEvidence, skills } from "@/lib/db/schema";
import { Card, PageHeader } from "@/components/ui";
import Link from "next/link";
import { inferSkillsForEveryone } from "@/lib/services/skills";
import { getAuthContext } from "@/lib/auth/context";
import { redirect } from "next/navigation";

export default async function SkillsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  await inferSkillsForEveryone();
  const [cats, skillRows, assigned, evidence] = await Promise.all([
    db.select().from(skillCategories),
    db.select().from(skills),
    db.select().from(personSkills),
    db.select().from(skillEvidence),
  ]);
  return (
    <div>
      <PageHeader
        title="Skills"
        description="Skills are the same categories already used on tasks and content. They are inferred from completed work and write-ups, not from a separate invented list. Levels 1–5 are inferred from how many work records exist; they are not KPI targets and are not verified."
      />
      {skillRows.length === 0 ? (
        <Card>No skills in the directory yet. Complete categorized tasks or content work to generate evidence.</Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {skillRows.map((s) => {
            const peopleCount = assigned.filter((a) => a.skillId === s.id).length;
            const evidenceCount = evidence.filter((e) => assigned.some((a) => a.id === e.personSkillId && a.skillId === s.id)).length;
            return (
              <Card key={s.id}>
                <Link className="font-medium text-info" href={`/skills/${s.id}`}>
                  {s.name}
                </Link>
                <p className="text-sm text-secondary">{s.description}</p>
                <p className="text-xs">
                  {peopleCount} people · {evidenceCount} work records
                </p>
              </Card>
            );
          })}
        </div>
      )}
      {cats.map((c) => (
        <p key={c.id} className="mt-2 text-sm text-secondary">
          Category: {c.name}
        </p>
      ))}
    </div>
  );
}
