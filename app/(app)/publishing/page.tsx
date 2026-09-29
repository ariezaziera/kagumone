import { publishContent } from "@/lib/actions/core";
import { listContents } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, Input, PageHeader, RecordList, Select } from "@/components/ui";

export default async function PublishingPage() {
  const rows = await listContents();
  const ready = rows.filter((row) => row.stage === "ready_to_post");
  const published = rows.filter((row) => row.stage === "published");
  return (
    <div>
      <PageHeader module="content" title="Publishing" description="Approved content is recorded with platform, URL, and actual date." />
      {ready.length === 0 ? (
        <EmptyState title="Nothing ready to post" body="Content must complete QC and final approval first." />
      ) : (
        <RecordList className="space-y-3">
        {ready.map((c) => (
          <Card key={c.id} data-record="">
            <h2 className="font-medium">{c.title}</h2>
            <ActionForm action={publishContent} submitLabel="Record publication">
              <input type="hidden" name="contentId" value={c.id} />
              <Field label="Platform">
                <Select name="platform" defaultValue={c.platform ?? "instagram"}>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                </Select>
              </Field>
              <Field label="URL">
                <Input name="url" />
              </Field>
              <Field label="Caption">
                <Input name="caption" defaultValue={c.caption ?? ""} />
              </Field>
            </ActionForm>
          </Card>
        ))}
        </RecordList>
      )}
      <h2 className="mt-6 mb-2 font-medium">Published</h2>
      <RecordList>
      <div className="kagum-list">
      {published.map((c) => (
        <p key={c.id} data-record="" className="text-sm">
          {c.title} — {c.publishedUrl}
        </p>
      ))}
      </div>
      </RecordList>
    </div>
  );
}
