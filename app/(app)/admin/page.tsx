import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, Mail, ScrollText, Settings2 } from "lucide-react";
import { saveSetting } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { invitations, permissions, rolePermissions, roles, settings } from "@/lib/db/schema";
import { listAudit, listPeople } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, Textarea, statusTone } from "@/components/ui";
import { Metric, WorkHero, linkButton } from "@/components/work-surface";
import { formatDateTime, readableLabel } from "@/lib/utils";

function settingText(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, unknown>)
        .map(([key, item]) => `${readableLabel(key)}: ${Array.isArray(item) ? item.join(", ") : item === null || item === undefined ? "—" : String(item)}`)
        .join("\n");
    }
  } catch {
    return value;
  }
  return value;
}

export default async function AdminPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!hasPermission(ctx, "administration:manage")) {
    return <EmptyState illustration="search" title="Administration needs permission" body="Managing roles, settings, and invitations uses the administration permission." />;
  }
  const [roleRows, permRows, grants, settingRows, invites, audit, peopleRows] = await Promise.all([
    db.select().from(roles),
    db.select().from(permissions),
    db.select().from(rolePermissions),
    db.select().from(settings),
    db.select().from(invitations),
    listAudit(12),
    listPeople(),
  ]);
  const peopleById = new Map(peopleRows.map((person) => [person.id, person]));
  const permById = new Map(permRows.map((perm) => [perm.id, perm]));
  const permsByRole = new Map<string, typeof permRows>();
  for (const grant of grants) {
    const perm = permById.get(grant.permissionId);
    if (!perm) continue;
    const list = permsByRole.get(grant.roleId) ?? [];
    list.push(perm);
    permsByRole.set(grant.roleId, list);
  }
  const orderedRoles = [...roleRows].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const orderedSettings = [...settingRows].sort((a, b) => a.key.localeCompare(b.key));
  const orderedInvites = [...invites].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const pendingInvites = invites.filter((invite) => invite.status === "pending").length;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="dashboard"
        kicker="Administration"
        title="System setup"
        artWash="bg-charcoal-soft"
        description={`${orderedRoles.length} roles, ${permRows.length} capabilities, ${orderedSettings.length} settings. Configuration stays separate from day-to-day records.`}
        actions={
          <>
            <a className={linkButton("primary")} href="#settings">Settings</a>
            <a className={linkButton()} href="#roles">Roles</a>
            <a className={linkButton()} href="#invitations">Invitations</a>
            <Link className={linkButton()} href="/activity?view=audit">Audit</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Roles" value={orderedRoles.length} note="Labels that hold stored capabilities." icon={KeyRound} wash="bg-charcoal-soft" ink="text-charcoal" href="#roles" />
        <Metric label="Capabilities" value={permRows.length} note="Explicit permissions in the system." icon={KeyRound} wash="bg-purple-soft" ink="text-purple" href="#roles" />
        <Metric label="Settings" value={orderedSettings.length} note="Stored configuration values." icon={Settings2} wash="bg-blue-soft" ink="text-info" href="#settings" />
        <Metric label="Invitations" value={invites.length} note={pendingInvites === 0 ? "None are still pending." : pendingInvites === 1 ? "1 is still pending." : `${pendingInvites} are still pending.`} icon={Mail} wash="bg-yellow-soft" ink="text-warning" href="#invitations" />
      </div>

      <section id="roles" className="space-y-3">
        <h2 className="text-lg font-bold">Roles and capabilities</h2>
        <p className="text-sm text-secondary">Each chip is a capability stored on that role.</p>
        {orderedRoles.length === 0 ? (
          <EmptyState illustration="quiet" title="No roles stored" body="Roles and their capabilities will appear here." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {orderedRoles.map((role) => {
              const caps = [...(permsByRole.get(role.id) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
              return (
                <article key={role.id} className="rounded-[18px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold">{role.name}</h3>
                    <span className="text-xs font-semibold text-muted">{role.key}</span>
                  </div>
                  {role.description ? <p className="mt-1 text-sm text-secondary">{role.description}</p> : null}
                  {caps.length === 0 ? (
                    <p className="mt-3 text-sm text-secondary">No capabilities stored on this role.</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {caps.map((perm) => {
                        const label = perm.name.includes(":") || perm.name === perm.key ? readableLabel(perm.key) : perm.name;
                        return (
                          <span key={perm.id} title={perm.description ?? perm.key} className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-charcoal">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section id="settings" className="min-w-0 space-y-3">
          <h2 className="text-lg font-bold">Settings</h2>
          {orderedSettings.length === 0 ? (
            <EmptyState illustration="empty" title="No settings stored" body="Saving a key and value creates the setting." />
          ) : (
            <div className="space-y-3">
              {orderedSettings.map((setting) => (
                <article key={setting.id} className="rounded-[18px] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]">
                  <p className="text-sm font-bold">{setting.key}</p>
                  <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-all rounded-[12px] bg-canvas px-3 py-2 text-sm text-secondary">{settingText(setting.value)}</p>
                  <p className="mt-2 text-xs text-muted">Updated {formatDateTime(setting.updatedAt)}</p>
                </article>
              ))}
            </div>
          )}
        </section>
        <Card id="save-setting" className="xl:sticky xl:top-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Configuration</p>
          <h2 className="mt-1 text-lg font-bold">Save a setting</h2>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">Updating a key replaces its stored value. This does not edit tasks, projects, or people by itself.</p>
          <ActionForm action={saveSetting} submitLabel="Save setting">
            <Field label="Key">
              <Input name="key" defaultValue="content_kpi_rule" />
            </Field>
            <Field label="Value">
              <Textarea name="value" />
            </Field>
          </ActionForm>
        </Card>
      </div>

      <section id="invitations" className="space-y-3">
        <h2 className="text-lg font-bold">Invitations</h2>
        {orderedInvites.length === 0 ? (
          <EmptyState illustration="team" title="No invitations" body="Account invitations and their status appear here." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {orderedInvites.map((invite) => {
              const person = invite.personId ? peopleById.get(invite.personId) : null;
              const invitedBy = peopleById.get(invite.invitedById);
              return (
                <article key={invite.id} className="rounded-[18px] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-bold">{invite.email}</p>
                    <Badge tone={statusTone(invite.status)}>{readableLabel(invite.status)}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-secondary">
                    Invited {formatDateTime(invite.createdAt)}
                    {invitedBy ? ` by ${invitedBy.fullName}` : ""}
                  </p>
                  {invite.expiresAt ? <p className="mt-1 text-xs text-secondary">Expires {formatDateTime(invite.expiresAt)}</p> : null}
                  {person ? <Link href={`/team/${person.id}`} className="mt-2 inline-block text-xs font-semibold text-info">{person.fullName}</Link> : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section id="system-activity" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-bold">Recent system trace</h2>
          <Link className={linkButton()} href="/activity?view=audit">Open audit</Link>
        </div>
        {audit.length === 0 ? (
          <p className="text-sm text-secondary">No audit lines yet.</p>
        ) : (
          <div className="space-y-2">
            {audit.map((row) => (
              <div key={row.id} className="flex items-start gap-3 rounded-[14px] border border-border bg-surface px-3 py-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-charcoal-soft text-charcoal">
                  <ScrollText size={14} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{readableLabel(row.action)}</span>
                  <span className="block text-xs text-secondary">{readableLabel(row.entityType)} · {formatDateTime(row.createdAt)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
