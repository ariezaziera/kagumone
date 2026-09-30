"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { notificationPreview, type NotificationPreview } from "@/lib/queries";
import { now } from "@/lib/utils";

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
    .set({ readAt: now() })
    .where(and(eq(notifications.id, parsed.data), eq(notifications.personId, person.id), isNull(notifications.readAt)));
  refreshNotifications();
  return notificationPreview(person.id);
}

export async function markNotificationsRead(): Promise<NotificationPreview> {
  const person = await requirePerson();
  await db
    .update(notifications)
    .set({ readAt: now() })
    .where(and(eq(notifications.personId, person.id), isNull(notifications.readAt)));
  refreshNotifications();
  return notificationPreview(person.id);
}

export async function clearNotifications(): Promise<NotificationPreview> {
  const person = await requirePerson();
  await db.delete(notifications).where(eq(notifications.personId, person.id));
  refreshNotifications();
  return notificationPreview(person.id);
}
