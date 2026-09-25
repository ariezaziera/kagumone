import { db } from "@/lib/db";
import { activityLogs, auditLogs } from "@/lib/db/schema";
import { Card, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { desc } from "drizzle-orm";

export default async function ActivityPage() {
  const [activity, audit] = await Promise.all([
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(100),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(50),
  ]);
  return (
    <div>
      <PageHeader title="Activity / History" description="Activity is human-readable. Audit is system-level change trace." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-medium">Activity</h2>
          <ul className="space-y-2 text-sm">
            {activity.map((a) => (
              <li key={a.id}>
                {a.summary}
                <span className="block text-xs text-secondary">{formatDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Audit</h2>
          <ul className="space-y-2 text-sm">
            {audit.map((a) => (
              <li key={a.id}>
                {a.action} {a.entityType}
                <span className="block text-xs text-secondary">{formatDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
