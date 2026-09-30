import Link from "next/link";
import { Archive, ArrowRightLeft, FileText, Folder, Link2, ListChecks, NotebookPen, Users } from "lucide-react";
import { db } from "@/lib/db";
import { handoverItems } from "@/lib/db/schema";
import { listFiles, listHandovers, listPeople, listProjects } from "@/lib/queries";
import { PersonAvatar } from "@/components/person-avatar";
import { Badge, Card, EmptyState, statusTone } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { readableLabel } from "@/lib/utils";
import { HandoverForm } from "./handover-form";

const SECTION_ORDER = ["task", "pending_note", "project_update", "template", "link", "folder", "file"] as const;

function sectionTitle(kind: string) {
  if (kind === "task") return "Pending tasks to continue";
  if (kind === "pending_note") return "What to continue";
  if (kind === "project_update") return "Current project update";
  if (kind === "template") return "How to continue";
  if (kind === "link") return "Links";
  if (kind === "folder") return "Folders";
  if (kind === "file") return "Files";
  return readableLabel(kind);
}

function sectionIcon(kind: string) {
  if (kind === "task") return ListChecks;
  if (kind === "link") return Link2;
  if (kind === "folder") return Folder;
  if (kind === "file") return Archive;
  if (kind === "template") return NotebookPen;
  return FileText;
}

export default async function HandoverPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const [rows, peopleRows, projects, allItems, allFiles] = await Promise.all([
    listHandovers(),
    listPeople(),
    listProjects(),
    db.select().from(handoverItems),
    listFiles(),
  ]);
  const peopleById = new Map(peopleRows.map((person) => [person.id, person]));
  const handoverIds = new Set(rows.map((row) => row.id));
  const items = allItems.filter((item) => handoverIds.has(item.handoverId));
  const fileRows = allFiles.filter((file) => file.relatedType === "handover" && file.relatedId && handoverIds.has(file.relatedId));
  const projectName = (id?: string | null) => projects.find((project) => project.id === id)?.name;
  const name = (id?: string | null) => (id ? peopleById.get(id)?.fullName ?? "Person" : "Unassigned");
  const statuses = [...new Set(rows.map((row) => row.status))];
  const filtered = status === "all" ? rows : rows.filter((row) => row.status === status);
  const involved = new Set(rows.flatMap((row) => [row.outgoingPersonId, row.incomingPersonId].filter((id): id is string => Boolean(id))));
  const summary = rows.length === 0
    ? "A handover carries pending work, the project update, how to continue, and the files, links, and folders that go with it."
    : `${rows.length} ${rows.length === 1 ? "handover" : "handovers"}, ${items.length} pieces of context, ${fileRows.length} ${fileRows.length === 1 ? "file" : "files"}.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="team"
        kicker="Handover"
        title="Pass the work on"
        artWash="bg-pink-soft"
        description={summary}
        actions={
          <>
            <a className={linkButton("primary")} href="#start-handover">Start a handover</a>
            <Link className={linkButton()} href="/files">Files</Link>
            <Link className={linkButton()} href="/team">Team</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Handovers" value={rows.length} note="Transfers of context between people." icon={ArrowRightLeft} wash="bg-pink-soft" ink="text-pink" href="/handover" />
        <Metric label="Context" value={items.length} note="Tasks, notes, links, folders, and files." icon={NotebookPen} wash="bg-yellow-soft" ink="text-warning" />
        <Metric label="Files" value={fileRows.length} note="Files stored on a handover." icon={Archive} wash="bg-blue-soft" ink="text-info" href="/files" />
        <Metric label="People" value={involved.size} note="Outgoing and incoming people on these records." icon={Users} wash="bg-purple-soft" ink="text-purple" href="/team" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 space-y-4">
          <ViewPills
            items={[
              { key: "all", href: "/handover", label: "All", active: status === "all", count: rows.length },
              ...statuses.map((item) => ({
                key: item,
                href: `/handover?status=${item}`,
                label: readableLabel(item),
                active: status === item,
                count: rows.filter((row) => row.status === item).length,
              })),
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState illustration="empty-folder" title="No handovers in this view" body="Start a handover when responsibility changes. Open tasks stay on the task record." />
          ) : (
            <RecordList className="space-y-3" sortLabel="Started">
              {filtered.map((handover) => {
                const outgoing = peopleById.get(handover.outgoingPersonId);
                const incoming = handover.incomingPersonId ? peopleById.get(handover.incomingPersonId) : null;
                const own = items.filter((item) => item.handoverId === handover.id);
                const kinds = SECTION_ORDER.filter((kind) => own.some((item) => item.kind === kind));
                return (
                  <article
                    key={handover.id}
                    data-record=""
                    data-sort={handover.createdAt ? new Date(handover.createdAt).toISOString() : ""}
                    data-label-text={`${name(handover.outgoingPersonId)} ${name(handover.incomingPersonId)} ${handover.status} ${handover.notes ?? ""} ${own.map((item) => item.summary).join(" ")}`}
                    className="rounded-[18px] border border-border bg-surface px-4 py-4 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <PersonAvatar personId={handover.outgoingPersonId} name={outgoing?.fullName ?? "Outgoing"} hasPhoto={Boolean(outgoing?.photoStorageKey)} version={outgoing?.updatedAt.getTime()} size="sm" />
                        <ArrowRightLeft size={16} className="shrink-0 text-pink" aria-hidden />
                        {incoming ? (
                          <PersonAvatar personId={incoming.id} name={incoming.fullName} hasPhoto={Boolean(incoming.photoStorageKey)} version={incoming.updatedAt.getTime()} size="sm" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-xs font-bold text-muted">?</span>
                        )}
                        <span className="min-w-0">
                          <span className="block text-base font-bold text-text">
                            {outgoing ? <Link href={`/team/${outgoing.id}`} className="hover:text-primary">{outgoing.fullName}</Link> : name(handover.outgoingPersonId)}
                            {" → "}
                            {incoming ? <Link href={`/team/${incoming.id}`} className="hover:text-primary">{incoming.fullName}</Link> : "Unassigned"}
                          </span>
                          <span className="block text-xs text-secondary">Outgoing person to the person taking over.</span>
                        </span>
                      </div>
                      <Badge tone={statusTone(handover.status)}>{readableLabel(handover.status)}</Badge>
                    </div>
                    {handover.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-secondary">{handover.notes}</p> : null}
                    <div className="mt-4 space-y-4">
                      {kinds.map((kind) => {
                        const group = own.filter((item) => item.kind === kind);
                        const Icon = sectionIcon(kind);
                        return (
                          <section key={kind}>
                            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                              <Icon size={14} aria-hidden />
                              {sectionTitle(kind)}
                            </h2>
                            <ul className="space-y-2">
                              {group.map((item) => {
                                const file = kind === "file" ? fileRows.find((row) => row.id === item.relatedId) : null;
                                const isZip = file?.category === "zip" || item.summary.toLowerCase().endsWith(".zip");
                                return (
                                  <li key={item.id} className="rounded-[12px] bg-canvas px-3 py-2 text-sm">
                                    {kind === "task" && item.relatedId ? (
                                      <Link className="font-semibold text-info" href={`/tasks/${item.relatedId}`}>{item.summary}</Link>
                                    ) : kind === "link" && item.relatedId ? (
                                      <a className="font-semibold text-info" href={item.relatedId} target="_blank" rel="noreferrer">{item.summary}</a>
                                    ) : kind === "folder" && item.relatedId ? (
                                      <span>
                                        <span className="font-semibold">{item.summary}</span>
                                        {item.relatedId.startsWith("http") ? (
                                          <a className="mt-1 block break-all text-info" href={item.relatedId} target="_blank" rel="noreferrer">{item.relatedId}</a>
                                        ) : (
                                          <span className="mt-1 block break-all text-secondary">{item.relatedId}</span>
                                        )}
                                      </span>
                                    ) : kind === "file" ? (
                                      <span className="inline-flex flex-wrap items-center gap-2 font-semibold">
                                        {isZip ? <Archive size={14} aria-hidden /> : <FileText size={14} aria-hidden />}
                                        {file ? <a className="text-info" href={`/api/files/${file.id}`}>{item.summary}</a> : item.summary}
                                        {isZip ? <span className="text-xs font-medium text-muted">Zip</span> : null}
                                      </span>
                                    ) : kind === "project_update" ? (
                                      <span>
                                        {item.relatedId ? <span className="mb-1 block text-xs font-semibold text-muted">{projectName(item.relatedId) ?? "Project"}</span> : null}
                                        <span className="whitespace-pre-wrap">{item.summary}</span>
                                      </span>
                                    ) : (
                                      <span className="whitespace-pre-wrap">{item.summary}</span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </section>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </RecordList>
          )}
        </section>
        <Card id="start-handover" className="xl:sticky xl:top-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Template</p>
          <h2 className="mt-1 text-lg font-bold">Start a handover</h2>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">Pending work, the project update, how to continue, then the links, folders, and files. Open tasks stay on their own records.</p>
          <HandoverForm
            people={peopleRows.filter((person) => person.organizationalStatus !== "deleted").map((person) => ({ id: person.id, fullName: person.fullName }))}
            projects={projects.map((project) => ({ id: project.id, name: project.name }))}
          />
        </Card>
      </div>
    </div>
  );
}
