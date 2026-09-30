import Link from "next/link";
import { redirect } from "next/navigation";
import { notificationChoices, saveNotificationPreferences } from "@/lib/actions/notifications";
import { getAuthContext } from "@/lib/auth/context";
import { Button, Card } from "@/components/ui";
import { WorkHero, linkButton } from "@/components/work-surface";
import { PasswordForm } from "./password-form";

export default async function SettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const choices = await notificationChoices();

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="dashboard"
        kicker="Settings"
        title="This account"
        artWash="bg-charcoal-soft"
        description="Password, sign-in, and which notifications reach you. Tasks, projects, and people stay on their own pages."
        actions={
          <>
            <Link className={linkButton()} href="/profile">Profile</Link>
            <Link className={linkButton()} href="/notifications">Notifications</Link>
          </>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <PasswordForm />
          <Card>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Notifications</p>
            <h2 className="mt-1 text-lg font-bold">What reaches you</h2>
            <p className="mb-4 mt-1 text-sm leading-relaxed text-secondary">Turn a kind off to stop new notices of that kind. Password reset still arrives. Team chat uses the Chats setting.</p>
            <form action={saveNotificationPreferences} className="space-y-3">
              {choices.map((choice) => (
                <label key={choice.kind} className="flex items-start gap-3 rounded-[12px] border border-border px-3 py-2.5">
                  <input type="checkbox" name={choice.kind} defaultChecked={choice.enabled} className="mt-1" />
                  <span>
                    <span className="block text-sm font-semibold text-text">{choice.label}</span>
                    <span className="block text-xs text-secondary">{choice.detail}</span>
                  </span>
                </label>
              ))}
              <Button type="submit">Save notification settings</Button>
            </form>
          </Card>
        </div>
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
