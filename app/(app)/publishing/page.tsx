import Link from "next/link";
import { Megaphone, Send } from "lucide-react";
import { publishContent } from "@/lib/actions/core";
import { listContents } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, Select, statusTone } from "@/components/ui";
import { Metric, WorkHero, linkButton } from "@/components/work-surface";
import { formatDateTime, readableLabel } from "@/lib/utils";

export default async function PublishingPage() {
  const rows = await listContents();
  const ready = rows.filter((row) => row.stage === "ready_to_post");
  const published = rows.filter((row) => row.stage === "published");
  const summary = ready.length === 0 ? "Nothing is waiting to post. Content reaches this page after QC and final approval." : `${ready.length} ready to post. Recording a publication stores the platform, URL, and actual date.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="content"
        kicker="Publishing"
        title="Ready to go live"
        artWash="bg-orange-soft"
        description={summary}
        actions={
          <>
            <Link className={linkButton("primary")} href="/content?stage=ready_to_post">Content queue</Link>
            <Link className={linkButton()} href="/content">All content</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Ready" value={ready.length} note="Approved and not yet recorded as published." icon={Send} wash="bg-orange-soft" ink="text-orange" />
        <Metric label="Published" value={rows.filter((row) => row.stage === "published").length} note="Stage is published on the content record." icon={Megaphone} wash="bg-green-soft" ink="text-success" href="/content?stage=published" />
      </div>
      {ready.length === 0 ? (
        <EmptyState title="Nothing ready to post" body="Content must complete QC and final approval first." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {ready.map((item) => (
            <Card key={item.id} accent="orange">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={statusTone(item.stage)}>{item.stage}</Badge>
                {item.platform ? <Badge tone="purple">{item.platform}</Badge> : null}
              </div>
              <h2 className="text-lg font-bold">
                <Link className="hover:text-primary" href={`/content/${item.id}`}>{item.title}</Link>
              </h2>
              {item.caption ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-secondary">{item.caption}</p> : null}
              <div className="mt-4 border-t border-border pt-4">
                <ActionForm action={publishContent} submitLabel="Record publication">
                  <input type="hidden" name="contentId" value={item.id} />
                  <Field label="Platform">
                    <Select name="platform" defaultValue={item.platform ?? "instagram"}>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="tiktok">TikTok</option>
                    </Select>
                  </Field>
                  <Field label="URL"><Input name="url" /></Field>
                  <Field label="Caption"><Input name="caption" defaultValue={item.caption ?? ""} /></Field>
                </ActionForm>
              </div>
            </Card>
          ))}
        </div>
      )}
      <section>
        <h2 className="mb-3 text-lg font-bold">Already published</h2>
        {published.length === 0 ? (
          <p className="text-sm text-secondary">No publication records yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {published.map((item) => (
              <article key={item.id} className="rounded-[18px] border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
                <Badge tone="success">Published</Badge>
                <h3 className="mt-2 font-bold">
                  <Link className="hover:text-primary" href={`/content/${item.id}`}>{item.title}</Link>
                </h3>
                <p className="mt-1 text-xs text-secondary">{item.platform ? readableLabel(item.platform) : "Platform not set"} · {formatDateTime(item.actualPublishAt)}</p>
                {item.publishedUrl ? <a className="mt-1 block truncate text-sm font-semibold text-info" href={item.publishedUrl}>{item.publishedUrl}</a> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
