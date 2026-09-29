"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { PasswordInput } from "@/components/password-input";
import { Button, Card, Field, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const [status, setStatus] = useState<string | null>(null);
  return (
    <div>
      <PageHeader module="admin" title="Settings" description="Account and security preferences. Operational records live in their own modules." />
      <Card>
        <h2 className="mb-3 font-medium">Change password</h2>
        <p className="mb-3 text-sm text-secondary">If you no longer know this password, contact an administrator. They can issue a temporary password, and your next login will ask you to replace it.</p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const currentPassword = String(form.get("currentPassword"));
            const newPassword = String(form.get("newPassword"));
            const result = await authClient.changePassword({ currentPassword, newPassword });
            setStatus(result.error ? result.error.message ?? "Unable to change password." : "Password updated.");
          }}
        >
          <Field label="Current password">
            <PasswordInput name="currentPassword" autoComplete="current-password" required />
          </Field>
          <Field label="New password">
            <PasswordInput name="newPassword" autoComplete="new-password" required minLength={8} />
          </Field>
          <Button type="submit">Update password</Button>
        </form>
        {status ? <p className="mt-2 text-sm text-secondary">{status}</p> : null}
      </Card>
    </div>
  );
}
