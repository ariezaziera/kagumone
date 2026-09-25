import type { Permission } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  permission?: Permission;
};

export type NavGroup = {
  id: string;
  label: string;
  collapsible?: boolean;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    label: "Home",
    collapsible: false,
    items: [{ href: "/dashboard", label: "Dashboard" }],
  },
  {
    id: "task",
    label: "Task",
    collapsible: true,
    items: [
      { href: "/tasks", label: "All Tasks" },
      { href: "/my-tasks", label: "My Tasks" },
      { href: "/kanban", label: "Kanban" },
      { href: "/calendar", label: "Calendar" },
    ],
  },
  {
    id: "project",
    label: "Project",
    collapsible: true,
    items: [
      { href: "/projects", label: "Projects" },
      { href: "/content", label: "Content" },
      { href: "/publishing", label: "Publishing" },
      { href: "/files", label: "Files" },
    ],
  },
  {
    id: "workplace",
    label: "Workplace",
    collapsible: true,
    items: [
      { href: "/notices", label: "Notices" },
      { href: "/equipment", label: "Equipment" },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    collapsible: true,
    items: [
      { href: "/kpi", label: "KPI", permission: "kpi:view" },
      { href: "/reports", label: "Reports", permission: "reports:view" },
      { href: "/time-tracking", label: "Time Tracking" },
      { href: "/workload", label: "Workload" },
    ],
  },
  {
    id: "people",
    label: "People",
    collapsible: true,
    items: [
      { href: "/team", label: "Team", permission: "team:view" },
      { href: "/skills", label: "Skills" },
    ],
  },
  {
    id: "management",
    label: "Management",
    collapsible: true,
    items: [
      { href: "/approvals", label: "Approvals" },
      { href: "/activity", label: "Activity / History" },
      { href: "/handover", label: "Handover" },
      { href: "/admin", label: "Administration", permission: "administration:manage" },
    ],
  },
  {
    id: "system",
    label: "Account",
    collapsible: true,
    items: [
      { href: "/notifications", label: "Notifications" },
      { href: "/ai", label: "AI Assistant" },
      { href: "/profile", label: "My Profile" },
      { href: "/settings", label: "Settings" },
      { href: "/knowledge", label: "Knowledge Base" },
    ],
  },
];

export const MOBILE_NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/my-tasks", label: "Tasks" },
  { href: "/calendar", label: "Calendar" },
  { href: "/notifications", label: "Alerts" },
  { href: "/more", label: "More" },
];

export function navItemIsActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/dashboard") return false;
  return pathname.startsWith(`${href}/`);
}
