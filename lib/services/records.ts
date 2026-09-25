import { db } from "@/lib/db";
import { activityLogs, auditLogs, notifications } from "@/lib/db/schema";
import { newId, now } from "@/lib/utils";

export async function recordActivity(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
}) {
  await db.insert(activityLogs).values({
    id: newId(),
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    createdAt: now(),
  });
}

export async function recordAudit(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
}) {
  await db.insert(auditLogs).values({
    id: newId(),
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    previousValue: input.previousValue == null ? null : JSON.stringify(input.previousValue),
    newValue: input.newValue == null ? null : JSON.stringify(input.newValue),
    createdAt: now(),
  });
}

export async function notify(input: {
  personId: string;
  title: string;
  body: string;
  href?: string;
  kind: string;
}) {
  await db.insert(notifications).values({
    id: newId(),
    personId: input.personId,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    kind: input.kind,
    createdAt: now(),
  });
}
