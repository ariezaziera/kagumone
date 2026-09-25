import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { publishContent } from "@/lib/actions/core";
import { ActionForm } from "@/components/action-form";
import { Card, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";

export default async function PublishingPage() {
  const ready = await db.select().from(contents).where(eq(contents.stage, "ready_to_post"));
  const published = await db.select().from(contents).where(eq(contents.stage, "published"));
  return (
    <div>
      <PageHeader title="Publishing" description="Approved content is recorded with platform, URL, and actual date." />
      {ready.length === 0 ? (
        <EmptyState title="Nothing ready to post" body="Content must complete QC and final approval first." />
      ) : (
        ready.map((c) => (
          <Card key={c.id} className="mb-3">
            <h2 className="font-medium">{c.title}</h2>
            <ActionForm action={publishContent} submitLabel="Record publication">
              <input type="hidden" name="contentId" value={c.id} />
              <Field label="Platform">
                <Select name="platform" defaultValue={c.platform ?? "instagram"}>
                  <option>instagram</option>
                  <option>facebook</option>
                  <option>tiktok</option>
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
        ))
      )}
      <h2 className="mt-6 mb-2 font-medium">Published</h2>
      {published.map((c) => (
        <p key={c.id} className="text-sm">
          {c.title} — {c.publishedUrl}
        </p>
      ))}
    </div>
  );
}
