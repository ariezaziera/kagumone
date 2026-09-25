import { notFound } from "next/navigation";
import { submitQc } from "@/lib/actions/core";
import { getContent } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Card, Field, PageHeader, Select, Textarea } from "@/components/ui";

export default async function ContentQcPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await getContent(id);
  if (!content) notFound();
  return (
    <div>
      <PageHeader title={`QC: ${content.title}`} description="Checklist, comments, and correction requests become records." />
      <Card>
        <p className="mb-3 text-sm">{content.brief || content.caption || "No preview copy yet."}</p>
        <ActionForm action={submitQc} submitLabel="Record QC decision">
          <input type="hidden" name="contentId" value={id} />
          <Field label="Stage">
            <Select name="stage" defaultValue="qc1">
              <option>self_qc</option>
              <option>qc1</option>
              <option>qc2</option>
            </Select>
          </Field>
          <Field label="Decision">
            <Select name="status">
              <option value="passed">passed</option>
              <option value="corrections">corrections required</option>
            </Select>
          </Field>
          <Field label="Checklist">
            <Textarea name="checklist" />
          </Field>
          <Field label="Comments">
            <Textarea name="comments" />
          </Field>
        </ActionForm>
      </Card>
    </div>
  );
}
