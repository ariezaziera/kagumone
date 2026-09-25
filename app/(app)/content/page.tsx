import Link from "next/link";
import { createContent } from "@/lib/actions/core";
import { listProjects } from "@/lib/queries";
import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, Table, Textarea, statusTone } from "@/components/ui";
import { desc } from "drizzle-orm";

export default async function ContentPage() {
  const [rows, projects] = await Promise.all([
    db.select().from(contents).orderBy(desc(contents.updatedAt)),
    listProjects(),
  ]);
  return (
    <div>
      <PageHeader title="Content" description="Lifecycle records. Planned is not the same as published or KPI count." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {rows.length === 0 ? (
          <EmptyState title="No content records" body="Create a content item to start the production and QC loop." />
        ) : (
          <Table>
            <thead className="bg-primary-light text-xs uppercase text-secondary">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Pillar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link className="text-info" href={`/content/${c.id}`}>
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(c.stage)}>{c.stage}</Badge>
                  </td>
                  <td className="px-3 py-2">{c.platform}</td>
                  <td className="px-3 py-2">{c.pillar}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Card>
          <h2 className="mb-3 font-medium">Add content</h2>
          <ActionForm action={createContent} submitLabel="Create content">
            <Field label="Title">
              <Input name="title" required />
            </Field>
            <Field label="Pillar">
              <Input name="pillar" />
            </Field>
            <Field label="Platform">
              <Select name="platform">
                <option value="instagram">instagram</option>
                <option value="facebook">facebook</option>
                <option value="tiktok">tiktok</option>
              </Select>
            </Field>
            <Field label="Project">
              <Select name="projectId">
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Brief">
              <Textarea name="brief" />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
