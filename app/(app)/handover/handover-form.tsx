"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, Link2, Plus, Trash2 } from "lucide-react";
import { addHandoverFile, createHandover } from "@/lib/actions/core";
import { Button, Field, Input, Select, Textarea, iconButtonClass } from "@/components/ui";

type RefRow = { label: string; url: string };
type PersonOption = { id: string; fullName: string };
type ProjectOption = { id: string; name: string };

const emptyRef = (): RefRow => ({ label: "", url: "" });

export function HandoverForm({ people, projects }: { people: PersonOption[]; projects: ProjectOption[] }) {
  const router = useRouter();
  const [links, setLinks] = useState<RefRow[]>([emptyRef()]);
  const [folders, setFolders] = useState<RefRow[]>([emptyRef()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(rows: RefRow[], index: number, key: keyof RefRow, value: string) {
    return rows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setPending(true);
    try {
      const data = new FormData(form);
      data.delete("files");
      data.set(
        "links",
        JSON.stringify(links.filter((row) => row.label.trim() && row.url.trim())),
      );
      data.set(
        "folders",
        JSON.stringify(folders.filter((row) => row.label.trim() && row.url.trim())),
      );
      const created = await createHandover(data);
      const fileInput = form.elements.namedItem("files");
      const files = fileInput instanceof HTMLInputElement && fileInput.files ? [...fileInput.files] : [];
      for (const file of files) {
        const upload = new FormData();
        upload.set("file", file);
        upload.set("relatedType", "handover");
        upload.set("relatedId", created.id);
        upload.set("category", file.name.toLowerCase().endsWith(".zip") ? "zip" : "file");
        const response = await fetch("/api/files/upload", { method: "POST", body: upload });
        const json = (await response.json()) as { id?: string; error?: string };
        if (!response.ok || !json.id) throw new Error(json.error ?? `Could not upload ${file.name}.`);
        await addHandoverFile(created.id, json.id, file.name);
      }
      form.reset();
      setLinks([emptyRef()]);
      setFolders([emptyRef()]);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the handover.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Outgoing person">
          <Select name="outgoingPersonId" required defaultValue={people[0]?.id}>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Incoming person">
          <Select name="incomingPersonId" defaultValue={people[1]?.id ?? people[0]?.id}>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Pending work to continue">
        <Textarea name="pendingNote" placeholder="What is still open, who is waiting, and what should happen next." />
      </Field>
      <p className="text-xs text-secondary">Open tasks for the outgoing person are listed on the handover automatically. This note is the context around them.</p>
      <Field label="Project">
        <Select name="projectId" defaultValue="">
          <option value="">No specific project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Current project update">
        <Textarea name="projectUpdate" placeholder="Where the project stands, what changed, and what the next person should know." />
      </Field>
      <Field label="How to continue">
        <Textarea name="templateNote" placeholder="The working method, template, checklist, or steps the next person should follow." />
      </Field>
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Link2 size={14} aria-hidden /> Links
          </p>
          <button type="button" className={iconButtonClass("h-8 gap-1 px-2 text-xs font-semibold")} onClick={() => setLinks([...links, emptyRef()])}>
            <Plus size={14} /> Add link
          </button>
        </div>
        <div className="space-y-2">
          {links.map((row, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input aria-label="Link label" placeholder="Label" value={row.label} onChange={(event) => setLinks(update(links, index, "label", event.target.value))} />
              <Input aria-label="Link URL" placeholder="https://" value={row.url} onChange={(event) => setLinks(update(links, index, "url", event.target.value))} />
              <button type="button" className={iconButtonClass("h-10 w-10")} aria-label="Remove link" onClick={() => setLinks(links.filter((_, i) => i !== index).length ? links.filter((_, i) => i !== index) : [emptyRef()])}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Folder size={14} aria-hidden /> Folders
          </p>
          <button type="button" className={iconButtonClass("h-8 gap-1 px-2 text-xs font-semibold")} onClick={() => setFolders([...folders, emptyRef()])}>
            <Plus size={14} /> Add folder
          </button>
        </div>
        <div className="space-y-2">
          {folders.map((row, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input aria-label="Folder label" placeholder="Folder name" value={row.label} onChange={(event) => setFolders(update(folders, index, "label", event.target.value))} />
              <Input aria-label="Folder location" placeholder="Shared drive link or path" value={row.url} onChange={(event) => setFolders(update(folders, index, "url", event.target.value))} />
              <button type="button" className={iconButtonClass("h-10 w-10")} aria-label="Remove folder" onClick={() => setFolders(folders.filter((_, i) => i !== index).length ? folders.filter((_, i) => i !== index) : [emptyRef()])}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <Field label="Files, including zip archives">
        <Input name="files" type="file" multiple accept=".zip,.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/zip" />
      </Field>
      <Field label="Other notes">
        <Textarea name="notes" placeholder="Risks, access, or anything else that should travel with this handover." />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving handover…" : "Start handover"}
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </form>
  );
}
