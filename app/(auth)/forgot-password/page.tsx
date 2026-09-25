"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("email") as string;
        await fetch("/api/auth/forget-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, redirectTo: "/reset-password" }),
        });
        setStatus("If that account exists, a reset link was sent (or logged in the server console in development).");
      }}
    >
      <Field label="Email">
        <Input name="email" type="email" required />
      </Field>
      <Button className="w-full" type="submit">
        Send reset link
      </Button>
      {status ? <p className="text-sm text-secondary">{status}</p> : null}
      <Link className="text-sm text-info" href="/login">
        Back to login
      </Link>
    </form>
  );
}
