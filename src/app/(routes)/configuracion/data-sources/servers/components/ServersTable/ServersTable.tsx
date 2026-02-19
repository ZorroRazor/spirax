"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Pencil, Trash2, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
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
import { StatusBadge } from "../StatusBadge";
import type { ServersTableProps } from "./ServersTable.types";

type SortableField = "name" | "description" | "driver" | "tagCounter" | "status";

type ColumnWidths = {
  name: number;
  description: number;
  driver: number;
  tagCounter: number;
  status: number;
  actions: number;
};

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
  onResize: (newWidth: number) => void;
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
        const newWidth = Math.max(50, startWidthRef.current + diff);
        onResize(newWidth);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

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
          handleMouseDown(e);
        }}
        style={{ userSelect: "none" }}
      />
    </TableHead>
  );
}

export function ServersTable({
  servers,
  onToggleEnable,
  onEdit,
  onDelete,
  onConfigureDriver,
}: ServersTableProps) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    name: 180,
    description: 300,
    driver: 160,
    tagCounter: 120,
    status: 140,
    actions: 120,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortableField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const updateColumnWidth = (column: keyof ColumnWidths, newWidth: number) => {
    setColumnWidths((prev) => ({ ...prev, [column]: newWidth }));
  };

  const toggleSort = (field: SortableField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortableField }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 text-slate-400" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-slate-700" />
      : <ChevronDown className="h-3 w-3 text-slate-700" />;
  };

  const displayedServers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = q
      ? servers.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.description ?? "").toLowerCase().includes(q) ||
            s.driver.toLowerCase().includes(q),
        )
      : [...servers];

    if (sortField) {
      result = [...result].sort((a, b) => {
        let aVal: string;
        let bVal: string;
        switch (sortField) {
          case "name":        aVal = a.name;                       bVal = b.name;                       break;
          case "description": aVal = a.description ?? "";          bVal = b.description ?? "";          break;
          case "driver":      aVal = a.driver;                     bVal = b.driver;                     break;
          case "tagCounter":  aVal = String(a.tagCounter ?? 0).padStart(10, "0"); bVal = String(b.tagCounter ?? 0).padStart(10, "0"); break;
          case "status":      aVal = a.status;                     bVal = b.status;                     break;
          default:            aVal = "";                           bVal = "";
        }
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [servers, searchQuery, sortField, sortDir]);

  /* ── Selection helpers ─────────────────────────────────────────────────── */
  const allSelected =
    displayedServers.length > 0 &&
    displayedServers.every((s) => selectedIds.has(s.id));
  const someSelected =
    !allSelected && displayedServers.some((s) => selectedIds.has(s.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedServers.map((s) => s.id)));
    }
  };

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (servers.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <p className="text-sm text-slate-500">No hay servidores configurados</p>
          <p className="text-xs text-slate-400">
            Haz clic en &quot;Agregar servidor&quot; para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-auto">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, descripción, driver…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedIds.size > 0 && (
          <span className="text-sm text-slate-500">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <Table style={{ tableLayout: "fixed" }}>
        <TableHeader>
          <TableRow>
            {/* Select-all column — fixed, no resize */}
            <TableHead style={{ width: 40 }} className="px-3">
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={toggleAll}
                aria-label="Seleccionar todos"
              />
            </TableHead>

            {/* Enable */}
            <ResizableTableHead
              width={80}
              onResize={() => {}}
            >
              Enable
            </ResizableTableHead>

            <ResizableTableHead
              width={columnWidths.name}
              onResize={(w) => updateColumnWidth("name", w)}
              onClick={() => toggleSort("name")}
              sortIcon={<SortIcon field="name" />}
            >
              Name
            </ResizableTableHead>

            <ResizableTableHead
              width={columnWidths.description}
              onResize={(w) => updateColumnWidth("description", w)}
              onClick={() => toggleSort("description")}
              sortIcon={<SortIcon field="description" />}
            >
              Description
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.driver}
              onResize={(w) => updateColumnWidth("driver", w)}
              onClick={() => toggleSort("driver")}
              sortIcon={<SortIcon field="driver" />}
            >
              Driver
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.tagCounter}
              onResize={(w) => updateColumnWidth("tagCounter", w)}
              onClick={() => toggleSort("tagCounter")}
              sortIcon={<SortIcon field="tagCounter" />}
            >
              Tag Counter
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.status}
              onResize={(w) => updateColumnWidth("status", w)}
              onClick={() => toggleSort("status")}
              sortIcon={<SortIcon field="status" />}
            >
              Status
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.actions}
              onResize={(w) => updateColumnWidth("actions", w)}
              className="text-right"
            >
              Actions
            </ResizableTableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {displayedServers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                No se encontraron servidores con ese criterio de búsqueda.
              </TableCell>
            </TableRow>
          ) : (
            displayedServers.map((server) => (
              <TableRow
                key={server.id}
                data-selected={selectedIds.has(server.id)}
                className="data-[selected=true]:bg-sky-50/60"
              >
                {/* Checkbox select */}
                <TableCell style={{ width: 40 }} className="px-3">
                  <Checkbox
                    checked={selectedIds.has(server.id)}
                    onCheckedChange={() => toggleRow(server.id)}
                    aria-label={`Seleccionar ${server.name}`}
                  />
                </TableCell>

                {/* Enable toggle */}
                <TableCell style={{ width: 80 }}>
                  <Checkbox
                    checked={server.enable}
                    onCheckedChange={() => onToggleEnable(server.id)}
                  />
                </TableCell>

                {/* Name */}
                <TableCell
                  className="font-medium"
                  style={{ width: `${columnWidths.name}px` }}
                >
                  {server.name}
                </TableCell>

                {/* Description */}
                <TableCell
                  className="text-slate-600"
                  style={{ width: `${columnWidths.description}px` }}
                >
                  {server.description}
                </TableCell>

                {/* Driver — text only, no gear icon */}
                <TableCell
                  className="text-slate-600"
                  style={{ width: `${columnWidths.driver}px` }}
                >
                  {server.driver}
                </TableCell>

                {/* Tag counter */}
                <TableCell
                  className="text-center"
                  style={{ width: `${columnWidths.tagCounter}px` }}
                >
                  {server.tagCounter}
                </TableCell>

                {/* Status */}
                <TableCell style={{ width: `${columnWidths.status}px` }}>
                  <StatusBadge status={server.status} message={server.statusMessage} />
                </TableCell>

                {/* Actions */}
                <TableCell
                  className="text-right"
                  style={{ width: `${columnWidths.actions}px` }}
                >
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon-sm" onClick={() => onEdit(server)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(server.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
