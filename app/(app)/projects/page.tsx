import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCheck, FolderKanban, PauseCircle, PlayCircle } from "lucide-react";
import { createProject } from "@/lib/actions/core";
import { listPeople, listProjects } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, Select, Textarea, statusTone } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton, priorityBar } from "@/components/work-surface";
import { getAuthContext } from "@/lib/auth/context";
import { formatDate, readableLabel } from "@/lib/utils";

const TABS = ["all", "planning", "active", "completed", "archived"] as const;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { tab = "all" } = await searchParams;
  const [rows, peopleRows] = await Promise.all([listProjects(), listPeople()]);
  const names = new Map(peopleRows.map((person) => [person.id, person.fullName]));
  const filtered = tab === "all" ? rows : rows.filter((project) => project.status === tab);
  const active = rows.filter((project) => project.status === "active").length;
  const planning = rows.filter((project) => project.status === "planning").length;
  const summary = rows.length === 0 ? "No projects yet. A project keeps the owner, timeline, tasks, and content together." : `${active} active and ${planning} in planning, out of ${rows.length} projects.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="projects"
        kicker="Projects"
        title="Project records"
        artWash="bg-blue-soft"
        description={summary}
        actions={
          <>
            <a className={linkButton("primary")} href="#create-project">Create project</a>
            <Link className={linkButton()} href="/content">Content</Link>
            <Link className={linkButton()} href="/files">Files</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Projects" value={rows.length} note="Every project record." icon={FolderKanban} wash="bg-blue-soft" ink="text-info" href="/projects" />
        <Metric label="Planning" value={planning} note="Not started as active work." icon={PauseCircle} wash="bg-yellow-soft" ink="text-warning" href="/projects?tab=planning" />
        <Metric label="Active" value={active} note="Work is underway." icon={PlayCircle} wash="bg-purple-soft" ink="text-purple" href="/projects?tab=active" />
        <Metric label="Completed" value={rows.filter((project) => project.status === "completed").length} note="Closed project records." icon={CheckCheck} wash="bg-green-soft" ink="text-success" href="/projects?tab=completed" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4">
          <ViewPills
            items={TABS.map((key) => ({
              key,
              href: key === "all" ? "/projects" : `/projects?tab=${key}`,
              label: key === "all" ? "All" : readableLabel(key),
              active: tab === key,
              count: key === "all" ? rows.length : rows.filter((project) => project.status === key).length,
            }))}
          />
          {filtered.length === 0 ? (
            <EmptyState title="No projects yet" body="Create a project to start capturing the work." />
          ) : (
            <RecordList className="space-y-3" sortLabel="Updated">
              {filtered.map((project) => (
                <article
                  key={project.id}
                  data-record=""
                  data-sort={project.updatedAt ? new Date(project.updatedAt).toISOString() : ""}
                  data-label-text={`${project.name} ${project.status} ${project.priority} ${names.get(project.ownerId) ?? ""} ${project.objective ?? ""}`}
                  className="relative overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]"
                >
                  <span className={`absolute inset-y-0 left-0 w-1.5 ${priorityBar(project.priority)}`} aria-hidden />
                  <Link href={`/projects/${project.id}`} className="block px-4 py-3.5 pl-5">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={statusTone(project.status)}>{project.status}</Badge>
                      <Badge tone={statusTone(project.priority)}>{project.priority}</Badge>
                    </span>
                    <span className="mt-1.5 block text-base font-bold text-text">{project.name}</span>
                    {project.objective ? <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-secondary">{project.objective}</span> : null}
                    <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-secondary">
                      <span>{names.get(project.ownerId) ?? "No owner"}</span>
                      <span>
                        {formatDate(project.startAt)} — {formatDate(project.endAt)}
                      </span>
                      <span>Updated {formatDate(project.updatedAt)}</span>
                    </span>
                  </Link>
                </article>
              ))}
            </RecordList>
          )}
        </section>
        <Card id="create-project" className="xl:sticky xl:top-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">New record</p>
          <h2 className="mt-1 text-lg font-bold">Create project</h2>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">Name, objective, and owner live on the project record.</p>
          <ActionForm action={createProject} submitLabel="Create project">
            <Field label="Name">
              <Input name="name" required />
            </Field>
            <Field label="Objective">
              <Textarea name="objective" />
            </Field>
            <Field label="Description">
              <Textarea name="description" />
            </Field>
            <Field label="Owner">
              <Select name="ownerId" defaultValue={ctx.person.id}>
                {peopleRows.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select name="priority" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
