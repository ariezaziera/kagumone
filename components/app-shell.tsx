"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, Menu, Plus, X } from "lucide-react";
import { NAV_GROUPS, MOBILE_NAV, navItemIsActive, type NavGroup } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui";

function SidebarGroup({
  group,
  pathname,
  can,
}: {
  group: NavGroup;
  pathname: string;
  can: (perm?: string) => boolean;
}) {
  const items = group.items.filter((item) => can(item.permission));
  const active = items.some((item) => navItemIsActive(pathname, item.href));
  const [open, setOpen] = useState(group.collapsible === false || active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active, pathname]);

  if (items.length === 0) return null;

  if (group.collapsible === false) {
    return (
      <div>
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-md px-2 py-1.5 text-sm",
                  navItemIsActive(pathname, item.href) ? "bg-primary-light text-primary" : "text-secondary hover:bg-primary-light",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const panelId = `nav-${group.id}`;
  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide",
          active ? "text-primary" : "text-muted hover:bg-primary-light hover:text-secondary",
        )}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {group.label}
        <ChevronDown size={14} className={cn("transition-transform", open ? "rotate-0" : "-rotate-90")} />
      </button>
      {open ? (
        <ul id={panelId} className="mt-0.5 space-y-0.5">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-md px-2 py-1.5 pl-4 text-sm",
                  navItemIsActive(pathname, item.href) ? "bg-primary-light text-primary" : "text-secondary hover:bg-primary-light",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AppShell({
  children,
  personName,
  permissions,
  isDev,
}: {
  children: React.ReactNode;
  personName: string;
  permissions: string[];
  isDev: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const can = (perm?: string) => !perm || permissions.includes(perm);

  return (
    <div className="min-h-screen bg-background">
      {isDev ? (
        <div className="bg-warning px-4 py-1 text-center text-xs text-white">
          Development environment — demo personas are not production people.
        </div>
      ) : null}
      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-0 z-30 w-64 border-r border-border bg-surface pt-14 lg:static lg:block lg:pt-0",
            open ? "block" : "hidden",
          )}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/dashboard" className="font-semibold text-primary">
              KAGUM ONE
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
          <nav className="space-y-2 overflow-y-auto px-3 pb-24">
            {NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.id} group={group} pathname={pathname} can={can} />
            ))}
          </nav>
        </aside>
        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <p className="flex-1 text-sm text-secondary">{personName}</p>
            <Link href="/notifications" aria-label="Notifications" className="text-secondary">
              <Bell size={18} />
            </Link>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-white">
                <Plus size={14} /> New
              </summary>
              <div className="absolute right-0 mt-1 w-48 rounded-md border border-border bg-surface p-2 text-sm shadow-sm">
                {can("task:create") ? <Link className="block px-2 py-1 hover:bg-primary-light" href="/tasks">Create Task</Link> : null}
                {can("task:create") ? <Link className="block px-2 py-1 hover:bg-primary-light" href="/projects">New Project</Link> : null}
                {can("content:create") ? <Link className="block px-2 py-1 hover:bg-primary-light" href="/content">Add Content</Link> : null}
                {can("announcement:create") ? <Link className="block px-2 py-1 hover:bg-primary-light" href="/notices">Post Notice</Link> : null}
                {can("equipment:borrow") ? <Link className="block px-2 py-1 hover:bg-primary-light" href="/equipment">Borrow Equipment</Link> : null}
              </div>
            </details>
            <Button
              variant="ghost"
              onClick={() => {
                void authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/login";
                    },
                  },
                });
              }}
            >
              Sign out
            </Button>
          </header>
          <main className="px-4 py-6 pb-24 lg:px-8">{children}</main>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-surface lg:hidden">
        {MOBILE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn("py-2 text-center text-xs", pathname.startsWith(item.href) ? "text-primary" : "text-secondary")}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
