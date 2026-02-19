"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Pencil,
  Trash2,
  Copy,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiStatus } from "../../types/kpi.types";
import type { Kpi } from "../../types/kpi.types";
import type { KpiTableProps } from "./KpiTable.types";

// ── Column widths ──────────────────────────────────────────────────────────────
type ColumnWidths = {
  select: number;
  enable: number;
  name: number;
  description: number;
  hierarchy: number;
  category: number;
  unit: number;
  period: number;
  lastValue: number;
  status: number;
  actions: number;
};

// ── Status badge ───────────────────────────────────────────────────────────────
const statusConfig: Record<
  KpiStatus,
  { variant: "success" | "destructive" | "warning" | "secondary"; label: string; dot: string }
> = {
  [KpiStatus.OK]: { variant: "success", label: "OK", dot: "🟢" },
  [KpiStatus.WARNING]: { variant: "warning", label: "Warning", dot: "🟡" },
  [KpiStatus.CRITICAL]: { variant: "destructive", label: "Critical", dot: "🔴" },
  [KpiStatus.UNCERTAIN]: { variant: "warning", label: "Uncertain", dot: "⚠️" },
  [KpiStatus.NO_DATA]: { variant: "secondary", label: "No Data", dot: "⚪" },
};

function KpiStatusBadge({ status }: { status: KpiStatus }) {
  const cfg = statusConfig[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ── Resizable table head ───────────────────────────────────────────────────────
function ResizableTableHead({
  children,
  width,
  onResize,
  className = "",
  onClick,
  sortIcon,
}: {
  children: React.ReactNode;
  width: number;
  onResize: (w: number) => void;
  className?: string;
  onClick?: () => void;
  sortIcon?: React.ReactNode;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const diff = e.clientX - startXRef.current;
        onResize(Math.max(50, startWidthRef.current + diff));
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onResize]);

  return (
    <TableHead
      className={`relative ${onClick ? "cursor-pointer select-none" : ""} ${className}`}
      style={{ width: `${width}px` }}
      onClick={onClick}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortIcon}
      </span>
      <div
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-slate-300 active:bg-slate-400"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsResizing(true);
          startXRef.current = e.clientX;
          startWidthRef.current = width;
        }}
        style={{ userSelect: "none" }}
      />
    </TableHead>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function KpiTable({
  kpis,
  onToggleEnable,
  onEdit,
  onDelete,
  onDuplicate,
  onBulkEnable,
  onBulkDisable,
  onBulkDelete,
}: KpiTableProps) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    select: 50,
    enable: 80,
    name: 200,
    description: 220,
    hierarchy: 160,
    category: 120,
    unit: 80,
    period: 130,
    lastValue: 110,
    status: 110,
    actions: 110,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<"name" | "description" | "category" | "unit" | "period" | "lastValue" | "status" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const visibleKpis = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = kpis.filter((k) => {
      if (!q) return true;
      return (
        k.name.toLowerCase().includes(q) ||
        (k.description ?? "").toLowerCase().includes(q) ||
        (k.category ?? "").toLowerCase().includes(q) ||
        k.period.toLowerCase().includes(q)
      );
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        const getVal = (k: Kpi): string => {
          switch (sortField) {
            case "name": return k.name;
            case "description": return k.description ?? "";
            case "category": return k.category ?? "";
            case "unit": return k.unit ?? "";
            case "period": return k.period;
            case "lastValue": return String(k.lastValue ?? 0).padStart(20, "0");
            case "status": return k.status;
            default: return "";
          }
        };
        const aVal = getVal(a);
        const bVal = getVal(b);
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [kpis, searchQuery, sortField, sortDir]);

  const toggleSort = (field: "name" | "description" | "category" | "unit" | "period" | "lastValue" | "status") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: "name" | "description" | "category" | "unit" | "period" | "lastValue" | "status" }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 text-slate-400" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-slate-700" />
      : <ChevronDown className="h-3 w-3 text-slate-700" />;
  };

  const allVisibleIds = visibleKpis.map((k) => k.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));
  const someSelected = allVisibleIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...allVisibleIds]));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedArray = [...selectedIds];
  const setWidth = (col: keyof ColumnWidths) => (w: number) =>
    setColumnWidths((prev) => ({ ...prev, [col]: w }));

  const hierarchyLabel = (k: Kpi) =>
    [k.hierarchy.planta, k.hierarchy.area, k.hierarchy.seccion, k.hierarchy.equipo]
      .filter(Boolean)
      .join(" / ");

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, descripción, categoría…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{selectedIds.size} seleccionados</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onBulkEnable(selectedArray); setSelectedIds(new Set()); }}
            >
              Habilitar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onBulkDisable(selectedArray); setSelectedIds(new Set()); }}
            >
              Deshabilitar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm(`¿Eliminar ${selectedIds.size} KPI(s)?`)) {
                  onBulkDelete(selectedArray);
                  setSelectedIds(new Set());
                }
              }}
            >
              Eliminar seleccionados
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table style={{ tableLayout: "fixed", minWidth: "1370px" }}>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead style={{ width: `${columnWidths.select}px` }} className="relative">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Seleccionar todos"
                  data-state={someSelected && !allSelected ? "indeterminate" : undefined}
                />
              </TableHead>

              <ResizableTableHead width={columnWidths.enable} onResize={setWidth("enable")}>
                Enable
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.name}
                onResize={setWidth("name")}
                onClick={() => toggleSort("name")}
                sortIcon={<SortIcon field="name" />}
              >
                KPI Name
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.description}
                onResize={setWidth("description")}
                onClick={() => toggleSort("description")}
                sortIcon={<SortIcon field="description" />}
              >
                Descripción
              </ResizableTableHead>

              <ResizableTableHead width={columnWidths.hierarchy} onResize={setWidth("hierarchy")}>
                Jerarquía
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.category}
                onResize={setWidth("category")}
                onClick={() => toggleSort("category")}
                sortIcon={<SortIcon field="category" />}
              >
                Categoría
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.unit}
                onResize={setWidth("unit")}
                onClick={() => toggleSort("unit")}
                sortIcon={<SortIcon field="unit" />}
              >
                Unidad
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.period}
                onResize={setWidth("period")}
                onClick={() => toggleSort("period")}
                sortIcon={<SortIcon field="period" />}
              >
                Periodo
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.lastValue}
                onResize={setWidth("lastValue")}
                onClick={() => toggleSort("lastValue")}
                sortIcon={<SortIcon field="lastValue" />}
              >
                Último valor
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.status}
                onResize={setWidth("status")}
                onClick={() => toggleSort("status")}
                sortIcon={<SortIcon field="status" />}
              >
                Estado
              </ResizableTableHead>

              <TableHead style={{ width: `${columnWidths.actions}px` }} className="text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleKpis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-12 text-center text-sm text-slate-500">
                  {searchQuery
                    ? "No se encontraron KPIs con ese criterio de búsqueda."
                    : "No hay KPIs configurados. Crea el primero con el botón «Nuevo KPI»."}
                </TableCell>
              </TableRow>
            ) : (
              visibleKpis.map((kpi) => (
                <TableRow
                  key={kpi.id}
                  className={`hover:bg-slate-50 ${selectedIds.has(kpi.id) ? "bg-blue-50" : ""}`}
                >
                  <TableCell style={{ width: `${columnWidths.select}px` }}>
                    <Checkbox
                      checked={selectedIds.has(kpi.id)}
                      onCheckedChange={() => toggleSelect(kpi.id)}
                    />
                  </TableCell>

                  <TableCell style={{ width: `${columnWidths.enable}px` }}>
                    <Checkbox
                      checked={kpi.enable}
                      onCheckedChange={() => onToggleEnable(kpi.id)}
                    />
                  </TableCell>

                  <TableCell
                    className="font-medium text-slate-900 truncate"
                    style={{ width: `${columnWidths.name}px`, maxWidth: `${columnWidths.name}px` }}
                    title={kpi.name}
                  >
                    {kpi.name}
                  </TableCell>

                  <TableCell
                    className="text-slate-600 truncate"
                    style={{ width: `${columnWidths.description}px`, maxWidth: `${columnWidths.description}px` }}
                    title={kpi.description}
                  >
                    {kpi.description ?? "—"}
                  </TableCell>

                  <TableCell
                    className="text-slate-600 text-xs truncate"
                    style={{ width: `${columnWidths.hierarchy}px`, maxWidth: `${columnWidths.hierarchy}px` }}
                    title={hierarchyLabel(kpi)}
                  >
                    {hierarchyLabel(kpi) || "—"}
                  </TableCell>

                  <TableCell
                    className="text-slate-600"
                    style={{ width: `${columnWidths.category}px` }}
                  >
                    {kpi.category ?? "—"}
                  </TableCell>

                  <TableCell
                    className="text-slate-600"
                    style={{ width: `${columnWidths.unit}px` }}
                  >
                    {kpi.unit ?? "—"}
                  </TableCell>

                  <TableCell style={{ width: `${columnWidths.period}px` }}>
                    <Badge variant="secondary" className="text-xs">
                      {kpi.period}
                    </Badge>
                  </TableCell>

                  <TableCell
                    className="text-slate-700 font-medium"
                    style={{ width: `${columnWidths.lastValue}px` }}
                  >
                    {kpi.lastValue !== undefined
                      ? `${kpi.lastValue}${kpi.unit ? ` ${kpi.unit}` : ""}`
                      : "—"}
                  </TableCell>

                  <TableCell style={{ width: `${columnWidths.status}px` }}>
                    <KpiStatusBadge status={kpi.status} />
                  </TableCell>

                  <TableCell
                    className="text-right"
                    style={{ width: `${columnWidths.actions}px` }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onEdit(kpi)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDuplicate(kpi)}
                        title="Duplicar"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el KPI "${kpi.name}"?`)) {
                            onDelete(kpi.id);
                          }
                        }}
                        title="Eliminar"
                        className="hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
