import Link from "next/link";
import { Archive, FileText, Folder, Link2, ListChecks, NotebookPen } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files, handoverItems } from "@/lib/db/schema";
import { listHandovers, listPeople, listProjects } from "@/lib/queries";
import { Badge, Card, EmptyState, PageHeader, statusTone } from "@/components/ui";
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
  return kind.replaceAll("_", " ");
}

export default async function HandoverPage() {
  const [rows, peopleRows, projects] = await Promise.all([listHandovers(), listPeople(), listProjects()]);
  const [items, fileRows] = await Promise.all([db.select().from(handoverItems), db.select().from(files).where(eq(files.relatedType, "handover"))]);
  const name = (id?: string | null) => peopleRows.find((person) => person.id === id)?.fullName ?? "Unassigned";
  const projectName = (id?: string | null) => projects.find((project) => project.id === id)?.name;

  return (
    <div>
      <PageHeader
        module="admin"
        title="Handover"
        description="A structured transfer of context: pending work, the project update, how to continue, and the files, links, and folders that go with it. It does not copy tasks as the handover itself."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          {rows.length === 0 ? (
            <EmptyState title="No handovers" body="Start a handover when responsibility changes." illustration="empty-folder" />
          ) : (
            rows.map((handover) => {
              const own = items.filter((item) => item.handoverId === handover.id);
              const kinds = SECTION_ORDER.filter((kind) => own.some((item) => item.kind === kind));
              return (
                <Card key={handover.id} accent="charcoal">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold">
                        {name(handover.outgoingPersonId)} → {name(handover.incomingPersonId)}
                      </p>
                      <p className="mt-1 text-sm text-secondary">Outgoing person to the person taking over.</p>
                    </div>
                    <Badge tone={statusTone(handover.status)}>{handover.status}</Badge>
                  </div>
                  {handover.notes ? <p className="mt-3 whitespace-pre-wrap text-sm">{handover.notes}</p> : null}
                  <div className="mt-4 space-y-4">
                    {kinds.map((kind) => {
                      const group = own.filter((item) => item.kind === kind);
                      const Icon = kind === "task" ? ListChecks : kind === "link" ? Link2 : kind === "folder" ? Folder : kind === "file" ? Archive : kind === "template" ? NotebookPen : FileText;
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
                                    <Link className="font-semibold text-info" href={`/tasks/${item.relatedId}`}>
                                      {item.summary}
                                    </Link>
                                  ) : kind === "link" && item.relatedId ? (
                                    <a className="font-semibold text-info" href={item.relatedId} target="_blank" rel="noreferrer">
                                      {item.summary}
                                    </a>
                                  ) : kind === "folder" && item.relatedId ? (
                                    <span>
                                      <span className="font-semibold">{item.summary}</span>
                                      {item.relatedId.startsWith("http") ? (
                                        <a className="mt-1 block break-all text-info" href={item.relatedId} target="_blank" rel="noreferrer">
                                          {item.relatedId}
                                        </a>
                                      ) : (
                                        <span className="mt-1 block break-all text-secondary">{item.relatedId}</span>
                                      )}
                                    </span>
                                  ) : kind === "file" ? (
                                    <span className="inline-flex items-center gap-2 font-semibold">
                                      {isZip ? <Archive size={14} aria-hidden /> : <FileText size={14} aria-hidden />}
                                      {item.summary}
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
                </Card>
              );
            })
          )}
        </div>
        <Card>
          <h2 className="mb-1 font-semibold">Start a handover</h2>
          <p className="mb-4 text-sm text-secondary">Use this as the template: pending work, the project update, how to continue, then the links, folders, and files.</p>
          <HandoverForm
            people={peopleRows.map((person) => ({ id: person.id, fullName: person.fullName }))}
            projects={projects.map((project) => ({ id: project.id, name: project.name }))}
          />
        </Card>
      </div>
    </div>
  );
}
