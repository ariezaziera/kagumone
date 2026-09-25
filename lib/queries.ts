import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityLogs,
  announcements,
  approvals,
  contents,
  equipment,
  equipmentLoans,
  files,
  handovers,
  knowledgeArticles,
  kpiPeriods,
  kpiTargets,
  notifications,
  people,
  projects,
  tasks,
  timeEntries,
} from "@/lib/db/schema";
import { isTaskOverdue } from "@/lib/permissions";

export async function listPeople() {
  return db.select().from(people);
}

export async function listProjects() {
  return db.select().from(projects).orderBy(desc(projects.updatedAt));
}

export async function listTasks() {
  return db.select().from(tasks).orderBy(desc(tasks.updatedAt));
}

export async function dashboardData(personId: string) {
  const [allTasks, allProjects, allContent, notes, activity, notices] = await Promise.all([
    db.select().from(tasks),
    db.select().from(projects),
    db.select().from(contents),
    db.select().from(notifications).where(eq(notifications.personId, personId)).orderBy(desc(notifications.createdAt)),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8),
    db.select().from(announcements).where(eq(announcements.status, "published")).orderBy(desc(announcements.createdAt)),
  ]);
  const mine = allTasks.filter((t) => t.assigneeId === personId);
  const pendingAck = mine.filter((t) => t.status === "pending_acknowledgement");
  const overdue = mine.filter((t) => isTaskOverdue(t));
  const upcoming = mine
    .filter((t) => t.officialDeadline && t.status !== "completed")
    .sort((a, b) => (a.officialDeadline?.getTime() ?? 0) - (b.officialDeadline?.getTime() ?? 0))
    .slice(0, 6);
  return {
    myTaskCount: mine.filter((t) => t.status !== "completed").length,
    pendingAck,
    overdue,
    upcoming,
    inProgress: mine.filter((t) => t.status === "in_progress"),
    activeProjects: allProjects.filter((p) => p.status === "active" || p.status === "planning"),
    contentPipeline: allContent,
    notifications: notes.slice(0, 6),
    activity,
    notices,
  };
}

export async function getProject(id: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  return project ?? null;
}

export async function getTask(id: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  return task ?? null;
}

export async function getContent(id: string) {
  const [row] = await db.select().from(contents).where(eq(contents.id, id));
  return row ?? null;
}

export async function getEquipment(id: string) {
  const [row] = await db.select().from(equipment).where(eq(equipment.id, id));
  return row ?? null;
}

export async function openLoans() {
  return db.select().from(equipmentLoans).where(eq(equipmentLoans.status, "borrowed"));
}

export async function pendingApprovals() {
  return db.select().from(approvals).where(eq(approvals.status, "pending")).orderBy(desc(approvals.createdAt));
}

export async function allApprovals() {
  return db.select().from(approvals).orderBy(desc(approvals.createdAt));
}

export async function listKpi() {
  const [periods, targets] = await Promise.all([db.select().from(kpiPeriods), db.select().from(kpiTargets)]);
  return { periods, targets };
}

export async function listFiles() {
  return db.select().from(files).orderBy(desc(files.createdAt));
}

export async function listHandovers() {
  return db.select().from(handovers).orderBy(desc(handovers.createdAt));
}

export async function listKnowledge(publishedOnly = false) {
  const rows = await db.select().from(knowledgeArticles).orderBy(desc(knowledgeArticles.updatedAt));
  if (publishedOnly) return rows.filter((r) => r.status === "published");
  return rows;
}

export async function listAnnouncements() {
  return db.select().from(announcements).where(eq(announcements.status, "published")).orderBy(desc(announcements.createdAt));
}

export async function listTime(personId?: string) {
  if (personId) return db.select().from(timeEntries).where(eq(timeEntries.personId, personId)).orderBy(desc(timeEntries.createdAt));
  return db.select().from(timeEntries).orderBy(desc(timeEntries.createdAt));
}

export async function incompleteTasksFor(personId: string) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.assigneeId, personId), ne(tasks.status, "completed")));
}
