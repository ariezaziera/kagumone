import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { db } from "@/lib/db";
import { contentApprovals, contentBenchmarks, contentQc, contentPublications } from "@/lib/db/schema";
import { moveContentStage } from "@/lib/actions/core";
import { getContent, listFiles, listPeople, listProjects } from "@/lib/queries";
import { CONTENT_STAGES } from "@/lib/permissions";
import { FileCards } from "@/components/record-files";
import { Badge, Button, Card, statusTone } from "@/components/ui";
import { WorkHero, linkButton } from "@/components/work-surface";
import { formatDateTime, readableLabel } from "@/lib/utils";

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await getContent(id);
  if (!content) notFound();
  const [qc, pubs, approvals, benchmarks, projects, people, files] = await Promise.all([
    db.select().from(contentQc).where(eq(contentQc.contentId, id)),
    db.select().from(contentPublications).where(eq(contentPublications.contentId, id)),
    db.select().from(contentApprovals).where(eq(contentApprovals.contentId, id)),
    db.select().from(contentBenchmarks).where(eq(contentBenchmarks.contentId, id)),
    listProjects(),
    listPeople(),
    listFiles(),
  ]);
  const project = projects.find((item) => item.id === content.projectId);
  const names = new Map(people.map((person) => [person.id, person.fullName]));
  const current = CONTENT_STAGES.indexOf(content.stage as (typeof CONTENT_STAGES)[number]);
  const attached = files.filter((file) => file.relatedType === "content" && file.relatedId === id);

  return (
    <div className="space-y-5">
      <Link href="/content" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft size={16} aria-hidden />
        All content
      </Link>
      <WorkHero
        illustration="content"
        kicker="Content"
        title={content.title}
        artWash="bg-purple-soft"
        description={`${content.pillar ? readableLabel(content.pillar) : "No pillar"} · ${content.platform ? readableLabel(content.platform) : "No platform"}`}
        actions={
          <>
            <Badge tone={statusTone(content.stage)}>{content.stage}</Badge>
            <Link className={linkButton("primary")} href={`/content/${id}/qc`}>Open QC</Link>
            {content.stage === "ready_to_post" ? <Link className={linkButton()} href="/publishing">Publishing</Link> : null}
          </>
        }
      />
      <div className="rounded-[18px] border border-border bg-surface p-3 shadow-[var(--shadow-card)] sm:p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Stage</p>
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {CONTENT_STAGES.map((stage, index) => {
            const state = current < 0 ? "upcoming" : index < current ? "done" : index === current ? "current" : "upcoming";
            return (
              <li key={stage} className="min-w-[7.5rem] flex-1">
                {stage === content.stage ? (
                  <span className="block rounded-[14px] bg-purple-soft px-3 py-2 text-[11px] font-semibold leading-snug text-purple" aria-current="step">{readableLabel(stage)}</span>
                ) : (
                  <form action={async () => { "use server"; await moveContentStage(id, stage); }}>
                    <Button type="submit" variant="secondary" className={`h-auto w-full whitespace-normal px-3 py-2 text-left text-[11px] ${state === "done" ? "border-purple/30" : ""}`}>{readableLabel(stage)}</Button>
                  </form>
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-secondary">Moving into self QC, QC1, or QC2 also records a pending QC entry. Publishing a live post is done from Publishing.</p>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">The piece</p>
          <h2 className="mt-1 text-lg font-bold">Brief and copy</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-secondary">{content.brief || "No brief yet."}</p>
          {content.caption ? <p className="mt-3 whitespace-pre-wrap rounded-[14px] bg-canvas px-3 py-2.5 text-sm">{content.caption}</p> : null}
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Project</dt>
              <dd className="mt-1 text-sm font-semibold">{project ? <Link className="text-info" href={`/projects/${project.id}`}>{project.name}</Link> : "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Owner</dt>
              <dd className="mt-1 text-sm font-semibold">{content.ownerId ? names.get(content.ownerId) ?? "—" : "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Planned publish</dt>
              <dd className="mt-1 text-sm font-semibold">{formatDateTime(content.plannedPublishAt)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Actual publish</dt>
              <dd className="mt-1 text-sm font-semibold">{formatDateTime(content.actualPublishAt)}</dd>
            </div>
          </dl>
        </Card>
        <div className="space-y-4">
          <Card accent="purple">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-purple-soft text-purple"><ClipboardCheck size={18} aria-hidden /></span>
              <div>
                <h2 className="text-base font-bold">QC</h2>
                <p className="mt-1 text-xs leading-relaxed text-secondary">Checklist, comments, and correction requests are recorded on the QC page.</p>
                <Link className={`${linkButton("primary")} mt-3`} href={`/content/${id}/qc`}>Record a QC decision</Link>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="text-base font-bold">Files</h2>
            <div className="mt-3">
              <FileCards rows={attached.map((file) => ({ id: file.id, filename: file.filename, uploader: file.uploaderId ? names.get(file.uploaderId) ?? null : null, createdAt: file.createdAt }))} />
            </div>
            <Link className="mt-3 inline-block text-sm font-semibold text-primary" href="/files?type=content">Attach a file</Link>
          </Card>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-base font-bold">QC history</h2>
          {qc.length === 0 ? <p className="mt-3 text-sm text-secondary">No QC records yet.</p> : (
            <ul className="mt-3 space-y-2">
              {qc.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 rounded-[12px] bg-canvas px-3 py-2.5 text-sm">
                  <span className="font-semibold">{readableLabel(entry.stage)}</span>
                  <Badge tone={statusTone(entry.status)}>{entry.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="text-base font-bold">Publications</h2>
          {pubs.length === 0 ? <p className="mt-3 text-sm text-secondary">Nothing published yet.</p> : (
            <ul className="mt-3 space-y-2">
              {pubs.map((entry) => (
                <li key={entry.id} className="rounded-[12px] bg-canvas px-3 py-2.5 text-sm">
                  <span className="font-semibold">{readableLabel(entry.platform)}</span>
                  {entry.url ? <a className="mt-0.5 block truncate text-info" href={entry.url}>{entry.url}</a> : null}
                </li>
              ))}
            </ul>
          )}
          <h2 className="mt-4 text-base font-bold">Benchmarks</h2>
          {benchmarks.length === 0 ? <p className="mt-2 text-sm text-secondary">No benchmarks.</p> : (
            <ul className="mt-2 space-y-2">
              {benchmarks.map((entry) => (
                <li key={entry.id} className="truncate text-sm">{entry.sourceUrl ? <a className="text-info" href={entry.sourceUrl}>{entry.sourceUrl}</a> : "—"}</li>
              ))}
            </ul>
          )}
          <h2 className="mt-4 text-base font-bold">Approvals</h2>
          {approvals.length === 0 ? <p className="mt-2 text-sm text-secondary">No approval records.</p> : (
            <ul className="mt-2 flex flex-wrap gap-2">{approvals.map((entry) => <li key={entry.id}><Badge tone={statusTone(entry.status)}>{entry.status}</Badge></li>)}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}
