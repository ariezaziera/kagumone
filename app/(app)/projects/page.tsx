import Link from "next/link";
import { createProject } from "@/lib/actions/core";
import { listPeople, listProjects } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Select, Table, Textarea, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { getAuthContext } from "@/lib/auth/context";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const [rows, peopleRows] = await Promise.all([listProjects(), listPeople()]);
  return (
    <div>
      <PageHeader title="Projects" description="Authoritative project records, owners, and timelines." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {rows.length === 0 ? (
          <EmptyState title="No projects yet" body="Create a project to connect tasks, content, and files." />
        ) : (
          <Table>
            <thead className="bg-primary-light text-xs uppercase text-secondary">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link className="text-info" href={`/projects/${p.id}`}>
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="px-3 py-2">{p.priority}</td>
                  <td className="px-3 py-2 text-secondary">{formatDate(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Card>
          <h2 className="mb-3 font-medium">Create project</h2>
          <ActionForm action={createProject} submitLabel="Create project">
            <Field label="Name">
              <Input name="name" required />
            </Field>
            <Field label="Objective">
              <Textarea name="objective" />
            </Field>
            <Field label="Description">
              <Textarea name="description" />
            </Field>
            <Field label="Owner">
              <Select name="ownerId" defaultValue={ctx.person.id}>
                {peopleRows.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select name="priority" defaultValue="medium">
                <option>low</option>
                <option>medium</option>
                <option>high</option>
              </Select>
            </Field>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
