"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, people } from "@/lib/db/schema";
import { now } from "@/lib/utils";
import { recordAudit } from "@/lib/services/records";
import { assistantAnswer } from "@/lib/ai";
import { getAuthContext } from "@/lib/auth/context";
import { createSignupAuth } from "@/lib/auth/signup";
import { activityLogs, contents, knowledgeArticles, projects, tasks } from "@/lib/db/schema";
import { desc, like, or } from "drizzle-orm";

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
  const q = `%${question.replaceAll("%", "")}%`;
  const [projectRows, taskRows, activity, knowledge] = await Promise.all([
    db.select().from(projects).where(or(like(projects.name, q), like(projects.description, q))).limit(8),
    db.select().from(tasks).where(like(tasks.title, q)).limit(8),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8),
    db.select().from(knowledgeArticles).where(like(knowledgeArticles.title, q)).limit(8),
  ]);
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
  const q = `%${term.replaceAll("%", "")}%`;
  const [projectRows, taskRows, peopleRows, contentRows] = await Promise.all([
    db.select().from(projects).where(like(projects.name, q)).limit(5),
    db.select().from(tasks).where(like(tasks.title, q)).limit(5),
    db.select().from(people).where(like(people.fullName, q)).limit(5),
    db.select().from(contents).where(like(contents.title, q)).limit(5),
  ]);
  return { projectRows, taskRows, peopleRows, contentRows };
}
