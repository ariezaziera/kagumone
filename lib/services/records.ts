import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs, auditLogs, notificationPreferences, notifications } from "@/lib/db/schema";
import { ALWAYS_ON_NOTIFICATION_KINDS } from "@/lib/notification-kinds";
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
  const alwaysOn = (ALWAYS_ON_NOTIFICATION_KINDS as readonly string[]).includes(input.kind);
  if (!alwaysOn) {
    const [preference] = await db
      .select()
      .from(notificationPreferences)
      .where(and(eq(notificationPreferences.personId, input.personId), eq(notificationPreferences.kind, input.kind)))
      .limit(1);
    if (preference && !preference.enabled) return;
  }
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
