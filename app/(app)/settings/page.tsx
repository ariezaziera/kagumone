"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const [status, setStatus] = useState<string | null>(null);
  return (
    <div>
      <PageHeader title="Settings" description="Account and security preferences. Operational records live in their own modules." />
      <Card>
        <h2 className="mb-3 font-medium">Change password</h2>
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
            <Input name="currentPassword" type="password" required />
          </Field>
          <Field label="New password">
            <Input name="newPassword" type="password" required minLength={8} />
          </Field>
          <Button type="submit">Update password</Button>
        </form>
        {status ? <p className="mt-2 text-sm text-secondary">{status}</p> : null}
      </Card>
    </div>
  );
}
