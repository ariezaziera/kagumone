"use client";

import { useState } from "react";
import { inviteUser } from "@/lib/actions/core";
import { Button, Field, Input, Select } from "@/components/ui";

export function CreateMemberForm({ roles }: { roles: { id: string; key: string; name: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ fullName: string; email: string; username: string; temporaryPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <form
      className="space-y-3"
      action={async (form) => {
        setError(null);
        setCopied(false);
        try {
          const result = await inviteUser(form);
          setCreated(result);
        } catch (err) {
          setCreated(null);
          setError(err instanceof Error ? err.message : "Unable to create the account.");
        }
      }}
    >
      <Field label="Full name">
        <Input name="fullName" required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" required />
      </Field>
      <Field label="Username">
        <Input name="username" required minLength={3} maxLength={30} autoComplete="off" placeholder="letters, numbers, underscores" />
      </Field>
      <Field label="Role">
        <Select name="roleKey" required defaultValue="">
          <option value="" disabled>
            Choose a role
          </option>
          {roles.map((role) => (
            <option key={role.id} value={role.key}>
              {role.name}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit">Create account</Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {created ? (
        <div className="rounded-xl border border-border bg-canvas p-3 text-sm">
          <p className="font-medium">Account ready for {created.fullName}</p>
          <p className="mt-2 text-secondary">Shown once. They sign in with the email or the username, then must replace this password.</p>
          <dl className="mt-3 space-y-1">
            <div>
              <dt className="text-xs uppercase tracking-wide text-secondary">Email</dt>
              <dd>{created.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-secondary">Username</dt>
              <dd>{created.username}</dd>
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
                `Email: ${created.email}\nUsername: ${created.username}\nTemporary password: ${created.temporaryPassword}`,
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
