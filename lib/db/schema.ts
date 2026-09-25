import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = (name = "id") => text(name).primaryKey();
const ts = (name: string) => integer(name, { mode: "timestamp_ms" }).notNull();
const tsNull = (name: string) => integer(name, { mode: "timestamp_ms" });

export const user = sqliteTable("user", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const session = sqliteTable("session", {
  id: id(),
  expiresAt: ts("expires_at"),
  token: text("token").notNull().unique(),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: id(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: tsNull("access_token_expires_at"),
  refreshTokenExpiresAt: tsNull("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const verification = sqliteTable("verification", {
  id: id(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: ts("expires_at"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const invitations = sqliteTable("invitations", {
  id: id(),
  email: text("email").notNull(),
  personId: text("person_id").references(() => people.id),
  invitedById: text("invited_by_id").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  expiresAt: ts("expires_at"),
  acceptedAt: tsNull("accepted_at"),
  createdAt: ts("created_at"),
});

export const people = sqliteTable(
  "people",
  {
    id: id(),
    userId: text("user_id").references(() => user.id),
    fullName: text("full_name").notNull(),
    preferredName: text("preferred_name"),
    email: text("email").notNull(),
    positionTitle: text("position_title"),
    employmentType: text("employment_type").notNull().default("staff"),
    organizationalStatus: text("organizational_status").notNull().default("active"),
    lastWorkingDay: tsNull("last_working_day"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [index("people_user_idx").on(t.userId), index("people_status_idx").on(t.organizationalStatus)],
);

export const departments = sqliteTable("departments", {
  id: id(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const personDepartments = sqliteTable("person_departments", {
  id: id(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  departmentId: text("department_id")
    .notNull()
    .references(() => departments.id),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(true),
  createdAt: ts("created_at"),
});

export const roles = sqliteTable("roles", {
  id: id(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: ts("created_at"),
});

export const permissions = sqliteTable("permissions", {
  id: id(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
});

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    id: id(),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id),
  },
  (t) => [uniqueIndex("role_perm_unique").on(t.roleId, t.permissionId)],
);

export const personRoles = sqliteTable("person_roles", {
  id: id(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id),
  createdAt: ts("created_at"),
});

export const reportingRelationships = sqliteTable(
  "reporting_relationships",
  {
    id: id(),
    personId: text("person_id")
      .notNull()
      .references(() => people.id),
    superiorId: text("superior_id")
      .notNull()
      .references(() => people.id),
    status: text("status").notNull().default("active"),
    startedAt: ts("started_at"),
    endedAt: tsNull("ended_at"),
    createdAt: ts("created_at"),
  },
  (t) => [index("reporting_person_idx").on(t.personId, t.status)],
);

export const employmentHistory = sqliteTable("employment_history", {
  id: id(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  status: text("status").notNull(),
  employmentType: text("employment_type"),
  lastWorkingDay: tsNull("last_working_day"),
  changedById: text("changed_by_id").references(() => people.id),
  reason: text("reason"),
  createdAt: ts("created_at"),
});

export const settings = sqliteTable("settings", {
  id: id(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: ts("updated_at"),
});

export const projects = sqliteTable("projects", {
  id: id(),
  name: text("name").notNull(),
  description: text("description"),
  objective: text("objective"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => people.id),
  status: text("status").notNull().default("planning"),
  priority: text("priority").notNull().default("medium"),
  startAt: tsNull("start_at"),
  endAt: tsNull("end_at"),
  notes: text("notes"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const projectMembers = sqliteTable("project_members", {
  id: id(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  roleLabel: text("role_label"),
  createdAt: ts("created_at"),
});

export const projectPhases = sqliteTable("project_phases", {
  id: id(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  status: text("status").notNull().default("planned"),
});

export const projectHistory = sqliteTable("project_history", {
  id: id(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  actorId: text("actor_id").references(() => people.id),
  field: text("field").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  createdAt: ts("created_at"),
});

export const tasks = sqliteTable(
  "tasks",
  {
    id: id(),
    title: text("title").notNull(),
    description: text("description"),
    projectId: text("project_id").references(() => projects.id),
    creatorId: text("creator_id")
      .notNull()
      .references(() => people.id),
    assigneeId: text("assignee_id").references(() => people.id),
    priority: text("priority").notNull().default("medium"),
    status: text("status").notNull().default("draft"),
    officialDeadline: tsNull("official_deadline"),
    plannedStartAt: tsNull("planned_start_at"),
    plannedEndAt: tsNull("planned_end_at"),
    assignedAt: tsNull("assigned_at"),
    acknowledgedAt: tsNull("acknowledged_at"),
    completedAt: tsNull("completed_at"),
    purpose: text("purpose"),
    category: text("category"),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [index("tasks_assignee_idx").on(t.assigneeId, t.status), index("tasks_deadline_idx").on(t.officialDeadline)],
);

export const taskAssignees = sqliteTable("task_assignees", {
  id: id(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  assignedAt: ts("assigned_at"),
  unassignedAt: tsNull("unassigned_at"),
});

export const taskCollaborators = sqliteTable("task_collaborators", {
  id: id(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  roleInTask: text("role_in_task").notNull().default("contributor"),
  contribution: text("contribution"),
  notes: text("notes"),
  createdAt: ts("created_at"),
});

export const taskSubtasks = sqliteTable("task_subtasks", {
  id: id(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  title: text("title").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: ts("created_at"),
});

export const taskDeliverables = sqliteTable("task_deliverables", {
  id: id(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  label: text("label").notNull(),
  url: text("url"),
  description: text("description"),
  deliverableType: text("deliverable_type"),
  notes: text("notes"),
  createdAt: ts("created_at"),
});

export const taskReferences = sqliteTable("task_references", {
  id: id(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  label: text("label").notNull(),
  url: text("url"),
});

export const taskCompletions = sqliteTable("task_completions", {
  id: id(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  completedById: text("completed_by_id")
    .notNull()
    .references(() => people.id),
  summary: text("summary"),
  explanation: text("explanation"),
  learned: text("learned"),
  selfReflection: text("self_reflection"),
  doDifferently: text("do_differently"),
  rememberNext: text("remember_next"),
  problems: text("problems"),
  notes: text("notes"),
  toolsUsed: text("tools_used"),
  peopleInvolved: text("people_involved"),
  workCompletedAt: tsNull("work_completed_at"),
  submittedAt: tsNull("submitted_at"),
  overdueDays: integer("overdue_days").notNull().default(0),
  createdAt: ts("created_at"),
});

export const completionDeliverables = sqliteTable("completion_deliverables", {
  id: id(),
  completionId: text("completion_id")
    .notNull()
    .references(() => taskCompletions.id),
  label: text("label").notNull(),
  url: text("url"),
  description: text("description").notNull(),
  deliverableType: text("deliverable_type"),
  notes: text("notes"),
  createdAt: ts("created_at"),
});

export const completionPeople = sqliteTable("completion_people", {
  id: id(),
  completionId: text("completion_id")
    .notNull()
    .references(() => taskCompletions.id),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  roleInTask: text("role_in_task").notNull(),
  contribution: text("contribution").notNull(),
  notes: text("notes"),
  createdAt: ts("created_at"),
});

export const taskExtensions = sqliteTable("task_extensions", {
  id: id(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  requesterId: text("requester_id")
    .notNull()
    .references(() => people.id),
  reviewerId: text("reviewer_id").references(() => people.id),
  originalDeadline: ts("original_deadline"),
  requestedDeadline: ts("requested_deadline"),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  decisionComment: text("decision_comment"),
  decidedAt: tsNull("decided_at"),
  createdAt: ts("created_at"),
});

export const plannedWork = sqliteTable("planned_work", {
  id: id(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  taskId: text("task_id").references(() => tasks.id),
  projectId: text("project_id").references(() => projects.id),
  contentId: text("content_id"),
  title: text("title"),
  workType: text("work_type").notNull().default("planned_task_work"),
  startAt: ts("start_at"),
  endAt: ts("end_at"),
  notes: text("notes"),
  createdAt: ts("created_at"),
});

export const calendarEvents = sqliteTable("calendar_events", {
  id: id(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("meeting"),
  startAt: ts("start_at"),
  endAt: ts("end_at"),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  ownerId: text("owner_id").references(() => people.id),
  tentative: integer("tentative", { mode: "boolean" }).notNull().default(false),
  createdAt: ts("created_at"),
});

export const timeEntries = sqliteTable("time_entries", {
  id: id(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  taskId: text("task_id").references(() => tasks.id),
  projectId: text("project_id").references(() => projects.id),
  workDate: text("work_date").notNull(),
  plannedMinutes: integer("planned_minutes").notNull().default(0),
  actualMinutes: integer("actual_minutes").notNull().default(0),
  notes: text("notes"),
  createdAt: ts("created_at"),
});

export const contents = sqliteTable("contents", {
  id: id(),
  title: text("title").notNull(),
  pillar: text("pillar"),
  platform: text("platform"),
  contentType: text("content_type"),
  projectId: text("project_id").references(() => projects.id),
  ownerId: text("owner_id").references(() => people.id),
  creatorId: text("creator_id").references(() => people.id),
  stage: text("stage").notNull().default("planned"),
  concept: text("concept"),
  brief: text("brief"),
  caption: text("caption"),
  plannedPublishAt: tsNull("planned_publish_at"),
  actualPublishAt: tsNull("actual_publish_at"),
  publishedUrl: text("published_url"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const contentBenchmarks = sqliteTable("content_benchmarks", {
  id: id(),
  contentId: text("content_id")
    .notNull()
    .references(() => contents.id),
  sourceUrl: text("source_url"),
  notes: text("notes"),
  createdAt: ts("created_at"),
});

export const contentProduction = sqliteTable("content_production", {
  id: id(),
  contentId: text("content_id")
    .notNull()
    .references(() => contents.id),
  notes: text("notes"),
  producedAt: tsNull("produced_at"),
});

export const contentQc = sqliteTable("content_qc", {
  id: id(),
  contentId: text("content_id")
    .notNull()
    .references(() => contents.id),
  stage: text("stage").notNull(),
  reviewerId: text("reviewer_id").references(() => people.id),
  checklist: text("checklist"),
  comments: text("comments"),
  status: text("status").notNull().default("pending"),
  createdAt: ts("created_at"),
});

export const contentCorrections = sqliteTable("content_corrections", {
  id: id(),
  contentId: text("content_id")
    .notNull()
    .references(() => contents.id),
  qcId: text("qc_id").references(() => contentQc.id),
  request: text("request").notNull(),
  resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
  createdAt: ts("created_at"),
});

export const contentApprovals = sqliteTable("content_approvals", {
  id: id(),
  contentId: text("content_id")
    .notNull()
    .references(() => contents.id),
  reviewerId: text("reviewer_id").references(() => people.id),
  status: text("status").notNull().default("pending"),
  comment: text("comment"),
  createdAt: ts("created_at"),
});

export const contentPublications = sqliteTable("content_publications", {
  id: id(),
  contentId: text("content_id")
    .notNull()
    .references(() => contents.id),
  platform: text("platform").notNull(),
  caption: text("caption"),
  scheduledAt: tsNull("scheduled_at"),
  publishedAt: tsNull("published_at"),
  url: text("url"),
  status: text("status").notNull().default("scheduled"),
});

export const contentPerformance = sqliteTable("content_performance", {
  id: id(),
  contentId: text("content_id")
    .notNull()
    .references(() => contents.id),
  platform: text("platform").notNull(),
  metricType: text("metric_type").notNull(),
  value: text("value").notNull(),
  period: text("period"),
  source: text("source"),
  recordedAt: ts("recorded_at"),
});

export const equipment = sqliteTable("equipment", {
  id: id(),
  name: text("name").notNull(),
  assetCode: text("asset_code").notNull().unique(),
  serialNumber: text("serial_number"),
  category: text("category").notNull(),
  location: text("location"),
  condition: text("condition").notNull().default("good"),
  statusHint: text("status_hint").notNull().default("available"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const equipmentLoans = sqliteTable("equipment_loans", {
  id: id(),
  equipmentId: text("equipment_id")
    .notNull()
    .references(() => equipment.id),
  borrowerId: text("borrower_id")
    .notNull()
    .references(() => people.id),
  purpose: text("purpose").notNull(),
  projectId: text("project_id").references(() => projects.id),
  taskId: text("task_id").references(() => tasks.id),
  contentId: text("content_id").references(() => contents.id),
  expectedReturnAt: ts("expected_return_at"),
  actualReturnAt: tsNull("actual_return_at"),
  notes: text("notes"),
  forceReturned: integer("force_returned", { mode: "boolean" }).notNull().default(false),
  forceReturnReason: text("force_return_reason"),
  forceReturnedById: text("force_returned_by_id").references(() => people.id),
  receivingPersonId: text("receiving_person_id").references(() => people.id),
  returnCondition: text("return_condition"),
  status: text("status").notNull().default("borrowed"),
  createdAt: ts("created_at"),
});

export const equipmentPhotos = sqliteTable("equipment_photos", {
  id: id(),
  loanId: text("loan_id")
    .notNull()
    .references(() => equipmentLoans.id),
  kind: text("kind").notNull(),
  fileId: text("file_id"),
  createdAt: ts("created_at"),
});

export const equipmentConditions = sqliteTable("equipment_conditions", {
  id: id(),
  equipmentId: text("equipment_id")
    .notNull()
    .references(() => equipment.id),
  condition: text("condition").notNull(),
  notes: text("notes"),
  recordedById: text("recorded_by_id").references(() => people.id),
  createdAt: ts("created_at"),
});

export const equipmentMaintenance = sqliteTable("equipment_maintenance", {
  id: id(),
  equipmentId: text("equipment_id")
    .notNull()
    .references(() => equipment.id),
  notes: text("notes").notNull(),
  status: text("status").notNull().default("open"),
  startedAt: ts("started_at"),
  endedAt: tsNull("ended_at"),
});

export const skillCategories = sqliteTable("skill_categories", {
  id: id(),
  name: text("name").notNull(),
});

export const skills = sqliteTable("skills", {
  id: id(),
  categoryId: text("category_id").references(() => skillCategories.id),
  name: text("name").notNull(),
  description: text("description"),
});

export const personSkills = sqliteTable("person_skills", {
  id: id(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  skillId: text("skill_id")
    .notNull()
    .references(() => skills.id),
  level: integer("level").notNull().default(1),
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  source: text("source").notNull().default("inferred"),
  createdAt: ts("created_at"),
});

export const skillEvidence = sqliteTable("skill_evidence", {
  id: id(),
  personSkillId: text("person_skill_id")
    .notNull()
    .references(() => personSkills.id),
  note: text("note"),
  fileId: text("file_id"),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  source: text("source").notNull().default("inferred"),
  createdAt: ts("created_at"),
});

export const kpiPeriods = sqliteTable("kpi_periods", {
  id: id(),
  name: text("name").notNull(),
  startAt: ts("start_at"),
  endAt: ts("end_at"),
  createdAt: ts("created_at"),
});

export const kpiTargets = sqliteTable("kpi_targets", {
  id: id(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  periodId: text("period_id")
    .notNull()
    .references(() => kpiPeriods.id),
  category: text("category").notNull(),
  targetValue: integer("target_value").notNull(),
  unit: text("unit").notNull().default("count"),
  createdById: text("created_by_id").references(() => people.id),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const kpiActuals = sqliteTable("kpi_actuals", {
  id: id(),
  targetId: text("target_id")
    .notNull()
    .references(() => kpiTargets.id),
  actualValue: integer("actual_value").notNull(),
  evidence: text("evidence"),
  recordedById: text("recorded_by_id").references(() => people.id),
  createdAt: ts("created_at"),
});

export const kpiHistory = sqliteTable("kpi_history", {
  id: id(),
  targetId: text("target_id")
    .notNull()
    .references(() => kpiTargets.id),
  previousValue: integer("previous_value"),
  newValue: integer("new_value"),
  changedById: text("changed_by_id").references(() => people.id),
  reason: text("reason"),
  createdAt: ts("created_at"),
});

export const approvals = sqliteTable("approvals", {
  id: id(),
  type: text("type").notNull(),
  relatedType: text("related_type").notNull(),
  relatedId: text("related_id").notNull(),
  requesterId: text("requester_id")
    .notNull()
    .references(() => people.id),
  reviewerId: text("reviewer_id").references(() => people.id),
  status: text("status").notNull().default("pending"),
  decision: text("decision"),
  comment: text("comment"),
  createdAt: ts("created_at"),
  decidedAt: tsNull("decided_at"),
});

export const handovers = sqliteTable("handovers", {
  id: id(),
  outgoingPersonId: text("outgoing_person_id")
    .notNull()
    .references(() => people.id),
  incomingPersonId: text("incoming_person_id").references(() => people.id),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const handoverItems = sqliteTable("handover_items", {
  id: id(),
  handoverId: text("handover_id")
    .notNull()
    .references(() => handovers.id),
  kind: text("kind").notNull(),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  summary: text("summary").notNull(),
});

export const knowledgeArticles = sqliteTable("knowledge_articles", {
  id: id(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  body: text("body").notNull(),
  ownerId: text("owner_id").references(() => people.id),
  status: text("status").notNull().default("published"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const announcements = sqliteTable("announcements", {
  id: id(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  kind: text("kind").notNull().default("announcement"),
  requiresParticipation: integer("requires_participation", { mode: "boolean" }).notNull().default(false),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  createdById: text("created_by_id").references(() => people.id),
  startsAt: tsNull("starts_at"),
  endsAt: tsNull("ends_at"),
  status: text("status").notNull().default("published"),
  createdAt: ts("created_at"),
});

export const knowledgeVersions = sqliteTable("knowledge_versions", {
  id: id(),
  articleId: text("article_id")
    .notNull()
    .references(() => knowledgeArticles.id),
  body: text("body").notNull(),
  version: integer("version").notNull(),
  createdAt: ts("created_at"),
});

export const files = sqliteTable("files", {
  id: id(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  storageKey: text("storage_key").notNull(),
  category: text("category"),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  uploaderId: text("uploader_id").references(() => people.id),
  version: integer("version").notNull().default(1),
  createdAt: ts("created_at"),
});

export const notifications = sqliteTable("notifications", {
  id: id(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href"),
  kind: text("kind").notNull(),
  readAt: tsNull("read_at"),
  handledAt: tsNull("handled_at"),
  createdAt: ts("created_at"),
});

export const notificationPreferences = sqliteTable("notification_preferences", {
  id: id(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  kind: text("kind").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: id(),
  actorId: text("actor_id").references(() => people.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  summary: text("summary").notNull(),
  createdAt: ts("created_at"),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: id(),
  actorId: text("actor_id").references(() => people.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  createdAt: ts("created_at"),
});

export const aiConversations = sqliteTable("ai_conversations", {
  id: id(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id),
  createdAt: ts("created_at"),
});

export const aiMessages = sqliteTable("ai_messages", {
  id: id(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => aiConversations.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  sources: text("sources"),
  createdAt: ts("created_at"),
});

export const schema = {
  user,
  session,
  account,
  verification,
  invitations,
  people,
  departments,
  personDepartments,
  roles,
  permissions,
  rolePermissions,
  personRoles,
  reportingRelationships,
  employmentHistory,
  settings,
  projects,
  projectMembers,
  projectPhases,
  projectHistory,
  tasks,
  taskAssignees,
  taskCollaborators,
  taskSubtasks,
  taskDeliverables,
  taskReferences,
  taskCompletions,
  completionDeliverables,
  completionPeople,
  taskExtensions,
  plannedWork,
  calendarEvents,
  timeEntries,
  contents,
  contentBenchmarks,
  contentProduction,
  contentQc,
  contentCorrections,
  contentApprovals,
  contentPublications,
  contentPerformance,
  equipment,
  equipmentLoans,
  equipmentPhotos,
  equipmentConditions,
  equipmentMaintenance,
  skillCategories,
  skills,
  personSkills,
  skillEvidence,
  kpiPeriods,
  kpiTargets,
  kpiActuals,
  kpiHistory,
  approvals,
  handovers,
  handoverItems,
  knowledgeArticles,
  knowledgeVersions,
  announcements,
  files,
  notifications,
  notificationPreferences,
  activityLogs,
  auditLogs,
  aiConversations,
  aiMessages,
};

export const peopleRelations = relations(people, ({ many, one }) => ({
  user: one(user, { fields: [people.userId], references: [user.id] }),
  roles: many(personRoles),
}));

export const personRolesRelations = relations(personRoles, ({ one }) => ({
  person: one(people, { fields: [personRoles.personId], references: [people.id] }),
  role: one(roles, { fields: [personRoles.roleId], references: [roles.id] }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  people: many(personRoles),
}));

export const reportingRelations = relations(reportingRelationships, ({ one }) => ({
  person: one(people, { fields: [reportingRelationships.personId], references: [people.id] }),
  superior: one(people, { fields: [reportingRelationships.superiorId], references: [people.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(people, { fields: [projects.ownerId], references: [people.id] }),
  members: many(projectMembers),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  assignee: one(people, { fields: [tasks.assigneeId], references: [people.id] }),
}));

export const taskExtensionsRelations = relations(taskExtensions, ({ one }) => ({
  task: one(tasks, { fields: [taskExtensions.taskId], references: [tasks.id] }),
}));

export const contentsRelations = relations(contents, ({ one }) => ({
  project: one(projects, { fields: [contents.projectId], references: [projects.id] }),
}));

export const equipmentRelations = relations(equipment, ({ many }) => ({
  loans: many(equipmentLoans),
}));

export const equipmentLoansRelations = relations(equipmentLoans, ({ one }) => ({
  equipment: one(equipment, { fields: [equipmentLoans.equipmentId], references: [equipment.id] }),
}));

export const kpiTargetsRelations = relations(kpiTargets, ({ one }) => ({
  person: one(people, { fields: [kpiTargets.personId], references: [people.id] }),
}));

export const knowledgeRelations = relations(knowledgeArticles, ({ one }) => ({
  owner: one(people, { fields: [knowledgeArticles.ownerId], references: [people.id] }),
}));

export const settingsRelations = relations(settings, () => ({}));
export const invitationsRelations = relations(invitations, () => ({}));
export const plannedWorkRelations = relations(plannedWork, ({ one }) => ({
  person: one(people, { fields: [plannedWork.personId], references: [people.id] }),
}));

void sql;
