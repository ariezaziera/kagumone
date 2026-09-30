"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  Camera,
  ChevronDown,
  CircleUser,
  Clapperboard,
  FileText,
  Files,
  FolderKanban,
  Gauge,
  History,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Menu,
  MessageCircle,
  Plus,
  Send,
  Settings,
  Shield,
  SlidersHorizontal,
  SquareKanban,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { NAV_GROUPS, MOBILE_NAV, navItemIsActive, type NavGroup } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import { PersonAvatar } from "@/components/person-avatar";
import { BrandWordmark, Button, buttonClass, iconButtonClass } from "@/components/ui";
import { NotificationBell } from "@/components/notification-bell";
import type { NotificationPreview } from "@/lib/queries";

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
  "/chats": MessageCircle,
  "/equipment": Camera,
  "/kpi": Gauge,
  "/reports": FileText,
  "/workload": BarChart3,
  "/team": Users,
  "/skills": Award,
  "/approvals": Shield,
  "/activity": History,
  "/handover": ArrowLeftRight,
  "/admin": SlidersHorizontal,
  "/notifications": Bell,
  "/ai": Bot,
  "/profile": CircleUser,
  "/settings": Settings,
  "/knowledge": BookOpen,
};

const MOBILE_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/my-tasks": ListChecks,
  "/calendar": CalendarDays,
  "/chats": MessageCircle,
  "/notifications": Bell,
};

function countLabel(count: number) {
  return count > 99 ? "99+" : String(count);
}

function CountBadge({ count, overlay = false }: { count: number; overlay?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-white ring-2 ring-surface",
        overlay ? "absolute -right-1.5 -top-1.5" : "ml-auto shrink-0",
      )}
    >
      {countLabel(count)}
    </span>
  );
}

function SidebarGroup({
  group,
  pathname,
  can,
  counts,
}: {
  group: NavGroup;
  pathname: string;
  can: (perm?: string) => boolean;
  counts: Record<string, number>;
}) {
  const items = group.items.filter((item) => can(item.permission));
  const active = items.some((item) => navItemIsActive(pathname, item.href));
  const [open, setOpen] = useState(group.collapsible === false || active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active, pathname]);

  if (items.length === 0) return null;

  const waiting = items.reduce((sum, item) => sum + (counts[item.href] ?? 0), 0);
  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-2 rounded-[12px] px-2 py-1.5 text-sm transition-colors",
      navItemIsActive(pathname, href) ? "bg-primary-light font-semibold text-primary" : "text-secondary hover:bg-canvas active:bg-charcoal-soft",
    );

  function itemLink(item: NavGroup["items"][number], iconWrap: boolean) {
    const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
    const count = counts[item.href] ?? 0;
    return (
      <Link href={item.href} className={cn(linkClass(item.href), iconWrap && "pl-2")} title={count > 0 ? `${item.label}, ${countLabel(count)} waiting` : item.label}>
        {iconWrap ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-canvas text-charcoal">
            <Icon size={14} aria-hidden />
          </span>
        ) : (
          <Icon size={16} aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <CountBadge count={count} />
      </Link>
    );
  }

  if (group.collapsible === false) {
    return (
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.href}>{itemLink(item, false)}</li>
        ))}
      </ul>
    );
  }

  const panelId = `nav-${group.id}`;
  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-[12px] px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
          active ? "text-primary" : "text-muted hover:bg-canvas hover:text-secondary active:bg-charcoal-soft",
        )}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 truncate">{group.label}</span>
        <span className="flex items-center gap-1">
          {!open ? <CountBadge count={waiting} /> : null}
          <ChevronDown size={14} className={cn("transition-transform", open ? "rotate-0" : "-rotate-90")} />
        </span>
      </button>
      {open ? (
        <ul id={panelId} className="mt-0.5 space-y-0.5">
          {items.map((item) => (
            <li key={item.href}>{itemLink(item, true)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AppShell({
  children,
  notices,
  attention,
  personName,
  personId,
  hasPhoto,
  photoVersion,
  permissions,
  isDev,
}: {
  children: React.ReactNode;
  notices: NotificationPreview;
  attention: Record<string, number>;
  personName: string;
  personId: string;
  hasPhoto: boolean;
  photoVersion: number;
  permissions: string[];
  isDev: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState(attention);
  const attentionKey = Object.entries(attention).map(([href, count]) => `${href}:${count}`).join("|");
  const reportUnread = useCallback((value: number) => {
    setCounts((current) => ({ ...current, "/notifications": value }));
  }, []);

  useEffect(() => {
    setCounts(attention);
  }, [attentionKey, attention]);
  const can = (perm?: string) => !perm || permissions.includes(perm);
  const avatar = (key: string) => (
    <PersonAvatar key={key} personId={personId} name={personName} hasPhoto={hasPhoto} version={photoVersion} size="sm" />
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function signOut() {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {isDev ? (
        <div className="shrink-0 bg-charcoal px-4 py-1 text-center text-xs text-white">
          Development environment — demo personas are not production people.
        </div>
      ) : null}
      {open ? (
        <button className="fixed inset-0 z-30 cursor-pointer bg-black/40 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "fixed inset-y-0 z-40 flex w-64 flex-col border-r border-border bg-surface lg:static lg:h-full lg:shrink-0",
            open ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-4">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
              <Image src="/kagum-mark.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />
              <span className="truncate">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-text">KAGUM</span>
                <span className="block text-sm font-bold text-primary">ONE</span>
              </span>
            </Link>
            <button className={iconButtonClass("p-1.5 lg:hidden")} onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
          <nav className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
            {NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.id} group={group} pathname={pathname} can={can} counts={counts} />
            ))}
          </nav>
          <div className="border-t border-border p-3 lg:hidden">
            <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-text">
              {avatar("menu")}
              <span className="truncate">{personName}</span>
            </p>
            <Button variant="secondary" className="mt-3 w-full" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-20 flex shrink-0 items-center gap-2 border-b border-border bg-surface px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
            <button className={cn(iconButtonClass("relative p-1.5 lg:hidden"))} onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={18} />
              <CountBadge
                overlay
                count={Object.entries(counts).reduce((sum, [href, count]) => sum + (MOBILE_NAV.some((item) => item.href === href) ? 0 : count), 0)}
              />
            </button>
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2 lg:hidden">
              <Image src="/kagum-mark.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
              <BrandWordmark className="whitespace-nowrap text-[13px] leading-none sm:text-sm" />
            </Link>
            <p className="hidden min-w-0 flex-1 items-center gap-2 text-sm font-medium text-text lg:flex">
              {avatar("header")}
              <span className="truncate">{personName}</span>
            </p>
            <div className="ml-auto flex items-center gap-1">
            <NotificationBell initial={notices} onUnread={reportUnread} />
            <details className="relative">
              <summary className={buttonClass("primary", "kagum-menu-open list-none px-2.5 py-1.5 sm:px-3")}>
                <Plus size={14} /> <span className="hidden sm:inline">New</span>
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-52 rounded-[16px] border border-border bg-surface p-2 text-sm shadow-[var(--shadow-lift)]">
                {can("task:create") ? <Link className="block rounded-[10px] px-2 py-1.5 transition-colors hover:bg-primary-light active:bg-[#f8d4d6]" href="/tasks#create-task">Create Task</Link> : null}
                {can("task:create") ? <Link className="block rounded-[10px] px-2 py-1.5 transition-colors hover:bg-primary-light active:bg-[#f8d4d6]" href="/projects#create-project">New Project</Link> : null}
                {can("content:create") ? <Link className="block rounded-[10px] px-2 py-1.5 transition-colors hover:bg-primary-light active:bg-[#f8d4d6]" href="/content#add-content">Add Content</Link> : null}
                {can("announcement:create") ? <Link className="block rounded-[10px] px-2 py-1.5 transition-colors hover:bg-primary-light active:bg-[#f8d4d6]" href="/notices#post-notice">Post Notice</Link> : null}
                {can("equipment:borrow") ? <Link className="block rounded-[10px] px-2 py-1.5 transition-colors hover:bg-primary-light active:bg-[#f8d4d6]" href="/equipment#borrow">Borrow Equipment</Link> : null}
              </div>
            </details>
            <Button variant="ghost" className="hidden lg:inline-flex" onClick={signOut}>
              Sign out
            </Button>
            </div>
          </header>
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 pb-28 lg:px-8 lg:py-6 lg:pb-6">{children}</main>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid border-t border-border bg-surface pb-[max(0.35rem,env(safe-area-inset-bottom))] lg:hidden" style={{ gridTemplateColumns: `repeat(${MOBILE_NAV.length}, minmax(0, 1fr))` }}>
        {MOBILE_NAV.map((item) => {
          const Icon = MOBILE_ICONS[item.href] ?? Menu;
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          const count = counts[item.href] ?? 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={count > 0 ? `${item.label}, ${countLabel(count)} waiting` : item.label}
              className={cn(
                "group flex flex-col items-center gap-0.5 px-1 py-1.5 text-center text-[10px] font-medium leading-snug transition-colors",
                active ? "text-primary" : "text-secondary hover:text-text",
              )}
            >
              <span
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-[12px] transition-colors",
                  active ? "bg-primary-light" : "group-hover:bg-canvas group-active:bg-charcoal-soft",
                )}
              >
                <Icon size={18} aria-hidden />
                <CountBadge overlay count={count} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
