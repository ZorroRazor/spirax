"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Clock, Play, CheckCircle2, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { ContextType, ContextStatus, MOCK_CONTEXTS } from "./contextos.shared";
import type { OperatingContext } from "./contextos.shared";

// ── Types ──────────────────────────────────────────────────────────────────────
enum ContextDomain { INDUSTRIAL = "Industrial", BUILDINGS = "Oficinas/Edificios", RESIDENTIAL = "Residencial", OTHER = "Otros" }

const DOMAIN_TYPES: Record<ContextDomain, ContextType[]> = {
  [ContextDomain.INDUSTRIAL]: [ContextType.OF, ContextType.LOTE, ContextType.TURNO, ContextType.PARADA, ContextType.MODO],
  [ContextDomain.BUILDINGS]: [ContextType.HORARIO_LABORAL, ContextType.PERIODO_OCUPACION, ContextType.HVAC, ContextType.EVENTO],
  [ContextDomain.RESIDENTIAL]: [ContextType.PRESENCIA, ContextType.AUSENCIA, ContextType.TARIFARIO],
  [ContextDomain.OTHER]: [ContextType.PERSONALIZADO],
};


// Shift types (RF5.1)
type Shift = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  active: boolean;
};

// Calendar entry (RF5.1)
type CalendarEntry = {
  id: number;
  type: "laboral" | "festivo" | "parada" | "vacaciones";
  name: string;
  dateFrom: string;
  dateTo?: string;
  recurrent: boolean;
};

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_SHIFTS: Shift[] = [
  { id: 1, name: "Turno Mañana", startTime: "06:00", endTime: "14:00", days: ["L", "M", "X", "J", "V"], active: true },
  { id: 2, name: "Turno Tarde", startTime: "14:00", endTime: "22:00", days: ["L", "M", "X", "J", "V"], active: true },
  { id: 3, name: "Turno Noche", startTime: "22:00", endTime: "06:00", days: ["L", "M", "X", "J", "V", "S"], active: true },
  { id: 4, name: "Turno Fin de Semana", startTime: "06:00", endTime: "18:00", days: ["S", "D"], active: false },
];

const MOCK_CALENDAR: CalendarEntry[] = [
  { id: 1, type: "laboral", name: "Horario laboral estándar", dateFrom: "2026-01-01", dateTo: "2026-12-31", recurrent: true },
  { id: 2, type: "festivo", name: "Año Nuevo", dateFrom: "2026-01-01", recurrent: true },
  { id: 3, type: "festivo", name: "Reyes Magos", dateFrom: "2026-01-06", recurrent: true },
  { id: 4, type: "festivo", name: "Semana Santa", dateFrom: "2026-04-02", dateTo: "2026-04-06", recurrent: false },
  { id: 5, type: "parada", name: "Parada de verano", dateFrom: "2026-08-01", dateTo: "2026-08-15", recurrent: false },
  { id: 6, type: "vacaciones", name: "Vacaciones de Navidad", dateFrom: "2026-12-24", dateTo: "2026-12-31", recurrent: true },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ContextStatus, { variant: "success" | "secondary" | "warning"; icon: React.ReactNode }> = {
  [ContextStatus.ACTIVE]: { variant: "success", icon: <Play className="h-3 w-3" /> },
  [ContextStatus.PLANNED]: { variant: "warning", icon: <Clock className="h-3 w-3" /> },
  [ContextStatus.CLOSED]: { variant: "secondary", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const TYPE_COLOR: Record<ContextType, string> = {
  [ContextType.OF]: "bg-blue-100 text-blue-700",
  [ContextType.LOTE]: "bg-blue-50 text-blue-600",
  [ContextType.TURNO]: "bg-emerald-100 text-emerald-700",
  [ContextType.PARADA]: "bg-red-100 text-red-700",
  [ContextType.MODO]: "bg-purple-100 text-purple-700",
  [ContextType.HORARIO_LABORAL]: "bg-teal-100 text-teal-700",
  [ContextType.PERIODO_OCUPACION]: "bg-teal-50 text-teal-600",
  [ContextType.HVAC]: "bg-cyan-100 text-cyan-700",
  [ContextType.EVENTO]: "bg-amber-100 text-amber-700",
  [ContextType.PRESENCIA]: "bg-green-100 text-green-700",
  [ContextType.AUSENCIA]: "bg-orange-100 text-orange-700",
  [ContextType.TARIFARIO]: "bg-pink-100 text-pink-700",
  [ContextType.PERSONALIZADO]: "bg-slate-100 text-slate-600",
};

const CALENDAR_TYPE_CONFIG: Record<CalendarEntry["type"], { label: string; color: string }> = {
  laboral: { label: "Laboral", color: "bg-blue-100 text-blue-700" },
  festivo: { label: "Festivo", color: "bg-red-100 text-red-700" },
  parada: { label: "Parada", color: "bg-amber-100 text-amber-700" },
  vacaciones: { label: "Vacaciones", color: "bg-emerald-100 text-emerald-700" },
};

function formatDateRange(start: string, end?: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  return end ? `${fmt(start)} → ${fmt(end)}` : `${fmt(start)} →`;
}

function duration(start: string, end?: string): string {
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

// ── Context Form Dialog ────────────────────────────────────────────────────────
function ContextFormDialog({
  open, onClose, onSubmit, editingCtx,
}: {
  open: boolean; onClose: () => void;
  onSubmit: (c: Omit<OperatingContext, "id" | "contextUUID">) => void;
  editingCtx: OperatingContext | null;
}) {
  const [type, setType] = useState<ContextType>(ContextType.OF);
  const [name, setName] = useState("");
  const [hierarchy, setHierarchy] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [status, setStatus] = useState<ContextStatus>(ContextStatus.PLANNED);
  const [ofCode, setOfCode] = useState("");
  const [product, setProduct] = useState("");
  const [line, setLine] = useState("");
  const [producedQty, setProducedQty] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const toInputValue = (iso: string) => iso ? iso.slice(0, 16) : "";

  useState(() => {
    if (open) {
      setError("");
      if (editingCtx) {
        setType(editingCtx.type); setName(editingCtx.name); setHierarchy(editingCtx.hierarchy);
        setStartAt(toInputValue(editingCtx.startAt)); setEndAt(toInputValue(editingCtx.endAt ?? ""));
        setStatus(editingCtx.status); setOfCode(editingCtx.ofCode ?? ""); setProduct(editingCtx.product ?? "");
        setLine(editingCtx.line ?? ""); setProducedQty(String(editingCtx.producedQty ?? ""));
        setNotes(editingCtx.metadata.notes ?? "");
      } else {
        setType(ContextType.OF); setName(""); setHierarchy(""); setStartAt(""); setEndAt("");
        setStatus(ContextStatus.PLANNED); setOfCode(""); setProduct(""); setLine(""); setProducedQty(""); setNotes("");
      }
    }
  });

  const isOF = type === ContextType.OF || type === ContextType.LOTE;

  const handleSubmit = () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    if (!startAt) { setError("La fecha de inicio es obligatoria"); return; }
    onSubmit({
      type, name: name.trim(), hierarchy: hierarchy.trim(), startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : undefined, status,
      metadata: { notes: notes.trim() || undefined },
      ofCode: isOF ? ofCode.trim() || undefined : undefined,
      product: isOF ? product.trim() || undefined : undefined,
      line: isOF ? line.trim() || undefined : undefined,
      producedQty: isOF && producedQty ? Number(producedQty) : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCtx ? "Editar contexto" : "Nuevo contexto operativo"}</DialogTitle>
          <DialogDescription>Define un periodo de actividad relevante para el análisis de datos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Tipo de contexto *</Label>
              <Select value={type} onValueChange={(v) => { setType(v as ContextType); setError(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOMAIN_TYPES).map(([domain, types]) => (
                    <div key={domain}>
                      <div className="px-2 py-1 text-xs font-semibold text-slate-400">{domain}</div>
                      {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Nombre *</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Nombre descriptivo" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Jerarquía asociada</Label>
              <Input value={hierarchy} onChange={(e) => setHierarchy(e.target.value)} placeholder="Planta Norte > Área Producción" />
            </div>
            <div className="space-y-1">
              <Label>Inicio *</Label>
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            </div>
            <div className="space-y-1">
              <Label>Fin</Label>
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContextStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ContextStatus).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* OF-specific fields */}
          {isOF && (
            <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
              <p className="text-xs font-semibold text-blue-700">Campos específicos de {type}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Código OF</Label>
                  <Input value={ofCode} onChange={(e) => setOfCode(e.target.value)} placeholder="OF-2026-XXXX" />
                </div>
                <div className="space-y-1">
                  <Label>Producto / Receta</Label>
                  <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Nombre del producto" />
                </div>
                <div className="space-y-1">
                  <Label>Línea / Equipo</Label>
                  <Input value={line} onChange={(e) => setLine(e.target.value)} placeholder="Moldeadora-M01" />
                </div>
                <div className="space-y-1">
                  <Label>Cant. producida</Label>
                  <Input type="number" value={producedQty} onChange={(e) => setProducedQty(e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones opcionales" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editingCtx ? "Guardar cambios" : "Crear contexto"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Tab: Contextos ─────────────────────────────────────────────────────────────
function ContextosTab() {
  const [contexts, setContexts] = useState<OperatingContext[]>(MOCK_CONTEXTS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCtx, setEditingCtx] = useState<OperatingContext | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [showClosed, setShowClosed] = useState(false);

  let nextId = Math.max(...contexts.map((c) => c.id), 0) + 1;
  let nextUUID = `CO-2026-${String(nextId).padStart(3, "0")}`;

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return contexts.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.hierarchy.toLowerCase().includes(q) && !(c.ofCode ?? "").toLowerCase().includes(q)) return false;
      if (typeFilter !== "__all__" && c.type !== typeFilter) return false;
      if (statusFilter !== "__all__" && c.status !== statusFilter) return false;
      if (!showClosed && c.status === ContextStatus.CLOSED) return false;
      return true;
    }).sort((a, b) => {
      const order = { [ContextStatus.ACTIVE]: 0, [ContextStatus.PLANNED]: 1, [ContextStatus.CLOSED]: 2 };
      return order[a.status] - order[b.status] || a.startAt.localeCompare(b.startAt);
    });
  }, [contexts, searchQuery, typeFilter, statusFilter, showClosed]);

  const activeCount = contexts.filter((c) => c.status === ContextStatus.ACTIVE).length;
  const plannedCount = contexts.filter((c) => c.status === ContextStatus.PLANNED).length;
  const closedCount = contexts.filter((c) => c.status === ContextStatus.CLOSED).length;

  const handleAdd = (data: Omit<OperatingContext, "id" | "contextUUID">) => {
    setContexts((p) => [...p, { ...data, id: nextId++, contextUUID: nextUUID }]);
  };
  const handleUpdate = (data: Omit<OperatingContext, "id" | "contextUUID">) => {
    if (!editingCtx) return;
    setContexts((p) => p.map((c) => c.id === editingCtx.id ? { ...c, ...data } : c));
    setEditingCtx(null);
  };
  const handleDelete = (ctx: OperatingContext) => {
    if (window.confirm(`¿Eliminar el contexto "${ctx.name}"?`)) setContexts((p) => p.filter((c) => c.id !== ctx.id));
  };
  const handleClose = (ctx: OperatingContext) => {
    setContexts((p) => p.map((c) => c.id === ctx.id ? { ...c, status: ContextStatus.CLOSED, endAt: c.endAt ?? new Date().toISOString() } : c));
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Activos", value: activeCount, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Planificados", value: plannedCount, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "Cerrados", value: closedCount, color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar nombre, jerarquía, código OF…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los tipos</SelectItem>
            {Object.entries(DOMAIN_TYPES).map(([domain, types]) => (
              <div key={domain}>
                <div className="px-2 py-1 text-xs font-semibold text-slate-400">{domain}</div>
                {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </div>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {Object.values(ContextStatus).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
          <Checkbox checked={showClosed} onCheckedChange={(v) => setShowClosed(!!v)} />
          Mostrar cerrados
        </label>
        <Button className="ml-auto" onClick={() => { setEditingCtx(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Contexto
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Estado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Jerarquía</TableHead>
              <TableHead className="hidden lg:table-cell">Intervalo</TableHead>
              <TableHead className="hidden xl:table-cell">Duración</TableHead>
              <TableHead className="hidden xl:table-cell">Producto / Info</TableHead>
              <TableHead className="text-right w-28">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-slate-400">Sin contextos en el periodo o filtros seleccionados.</TableCell></TableRow>
            ) : filtered.map((ctx) => {
              const sc = STATUS_CONFIG[ctx.status];
              return (
                <TableRow key={ctx.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Badge variant={sc.variant} className="flex w-fit items-center gap-1 text-xs">
                      {sc.icon}{ctx.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLOR[ctx.type]}`}>{ctx.type}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{ctx.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{ctx.contextUUID}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-slate-500 max-w-[200px] truncate">{ctx.hierarchy}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-slate-500 font-mono whitespace-nowrap">{formatDateRange(ctx.startAt, ctx.endAt)}</TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-slate-600">{duration(ctx.startAt, ctx.endAt)}</TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-slate-500">
                    {ctx.product && <span>{ctx.product}</span>}
                    {ctx.producedQty !== undefined && <span className="ml-1 text-slate-400">({ctx.producedQty} uds.)</span>}
                    {ctx.metadata.tariff && <span>Tarifa {ctx.metadata.tariff}</span>}
                    {ctx.metadata.notes && <span className="italic">{ctx.metadata.notes}</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {ctx.status === ContextStatus.ACTIVE && (
                        <Button variant="ghost" size="icon-xs" onClick={() => handleClose(ctx)} title="Cerrar contexto">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-xs" onClick={() => { setEditingCtx(ctx); setIsFormOpen(true); }} title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={() => handleDelete(ctx)} title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ContextFormDialog open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingCtx(null); }}
        onSubmit={(d) => { editingCtx ? handleUpdate(d) : handleAdd(d); }}
        editingCtx={editingCtx} />
    </div>
  );
}

// ── Tab: Turnos ────────────────────────────────────────────────────────────────
const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

function TurnosTab() {
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);

  const toggleActive = (id: number) =>
    setShifts((p) => p.map((s) => s.id === id ? { ...s, active: !s.active } : s));

  const deleteShift = (id: number) => {
    if (window.confirm("¿Eliminar este turno?")) setShifts((p) => p.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Configura los turnos del sistema. Los turnos se usan como agrupaciones temporales en análisis y contextos operativos.</p>
        <Button size="sm" onClick={() => {}}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Nuevo turno
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Nombre</TableHead>
              <TableHead className="w-24 text-center">Inicio</TableHead>
              <TableHead className="w-24 text-center">Fin</TableHead>
              <TableHead>Días</TableHead>
              <TableHead className="w-20 text-center">Activo</TableHead>
              <TableHead className="text-right w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((s) => (
              <TableRow key={s.id} className={`hover:bg-slate-50 ${!s.active ? "opacity-50" : ""}`}>
                <TableCell className="font-medium text-slate-900">{s.name}</TableCell>
                <TableCell className="text-center font-mono text-sm">{s.startTime}</TableCell>
                <TableCell className="text-center font-mono text-sm">{s.endTime}</TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {DAYS.map((d) => (
                      <span key={d} className={`w-6 h-6 text-xs flex items-center justify-center rounded font-medium ${s.days.includes(d) ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-400"}`}>
                        {d}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={s.active} onCheckedChange={() => toggleActive(s.id)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-xs"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={() => deleteShift(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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

// ── Tab: Calendarios ───────────────────────────────────────────────────────────
function CalendariosTab() {
  const [entries, setEntries] = useState<CalendarEntry[]>(MOCK_CALENDAR);

  const deleteEntry = (id: number) => {
    if (window.confirm("¿Eliminar esta entrada de calendario?")) setEntries((p) => p.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Define festivos, paradas programadas, vacaciones y calendarios laborales que afectan a la agrupación temporal de datos.</p>
        <Button size="sm">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Nueva entrada
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Tipo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead>Hasta</TableHead>
              <TableHead className="w-24 text-center">Recurrente</TableHead>
              <TableHead className="text-right w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => {
              const tc = CALENDAR_TYPE_CONFIG[e.type];
              return (
                <TableRow key={e.id} className="hover:bg-slate-50">
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tc.color}`}>{tc.label}</span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 text-sm">{e.name}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">{e.dateFrom}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">{e.dateTo ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={e.recurrent ? "secondary" : "outline"} className="text-xs">
                      {e.recurrent ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-xs"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={() => deleteEntry(e.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
const TABS = ["Contextos", "Turnos", "Calendarios"] as const;
type TabId = (typeof TABS)[number];

export default function ContextosPage() {
  const [activeTab, setActiveTab] = useState<TabId>("Contextos");

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Periodos y Contextos Operativos</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Contextualiza los datos en intervalos temporales y operativos significativos.
              Los contextos operativos garantizan que los cálculos, KPI, informes y alarmas
              se realicen sobre los límites correctos de tiempo y actividad.
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 px-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === "Contextos" && <ContextosTab />}
          {activeTab === "Turnos" && <TurnosTab />}
          {activeTab === "Calendarios" && <CalendariosTab />}
        </div>
      </div>
    </section>
  );
}
