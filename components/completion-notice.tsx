"use client";

import { useMemo, useState } from "react";
import { completeTask } from "@/lib/actions/core";
import { COLLAB_ROLES } from "@/lib/permissions";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

type Person = { id: string; fullName: string };

type Deliverable = { label: string; url: string; description: string; deliverableType: string; notes: string };
type Collab = { personId: string; roleInTask: string; contribution: string; notes: string };

const emptyDeliverable = (): Deliverable => ({
  label: "",
  url: "",
  description: "",
  deliverableType: "",
  notes: "",
});

export function CompletionNotice({
  taskId,
  people,
  ownerId,
}: {
  taskId: string;
  people: Person[];
  ownerId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [learned, setLearned] = useState("");
  const [doDifferently, setDoDifferently] = useState("");
  const [rememberNext, setRememberNext] = useState("");
  const [problems, setProblems] = useState("");
  const [workCompletedAt, setWorkCompletedAt] = useState("");
  const [deliverables, setDeliverables] = useState<Deliverable[]>([emptyDeliverable()]);
  const [collabs, setCollabs] = useState<Collab[]>([]);

  const missing = useMemo(() => {
    const items: string[] = [];
    if (summary.trim().length < 2) items.push("What was done?");
    if (learned.trim().length < 2) items.push("What did you learn from this task?");
    if (doDifferently.trim().length < 2) items.push("What would you do differently next time?");
    if (rememberNext.trim().length < 2) items.push("What knowledge, process, or technique should be remembered?");
    if (!workCompletedAt) items.push("Work Completed At");
    const validDeliverables = deliverables.filter((d) => d.description.trim().length >= 2);
    if (validDeliverables.length === 0) items.push("At least one deliverable with a description");
    if (deliverables.some((d) => d.url.trim() && d.description.trim().length < 2)) {
      items.push("A link cannot be saved without a description for that deliverable");
    }
    if (collabs.some((c) => c.personId && c.contribution.trim().length < 2)) {
      items.push("Each collaborator needs a contribution");
    }
    return items;
  }, [summary, learned, doDifferently, rememberNext, workCompletedAt, deliverables, collabs]);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        Submit Completion Record
      </Button>
    );
  }

  return (
    <form
      className="space-y-3"
      action={async (form) => {
        setError(null);
        if (missing.length) {
          setError(`Missing: ${missing.join("; ")}`);
          return;
        }
        const payload = new FormData();
        payload.set("taskId", taskId);
        payload.set("summary", summary);
        payload.set("learned", learned);
        payload.set("doDifferently", doDifferently);
        payload.set("rememberNext", rememberNext);
        payload.set("problems", problems.trim() || "No issues encountered");
        payload.set("workCompletedAt", workCompletedAt);
        payload.set(
          "deliverables",
          JSON.stringify(deliverables.filter((d) => d.description.trim().length >= 2)),
        );
        payload.set(
          "people",
          JSON.stringify(collabs.filter((c) => c.personId && c.roleInTask !== "Task Owner")),
        );
        void form;
        try {
          await completeTask(payload);
          setOpen(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to submit.");
        }
      }}
    >
      <p className="text-sm font-medium">Completion Notice</p>
      <p className="text-xs text-secondary">This is a completion record, not an approval.</p>
      <Field label="What was done?">
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} required />
      </Field>
      <div>
        <p className="mb-2 text-sm font-medium">Deliverables</p>
        {deliverables.map((item, index) => (
          <div key={index} className="mb-3 space-y-2 rounded-md border border-border p-2">
            <Field label="Name / label">
              <Input
                value={item.label}
                onChange={(e) => {
                  const next = [...deliverables];
                  next[index] = { ...item, label: e.target.value };
                  setDeliverables(next);
                }}
              />
            </Field>
            <Field label="Link or attachment reference">
              <Input
                value={item.url}
                onChange={(e) => {
                  const next = [...deliverables];
                  next[index] = { ...item, url: e.target.value };
                  setDeliverables(next);
                }}
              />
            </Field>
            <Field label="Description (required)">
              <Textarea
                value={item.description}
                onChange={(e) => {
                  const next = [...deliverables];
                  next[index] = { ...item, description: e.target.value };
                  setDeliverables(next);
                }}
              />
            </Field>
            <Field label="Deliverable type">
              <Input
                value={item.deliverableType}
                onChange={(e) => {
                  const next = [...deliverables];
                  next[index] = { ...item, deliverableType: e.target.value };
                  setDeliverables(next);
                }}
              />
            </Field>
            <Field label="Optional notes">
              <Input
                value={item.notes}
                onChange={(e) => {
                  const next = [...deliverables];
                  next[index] = { ...item, notes: e.target.value };
                  setDeliverables(next);
                }}
              />
            </Field>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => setDeliverables([...deliverables, emptyDeliverable()])}>
          Add deliverable
        </Button>
      </div>
      <Field label="Issues / Problems Encountered (optional)">
        <Textarea
          value={problems}
          onChange={(e) => setProblems(e.target.value)}
          placeholder="Leave blank if none — saved as “No issues encountered”."
        />
      </Field>
      <div>
        <p className="mb-2 text-sm font-medium">People Involved / Collaboration</p>
        <p className="mb-2 text-xs text-secondary">
          Handled By stays the task owner. Contributors are not approvers unless the existing workflow already says so.
        </p>
        {collabs.map((item, index) => (
          <div key={index} className="mb-3 space-y-2 rounded-md border border-border p-2">
            <Field label="Person">
              <Select
                value={item.personId}
                onChange={(e) => {
                  const next = [...collabs];
                  next[index] = { ...item, personId: e.target.value };
                  setCollabs(next);
                }}
              >
                <option value="">Select</option>
                {people
                  .filter((p) => p.id !== ownerId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Role in this task">
              <Select
                value={item.roleInTask}
                onChange={(e) => {
                  const next = [...collabs];
                  next[index] = { ...item, roleInTask: e.target.value };
                  setCollabs(next);
                }}
              >
                {COLLAB_ROLES.filter((r) => r !== "Task Owner").map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </Select>
            </Field>
            <Field label="Contribution / What they did">
              <Textarea
                value={item.contribution}
                onChange={(e) => {
                  const next = [...collabs];
                  next[index] = { ...item, contribution: e.target.value };
                  setCollabs(next);
                }}
              />
            </Field>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setCollabs([...collabs, { personId: "", roleInTask: "Contributor", contribution: "", notes: "" }])
          }
        >
          Add person involved
        </Button>
      </div>
      <Field label="Work Completed At">
        <Input type="datetime-local" value={workCompletedAt} onChange={(e) => setWorkCompletedAt(e.target.value)} />
      </Field>
      <Field label="What did you learn from this task?">
        <Textarea value={learned} onChange={(e) => setLearned(e.target.value)} />
      </Field>
      <Field label="What would you do differently next time?">
        <Textarea value={doDifferently} onChange={(e) => setDoDifferently(e.target.value)} />
      </Field>
      <Field label="What knowledge, process, or technique should be remembered?">
        <Textarea value={rememberNext} onChange={(e) => setRememberNext(e.target.value)} />
      </Field>
      {missing.length ? (
        <p className="text-sm text-error">Required before submit: {missing.join("; ")}</p>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={missing.length > 0}>
          Submit Completion Record
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
