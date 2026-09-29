import Link from "next/link";
import {
  BarChart3,
  BookOpen,
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
import { people, personSkills, skillCategories, skillEvidence, skills } from "@/lib/db/schema";
import { PersonAvatar } from "@/components/person-avatar";
import { Card, EmptyState } from "@/components/ui";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
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

function LevelMeter({ level }: { level: number }) {
  return (
    <div className="flex gap-1" aria-label={`${inferredLevelLabel(level)}, level ${level} of 5`}>
      {INFERRED_LEVELS.map((step) => (
        <span key={step.level} className={cn("h-1.5 flex-1 rounded-full", step.level <= level ? "bg-purple" : "bg-charcoal-soft")} />
      ))}
    </div>
  );
}

export default async function SkillsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { category = "all" } = await searchParams;
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
    .map((item) => ({ category: item, skills: skillRows.filter((skill) => skill.categoryId === item.id) }))
    .filter((group) => group.skills.length > 0);
  const uncategorized = skillRows.filter((skill) => !cats.some((item) => item.id === skill.categoryId));
  if (uncategorized.length > 0) groups.push({ category: { id: "other", name: "Other observed work" }, skills: uncategorized });
  const visibleGroups = category === "all" ? groups : groups.filter((group) => group.category.id === category);
  const peopleWithSkill = new Set(assigned.map((row) => row.personId)).size;
  const visibleEvidence = evidence.filter((row) => assigned.some((holder) => holder.id === row.personSkillId));
  const summary = assigned.length === 0
    ? "Levels come from completed work already recorded. A level is not a verified rating and not a KPI."
    : `${skillRows.length} skills, ${peopleWithSkill} ${peopleWithSkill === 1 ? "person" : "people"} with observed work, ${visibleEvidence.length} work ${visibleEvidence.length === 1 ? "record" : "records"}.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="skills"
        kicker="Skills"
        title="Observed work"
        artWash="bg-purple-soft"
        description={summary}
        actions={
          <>
            <Link className={linkButton()} href="/team">Team</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Skills" value={skillRows.length} note="Categories already used on tasks and content." icon={BookOpen} wash="bg-purple-soft" ink="text-purple" href="/skills" />
        <Metric label="People" value={peopleWithSkill} note="People with at least one observed skill." icon={Users} wash="bg-pink-soft" ink="text-pink" />
        <Metric label="Work records" value={visibleEvidence.length} note="Completed work that filled a level." icon={Search} wash="bg-yellow-soft" ink="text-warning" />
        <Metric label="Groups" value={groups.length} note="Skill groups with at least one skill." icon={Sparkles} wash="bg-blue-soft" ink="text-info" />
      </div>
      <Card accent="purple">
        <p className="text-sm font-semibold">How to read a level</p>
        <p className="mt-1 text-sm text-secondary">Each block is one step from work already recorded. More completed records fill more of the bar.</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {INFERRED_LEVELS.map((step) => (
            <span key={step.level} className="inline-flex min-w-[8.5rem] shrink-0 items-center gap-2 rounded-full bg-canvas px-2.5 py-1.5">
              <span className="w-14 shrink-0"><LevelMeter level={step.level} /></span>
              <span className="text-xs font-semibold text-secondary">{step.level} {step.label}</span>
            </span>
          ))}
        </div>
      </Card>
      <ViewPills
        items={[
          { key: "all", href: "/skills", label: "All", active: category === "all", count: skillRows.length },
          ...groups.map((group) => ({
            key: group.category.id,
            href: `/skills?category=${group.category.id}`,
            label: group.category.name,
            active: category === group.category.id,
            count: group.skills.length,
          })),
        ]}
      />
      {visibleGroups.length === 0 || assigned.length === 0 ? (
        <EmptyState title="No skills in the directory yet" body="Complete a categorized task or move content through the workflow to generate evidence." illustration="skills" />
      ) : (
        <div className="space-y-8">
          {visibleGroups.map((group) => (
            <section key={group.category.id}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{group.category.name}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {group.skills.map((skill) => {
                  const holders = assigned.filter((row) => row.skillId === skill.id);
                  const evidenceCount = evidence.filter((row) => holders.some((holder) => holder.id === row.personSkillId)).length;
                  const Icon = SKILL_ICONS[skill.name] ?? Sparkles;
                  return (
                    <Card
                      key={skill.id}
                      data-record=""
                      data-sort={skill.name}
                      data-label-text={`${skill.name} ${skill.description ?? ""} ${group.category.name}`}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-purple-soft text-purple">
                          <Icon size={20} aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <Link className="text-base font-bold text-text hover:text-primary" href={`/skills/${skill.id}`}>{skill.name}</Link>
                          {skill.description ? <p className="mt-1 text-sm leading-relaxed text-secondary">{skill.description}</p> : null}
                        </div>
                      </div>
                      {holders.length === 0 ? (
                        <p className="text-sm text-secondary">No completed work in this skill yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {holders.slice(0, 4).map((holder) => {
                            const person = visiblePeople.find((row) => row.id === holder.personId);
                            return (
                              <Link key={holder.id} href={`/team/${holder.personId}`} className="inline-flex max-w-full items-center gap-2 rounded-full bg-canvas py-1 pl-1 pr-2.5">
                                <PersonAvatar personId={holder.personId} name={person?.fullName ?? "Person"} hasPhoto={Boolean(person?.photoStorageKey)} version={person?.updatedAt.getTime()} size="sm" />
                                <span className="truncate text-xs font-semibold">{person?.fullName ?? "Person"}</span>
                                <span className="text-[11px] text-muted">{inferredLevelLabel(holder.level)}</span>
                              </Link>
                            );
                          })}
                          {holders.length > 4 ? <span className="self-center text-xs font-semibold text-secondary">+{holders.length - 4}</span> : null}
                        </div>
                      )}
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
