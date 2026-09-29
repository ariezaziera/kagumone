import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { people, personSkills, skillEvidence, skills } from "@/lib/db/schema";
import { Card, PageHeader } from "@/components/ui";
import { INFERRED_LEVELS, inferredLevelLabel } from "@/lib/services/skills";
import { cn } from "@/lib/utils";
import { hideDemoWorkspace } from "@/lib/services/demo-scope";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [skill] = await db.select().from(skills).where(eq(skills.id, id));
  if (!skill) notFound();
  const hidingDemo = await hideDemoWorkspace();
  const assignedRows = await db.select().from(personSkills).where(eq(personSkills.skillId, id));
  const peopleRows = (await db.select().from(people)).filter((person) => !hidingDemo || !person.isDemo);
  const visibleIds = new Set(peopleRows.map((person) => person.id));
  const assigned = assignedRows.filter((row) => visibleIds.has(row.personId));
  const evidence = (await db.select().from(skillEvidence)).filter((row) => assigned.some((holder) => holder.id === row.personSkillId));
  return (
    <div>
      <PageHeader module="skills" title={skill.name} description={skill.description ?? "Observed from completed work in this category."} />
      <Card className="mb-4">
        <p className="text-sm font-semibold">Observed level</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INFERRED_LEVELS.map((step) => (
            <div key={step.level} className="min-w-[5.5rem] flex-1 rounded-[12px] bg-canvas px-2 py-2 text-center">
              <p className="text-lg font-bold text-purple">{step.level}</p>
              <p className="text-[11px] font-semibold text-secondary">{step.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-secondary">Filled blocks follow completed work records. They are not a verified rating and not a KPI target.</p>
      </Card>
      {assigned.length === 0 ? <Card>No one has completed work in this skill yet.</Card> : null}
      <div className="grid gap-3">
        {assigned.map((row) => {
          const person = peopleRows.find((item) => item.id === row.personId);
          const name = person?.fullName ?? "Unknown";
          const notes = evidence.filter((item) => item.personSkillId === row.id);
          return (
            <Card key={row.id}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal text-sm font-bold text-white">
                  {initials(name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{name}</p>
                  <p className="text-sm text-secondary">
                    Level {row.level} · {inferredLevelLabel(row.level)} · {row.verified ? "verified" : "inferred from work"}
                  </p>
                  <div className="mt-2 flex gap-1" aria-hidden>
                    {INFERRED_LEVELS.map((step) => (
                      <span
                        key={step.level}
                        className={cn("h-2 flex-1 rounded-full", step.level <= row.level ? "bg-purple" : "bg-charcoal-soft")}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {notes.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {notes.map((note) => (
                    <li key={note.id} className="rounded-[12px] bg-canvas px-3 py-2 text-sm">
                      {note.relatedType === "task" && note.relatedId ? (
                        <Link className="font-semibold text-info" href={`/tasks/${note.relatedId}`}>
                          Task record
                        </Link>
                      ) : note.relatedType === "content" && note.relatedId ? (
                        <Link className="font-semibold text-info" href={`/content/${note.relatedId}`}>
                          Content record
                        </Link>
                      ) : (
                        <span className="font-semibold capitalize">{note.relatedType?.replaceAll("_", " ")}</span>
                      )}
                      {note.note ? <p className="mt-1 whitespace-pre-wrap text-secondary">{note.note}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
