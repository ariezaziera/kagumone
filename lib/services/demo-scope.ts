import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth/context";

export const demoPersonIds = cache(async () => {
  const rows = await db.select({ id: people.id }).from(people).where(eq(people.isDemo, true));
  return new Set(rows.map((row) => row.id));
});

/** Real accounts do not see the seeded demo workspace. Demo logins still do. */
export const hideDemoWorkspace = cache(async () => {
  const ctx = await getAuthContext();
  return Boolean(ctx && !ctx.person.isDemo);
});

export function onlyDemoPeople(ids: Array<string | null | undefined>, demoIds: Set<string>) {
  const present = ids.filter((id): id is string => Boolean(id));
  return present.length > 0 && present.every((id) => demoIds.has(id));
}

export function isSeedEquipment(item: { name: string; assetCode: string }) {
  return item.name.startsWith("Demo ") || item.assetCode.toUpperCase().includes("DEMO");
}
