"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Select } from "@/components/ui";
import type { FileTarget } from "@/components/record-files";
import { readableLabel } from "@/lib/utils";

const TYPES = ["project", "task", "content", "equipment", "handover", "knowledge"] as const;

export function FileUpload({ targets }: { targets: FileTarget[] }) {
  const router = useRouter();
  const [type, setType] = useState<(typeof TYPES)[number]>("project");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const choices = useMemo(() => targets.filter((target) => target.type === type), [targets, type]);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setError(null);
        setStatus(null);
        setPending(true);
        try {
          const data = new FormData(form);
          const response = await fetch("/api/files/upload", { method: "POST", body: data });
          const json = (await response.json()) as { error?: string };
          if (!response.ok) throw new Error(json.error ?? "Could not upload this file.");
          setStatus("Attached. You can open it from the list.");
          form.reset();
          setType("project");
          router.refresh();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not upload this file.");
        } finally {
          setPending(false);
        }
      }}
    >
      <Field label="File">
        <input name="file" type="file" required className="w-full text-sm text-text file:mr-3 file:rounded-[10px] file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary" />
      </Field>
      <Field label="Attach to">
        <Select
          name="relatedType"
          value={type}
          onChange={(event) => setType(event.target.value as (typeof TYPES)[number])}
        >
          {TYPES.map((item) => (
            <option key={item} value={item}>
              {readableLabel(item)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Record">
        <Select name="relatedId" required defaultValue={choices[0]?.id ?? ""} key={type}>
          {choices.length === 0 ? <option value="">Nothing to attach to</option> : null}
          {choices.map((target) => (
            <option key={target.id} value={target.id}>
              {target.label}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" disabled={pending || choices.length === 0}>
        {pending ? "Uploading" : "Attach file"}
      </Button>
      {choices.length === 0 ? <p className="text-xs text-secondary">Create a {readableLabel(type).toLowerCase()} record before attaching a file to one.</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {status ? <p className="text-sm text-success">{status}</p> : null}
    </form>
  );
}
