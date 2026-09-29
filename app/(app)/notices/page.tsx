import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Megaphone, Users } from "lucide-react";
import { createAnnouncement } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { listAnnouncements, listPeople } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { formatDateTime, readableLabel } from "@/lib/utils";

const KINDS = ["announcement", "event_notice", "participation"] as const;

const KIND_FACE: Record<string, { wash: string; ink: string; bar: string }> = {
  announcement: { wash: "bg-blue-soft", ink: "text-info", bar: "bg-blue" },
  event_notice: { wash: "bg-orange-soft", ink: "text-orange", bar: "bg-orange" },
  participation: { wash: "bg-yellow-soft", ink: "text-warning", bar: "bg-yellow" },
};

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { kind = "all" } = await searchParams;
  const canPost = hasPermission(ctx, "announcement:create");
  const [rows, peopleRows] = await Promise.all([listAnnouncements(), listPeople()]);
  const names = new Map(peopleRows.map((person) => [person.id, person.fullName]));
  const filtered = kind === "all" ? rows : kind === "participation" ? rows.filter((notice) => notice.kind === "participation" || notice.requiresParticipation) : rows.filter((notice) => notice.kind === kind);
  const participation = rows.filter((notice) => notice.requiresParticipation || notice.kind === "participation").length;
  const events = rows.filter((notice) => notice.kind === "event_notice").length;
  const updates = rows.filter((notice) => notice.kind === "announcement").length;
  const visibleKinds = KINDS.filter((item) => rows.some((notice) => notice.kind === item) || kind === item);
  const summary = rows.length === 0
    ? "Event notices and participation posts for the team. A notice is not an SOP and not an approval."
    : `${updates} ${updates === 1 ? "update" : "updates"}, ${events} event ${events === 1 ? "notice" : "notices"}, ${participation} asking for participation.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="calendar"
        kicker="Notices"
        title="Team board"
        artWash="bg-orange-soft"
        description={summary}
        actions={
          <>
            {canPost ? <a className={linkButton("primary")} href="#post-notice">Post a notice</a> : null}
            <Link className={linkButton()} href="/equipment">Equipment</Link>
            <Link className={linkButton()} href="/dashboard">Dashboard</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Notices" value={rows.length} note="Published notices on the board." icon={Megaphone} wash="bg-orange-soft" ink="text-orange" href="/notices" />
        <Metric label="Updates" value={updates} note="Announcements and general updates." icon={Megaphone} wash="bg-blue-soft" ink="text-info" href="/notices?kind=announcement" />
        <Metric label="Events" value={events} note="Event notices, separate from the calendar." icon={CalendarDays} wash="bg-orange-soft" ink="text-orange" href="/notices?kind=event_notice" />
        <Metric label="Participation" value={participation} note="The team is asked to take part." icon={Users} wash="bg-yellow-soft" ink="text-warning" href="/notices?kind=participation" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4">
          <ViewPills
            items={[
              { key: "all", href: "/notices", label: "All", active: kind === "all", count: rows.length },
              ...visibleKinds.map((item) => ({
                key: item,
                href: `/notices?kind=${item}`,
                label: item === "event_notice" ? "Events" : item === "announcement" ? "Updates" : "Participation",
                active: kind === item,
                count: item === "participation" ? participation : rows.filter((notice) => notice.kind === item).length,
              })),
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState illustration="quiet" title="No notices yet" body="Posted event notices and participation requests also appear on the dashboard." />
          ) : (
            <RecordList className="space-y-3" sortLabel="Posted">
              {filtered.map((notice) => {
                const face = KIND_FACE[notice.kind] ?? KIND_FACE.announcement;
                return (
                  <article
                    key={notice.id}
                    data-record=""
                    data-sort={notice.createdAt ? new Date(notice.createdAt).toISOString() : ""}
                    data-label-text={`${notice.title} ${notice.body} ${notice.kind} ${names.get(notice.createdById ?? "") ?? ""}`}
                    className="relative overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]"
                  >
                    <span className={`absolute inset-y-0 left-0 w-1.5 ${face.bar}`} aria-hidden />
                    <div className="px-4 py-3.5 pl-5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={notice.kind === "event_notice" ? "orange" : notice.kind === "participation" ? "yellow" : "blue"}>{readableLabel(notice.kind)}</Badge>
                        {notice.requiresParticipation ? <Badge tone="yellow">Needs participation</Badge> : null}
                      </div>
                      <h2 className="mt-1.5 text-base font-bold text-text">{notice.title}</h2>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-secondary">{notice.body}</p>
                      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-secondary">
                        <span>{notice.createdById ? names.get(notice.createdById) ?? "Posted" : "Posted"}</span>
                        <span>{formatDateTime(notice.createdAt)}</span>
                        {notice.startsAt ? <span>Starts {formatDateTime(notice.startsAt)}</span> : null}
                        {notice.endsAt ? <span>Ends {formatDateTime(notice.endsAt)}</span> : null}
                      </p>
                    </div>
                  </article>
                );
              })}
            </RecordList>
          )}
        </section>
        {canPost ? (
          <Card id="post-notice" className="xl:sticky xl:top-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Post</p>
            <h2 className="mt-1 text-lg font-bold">New notice</h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">This publishes to the team board and the dashboard. It does not approve work or replace an SOP.</p>
            <ActionForm action={createAnnouncement} submitLabel="Publish notice">
              <Field label="Type">
                <Select name="kind" defaultValue="announcement">
                  <option value="announcement">Announcement / update</option>
                  <option value="event_notice">Event notice</option>
                  <option value="participation">Needs participation</option>
                </Select>
              </Field>
              <Field label="Title"><Input name="title" required /></Field>
              <Field label="Details"><Textarea name="body" required /></Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="requiresParticipation" /> Requires team participation
              </label>
            </ActionForm>
          </Card>
        ) : (
          <Card className="xl:sticky xl:top-20">
            <h2 className="text-base font-bold">Reading the board</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">You can read notices here. Posting needs the announcement permission.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
