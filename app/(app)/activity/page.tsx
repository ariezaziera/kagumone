import { listActivity, listAudit } from "@/lib/queries";
import { Card, PageHeader, RecordList } from "@/components/ui";
import { formatDateTime, readableLabel } from "@/lib/utils";

export default async function ActivityPage() {
  const [activity, audit] = await Promise.all([listActivity(100), listAudit(50)]);
  return (
    <div>
      <PageHeader module="admin" title="Activity / History" description="Activity is human-readable. Audit is system-level change trace." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-medium">Activity</h2>
          <RecordList>
            <ul className="kagum-list text-sm">
              {activity.map((a) => (
                <li key={a.id} data-record="" data-sort={a.createdAt ? new Date(a.createdAt).toISOString() : ""}>
                  {a.summary}
                  <span className="block text-xs text-secondary">{formatDateTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          </RecordList>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Audit</h2>
          <RecordList>
            <ul className="kagum-list text-sm">
              {audit.map((a) => (
                <li key={a.id} data-record="" data-sort={a.createdAt ? new Date(a.createdAt).toISOString() : ""}>
                  {readableLabel(a.action)} · {readableLabel(a.entityType)}
                  <span className="block text-xs text-secondary">{formatDateTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          </RecordList>
        </Card>
      </div>
    </div>
  );
}
