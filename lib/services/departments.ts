import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { departments, personDepartments } from "@/lib/db/schema";
import { newId, now } from "@/lib/utils";

export const DEFAULT_DEPARTMENTS = [
  { name: "Management", code: "MGMT" },
  { name: "Marketing Technologist (MarTech)", code: "MARTECH" },
  { name: "Admin", code: "ADMIN" },
] as const;

export async function ensureDefaultDepartments() {
  const existing = await db.select({ code: departments.code }).from(departments);
  const codes = new Set(existing.map((row) => row.code));
  const missing = DEFAULT_DEPARTMENTS.filter((row) => !codes.has(row.code));
  if (missing.length > 0) {
    await db.insert(departments).values(
      missing.map((row) => ({
        id: newId(),
        name: row.name,
        code: row.code,
        status: "active",
        createdAt: now(),
        updatedAt: now(),
      })),
    );
  }
}

export async function loadDepartments() {
  await ensureDefaultDepartments();
  const [rows, memberships] = await Promise.all([
    db.select().from(departments),
    db.select().from(personDepartments),
  ]);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const byPerson = new Map<string, { id: string; name: string }>();
  const memberCount = new Map<string, number>();
  for (const membership of memberships) {
    memberCount.set(membership.departmentId, (memberCount.get(membership.departmentId) ?? 0) + 1);
    const department = byId.get(membership.departmentId);
    if (!department) continue;
    const current = byPerson.get(membership.personId);
    if (!current || membership.isPrimary) byPerson.set(membership.personId, { id: department.id, name: department.name });
  }
  return {
    departments: [...rows].sort((a, b) => a.name.localeCompare(b.name)),
    byPerson,
    memberCount,
  };
}

export async function setPrimaryDepartment(personId: string, departmentId: string | null) {
  const memberships = await db.select().from(personDepartments).where(eq(personDepartments.personId, personId));
  const primary = memberships.find((row) => row.isPrimary) ?? memberships[0] ?? null;
  if (!departmentId) {
    if (primary) await db.delete(personDepartments).where(eq(personDepartments.id, primary.id));
    return;
  }
  const [department] = await db.select().from(departments).where(eq(departments.id, departmentId));
  if (!department || department.status !== "active") throw new Error("Choose an active department.");
  if (primary) {
    await db.update(personDepartments).set({ departmentId, isPrimary: true }).where(eq(personDepartments.id, primary.id));
    return;
  }
  await db.insert(personDepartments).values({
    id: newId(),
    personId,
    departmentId,
    isPrimary: true,
    createdAt: now(),
  });
}
