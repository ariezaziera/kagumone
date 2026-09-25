import "./load-env";
import { eq } from "drizzle-orm";
import { createDb } from "@/lib/db";
import { permissions, rolePermissions, roles } from "@/lib/db/schema";
import { PERMISSIONS, SEED_ROLE_PERMISSIONS, type RoleKey } from "@/lib/permissions";
import { newId } from "@/lib/utils";

async function main() {
  const db = createDb();
  const existingPerms = await db.select().from(permissions);
  const have = new Set(existingPerms.map((p) => p.key));
  for (const key of PERMISSIONS) {
    if (have.has(key)) continue;
    await db.insert(permissions).values({ id: newId(), key, name: key, description: key });
    console.log("Added permission", key);
  }
  const allPerms = await db.select().from(permissions);
  const permByKey = Object.fromEntries(allPerms.map((p) => [p.key, p.id]));
  const allRoles = await db.select().from(roles);
  const links = await db.select().from(rolePermissions);

  for (const role of allRoles) {
    const wanted = new Set(SEED_ROLE_PERMISSIONS[role.key as RoleKey] ?? []);
    const current = links.filter((l) => l.roleId === role.id);
    for (const link of current) {
      const perm = allPerms.find((p) => p.id === link.permissionId);
      if (perm && !wanted.has(perm.key as (typeof PERMISSIONS)[number])) {
        await db.delete(rolePermissions).where(eq(rolePermissions.id, link.id));
        console.log("Removed", perm.key, "from", role.key);
      }
    }
    const currentKeys = new Set(
      current
        .map((l) => allPerms.find((p) => p.id === l.permissionId)?.key)
        .filter(Boolean),
    );
    for (const key of wanted) {
      if (currentKeys.has(key)) continue;
      const permissionId = permByKey[key];
      if (!permissionId) continue;
      await db.insert(rolePermissions).values({ id: newId(), roleId: role.id, permissionId });
      console.log("Granted", key, "to", role.key);
    }
  }
  console.log("Permission matrix synced.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
