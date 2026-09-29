import Link from "next/link";
import { FileText, FolderKanban, Paperclip } from "lucide-react";
import { listContents, listEquipment, listFiles, listHandovers, listKnowledge, listPeople, listProjects, listTasks } from "@/lib/queries";
import { Card, EmptyState } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { FileUpload } from "./upload";
import { linkedFileCard, type FileTarget } from "@/components/record-files";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { formatDate } from "@/lib/utils";

const TYPES = ["project", "task", "content", "equipment", "handover", "knowledge"] as const;

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "all" } = await searchParams;
  const [rows, people, projects, tasks, contents, equipment, handovers, knowledge] = await Promise.all([
    listFiles(),
    listPeople(),
    listProjects(),
    listTasks(),
    listContents(),
    listEquipment(),
    listHandovers(),
    listKnowledge(),
  ]);
  const names = new Map(people.map((person) => [person.id, person.fullName]));
  const labels = new Map<string, string>();
  const targets: FileTarget[] = [
    ...projects.map((project) => ({ type: "project", id: project.id, label: project.name })),
    ...tasks.map((task) => ({ type: "task", id: task.id, label: task.title })),
    ...contents.map((item) => ({ type: "content", id: item.id, label: item.title })),
    ...equipment.map((item) => ({ type: "equipment", id: item.id, label: `${item.name} · ${item.assetCode}` })),
    ...handovers.map((item) => ({
      type: "handover",
      id: item.id,
      label: `${names.get(item.outgoingPersonId) ?? "Outgoing"} → ${item.incomingPersonId ? names.get(item.incomingPersonId) ?? "Incoming" : "Unassigned"} · ${formatDate(item.createdAt)}`,
    })),
    ...knowledge.map((item) => ({ type: "knowledge", id: item.id, label: item.title })),
  ];
  for (const target of targets) labels.set(`${target.type}:${target.id}`, target.label);
  const filtered = type === "all" ? rows : rows.filter((file) => file.relatedType === type);
  const summary = rows.length === 0 ? "Attach a file to a project, task, content item, piece of equipment, handover, or knowledge record. You open it again from this list." : `${rows.length} file${rows.length === 1 ? "" : "s"} attached to operational records. Open a file here, or follow it back to its record.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="projects"
        kicker="Files"
        title="Evidence"
        artWash="bg-blue-soft"
        description={summary}
        actions={
          <>
            <a className={linkButton("primary")} href="#attach-file">
              Attach a file
            </a>
            <Link className={linkButton()} href="/projects">
              Projects
            </Link>
            <Link className={linkButton()} href="/content">
              Content
            </Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Files" value={rows.length} note="Stored against a record, not loose." icon={Paperclip} wash="bg-blue-soft" ink="text-info" />
        <Metric label="On projects" value={rows.filter((file) => file.relatedType === "project").length} note="Briefs, decks, and project evidence." icon={FolderKanban} wash="bg-blue-soft" ink="text-info" href="/files?type=project" />
        <Metric label="On tasks" value={rows.filter((file) => file.relatedType === "task").length} note="Files attached to a task record." icon={FileText} wash="bg-yellow-soft" ink="text-warning" href="/files?type=task" />
        <Metric label="On content" value={rows.filter((file) => file.relatedType === "content").length} note="Assets and references for a content item." icon={FileText} wash="bg-purple-soft" ink="text-purple" href="/files?type=content" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4">
          <ViewPills
            items={[
              { key: "all", href: "/files", label: "All", active: type === "all", count: rows.length },
              ...TYPES.map((item) => ({
                key: item,
                href: `/files?type=${item}`,
                label: item.charAt(0).toUpperCase() + item.slice(1),
                active: type === item,
                count: rows.filter((file) => file.relatedType === item).length,
              })),
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState illustration="empty-folder" title="No files yet" body="Choose the record first, then attach the file. It can be opened from this list." />
          ) : (
            <RecordList className="space-y-3" sortLabel="Uploaded">
              {filtered.map((file) =>
                linkedFileCard({
                  id: file.id,
                  filename: file.filename,
                  relatedType: file.relatedType,
                  relatedId: file.relatedId,
                  relatedLabel: file.relatedType && file.relatedId ? labels.get(`${file.relatedType}:${file.relatedId}`) ?? null : null,
                  uploader: file.uploaderId ? names.get(file.uploaderId) ?? null : null,
                  createdAt: file.createdAt,
                }),
              )}
            </RecordList>
          )}
        </section>
        <Card id="attach-file" className="xl:sticky xl:top-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Attach</p>
          <h2 className="mt-1 text-lg font-bold">Add evidence</h2>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">Pick the record by name. The file stays on that record and opens from the list.</p>
          <FileUpload targets={targets} />
        </Card>
      </div>
    </div>
  );
}
