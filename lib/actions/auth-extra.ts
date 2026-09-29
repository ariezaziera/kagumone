"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, people } from "@/lib/db/schema";
import { now } from "@/lib/utils";
import { recordAudit } from "@/lib/services/records";
import { assistantAnswer } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { getAuthContext } from "@/lib/auth/context";
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
