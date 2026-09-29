"use client";

import { useState } from "react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { readableLabel } from "@/lib/utils";

export function FileUpload() {
  const [status, setStatus] = useState<string | null>(null);
  return (
    <Card className="mb-4">
      <form
        className="grid gap-3 md:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          const res = await fetch("/api/files/upload", { method: "POST", body: data });
          const json = await res.json();
          setStatus(json.error ?? "Uploaded.");
          form.reset();
        }}
      >
        <Field label="File">
          <Input type="file" name="file" required />
        </Field>
        <Field label="Related type">
          <Select name="relatedType">
            {["project", "task", "content", "equipment", "handover", "knowledge"].map((type) => (
              <option key={type} value={type}>
                {readableLabel(type)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Related ID">
          <Input name="relatedId" />
        </Field>
        <div className="flex items-end">
          <Button type="submit">Upload</Button>
        </div>
      </form>
      {status ? <p className="mt-2 text-sm text-secondary">{status}</p> : null}
    </Card>
  );
}
