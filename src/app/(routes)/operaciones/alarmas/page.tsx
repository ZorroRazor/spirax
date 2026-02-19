"use client";

import { useState, useMemo } from "react";
import { Bell, CheckCircle2, Search, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

// ── Types ──────────────────────────────────────────────────────────────────────
enum AlarmPriority { LOW = "Baja", MEDIUM = "Media", HIGH = "Alta", CRITICAL = "Crítica" }
enum AlarmCategory { ENERGIA = "Energía", PRODUCCION = "Producción", MANTENIMIENTO = "Mantenimiento", SEGURIDAD = "Seguridad", COMUNICACION = "Comunicación" }
enum AlarmInstanceStatus { ACTIVE = "active", ACKNOWLEDGED = "acknowledged", IN_PROGRESS = "in_progress", RESOLVED = "resolved" }

type AlarmInstance = {
  id: number;
  alarmName: string;
  description: string;
  priority: AlarmPriority;
  category: AlarmCategory;
  hierarchy: { planta: string; area: string; seccion: string; equipo: string };
  currentValue: string;
  activatedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  acknowledgeComment?: string;
  status: AlarmInstanceStatus;
};

// ── Priority helpers ───────────────────────────────────────────────────────────
const PRIORITY_ORDER: Record<AlarmPriority, number> = {
  [AlarmPriority.CRITICAL]: 0,
  [AlarmPriority.HIGH]: 1,
  [AlarmPriority.MEDIUM]: 2,
  [AlarmPriority.LOW]: 3,
};

const priorityBadge: Record<AlarmPriority, "destructive" | "warning" | "secondary"> = {
  [AlarmPriority.CRITICAL]: "destructive",
  [AlarmPriority.HIGH]: "warning",
  [AlarmPriority.MEDIUM]: "warning",
  [AlarmPriority.LOW]: "secondary",
};

const statusConfig: Record<AlarmInstanceStatus, { variant: "destructive" | "warning" | "success" | "secondary"; label: string }> = {
  [AlarmInstanceStatus.ACTIVE]: { variant: "destructive", label: "Activa" },
  [AlarmInstanceStatus.ACKNOWLEDGED]: { variant: "warning", label: "Reconocida" },
  [AlarmInstanceStatus.IN_PROGRESS]: { variant: "warning", label: "En curso" },
  [AlarmInstanceStatus.RESOLVED]: { variant: "success", label: "Resuelta" },
};

// ── Relative time ──────────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "< 1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Format datetime ────────────────────────────────────────────────────────────
function formatDatetime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Hierarchy label ────────────────────────────────────────────────────────────
function hierarchyLabel(h: AlarmInstance["hierarchy"]): string {
  return [h.planta, h.area, h.seccion, h.equipo].filter(Boolean).join(" / ");
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const NOW = new Date("2026-02-18T10:30:00.000Z");
const ago = (min: number) => new Date(NOW.getTime() - min * 60000).toISOString();

const MOCK_ALARMS: AlarmInstance[] = [
  {
    id: 1, alarmName: "ALM-KW-PICO", description: "Consumo eléctrico supera pico crítico",
    priority: AlarmPriority.CRITICAL, category: AlarmCategory.ENERGIA,
    hierarchy: { planta: "Planta Norte", area: "Área Utilities", seccion: "Sección Eléctrica", equipo: "Cuadro-QE01" },
    currentValue: "423 kW", activatedAt: ago(47),
    status: AlarmInstanceStatus.ACTIVE,
  },
  {
    id: 2, alarmName: "ALM-TEMP-HORNO", description: "Temperatura horno supera límite operativo",
    priority: AlarmPriority.CRITICAL, category: AlarmCategory.MANTENIMIENTO,
    hierarchy: { planta: "Planta Norte", area: "Área Producción", seccion: "Sección Moldeado", equipo: "Moldeadora-M01" },
    currentValue: "281 °C", activatedAt: ago(8),
    status: AlarmInstanceStatus.ACTIVE,
  },
  {
    id: 3, alarmName: "ALM-COMM-PLC", description: "Pérdida de comunicación con PLC-002",
    priority: AlarmPriority.HIGH, category: AlarmCategory.COMUNICACION,
    hierarchy: { planta: "Planta Norte", area: "Área Producción", seccion: "", equipo: "" },
    currentValue: "Sin datos", activatedAt: ago(23),
    acknowledgedAt: ago(18), acknowledgedBy: "operario-02",
    acknowledgeComment: "Revisando cableado de red en cuadro CQ-02",
    status: AlarmInstanceStatus.ACKNOWLEDGED,
  },
  {
    id: 4, alarmName: "ALM-PRES-VAPOR", description: "Presión de vapor por encima del límite de seguridad",
    priority: AlarmPriority.HIGH, category: AlarmCategory.SEGURIDAD,
    hierarchy: { planta: "Planta Norte", area: "Área Utilities", seccion: "Sección Vapor", equipo: "Caldera-C01" },
    currentValue: "7.8 bar", activatedAt: ago(5),
    status: AlarmInstanceStatus.ACTIVE,
  },
  {
    id: 5, alarmName: "ALM-KPI-COSTE", description: "KPI coste eléctrico diario en estado crítico",
    priority: AlarmPriority.HIGH, category: AlarmCategory.ENERGIA,
    hierarchy: { planta: "Planta Norte", area: "Área Utilities", seccion: "Sección Eléctrica", equipo: "Cuadro-QE01" },
    currentValue: "412 €/día", activatedAt: ago(180),
    acknowledgedAt: ago(120), acknowledgedBy: "supervisor-01",
    acknowledgeComment: "Comunicado a dirección. Revisando contrato tarifario.",
    status: AlarmInstanceStatus.IN_PROGRESS,
  },
  {
    id: 6, alarmName: "ALM-FLOW-BAJA", description: "Caudal de agua de refrigeración por debajo del mínimo",
    priority: AlarmPriority.MEDIUM, category: AlarmCategory.MANTENIMIENTO,
    hierarchy: { planta: "Planta Norte", area: "Área Producción", seccion: "Sección Ensamblado", equipo: "Mesa-E01" },
    currentValue: "0.8 m³/h", activatedAt: ago(62),
    status: AlarmInstanceStatus.ACTIVE,
  },
  {
    id: 7, alarmName: "ALM-EFF-BAJA", description: "Eficiencia de producción por debajo del umbral",
    priority: AlarmPriority.MEDIUM, category: AlarmCategory.PRODUCCION,
    hierarchy: { planta: "Planta Norte", area: "Área Producción", seccion: "Sección Ensamblado", equipo: "Mesa-E01" },
    currentValue: "74 %", activatedAt: ago(95),
    status: AlarmInstanceStatus.ACTIVE,
  },
  {
    id: 8, alarmName: "ALM-TEMP-SALIDA", description: "Temperatura de salida horno ligeramente elevada",
    priority: AlarmPriority.LOW, category: AlarmCategory.MANTENIMIENTO,
    hierarchy: { planta: "Planta Norte", area: "Área Producción", seccion: "Sección Moldeado", equipo: "Moldeadora-M01" },
    currentValue: "193 °C", activatedAt: ago(210),
    acknowledgedAt: ago(200), acknowledgedBy: "operario-01",
    status: AlarmInstanceStatus.RESOLVED,
  },
];

// ── Acknowledge Dialog ─────────────────────────────────────────────────────────
function AcknowledgeDialog({
  open, alarmName, onClose, onConfirm,
}: { open: boolean; alarmName: string; onClose: () => void; onConfirm: (comment: string) => void }) {
  const [comment, setComment] = useState("");
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setComment(""); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            Reconocer alarma
          </DialogTitle>
          <DialogDescription>
            Reconociendo: <span className="font-medium text-slate-900">{alarmName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Comentario (opcional)</Label>
          <Textarea
            placeholder="Añade un comentario sobre la acción tomada…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setComment(""); onClose(); }}>Cancelar</Button>
          <Button onClick={() => { onConfirm(comment); setComment(""); }}>Reconocer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`flex flex-col items-center rounded-xl border px-6 py-3 ${color}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AlarmasPage() {
  const [alarms, setAlarms] = useState<AlarmInstance[]>(MOCK_ALARMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");

  // Acknowledge dialog
  const [ackTarget, setAckTarget] = useState<AlarmInstance | null>(null);

  // Stats
  const activeCount = alarms.filter((a) => a.status === AlarmInstanceStatus.ACTIVE).length;
  const criticalCount = alarms.filter((a) => a.priority === AlarmPriority.CRITICAL && a.status !== AlarmInstanceStatus.RESOLVED).length;
  const highCount = alarms.filter((a) => a.priority === AlarmPriority.HIGH && a.status !== AlarmInstanceStatus.RESOLVED).length;
  const acknowledgedCount = alarms.filter((a) => a.status === AlarmInstanceStatus.ACKNOWLEDGED).length;

  // Filtered + sorted alarms
  const visibleAlarms = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = alarms.filter((a) => {
      if (q && !a.alarmName.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
      if (priorityFilter !== "__all__" && a.priority !== priorityFilter) return false;
      if (statusFilter !== "__all__" && a.status !== statusFilter) return false;
      return true;
    });
    return result.sort((a, b) => {
      const po = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (po !== 0) return po;
      return new Date(a.activatedAt).getTime() - new Date(b.activatedAt).getTime();
    });
  }, [alarms, searchQuery, priorityFilter, statusFilter]);

  // Handlers
  const handleAcknowledge = (id: number, comment: string) => {
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: AlarmInstanceStatus.ACKNOWLEDGED,
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy: "operario-01",
              acknowledgeComment: comment || undefined,
            }
          : a
      )
    );
    setAckTarget(null);
  };

  const handleResolve = (id: number) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: AlarmInstanceStatus.RESOLVED } : a))
    );
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Panel de Alarmas</h1>
            <p className="mt-1 text-sm text-slate-500">
              Vista operacional — {alarms.filter((a) => a.status !== AlarmInstanceStatus.RESOLVED).length} alarmas pendientes de resolución
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <StatCard label="Activas" value={activeCount} color="border-red-200 bg-red-50 text-red-700" />
            <StatCard label="Críticas" value={criticalCount} color="border-red-300 bg-red-100 text-red-800" />
            <StatCard label="Altas" value={highCount} color="border-amber-200 bg-amber-50 text-amber-700" />
            <StatCard label="Reconocidas" value={acknowledgedCount} color="border-yellow-200 bg-yellow-50 text-yellow-700" />
          </div>
        </div>
      </header>

      {/* Table card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o descripción…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las prioridades</SelectItem>
              <SelectItem value={AlarmPriority.CRITICAL}>Crítica</SelectItem>
              <SelectItem value={AlarmPriority.HIGH}>Alta</SelectItem>
              <SelectItem value={AlarmPriority.MEDIUM}>Media</SelectItem>
              <SelectItem value={AlarmPriority.LOW}>Baja</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los estados</SelectItem>
              <SelectItem value={AlarmInstanceStatus.ACTIVE}>Activas</SelectItem>
              <SelectItem value={AlarmInstanceStatus.ACKNOWLEDGED}>Reconocidas</SelectItem>
              <SelectItem value={AlarmInstanceStatus.IN_PROGRESS}>En curso</SelectItem>
              <SelectItem value={AlarmInstanceStatus.RESOLVED}>Resueltas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-24">Prioridad</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead className="hidden lg:table-cell">Jerarquía</TableHead>
                <TableHead className="w-28">Valor actual</TableHead>
                <TableHead className="w-28">Activa hace</TableHead>
                <TableHead className="w-28">Estado</TableHead>
                <TableHead className="w-36 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleAlarms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-slate-500">
                    No hay alarmas que coincidan con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                visibleAlarms.map((alarm) => {
                  const sc = statusConfig[alarm.status];
                  const pb = priorityBadge[alarm.priority];
                  const canAck = alarm.status === AlarmInstanceStatus.ACTIVE || alarm.status === AlarmInstanceStatus.IN_PROGRESS;
                  const canResolve = alarm.status !== AlarmInstanceStatus.RESOLVED;
                  return (
                    <TableRow
                      key={alarm.id}
                      className={`hover:bg-slate-50 ${alarm.status === AlarmInstanceStatus.RESOLVED ? "opacity-60" : ""}`}
                    >
                      <TableCell>
                        <Badge variant={pb}>{alarm.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900 font-mono text-sm">{alarm.alarmName}</p>
                          <p className="text-xs text-slate-500">{alarm.category}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs">
                        <p className="text-sm text-slate-600 truncate">{alarm.description}</p>
                        {alarm.acknowledgeComment && (
                          <p className="text-xs text-slate-400 truncate mt-0.5 italic">
                            💬 {alarm.acknowledgeComment}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-xs text-slate-500">{hierarchyLabel(alarm.hierarchy) || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium text-slate-900 text-sm">{alarm.currentValue}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm text-slate-700">{relativeTime(alarm.activatedAt)}</span>
                          {alarm.acknowledgedAt && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Ack: {formatDatetime(alarm.acknowledgedAt)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                        {alarm.acknowledgedBy && (
                          <p className="text-xs text-slate-400 mt-0.5">{alarm.acknowledgedBy}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canAck && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                              onClick={() => setAckTarget(alarm)}
                              title="Reconocer alarma"
                            >
                              <Bell className="h-3 w-3" />
                              Reconocer
                            </Button>
                          )}
                          {canResolve && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              onClick={() => handleResolve(alarm.id)}
                              title="Marcar como resuelta"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Resolver
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {visibleAlarms.length > 0 && (
          <p className="text-xs text-slate-400 text-right">
            {visibleAlarms.length} alarma{visibleAlarms.length !== 1 ? "s" : ""} mostrada{visibleAlarms.length !== 1 ? "s" : ""}
            {alarms.length !== visibleAlarms.length ? ` de ${alarms.length}` : ""}
          </p>
        )}
      </div>

      {/* No active alarms banner */}
      {activeCount === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3 text-emerald-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">No hay alarmas activas en este momento. El sistema opera con normalidad.</p>
        </div>
      )}

      {/* Acknowledge dialog */}
      <AcknowledgeDialog
        open={!!ackTarget}
        alarmName={ackTarget?.alarmName ?? ""}
        onClose={() => setAckTarget(null)}
        onConfirm={(comment) => ackTarget && handleAcknowledge(ackTarget.id, comment)}
      />
    </section>
  );
}
