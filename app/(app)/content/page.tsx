import Link from "next/link";
import { Clapperboard, Megaphone, PenLine, Send } from "lucide-react";
import { createContent } from "@/lib/actions/core";
import { listContents, listProjects } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, Select, Textarea, statusTone } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { CONTENT_STAGES } from "@/lib/permissions";
import { formatDateTime, readableLabel } from "@/lib/utils";

const PRODUCTION = new Set(["production", "self_qc", "qc1", "corrections_qc1", "qc2", "corrections_qc2", "final_approval"]);

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const { stage = "all" } = await searchParams;
  const [rows, projects] = await Promise.all([listContents(), listProjects()]);
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const filtered = stage === "all" ? rows : rows.filter((item) => item.stage === stage);
  const visibleStages = CONTENT_STAGES.filter((item) => rows.some((row) => row.stage === item) || item === stage);
  const summary = rows.length === 0 ? "No content records yet. Planned, in production, and published stay as separate stages." : `${rows.filter((item) => PRODUCTION.has(item.stage)).length} in production, ${rows.filter((item) => item.stage === "ready_to_post").length} ready to post, ${rows.filter((item) => item.stage === "published").length} published.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="content"
        kicker="Content"
        title="Production board"
        artWash="bg-purple-soft"
        description={summary}
        actions={
          <>
            <a className={linkButton("primary")} href="#add-content">Add content</a>
            <Link className={linkButton()} href="/publishing">Publishing</Link>
            <Link className={linkButton()} href="/projects">Projects</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Records" value={rows.length} note="Every content record." icon={Clapperboard} wash="bg-purple-soft" ink="text-purple" href="/content" />
        <Metric label="In production" value={rows.filter((item) => PRODUCTION.has(item.stage)).length} note="From production through final approval." icon={PenLine} wash="bg-yellow-soft" ink="text-warning" />
        <Metric label="Ready to post" value={rows.filter((item) => item.stage === "ready_to_post").length} note="Approved and waiting for a publication record." icon={Send} wash="bg-orange-soft" ink="text-orange" href="/publishing" />
        <Metric label="Published" value={rows.filter((item) => item.stage === "published").length} note="A publication has been recorded." icon={Megaphone} wash="bg-green-soft" ink="text-success" href="/content?stage=published" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4">
          <ViewPills
            items={[
              { key: "all", href: "/content", label: "All", active: stage === "all", count: rows.length },
              ...visibleStages.map((item) => ({
                key: item,
                href: `/content?stage=${item}`,
                label: readableLabel(item),
                active: stage === item,
                count: rows.filter((row) => row.stage === item).length,
              })),
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState title="No content records" body="Create a content item to start the production and QC loop." />
          ) : (
            <RecordList className="space-y-3" sortLabel="Publish">
              {filtered.map((item) => (
                <article
                  key={item.id}
                  data-record=""
                  data-sort={item.plannedPublishAt ? new Date(item.plannedPublishAt).toISOString() : ""}
                  data-label-text={`${item.title} ${item.stage} ${item.platform ?? ""} ${item.pillar ?? ""} ${item.brief ?? ""}`}
                  className="rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]"
                >
                  <Link href={`/content/${item.id}`} className="block px-4 py-3.5">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={statusTone(item.stage)}>{item.stage}</Badge>
                      {item.platform ? <Badge tone="purple">{item.platform}</Badge> : null}
                      {item.pillar ? <Badge tone="neutral">{item.pillar}</Badge> : null}
                    </span>
                    <span className="mt-1.5 block text-base font-bold text-text">{item.title}</span>
                    {item.brief ? <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-secondary">{item.brief}</span> : null}
                    <span className="mt-2 flex flex-wrap gap-x-3 text-xs text-secondary">
                      <span>{item.projectId ? projectNames.get(item.projectId) ?? "Project" : "No project"}</span>
                      <span>{item.plannedPublishAt ? `Planned ${formatDateTime(item.plannedPublishAt)}` : "No planned publish time"}</span>
                    </span>
                  </Link>
                </article>
              ))}
            </RecordList>
          )}
        </section>
        <Card id="add-content" className="xl:sticky xl:top-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">New record</p>
          <h2 className="mt-1 text-lg font-bold">Add content</h2>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">A new record starts the production and QC loop. Planned is not the same as published.</p>
          <ActionForm action={createContent} submitLabel="Create content">
            <Field label="Title"><Input name="title" required /></Field>
            <Field label="Pillar"><Input name="pillar" /></Field>
            <Field label="Platform">
              <Select name="platform">
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
              </Select>
            </Field>
            <Field label="Project">
              <Select name="projectId">
                <option value="">None</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Brief"><Textarea name="brief" /></Field>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
