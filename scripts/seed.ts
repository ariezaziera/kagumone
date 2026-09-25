import { createSignupAuth } from "@/lib/auth/signup";
import { createDb } from "@/lib/db";
import {
  activityLogs,
  contents,
  departments,
  equipment,
  kpiPeriods,
  kpiTargets,
  people,
  permissions,
  personDepartments,
  personRoles,
  projects,
  projectMembers,
  projectPhases,
  reportingRelationships,
  rolePermissions,
  roles,
  settings,
  tasks,
} from "@/lib/db/schema";
import { PERMISSIONS, SEED_ROLE_PERMISSIONS, type RoleKey } from "@/lib/permissions";
import { newId, now } from "@/lib/utils";

const DEMO_PASSWORD = "Demo1234!";

async function main() {
  const db = createDb();
  const existing = await db.select().from(roles).limit(1);
  if (existing.length) {
    console.log("Seed skipped: roles already exist.");
    return;
  }

  const permissionRows = PERMISSIONS.map((key) => ({
    id: newId(),
    key,
    name: key,
    description: key,
  }));
  await db.insert(permissions).values(permissionRows);
  const permByKey = Object.fromEntries(permissionRows.map((p) => [p.key, p.id]));

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
      positionTitle: p.role.replaceAll("_", " "),
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
    category: "camera",
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

  console.log("Demo seed complete. Password for all demo accounts:", DEMO_PASSWORD);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
