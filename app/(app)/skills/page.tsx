import Link from "next/link";
import {
  BarChart3,
  Clapperboard,
  Database,
  Globe,
  Mail,
  PenLine,
  Search,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { personSkills, skillCategories, skillEvidence, skills, people } from "@/lib/db/schema";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { Illustration } from "@/components/illustrations";
import { inferSkillsForEveryone, inferredLevelLabel, INFERRED_LEVELS } from "@/lib/services/skills";
import { getAuthContext } from "@/lib/auth/context";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { hideDemoWorkspace } from "@/lib/services/demo-scope";

const SKILL_ICONS: Record<string, LucideIcon> = {
  "Website Update": Globe,
  Benchmarking: Search,
  "Social Media Management": Clapperboard,
  "Email / Automation Tasks": Mail,
  "Data Updates": Database,
  "Reporting / Analysis": BarChart3,
  "Corrections / Fixes": Wrench,
  "Client Handling": Users,
  Other: Sparkles,
  "Content planning": PenLine,
  "Content production": Clapperboard,
  "Content self-QC": Search,
  "Content QC": Search,
  "Content publishing": Clapperboard,
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function LevelMeter({ level }: { level: number }) {
  return (
    <div className="flex gap-1" aria-label={`${inferredLevelLabel(level)}, level ${level} of 5`}>
      {INFERRED_LEVELS.map((step) => (
        <span
          key={step.level}
          className={cn("h-1.5 flex-1 rounded-full", step.level <= level ? "bg-purple" : "bg-charcoal-soft")}
        />
      ))}
    </div>
  );
}

export default async function SkillsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  await inferSkillsForEveryone();
  const [cats, skillRows, assignedRows, evidence, peopleRows] = await Promise.all([
    db.select().from(skillCategories),
    db.select().from(skills),
    db.select().from(personSkills),
    db.select().from(skillEvidence),
    db.select().from(people),
  ]);
  const hidingDemo = await hideDemoWorkspace();
  const visiblePeople = hidingDemo ? peopleRows.filter((person) => !person.isDemo) : peopleRows;
  const visibleIds = new Set(visiblePeople.map((person) => person.id));
  const assigned = assignedRows.filter((row) => visibleIds.has(row.personId));
  const groups = cats
    .map((category) => ({
      category,
      skills: skillRows.filter((skill) => skill.categoryId === category.id),
    }))
    .filter((group) => group.skills.length > 0);
  const uncategorized = skillRows.filter((skill) => !cats.some((category) => category.id === skill.categoryId));
  if (uncategorized.length > 0) {
    groups.push({ category: { id: "other", name: "Other observed work" }, skills: uncategorized });
  }

  return (
    <div>
      <PageHeader
        module="skills"
        title="Skills"
        description="The same categories already used on tasks and content. A level is how much completed work we have seen, not a verified rating and not a KPI."
      />
      <Card accent="purple" className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Illustration name="skills" className="h-24 w-36 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">How to read a level</p>
          <p className="mt-1 text-sm text-secondary">Each block is one step from the work already recorded. More completed records fill more of the bar.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {INFERRED_LEVELS.map((step) => (
              <span key={step.level} className="inline-flex min-w-[8.5rem] flex-1 items-center gap-2 rounded-full bg-canvas px-2.5 py-1.5">
                <span className="w-14 shrink-0">
                  <LevelMeter level={step.level} />
                </span>
                <span className="text-xs font-semibold text-secondary">
                  {step.level} {step.label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </Card>
      {assigned.length === 0 ? (
        <EmptyState title="No skills in the directory yet" body="Complete a categorized task or move content through the workflow to generate evidence." illustration="skills" />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.category.id}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{group.category.name}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {group.skills.map((skill) => {
                  const holders = assigned.filter((row) => row.skillId === skill.id);
                  const evidenceCount = evidence.filter((row) => holders.some((holder) => holder.id === row.personSkillId)).length;
                  const Icon = SKILL_ICONS[skill.name] ?? Sparkles;
                  return (
                    <Card key={skill.id} className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-purple-soft text-purple">
                          <Icon size={20} aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <Link className="text-base font-semibold text-text" href={`/skills/${skill.id}`}>
                            {skill.name}
                          </Link>
                          {skill.description ? <p className="mt-1 text-sm leading-relaxed text-secondary">{skill.description}</p> : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {holders.length === 0 ? (
                          <p className="text-sm text-secondary">No completed work in this skill yet.</p>
                        ) : (
                          holders.slice(0, 5).map((holder) => {
                            const person = peopleRows.find((row) => row.id === holder.personId);
                            const name = person?.fullName ?? "Unknown";
                            return (
                              <span key={holder.id} className="inline-flex items-center gap-2 rounded-full bg-canvas py-1 pl-1 pr-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-charcoal text-[10px] font-bold text-white">
                                  {initials(name)}
                                </span>
                                <span className="text-xs font-semibold">{name.split(" ")[0]}</span>
                                <span className="text-[11px] text-muted">{inferredLevelLabel(holder.level)}</span>
                              </span>
                            );
                          })
                        )}
                        {holders.length > 5 ? <span className="text-xs font-semibold text-secondary">+{holders.length - 5}</span> : null}
                      </div>
                      <p className="text-xs font-medium text-muted">
                        {holders.length} {holders.length === 1 ? "person" : "people"} · {evidenceCount} work {evidenceCount === 1 ? "record" : "records"}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
