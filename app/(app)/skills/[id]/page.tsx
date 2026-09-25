import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { people, personSkills, skillEvidence, skills } from "@/lib/db/schema";
import { Card, PageHeader } from "@/components/ui";
import Link from "next/link";

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [skill] = await db.select().from(skills).where(eq(skills.id, id));
  if (!skill) notFound();
  const assigned = await db.select().from(personSkills).where(eq(personSkills.skillId, id));
  const peopleRows = await db.select().from(people);
  const evidence = await db.select().from(skillEvidence);
  return (
    <div>
      <PageHeader title={skill.name} description={skill.description ?? "Observed from completed work in this category."} />
      {assigned.length === 0 ? <Card>No one has completed work in this skill yet.</Card> : null}
      {assigned.map((a) => {
        const notes = evidence.filter((e) => e.personSkillId === a.id);
        return (
          <Card key={a.id} className="mb-2">
            <p>
              {peopleRows.find((p) => p.id === a.personId)?.fullName} — Level {a.level}{" "}
              {a.verified ? "(verified)" : "(inferred from work)"}
            </p>
            <ul className="mt-2 space-y-2 text-sm text-secondary">
              {notes.map((n) => (
                <li key={n.id} className="whitespace-pre-wrap">
                  {n.relatedType === "task" && n.relatedId ? (
                    <Link className="text-info" href={`/tasks/${n.relatedId}`}>
                      Work record
                    </Link>
                  ) : n.relatedType === "content" && n.relatedId ? (
                    <Link className="text-info" href={`/content/${n.relatedId}`}>
                      Content record
                    </Link>
                  ) : (
                    <span>{n.relatedType}</span>
                  )}
                  <p>{n.note}</p>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
