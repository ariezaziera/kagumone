import { and, count, desc, eq, isNull, ne } from "drizzle-orm";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db";
import {
  activityLogs,
  announcements,
  approvals,
  chatConversations,
  chatMessages,
  chatParticipants,
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
import { unreadChatCount } from "@/lib/services/chats";
import { formatDateTime } from "@/lib/utils";
import { demoPersonIds, hideDemoWorkspace, isSeedEquipment, onlyDemoPeople } from "@/lib/services/demo-scope";

async function demoGate() {
  if (!(await hideDemoWorkspace())) return null;
  return demoPersonIds();
}

export function isDirectoryPerson(person: { organizationalStatus: string }) {
  return person.organizationalStatus !== "deleted";
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

function sameKualaLumpurDay(value: Date | string | null | undefined, now = new Date()) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
  return fmt.format(date) === fmt.format(now);
}

export async function navAttention(personId: string, canDecideApprovals: boolean) {
  const [tasks, loans, approvals, chats] = await Promise.all([
    listTasks(),
    openLoans(),
    canDecideApprovals ? pendingApprovals() : Promise.resolve([]),
    unreadChatCount(),
  ]);
  const mine = tasks.filter((task) => task.assigneeId === personId && task.status !== "completed");
  const waiting = mine.filter((task) => task.status === "pending_acknowledgement" || isTaskOverdue(task));
  const dueToday = mine.filter((task) => sameKualaLumpurDay(task.officialDeadline));
  const overdueLoans = loans.filter(
    (loan) => loan.borrowerId === personId && loan.expectedReturnAt != null && loan.expectedReturnAt.getTime() < Date.now(),
  );
  return {
    "/my-tasks": waiting.length,
    "/calendar": dueToday.length,
    "/chats": chats,
    "/approvals": approvals.length,
    "/equipment": overdueLoans.length,
  };
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

function isChatFile(row: { relatedType: string | null; category: string | null }) {
  return row.relatedType === "chat" || row.category === "chat";
}

export async function listFiles() {
  const rows = (await db.select().from(files).orderBy(desc(files.createdAt))).filter((row) => !isChatFile(row));
  const demoIds = await demoGate();
  if (!demoIds) return rows;
  return rows.filter((row) => !row.uploaderId || !demoIds.has(row.uploaderId));
}

export async function readableFile(id: string) {
  const ctx = await getAuthContext();
  if (!ctx || ctx.person.organizationalStatus === "deleted") return null;
  const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!file) return null;
  const demoIds = await demoGate();
  if (demoIds && file.uploaderId && demoIds.has(file.uploaderId)) return null;
  if (!isChatFile(file)) return file;
  if (!file.relatedId) return null;
  const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, file.relatedId)).limit(1);
  if (!message || message.deletedAt) return null;
  const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, message.conversationId)).limit(1);
  if (!conversation || conversation.deletedAt) return null;
  const members = await db.select().from(chatParticipants).where(eq(chatParticipants.conversationId, conversation.id));
  const mine = members.find((member) => member.personId === ctx.person.id) ?? null;
  if (conversation.kind === "direct") {
    if (!mine) return null;
    const otherId = members.find((member) => member.personId !== ctx.person.id)?.personId;
    if (demoIds && otherId && demoIds.has(otherId)) return null;
    return file;
  }
  if (conversation.kind === "group") {
    if (!mine || mine.leftAt) return null;
    return file;
  }
  if (conversation.kind === "team") return file;
  return null;
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

export type NotificationPreview = {
  unread: number;
  items: { id: string; title: string; body: string; href: string; unread: boolean; timeLabel: string }[];
};

export async function notificationPreview(personId: string): Promise<NotificationPreview> {
  const [countRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.personId, personId), isNull(notifications.readAt))),
    db.select().from(notifications).where(eq(notifications.personId, personId)).orderBy(desc(notifications.createdAt)).limit(5),
  ]);
  return {
    unread: Number(countRow[0]?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body.length > 160 ? `${row.body.slice(0, 157)}...` : row.body,
      href: row.href && row.href !== "#" ? row.href : "/notifications",
      unread: !row.readAt,
      timeLabel: formatDateTime(row.createdAt),
    })),
  };
}

export async function incompleteTasksFor(personId: string) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.assigneeId, personId), ne(tasks.status, "completed")));
}
