import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { formatDateTime, readableLabel } from "@/lib/utils";

export type FileTarget = { type: string; id: string; label: string };

export function recordHref(type: string | null | undefined, id: string | null | undefined) {
  if (!type || !id) return null;
  if (type === "project") return `/projects/${id}`;
  if (type === "task") return `/tasks/${id}`;
  if (type === "content") return `/content/${id}`;
  if (type === "equipment") return `/equipment/${id}`;
  if (type === "handover") return "/handover";
  if (type === "knowledge") return "/knowledge";
  return null;
}

export function historyHref(type: string | null | undefined, id: string | null | undefined) {
  if (!type || !id) return null;
  if (type === "person") return `/team/${id}`;
  if (type === "approval") return "/approvals";
  if (type === "setting") return "/admin";
  return recordHref(type, id);
}

export function FileCards({
  rows,
}: {
  rows: {
    id: string;
    filename: string;
    uploader: string | null;
    createdAt: Date | string | null;
  }[];
}) {
  if (rows.length === 0) return <p className="text-sm text-secondary">No files on this record.</p>;
  return (
    <div className="space-y-2">
      {rows.map((file) => (
        <div key={file.id} className="flex items-start gap-3 rounded-[14px] border border-border bg-canvas px-3 py-2.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-blue-soft text-info">
            <FileText size={16} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <a className="block truncate text-sm font-semibold text-text hover:text-primary" href={`/api/files/${file.id}`}>
              {file.filename}
            </a>
            <span className="mt-0.5 block text-xs text-secondary">
              {file.uploader ? `${file.uploader} · ` : ""}
              {formatDateTime(file.createdAt)}
            </span>
          </span>
          <a className="inline-flex h-8 items-center gap-1 rounded-[10px] px-2 text-xs font-semibold text-info hover:bg-surface" href={`/api/files/${file.id}`}>
            <Download size={14} aria-hidden />
            Open
          </a>
        </div>
      ))}
    </div>
  );
}

export function linkedFileCard(file: {
  id: string;
  filename: string;
  relatedType: string | null;
  relatedId: string | null;
  relatedLabel: string | null;
  uploader: string | null;
  createdAt: Date | string | null;
}) {
  const href = recordHref(file.relatedType, file.relatedId);
  const search = [file.filename, file.relatedType, file.relatedLabel, file.uploader].filter(Boolean).join(" ");
  return (
    <article
      key={file.id}
      data-record=""
      data-sort={file.createdAt ? new Date(file.createdAt).toISOString() : ""}
      data-label-text={search}
      className="flex items-start gap-3 rounded-[18px] border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]"
    >
      <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-blue-soft text-info">
        <FileText size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <a className="block truncate text-base font-bold text-text hover:text-primary" href={`/api/files/${file.id}`}>
          {file.filename}
        </a>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary">
          {file.relatedType ? <span className="font-semibold text-charcoal">{readableLabel(file.relatedType)}</span> : null}
          {href && file.relatedLabel ? (
            <Link className="font-semibold text-info" href={href}>
              {file.relatedLabel}
            </Link>
          ) : (
            <span>{file.relatedLabel ?? "Record no longer listed"}</span>
          )}
          {file.uploader ? <span>{file.uploader}</span> : null}
          <span>{formatDateTime(file.createdAt)}</span>
        </span>
      </span>
      <a className="inline-flex shrink-0 items-center gap-1 rounded-[12px] border border-border bg-canvas px-2.5 py-1.5 text-xs font-semibold text-text hover:bg-primary-light" href={`/api/files/${file.id}`}>
        <Download size={14} aria-hidden />
        Open
      </a>
    </article>
  );
}
