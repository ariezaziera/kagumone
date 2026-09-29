import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { people, personSkills, skillEvidence, skills } from "@/lib/db/schema";
import { PersonAvatar } from "@/components/person-avatar";
import { Card } from "@/components/ui";
import { WorkHero } from "@/components/work-surface";
import { INFERRED_LEVELS, inferredLevelLabel } from "@/lib/services/skills";
import { cn, readableLabel } from "@/lib/utils";
import { hideDemoWorkspace } from "@/lib/services/demo-scope";

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
    <div className="space-y-5">
      <Link href="/skills" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft size={16} aria-hidden />
        All skills
      </Link>
      <WorkHero
        illustration="skills"
        kicker="Skills"
        title={skill.name}
        artWash="bg-purple-soft"
        description={skill.description ?? "Observed from completed work in this category. A level is not a verified rating and not a KPI."}
      />
      <Card accent="purple">
        <p className="text-sm font-semibold">Observed level</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {INFERRED_LEVELS.map((step) => (
            <div key={step.level} className="min-w-[5.5rem] flex-1 rounded-[12px] bg-canvas px-2 py-2 text-center">
              <p className="text-lg font-bold text-purple">{step.level}</p>
              <p className="text-[11px] font-semibold text-secondary">{step.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-secondary">{assigned.length} {assigned.length === 1 ? "person" : "people"} · {evidence.length} work {evidence.length === 1 ? "record" : "records"}. Filled blocks follow completed work.</p>
      </Card>
      {assigned.length === 0 ? (
        <Card><p className="text-sm text-secondary">No one has completed work in this skill yet.</p></Card>
      ) : (
        <div className="grid gap-3">
          {assigned.map((row) => {
            const person = peopleRows.find((item) => item.id === row.personId);
            const notes = evidence.filter((item) => item.personSkillId === row.id);
            return (
              <Card key={row.id}>
                <div className="flex items-start gap-3">
                  <PersonAvatar personId={row.personId} name={person?.fullName ?? "Person"} hasPhoto={Boolean(person?.photoStorageKey)} version={person?.updatedAt.getTime()} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/team/${row.personId}`} className="font-bold text-text hover:text-primary">{person?.fullName ?? "Person"}</Link>
                    <p className="text-sm text-secondary">Level {row.level} · {inferredLevelLabel(row.level)} · {row.verified ? "verified" : "inferred from work"}</p>
                    <div className="mt-2 flex gap-1" aria-hidden>
                      {INFERRED_LEVELS.map((step) => (
                        <span key={step.level} className={cn("h-2 flex-1 rounded-full", step.level <= row.level ? "bg-purple" : "bg-charcoal-soft")} />
                      ))}
                    </div>
                  </div>
                </div>
                {notes.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {notes.map((note) => {
                      const href = note.relatedType === "task" && note.relatedId
                        ? `/tasks/${note.relatedId}`
                        : note.relatedType === "content" && note.relatedId
                          ? `/content/${note.relatedId}`
                          : null;
                      const label = note.note?.trim() || (note.relatedType ? readableLabel(note.relatedType) : "Work record");
                      return (
                        <li key={note.id} className="rounded-[12px] bg-canvas px-3 py-2 text-sm">
                          {href ? (
                            <Link className="font-semibold text-info" href={href}>{label}</Link>
                          ) : (
                            <span className="font-semibold">{label}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
