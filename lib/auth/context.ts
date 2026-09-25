import { headers } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { people, personRoles, rolePermissions, permissions, reportingRelationships } from "@/lib/db/schema";
import type { Permission } from "@/lib/permissions";

export type AuthContext = {
  userId: string;
  email: string;
  name: string;
  person: typeof people.$inferSelect;
  permissionKeys: Permission[];
  roleKeys: string[];
  subordinateIds: string[];
  superiorIds: string[];
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const person = await db.query.people.findFirst({
    where: eq(people.userId, session.user.id),
  });
  if (!person) return null;
  const assigned = await db
    .select({
      roleKey: personRoles.roleId,
      perm: permissions.key,
      roleName: personRoles.id,
    })
    .from(personRoles)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, personRoles.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(personRoles.personId, person.id));

  const roles = await db.query.personRoles.findMany({
    where: eq(personRoles.personId, person.id),
  });
  const roleRows = await db.query.personRoles.findMany({
    where: eq(personRoles.personId, person.id),
  });
  void roles;
  const roleIds = roleRows.map((r) => r.roleId);
  const { roles: roleTable } = await import("@/lib/db/schema");
  const roleRecords = roleIds.length
    ? await db.query.roles.findMany({ where: inArray(roleTable.id, roleIds) })
    : [];

  const reporting = await db.query.reportingRelationships.findMany({
    where: and(eq(reportingRelationships.status, "active")),
  });
  const subordinateIds = reporting.filter((r) => r.superiorId === person.id).map((r) => r.personId);
  const superiorIds = reporting.filter((r) => r.personId === person.id).map((r) => r.superiorId);

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    person,
    permissionKeys: [...new Set(assigned.map((a) => a.perm))] as Permission[],
    roleKeys: roleRecords.map((r) => r.key),
    subordinateIds,
    superiorIds,
  };
}

export function hasPermission(ctx: AuthContext, permission: Permission) {
  return ctx.permissionKeys.includes(permission);
}

export function requirePermission(ctx: AuthContext | null, permission: Permission) {
  if (!ctx) throw new Error("You must be signed in.");
  if (!hasPermission(ctx, permission)) {
    throw new Error("You are not authorized to perform this action.");
  }
  return ctx;
}

export function isSelfOrSuperior(ctx: AuthContext, personId: string) {
  return ctx.person.id === personId || ctx.subordinateIds.includes(personId);
}
