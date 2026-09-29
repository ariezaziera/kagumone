import "./load-env";
import { eq } from "drizzle-orm";
import { createSignupAuth } from "@/lib/auth/signup";
import { createDb } from "@/lib/db";
import {
  activityLogs,
  announcements,
  calendarEvents,
  contents,
  departments,
  equipment,
  knowledgeArticles,
  kpiPeriods,
  kpiTargets,
  people,
  permissions,
  personDepartments,
  personRoles,
  plannedWork,
  projects,
  projectMembers,
  projectPhases,
  reportingRelationships,
  rolePermissions,
  roles,
  settings,
  tasks,
  timeEntries,
} from "@/lib/db/schema";
import { PERMISSIONS, SEED_ROLE_PERMISSIONS, TASK_STATUSES, type RoleKey } from "@/lib/permissions";
import { newId, now } from "@/lib/utils";

const DEMO_PASSWORD = "Demo1234!";

function klDay(offset: number, hour = 10) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + offset));
  const ymd = utc.toISOString().slice(0, 10);
  return {
    ymd,
    at: new Date(`${ymd}T${String(hour).padStart(2, "0")}:00:00+08:00`),
  };
}

async function seedDemoWorkspace(db: ReturnType<typeof createDb>) {
  const marker = await db.select().from(settings).where(eq(settings.key, "demo_workspace_fill"));
  if (marker.length) {
    console.log("Demo calendar, notices, and knowledge already filled.");
    return;
  }
  const demoPeople = await db.select().from(people).where(eq(people.isDemo, true));
  const byEmail = Object.fromEntries(demoPeople.map((person) => [person.email, person.id]));
  const roleIds = [
    byEmail["admin@demo.kagum.local"],
    byEmail["management@demo.kagum.local"],
    byEmail["executive@demo.kagum.local"],
    byEmail["staff@demo.kagum.local"],
    byEmail["intern@demo.kagum.local"],
  ].filter(Boolean);
  if (roleIds.length < 5) {
    console.log("Demo people are incomplete; workspace fill skipped.");
    return;
  }
  const [project] = await db.select().from(projects).where(eq(projects.name, "Demo Campaign Q3")).limit(1);
  const creatorId = byEmail["executive@demo.kagum.local"];
  const titles = [
    "Review campaign copy",
    "Shoot product stills",
    "Update landing page",
    "Compile weekly report",
    "Schedule social posts",
    "Check equipment booking",
    "Draft client reply",
    "Prepare briefing deck",
    "Log studio hours",
    "Publish knowledge note",
    "Confirm event coverage",
    "QA caption set",
  ];

  const taskRows = [];
  for (let day = -1; day <= 10; day += 1) {
    const when = klDay(day, 10 + (day % 3));
    for (let slot = 0; slot < 2; slot += 1) {
      const index = (day + 1) * 2 + slot;
      const status = TASK_STATUSES[index % TASK_STATUSES.length];
      const assigneeId = roleIds[index % roleIds.length];
      taskRows.push({
        id: newId(),
        title: `Demo: ${titles[index % titles.length]} (${when.ymd})`,
        description: "Development sample so the calendar and kanban show more than one record.",
        projectId: project?.id,
        creatorId,
        assigneeId,
        priority: index % 3 === 0 ? "high" : index % 3 === 1 ? "medium" : "low",
        status,
        category: "Social Media Management",
        officialDeadline: when.at,
        assignedAt: now(),
        acknowledgedAt: status === "pending_acknowledgement" || status === "draft" ? null : now(),
        completedAt: status === "completed" ? when.at : null,
        createdAt: now(),
        updatedAt: now(),
      });
    }
  }
  await db.insert(tasks).values(taskRows);

  await db.insert(plannedWork).values(
    Array.from({ length: 12 }, (_, day) => {
      const start = klDay(day - 1, 9);
      const end = klDay(day - 1, 11);
      return {
        id: newId(),
        personId: roleIds[day % roleIds.length],
        projectId: project?.id,
        title: `Demo planned block ${start.ymd}`,
        workType: "Planned Task Work",
        startAt: start.at,
        endAt: end.at,
        notes: "Sample planned working time. It does not move the official deadline.",
        createdAt: now(),
      };
    }),
  );

  await db.insert(calendarEvents).values(
    Array.from({ length: 12 }, (_, day) => {
      const start = klDay(day - 1, 14);
      const end = klDay(day - 1, 15);
      return {
        id: newId(),
        title: day % 2 === 0 ? `Demo coverage ${start.ymd}` : `Demo meeting ${start.ymd}`,
        kind: day % 2 === 0 ? "coverage" : "meeting",
        startAt: start.at,
        endAt: end.at,
        ownerId: roleIds[day % roleIds.length],
        tentative: false,
        createdAt: now(),
      };
    }),
  );

  await db.insert(contents).values(
    [0, 2, 4, 6, 8, 10].map((day) => {
      const when = klDay(day - 1, 16);
      return {
        id: newId(),
        title: `Demo post ${when.ymd}`,
        pillar: "Brand",
        platform: day % 4 === 0 ? "instagram" : "facebook",
        contentType: "post",
        projectId: project?.id,
        ownerId: byEmail["staff@demo.kagum.local"],
        creatorId: byEmail["staff@demo.kagum.local"],
        stage: "planned",
        brief: "Sample content so the calendar can show a planned publish time.",
        plannedPublishAt: when.at,
        createdAt: now(),
        updatedAt: now(),
      };
    }),
  );

  await db.insert(timeEntries).values(
    [0, 3, 6, 9].map((day) => {
      const when = klDay(day - 1, 11);
      return {
        id: newId(),
        personId: byEmail["staff@demo.kagum.local"],
        projectId: project?.id,
        workDate: when.ymd,
        plannedMinutes: 60,
        actualMinutes: 45,
        notes: "Sample time log.",
        createdAt: now(),
      };
    }),
  );

  await db.insert(announcements).values([
    {
      id: newId(),
      title: "Studio shoot this week",
      body: "Demo event notice. Bring the booked camera back to the studio after the shoot.",
      kind: "event_notice",
      requiresParticipation: false,
      createdById: byEmail["management@demo.kagum.local"],
      startsAt: klDay(1, 9).at,
      endsAt: klDay(2, 18).at,
      status: "published",
      createdAt: now(),
    },
    {
      id: newId(),
      title: "Team briefing attendance",
      body: "Demo participation post. Confirm you can join the Friday briefing.",
      kind: "participation",
      requiresParticipation: true,
      createdById: byEmail["executive@demo.kagum.local"],
      startsAt: klDay(2, 9).at,
      status: "published",
      createdAt: now(),
    },
    {
      id: newId(),
      title: "Campaign folder is ready",
      body: "Demo announcement. The Q3 campaign folder is the working set for this sample project.",
      kind: "announcement",
      requiresParticipation: false,
      createdById: byEmail["management@demo.kagum.local"],
      startsAt: now(),
      status: "published",
      createdAt: now(),
    },
  ]);

  await db.insert(knowledgeArticles).values([
    {
      id: newId(),
      title: "How to acknowledge a task",
      category: "SOP",
      body: "Open the task, read the official deadline, and acknowledge it before starting work. Planned time on the calendar does not change the deadline.",
      ownerId: byEmail["management@demo.kagum.local"],
      status: "published",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: newId(),
      title: "Content publish checklist",
      category: "Guide",
      body: "A content record moves through planning, production, QC, and approval before it is ready to post. Planned publish time is not the same as a published post.",
      ownerId: byEmail["executive@demo.kagum.local"],
      status: "published",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: newId(),
      title: "Equipment return rule",
      category: "SOP",
      body: "Borrowed equipment is returned to its listed location. Condition is recorded on the equipment record, not in a chat message.",
      ownerId: byEmail["admin@demo.kagum.local"],
      status: "published",
      createdAt: now(),
      updatedAt: now(),
    },
  ]);

  await db.insert(settings).values({
    id: newId(),
    key: "demo_workspace_fill",
    value: "1",
    updatedAt: now(),
  });
  console.log("Demo calendar, kanban, notices, and knowledge records added.");
}

async function main() {
  const db = createDb();
  const existing = await db.select().from(roles).limit(1);
  if (existing.length) {
    await seedDemoWorkspace(db);
    console.log("Seed skipped: roles already exist.");
    return;
  }

  const permissionRows = PERMISSIONS.map((key) => ({
    id: newId(),
    key,
    name: key,
    description: key,
  }));
  await db.insert(permissions).values(permissionRows).onConflictDoNothing({ target: permissions.key });
  const storedPermissions = await db.select({ id: permissions.id, key: permissions.key }).from(permissions);
  const permByKey = Object.fromEntries(storedPermissions.map((p) => [p.key, p.id]));

  const roleRows = [
    { key: "system_admin", name: "System Admin", sortOrder: 0 },
    { key: "management", name: "Management", sortOrder: 1 },
    { key: "executive", name: "Executive", sortOrder: 2 },
    { key: "staff", name: "Staff", sortOrder: 3 },
    { key: "intern", name: "Intern", sortOrder: 4 },
  ].map((r) => ({ id: newId(), ...r, createdAt: now() }));
  await db.insert(roles).values(roleRows);
  const roleByKey = Object.fromEntries(roleRows.map((r) => [r.key, r.id]));

  const links = [];
  for (const [roleKey, perms] of Object.entries(SEED_ROLE_PERMISSIONS) as [RoleKey, (typeof PERMISSIONS)[number][]][]) {
    for (const perm of perms) {
      links.push({ id: newId(), roleId: roleByKey[roleKey], permissionId: permByKey[perm] });
    }
  }
  await db.insert(rolePermissions).values(links);

  const deptId = newId();
  await db.insert(departments).values({
    id: deptId,
    name: "Operations",
    code: "OPS",
    status: "active",
    createdAt: now(),
    updatedAt: now(),
  });

  const seedAuth = createSignupAuth();

  const personas: Array<{ email: string; name: string; role: RoleKey; employmentType: string }> = [
    { email: "admin@demo.kagum.local", name: "Demo Admin", role: "system_admin", employmentType: "management" },
    { email: "management@demo.kagum.local", name: "Demo Manager", role: "management", employmentType: "management" },
    { email: "executive@demo.kagum.local", name: "Demo Executive", role: "executive", employmentType: "executive" },
    { email: "staff@demo.kagum.local", name: "Demo Staff", role: "staff", employmentType: "staff" },
    { email: "intern@demo.kagum.local", name: "Demo Intern", role: "intern", employmentType: "intern" },
  ];

  const personIds: Record<string, string> = {};
  for (const p of personas) {
    const signed = await seedAuth.api.signUpEmail({
      body: { email: p.email, password: DEMO_PASSWORD, name: p.name },
    });
    const userId = signed.user.id;
    const personId = newId();
    personIds[p.role] = personId;
    await db.insert(people).values({
      id: personId,
      userId,
      fullName: p.name,
      preferredName: p.name.split(" ")[1],
      email: p.email,
      positionTitle: p.role === "system_admin" ? "System Admin" : p.role.charAt(0).toUpperCase() + p.role.slice(1),
      employmentType: p.employmentType,
      organizationalStatus: "active",
      isDemo: true,
      createdAt: now(),
      updatedAt: now(),
    });
    await db.insert(personRoles).values({ id: newId(), personId, roleId: roleByKey[p.role], createdAt: now() });
    await db.insert(personDepartments).values({
      id: newId(),
      personId,
      departmentId: deptId,
      isPrimary: true,
      createdAt: now(),
    });
  }

  await db.insert(reportingRelationships).values([
    {
      id: newId(),
      personId: personIds.executive,
      superiorId: personIds.management,
      status: "active",
      startedAt: now(),
      createdAt: now(),
    },
    {
      id: newId(),
      personId: personIds.staff,
      superiorId: personIds.executive,
      status: "active",
      startedAt: now(),
      createdAt: now(),
    },
    {
      id: newId(),
      personId: personIds.intern,
      superiorId: personIds.executive,
      status: "active",
      startedAt: now(),
      createdAt: now(),
    },
  ]);

  await db.insert(settings).values([
    {
      id: newId(),
      key: "timezone",
      value: "Asia/Kuala_Lumpur",
      updatedAt: now(),
    },
    {
      id: newId(),
      key: "content_kpi_rule",
      value: JSON.stringify({ requirePosted: true, platforms: ["facebook", "instagram", "tiktok"] }),
      updatedAt: now(),
    },
  ]);

  const projectId = newId();
  await db.insert(projects).values({
    id: projectId,
    name: "Demo Campaign Q3",
    description: "Seed project for development only.",
    objective: "Connect people, tasks, and content in one loop.",
    ownerId: personIds.executive,
    status: "active",
    priority: "high",
    startAt: now(),
    createdAt: now(),
    updatedAt: now(),
  });
  await db.insert(projectMembers).values({
    id: newId(),
    projectId,
    personId: personIds.executive,
    roleLabel: "owner",
    createdAt: now(),
  });
  await db.insert(projectPhases).values(
    ["Planning & Discovery", "Information Architecture", "Design & Prototyping", "Development", "Testing & Go Live"].map(
      (name, i) => ({ id: newId(), projectId, name, sortOrder: i, status: i === 0 ? "active" : "planned" }),
    ),
  );

  const taskId = newId();
  await db.insert(tasks).values({
    id: taskId,
    title: "Prepare weekly content brief",
    description: "Draft the brief and submit for review.",
    projectId,
    creatorId: personIds.executive,
    assigneeId: personIds.staff,
    priority: "high",
    status: "pending_acknowledgement",
    officialDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    assignedAt: now(),
    createdAt: now(),
    updatedAt: now(),
  });

  await db.insert(contents).values({
    id: newId(),
    title: "Demo reel concept",
    pillar: "Brand",
    platform: "instagram",
    contentType: "video",
    projectId,
    ownerId: personIds.staff,
    creatorId: personIds.staff,
    stage: "planned",
    brief: "Demo content record.",
    createdAt: now(),
    updatedAt: now(),
  });

  await db.insert(equipment).values({
    id: newId(),
    name: "Demo Camera",
    assetCode: "CAM-DEMO-001",
    serialNumber: "SN-DEMO",
    category: "Camera",
    location: "Studio",
    condition: "good",
    statusHint: "available",
    createdAt: now(),
    updatedAt: now(),
  });

  const periodId = newId();
  await db.insert(kpiPeriods).values({
    id: periodId,
    name: "Q3 2026",
    startAt: new Date("2026-07-01"),
    endAt: new Date("2026-09-30"),
    createdAt: now(),
  });
  await db.insert(kpiTargets).values({
    id: newId(),
    personId: personIds.staff,
    periodId,
    category: "content",
    targetValue: 48,
    unit: "count",
    createdById: personIds.executive,
    createdAt: now(),
    updatedAt: now(),
  });

  await db.insert(activityLogs).values({
    id: newId(),
    actorId: personIds.executive,
    action: "seed",
    entityType: "system",
    entityId: "seed",
    summary: "Demo seed applied (development only).",
    createdAt: now(),
  });

  await seedDemoWorkspace(db);
  console.log("Demo seed complete. Password for all demo accounts:", DEMO_PASSWORD);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
