"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { activateAccount } from "@/lib/actions/auth-extra";
import { PasswordInput } from "@/components/password-input";
import { Button, Field } from "@/components/ui";

function ActivateForm() {
  const params = useSearchParams();
  const [status, setStatus] = useState<string | null>(null);
  const token = params.get("token") ?? "";
  return (
    <form
      className="space-y-3"
      action={async (form) => {
        try {
          form.set("token", token);
          await activateAccount(form);
          setStatus("Account activated. You can log in.");
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Activation failed.");
        }
      }}
    >
      <p className="text-sm text-secondary">Set a password to activate your invited account.</p>
      <Field label="Password">
        <PasswordInput name="password" required minLength={8} />
      </Field>
      <Field label="Confirm password">
        <PasswordInput name="confirm" required minLength={8} />
      </Field>
      <Button className="w-full" type="submit">
        Activate account
      </Button>
      {status ? <p className="text-sm text-secondary">{status}</p> : null}
    </form>
  );
}

export default function ActivatePage() {
  return (
    <Suspense>
      <ActivateForm />
    </Suspense>
  );
}
