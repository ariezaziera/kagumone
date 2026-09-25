"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  announcements,
  approvals,
  contents,
  contentQc,
  contentPublications,
  equipment,
  equipmentLoans,
  equipmentPhotos,
  files,
  handovers,
  handoverItems,
  invitations,
  knowledgeArticles,
  knowledgeVersions,
  kpiHistory,
  kpiTargets,
  people,
  personRoles,
  plannedWork,
  projectHistory,
  projectMembers,
  projectPhases,
  projects,
  reportingRelationships,
  roles,
  settings,
  taskCollaborators,
  taskCompletions,
  completionDeliverables,
  completionPeople,
  taskExtensions,
  tasks,
  timeEntries,
  employmentHistory,
} from "@/lib/db/schema";
import { getAuthContext, requirePermission, hasPermission } from "@/lib/auth/context";
import { recordActivity, recordAudit, notify } from "@/lib/services/records";
import { assertMaxThreeSuperiors, cannotDeleteSelf, deriveEquipmentStatus } from "@/lib/services/org";
import { inferSkillsFromRecentWork } from "@/lib/services/skills";
import { canTransitionTask, overdueDays, type TaskStatus } from "@/lib/permissions";
import { newId, now } from "@/lib/utils";
import { sendEmail } from "@/lib/integrations/email";
import {
  borrowSchema,
  completionSchema,
  contentSchema,
  extensionSchema,
  inviteSchema,
  plannedWorkSchema,
  projectSchema,
  taskSchema,
} from "@/lib/validation";

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function revalidateMany(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function createProject(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "task:create");
  const parsed = projectSchema.parse({
    name: form.get("name"),
    description: form.get("description") || undefined,
    objective: form.get("objective") || undefined,
    ownerId: form.get("ownerId") || ctx.person.id,
    status: form.get("status") || "planning",
    priority: form.get("priority") || "medium",
    startAt: form.get("startAt") || undefined,
    endAt: form.get("endAt") || undefined,
  });
  const id = newId();
  await db.insert(projects).values({
    id,
    name: parsed.name,
    description: parsed.description,
    objective: parsed.objective,
    ownerId: parsed.ownerId,
    status: parsed.status,
    priority: parsed.priority,
    startAt: parseDate(parsed.startAt),
    endAt: parseDate(parsed.endAt),
    createdAt: now(),
    updatedAt: now(),
  });
  await db.insert(projectMembers).values({
    id: newId(),
    projectId: id,
    personId: parsed.ownerId,
    roleLabel: "owner",
    createdAt: now(),
  });
  const defaultPhases = [
    "Planning & Discovery",
    "Information Architecture",
    "Design & Prototyping",
    "Development",
    "Testing & Go Live",
  ];
  await db.insert(projectPhases).values(
    defaultPhases.map((name, i) => ({
      id: newId(),
      projectId: id,
      name,
      sortOrder: i,
      status: i === 0 ? "active" : "planned",
    })),
  );
  await recordActivity({
    actorId: ctx.person.id,
    action: "project.created",
    entityType: "project",
    entityId: id,
    summary: `${ctx.person.fullName} created project ${parsed.name}`,
  });
  revalidateMany(["/projects", "/dashboard"]);
  return { id };
}

export async function updateProject(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "task:edit");
  const id = String(form.get("id"));
  const existing = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!existing) throw new Error("Project not found.");
  const name = String(form.get("name") || existing.name);
  const status = String(form.get("status") || existing.status);
  await db
    .update(projects)
    .set({
      name,
      description: String(form.get("description") || existing.description || ""),
      objective: String(form.get("objective") || existing.objective || ""),
      status,
      priority: String(form.get("priority") || existing.priority),
      notes: String(form.get("notes") || existing.notes || ""),
      updatedAt: now(),
    })
    .where(eq(projects.id, id));
  if (status !== existing.status) {
    await db.insert(projectHistory).values({
      id: newId(),
      projectId: id,
      actorId: ctx.person.id,
      field: "status",
      previousValue: existing.status,
      newValue: status,
      createdAt: now(),
    });
    await recordAudit({
      actorId: ctx.person.id,
      action: "project.status_changed",
      entityType: "project",
      entityId: id,
      previousValue: existing.status,
      newValue: status,
    });
  }
  await recordActivity({
    actorId: ctx.person.id,
    action: "project.updated",
    entityType: "project",
    entityId: id,
    summary: `${ctx.person.fullName} updated project ${name}`,
  });
  revalidateMany(["/projects", `/projects/${id}`]);
}

export async function addProjectMember(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "task:assign");
  const projectId = String(form.get("projectId"));
  const personId = String(form.get("personId"));
  await db.insert(projectMembers).values({
    id: newId(),
    projectId,
    personId,
    roleLabel: String(form.get("roleLabel") || "member"),
    createdAt: now(),
  });
  await notify({
    personId,
    title: "Added to project",
    body: "You were added to a project.",
    href: `/projects/${projectId}`,
    kind: "project",
  });
  await recordActivity({
    actorId: ctx.person.id,
    action: "project.member_added",
    entityType: "project",
    entityId: projectId,
    summary: `${ctx.person.fullName} added a project member`,
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function createTask(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "task:create");
  const parsed = taskSchema.parse({
    title: form.get("title"),
    description: form.get("description") || undefined,
    purpose: form.get("purpose") || undefined,
    category: form.get("category") || undefined,
    projectId: form.get("projectId") || undefined,
    assigneeId: form.get("assigneeId") || undefined,
    priority: form.get("priority") || "medium",
    officialDeadline: form.get("officialDeadline") || undefined,
    plannedStartAt: form.get("plannedStartAt") || undefined,
    plannedEndAt: form.get("plannedEndAt") || undefined,
  });
  const canAssign = hasPermission(ctx, "task:assign");
  if (!canAssign && parsed.assigneeId && parsed.assigneeId !== ctx.person.id) {
    throw new Error("You can only create tasks for yourself.");
  }
  const id = newId();
  const assigneeId = canAssign ? parsed.assigneeId || ctx.person.id : ctx.person.id;
  const assignedToOther = Boolean(canAssign && parsed.assigneeId && parsed.assigneeId !== ctx.person.id);
  await db.insert(tasks).values({
    id,
    title: parsed.title,
    description: parsed.description,
    purpose: parsed.purpose,
    category: parsed.category,
    projectId: parsed.projectId || null,
    creatorId: ctx.person.id,
    assigneeId,
    priority: parsed.priority,
    status: assignedToOther ? "pending_acknowledgement" : "draft",
    officialDeadline: parseDate(parsed.officialDeadline),
    plannedStartAt: parseDate(parsed.plannedStartAt),
    plannedEndAt: parseDate(parsed.plannedEndAt),
    assignedAt: assignedToOther || assigneeId === ctx.person.id ? now() : null,
    createdAt: now(),
    updatedAt: now(),
  });
  if (assignedToOther) {
    await notify({
      personId: assigneeId,
      title: "Task assigned",
      body: `Please acknowledge: ${parsed.title}`,
      href: `/tasks/${id}`,
      kind: "task_assigned",
    });
  }
  await recordActivity({
    actorId: ctx.person.id,
    action: "task.created",
    entityType: "task",
    entityId: id,
    summary: `${ctx.person.fullName} created task ${parsed.title}`,
  });
  revalidateMany(["/tasks", "/my-tasks", "/kanban", "/dashboard"]);
  return { id };
}

export async function acknowledgeTask(taskId: string) {
  const ctx = requirePermission(await getAuthContext(), "task:acknowledge");
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) throw new Error("Task not found.");
  if (task.assigneeId !== ctx.person.id && !hasPermission(ctx, "task:assign")) {
    throw new Error("Only the assignee can acknowledge this task.");
  }
  if (!canTransitionTask(task.status as TaskStatus, "acknowledged")) {
    throw new Error("This task cannot be acknowledged from its current status.");
  }
  await db
    .update(tasks)
    .set({ status: "acknowledged", acknowledgedAt: now(), updatedAt: now() })
    .where(eq(tasks.id, taskId));
  await recordActivity({
    actorId: ctx.person.id,
    action: "task.acknowledged",
    entityType: "task",
    entityId: taskId,
    summary: `${ctx.person.fullName} acknowledged ${task.title}`,
  });
  revalidateMany(["/tasks", `/tasks/${taskId}`, "/my-tasks", "/kanban"]);
}

export async function transitionTask(taskId: string, next: TaskStatus) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) throw new Error("Task not found.");
  if (!canTransitionTask(task.status as TaskStatus, next)) {
    throw new Error("That status transition is not allowed.");
  }
  if (next === "acknowledged") return acknowledgeTask(taskId);
  if (next === "completed") throw new Error("Use the completion record to complete a task.");
  if (next === "in_progress" || next === "submitted") {
    requirePermission(ctx, next === "submitted" ? "task:complete" : "task:edit");
  }
  await db.update(tasks).set({ status: next, updatedAt: now() }).where(eq(tasks.id, taskId));
  await recordActivity({
    actorId: ctx.person.id,
    action: "task.transitioned",
    entityType: "task",
    entityId: taskId,
    summary: `${ctx.person.fullName} moved ${task.title} to ${next}`,
  });
  revalidateMany(["/tasks", `/tasks/${taskId}`, "/kanban", "/my-tasks"]);
}

export async function completeTask(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "task:complete");
  let deliverablesRaw: unknown[] = [];
  let peopleRaw: unknown[] = [];
  try {
    deliverablesRaw = JSON.parse(String(form.get("deliverables") || "[]"));
    peopleRaw = JSON.parse(String(form.get("people") || "[]"));
  } catch {
    throw new Error("Deliverables and people involved must be valid records.");
  }
  const parsed = completionSchema.parse({
    taskId: form.get("taskId"),
    summary: form.get("summary"),
    learned: form.get("learned"),
    doDifferently: form.get("doDifferently"),
    rememberNext: form.get("rememberNext"),
    problems: form.get("problems") || "No issues encountered",
    workCompletedAt: form.get("workCompletedAt"),
    deliverables: deliverablesRaw,
    people: peopleRaw,
  });
  for (const item of parsed.deliverables) {
    if (item.url && !item.description?.trim()) {
      throw new Error("Do not store a link without a description for that deliverable.");
    }
  }
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, parsed.taskId) });
  if (!task) throw new Error("Task not found.");
  if (task.assigneeId !== ctx.person.id && !hasPermission(ctx, "task:assign")) {
    throw new Error("Only the task owner (Handled By) can submit this completion record.");
  }
  const allowed = task.status === "in_progress" || task.status === "submitted";
  if (!allowed) {
    throw new Error("Submit a completion record after the task is in progress.");
  }
  const workCompletedAt = parseDate(parsed.workCompletedAt);
  if (!workCompletedAt) throw new Error("Work Completed At is invalid.");
  const submittedAt = now();
  const daysLate = overdueDays({ officialDeadline: task.officialDeadline, workCompletedAt });
  const completionId = newId();
  await db.insert(taskCompletions).values({
    id: completionId,
    taskId: parsed.taskId,
    completedById: ctx.person.id,
    summary: parsed.summary,
    learned: parsed.learned,
    selfReflection: parsed.doDifferently,
    doDifferently: parsed.doDifferently,
    rememberNext: parsed.rememberNext,
    problems: parsed.problems || "No issues encountered",
    workCompletedAt,
    submittedAt,
    overdueDays: daysLate,
    createdAt: submittedAt,
  });
  for (const item of parsed.deliverables) {
    await db.insert(completionDeliverables).values({
      id: newId(),
      completionId,
      label: item.label || item.description.slice(0, 80),
      url: item.url || null,
      description: item.description,
      deliverableType: item.deliverableType || null,
      notes: item.notes || null,
      createdAt: submittedAt,
    });
  }
  for (const person of parsed.people ?? []) {
    if (person.roleInTask === "Task Owner") continue;
    await db.insert(completionPeople).values({
      id: newId(),
      completionId,
      personId: person.personId,
      roleInTask: person.roleInTask,
      contribution: person.contribution,
      notes: person.notes || null,
      createdAt: submittedAt,
    });
    const [already] = await db
      .select()
      .from(taskCollaborators)
      .where(and(eq(taskCollaborators.taskId, parsed.taskId), eq(taskCollaborators.personId, person.personId)));
    if (!already) {
      await db.insert(taskCollaborators).values({
        id: newId(),
        taskId: parsed.taskId,
        personId: person.personId,
        roleInTask: person.roleInTask,
        contribution: person.contribution,
        notes: person.notes || null,
        createdAt: submittedAt,
      });
    }
  }
  await db
    .update(tasks)
    .set({ status: "submitted", updatedAt: submittedAt })
    .where(eq(tasks.id, parsed.taskId));
  await recordActivity({
    actorId: ctx.person.id,
    action: "task.completion_submitted",
    entityType: "task",
    entityId: parsed.taskId,
    summary: `${ctx.person.fullName} submitted a completion record for ${task.title} (${daysLate} days overdue). Owner unchanged: ${task.assigneeId}.`,
  });
  const collaboratorIds = (parsed.people ?? []).map((p) => p.personId);
  await inferSkillsFromRecentWork([ctx.person.id, task.assigneeId ?? "", ...collaboratorIds]);
  revalidateMany(["/tasks", `/tasks/${parsed.taskId}`, "/my-tasks", "/kanban", "/dashboard", "/skills", "/profile"]);
}

export async function addCollaborator(form: FormData) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const taskId = String(form.get("taskId"));
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) throw new Error("Task not found.");
  if (task.assigneeId !== ctx.person.id && !hasPermission(ctx, "task:assign")) {
    throw new Error("You are not authorized to add people to this task.");
  }
  const personId = String(form.get("personId"));
  const roleInTask = String(form.get("roleInTask") || "Contributor");
  if (roleInTask === "Task Owner") {
    throw new Error("Task ownership is not transferred by adding a collaborator.");
  }
  await db.insert(taskCollaborators).values({
    id: newId(),
    taskId,
    personId,
    roleInTask,
    contribution: String(form.get("contribution") || ""),
    notes: String(form.get("notes") || ""),
    createdAt: now(),
  });
  await recordActivity({
    actorId: ctx.person.id,
    action: "task.collaborator_added",
    entityType: "task",
    entityId: taskId,
    summary: `${ctx.person.fullName} recorded collaboration on the task. Handled By was not changed.`,
  });
  revalidatePath(`/tasks/${taskId}`);
}

export async function requestExtension(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "task:request_extension");
  const parsed = extensionSchema.parse({
    taskId: form.get("taskId"),
    requestedDeadline: form.get("requestedDeadline"),
    reason: form.get("reason"),
  });
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, parsed.taskId) });
  if (!task?.officialDeadline) throw new Error("Task has no official deadline.");
  const requested = parseDate(parsed.requestedDeadline);
  if (!requested) throw new Error("Requested deadline is invalid.");
  const extId = newId();
  await db.insert(taskExtensions).values({
    id: extId,
    taskId: parsed.taskId,
    requesterId: ctx.person.id,
    originalDeadline: task.officialDeadline,
    requestedDeadline: requested,
    reason: parsed.reason,
    status: "pending",
    createdAt: now(),
  });
  const approvalId = newId();
  await db.insert(approvals).values({
    id: approvalId,
    type: "task_extension",
    relatedType: "task_extension",
    relatedId: extId,
    requesterId: ctx.person.id,
    status: "pending",
    createdAt: now(),
  });
  for (const superior of ctx.superiorIds) {
    await notify({
      personId: superior,
      title: "Extension request",
      body: `${ctx.person.fullName} requested a deadline extension for ${task.title}`,
      href: "/approvals",
      kind: "extension_request",
    });
  }
  await recordActivity({
    actorId: ctx.person.id,
    action: "task.extension_requested",
    entityType: "task",
    entityId: parsed.taskId,
    summary: `${ctx.person.fullName} requested an extension for ${task.title}`,
  });
  revalidateMany(["/tasks", `/tasks/${parsed.taskId}`, "/approvals"]);
}

export async function decideExtension(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "task:approve_extension");
  const extensionId = String(form.get("extensionId"));
  const decision = String(form.get("decision"));
  const comment = String(form.get("comment") || "");
  const ext = await db.query.taskExtensions.findFirst({ where: eq(taskExtensions.id, extensionId) });
  if (!ext) throw new Error("Extension request not found.");
  if (ext.status !== "pending") throw new Error("This request is already decided.");
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, ext.taskId) });
  await db
    .update(taskExtensions)
    .set({
      status: decision,
      reviewerId: ctx.person.id,
      decisionComment: comment,
      decidedAt: now(),
    })
    .where(eq(taskExtensions.id, extensionId));
  if (decision === "approved" && task) {
    await db
      .update(tasks)
      .set({ officialDeadline: ext.requestedDeadline, updatedAt: now() })
      .where(eq(tasks.id, task.id));
    await recordAudit({
      actorId: ctx.person.id,
      action: "task.deadline_changed",
      entityType: "task",
      entityId: task.id,
      previousValue: ext.originalDeadline,
      newValue: ext.requestedDeadline,
    });
  }
  await db
    .update(approvals)
    .set({
      status: decision,
      decision,
      comment,
      reviewerId: ctx.person.id,
      decidedAt: now(),
    })
    .where(and(eq(approvals.relatedId, extensionId), eq(approvals.type, "task_extension")));
  await notify({
    personId: ext.requesterId,
    title: `Extension ${decision}`,
    body: comment || `Your extension request was ${decision}.`,
    href: `/tasks/${ext.taskId}`,
    kind: "extension_decision",
  });
  revalidateMany(["/approvals", "/tasks", `/tasks/${ext.taskId}`]);
}

export async function createContent(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "content:create");
  const parsed = contentSchema.parse({
    title: form.get("title"),
    pillar: form.get("pillar") || undefined,
    platform: form.get("platform") || undefined,
    contentType: form.get("contentType") || undefined,
    projectId: form.get("projectId") || undefined,
    caption: form.get("caption") || undefined,
    brief: form.get("brief") || undefined,
    concept: form.get("concept") || undefined,
  });
  const id = newId();
  await db.insert(contents).values({
    id,
    title: parsed.title,
    pillar: parsed.pillar,
    platform: parsed.platform,
    contentType: parsed.contentType,
    projectId: parsed.projectId || null,
    ownerId: ctx.person.id,
    creatorId: ctx.person.id,
    stage: "planned",
    caption: parsed.caption,
    brief: parsed.brief,
    concept: parsed.concept,
    createdAt: now(),
    updatedAt: now(),
  });
  await recordActivity({
    actorId: ctx.person.id,
    action: "content.created",
    entityType: "content",
    entityId: id,
    summary: `${ctx.person.fullName} created content ${parsed.title}`,
  });
  await inferSkillsFromRecentWork([ctx.person.id]);
  revalidateMany(["/content", "/dashboard", "/skills", "/profile"]);
  return { id };
}

export async function moveContentStage(contentId: string, stage: string) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const permMap: Record<string, Parameters<typeof requirePermission>[1]> = {
    self_qc: "content:self_qc",
    qc1: "content:qc1",
    qc2: "content:qc2",
    final_approval: "content:approve",
    published: "content:publish",
    ready_to_post: "content:approve",
  };
  if (permMap[stage]) requirePermission(ctx, permMap[stage]);
  else requirePermission(ctx, "content:edit");
  const existing = await db.query.contents.findFirst({ where: eq(contents.id, contentId) });
  if (!existing) throw new Error("Content not found.");
  await db.update(contents).set({ stage, updatedAt: now() }).where(eq(contents.id, contentId));
  if (["self_qc", "qc1", "qc2"].includes(stage)) {
    await db.insert(contentQc).values({
      id: newId(),
      contentId,
      stage,
      reviewerId: ctx.person.id,
      status: "pending",
      createdAt: now(),
    });
  }
  if (stage === "published") {
    await db
      .update(contents)
      .set({ actualPublishAt: now(), updatedAt: now() })
      .where(eq(contents.id, contentId));
  }
  await recordActivity({
    actorId: ctx.person.id,
    action: "content.stage",
    entityType: "content",
    entityId: contentId,
    summary: `${ctx.person.fullName} moved content to ${stage}`,
  });
  await inferSkillsFromRecentWork([ctx.person.id, existing.ownerId ?? "", existing.creatorId ?? ""]);
  revalidateMany(["/content", `/content/${contentId}`, "/publishing", "/skills", "/profile"]);
}

export async function submitQc(form: FormData) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const contentId = String(form.get("contentId"));
  const stage = String(form.get("stage"));
  const status = String(form.get("status"));
  const comments = String(form.get("comments") || "");
  await db.insert(contentQc).values({
    id: newId(),
    contentId,
    stage,
    reviewerId: ctx.person.id,
    checklist: String(form.get("checklist") || ""),
    comments,
    status,
    createdAt: now(),
  });
  if (status === "corrections") {
    await db.update(contents).set({
      stage: stage === "qc2" ? "corrections_qc2" : "corrections_qc1",
      updatedAt: now(),
    }).where(eq(contents.id, contentId));
  }
  await recordActivity({
    actorId: ctx.person.id,
    action: "content.qc",
    entityType: "content",
    entityId: contentId,
    summary: `${ctx.person.fullName} recorded QC (${status})`,
  });
  await inferSkillsFromRecentWork([ctx.person.id]);
  revalidatePath(`/content/${contentId}/qc`);
  revalidatePath("/skills");
}

export async function publishContent(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "content:publish");
  const contentId = String(form.get("contentId"));
  await db.insert(contentPublications).values({
    id: newId(),
    contentId,
    platform: String(form.get("platform") || "instagram"),
    caption: String(form.get("caption") || ""),
    publishedAt: now(),
    url: String(form.get("url") || ""),
    status: "published",
  });
  await db
    .update(contents)
    .set({
      stage: "published",
      actualPublishAt: now(),
      publishedUrl: String(form.get("url") || ""),
      updatedAt: now(),
    })
    .where(eq(contents.id, contentId));
  await recordActivity({
    actorId: ctx.person.id,
    action: "content.published",
    entityType: "content",
    entityId: contentId,
    summary: `${ctx.person.fullName} recorded publication`,
  });
  revalidateMany(["/publishing", "/content", `/content/${contentId}`]);
}

export async function registerEquipment(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "equipment:register");
  const id = newId();
  await db.insert(equipment).values({
    id,
    name: String(form.get("name")),
    assetCode: String(form.get("assetCode")),
    serialNumber: String(form.get("serialNumber") || ""),
    category: String(form.get("category") || "general"),
    location: String(form.get("location") || ""),
    condition: "good",
    statusHint: "available",
    createdAt: now(),
    updatedAt: now(),
  });
  await recordActivity({
    actorId: ctx.person.id,
    action: "equipment.registered",
    entityType: "equipment",
    entityId: id,
    summary: `${ctx.person.fullName} registered equipment`,
  });
  revalidatePath("/equipment");
}

export async function borrowEquipment(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "equipment:borrow");
  const parsed = borrowSchema.parse({
    equipmentId: form.get("equipmentId"),
    purpose: form.get("purpose"),
    expectedReturnAt: form.get("expectedReturnAt"),
    projectId: form.get("projectId") || undefined,
    taskId: form.get("taskId") || undefined,
    beforePhotoCount: Number(form.get("beforePhotoCount") || 0),
  });
  if (parsed.beforePhotoCount < 2) {
    throw new Error("Borrowing requires at least 2 before photos.");
  }
  const item = await db.query.equipment.findFirst({ where: eq(equipment.id, parsed.equipmentId) });
  if (!item) throw new Error("Equipment not found.");
  const open = await db.query.equipmentLoans.findFirst({
    where: and(eq(equipmentLoans.equipmentId, parsed.equipmentId), eq(equipmentLoans.status, "borrowed")),
  });
  if (open) throw new Error("Equipment is already borrowed.");
  const loanId = newId();
  await db.insert(equipmentLoans).values({
    id: loanId,
    equipmentId: parsed.equipmentId,
    borrowerId: ctx.person.id,
    purpose: parsed.purpose,
    projectId: parsed.projectId || null,
    taskId: parsed.taskId || null,
    expectedReturnAt: parseDate(parsed.expectedReturnAt)!,
    status: "borrowed",
    createdAt: now(),
  });
  for (let i = 0; i < parsed.beforePhotoCount; i++) {
    await db.insert(equipmentPhotos).values({
      id: newId(),
      loanId,
      kind: "before",
      createdAt: now(),
    });
  }
  await db.update(equipment).set({ statusHint: "borrowed", updatedAt: now() }).where(eq(equipment.id, parsed.equipmentId));
  await recordActivity({
    actorId: ctx.person.id,
    action: "equipment.borrowed",
    entityType: "equipment",
    entityId: parsed.equipmentId,
    summary: `${ctx.person.fullName} borrowed ${item.name}`,
  });
  revalidateMany(["/equipment", `/equipment/${parsed.equipmentId}`]);
}

export async function returnEquipment(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "equipment:return");
  const loanId = String(form.get("loanId"));
  const afterPhotoCount = Number(form.get("afterPhotoCount") || 0);
  if (afterPhotoCount < 2) throw new Error("Return requires at least 2 after photos.");
  const loan = await db.query.equipmentLoans.findFirst({ where: eq(equipmentLoans.id, loanId) });
  if (!loan || loan.status !== "borrowed") throw new Error("No open loan.");
  await db
    .update(equipmentLoans)
    .set({
      status: "returned",
      actualReturnAt: now(),
      returnCondition: String(form.get("condition") || "good"),
      receivingPersonId: ctx.person.id,
      notes: String(form.get("notes") || loan.notes || ""),
    })
    .where(eq(equipmentLoans.id, loanId));
  for (let i = 0; i < afterPhotoCount; i++) {
    await db.insert(equipmentPhotos).values({ id: newId(), loanId, kind: "after", createdAt: now() });
  }
  await db
    .update(equipment)
    .set({ statusHint: "available", condition: String(form.get("condition") || "good"), updatedAt: now() })
    .where(eq(equipment.id, loan.equipmentId));
  await recordActivity({
    actorId: ctx.person.id,
    action: "equipment.returned",
    entityType: "equipment",
    entityId: loan.equipmentId,
    summary: `${ctx.person.fullName} returned equipment`,
  });
  revalidateMany(["/equipment", `/equipment/${loan.equipmentId}`]);
}

export async function forceReturnEquipment(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "equipment:force_return");
  const loanId = String(form.get("loanId"));
  const reason = String(form.get("reason") || "");
  if (!reason) throw new Error("Force return requires a reason.");
  const loan = await db.query.equipmentLoans.findFirst({ where: eq(equipmentLoans.id, loanId) });
  if (!loan) throw new Error("Loan not found.");
  await db
    .update(equipmentLoans)
    .set({
      status: "returned",
      actualReturnAt: now(),
      forceReturned: true,
      forceReturnReason: reason,
      forceReturnedById: ctx.person.id,
    })
    .where(eq(equipmentLoans.id, loanId));
  await db.update(equipment).set({ statusHint: "available", updatedAt: now() }).where(eq(equipment.id, loan.equipmentId));
  await recordAudit({
    actorId: ctx.person.id,
    action: "equipment.force_return",
    entityType: "equipment_loan",
    entityId: loanId,
    previousValue: { borrowerId: loan.borrowerId, status: loan.status },
    newValue: { forceReturned: true, reason },
  });
  await notify({
    personId: loan.borrowerId,
    title: "Equipment force-returned",
    body: reason,
    href: `/equipment/${loan.equipmentId}`,
    kind: "equipment",
  });
  revalidatePath("/equipment");
}

export async function upsertKpiTarget(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "kpi:edit");
  const personId = String(form.get("personId"));
  if (personId === ctx.person.id && !hasPermission(ctx, "kpi:create")) {
    throw new Error("Staff and interns cannot set their own KPI. An executive or manager must set it.");
  }
  const periodId = String(form.get("periodId"));
  const targetValue = Number(form.get("targetValue"));
  const existing = await db.query.kpiTargets.findFirst({
    where: and(eq(kpiTargets.personId, personId), eq(kpiTargets.periodId, periodId), eq(kpiTargets.category, String(form.get("category") || "content"))),
  });
  if (existing) {
    await db.insert(kpiHistory).values({
      id: newId(),
      targetId: existing.id,
      previousValue: existing.targetValue,
      newValue: targetValue,
      changedById: ctx.person.id,
      reason: String(form.get("reason") || "Updated target"),
      createdAt: now(),
    });
    await db.update(kpiTargets).set({ targetValue, updatedAt: now() }).where(eq(kpiTargets.id, existing.id));
    await notify({
      personId,
      title: "KPI updated",
      body: "Your KPI target was changed.",
      href: "/kpi",
      kind: "kpi_changed",
    });
    await recordAudit({
      actorId: ctx.person.id,
      action: "kpi.target_changed",
      entityType: "kpi_target",
      entityId: existing.id,
      previousValue: existing.targetValue,
      newValue: targetValue,
    });
  } else {
    requirePermission(ctx, "kpi:create");
    await db.insert(kpiTargets).values({
      id: newId(),
      personId,
      periodId,
      category: String(form.get("category") || "content"),
      targetValue,
      unit: "count",
      createdById: ctx.person.id,
      createdAt: now(),
      updatedAt: now(),
    });
  }
  revalidatePath("/kpi");
}

export async function inviteUser(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "user:invite");
  const parsed = inviteSchema.parse({
    email: form.get("email"),
    fullName: form.get("fullName"),
    roleKey: form.get("roleKey"),
  });
  const personId = newId();
  await db.insert(people).values({
    id: personId,
    fullName: parsed.fullName,
    email: parsed.email,
    employmentType: "staff",
    organizationalStatus: "invited",
    isDemo: false,
    createdAt: now(),
    updatedAt: now(),
  });
  const role = await db.query.roles.findFirst({ where: eq(roles.key, parsed.roleKey) });
  if (role) {
    await db.insert(personRoles).values({ id: newId(), personId, roleId: role.id, createdAt: now() });
  }
  const token = newId();
  await db.insert(invitations).values({
    id: newId(),
    email: parsed.email,
    personId,
    invitedById: ctx.person.id,
    token,
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: now(),
  });
  const url = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/activate?token=${token}`;
  await sendEmail({
    to: parsed.email,
    subject: "Activate your KAGUM ONE account",
    text: `You were invited to KAGUM ONE. Activate: ${url}`,
  });
  await recordAudit({
    actorId: ctx.person.id,
    action: "user.invited",
    entityType: "person",
    entityId: personId,
    newValue: parsed.email,
  });
  revalidatePath("/admin");
}

export async function setReporting(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "team:edit");
  const personId = String(form.get("personId"));
  const superiorId = String(form.get("superiorId"));
  await assertMaxThreeSuperiors(personId, superiorId);
  await db.insert(reportingRelationships).values({
    id: newId(),
    personId,
    superiorId,
    status: "active",
    startedAt: now(),
    createdAt: now(),
  });
  await recordAudit({
    actorId: ctx.person.id,
    action: "reporting.changed",
    entityType: "person",
    entityId: personId,
    newValue: { superiorId },
  });
  revalidatePath("/team");
}

export async function setLastWorkingDay(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "team:edit");
  const personId = String(form.get("personId"));
  cannotDeleteSelf(ctx.person.id, personId);
  const day = parseDate(String(form.get("lastWorkingDay")));
  await db.update(people).set({ lastWorkingDay: day, updatedAt: now() }).where(eq(people.id, personId));
  await db.insert(employmentHistory).values({
    id: newId(),
    personId,
    status: "active",
    lastWorkingDay: day,
    changedById: ctx.person.id,
    reason: String(form.get("reason") || "Last working day updated"),
    createdAt: now(),
  });
  await recordAudit({
    actorId: ctx.person.id,
    action: "employment.last_working_day",
    entityType: "person",
    entityId: personId,
    newValue: day,
  });
  revalidatePath(`/team/${personId}`);
}

export async function deactivatePerson(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "team:delete");
  const personId = String(form.get("personId"));
  cannotDeleteSelf(ctx.person.id, personId);
  await db
    .update(people)
    .set({ organizationalStatus: "inactive", updatedAt: now() })
    .where(eq(people.id, personId));
  await db.insert(employmentHistory).values({
    id: newId(),
    personId,
    status: "inactive",
    changedById: ctx.person.id,
    reason: String(form.get("reason") || "Deactivated"),
    createdAt: now(),
  });
  await recordAudit({
    actorId: ctx.person.id,
    action: "person.deactivated",
    entityType: "person",
    entityId: personId,
  });
  revalidatePath("/team");
}

export async function logTime(form: FormData) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  await db.insert(timeEntries).values({
    id: newId(),
    personId: ctx.person.id,
    taskId: String(form.get("taskId") || "") || null,
    projectId: String(form.get("projectId") || "") || null,
    workDate: String(form.get("workDate")),
    plannedMinutes: Number(form.get("plannedMinutes") || 0),
    actualMinutes: Number(form.get("actualMinutes") || 0),
    notes: String(form.get("notes") || ""),
    createdAt: now(),
  });
  revalidatePath("/time-tracking");
}

export async function createHandover(form: FormData) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const id = newId();
  await db.insert(handovers).values({
    id,
    outgoingPersonId: String(form.get("outgoingPersonId")),
    incomingPersonId: String(form.get("incomingPersonId") || "") || null,
    status: "active",
    notes: String(form.get("notes") || ""),
    createdAt: now(),
    updatedAt: now(),
  });
  const outstanding = await db.query.tasks.findMany({
    where: eq(tasks.assigneeId, String(form.get("outgoingPersonId"))),
  });
  for (const t of outstanding.filter((x) => x.status !== "completed")) {
    await db.insert(handoverItems).values({
      id: newId(),
      handoverId: id,
      kind: "task",
      relatedType: "task",
      relatedId: t.id,
      summary: `Outstanding: ${t.title} (${t.status})`,
    });
  }
  await recordActivity({
    actorId: ctx.person.id,
    action: "handover.created",
    entityType: "handover",
    entityId: id,
    summary: `${ctx.person.fullName} started a handover`,
  });
  revalidatePath("/handover");
}

export async function saveKnowledge(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "knowledge:manage");
  const id = String(form.get("id") || newId());
  const body = String(form.get("body"));
  const existing = await db.query.knowledgeArticles.findFirst({ where: eq(knowledgeArticles.id, id) });
  if (existing) {
    await db.update(knowledgeArticles).set({
      title: String(form.get("title")),
      category: String(form.get("category")),
      body,
      updatedAt: now(),
    }).where(eq(knowledgeArticles.id, id));
    await db.insert(knowledgeVersions).values({
      id: newId(),
      articleId: id,
      body,
      version: Date.now(),
      createdAt: now(),
    });
  } else {
    await db.insert(knowledgeArticles).values({
      id,
      title: String(form.get("title")),
      category: String(form.get("category")),
      body,
      ownerId: ctx.person.id,
      status: "published",
      createdAt: now(),
      updatedAt: now(),
    });
  }
  revalidatePath("/knowledge");
}

export async function createAnnouncement(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "announcement:create");
  const id = newId();
  const kind = String(form.get("kind") || "announcement");
  await db.insert(announcements).values({
    id,
    title: String(form.get("title")),
    body: String(form.get("body")),
    kind,
    requiresParticipation: form.get("requiresParticipation") === "on" || kind === "participation",
    relatedType: String(form.get("relatedType") || "") || null,
    relatedId: String(form.get("relatedId") || "") || null,
    createdById: ctx.person.id,
    startsAt: parseDate(String(form.get("startsAt") || "")) ?? now(),
    endsAt: parseDate(String(form.get("endsAt") || "")),
    status: "published",
    createdAt: now(),
  });
  await recordActivity({
    actorId: ctx.person.id,
    action: "announcement.published",
    entityType: "announcement",
    entityId: id,
    summary: `${ctx.person.fullName} posted a ${kind.replaceAll("_", " ")}`,
  });
  revalidateMany(["/dashboard", "/notices"]);
}

export async function markNotificationsRead() {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const { notifications } = await import("@/lib/db/schema");
  await db.update(notifications).set({ readAt: now() }).where(and(eq(notifications.personId, ctx.person.id), isNull(notifications.readAt)));
  revalidatePath("/notifications");
}

export async function saveSetting(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "administration:manage");
  const key = String(form.get("key"));
  const value = String(form.get("value"));
  const existing = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  if (existing) {
    await db.update(settings).set({ value, updatedAt: now() }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ id: newId(), key, value, updatedAt: now() });
  }
  await recordAudit({
    actorId: ctx.person.id,
    action: "settings.updated",
    entityType: "setting",
    entityId: key,
    newValue: value,
  });
  revalidatePath("/admin");
}

export async function logPlannedWork(form: FormData) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const parsed = plannedWorkSchema.parse({
    date: form.get("date"),
    startTime: form.get("startTime"),
    endTime: form.get("endTime"),
    title: form.get("title"),
    projectId: form.get("projectId") || undefined,
    taskId: form.get("taskId") || undefined,
    contentId: form.get("contentId") || undefined,
    workType: form.get("workType") || "Planned Task Work",
    notes: form.get("notes") || undefined,
  });
  const startAt = parseDate(`${parsed.date}T${parsed.startTime}`);
  const endAt = parseDate(`${parsed.date}T${parsed.endTime}`);
  if (!startAt || !endAt) throw new Error("Planned start and end times are required.");
  if (endAt <= startAt) throw new Error("Planned end must be after start.");
  await db.insert(plannedWork).values({
    id: newId(),
    personId: ctx.person.id,
    title: parsed.title,
    workType: parsed.workType,
    taskId: parsed.taskId || null,
    projectId: parsed.projectId || null,
    contentId: parsed.contentId || null,
    startAt,
    endAt,
    notes: parsed.notes || "",
    createdAt: now(),
  });
  revalidatePath("/calendar");
}

export async function updatePlannedWork(form: FormData) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const id = String(form.get("id"));
  const existing = await db.query.plannedWork.findFirst({ where: eq(plannedWork.id, id) });
  if (!existing) throw new Error("Planned work not found.");
  if (existing.personId !== ctx.person.id) {
    throw new Error("You can only reschedule your own planned work.");
  }
  const parsed = plannedWorkSchema.parse({
    date: form.get("date"),
    startTime: form.get("startTime"),
    endTime: form.get("endTime"),
    title: form.get("title") || existing.title || "Planned work",
    projectId: form.get("projectId") || existing.projectId || undefined,
    taskId: form.get("taskId") || existing.taskId || undefined,
    contentId: form.get("contentId") || existing.contentId || undefined,
    workType: form.get("workType") || existing.workType,
    notes: form.get("notes") || existing.notes || undefined,
  });
  const startAt = parseDate(`${parsed.date}T${parsed.startTime}`);
  const endAt = parseDate(`${parsed.date}T${parsed.endTime}`);
  if (!startAt || !endAt) throw new Error("Planned start and end times are required.");
  await db
    .update(plannedWork)
    .set({
      startAt,
      endAt,
      title: parsed.title,
      workType: parsed.workType,
      notes: parsed.notes || existing.notes,
    })
    .where(eq(plannedWork.id, id));
  revalidatePath("/calendar");
}

export async function recordFileMeta(input: {
  filename: string;
  mimeType?: string;
  storageKey: string;
  relatedType?: string;
  relatedId?: string;
  category?: string;
}) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const id = newId();
  await db.insert(files).values({
    id,
    filename: input.filename,
    mimeType: input.mimeType,
    storageKey: input.storageKey,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
    category: input.category,
    uploaderId: ctx.person.id,
    version: 1,
    createdAt: now(),
  });
  revalidatePath("/files");
  return { id };
}

export { deriveEquipmentStatus };
