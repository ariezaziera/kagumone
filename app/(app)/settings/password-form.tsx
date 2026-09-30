"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { PasswordInput } from "@/components/password-input";
import { Button, Card, Field } from "@/components/ui";

export function PasswordForm() {
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  return (
    <Card>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Security</p>
      <h2 className="mt-1 text-lg font-bold">Change password</h2>
      <p className="mb-4 mt-1 text-sm leading-relaxed text-secondary">Use the password you sign in with. If you no longer know it, someone who can invite accounts can issue a temporary password. The next login asks you to replace it.</p>
      <form
        className="max-w-md space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const currentPassword = String(form.get("currentPassword"));
          const newPassword = String(form.get("newPassword"));
          const result = await authClient.changePassword({ currentPassword, newPassword });
          setStatus(result.error
            ? { tone: "error", text: result.error.message ?? "Unable to change password." }
            : { tone: "ok", text: "Password updated." });
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
      {status ? <p className={`mt-3 text-sm ${status.tone === "ok" ? "text-success" : "text-error"}`}>{status.text}</p> : null}
    </Card>
  );
}
