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
import { ScalingType, TagStatus } from "../../types/physical-tag.types";
import type { PhysicalTag } from "../../types/physical-tag.types";
import type { PhysicalTagsTableProps } from "./PhysicalTagsTable.types";

// ── Column widths ─────────────────────────────────────────────────────────────
type ColumnWidths = {
  select: number;
  enable: number;
  name: number;
  description: number;
  hierarchy: number;
  server: number;
  origin: number;
  scanRate: number;
  classification: number;
  engUnit: number;
  scaling: number;
  status: number;
  actions: number;
};

// ── Status badge ──────────────────────────────────────────────────────────────
const statusConfig: Record<
  TagStatus,
  { variant: "success" | "destructive" | "warning" | "secondary"; label: string }
> = {
  [TagStatus.OK]: { variant: "success", label: "OK" },
  [TagStatus.BAD]: { variant: "destructive", label: "Bad" },
  [TagStatus.UNCERTAIN]: { variant: "warning", label: "Uncertain" },
  [TagStatus.NO_DATA]: { variant: "secondary", label: "No Data" },
};

function TagStatusBadge({ status }: { status: TagStatus }) {
  const cfg = statusConfig[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ── Resizable table head ──────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
export function PhysicalTagsTable({
  tags,
  servers,
  onToggleEnable,
  onEdit,
  onDelete,
  onDuplicate,
  onBulkEnable,
  onBulkDisable,
  onBulkDelete,
}: PhysicalTagsTableProps) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    select: 50,
    enable: 80,
    name: 180,
    description: 200,
    hierarchy: 160,
    server: 140,
    origin: 160,
    scanRate: 100,
    classification: 120,
    engUnit: 90,
    scaling: 100,
    status: 110,
    actions: 110,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<"name" | "description" | "classification" | "engUnit" | "server" | "origin" | "scanRate" | "scaling" | "status" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const serverMap = useMemo(
    () => new Map(servers.map((s) => [s.id, s])),
    [servers]
  );

  // Filter + sort
  const visibleTags = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = tags.filter((t) => {
      if (!q) return true;
      const server = serverMap.get(t.serverId);
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q) ||
        (server?.name ?? "").toLowerCase().includes(q)
      );
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        const getVal = (t: PhysicalTag): string => {
          switch (sortField) {
            case "name": return t.name;
            case "description": return t.description ?? "";
            case "classification": return t.classification ?? "";
            case "engUnit": return t.engUnit ?? "";
            case "server": return serverMap.get(t.serverId)?.name ?? "";
            case "origin": return t.origin;
            case "scanRate": return String(t.scanRate ?? 0).padStart(10, "0");
            case "scaling": return String(t.scaling?.type ?? "");
            case "status": return t.status;
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
  }, [tags, searchQuery, sortField, sortDir, serverMap]);

  const toggleSort = (field: "name" | "description" | "classification" | "engUnit" | "server" | "origin" | "scanRate" | "scaling" | "status") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: "name" | "description" | "classification" | "engUnit" | "server" | "origin" | "scanRate" | "scaling" | "status" }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 text-slate-400" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-slate-700" />
      : <ChevronDown className="h-3 w-3 text-slate-700" />;
  };

  // Select all / none
  const allVisibleIds = visibleTags.map((t) => t.id);
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

  const hierarchyLabel = (t: PhysicalTag) =>
    [t.hierarchy.planta, t.hierarchy.area, t.hierarchy.seccion, t.hierarchy.equipo]
      .filter(Boolean)
      .join(" / ");

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, descripción, origen…"
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
              onClick={() => {
                onBulkEnable(selectedArray);
                setSelectedIds(new Set());
              }}
            >
              Habilitar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onBulkDisable(selectedArray);
                setSelectedIds(new Set());
              }}
            >
              Deshabilitar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm(`¿Eliminar ${selectedIds.size} tag(s)?`)) {
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
        <Table style={{ tableLayout: "fixed", minWidth: "1500px" }}>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {/* Select all */}
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
                Tag Name
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
                width={columnWidths.classification}
                onResize={setWidth("classification")}
                onClick={() => toggleSort("classification")}
                sortIcon={<SortIcon field="classification" />}
              >
                Clasificación
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.engUnit}
                onResize={setWidth("engUnit")}
                onClick={() => toggleSort("engUnit")}
                sortIcon={<SortIcon field="engUnit" />}
              >
                Unidades
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.server}
                onResize={setWidth("server")}
                onClick={() => toggleSort("server")}
                sortIcon={<SortIcon field="server" />}
              >
                Servidor
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.origin}
                onResize={setWidth("origin")}
                onClick={() => toggleSort("origin")}
                sortIcon={<SortIcon field="origin" />}
              >
                Origen del dato
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.scanRate}
                onResize={setWidth("scanRate")}
                onClick={() => toggleSort("scanRate")}
                sortIcon={<SortIcon field="scanRate" />}
              >
                Scan Rate
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.scaling}
                onResize={setWidth("scaling")}
                onClick={() => toggleSort("scaling")}
                sortIcon={<SortIcon field="scaling" />}
              >
                Escalado
              </ResizableTableHead>

              <ResizableTableHead
                width={columnWidths.status}
                onResize={setWidth("status")}
                onClick={() => toggleSort("status")}
                sortIcon={<SortIcon field="status" />}
              >
                Status
              </ResizableTableHead>

              <TableHead style={{ width: `${columnWidths.actions}px` }} className="text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleTags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="py-12 text-center text-sm text-slate-500">
                  {searchQuery
                    ? "No se encontraron tags con ese criterio de búsqueda."
                    : "No hay tags configurados. Crea el primero con el botón «Nuevo Tag»."}
                </TableCell>
              </TableRow>
            ) : (
              visibleTags.map((tag) => {
                const server = serverMap.get(tag.serverId);
                return (
                  <TableRow
                    key={tag.id}
                    className={`hover:bg-slate-50 ${selectedIds.has(tag.id) ? "bg-blue-50" : ""}`}
                  >
                    <TableCell style={{ width: `${columnWidths.select}px` }}>
                      <Checkbox
                        checked={selectedIds.has(tag.id)}
                        onCheckedChange={() => toggleSelect(tag.id)}
                      />
                    </TableCell>

                    <TableCell style={{ width: `${columnWidths.enable}px` }}>
                      <Checkbox
                        checked={tag.enable}
                        onCheckedChange={() => onToggleEnable(tag.id)}
                      />
                    </TableCell>

                    <TableCell
                      className="font-medium text-slate-900 truncate"
                      style={{ width: `${columnWidths.name}px`, maxWidth: `${columnWidths.name}px` }}
                      title={tag.name}
                    >
                      {tag.name}
                    </TableCell>

                    <TableCell
                      className="text-slate-600 truncate"
                      style={{ width: `${columnWidths.description}px`, maxWidth: `${columnWidths.description}px` }}
                      title={tag.description}
                    >
                      {tag.description ?? "—"}
                    </TableCell>

                    <TableCell
                      className="text-slate-600 text-xs truncate"
                      style={{ width: `${columnWidths.hierarchy}px`, maxWidth: `${columnWidths.hierarchy}px` }}
                      title={hierarchyLabel(tag)}
                    >
                      {hierarchyLabel(tag) || "—"}
                    </TableCell>

                    <TableCell
                      className="text-slate-600"
                      style={{ width: `${columnWidths.classification}px` }}
                    >
                      {tag.classification ?? "—"}
                    </TableCell>

                    <TableCell
                      className="text-slate-600"
                      style={{ width: `${columnWidths.engUnit}px` }}
                    >
                      {tag.engUnit ?? "—"}
                    </TableCell>

                    <TableCell
                      className="text-slate-600 truncate"
                      style={{ width: `${columnWidths.server}px`, maxWidth: `${columnWidths.server}px` }}
                      title={server?.name}
                    >
                      {server?.name ?? `ID ${tag.serverId}`}
                    </TableCell>

                    <TableCell
                      className="text-slate-600 font-mono text-xs truncate"
                      style={{ width: `${columnWidths.origin}px`, maxWidth: `${columnWidths.origin}px` }}
                      title={tag.origin}
                    >
                      {tag.origin}
                    </TableCell>

                    <TableCell
                      className="text-slate-600"
                      style={{ width: `${columnWidths.scanRate}px` }}
                    >
                      {tag.scanRate} ms
                    </TableCell>

                    <TableCell style={{ width: `${columnWidths.scaling}px` }}>
                      {!tag.scaling || tag.scaling.type === ScalingType.NONE ? (
                        <span className="text-slate-400 text-xs">—</span>
                      ) : tag.scaling.type === ScalingType.LINEAR ? (
                        <Badge variant="secondary" className="text-xs">Linear</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">√ Root</Badge>
                      )}
                    </TableCell>

                    <TableCell style={{ width: `${columnWidths.status}px` }}>
                      <TagStatusBadge status={tag.status} />
                    </TableCell>

                    <TableCell
                      className="text-right"
                      style={{ width: `${columnWidths.actions}px` }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onEdit(tag)}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDuplicate(tag)}
                          title="Duplicar"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar el tag "${tag.name}"?`)) {
                              onDelete(tag.id);
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
