"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button, Field, Input } from "@/components/ui";

function ResetForm() {
  const params = useSearchParams();
  const [status, setStatus] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const password = String(form.get("password"));
        const confirm = String(form.get("confirm"));
        if (password !== confirm) {
          setStatus("Passwords do not match.");
          return;
        }
        if (password.length < 8) {
          setStatus("Use at least 8 characters.");
          return;
        }
        const token = params.get("token") ?? "";
        const result = await authClient.resetPassword({ newPassword: password, token });
        setStatus(result.error ? result.error.message ?? "Reset failed." : "Password updated. You can log in.");
      }}
    >
      <Field label="New password">
        <Input name="password" type="password" required minLength={8} />
      </Field>
      <Field label="Confirm password">
        <Input name="confirm" type="password" required minLength={8} />
      </Field>
      <p className="text-xs text-secondary">Minimum 8 characters.</p>
      <Button className="w-full" type="submit">
        Reset password
      </Button>
      {status ? <p className="text-sm text-secondary">{status}</p> : null}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
