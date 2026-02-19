"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Types ──────────────────────────────────────────────────────────────────────
enum EventType {
  TEMPORAL = "Temporal",
  CONTEXT = "Contexto Operativo",
  DATA = "Datos",
  KPI = "KPI",
  ALARM = "Alarma",
  AI = "Inteligencia Artificial",
}

enum EventLogStatus {
  SUCCESS = "success",
  FAILED = "failed",
  PARTIAL = "partial",
  IN_PROGRESS = "in_progress",
}

type EventLogEntry = {
  id: number;
  timestamp: string;
  ruleName: string;
  eventType: EventType;
  trigger: string;
  actionsTotal: number;
  actionsSuccess: number;
  durationMs: number;
  status: EventLogStatus;
  errorMessage?: string;
};

// ── Status badge config ────────────────────────────────────────────────────────
const logStatusConfig: Record<EventLogStatus, { variant: "success" | "destructive" | "warning" | "secondary"; label: string }> = {
  [EventLogStatus.SUCCESS]: { variant: "success", label: "Correcta" },
  [EventLogStatus.FAILED]: { variant: "destructive", label: "Error" },
  [EventLogStatus.PARTIAL]: { variant: "warning", label: "Parcial" },
  [EventLogStatus.IN_PROGRESS]: { variant: "secondary", label: "En curso" },
};

// ── Format duration ────────────────────────────────────────────────────────────
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

// ── Format datetime ────────────────────────────────────────────────────────────
function formatDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ── Date string helpers ────────────────────────────────────────────────────────
function toInputDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function daysAgo(n: number): Date {
  const d = new Date("2026-02-18T23:59:59.000Z");
  d.setDate(d.getDate() - n);
  return d;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const dt = (daysBack: number, h: number, m: number) =>
  new Date(new Date("2026-02-18T00:00:00.000Z").getTime() - daysBack * 86400000 + h * 3600000 + m * 60000).toISOString();

const MOCK_LOG: EventLogEntry[] = [
  {
    id: 1, timestamp: dt(0, 7, 0), ruleName: "EVT-INFORME-DIARIO",
    eventType: EventType.TEMPORAL, trigger: "Cron: 0 7 * * 1-5",
    actionsTotal: 2, actionsSuccess: 2, durationMs: 1247, status: EventLogStatus.SUCCESS,
  },
  {
    id: 2, timestamp: dt(0, 2, 31), ruleName: "EVT-ALERTA-CONSUMO",
    eventType: EventType.DATA, trigger: "{E-KW-TOTAL} = 387 kW, {T-TEMP-001} = 263 °C",
    actionsTotal: 2, actionsSuccess: 2, durationMs: 312, status: EventLogStatus.SUCCESS,
  },
  {
    id: 3, timestamp: dt(0, 0, 15), ruleName: "EVT-ALARMA-CRITICA",
    eventType: EventType.ALARM, trigger: "ALM-KW-PICO → ALARM_CRITICAL_ACTIVE",
    actionsTotal: 3, actionsSuccess: 3, durationMs: 89, status: EventLogStatus.SUCCESS,
  },
  {
    id: 4, timestamp: dt(1, 7, 0), ruleName: "EVT-INFORME-DIARIO",
    eventType: EventType.TEMPORAL, trigger: "Cron: 0 7 * * 1-5",
    actionsTotal: 2, actionsSuccess: 1, durationMs: 4820,
    status: EventLogStatus.PARTIAL,
    errorMessage: "SMTP error: conexión rechazada al enviar email",
  },
  {
    id: 5, timestamp: dt(1, 22, 0), ruleName: "EVT-EXPORT-TURNO",
    eventType: EventType.CONTEXT, trigger: "TURNO_FIN",
    actionsTotal: 2, actionsSuccess: 2, durationMs: 2155, status: EventLogStatus.SUCCESS,
  },
  {
    id: 6, timestamp: dt(2, 7, 0), ruleName: "EVT-INFORME-DIARIO",
    eventType: EventType.TEMPORAL, trigger: "Cron: 0 7 * * 1-5",
    actionsTotal: 2, actionsSuccess: 2, durationMs: 1089, status: EventLogStatus.SUCCESS,
  },
  {
    id: 7, timestamp: dt(2, 14, 22), ruleName: "EVT-KPI-CRITICO",
    eventType: EventType.KPI, trigger: "{KPI-COSTE-ELEC-DIA} = 412 €/día",
    actionsTotal: 2, actionsSuccess: 0, durationMs: 5200,
    status: EventLogStatus.FAILED,
    errorMessage: "Webhook timeout: no response from https://hooks.empresa.com/kpi-critico",
  },
  {
    id: 8, timestamp: dt(2, 22, 0), ruleName: "EVT-EXPORT-TURNO",
    eventType: EventType.CONTEXT, trigger: "TURNO_FIN",
    actionsTotal: 2, actionsSuccess: 2, durationMs: 1832, status: EventLogStatus.SUCCESS,
  },
  {
    id: 9, timestamp: dt(3, 7, 0), ruleName: "EVT-INFORME-DIARIO",
    eventType: EventType.TEMPORAL, trigger: "Cron: 0 7 * * 1-5",
    actionsTotal: 2, actionsSuccess: 2, durationMs: 943, status: EventLogStatus.SUCCESS,
  },
  {
    id: 10, timestamp: dt(4, 7, 0), ruleName: "EVT-INFORME-DIARIO",
    eventType: EventType.TEMPORAL, trigger: "Cron: 0 7 * * 1-5",
    actionsTotal: 2, actionsSuccess: 2, durationMs: 1103, status: EventLogStatus.SUCCESS,
  },
  {
    id: 11, timestamp: dt(5, 10, 15), ruleName: "EVT-ALARMA-CRITICA",
    eventType: EventType.ALARM, trigger: "ALM-TEMP-HORNO → ALARM_CRITICAL_ACTIVE",
    actionsTotal: 3, actionsSuccess: 3, durationMs: 74, status: EventLogStatus.SUCCESS,
  },
  {
    id: 12, timestamp: dt(6, 7, 0), ruleName: "EVT-INFORME-DIARIO",
    eventType: EventType.TEMPORAL, trigger: "Cron: 0 7 * * 1-5",
    actionsTotal: 2, actionsSuccess: 2, durationMs: 1341, status: EventLogStatus.SUCCESS,
  },
];

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
export default function EventosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [dateFrom, setDateFrom] = useState<string>(toInputDate(daysAgo(7)));
  const [dateTo, setDateTo] = useState<string>(toInputDate(new Date("2026-02-18T23:59:59.000Z")));

  // Stats from today (last 24h)
  const today = new Date("2026-02-18T00:00:00.000Z");
  const todayEntries = MOCK_LOG.filter((e) => new Date(e.timestamp) >= today);
  const totalToday = todayEntries.length;
  const successCount = MOCK_LOG.filter((e) => e.status === EventLogStatus.SUCCESS).length;
  const errorCount = MOCK_LOG.filter((e) => e.status === EventLogStatus.FAILED || e.status === EventLogStatus.PARTIAL).length;
  const successRate = MOCK_LOG.length > 0 ? Math.round((successCount / MOCK_LOG.length) * 100) : 0;

  // Filtered entries
  const visibleEntries = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : 0;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Infinity;
    const q = searchQuery.toLowerCase();

    return MOCK_LOG.filter((e) => {
      const ts = new Date(e.timestamp).getTime();
      if (ts < fromTs || ts > toTs) return false;
      if (q && !e.ruleName.toLowerCase().includes(q)) return false;
      if (typeFilter !== "__all__" && e.eventType !== typeFilter) return false;
      if (statusFilter !== "__all__" && e.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [searchQuery, typeFilter, statusFilter, dateFrom, dateTo]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Log de Eventos</h1>
            <p className="mt-1 text-sm text-slate-500">
              Historial de ejecuciones del motor de eventos — sólo lectura
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <StatCard label="Hoy" value={totalToday} color="border-slate-200 bg-slate-50 text-slate-700" />
            <StatCard label="Correctas" value={successCount} color="border-emerald-200 bg-emerald-50 text-emerald-700" />
            <StatCard label="Con errores" value={errorCount} color="border-red-200 bg-red-50 text-red-700" />
            <StatCard label="Tasa de éxito" value={`${successRate}%`} color="border-blue-200 bg-blue-50 text-blue-700" />
          </div>
        </div>
      </header>

      {/* Table card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nombre de regla…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los tipos</SelectItem>
              {Object.values(EventType).map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los estados</SelectItem>
              <SelectItem value={EventLogStatus.SUCCESS}>Correcta</SelectItem>
              <SelectItem value={EventLogStatus.FAILED}>Con error</SelectItem>
              <SelectItem value={EventLogStatus.PARTIAL}>Parcial</SelectItem>
              <SelectItem value={EventLogStatus.IN_PROGRESS}>En curso</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <label className="text-xs text-slate-500 whitespace-nowrap">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-40">Timestamp</TableHead>
                <TableHead>Nombre de regla</TableHead>
                <TableHead className="w-32">Tipo</TableHead>
                <TableHead className="hidden lg:table-cell">Disparador</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
                <TableHead className="w-24">Duración</TableHead>
                <TableHead className="w-28">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    No hay eventos en el periodo seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                visibleEntries.map((entry) => {
                  const sc = logStatusConfig[entry.status];
                  return (
                    <TableRow key={entry.id} className="hover:bg-slate-50">
                      <TableCell>
                        <span className="font-mono text-xs text-slate-700">
                          {formatDatetime(entry.timestamp)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-900 text-sm">{entry.ruleName}</p>
                        {entry.errorMessage && (
                          <p className="text-xs text-red-500 mt-0.5 truncate max-w-xs" title={entry.errorMessage}>
                            ⚠ {entry.errorMessage}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{entry.eventType}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs">
                        <span className="text-xs font-mono text-slate-500 truncate block" title={entry.trigger}>
                          {entry.trigger}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${entry.actionsSuccess === entry.actionsTotal ? "text-emerald-700" : "text-amber-600"}`}>
                          {entry.actionsSuccess}/{entry.actionsTotal}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-700">{formatDuration(entry.durationMs)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {visibleEntries.length > 0 && (
          <p className="text-xs text-slate-400 text-right">
            {visibleEntries.length} entrada{visibleEntries.length !== 1 ? "s" : ""}
            {MOCK_LOG.length !== visibleEntries.length ? ` de ${MOCK_LOG.length} en total` : ""}
          </p>
        )}
      </div>
    </section>
  );
}
