import Link from "next/link";
import { NAV_GROUPS } from "@/lib/nav";
import { PageHeader } from "@/components/ui";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { redirect } from "next/navigation";

export default async function MorePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  return (
    <div>
      <PageHeader title="More" description="Same groups as the sidebar. Open a category on desktop to keep the list short." />
      {NAV_GROUPS.map((g) => {
        const items = g.items.filter((i) => !i.permission || hasPermission(ctx, i.permission));
        if (items.length === 0) return null;
        return (
          <div key={g.id} className="mb-4">
            <h2 className="text-sm font-semibold uppercase text-muted">{g.label}</h2>
            <ul>
              {items.map((i) => (
                <li key={i.href}>
                  <Link className="text-info" href={i.href}>
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
