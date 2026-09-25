import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { contentApprovals, contentBenchmarks, contentQc, contentPublications } from "@/lib/db/schema";
import { moveContentStage } from "@/lib/actions/core";
import { getContent } from "@/lib/queries";
import { CONTENT_STAGES } from "@/lib/permissions";
import { Badge, Button, Card, PageHeader, statusTone } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await getContent(id);
  if (!content) notFound();
  const [qc, pubs, approvals, benchmarks] = await Promise.all([
    db.select().from(contentQc).where(eq(contentQc.contentId, id)),
    db.select().from(contentPublications).where(eq(contentPublications.contentId, id)),
    db.select().from(contentApprovals).where(eq(contentApprovals.contentId, id)),
    db.select().from(contentBenchmarks).where(eq(contentBenchmarks.contentId, id)),
  ]);
  return (
    <div>
      <PageHeader title={content.title} description={`${content.pillar ?? "—"} · ${content.platform ?? "—"}`} />
      <Card className="mb-4">
        <p className="text-sm">Current stage: <Badge tone={statusTone(content.stage)}>{content.stage}</Badge></p>
        <p className="mt-2 text-sm">{content.brief}</p>
        <p className="text-sm">{content.caption}</p>
        <p className="text-sm">Planned publish: {formatDateTime(content.plannedPublishAt)}</p>
        <p className="text-sm">Actual publish: {formatDateTime(content.actualPublishAt)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONTENT_STAGES.map((stage) => (
            <form
              key={stage}
              action={async () => {
                "use server";
                await moveContentStage(id, stage);
              }}
            >
              <Button type="submit" variant="secondary">
                {stage}
              </Button>
            </form>
          ))}
        </div>
        <Link className="mt-3 inline-block text-sm text-info" href={`/content/${id}/qc`}>
          Open QC
        </Link>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-medium">QC history</h2>
          {qc.map((q) => (
            <p key={q.id} className="text-sm">
              {q.stage} — {q.status}
            </p>
          ))}
        </Card>
        <Card>
          <h2 className="font-medium">Publications</h2>
          {pubs.map((p) => (
            <p key={p.id} className="text-sm">
              {p.platform} {p.url}
            </p>
          ))}
          <h2 className="mt-3 font-medium">Benchmarks</h2>
          {benchmarks.map((b) => (
            <p key={b.id} className="text-sm">
              {b.sourceUrl}
            </p>
          ))}
          <h2 className="mt-3 font-medium">Approvals</h2>
          {approvals.map((a) => (
            <p key={a.id} className="text-sm">
              {a.status}
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
}
