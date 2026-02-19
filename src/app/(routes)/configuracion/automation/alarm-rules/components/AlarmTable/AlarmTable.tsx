"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Pencil, Trash2, Copy, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlarmStatus, AlarmPriority } from "../../types/alarm.types";
import type { AlarmRule } from "../../types/alarm.types";
import type { AlarmTableProps } from "./AlarmTable.types";

type ColumnWidths = {
  select: number; enable: number; name: number; description: number;
  type: number; priority: number; category: number; sourceType: number;
  status: number; actions: number;
};

const priorityConfig: Record<AlarmPriority, { variant: "secondary" | "warning" | "destructive"; label: string }> = {
  [AlarmPriority.LOW]: { variant: "secondary", label: "Baja" },
  [AlarmPriority.MEDIUM]: { variant: "warning", label: "Media" },
  [AlarmPriority.HIGH]: { variant: "warning", label: "Alta" },
  [AlarmPriority.CRITICAL]: { variant: "destructive", label: "Crítica" },
};

const statusConfig: Record<AlarmStatus, { variant: "secondary" | "destructive" | "warning" | "success"; label: string }> = {
  [AlarmStatus.INACTIVE]: { variant: "secondary", label: "Inactiva" },
  [AlarmStatus.ACTIVE]: { variant: "destructive", label: "Activa" },
  [AlarmStatus.ACKNOWLEDGED]: { variant: "warning", label: "Reconocida" },
  [AlarmStatus.IN_PROGRESS]: { variant: "warning", label: "En progreso" },
  [AlarmStatus.RESOLVED]: { variant: "success", label: "Resuelta" },
  [AlarmStatus.CLOSED]: { variant: "secondary", label: "Cerrada" },
};

function PriorityBadge({ priority }: { priority: AlarmPriority }) {
  const cfg = priorityConfig[priority];
  return <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>;
}
function StatusBadge({ status }: { status: AlarmStatus }) {
  const cfg = statusConfig[status];
  return <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>;
}

function ResizableTableHead({ children, width, onResize, onClick, sortIcon }: {
  children: React.ReactNode; width: number; onResize: (w: number) => void;
  onClick?: () => void; sortIcon?: React.ReactNode;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0); const startWRef = useRef(0);
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (isResizing) onResize(Math.max(50, startWRef.current + e.clientX - startXRef.current)); };
    const onUp = () => setIsResizing(false);
    if (isResizing) { document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp); }
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [isResizing, onResize]);
  return (
    <TableHead className={`relative ${onClick ? "cursor-pointer select-none" : ""}`} style={{ width: `${width}px` }} onClick={onClick}>
      <span className="flex items-center gap-1">{children}{sortIcon}</span>
      <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-slate-300"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsResizing(true); startXRef.current = e.clientX; startWRef.current = width; }}
        style={{ userSelect: "none" }} />
    </TableHead>
  );
}

export function AlarmTable({ alarms, onToggleEnable, onEdit, onDelete, onDuplicate, onBulkEnable, onBulkDisable, onBulkDelete }: AlarmTableProps) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    select: 50, enable: 80, name: 200, description: 220, type: 120, priority: 100, category: 120, sourceType: 120, status: 120, actions: 110,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<"name" | "description" | "type" | "priority" | "category" | "sourceType" | "status" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const visible = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = alarms.filter((a) => !q ||
      a.name.toLowerCase().includes(q) ||
      (a.description ?? "").toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      a.priority.toLowerCase().includes(q) ||
      (a.category ?? "").toLowerCase().includes(q)
    );
    if (sortField) {
      result = [...result].sort((a, b) => {
        const getVal = (alarm: AlarmRule): string => {
          switch (sortField) {
            case "name": return alarm.name;
            case "description": return alarm.description ?? "";
            case "type": return alarm.type;
            case "priority": return alarm.priority;
            case "category": return alarm.category ?? "";
            case "sourceType": return alarm.sourceType;
            case "status": return alarm.status;
            default: return "";
          }
        };
        const av = getVal(a);
        const bv = getVal(b);
        return (sortDir === "asc" ? 1 : -1) * av.localeCompare(bv);
      });
    }
    return result;
  }, [alarms, searchQuery, sortField, sortDir]);

  const toggleSort = (field: "name" | "description" | "type" | "priority" | "category" | "sourceType" | "status") => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: "name" | "description" | "type" | "priority" | "category" | "sourceType" | "status" }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 text-slate-400" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const allIds = visible.map((a) => a.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = allIds.some((id) => selectedIds.has(id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds((p) => { const n = new Set(p); allIds.forEach((id) => n.delete(id)); return n; });
    else setSelectedIds((p) => new Set([...p, ...allIds]));
  };
  const toggleOne = (id: number) => setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectedArr = [...selectedIds];
  const setW = (col: keyof ColumnWidths) => (w: number) => setColumnWidths((p) => ({ ...p, [col]: w }));

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar por nombre, tipo, prioridad…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{selectedIds.size} seleccionados</span>
            <Button variant="outline" size="sm" onClick={() => { onBulkEnable(selectedArr); setSelectedIds(new Set()); }}>Habilitar</Button>
            <Button variant="outline" size="sm" onClick={() => { onBulkDisable(selectedArr); setSelectedIds(new Set()); }}>Deshabilitar</Button>
            <Button variant="destructive" size="sm" onClick={() => { if (window.confirm(`¿Eliminar ${selectedIds.size} alarma(s)?`)) { onBulkDelete(selectedArr); setSelectedIds(new Set()); } }}>Eliminar seleccionadas</Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table style={{ tableLayout: "fixed", minWidth: "1240px" }}>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead style={{ width: `${columnWidths.select}px` }}>
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} data-state={someSelected && !allSelected ? "indeterminate" : undefined} />
              </TableHead>
              <ResizableTableHead width={columnWidths.enable} onResize={setW("enable")}>Enable</ResizableTableHead>
              <ResizableTableHead width={columnWidths.name} onResize={setW("name")} onClick={() => toggleSort("name")} sortIcon={<SortIcon field="name" />}>Nombre</ResizableTableHead>
              <ResizableTableHead width={columnWidths.description} onResize={setW("description")} onClick={() => toggleSort("description")} sortIcon={<SortIcon field="description" />}>Descripción</ResizableTableHead>
              <ResizableTableHead width={columnWidths.type} onResize={setW("type")} onClick={() => toggleSort("type")} sortIcon={<SortIcon field="type" />}>Tipo</ResizableTableHead>
              <ResizableTableHead width={columnWidths.priority} onResize={setW("priority")} onClick={() => toggleSort("priority")} sortIcon={<SortIcon field="priority" />}>Prioridad</ResizableTableHead>
              <ResizableTableHead width={columnWidths.category} onResize={setW("category")} onClick={() => toggleSort("category")} sortIcon={<SortIcon field="category" />}>Categoría</ResizableTableHead>
              <ResizableTableHead width={columnWidths.sourceType} onResize={setW("sourceType")} onClick={() => toggleSort("sourceType")} sortIcon={<SortIcon field="sourceType" />}>Fuente</ResizableTableHead>
              <ResizableTableHead width={columnWidths.status} onResize={setW("status")} onClick={() => toggleSort("status")} sortIcon={<SortIcon field="status" />}>Estado</ResizableTableHead>
              <TableHead style={{ width: `${columnWidths.actions}px` }} className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="py-12 text-center text-sm text-slate-500">
                {searchQuery ? "No se encontraron alarmas con ese criterio." : "No hay alarmas configuradas. Crea la primera con «Nueva Alarma»."}
              </TableCell></TableRow>
            ) : visible.map((alarm) => (
              <TableRow key={alarm.id} className={`hover:bg-slate-50 ${selectedIds.has(alarm.id) ? "bg-blue-50" : ""}`}>
                <TableCell style={{ width: `${columnWidths.select}px` }}><Checkbox checked={selectedIds.has(alarm.id)} onCheckedChange={() => toggleOne(alarm.id)} /></TableCell>
                <TableCell style={{ width: `${columnWidths.enable}px` }}><Checkbox checked={alarm.enable} onCheckedChange={() => onToggleEnable(alarm.id)} /></TableCell>
                <TableCell className="font-medium text-slate-900 truncate" style={{ width: `${columnWidths.name}px`, maxWidth: `${columnWidths.name}px` }} title={alarm.name}>{alarm.name}</TableCell>
                <TableCell className="text-slate-600 truncate" style={{ width: `${columnWidths.description}px`, maxWidth: `${columnWidths.description}px` }} title={alarm.description}>{alarm.description ?? "—"}</TableCell>
                <TableCell style={{ width: `${columnWidths.type}px` }}><Badge variant="secondary" className="text-xs">{alarm.type}</Badge></TableCell>
                <TableCell style={{ width: `${columnWidths.priority}px` }}><PriorityBadge priority={alarm.priority} /></TableCell>
                <TableCell className="text-slate-600" style={{ width: `${columnWidths.category}px` }}>{alarm.category ?? "—"}</TableCell>
                <TableCell style={{ width: `${columnWidths.sourceType}px` }}><Badge variant="secondary" className="text-xs">{alarm.sourceType}</Badge></TableCell>
                <TableCell style={{ width: `${columnWidths.status}px` }}><StatusBadge status={alarm.status} /></TableCell>
                <TableCell className="text-right" style={{ width: `${columnWidths.actions}px` }}>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => onEdit(alarm)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => onDuplicate(alarm)} title="Duplicar"><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => { if (window.confirm(`¿Eliminar la alarma "${alarm.name}"?`)) onDelete(alarm.id); }} title="Eliminar" className="hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
