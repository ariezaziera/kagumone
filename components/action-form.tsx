"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function ActionForm({
  action,
  children,
  submitLabel,
}: {
  action: (form: FormData) => Promise<unknown>;
  children: React.ReactNode;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  return (
    <form
      className="space-y-3"
      action={async (form) => {
        setError(null);
        setOk(false);
        try {
          await action(form);
          setOk(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      }}
    >
      {children}
      <Button type="submit">{submitLabel}</Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {ok ? <p className="text-sm text-success">Saved.</p> : null}
    </form>
  );
}
