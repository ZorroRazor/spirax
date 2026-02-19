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
import { EventRuleState, EventType } from "../../types/event-rule.types";
import type { EventRule } from "../../types/event-rule.types";
import type { EventRuleTableProps } from "./EventRuleTable.types";

// ── Column widths ──────────────────────────────────────────────────────────────
type ColumnWidths = {
  select: number;
  enable: number;
  name: number;
  description: number;
  eventType: number;
  trigger: number;
  actions: number;
  lastExecuted: number;
  execCount: number;
  status: number;
  rowActions: number;
};

// ── Status badge ───────────────────────────────────────────────────────────────
const stateConfig: Record<
  EventRuleState,
  { variant: "success" | "secondary"; label: string }
> = {
  [EventRuleState.ACTIVE]: { variant: "success", label: "Activa" },
  [EventRuleState.INACTIVE]: { variant: "secondary", label: "Inactiva" },
};

const eventTypeConfig: Record<EventType, { variant: "secondary" | "default"; label: string }> = {
  [EventType.TEMPORAL]: { variant: "secondary", label: "Temporal" },
  [EventType.CONTEXT]: { variant: "secondary", label: "Contexto" },
  [EventType.DATA]: { variant: "secondary", label: "Datos" },
  [EventType.KPI]: { variant: "secondary", label: "KPI" },
  [EventType.ALARM]: { variant: "default", label: "Alarma" },
  [EventType.AI]: { variant: "secondary", label: "IA" },
};

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
export function EventRuleTable({
  rules,
  onToggleEnable,
  onEdit,
  onDelete,
  onDuplicate,
  onBulkEnable,
  onBulkDisable,
  onBulkDelete,
}: EventRuleTableProps) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    select: 50,
    enable: 80,
    name: 200,
    description: 220,
    eventType: 120,
    trigger: 200,
    actions: 90,
    lastExecuted: 150,
    execCount: 90,
    status: 110,
    rowActions: 110,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<"name" | "description" | "eventType" | "trigger" | "execCount" | "lastExecuted" | "status" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const visibleRules = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = rules.filter((r) => {
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        r.eventType.toLowerCase().includes(q) ||
        r.trigger.toLowerCase().includes(q)
      );
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        const getVal = (r: EventRule): string => {
          switch (sortField) {
            case "name": return r.name;
            case "description": return r.description ?? "";
            case "eventType": return r.eventType;
            case "trigger": return r.trigger;
            case "execCount": return String(r.executionCount ?? 0).padStart(10, "0");
            case "lastExecuted": return r.lastExecuted ?? "";
            case "status": return r.status;
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
  }, [rules, searchQuery, sortField, sortDir]);

  const toggleSort = (field: "name" | "description" | "eventType" | "trigger" | "execCount" | "lastExecuted" | "status") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: "name" | "description" | "eventType" | "trigger" | "execCount" | "lastExecuted" | "status" }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 text-slate-400" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-slate-700" />
      : <ChevronDown className="h-3 w-3 text-slate-700" />;
  };

  const allVisibleIds = visibleRules.map((r) => r.id);
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

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, tipo, disparador…"
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
                if (window.confirm(`¿Eliminar ${selectedIds.size} regla(s)?`)) {
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
        <Table style={{ tableLayout: "fixed", minWidth: "1420px" }}>
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
                Nombre
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.description}
                onResize={setWidth("description")}
                onClick={() => toggleSort("description")}
                sortIcon={<SortIcon field="description" />}
              >
                Descripción
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.eventType}
                onResize={setWidth("eventType")}
                onClick={() => toggleSort("eventType")}
                sortIcon={<SortIcon field="eventType" />}
              >
                Tipo de Evento
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.trigger}
                onResize={setWidth("trigger")}
                onClick={() => toggleSort("trigger")}
                sortIcon={<SortIcon field="trigger" />}
              >
                Disparador
              </ResizableTableHead>

              <ResizableTableHead width={columnWidths.actions} onResize={setWidth("actions")}>
                Acciones
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.execCount}
                onResize={setWidth("execCount")}
                onClick={() => toggleSort("execCount")}
                sortIcon={<SortIcon field="execCount" />}
              >
                Ejecuciones
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.lastExecuted}
                onResize={setWidth("lastExecuted")}
                onClick={() => toggleSort("lastExecuted")}
                sortIcon={<SortIcon field="lastExecuted" />}
              >
                Última ejecución
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.status}
                onResize={setWidth("status")}
                onClick={() => toggleSort("status")}
                sortIcon={<SortIcon field="status" />}
              >
                Estado
              </ResizableTableHead>

              <TableHead style={{ width: `${columnWidths.rowActions}px` }} className="text-right">
                Opciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-12 text-center text-sm text-slate-500">
                  {searchQuery
                    ? "No se encontraron reglas con ese criterio de búsqueda."
                    : "No hay reglas de eventos configuradas. Crea la primera con «Nueva Regla»."}
                </TableCell>
              </TableRow>
            ) : (
              visibleRules.map((rule) => {
                const stateCfg = stateConfig[rule.status];
                const typeCfg = eventTypeConfig[rule.eventType];
                return (
                  <TableRow
                    key={rule.id}
                    className={`hover:bg-slate-50 ${selectedIds.has(rule.id) ? "bg-blue-50" : ""}`}
                  >
                    <TableCell style={{ width: `${columnWidths.select}px` }}>
                      <Checkbox
                        checked={selectedIds.has(rule.id)}
                        onCheckedChange={() => toggleSelect(rule.id)}
                      />
                    </TableCell>

                    <TableCell style={{ width: `${columnWidths.enable}px` }}>
                      <Checkbox
                        checked={rule.enable}
                        onCheckedChange={() => onToggleEnable(rule.id)}
                      />
                    </TableCell>

                    <TableCell
                      className="font-medium text-slate-900 truncate"
                      style={{ width: `${columnWidths.name}px`, maxWidth: `${columnWidths.name}px` }}
                      title={rule.name}
                    >
                      {rule.name}
                    </TableCell>

                    <TableCell
                      className="text-slate-600 truncate"
                      style={{ width: `${columnWidths.description}px`, maxWidth: `${columnWidths.description}px` }}
                      title={rule.description}
                    >
                      {rule.description ?? "—"}
                    </TableCell>

                    <TableCell style={{ width: `${columnWidths.eventType}px` }}>
                      <Badge variant={typeCfg.variant}>{typeCfg.label}</Badge>
                    </TableCell>

                    <TableCell
                      className="text-slate-600 text-xs truncate font-mono"
                      style={{ width: `${columnWidths.trigger}px`, maxWidth: `${columnWidths.trigger}px` }}
                      title={rule.trigger}
                    >
                      {rule.trigger}
                    </TableCell>

                    <TableCell style={{ width: `${columnWidths.actions}px` }}>
                      <Badge variant="secondary" className="text-xs">
                        {rule.actions.length} acción{rule.actions.length !== 1 ? "es" : ""}
                      </Badge>
                    </TableCell>

                    <TableCell
                      className="text-slate-600 text-xs"
                      style={{ width: `${columnWidths.execCount}px` }}
                    >
                      {rule.executionCount}
                    </TableCell>

                    <TableCell
                      className="text-slate-600 text-xs"
                      style={{ width: `${columnWidths.lastExecuted}px` }}
                    >
                      {rule.lastExecuted ?? "—"}
                    </TableCell>

                    <TableCell style={{ width: `${columnWidths.status}px` }}>
                      <Badge variant={stateCfg.variant}>{stateCfg.label}</Badge>
                    </TableCell>

                    <TableCell
                      className="text-right"
                      style={{ width: `${columnWidths.rowActions}px` }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onEdit(rule)}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDuplicate(rule)}
                          title="Duplicar"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar la regla "${rule.name}"?`)) {
                              onDelete(rule.id);
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
