export const PERMISSIONS = [
  "task:create",
  "task:assign",
  "task:edit",
  "task:acknowledge",
  "task:complete",
  "task:request_extension",
  "task:approve_extension",
  "content:create",
  "content:edit",
  "content:self_qc",
  "content:qc1",
  "content:qc2",
  "content:approve",
  "content:publish",
  "equipment:register",
  "equipment:edit",
  "equipment:borrow",
  "equipment:return",
  "equipment:force_return",
  "equipment:maintenance",
  "kpi:create",
  "kpi:edit",
  "kpi:view",
  "team:view",
  "team:edit",
  "team:delete",
  "reports:view",
  "administration:manage",
  "user:invite",
  "knowledge:manage",
  "announcement:create",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_KEYS = [
  "system_admin",
  "management",
  "executive",
  "staff",
  "intern",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

/** Seed matrix only — runtime authority is role_permissions in the database. */
export const SEED_ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  system_admin: [...PERMISSIONS],
  management: [
    "task:create",
    "task:assign",
    "task:edit",
    "task:acknowledge",
    "task:complete",
    "task:request_extension",
    "task:approve_extension",
    "content:create",
    "content:edit",
    "content:self_qc",
    "content:qc1",
    "content:qc2",
    "content:approve",
    "content:publish",
    "equipment:register",
    "equipment:edit",
    "equipment:borrow",
    "equipment:return",
    "equipment:force_return",
    "equipment:maintenance",
    "kpi:create",
    "kpi:edit",
    "kpi:view",
    "team:view",
    "team:edit",
    "reports:view",
    "user:invite",
    "knowledge:manage",
    "announcement:create",
  ],
  executive: [
    "task:create",
    "task:assign",
    "task:edit",
    "task:acknowledge",
    "task:complete",
    "task:request_extension",
    "task:approve_extension",
    "content:create",
    "content:edit",
    "content:self_qc",
    "content:qc1",
    "content:qc2",
    "content:approve",
    "content:publish",
    "equipment:register",
    "equipment:edit",
    "equipment:borrow",
    "equipment:return",
    "equipment:maintenance",
    "kpi:create",
    "kpi:edit",
    "kpi:view",
    "team:view",
    "team:edit",
    "reports:view",
    "user:invite",
    "knowledge:manage",
    "announcement:create",
  ],
  staff: [
    "task:create",
    "task:edit",
    "task:acknowledge",
    "task:complete",
    "task:request_extension",
    "content:create",
    "content:edit",
    "content:self_qc",
    "equipment:borrow",
    "equipment:return",
    "kpi:view",
    "team:view",
    "announcement:create",
  ],
  intern: [
    "task:create",
    "task:acknowledge",
    "task:complete",
    "task:request_extension",
    "content:create",
    "content:edit",
    "content:self_qc",
    "equipment:borrow",
    "equipment:return",
    "kpi:view",
    "team:view",
    "announcement:create",
  ],
};

export const TASK_STATUSES = [
  "draft",
  "pending_acknowledgement",
  "acknowledged",
  "in_progress",
  "submitted",
  "completed",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  draft: ["pending_acknowledgement"],
  pending_acknowledgement: ["acknowledged"],
  acknowledged: ["in_progress"],
  in_progress: ["submitted"],
  submitted: ["completed", "in_progress"],
  completed: [],
};

export function canTransitionTask(from: TaskStatus, to: TaskStatus) {
  return TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTaskOverdue(input: {
  officialDeadline: Date | string | null;
  status: string;
  now?: Date;
}) {
  if (!input.officialDeadline) return false;
  if (input.status === "completed") return false;
  const deadline = new Date(input.officialDeadline);
  const current = input.now ?? new Date();
  return deadline.getTime() < current.getTime();
}

export const CONTENT_STAGES = [
  "benchmark",
  "planned",
  "production",
  "self_qc",
  "qc1",
  "corrections_qc1",
  "qc2",
  "corrections_qc2",
  "final_approval",
  "ready_to_post",
  "published",
  "performance",
] as const;

export type ContentStage = (typeof CONTENT_STAGES)[number];

/** Skill names taken from the content workflow already in this system, not a separate invented catalog. */
export const CONTENT_STAGE_SKILLS: Record<ContentStage, string> = {
  benchmark: "Content planning",
  planned: "Content planning",
  production: "Content production",
  self_qc: "Content self-QC",
  qc1: "Content QC",
  qc2: "Content QC",
  corrections_qc1: "Content production",
  corrections_qc2: "Content production",
  final_approval: "Content publishing",
  ready_to_post: "Content publishing",
  published: "Content publishing",
  performance: "Content publishing",
};

export const DEFAULT_KPI_RULE = {
  requirePosted: true,
  platforms: ["facebook", "instagram", "tiktok"] as string[],
};

export function countsTowardContentKpi(
  input: {
    status: string;
    platforms: string[];
  },
  rule = DEFAULT_KPI_RULE,
) {
  if (rule.requirePosted && input.status !== "published" && input.status !== "performance") {
    return false;
  }
  const have = new Set(input.platforms.map((p) => p.toLowerCase()));
  return rule.platforms.every((p) => have.has(p.toLowerCase()));
}

export const TASK_CATEGORIES = [
  "Website Update",
  "Benchmarking",
  "Social Media Management",
  "Email / Automation Tasks",
  "Data Updates",
  "Reporting / Analysis",
  "Corrections / Fixes",
  "Client Handling",
  "Other",
] as const;

export const COLLAB_ROLES = ["Task Owner", "Contributor", "Reviewer", "Support", "Other"] as const;

export const PLANNED_WORK_TYPES = [
  "Planned Task Work",
  "Content Work",
  "Event / Coverage",
  "Meeting",
  "Admin",
  "Other",
] as const;

/** Calendar days after official deadline, never negative. Uses work-completed time, not planned time. */
export function overdueDays(input: {
  officialDeadline: Date | string | null;
  workCompletedAt: Date | string | null;
}) {
  if (!input.officialDeadline || !input.workCompletedAt) return 0;
  const deadline = new Date(input.officialDeadline);
  const done = new Date(input.workCompletedAt);
  if (Number.isNaN(deadline.getTime()) || Number.isNaN(done.getTime())) return 0;
  const start = Date.UTC(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  const end = Date.UTC(done.getFullYear(), done.getMonth(), done.getDate());
  const days = Math.floor((end - start) / 86_400_000);
  return Math.max(0, days);
}

export function formatOverdueLabel(days: number) {
  return days === 1 ? "1 day overdue" : `${days} days overdue`;
}
