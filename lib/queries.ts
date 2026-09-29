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
  projectMembers,
  projects,
  taskCollaborators,
  tasks,
  timeEntries,
} from "@/lib/db/schema";
import { isTaskOverdue } from "@/lib/permissions";
import { demoPersonIds, hideDemoWorkspace, isSeedEquipment, onlyDemoPeople } from "@/lib/services/demo-scope";

async function demoGate() {
  if (!(await hideDemoWorkspace())) return null;
  return demoPersonIds();
}

export async function listPeople() {
  const rows = await db.select().from(people);
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((person) => !person.isDemo);
}

export async function listProjects() {
  const rows = await db.select().from(projects).orderBy(desc(projects.updatedAt));
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  const members = await db.select().from(projectMembers);
  return rows.filter((project) => {
    const memberIds = members.filter((member) => member.projectId === project.id).map((member) => member.personId);
    return !onlyDemoPeople([project.ownerId, ...memberIds], demoIds);
  });
}

export async function listTasks() {
  const rows = await db.select().from(tasks).orderBy(desc(tasks.updatedAt));
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  const collaborators = await db.select().from(taskCollaborators);
  return rows.filter((task) => {
    const extra = collaborators.filter((row) => row.taskId === task.id).map((row) => row.personId);
    return !onlyDemoPeople([task.creatorId, task.assigneeId, ...extra], demoIds);
  });
}

export async function listContents() {
  const rows = await db.select().from(contents).orderBy(desc(contents.updatedAt));
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !onlyDemoPeople([row.ownerId, row.creatorId], demoIds));
}

export async function dashboardData(personId: string) {
  const [allTasks, allProjects, allContent, notes, activity, notices] = await Promise.all([
    listTasks(),
    listProjects(),
    listContents(),
    db.select().from(notifications).where(eq(notifications.personId, personId)).orderBy(desc(notifications.createdAt)),
    listActivity(8),
    listAnnouncements(),
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
  if (!project) return null;
  const visible = await listProjects();
  return visible.some((row) => row.id === project.id) ? project : null;
}

export async function getTask(id: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) return null;
  const visible = await listTasks();
  return visible.some((row) => row.id === task.id) ? task : null;
}

export async function getContent(id: string) {
  const [row] = await db.select().from(contents).where(eq(contents.id, id));
  if (!row) return null;
  const visible = await listContents();
  return visible.some((item) => item.id === row.id) ? row : null;
}

export async function getEquipment(id: string) {
  const [row] = await db.select().from(equipment).where(eq(equipment.id, id));
  if (!row) return null;
  const visible = await listEquipment();
  return visible.some((item) => item.id === row.id) ? row : null;
}

export async function listEquipment() {
  const rows = await db.select().from(equipment);
  if (!(await hideDemoWorkspace())) return rows;
  return rows.filter((row) => !isSeedEquipment(row));
}

export async function listActivity(limit = 100) {
  const rows = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !row.actorId || !demoIds.has(row.actorId));
}

export async function listAudit(limit = 50) {
  const { auditLogs } = await import("@/lib/db/schema");
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !row.actorId || !demoIds.has(row.actorId));
}

export async function openLoans() {
  const rows = await db.select().from(equipmentLoans).where(eq(equipmentLoans.status, "borrowed"));
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !demoIds.has(row.borrowerId));
}

export async function pendingApprovals() {
  const rows = await db.select().from(approvals).where(eq(approvals.status, "pending")).orderBy(desc(approvals.createdAt));
  return filterApprovals(rows);
}

export async function allApprovals() {
  const rows = await db.select().from(approvals).orderBy(desc(approvals.createdAt));
  return filterApprovals(rows);
}

async function filterApprovals<T extends { requesterId: string; reviewerId: string | null }>(rows: T[]) {
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !onlyDemoPeople([row.requesterId, row.reviewerId], demoIds));
}

export async function listKpi() {
  const [periods, targets] = await Promise.all([db.select().from(kpiPeriods), db.select().from(kpiTargets)]);
  const demoIds = await demoGate();
  if (!demoIds) return { periods, targets };
  const visibleTargets = targets.filter((target) => !demoIds.has(target.personId));
  const periodIds = new Set(visibleTargets.map((target) => target.periodId));
  return { periods: periods.filter((period) => periodIds.has(period.id)), targets: visibleTargets };
}

export async function listFiles() {
  const rows = await db.select().from(files).orderBy(desc(files.createdAt));
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !row.uploaderId || !demoIds.has(row.uploaderId));
}

export async function listHandovers() {
  const rows = await db.select().from(handovers).orderBy(desc(handovers.createdAt));
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !onlyDemoPeople([row.outgoingPersonId, row.incomingPersonId], demoIds));
}

export async function listKnowledge(publishedOnly = false) {
  const rows = await db.select().from(knowledgeArticles).orderBy(desc(knowledgeArticles.updatedAt));
  const published = publishedOnly ? rows.filter((row) => row.status === "published") : rows;
  const demoIds = await demoGate();
  if (!demoIds) return published;
  return published.filter((row) => !row.ownerId || !demoIds.has(row.ownerId));
}

export async function listAnnouncements() {
  const rows = await db.select().from(announcements).where(eq(announcements.status, "published")).orderBy(desc(announcements.createdAt));
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !row.createdById || !demoIds.has(row.createdById));
}

export async function listTime(personId?: string) {
  const rows = personId
    ? await db.select().from(timeEntries).where(eq(timeEntries.personId, personId)).orderBy(desc(timeEntries.createdAt))
    : await db.select().from(timeEntries).orderBy(desc(timeEntries.createdAt));
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !demoIds.has(row.personId));
}

export async function keepUnlessDemoOwned<T>(rows: T[], personIds: (row: T) => Array<string | null | undefined>) {
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !onlyDemoPeople(personIds(row), demoIds));
}

export async function incompleteTasksFor(personId: string) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.assigneeId, personId), ne(tasks.status, "completed")));
}
