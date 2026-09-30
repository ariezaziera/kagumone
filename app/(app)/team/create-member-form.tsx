"use client";

import { useState } from "react";
import { inviteUser } from "@/lib/actions/core";
import { Button, Field, Input, Select } from "@/components/ui";

export function CreateMemberForm({
  roles,
  departments,
}: {
  roles: { id: string; key: string; name: string }[];
  departments: { id: string; name: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ fullName: string; email: string | null; username: string | null; temporaryPassword: string } | null>(null);
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
        <Input name="email" type="email" autoComplete="off" />
      </Field>
      <Field label="Username">
        <Input name="username" minLength={3} maxLength={30} autoComplete="off" placeholder="letters, numbers, underscores, periods" />
      </Field>
      <Field label="Position title">
        <Input name="positionTitle" maxLength={80} placeholder="Type the title" />
      </Field>
      <p className="text-xs text-secondary">Enter an email, a username, or both. The one left blank can be added later on the profile.</p>
      <Field label="Department">
        <Select name="departmentId" required defaultValue="">
          <option value="" disabled>
            Choose a department
          </option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
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
          <p className="mt-2 text-secondary">Shown once. They sign in with the email or the username that was set, then must replace this password.</p>
          <dl className="mt-3 space-y-1">
            <div>
              <dt className="text-xs uppercase tracking-wide text-secondary">Email</dt>
              <dd>{created.email ?? "Not set yet"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-secondary">Username</dt>
              <dd>{created.username ?? "Not set yet"}</dd>
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
                `Email: ${created.email ?? "Not set yet"}\nUsername: ${created.username ?? "Not set yet"}\nTemporary password: ${created.temporaryPassword}`,
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
