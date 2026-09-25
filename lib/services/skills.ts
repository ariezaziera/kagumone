import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contentQc,
  contents,
  people,
  personSkills,
  skillCategories,
  skillEvidence,
  skills,
  taskCollaborators,
  taskCompletions,
  tasks,
} from "@/lib/db/schema";
import {
  CONTENT_STAGE_SKILLS,
  CONTENT_STAGES,
  TASK_CATEGORIES,
  type ContentStage,
} from "@/lib/permissions";
import { newId, now } from "@/lib/utils";

const TASK_CATEGORY_NAME = "Task work";
const CONTENT_CATEGORY_NAME = "Content operations";

/** Prompt levels 1–5. Count is observed completed work, not a KPI target. */
export function inferredLevelFromEvidenceCount(count: number) {
  if (count >= 15) return 5;
  if (count >= 8) return 4;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  return 1;
}

async function getOrCreateCategory(name: string) {
  const [existing] = await db.select().from(skillCategories).where(eq(skillCategories.name, name));
  if (existing) return existing;
  const id = newId();
  await db.insert(skillCategories).values({ id, name });
  return { id, name };
}

async function getOrCreateSkill(name: string, categoryId: string, description: string) {
  const [existing] = await db.select().from(skills).where(eq(skills.name, name));
  if (existing) return existing;
  const id = newId();
  const row = { id, categoryId, name, description };
  await db.insert(skills).values(row);
  return row;
}

export async function ensureSkillDirectory() {
  const taskCat = await getOrCreateCategory(TASK_CATEGORY_NAME);
  const contentCat = await getOrCreateCategory(CONTENT_CATEGORY_NAME);
  for (const name of TASK_CATEGORIES) {
    await getOrCreateSkill(name, taskCat.id, `Observed from completed tasks in category ${name}.`);
  }
  const contentNames = [...new Set(Object.values(CONTENT_STAGE_SKILLS))];
  for (const name of contentNames) {
    await getOrCreateSkill(name, contentCat.id, `Observed from content records that reached this stage of the existing workflow.`);
  }
}

async function addEvidence(input: {
  personId: string;
  skillName: string;
  relatedType: string;
  relatedId: string;
  note: string;
}) {
  const [skill] = await db.select().from(skills).where(eq(skills.name, input.skillName));
  if (!skill) return;
  let [personSkill] = await db
    .select()
    .from(personSkills)
    .where(and(eq(personSkills.personId, input.personId), eq(personSkills.skillId, skill.id)));
  if (!personSkill) {
    const id = newId();
    await db.insert(personSkills).values({
      id,
      personId: input.personId,
      skillId: skill.id,
      level: 1,
      verified: false,
      source: "inferred",
      createdAt: now(),
    });
    [personSkill] = await db.select().from(personSkills).where(eq(personSkills.id, id));
  }
  if (!personSkill) return;
  const [dup] = await db
    .select()
    .from(skillEvidence)
    .where(
      and(
        eq(skillEvidence.personSkillId, personSkill.id),
        eq(skillEvidence.relatedType, input.relatedType),
        eq(skillEvidence.relatedId, input.relatedId),
      ),
    );
  if (!dup) {
    await db.insert(skillEvidence).values({
      id: newId(),
      personSkillId: personSkill.id,
      note: input.note.slice(0, 2000),
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      source: "inferred",
      createdAt: now(),
    });
  }
  const evidence = await db.select().from(skillEvidence).where(eq(skillEvidence.personSkillId, personSkill.id));
  if (!personSkill.verified) {
    await db
      .update(personSkills)
      .set({ level: inferredLevelFromEvidenceCount(evidence.length) })
      .where(eq(personSkills.id, personSkill.id));
  }
}

function elaborationNote(parts: Array<string | null | undefined>) {
  return parts.map((p) => p?.trim()).filter(Boolean).join("\n\n") || "Completed work recorded.";
}

export async function inferSkillsForPerson(personId: string) {
  await ensureSkillDirectory();
  const [assigned, collab, ownedContent, createdContent, qcRows, completions] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.assigneeId, personId)),
    db.select().from(taskCollaborators).where(eq(taskCollaborators.personId, personId)),
    db.select().from(contents).where(eq(contents.ownerId, personId)),
    db.select().from(contents).where(eq(contents.creatorId, personId)),
    db.select().from(contentQc).where(eq(contentQc.reviewerId, personId)),
    db.select().from(taskCompletions).where(eq(taskCompletions.completedById, personId)),
  ]);
  const done = assigned.filter((t) => t.status === "submitted" || t.status === "completed");
  for (const task of done) {
    const skillName = TASK_CATEGORIES.includes(task.category as (typeof TASK_CATEGORIES)[number])
      ? (task.category as string)
      : "Other";
    const completion = completions.find((c) => c.taskId === task.id);
    await addEvidence({
      personId,
      skillName,
      relatedType: "task",
      relatedId: task.id,
      note: elaborationNote([
        `Task: ${task.title}`,
        task.purpose,
        completion?.summary,
        completion?.learned,
        completion?.doDifferently,
        completion?.rememberNext,
      ]),
    });
  }
  const allTasks = await db.select().from(tasks);
  for (const row of collab) {
    const task = allTasks.find((t) => t.id === row.taskId);
    if (!task || (task.status !== "submitted" && task.status !== "completed")) continue;
    if (task.assigneeId === personId) continue;
    const skillName = TASK_CATEGORIES.includes(task.category as (typeof TASK_CATEGORIES)[number])
      ? (task.category as string)
      : "Other";
    await addEvidence({
      personId,
      skillName,
      relatedType: "task_collab",
      relatedId: `${row.taskId}:${row.id}`,
      note: elaborationNote([`Collaborated on ${task.title} as ${row.roleInTask}`, row.contribution, row.notes]),
    });
  }
  const contentById = new Map([...ownedContent, ...createdContent].map((c) => [c.id, c]));
  for (const content of contentById.values()) {
    const stage = CONTENT_STAGES.includes(content.stage as ContentStage) ? (content.stage as ContentStage) : "planned";
    await addEvidence({
      personId,
      skillName: CONTENT_STAGE_SKILLS[stage],
      relatedType: "content",
      relatedId: content.id,
      note: elaborationNote([`Content: ${content.title}`, content.brief, content.concept, `Stage: ${content.stage}`]),
    });
  }
  for (const qc of qcRows) {
    const stage = qc.stage === "qc2" ? "qc2" : qc.stage === "self_qc" ? "self_qc" : "qc1";
    await addEvidence({
      personId,
      skillName: CONTENT_STAGE_SKILLS[stage],
      relatedType: "content_qc",
      relatedId: qc.id,
      note: elaborationNote([`QC ${qc.stage} (${qc.status})`, qc.comments]),
    });
  }
}

export async function inferSkillsFromRecentWork(personIds: string[]) {
  const unique = [...new Set(personIds.filter(Boolean))];
  for (const id of unique) {
    await inferSkillsForPerson(id);
  }
}

export async function inferSkillsForEveryone() {
  const rows = await db.select({ id: people.id }).from(people);
  for (const row of rows) {
    await inferSkillsForPerson(row.id);
  }
}
