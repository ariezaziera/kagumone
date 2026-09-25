import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { contents, projectHistory, projectMembers, projectPhases, tasks } from "@/lib/db/schema";
import { addProjectMember, updateProject } from "@/lib/actions/core";
import { getProject, listPeople } from "@/lib/queries";
import { getAuthContext } from "@/lib/auth/context";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Field, Input, PageHeader, Select, Textarea, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const project = await getProject(id);
  if (!project) notFound();
  const [members, phases, relatedTasks, relatedContent, history, peopleRows] = await Promise.all([
    db.select().from(projectMembers).where(eq(projectMembers.projectId, id)),
    db.select().from(projectPhases).where(eq(projectPhases.projectId, id)),
    db.select().from(tasks).where(eq(tasks.projectId, id)),
    db.select().from(contents).where(eq(contents.projectId, id)),
    db.select().from(projectHistory).where(eq(projectHistory.projectId, id)),
    listPeople(),
  ]);
  const overdue = relatedTasks.filter((t) => t.status !== "completed" && t.officialDeadline && t.officialDeadline < new Date());
  const health =
    overdue.length > 2 ? "At risk (overdue work)" : overdue.length > 0 ? "Watch (some overdue tasks)" : "On track (no overdue tasks)";

  return (
    <div>
      <PageHeader title={project.name} description={project.objective ?? "Project record"} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-2">
          <div className="flex gap-2">
            <Badge tone={statusTone(project.status)}>{project.status}</Badge>
            <Badge>{project.priority}</Badge>
          </div>
          <p className="text-sm text-secondary">{project.description}</p>
          <p className="text-sm">
            Timeline: {formatDate(project.startAt)} — {formatDate(project.endAt)}
          </p>
          <p className="text-sm">Health (defined signal): {health}</p>
          <h3 className="pt-2 font-medium">Phases</h3>
          <ol className="list-decimal pl-5 text-sm">
            {phases.map((p) => (
              <li key={p.id}>
                {p.name} — {p.status}
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Update project</h2>
          <ActionForm action={updateProject} submitLabel="Save">
            <input type="hidden" name="id" value={project.id} />
            <Field label="Name">
              <Input name="name" defaultValue={project.name} />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={project.status}>
                <option>planning</option>
                <option>active</option>
                <option>completed</option>
                <option>archived</option>
              </Select>
            </Field>
            <Field label="Notes">
              <Textarea name="notes" defaultValue={project.notes ?? ""} />
            </Field>
          </ActionForm>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-medium">Members</h2>
          <ul className="mb-3 text-sm">
            {members.map((m) => (
              <li key={m.id}>{peopleRows.find((p) => p.id === m.personId)?.fullName ?? m.personId}</li>
            ))}
          </ul>
          <ActionForm action={addProjectMember} submitLabel="Add member">
            <input type="hidden" name="projectId" value={id} />
            <Select name="personId">
              {peopleRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </Select>
          </ActionForm>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Related tasks</h2>
          <ul className="text-sm">
            {relatedTasks.map((t) => (
              <li key={t.id}>
                <Link className="text-info" href={`/tasks/${t.id}`}>
                  {t.title}
                </Link>{" "}
                <Badge tone={statusTone(t.status)}>{t.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Related content</h2>
          <ul className="text-sm">
            {relatedContent.map((c) => (
              <li key={c.id}>
                <Link className="text-info" href={`/content/${c.id}`}>
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">History</h2>
          <ul className="text-sm text-secondary">
            {history.map((h) => (
              <li key={h.id}>
                {h.field}: {h.previousValue} → {h.newValue}
              </li>
            ))}
          </ul>
          <Link className="mt-2 inline-block text-sm text-info" href="/handover">
            Project handover
          </Link>
        </Card>
      </div>
    </div>
  );
}
