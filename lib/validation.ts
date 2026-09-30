import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username."),
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

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be 30 characters or fewer.")
  .regex(/^[A-Za-z0-9_.]+$/, "Username can use letters, numbers, underscores, and periods.");

export const departmentCodeSchema = z
  .string()
  .trim()
  .min(2, "Department code must be at least 2 characters.")
  .max(12, "Department code must be 12 characters or fewer.")
  .regex(/^[A-Za-z0-9]+$/, "Department code uses letters and numbers.")
  .transform((value) => value.toUpperCase());

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Department name must be at least 2 characters.").max(80, "Department name must be 80 characters or fewer."),
  code: departmentCodeSchema,
});

export const departmentUpdateSchema = departmentSchema.extend({
  id: z.string().min(1),
  status: z.enum(["active", "inactive"]),
});

export const roleUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Role name must be at least 2 characters.").max(80),
  description: z.string().trim().max(240).optional(),
});

export const profileSchema = z.object({
  personId: z.string().min(1),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  preferredName: z.string().trim().max(80).optional(),
  positionTitle: z.string().trim().max(80, "Position title must be 80 characters or fewer.").optional(),
  email: z.string().trim().optional(),
  username: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
});

export const inviteSchema = z
  .object({
    email: z.string().trim().optional(),
    fullName: z.string().trim().min(2),
    username: z.string().trim().optional(),
    positionTitle: z.string().trim().max(80, "Position title must be 80 characters or fewer.").optional(),
    roleKey: z.string().min(1),
    departmentId: z.string().trim().min(1, "Choose a department."),
  })
  .superRefine((value, ctx) => {
    const email = value.email?.trim() ?? "";
    const username = value.username?.trim() ?? "";
    if (!email && !username) {
      ctx.addIssue({ code: "custom", message: "Enter an email or a username.", path: ["email"] });
    }
    if (email && !z.string().email().safeParse(email).success) {
      ctx.addIssue({ code: "custom", message: "Enter a valid email.", path: ["email"] });
    }
    if (username) {
      const parsed = usernameSchema.safeParse(username);
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", message: parsed.error.issues[0]?.message ?? "Check the username.", path: ["username"] });
      }
    }
  });

const handoverRefSchema = z.object({
  label: z.string().trim().min(1),
  url: z.string().trim().min(1),
});

export const handoverSchema = z.object({
  outgoingPersonId: z.string().min(1),
  incomingPersonId: z.string().min(1).optional(),
  notes: z.string().optional(),
  pendingNote: z.string().optional(),
  projectId: z.string().optional(),
  projectUpdate: z.string().optional(),
  templateNote: z.string().optional(),
  links: z.array(handoverRefSchema).optional(),
  folders: z.array(handoverRefSchema).optional(),
});
