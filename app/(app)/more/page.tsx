import Link from "next/link";
import { redirect } from "next/navigation";
import { NAV_GROUPS } from "@/lib/nav";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { WorkHero } from "@/components/work-surface";

export default async function MorePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(ctx, item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="dashboard"
        kicker="More"
        title="All sections"
        artWash="bg-yellow-soft"
        description="The same groups as the sidebar. Each link opens that section."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <section key={group.id} className="rounded-[18px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{group.label}</h2>
            <ul className="mt-3 space-y-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link className="block rounded-[12px] px-2 py-1.5 text-sm font-semibold text-text hover:bg-canvas" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
