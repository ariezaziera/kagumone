import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function newId() {
  return crypto.randomUUID();
}

export function now() {
  return new Date();
}

const LABEL_WORDS: Record<string, string> = {
  qc: "QC",
  kpi: "KPI",
  qa: "QA",
  sop: "SOP",
  faq: "FAQ",
  id: "ID",
  tiktok: "TikTok",
};

/** Turn stored codes into readable labels. Emails, URLs, and asset codes stay as stored. */
export function readableLabel(value: string | null | undefined) {
  if (!value?.trim()) return "—";
  const trimmed = value.trim();
  if (trimmed.includes("@") || /^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(trimmed)) return trimmed;
  const coded = /^[a-z0-9_.]+$/.test(trimmed) ? trimmed.replaceAll(".", " ") : trimmed;
  const shouldRewrite = /^[a-z]/.test(coded) || coded.includes("_");
  if (!shouldRewrite) return trimmed;
  return coded
    .replaceAll("_", " ")
    .replaceAll(":", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^qc\d+$/i.test(word)) return `QC${word.slice(2)}`;
      if (/[A-Z]/.test(word.slice(1))) return word.charAt(0).toUpperCase() + word.slice(1);
      const lower = word.toLowerCase();
      return LABEL_WORDS[lower] ?? lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export const DISPLAY_TZ = "Asia/Kuala_Lumpur";

export function formatDate(value: Date | string | number | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: DISPLAY_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | number | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: DISPLAY_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}
