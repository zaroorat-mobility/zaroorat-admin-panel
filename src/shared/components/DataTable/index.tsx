import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import {
  Search, X, ChevronsUpDown, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Settings2, Check, Filter
} from "lucide-react";
import { ActionMenu } from "./ActionMenu";
import { cn } from "@/shared/utils";

export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => ReactNode;
  align?: "left" | "center" | "right";
  visible?: boolean;
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowClick?: (row: T) => void;
  rowIdKey?: keyof T;
  pageSizeOptions?: number[];
  resultLabel?: string;
  maxHeight?: string;
  toolbarRight?: ReactNode;
  toolbarLeft?: ReactNode;
  draggable?: boolean;
  onReorder?: (newData: T[]) => void;
  searchPlaceholder?: string;
  statusKey?: string;
  actionConfig?: {
    onView?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
  };
}

export function DataTable<T extends Record<string, any> = any>({
  columns: initialColumns,
  data,
  selectable: _selectable = true,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  onRowClick,
  rowIdKey = "id" as keyof T,
  pageSizeOptions = [5, 10, 25, 50],
  resultLabel = "results",
  maxHeight = "520px",
  toolbarLeft,
  toolbarRight,
  draggable = false,
  searchPlaceholder = "Search...",
  statusKey = "status",
  actionConfig,
}: DataTableProps<T>) {

  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const selectedIds = externalSelectedIds ?? internalSelectedIds;

  const handleSelectionChange = (ids: Set<string>) => {
    setInternalSelectedIds(ids);
    onSelectionChange?.(ids);
  };

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? 10);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    initialColumns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible !== false }), {} as Record<string, boolean>)
  );

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) setShowStatusMenu(false);
      if (columnRef.current && !columnRef.current.contains(event.target as Node)) setShowColumnMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { if (showStatusMenu) setShowColumnMenu(false); }, [showStatusMenu]);
  useEffect(() => { if (showColumnMenu) setShowStatusMenu(false); }, [showColumnMenu]);

  const columns = useMemo(() =>
    initialColumns.filter(col => visibleColumns[col.key] !== false),
    [initialColumns, visibleColumns]
  );

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(row => {
      const status = String(row[statusKey] || "Unknown").trim();
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }))
      .sort((a, b) => a.status.localeCompare(b.status));
  }, [data, statusKey]);

  const toggleColumn = (key: string) => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));

  const filteredData = useMemo(() => {
    let result = [...data];
    const q = search.trim().toLowerCase();
    if (q) result = result.filter(row => columns.some(col => String(row[col.key] ?? "").toLowerCase().includes(q)));
    if (selectedStatuses.length > 0) result = result.filter(row => selectedStatuses.includes(String(row[statusKey])));
    return result;
  }, [data, search, columns, selectedStatuses, statusKey]);

  const sorted = useMemo(() => {
    if (!sortCol) return filteredData;
    return [...filteredData].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [filteredData, sortCol, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const paged = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  const resetPage = () => setPage(1);
  const handleSearch = (v: string) => { setSearch(v); resetPage(); };
  const handlePageSize = (s: number) => { setPageSize(s); resetPage(); };

  const handleSort = (key: string) => {
    if (sortCol === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(key); setSortDir("asc"); }
    resetPage();
  };

  const colSpan = columns.length + 1 + (actionConfig ? 1 : 0) + (draggable ? 1 : 0);

  const pagedIds = paged.map(row => String(row[rowIdKey]));
  const allPageSelected = pagedIds.length > 0 && pagedIds.every(id => selectedIds.has(id));
  const somePageSelected = pagedIds.some(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allPageSelected) {
      pagedIds.forEach(id => next.delete(id));
    } else {
      pagedIds.forEach(id => next.add(id));
    }
    handleSelectionChange(next);
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    handleSelectionChange(next);
  };

  return (
    <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden text-left">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          {toolbarLeft}
          <div className="relative w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 h-9 text-sm bg-surface border border-border text-foreground placeholder:text-muted-foreground rounded-lg outline-none focus:border-[#2B317A] transition-colors"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {toolbarRight}

          {/* Status Filter */}
          {statusOptions.length > 0 && (
            <div className="relative" ref={statusRef}>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border cursor-pointer",
                  selectedStatuses.length > 0
                    ? "bg-primary text-white border-primary hover:bg-primary-hover"
                    : "border-border text-foreground bg-transparent hover:bg-surface-muted hover:border-primary/20"
                )}
              >
                <Filter className="w-4 h-4" />
                Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-surface rounded-lg border border-border shadow-xl z-50 py-2 max-h-[320px] overflow-auto">
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border">STATUS FILTER</div>
                  <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 cursor-pointer text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.length === 0}
                      onChange={() => { setSelectedStatuses([]); resetPage(); }}
                      className="w-4 h-4 accent-primary"
                    />
                    <span>All Status</span>
                    <span className="ml-auto text-muted-foreground text-xs">({data.length})</span>
                  </label>
                  {statusOptions.map(({ status, count }) => (
                    <label key={status} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 cursor-pointer text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => {
                          const next = selectedStatuses.includes(status)
                            ? selectedStatuses.filter(s => s !== status)
                            : [...selectedStatuses, status];
                          setSelectedStatuses(next);
                          resetPage();
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="capitalize">{status}</span>
                      <span className="ml-auto text-muted-foreground text-xs">({count})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Columns Menu */}
          <div className="relative" ref={columnRef}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-border text-foreground rounded-lg hover:bg-surface-muted hover:border-primary/20 transition-colors"
            >
              <Settings2 className="w-4 h-4" /> Columns
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-45 bg-surface rounded-xl border border-border shadow-xl z-50 py-1 max-h-[280px] overflow-auto">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border">SHOW COLUMNS</div>
                {initialColumns.map((col) => (
                  <label key={col.key} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 cursor-pointer text-sm text-foreground">
                    <input type="checkbox" checked={visibleColumns[col.key] !== false} onChange={() => toggleColumn(col.key)} className="accent-primary" />
                    <span>{col.label}</span>
                    {visibleColumns[col.key] !== false && <Check className="w-4 h-4 text-primary ml-auto" />}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <div className="overflow-auto border-t-2 border-primary" style={{ maxHeight }}>
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20">
              <tr style={{ backgroundColor: "var(--color-table-header-bg)", borderBottom: "2px solid var(--color-table-header-border)" }}>
                {draggable && (
                  <th
                    className="w-10 px-4 py-3"
                    style={{ backgroundColor: "var(--color-table-header-bg)", borderRight: "1px solid var(--color-table-header-border)" }}
                  />
                )}
                <th
                  className="w-12 px-4 py-3 text-center"
                  style={{ backgroundColor: "var(--color-table-header-bg)", borderRight: "1px solid var(--color-table-header-border)" }}
                >
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-primary cursor-pointer"
                    title="Select all on this page"
                  />
                </th>
                {columns.map((col) => {
                  const align = col.align || "center";
                  return (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${col.sortable ? "cursor-pointer select-none" : ""}`}
                      style={{
                        backgroundColor: "var(--color-table-header-bg)",
                        color: "var(--color-table-header-text)",
                        borderRight: "1px solid var(--color-table-header-border)",
                      }}
                    >
                      <div className={`flex items-center gap-1 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}>
                        {col.label}
                        {col.sortable && (
                          sortCol === col.key
                            ? (sortDir === "asc" ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />)
                            : <ChevronsUpDown className="w-4 h-4 text-primary opacity-60" />
                        )}
                      </div>
                    </th>
                  );
                })}
                {actionConfig && (
                  <th
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-40"
                    style={{ backgroundColor: "var(--color-table-header-bg)", color: "var(--color-table-header-text)" }}
                  >
                    ACTION
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-14 text-center text-muted-foreground">
                    No records found
                  </td>
                </tr>
              ) : (
                paged.map((row) => {
                  const id = String(row[rowIdKey]);
                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick?.(row)}
                      className={`transition-colors relative hover:z-30 ${onRowClick ? "cursor-pointer" : ""}`}
                      style={{ "--hover-bg": "var(--secondary)" } as React.CSSProperties}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--secondary)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
                    >
                      {draggable && (
                        <td className="px-4 py-3 text-center text-muted-foreground" style={{ borderRight: "1px solid var(--color-table-header-border)" }}>⋮⋮</td>
                      )}
                      <td className="px-4 py-3 text-center" style={{ borderRight: "1px solid var(--color-table-header-border)" }} onClick={e => toggleRow(id, e)}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(id)}
                          onChange={() => {}}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />
                      </td>
                      {columns.map(col => {
                        const align = col.align || "center";
                        return (
                          <td
                            key={col.key}
                            className={`px-4 py-3 text-sm text-foreground ${align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"}`}
                            style={{ borderRight: "1px solid var(--color-table-header-border)" }}
                          >
                            {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                          </td>
                        );
                      })}
                      {actionConfig && (
                        <td className="px-4 py-3 text-center w-40" onClick={e => e.stopPropagation()}>
                          <ActionMenu
                            onView={actionConfig.onView ? () => actionConfig.onView!(row) : undefined}
                            onEdit={actionConfig.onEdit ? () => actionConfig.onEdit!(row) : undefined}
                            onDelete={actionConfig.onDelete ? () => actionConfig.onDelete!(row) : undefined}
                            alignY={paged.indexOf(row) >= paged.length - 2 && paged.length > 2 ? 'up' : 'down'}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-surface text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            Rows per page
            <select
              value={pageSize}
              onChange={e => handlePageSize(Number(e.target.value))}
              className="border border-border bg-surface text-foreground rounded-lg px-3 py-1 focus:ring-primary"
            >
              {pageSizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <span>Showing {start} - {end} of {total} {resultLabel}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-surface-muted disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg border font-medium ${p === page ? "bg-primary text-white border-primary" : "border-border text-foreground hover:bg-primary/5"}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-surface-muted disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default DataTable
