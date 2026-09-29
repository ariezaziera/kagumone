"use client";

import { Search } from "lucide-react";
import { Children, cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
const controlClass =
  "w-full rounded-[12px] border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary";

type ElementProps = {
  children?: ReactNode;
  "data-record"?: string;
  "data-record-group"?: string;
  "data-sort"?: string;
  "data-label"?: string;
  "data-label-text"?: string;
};

type El = ReactElement<ElementProps>;

function isEl(node: ReactNode): node is El {
  return isValidElement<ElementProps>(node);
}

function visibleText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(visibleText).join("");
  if (!isEl(node)) return "";
  if (typeof node.props["data-label-text"] === "string") return node.props["data-label-text"];
  return visibleText(node.props.children);
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function compareValues(a: string, b: string) {
  const numeric = /^-?\d+(\.\d+)?$/;
  if (numeric.test(a) && numeric.test(b)) return Number(a) - Number(b);
  const ad = Date.parse(a);
  const bd = Date.parse(b);
  if (!Number.isNaN(ad) && !Number.isNaN(bd) && /\d{4}/.test(a) && /\d{4}/.test(b)) return ad - bd;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function collectHeaders(node: ReactNode, into: string[]) {
  if (!isEl(node)) return;
  if (node.type === "th") {
    into.push(clean(visibleText(node.props.children)));
    return;
  }
  Children.forEach(node.props.children, (child) => collectHeaders(child, into));
}

function cellsOf(row: El) {
  return Children.toArray(row.props.children).filter((cell): cell is El => isEl(cell) && cell.type === "td");
}

function rowsOf(body: El) {
  return Children.toArray(body.props.children).filter((row): row is El => isEl(row) && row.type === "tr");
}

function cellLabel(cell: El) {
  return clean(visibleText(cell.props.children));
}

function cellSort(cell: El) {
  const explicit = cell.props["data-sort"];
  if (explicit != null && String(explicit).length > 0) return String(explicit);
  return cellLabel(cell);
}

function stampRow(row: El, headers: string[]) {
  let index = 0;
  const children = Children.map(row.props.children, (cell) => {
    if (!isEl(cell) || cell.type !== "td") return cell;
    const label = headers[index] ?? "";
    index += 1;
    return cloneElement(cell, { "data-label": label });
  });
  return cloneElement(row, undefined, children);
}

function Toolbar({
  query,
  onQuery,
  shown,
  total,
  children,
}: {
  query: string;
  onQuery: (value: string) => void;
  shown: number;
  total: number;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" size={16} aria-hidden />
          <input
            className={`${controlClass} pl-9`}
            value={query}
            placeholder="Filter"
            aria-label="Filter records"
            onChange={(event) => onQuery(event.target.value)}
          />
        </div>
        {children}
      </div>
      <p className="text-xs text-secondary">{shown === total ? `${total} records` : `${shown} of ${total} records`}</p>
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState("");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<number, string>>({});

  const headers: string[] = [];
  const parts = Children.toArray(children);
  parts.forEach((child) => {
    if (isEl(child) && child.type === "thead") collectHeaders(child, headers);
  });
  const body = parts.find((child): child is El => isEl(child) && child.type === "tbody");
  const rows = body ? rowsOf(body) : [];

  const columns = headers.map((header, index) => {
      const values = [...new Set(rows.map((row) => {
        const cell = cellsOf(row)[index];
        return cell ? cellLabel(cell) : "";
      }).filter((value) => value && value !== "—"))].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    return { header, index, values, filterable: values.length >= 2 && values.length <= 8 };
  });

  const activeFilters = Object.entries(columnFilters).filter(([, value]) => value);
  const visible = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => {
      const labels = cellsOf(row).map(cellLabel);
      if (query.trim() && !labels.join(" ").toLowerCase().includes(query.trim().toLowerCase())) return false;
      return activeFilters.every(([key, value]) => labels[Number(key)] === value);
    })
    .sort((a, b) => {
      if (sortCol === "") return a.index - b.index;
      const ai = cellsOf(a.row)[Number(sortCol)];
      const bi = cellsOf(b.row)[Number(sortCol)];
      const cmp = compareValues(ai ? cellSort(ai) : "", bi ? cellSort(bi) : "");
      return dir === "asc" ? cmp : -cmp;
    });

  const stamped = parts.map((child) => {
    if (!isEl(child) || child.type !== "tbody" || !body) return child;
    return cloneElement(child, undefined, visible.map(({ row }) => stampRow(row, headers)));
  });

  return (
    <div>
      {rows.length > 0 ? (
        <Toolbar query={query} onQuery={setQuery} shown={visible.length} total={rows.length}>
          <select className={`${controlClass} sm:max-w-[12rem]`} aria-label="Sort by" value={sortCol} onChange={(event) => setSortCol(event.target.value)}>
            <option value="">As listed</option>
            {headers.map((header, index) => (
              <option key={`${header}-${index}`} value={String(index)}>
                {header || `Column ${index + 1}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[12px] border border-border bg-surface px-3 text-sm font-semibold text-charcoal hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={dir === "asc" ? "Sort ascending" : "Sort descending"}
            disabled={sortCol === ""}
            onClick={() => setDir((current) => (current === "asc" ? "desc" : "asc"))}
          >
            {dir === "asc" ? "Ascending" : "Descending"}
          </button>
          {columns
            .filter((column) => column.filterable)
            .map((column) => (
              <select
                key={column.index}
                className={`${controlClass} sm:max-w-[12rem]`}
                aria-label={`Filter ${column.header}`}
                value={columnFilters[column.index] ?? ""}
                onChange={(event) => setColumnFilters((current) => ({ ...current, [column.index]: event.target.value }))}
              >
                <option value="">{column.header}: all</option>
                {column.values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            ))}
        </Toolbar>
      ) : null}
      {query.trim() || activeFilters.length > 0 ? (
        visible.length === 0 ? <p className="mb-3 text-sm text-secondary">Nothing matches this filter.</p> : null
      ) : null}
      <div className="kagum-table">
        <table className="w-full text-left text-[13px]">{stamped}</table>
      </div>
    </div>
  );
}

function hasRecordFlag(node: El) {
  return node.props["data-record"] != null;
}

function isRecord(node: ReactNode): node is El {
  return isEl(node) && hasRecordFlag(node);
}

function treeHasRecord(node: ReactNode): boolean {
  if (!isEl(node)) return false;
  if (hasRecordFlag(node)) return true;
  return Children.toArray(node.props.children).some(treeHasRecord);
}

function recordValue(node: El, mode: "text" | "value") {
  if (mode === "value") return String(node.props["data-sort"] ?? visibleText(node));
  return clean(visibleText(node));
}

function rewrite(node: ReactNode, query: string, sort: "listed" | "text" | "value", dir: "asc" | "desc"): ReactNode {
  if (!isEl(node) || hasRecordFlag(node)) return node;
  const next = applyChildren(node.props.children, query, sort, dir);
  const cloned = cloneElement(node, undefined, next);
  if (node.props["data-record-group"] != null && query.trim() && !treeHasRecord(cloned)) return null;
  return cloned;
}

function applyChildren(children: ReactNode, query: string, sort: "listed" | "text" | "value", dir: "asc" | "desc") {
  const items = Children.toArray(children);
  const recordIndexes = items.flatMap((child, index) => (isRecord(child) ? [index] : []));
  if (recordIndexes.length === 0) {
    return items.map((child) => rewrite(child, query, sort, dir)).filter((child) => child != null);
  }
  let records = recordIndexes.map((index) => items[index] as El);
  const needle = query.trim().toLowerCase();
  if (needle) records = records.filter((record) => clean(visibleText(record)).toLowerCase().includes(needle));
  if (sort !== "listed") {
    records = [...records].sort((a, b) => {
      const cmp = compareValues(recordValue(a, sort === "value" ? "value" : "text"), recordValue(b, sort === "value" ? "value" : "text"));
      return dir === "asc" ? cmp : -cmp;
    });
  }
  const first = recordIndexes[0];
  const out: ReactNode[] = [];
  items.forEach((child, index) => {
    if (isRecord(child)) {
      if (index === first) out.push(...records);
      return;
    }
    const next = rewrite(child, query, sort, dir);
    if (next != null) out.push(next);
  });
  return out;
}

function countRecords(node: ReactNode): number {
  if (!isEl(node)) return 0;
  const own = isRecord(node) ? 1 : 0;
  return own + Children.toArray(node.props.children).reduce<number>((sum, child) => sum + countRecords(child), 0);
}

export function RecordList({
  children,
  className,
  sortLabel = "Date",
}: {
  children: ReactNode;
  className?: string;
  sortLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"listed" | "text" | "value">("listed");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const total = Children.toArray(children).reduce<number>((sum, child) => sum + countRecords(child), 0);
  const hasValue = Children.toArray(children).some((child) => treeHasSort(child));
  const processed = applyChildren(children, query, sort, dir);
  const shown = processed.reduce<number>((sum, child) => sum + countRecords(child), 0);

  if (total === 0) return <div className={className}>{children}</div>;

  return (
    <div>
      <Toolbar query={query} onQuery={setQuery} shown={shown} total={total}>
        <select className={`${controlClass} sm:max-w-[12rem]`} aria-label="Sort by" value={sort} onChange={(event) => setSort(event.target.value as "listed" | "text" | "value")}>
          <option value="listed">As listed</option>
          <option value="text">Name</option>
          {hasValue ? <option value="value">{sortLabel}</option> : null}
        </select>
        <button
          type="button"
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[12px] border border-border bg-surface px-3 text-sm font-semibold text-charcoal hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
          disabled={sort === "listed"}
          onClick={() => setDir((current) => (current === "asc" ? "desc" : "asc"))}
        >
          {dir === "asc" ? "Ascending" : "Descending"}
        </button>
      </Toolbar>
      {query.trim() && shown === 0 ? <p className="mb-3 text-sm text-secondary">Nothing matches this filter.</p> : null}
      <div className={className}>{processed}</div>
    </div>
  );
}

function treeHasSort(node: ReactNode): boolean {
  if (!isEl(node)) return false;
  if (node.props["data-sort"]) return true;
  return Children.toArray(node.props.children).some(treeHasSort);
}
