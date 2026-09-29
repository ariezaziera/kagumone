import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clapperboard, ListChecks } from "lucide-react";
import { db } from "@/lib/db";
import { contents, projectHistory, projectMembers, projectPhases, tasks } from "@/lib/db/schema";
import { addProjectMember, updateProject } from "@/lib/actions/core";
import { getProject, keepUnlessDemoOwned, listFiles, listPeople } from "@/lib/queries";
import { getAuthContext } from "@/lib/auth/context";
import { ActionForm } from "@/components/action-form";
import { PersonAvatar } from "@/components/person-avatar";
import { FileCards } from "@/components/record-files";
import { Badge, Card, Field, Input, Select, Textarea, statusTone } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { taskCard, WorkHero, linkButton, statusFace } from "@/components/work-surface";
import { formatDate, formatDateTime, readableLabel } from "@/lib/utils";
import { isTaskOverdue } from "@/lib/permissions";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const project = await getProject(id);
  if (!project) notFound();
  const [members, phases, taskRows, contentRows, history, peopleRows, files] = await Promise.all([
    db.select().from(projectMembers).where(eq(projectMembers.projectId, id)),
    db.select().from(projectPhases).where(eq(projectPhases.projectId, id)),
    db.select().from(tasks).where(eq(tasks.projectId, id)),
    db.select().from(contents).where(eq(contents.projectId, id)),
    db.select().from(projectHistory).where(eq(projectHistory.projectId, id)),
    listPeople(),
    listFiles(),
  ]);
  const relatedTasks = await keepUnlessDemoOwned(taskRows, (task) => [task.creatorId, task.assigneeId]);
  const relatedContent = await keepUnlessDemoOwned(contentRows, (item) => [item.ownerId, item.creatorId]);
  const names = new Map(peopleRows.map((person) => [person.id, person]));
  const overdue = relatedTasks.filter((task) => isTaskOverdue(task));
  const health = overdue.length > 2 ? "At risk" : overdue.length > 0 ? "Watch" : "On track";
  const healthNote = overdue.length > 2 ? "More than two tasks are past the official deadline." : overdue.length > 0 ? "Some tasks are past the official deadline." : "No overdue tasks on this project.";
  const owner = names.get(project.ownerId);
  const projectFiles = files.filter((file) => file.relatedType === "project" && file.relatedId === id);
  const orderedPhases = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-5">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft size={16} aria-hidden />
        All projects
      </Link>
      <WorkHero
        illustration="projects"
        kicker="Project"
        title={project.name}
        artWash="bg-blue-soft"
        description={project.objective || project.description || "Project record."}
        actions={
          <>
            <Badge tone={statusTone(project.status)}>{project.status}</Badge>
            <Badge tone={statusTone(project.priority)}>{project.priority}</Badge>
            <Link className={linkButton()} href="/files?type=project">Project files</Link>
          </>
        }
      />
      <div className={`rounded-[18px] border px-4 py-3 ${overdue.length > 2 ? "border-error/30 bg-error-soft" : overdue.length > 0 ? "border-yellow/40 bg-yellow-soft" : "border-green/30 bg-green-soft"}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Health</p>
        <p className="text-base font-bold text-text">{health}</p>
        <p className="text-sm text-secondary">{healthNote}</p>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Record</p>
            <h2 className="mt-1 text-lg font-bold">What this project is</h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary">{project.description || "No description yet."}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Owner</dt>
                <dd className="mt-1 text-sm font-semibold">{owner?.fullName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Timeline</dt>
                <dd className="mt-1 text-sm font-semibold">{formatDate(project.startAt)} — {formatDate(project.endAt)}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <h2 className="text-base font-bold">Phases</h2>
            {orderedPhases.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">No phases on this project.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {orderedPhases.map((phase, index) => {
                  const face = statusFace(phase.status);
                  return (
                    <li key={phase.id} className="flex items-center gap-3 rounded-[14px] border border-border px-3 py-2.5">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${face.wash} ${face.ink}`}>{index + 1}</span>
                      <span className="min-w-0 flex-1 text-sm font-semibold">{phase.name}</span>
                      <Badge tone={statusTone(phase.status)}>{phase.status}</Badge>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold"><ListChecks size={18} aria-hidden /> Related tasks</h2>
              <span className="text-sm font-semibold text-secondary">{relatedTasks.length}</span>
            </div>
            {relatedTasks.length === 0 ? (
              <p className="text-sm text-secondary">No tasks on this project.</p>
            ) : (
              <RecordList className="space-y-3" sortLabel="Due">
                {relatedTasks.map((task) => taskCard({ task, assignee: task.assigneeId ? names.get(task.assigneeId)?.fullName : null, project: project.name }))}
              </RecordList>
            )}
          </section>
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Clapperboard size={18} aria-hidden /> Related content</h2>
              <Link className="text-sm font-semibold text-primary" href="/content">Content</Link>
            </div>
            {relatedContent.length === 0 ? (
              <p className="text-sm text-secondary">No content on this project.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {relatedContent.map((item) => (
                  <Link key={item.id} href={`/content/${item.id}`} className="rounded-[16px] border border-border bg-surface px-3 py-3 shadow-[var(--shadow-card)]">
                    <Badge tone={statusTone(item.stage)}>{item.stage}</Badge>
                    <span className="mt-2 block font-semibold text-text">{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
        <div className="space-y-4 xl:sticky xl:top-20">
          <Card>
            <h2 className="text-base font-bold">People</h2>
            <div className="mt-3 space-y-2">
              {owner ? (
                <div className="flex items-center gap-3 rounded-[14px] bg-canvas px-3 py-2.5">
                  <PersonAvatar personId={owner.id} name={owner.fullName} hasPhoto={Boolean(owner.photoStorageKey)} version={owner.updatedAt.getTime()} size="sm" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Owner</p>
                    <p className="text-sm font-semibold">{owner.fullName}</p>
                  </div>
                </div>
              ) : null}
              {members.filter((member) => member.personId !== project.ownerId).map((member) => {
                const person = names.get(member.personId);
                return (
                  <div key={member.id} className="flex items-center gap-3 rounded-[14px] bg-canvas px-3 py-2.5">
                    <PersonAvatar personId={member.personId} name={person?.fullName ?? "Member"} hasPhoto={Boolean(person?.photoStorageKey)} version={person?.updatedAt.getTime()} size="sm" />
                    <div>
                      <p className="text-sm font-semibold">{person?.fullName ?? "Member"}</p>
                      <p className="text-xs text-secondary">{member.roleLabel ? readableLabel(member.roleLabel) : "Member"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <ActionForm action={addProjectMember} submitLabel="Add member">
                <input type="hidden" name="projectId" value={id} />
                <Select name="personId">
                  {peopleRows.map((person) => (
                    <option key={person.id} value={person.id}>{person.fullName}</option>
                  ))}
                </Select>
              </ActionForm>
            </div>
          </Card>
          <Card>
            <h2 className="text-base font-bold">Update project</h2>
            <div className="mt-3">
              <ActionForm action={updateProject} submitLabel="Save">
                <input type="hidden" name="id" value={project.id} />
                <Field label="Name"><Input name="name" defaultValue={project.name} /></Field>
                <Field label="Status">
                  <Select name="status" defaultValue={project.status}>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </Select>
                </Field>
                <Field label="Notes"><Textarea name="notes" defaultValue={project.notes ?? ""} /></Field>
              </ActionForm>
            </div>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">Files</h2>
              <Link className="text-sm font-semibold text-primary" href="/files?type=project">Attach</Link>
            </div>
            <FileCards rows={projectFiles.map((file) => ({ id: file.id, filename: file.filename, uploader: file.uploaderId ? names.get(file.uploaderId)?.fullName ?? null : null, createdAt: file.createdAt }))} />
          </Card>
        </div>
      </div>
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">History</h2>
          <Link className="text-sm font-semibold text-primary" href="/handover">Project handover</Link>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-secondary">No changes recorded yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l-2 border-border pl-5">
            {history.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{formatDateTime(entry.createdAt)}</p>
                <p className="mt-0.5 text-sm leading-relaxed">{readableLabel(entry.field)}: {entry.previousValue || "—"} → {entry.newValue || "—"}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
