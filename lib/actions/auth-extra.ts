"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db";
import { account, invitations, people, session } from "@/lib/db/schema";
import { now } from "@/lib/utils";
import { notify, recordActivity, recordAudit } from "@/lib/services/records";
import { assistantAnswer } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { getAuthContext, requirePermission } from "@/lib/auth/context";
import { temporaryPassword } from "@/lib/auth/temporary-password";
import { hideDemoWorkspace } from "@/lib/services/demo-scope";
import { listActivity, listContents, listKnowledge, listPeople, listProjects, listTasks } from "@/lib/queries";
import { createSignupAuth } from "@/lib/auth/signup";

export async function signInWithIdentifier(input: { identifier: string; password: string; remember: boolean }) {
  const identifier = input.identifier.trim();
  if (!identifier || input.password.length < 8) return { error: "Unable to sign in." };
  const requestHeaders = await headers();
  try {
    if (identifier.includes("@")) {
      await auth.api.signInEmail({
        body: { email: identifier.toLowerCase(), password: input.password, rememberMe: input.remember },
        headers: requestHeaders,
      });
    } else {
      await auth.api.signInUsername({
        body: { username: identifier, password: input.password, rememberMe: input.remember },
        headers: requestHeaders,
      });
    }
  } catch {
    return { error: "Unable to sign in." };
  }
  const [person] = await db
    .select({ mustChangePassword: people.mustChangePassword })
    .from(people)
    .where(identifier.includes("@") ? eq(people.email, identifier.toLowerCase()) : eq(people.username, identifier.toLowerCase()));
  return { mustChangePassword: Boolean(person?.mustChangePassword) };
}

export async function completeFirstPassword(form: FormData) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  if (!ctx.person.mustChangePassword) throw new Error("A new password is not required.");
  const currentPassword = String(form.get("currentPassword") || "");
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (password !== confirm) throw new Error("Passwords do not match.");
  if (password === currentPassword) throw new Error("Choose a different password from the temporary one.");
  await auth.api.changePassword({
    body: { currentPassword, newPassword: password, revokeOtherSessions: true },
    headers: await headers(),
  });
  await db.update(people).set({ mustChangePassword: false, updatedAt: now() }).where(eq(people.id, ctx.person.id));
  await recordAudit({
    actorId: ctx.person.id,
    action: "password.changed",
    entityType: "person",
    entityId: ctx.person.id,
  });
}

export async function resetAccountPassword(form: FormData) {
  const ctx = requirePermission(await getAuthContext(), "user:invite");
  const personId = String(form.get("personId") || "");
  if (personId === ctx.person.id) throw new Error("Use Settings to change your own password.");
  const [person] = await db.select().from(people).where(eq(people.id, personId));
  if (!person || (person.isDemo && (await hideDemoWorkspace()))) throw new Error("Person not found.");
  if (!person.userId) throw new Error("This person has no login to reset.");
  const [credential] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, person.userId), eq(account.providerId, "credential")));
  if (!credential) throw new Error("This account has no password to reset.");
  const password = temporaryPassword();
  await db
    .update(account)
    .set({ password: await hashPassword(password), updatedAt: now() })
    .where(eq(account.id, credential.id));
  await db.update(people).set({ mustChangePassword: true, updatedAt: now() }).where(eq(people.id, person.id));
  await db.delete(session).where(eq(session.userId, person.userId));
  await recordAudit({
    actorId: ctx.person.id,
    action: "password.reset",
    entityType: "person",
    entityId: person.id,
    newValue: { mustChangePassword: true },
  });
  await recordActivity({
    actorId: ctx.person.id,
    action: "password.reset",
    entityType: "person",
    entityId: person.id,
    summary: `${ctx.person.fullName} reset the password for ${person.fullName}.`,
  });
  await notify({
    personId: person.id,
    title: "Password reset",
    body: "An administrator reset your password. Sign in with the temporary password they give you, then choose a new one.",
    href: "/login",
    kind: "password_reset",
  });
  revalidatePath(`/team/${person.id}`);
  return {
    fullName: person.fullName,
    email: person.email,
    username: person.username,
    temporaryPassword: password,
  };
}

export async function activateAccount(form: FormData) {
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (password !== confirm) throw new Error("Passwords do not match.");
  const [invite] = await db.select().from(invitations).where(eq(invitations.token, token));
  if (!invite || invite.status !== "pending") throw new Error("This invitation is invalid.");
  if (invite.expiresAt.getTime() < Date.now()) throw new Error("This invitation has expired.");
  const [person] = invite.personId
    ? await db.select().from(people).where(eq(people.id, invite.personId))
    : [null];
  const signed = await createSignupAuth().api.signUpEmail({
    body: {
      email: invite.email,
      password,
      name: person?.fullName ?? invite.email,
    },
  });
  if (person) {
    await db
      .update(people)
      .set({ userId: signed.user.id, organizationalStatus: "active", updatedAt: now() })
      .where(eq(people.id, person.id));
  }
  await db
    .update(invitations)
    .set({ status: "accepted", acceptedAt: now() })
    .where(eq(invitations.id, invite.id));
  await recordAudit({
    actorId: person?.id,
    action: "account.activated",
    entityType: "person",
    entityId: person?.id ?? signed.user.id,
    newValue: invite.email,
  });
}

export async function askAssistant(question: string) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const needle = question.replaceAll("%", "").trim().toLowerCase();
  const [projectsVisible, tasksVisible, activity, knowledgeVisible] = await Promise.all([
    listProjects(),
    listTasks(),
    listActivity(8),
    listKnowledge(),
  ]);
  const projectRows = projectsVisible
    .filter((row) => row.name.toLowerCase().includes(needle) || (row.description ?? "").toLowerCase().includes(needle))
    .slice(0, 8);
  const taskRows = tasksVisible.filter((row) => row.title.toLowerCase().includes(needle)).slice(0, 8);
  const knowledge = knowledgeVisible.filter((row) => row.title.toLowerCase().includes(needle)).slice(0, 8);
  const sources = [
    ...projectRows.map((p) => ({ type: "project", id: p.id, label: p.name })),
    ...taskRows.map((t) => ({ type: "task", id: t.id, label: t.title })),
    ...knowledge.map((k) => ({ type: "knowledge", id: k.id, label: k.title })),
    ...activity.map((a) => ({ type: "activity", id: a.id, label: a.summary })),
  ];
  const recorded = [
    ...projectRows.map((p) => `Project ${p.name} status ${p.status}`),
    ...taskRows.map((t) => `Task ${t.title} status ${t.status}`),
    ...activity.map((a) => a.summary),
  ].join("\n");
  const answer = await assistantAnswer({
    question,
    recorded,
    actor: ctx.person.fullName,
  });
  return {
    answer,
    sources,
    labels: {
      recorded: "Drawn from KAGUM ONE records where listed as sources.",
      inferred: "Any synthesis beyond listed records is inferred.",
      suggested: "Suggested next actions require your confirmation and normal permissions.",
    },
  };
}

export async function searchRecords(term: string) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("You must be signed in.");
  const [projectRows, taskRows, peopleRows, contentRows] = await Promise.all([
    listProjects().then((rows) => rows.filter((row) => row.name.toLowerCase().includes(term.trim().toLowerCase())).slice(0, 5)),
    listTasks().then((rows) => rows.filter((row) => row.title.toLowerCase().includes(term.trim().toLowerCase())).slice(0, 5)),
    listPeople().then((rows) => rows.filter((row) => row.fullName.toLowerCase().includes(term.trim().toLowerCase())).slice(0, 5)),
    listContents().then((rows) => rows.filter((row) => row.title.toLowerCase().includes(term.trim().toLowerCase())).slice(0, 5)),
  ]);
  return { projectRows, taskRows, peopleRows, contentRows };
}
