"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  Camera,
  ChevronDown,
  CircleUser,
  Clapperboard,
  Clock,
  FileText,
  Files,
  FolderKanban,
  Gauge,
  History,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Menu,
  PanelLeft,
  Plus,
  Send,
  Settings,
  Shield,
  SquareKanban,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { NAV_GROUPS, MOBILE_NAV, navItemIsActive, type NavGroup } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/tasks": ListChecks,
  "/my-tasks": ListChecks,
  "/kanban": SquareKanban,
  "/calendar": CalendarDays,
  "/projects": FolderKanban,
  "/content": Clapperboard,
  "/publishing": Send,
  "/files": Files,
  "/notices": Megaphone,
  "/equipment": Camera,
  "/kpi": Gauge,
  "/reports": FileText,
  "/time-tracking": Clock,
  "/workload": Gauge,
  "/team": Users,
  "/skills": BookOpen,
  "/approvals": Shield,
  "/activity": History,
  "/handover": ArrowLeftRight,
  "/admin": Settings,
  "/notifications": Bell,
  "/ai": Bot,
  "/profile": CircleUser,
  "/settings": Settings,
  "/knowledge": BookOpen,
  "/more": Menu,
};

const MOBILE_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/my-tasks": ListChecks,
  "/calendar": CalendarDays,
  "/notifications": Bell,
  "/more": Menu,
};

function SidebarGroup({
  group,
  pathname,
  can,
  compact,
}: {
  group: NavGroup;
  pathname: string;
  can: (perm?: string) => boolean;
  compact: boolean;
}) {
  const items = group.items.filter((item) => can(item.permission));
  const active = items.some((item) => navItemIsActive(pathname, item.href));
  const [open, setOpen] = useState(group.collapsible === false || active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active, pathname]);

  if (items.length === 0) return null;

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-2 rounded-[12px] px-2 py-1.5 text-sm",
      navItemIsActive(pathname, href) ? "bg-primary-light font-semibold text-primary" : "text-secondary hover:bg-canvas",
    );

  if (group.collapsible === false || compact) {
    return (
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
          return (
            <li key={item.href}>
              <Link href={item.href} className={linkClass(item.href)} title={item.label}>
                <Icon size={16} aria-hidden />
                <span className={cn(compact && "lg:sr-only")}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  const panelId = `nav-${group.id}`;
  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-[12px] px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em]",
          active ? "text-primary" : "text-muted hover:bg-canvas hover:text-secondary",
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
          {items.map((item) => {
            const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
            return (
              <li key={item.href}>
                <Link href={item.href} className={cn(linkClass(item.href), "pl-2")}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-canvas text-charcoal">
                    <Icon size={14} aria-hidden />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
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
  const [collapsed, setCollapsed] = useState(false);
  const can = (perm?: string) => !perm || permissions.includes(perm);
  const initial = personName.trim().charAt(0).toUpperCase() || "K";

  return (
    <div className="min-h-screen bg-background">
      {isDev ? (
        <div className="bg-charcoal px-4 py-1 text-center text-xs text-white">
          Development environment — demo personas are not production people.
        </div>
      ) : null}
      {open ? (
        <button className="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-0 z-40 flex w-64 flex-col border-r border-border bg-surface lg:static",
            collapsed && "lg:w-[76px]",
            open ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-4">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-primary text-sm font-bold text-white">K</span>
              <span className={cn("truncate", collapsed && "lg:hidden")}>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">KAGUM</span>
                <span className="block text-sm font-bold text-text">ONE</span>
              </span>
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
          <nav className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
            {NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.id} group={group} pathname={pathname} can={can} compact={collapsed} />
            ))}
          </nav>
          <button
            type="button"
            className="m-3 hidden items-center gap-2 rounded-[12px] px-2 py-2 text-sm text-secondary hover:bg-canvas lg:flex"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft size={16} />
            <span className={cn(collapsed && "lg:hidden")}>Collapse</span>
          </button>
        </aside>
        <div className="min-h-screen min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-sm">
            <button className="rounded-[12px] p-1 text-charcoal lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <p className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-text">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal text-xs font-bold text-white">{initial}</span>
              <span className="truncate">{personName}</span>
            </p>
            <Link href="/notifications" aria-label="Notifications" className="rounded-[12px] p-2 text-charcoal hover:bg-primary-light">
              <Bell size={18} />
            </Link>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 rounded-[12px] bg-primary px-3 py-1.5 text-sm font-semibold text-white">
                <Plus size={14} /> New
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-52 rounded-[16px] border border-border bg-surface p-2 text-sm shadow-[var(--shadow-lift)]">
                {can("task:create") ? <Link className="block rounded-[10px] px-2 py-1.5 hover:bg-primary-light" href="/tasks">Create Task</Link> : null}
                {can("task:create") ? <Link className="block rounded-[10px] px-2 py-1.5 hover:bg-primary-light" href="/projects">New Project</Link> : null}
                {can("content:create") ? <Link className="block rounded-[10px] px-2 py-1.5 hover:bg-primary-light" href="/content">Add Content</Link> : null}
                {can("announcement:create") ? <Link className="block rounded-[10px] px-2 py-1.5 hover:bg-primary-light" href="/notices">Post Notice</Link> : null}
                {can("equipment:borrow") ? <Link className="block rounded-[10px] px-2 py-1.5 hover:bg-primary-light" href="/equipment">Borrow Equipment</Link> : null}
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
        {MOBILE_NAV.map((item) => {
          const Icon = MOBILE_ICONS[item.href] ?? Menu;
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex flex-col items-center gap-0.5 px-1 py-2 text-center text-[10px] font-medium leading-tight", active ? "text-primary" : "text-secondary")}
            >
              <Icon size={18} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
