import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reportingRelationships } from "@/lib/db/schema";

export async function assertMaxThreeSuperiors(personId: string, addingSuperiorId: string) {
  const active = await db.query.reportingRelationships.findMany({
    where: and(eq(reportingRelationships.personId, personId), eq(reportingRelationships.status, "active")),
  });
  const already = active.some((r) => r.superiorId === addingSuperiorId);
  if (!already && active.length >= 3) {
    throw new Error("A person may have a maximum of three reporting superiors.");
  }
}

export function cannotDeleteSelf(actorPersonId: string, targetPersonId: string) {
  if (actorPersonId === targetPersonId) {
    throw new Error("Users cannot delete themselves from the organization.");
  }
}

export function deriveEquipmentStatus(input: {
  openLoan: boolean;
  expectedReturnAt?: Date | null;
  maintenanceOpen: boolean;
  condition: string;
  now?: Date;
}) {
  if (input.maintenanceOpen) return "maintenance";
  if (input.condition === "missing") return "missing";
  if (input.condition === "damaged") return "damaged";
  if (input.openLoan) {
    const current = input.now ?? new Date();
    if (input.expectedReturnAt && input.expectedReturnAt.getTime() < current.getTime()) return "late";
    return "borrowed";
  }
  return "available";
}
