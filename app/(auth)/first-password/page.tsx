"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeFirstPassword } from "@/lib/actions/auth-extra";
import { authClient } from "@/lib/auth/client";
import { Button, Field, Input } from "@/components/ui";

export default function FirstPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      action={async (form) => {
        setError(null);
        try {
          await completeFirstPassword(form);
          router.push("/dashboard");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to update the password.");
        }
      }}
    >
      <p className="text-sm text-secondary">
        This account is using a temporary password. Set a new one before continuing.
      </p>
      <Field label="Temporary password">
        <Input name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="New password">
        <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field label="Confirm new password">
        <Input name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button className="w-full" type="submit">
        Save password
      </Button>
      <Button
        className="w-full"
        type="button"
        variant="secondary"
        onClick={async () => {
          await authClient.signOut();
          router.push("/login");
          router.refresh();
        }}
      >
        Sign out
      </Button>
    </form>
  );
}
