import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  remember: z.boolean().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  objective: z.string().optional(),
  ownerId: z.string().min(1),
  status: z.string().default("planning"),
  priority: z.string().default("medium"),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  purpose: z.string().optional(),
  category: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.string().default("medium"),
  officialDeadline: z.string().optional(),
  plannedStartAt: z.string().optional(),
  plannedEndAt: z.string().optional(),
});

export const completionDeliverableSchema = z.object({
  label: z.string().optional(),
  url: z.string().optional(),
  description: z.string().min(2, "Each deliverable needs a description, not only a link."),
  deliverableType: z.string().optional(),
  notes: z.string().optional(),
});

export const completionPersonSchema = z.object({
  personId: z.string().min(1),
  roleInTask: z.string().min(1),
  contribution: z.string().min(2, "Describe what this person did."),
  notes: z.string().optional(),
});

export const completionSchema = z.object({
  taskId: z.string(),
  summary: z.string().min(2, "Describe what was done."),
  learned: z.string().min(2, "Required: What did you learn from this task?"),
  doDifferently: z.string().min(2, "Required: What would you do differently next time?"),
  rememberNext: z.string().min(2, "Required: What should be remembered?"),
  problems: z.string().optional(),
  workCompletedAt: z.string().min(1, "Work Completed At is required."),
  deliverables: z.array(completionDeliverableSchema).min(1, "Add at least one deliverable with a description."),
  people: z.array(completionPersonSchema).optional(),
});

export const plannedWorkSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  title: z.string().min(2),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  contentId: z.string().optional(),
  workType: z.string().min(1),
  notes: z.string().optional(),
});

export const extensionSchema = z.object({
  taskId: z.string(),
  requestedDeadline: z.string(),
  reason: z.string().min(3),
});

export const contentSchema = z.object({
  title: z.string().min(2),
  pillar: z.string().optional(),
  platform: z.string().optional(),
  contentType: z.string().optional(),
  projectId: z.string().optional(),
  caption: z.string().optional(),
  brief: z.string().optional(),
  concept: z.string().optional(),
});

export const borrowSchema = z.object({
  equipmentId: z.string(),
  purpose: z.string().min(3),
  expectedReturnAt: z.string(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  beforePhotoCount: z.number().int(),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  roleKey: z.string(),
});
