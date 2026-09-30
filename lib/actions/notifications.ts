"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { notificationPreferences, notifications } from "@/lib/db/schema";
import { NOTIFICATION_KINDS } from "@/lib/notification-kinds";
import { notificationPreview, type NotificationPreview } from "@/lib/queries";
import { recordAudit } from "@/lib/services/records";
import { newId, now } from "@/lib/utils";

const emptyPreview: NotificationPreview = { unread: 0, items: [] };

function refreshNotifications() {
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

async function requirePerson() {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  return ctx.person;
}

export async function previewNotifications(): Promise<NotificationPreview> {
  const ctx = await getAuthContext();
  if (!ctx) return emptyPreview;
  return notificationPreview(ctx.person.id);
}

export async function markNotificationRead(id: string): Promise<NotificationPreview> {
  const person = await requirePerson();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) throw new Error("That notification is not available.");
  await db
    .update(notifications)
    .set({ readAt: now(), handledAt: now() })
    .where(and(eq(notifications.id, parsed.data), eq(notifications.personId, person.id), isNull(notifications.readAt)));
  refreshNotifications();
  return notificationPreview(person.id);
}

export async function markNotificationsRead(): Promise<NotificationPreview> {
  const person = await requirePerson();
  await db
    .update(notifications)
    .set({ readAt: now(), handledAt: now() })
    .where(and(eq(notifications.personId, person.id), isNull(notifications.readAt)));
  refreshNotifications();
  return notificationPreview(person.id);
}

export async function clearNotifications(): Promise<NotificationPreview> {
  const person = await requirePerson();
  const existing = await db.select({ id: notifications.id }).from(notifications).where(eq(notifications.personId, person.id));
  await db.delete(notifications).where(eq(notifications.personId, person.id));
  if (existing.length > 0) {
    await recordAudit({
      actorId: person.id,
      action: "notifications.cleared",
      entityType: "notification",
      entityId: person.id,
      previousValue: { count: existing.length },
    });
  }
  refreshNotifications();
  return notificationPreview(person.id);
}

export async function notificationChoices() {
  const person = await requirePerson();
  const rows = await db.select().from(notificationPreferences).where(eq(notificationPreferences.personId, person.id));
  const disabled = new Set(rows.filter((row) => !row.enabled).map((row) => row.kind));
  return NOTIFICATION_KINDS.map((choice) => ({ ...choice, enabled: !disabled.has(choice.kind) }));
}

export async function saveNotificationPreferences(form: FormData) {
  const person = await requirePerson();
  const rows = await db.select().from(notificationPreferences).where(eq(notificationPreferences.personId, person.id));
  for (const choice of NOTIFICATION_KINDS) {
    const enabled = form.get(choice.kind) === "on";
    const existing = rows.find((row) => row.kind === choice.kind);
    if (existing) {
      await db.update(notificationPreferences).set({ enabled }).where(eq(notificationPreferences.id, existing.id));
    } else if (!enabled) {
      await db.insert(notificationPreferences).values({
        id: newId(),
        personId: person.id,
        kind: choice.kind,
        enabled: false,
      });
    }
  }
  revalidatePath("/settings");
}
