"use client";

import { useState } from "react";
import { logPlannedWork, updatePlannedWork } from "@/lib/actions/core";
import { PLANNED_WORK_TYPES } from "@/lib/permissions";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

type Option = { id: string; label: string };

export function PlannedWorkForm({
  defaultDate,
  tasks,
  projects,
  contents,
  existing,
}: {
  defaultDate: string;
  tasks: Option[];
  projects: Option[];
  contents: Option[];
  existing?: {
    id: string;
    title: string;
    workType: string;
    date: string;
    startTime: string;
    endTime: string;
    notes: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const action = existing ? updatePlannedWork : logPlannedWork;
  return (
    <div>
      <Button type="button" variant={existing ? "ghost" : "primary"} onClick={() => setOpen(true)}>
        {existing ? "Reschedule planned work" : "Add Planned Work"}
      </Button>
      {open ? (
        <form
          className="mt-3 space-y-2 rounded-md border border-info/40 bg-primary-light p-3"
          action={async (form) => {
            setError(null);
            try {
              await action(form);
              setOpen(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Unable to save planned work.");
            }
          }}
        >
          <p className="text-xs text-info">Creates planned working time only. Does not create a formal task or change an official deadline.</p>
          {existing ? <input type="hidden" name="id" value={existing.id} /> : null}
          <Field label="Date">
            <Input name="date" type="date" defaultValue={existing?.date ?? defaultDate} required />
          </Field>
          <Field label="Start time">
            <Input name="startTime" type="time" defaultValue={existing?.startTime ?? "09:00"} required />
          </Field>
          <Field label="End time">
            <Input name="endTime" type="time" defaultValue={existing?.endTime ?? "10:00"} required />
          </Field>
          <Field label="Title">
            <Input name="title" defaultValue={existing?.title} required />
          </Field>
          <Field label="Project (optional)">
            <Select name="projectId">
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Related task (optional)">
            <Select name="taskId">
              <option value="">None</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Related content (optional)">
            <Select name="contentId">
              <option value="">None</option>
              {contents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Work type">
            <Select name="workType" defaultValue={existing?.workType ?? "Planned Task Work"}>
              {PLANNED_WORK_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea name="notes" defaultValue={existing?.notes} />
          </Field>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit">Save planned work</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
