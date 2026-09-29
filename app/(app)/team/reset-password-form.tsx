"use client";

import { useState } from "react";
import { resetAccountPassword } from "@/lib/actions/auth-extra";
import { Button } from "@/components/ui";

export function ResetPasswordForm({ personId }: { personId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    fullName: string;
    email: string;
    username: string | null;
    temporaryPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <form
      className="space-y-3"
      action={async (form) => {
        setError(null);
        setCopied(false);
        try {
          setCreated(await resetAccountPassword(form));
        } catch (err) {
          setCreated(null);
          setError(err instanceof Error ? err.message : "Unable to reset the password.");
        }
      }}
    >
      <input type="hidden" name="personId" value={personId} />
      <p className="text-sm text-secondary">
        Issues a temporary password and signs them out. Their next login must replace it. The password is shown once and is not stored in the audit log.
      </p>
      <Button type="submit" variant="secondary">
        Reset password
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {created ? (
        <div className="rounded-xl border border-border bg-canvas p-3 text-sm">
          <p className="font-medium">Temporary password for {created.fullName}</p>
          <dl className="mt-3 space-y-1">
            <div>
              <dt className="text-xs uppercase tracking-wide text-secondary">Email</dt>
              <dd>{created.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-secondary">Username</dt>
              <dd>{created.username ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-secondary">Temporary password</dt>
              <dd className="font-mono">{created.temporaryPassword}</dd>
            </div>
          </dl>
          <Button
            className="mt-3"
            type="button"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(
                `Email: ${created.email}\nUsername: ${created.username ?? ""}\nTemporary password: ${created.temporaryPassword}`,
              );
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy login details"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
