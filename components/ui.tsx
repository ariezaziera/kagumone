import { Children, cloneElement, isValidElement, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  Camera,
  Circle,
  Clapperboard,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Shield,
  Users,
} from "lucide-react";
import { Illustration, type IllustrationName } from "@/components/illustrations";
import { cn } from "@/lib/utils";

export type ModuleKey =
  | "dashboard"
  | "projects"
  | "tasks"
  | "calendar"
  | "content"
  | "equipment"
  | "kpi"
  | "people"
  | "skills"
  | "knowledge"
  | "ai"
  | "reports"
  | "admin"
  | "workspace";

const MODULES: Record<
  ModuleKey,
  { label: string; wash: string; ink: string; icon: typeof Circle }
> = {
  dashboard: { label: "Workspace", wash: "bg-yellow-soft", ink: "text-warning", icon: LayoutDashboard },
  projects: { label: "Projects", wash: "bg-blue-soft", ink: "text-info", icon: FolderKanban },
  tasks: { label: "Tasks", wash: "bg-yellow-soft", ink: "text-warning", icon: ListChecks },
  calendar: { label: "Calendar", wash: "bg-orange-soft", ink: "text-orange", icon: CalendarDays },
  content: { label: "Content", wash: "bg-purple-soft", ink: "text-purple", icon: Clapperboard },
  equipment: { label: "Equipment", wash: "bg-green-soft", ink: "text-success", icon: Camera },
  kpi: { label: "Performance", wash: "bg-blue-soft", ink: "text-info", icon: BarChart3 },
  people: { label: "People", wash: "bg-pink-soft", ink: "text-pink", icon: Users },
  skills: { label: "Skills", wash: "bg-purple-soft", ink: "text-purple", icon: BookOpen },
  knowledge: { label: "Knowledge", wash: "bg-purple-soft", ink: "text-purple", icon: BookOpen },
  ai: { label: "Assistant", wash: "bg-purple-soft", ink: "text-purple", icon: Bot },
  reports: { label: "Reports", wash: "bg-blue-soft", ink: "text-info", icon: BarChart3 },
  admin: { label: "Administration", wash: "bg-charcoal-soft", ink: "text-charcoal", icon: Shield },
  workspace: { label: "KAGUM ONE", wash: "bg-primary-light", ink: "text-primary", icon: Circle },
};

export function Card({
  className,
  accent,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  accent?: "red" | "yellow" | "blue" | "green" | "orange" | "purple" | "pink" | "charcoal";
}) {
  const stripe = {
    red: "border-t-primary",
    yellow: "border-t-yellow",
    blue: "border-t-blue",
    green: "border-t-green",
    orange: "border-t-orange",
    purple: "border-t-purple",
    pink: "border-t-pink",
    charcoal: "border-t-charcoal",
  } as const;
  return (
    <div
      className={cn(
        "kagum-card rounded-[18px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]",
        accent ? cn("border-t-[3px]", stripe[accent]) : null,
        className,
      )}
      {...props}
    />
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold", className)}>
      <span className="text-text">KAGUM</span> <span className="text-primary">ONE</span>
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  module = "workspace",
}: {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  module?: ModuleKey;
}) {
  const theme = MODULES[module];
  const Icon = theme.icon;
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]", theme.wash, theme.ink)}>
          <Icon size={20} aria-hidden />
        </span>
        <div>
          {theme.label === "KAGUM ONE" ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
              <BrandWordmark />
            </p>
          ) : (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{theme.label}</p>
          )}
          <h1 className="text-2xl font-bold leading-snug text-text sm:text-[28px]">{title}</h1>
          {description ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-secondary">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const buttonBase =
  "inline-flex cursor-pointer select-none items-center justify-center gap-1.5 rounded-[12px] border px-3.5 py-2 text-sm font-semibold leading-snug transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 disabled:active:translate-y-0";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-white shadow-[0_1px_0_rgb(17_17_17/12%)] hover:border-primary-dark hover:bg-primary-dark active:border-[#8e0d13] active:bg-[#8e0d13] active:shadow-none",
  secondary:
    "border-border bg-surface text-text shadow-[0_1px_0_rgb(17_17_17/4%)] hover:border-[#f0b4b6] hover:bg-primary-light active:border-[#e7a0a3] active:bg-[#f8d4d6] active:shadow-none",
  danger:
    "border-error bg-error text-white shadow-[0_1px_0_rgb(17_17_17/12%)] hover:border-[#8e0d13] hover:bg-[#8e0d13] active:border-[#7a0b10] active:bg-[#7a0b10] active:shadow-none",
  ghost:
    "border-transparent bg-transparent text-secondary shadow-none hover:bg-canvas hover:text-text active:bg-charcoal-soft",
};

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cn(buttonBase, buttonStyles[variant], className);
}

export function iconButtonClass(className?: string) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center rounded-[12px] text-charcoal transition-colors hover:bg-canvas active:scale-95 active:bg-charcoal-soft motion-reduce:transition-none motion-reduce:active:scale-100",
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

const controlClass = "w-full rounded-[12px] border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClass, className)} {...props} />;
}

export function Label({ className, ...props }: HTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-medium text-text", className)} {...props} />;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export type BadgeTone = "success" | "warning" | "error" | "info" | "neutral" | "yellow" | "blue" | "purple" | "orange" | "pink";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  const map: Record<BadgeTone, string> = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    error: "bg-error-soft text-error",
    info: "bg-info-soft text-info",
    neutral: "bg-canvas text-charcoal",
    yellow: "bg-warning-soft text-warning",
    blue: "bg-info-soft text-info",
    purple: "bg-purple-soft text-purple",
    orange: "bg-orange-soft text-orange",
    pink: "bg-pink-soft text-pink",
  };
  const label = typeof children === "string" ? children.replaceAll("_", " ") : children;
  return <span className={cn("inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-normal capitalize", map[tone])}>{label}</span>;
}

const STATUS_TONES: Record<string, BadgeTone> = {
  pending_acknowledgement: "yellow",
  pending: "yellow",
  acknowledged: "blue",
  in_progress: "purple",
  submitted: "orange",
  completed: "success",
  overdue: "error",
  draft: "neutral",
  benchmark: "neutral",
  planned: "blue",
  production: "purple",
  self_qc: "yellow",
  qc1: "orange",
  corrections_qc1: "error",
  qc2: "orange",
  corrections_qc2: "error",
  final_approval: "success",
  ready_to_post: "blue",
  published: "success",
  performance: "purple",
  available: "success",
  reserved: "blue",
  borrowed: "purple",
  late: "error",
  damaged: "orange",
  maintenance: "yellow",
  returned: "success",
  approved: "success",
  rejected: "error",
  blocked: "error",
  missing: "error",
  inactive: "neutral",
  active: "success",
  planning: "blue",
  high: "error",
  urgent: "error",
  medium: "yellow",
  low: "neutral",
};

export function statusTone(status: string): BadgeTone {
  return STATUS_TONES[status.toLowerCase()] ?? "neutral";
}

const EMPTY_ART: Record<string, IllustrationName> = {
  "no projects yet": "empty-folder",
  "no tasks in this view": "search",
  "nothing overdue": "caught-up",
  "no notifications": "quiet",
  "all quiet here": "quiet",
  "no upcoming deadlines": "caught-up",
  "no content records": "content",
  "no files yet": "empty-folder",
  "no equipment registered": "equipment",
  "nothing ready to post": "content",
  "no handovers": "empty-folder",
  "no published sops yet": "knowledge",
  "no notices yet": "quiet",
  "no activity yet": "empty",
};

export function EmptyState({
  title,
  body,
  action,
  illustration,
  plain = false,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  illustration?: IllustrationName | "none";
  plain?: boolean;
}) {
  const art = illustration === "none" ? null : illustration ?? EMPTY_ART[title.toLowerCase()] ?? "empty";
  const content = (
    <>
      {art ? <Illustration name={art} className="mb-3 h-24 w-36" /> : null}
      <p className="text-base font-semibold text-text">{title}</p>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-secondary">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </>
  );
  if (plain) return <div className="flex flex-col items-center px-2 py-4 text-center">{content}</div>;
  return <Card className="flex flex-col items-center px-6 py-8 text-center">{content}</Card>;
}

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function collectHeaders(node: ReactNode, into: string[]) {
  if (!isValidElement<{ children?: ReactNode }>(node)) return;
  if (node.type === "th") {
    into.push(textOf(node.props.children).replace(/\s+/g, " ").trim());
    return;
  }
  Children.forEach(node.props.children, (child) => collectHeaders(child, into));
}

function stampRow(row: ReactElement<{ children?: ReactNode }>, headers: string[]) {
  let index = 0;
  const children = Children.map(row.props.children, (cell) => {
    if (!isValidElement<{ children?: ReactNode }>(cell) || cell.type !== "td") return cell;
    const label = headers[index] ?? "";
    index += 1;
    return cloneElement(cell, { "data-label": label } as { children?: ReactNode });
  });
  return cloneElement(row, undefined, children);
}

function stampBody(node: ReactNode, headers: string[]): ReactNode {
  if (!isValidElement<{ children?: ReactNode }>(node)) return node;
  if (node.type === "tr") return stampRow(node, headers);
  if (node.type === "tbody") {
    const children = Children.map(node.props.children, (child) => stampBody(child, headers));
    return cloneElement(node, undefined, children);
  }
  return node;
}

export function Table({ children }: { children: ReactNode }) {
  const headers: string[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === "thead") collectHeaders(child, headers);
  });
  const stamped = Children.map(children, (child) => stampBody(child, headers));
  return (
    <div className="kagum-table">
      <table className="w-full text-left text-[13px]">{stamped}</table>
    </div>
  );
}
