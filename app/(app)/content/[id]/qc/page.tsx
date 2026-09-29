import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { submitQc } from "@/lib/actions/core";
import { getContent } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Field, Select, Textarea, statusTone } from "@/components/ui";
import { WorkHero } from "@/components/work-surface";
import { readableLabel } from "@/lib/utils";

export default async function ContentQcPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await getContent(id);
  if (!content) notFound();
  return (
    <div className="space-y-5">
      <Link href={`/content/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft size={16} aria-hidden />
        Back to content
      </Link>
      <WorkHero
        illustration="content"
        kicker="QC"
        title={content.title}
        artWash="bg-purple-soft"
        description="A decision, checklist, and comments are stored as a QC record. This does not publish the content."
        actions={<Badge tone={statusTone(content.stage)}>{content.stage}</Badge>}
      />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Preview</p>
          <h2 className="mt-1 text-lg font-bold">What is being checked</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-secondary">{content.brief || "No brief yet."}</p>
          {content.caption ? <p className="mt-3 whitespace-pre-wrap rounded-[14px] bg-canvas px-3 py-2.5 text-sm">{content.caption}</p> : <p className="mt-3 text-sm text-secondary">No caption yet.</p>}
          <p className="mt-3 text-xs text-secondary">{content.platform ? readableLabel(content.platform) : "No platform"} · {content.pillar ? readableLabel(content.pillar) : "No pillar"}</p>
        </Card>
        <Card accent="purple">
          <h2 className="text-base font-bold">Record QC decision</h2>
          <div className="mt-3">
            <ActionForm action={submitQc} submitLabel="Record QC decision">
              <input type="hidden" name="contentId" value={id} />
              <Field label="Stage">
                <Select name="stage" defaultValue="qc1">
                  <option value="self_qc">{readableLabel("self_qc")}</option>
                  <option value="qc1">{readableLabel("qc1")}</option>
                  <option value="qc2">{readableLabel("qc2")}</option>
                </Select>
              </Field>
              <Field label="Decision">
                <Select name="status">
                  <option value="passed">{readableLabel("passed")}</option>
                  <option value="corrections">Corrections required</option>
                </Select>
              </Field>
              <Field label="Checklist"><Textarea name="checklist" /></Field>
              <Field label="Comments"><Textarea name="comments" /></Field>
            </ActionForm>
          </div>
        </Card>
      </div>
    </div>
  );
}
