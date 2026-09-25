import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-border bg-surface p-4", className)} {...props} />;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-text">{title}</h1>
        {description ? <p className="mt-1 text-sm text-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "border border-border bg-surface text-text hover:bg-primary-light",
    danger: "bg-error text-white hover:opacity-90",
    ghost: "text-secondary hover:bg-primary-light",
  } as const;
  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50", styles[variant], className)}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text", props.className)}
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text", props.className)}
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text", props.className)}
      {...props}
    />
  );
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

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "error" | "info" | "neutral";
}) {
  const map = {
    success: "bg-green-50 text-success",
    warning: "bg-amber-50 text-warning",
    error: "bg-red-50 text-error",
    info: "bg-blue-50 text-info",
    neutral: "bg-primary-light text-primary",
  };
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", map[tone])}>{children}</span>;
}

export function statusTone(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  const value = status.toLowerCase();
  if (["completed", "published", "approved", "available", "returned", "active"].includes(value)) return "success";
  if (["pending", "pending_acknowledgement", "submitted", "late", "maintenance", "overdue"].includes(value)) return "warning";
  if (["rejected", "blocked", "missing", "damaged", "inactive"].includes(value)) return "error";
  if (["in_progress", "borrowed", "qc1", "qc2"].includes(value)) return "info";
  return "neutral";
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <Card className="text-center">
      <p className="font-medium text-text">{title}</p>
      <p className="mt-1 text-sm text-secondary">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </Card>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}
