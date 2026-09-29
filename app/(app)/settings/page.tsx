"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { PasswordInput } from "@/components/password-input";
import { Button, Card, Field } from "@/components/ui";
import { WorkHero, linkButton } from "@/components/work-surface";

export default function SettingsPage() {
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="dashboard"
        kicker="Settings"
        title="This account"
        artWash="bg-charcoal-soft"
        description="Password and sign-in for you. Tasks, projects, and people stay on their own pages."
        actions={
          <>
            <Link className={linkButton()} href="/profile">Profile</Link>
            <Link className={linkButton()} href="/notifications">Notifications</Link>
          </>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
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
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Nearby</p>
          <h2 className="mt-1 text-lg font-bold">Where else to look</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/profile" className="font-semibold text-info">My profile</Link><p className="text-secondary">Photo, name, open tasks, and observed skills.</p></li>
            <li><Link href="/notifications" className="font-semibold text-info">Notifications</Link><p className="text-secondary">Events that need awareness or a next step.</p></li>
            <li><Link href="/knowledge" className="font-semibold text-info">Knowledge base</Link><p className="text-secondary">Published SOPs and guides.</p></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
