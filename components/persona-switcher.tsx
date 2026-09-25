"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button, Select } from "@/components/ui";

const PERSONAS = [
  { email: "admin@demo.kagum.local", label: "Demo Admin" },
  { email: "management@demo.kagum.local", label: "Demo Manager" },
  { email: "executive@demo.kagum.local", label: "Demo Executive" },
  { email: "staff@demo.kagum.local", label: "Demo Staff" },
  { email: "intern@demo.kagum.local", label: "Demo Intern" },
];

export function PersonaSwitcher() {
  const [email, setEmail] = useState(PERSONAS[3].email);
  const [error, setError] = useState<string | null>(null);
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className="rounded-md border border-warning/40 bg-amber-50 p-3 text-sm">
      <p className="font-medium text-warning">Development persona switcher</p>
      <p className="mt-1 text-secondary">Uses the real login pathway. Password for demo accounts is Demo1234!</p>
      <div className="mt-2 flex gap-2">
        <Select value={email} onChange={(e) => setEmail(e.target.value)}>
          {PERSONAS.map((p) => (
            <option key={p.email} value={p.email}>
              {p.label}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          onClick={async () => {
            setError(null);
            const result = await authClient.signIn.email({ email, password: "Demo1234!" });
            if (result.error) setError(result.error.message ?? "Sign-in failed.");
            else window.location.href = "/dashboard";
          }}
        >
          Switch
        </Button>
      </div>
      {error ? <p className="mt-2 text-error">{error}</p> : null}
    </div>
  );
}
