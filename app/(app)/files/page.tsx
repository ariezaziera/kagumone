import { listFiles } from "@/lib/queries";
import { EmptyState, PageHeader, Table } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { FileUpload } from "./upload";

export default async function FilesPage() {
  const rows = await listFiles();
  return (
    <div>
      <PageHeader title="Files" description="Files are attached to operational records, not a global dump." />
      <FileUpload />
      {rows.length === 0 ? (
        <EmptyState title="No files yet" body="Upload evidence against a project, task, content, or handover." />
      ) : (
        <Table>
          <thead className="bg-primary-light text-xs uppercase text-secondary">
            <tr>
              <th className="px-3 py-2">File</th>
              <th className="px-3 py-2">Related</th>
              <th className="px-3 py-2">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="border-t border-border">
                <td className="px-3 py-2">{f.filename}</td>
                <td className="px-3 py-2">
                  {f.relatedType} {f.relatedId}
                </td>
                <td className="px-3 py-2">{formatDateTime(f.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
