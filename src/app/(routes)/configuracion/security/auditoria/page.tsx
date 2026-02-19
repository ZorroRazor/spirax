"use client";

import { useState, useMemo } from "react";
import { Search, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Types ──────────────────────────────────────────────────────────────────────
enum AuditAction {
  LOGIN = "login",
  LOGOUT = "logout",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  EXPORT = "export",
  CONFIG_CHANGE = "config_change",
  PERMISSION_CHANGE = "permission_change",
  ACCESS_DENIED = "access_denied",
}

enum AuditResult {
  SUCCESS = "success",
  FAILED = "failed",
}

type AuditEntry = {
  id: number;
  timestamp: string;
  username: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  result: AuditResult;
  ipAddress: string;
  details?: string;
};

// ── Mock data ──────────────────────────────────────────────────────────────────
function daysAgo(n: number, h = 0, m = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const MOCK_AUDIT: AuditEntry[] = [
  { id: 1, timestamp: daysAgo(0, 9, 14), username: "admin", action: AuditAction.LOGIN, resource: "Sistema", result: AuditResult.SUCCESS, ipAddress: "192.168.1.10" },
  { id: 2, timestamp: daysAgo(0, 9, 15), username: "admin", action: AuditAction.UPDATE, resource: "Servidor", resourceId: "SRV-001", result: AuditResult.SUCCESS, ipAddress: "192.168.1.10", details: "Driver actualizado a 'Siemens S7'" },
  { id: 3, timestamp: daysAgo(0, 9, 20), username: "admin", action: AuditAction.CREATE, resource: "Usuario", resourceId: "visor-02", result: AuditResult.SUCCESS, ipAddress: "192.168.1.10", details: "Nuevo usuario visor-02 creado con rol Visor" },
  { id: 4, timestamp: daysAgo(0, 9, 22), username: "admin", action: AuditAction.PERMISSION_CHANGE, resource: "Rol", resourceId: "Externo", result: AuditResult.SUCCESS, ipAddress: "192.168.1.10", details: "Permiso 'Config > Security' removido" },
  { id: 5, timestamp: daysAgo(0, 8, 30), username: "supervisor-01", action: AuditAction.LOGIN, resource: "Sistema", result: AuditResult.SUCCESS, ipAddress: "192.168.1.45" },
  { id: 6, timestamp: daysAgo(0, 8, 31), username: "supervisor-01", action: AuditAction.UPDATE, resource: "Regla de Alarma", resourceId: "AR-005", result: AuditResult.SUCCESS, ipAddress: "192.168.1.45", details: "Umbral modificado de 400 a 420 kW" },
  { id: 7, timestamp: daysAgo(0, 8, 35), username: "supervisor-01", action: AuditAction.EXPORT, resource: "Analytics", result: AuditResult.SUCCESS, ipAddress: "192.168.1.45", details: "Exportado CSV 'Consumo eléctrico + temperatura'" },
  { id: 8, timestamp: daysAgo(0, 6, 5), username: "operario-02", action: AuditAction.LOGIN, resource: "Sistema", result: AuditResult.SUCCESS, ipAddress: "10.0.1.22" },
  { id: 9, timestamp: daysAgo(0, 6, 7), username: "operario-02", action: AuditAction.UPDATE, resource: "Alarma", resourceId: "ALM-002", result: AuditResult.SUCCESS, ipAddress: "10.0.1.22", details: "Alarma reconocida. Comentario: 'Revisado por turno tarde'" },
  { id: 10, timestamp: daysAgo(1, 14, 0), username: "analista-01", action: AuditAction.LOGIN, resource: "Sistema", result: AuditResult.SUCCESS, ipAddress: "192.168.1.88" },
  { id: 11, timestamp: daysAgo(1, 14, 2), username: "analista-01", action: AuditAction.CREATE, resource: "Analytics", result: AuditResult.SUCCESS, ipAddress: "192.168.1.88", details: "Nueva analítica creada: 'Presión vs Caudal'" },
  { id: 12, timestamp: daysAgo(1, 16, 30), username: "visor-externo", action: AuditAction.ACCESS_DENIED, resource: "Config > Security", result: AuditResult.FAILED, ipAddress: "85.42.110.5", details: "Intento de acceso a Usuarios sin permiso" },
  { id: 13, timestamp: daysAgo(2, 10, 0), username: "admin", action: AuditAction.DELETE, resource: "Tag Virtual", resourceId: "VT-OLD-001", result: AuditResult.SUCCESS, ipAddress: "192.168.1.10", details: "Tag eliminado: VT-OLD-001 (obsoleto)" },
  { id: 14, timestamp: daysAgo(2, 10, 5), username: "admin", action: AuditAction.CONFIG_CHANGE, resource: "Sistema", result: AuditResult.SUCCESS, ipAddress: "192.168.1.10", details: "Zona horaria cambiada a Europe/Madrid" },
  { id: 15, timestamp: daysAgo(3, 7, 45), username: "operario-01", action: AuditAction.LOGIN, resource: "Sistema", result: AuditResult.FAILED, ipAddress: "10.0.1.11", details: "Contraseña incorrecta (intento 1/5)" },
  { id: 16, timestamp: daysAgo(3, 7, 46), username: "operario-01", action: AuditAction.LOGIN, resource: "Sistema", result: AuditResult.SUCCESS, ipAddress: "10.0.1.11" },
  { id: 17, timestamp: daysAgo(4, 11, 0), username: "supervisor-01", action: AuditAction.CREATE, resource: "Regla de Evento", result: AuditResult.SUCCESS, ipAddress: "192.168.1.45", details: "Nueva regla: 'Informe semanal energía'" },
  { id: 18, timestamp: daysAgo(5, 9, 30), username: "admin", action: AuditAction.UPDATE, resource: "Grupo", resourceId: "Planta Norte", result: AuditResult.SUCCESS, ipAddress: "192.168.1.10", details: "Miembro 'analista-01' añadido al grupo" },
  { id: 19, timestamp: daysAgo(6, 8, 0), username: "analista-01", action: AuditAction.EXPORT, resource: "Reporting", result: AuditResult.SUCCESS, ipAddress: "192.168.1.88", details: "Informe 'KPI mensual Febrero 2026' generado" },
  { id: 20, timestamp: daysAgo(7, 15, 0), username: "admin", action: AuditAction.LOGOUT, resource: "Sistema", result: AuditResult.SUCCESS, ipAddress: "192.168.1.10" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const ACTION_LABEL: Record<AuditAction, string> = {
  [AuditAction.LOGIN]: "Inicio sesión",
  [AuditAction.LOGOUT]: "Cierre sesión",
  [AuditAction.CREATE]: "Creación",
  [AuditAction.UPDATE]: "Modificación",
  [AuditAction.DELETE]: "Eliminación",
  [AuditAction.EXPORT]: "Exportación",
  [AuditAction.CONFIG_CHANGE]: "Config. sistema",
  [AuditAction.PERMISSION_CHANGE]: "Cambio permiso",
  [AuditAction.ACCESS_DENIED]: "Acceso denegado",
};

const ACTION_COLOR: Record<AuditAction, string> = {
  [AuditAction.LOGIN]: "bg-blue-50 text-blue-700",
  [AuditAction.LOGOUT]: "bg-slate-100 text-slate-600",
  [AuditAction.CREATE]: "bg-emerald-50 text-emerald-700",
  [AuditAction.UPDATE]: "bg-amber-50 text-amber-700",
  [AuditAction.DELETE]: "bg-red-50 text-red-700",
  [AuditAction.EXPORT]: "bg-purple-50 text-purple-700",
  [AuditAction.CONFIG_CHANGE]: "bg-orange-50 text-orange-700",
  [AuditAction.PERMISSION_CHANGE]: "bg-pink-50 text-pink-700",
  [AuditAction.ACCESS_DENIED]: "bg-red-100 text-red-800",
};

function formatTs(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function isSameDay(iso: string, dateStr: string): boolean {
  return iso.slice(0, 10) === dateStr;
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AuditoriaPage() {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("__all__");
  const [resultFilter, setResultFilter] = useState("__all__");
  const [dateFrom, setDateFrom] = useState(sevenDaysAgoStr);
  const [dateTo, setDateTo] = useState(today);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return MOCK_AUDIT.filter((e) => {
      if (q && !e.username.toLowerCase().includes(q) && !e.resource.toLowerCase().includes(q) && !(e.details ?? "").toLowerCase().includes(q)) return false;
      if (actionFilter !== "__all__" && e.action !== actionFilter) return false;
      if (resultFilter !== "__all__" && e.result !== resultFilter) return false;
      const entryDate = e.timestamp.slice(0, 10);
      if (dateFrom && entryDate < dateFrom) return false;
      if (dateTo && entryDate > dateTo) return false;
      return true;
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [searchQuery, actionFilter, resultFilter, dateFrom, dateTo]);

  const todayCount = MOCK_AUDIT.filter((e) => isSameDay(e.timestamp, today)).length;
  const successCount = MOCK_AUDIT.filter((e) => isSameDay(e.timestamp, today) && e.result === AuditResult.SUCCESS).length;
  const failedCount = MOCK_AUDIT.filter((e) => isSameDay(e.timestamp, today) && e.result === AuditResult.FAILED).length;
  const uniqueUsers = new Set(MOCK_AUDIT.filter((e) => isSameDay(e.timestamp, today)).map((e) => e.username)).size;

  const handleExportCSV = () => {
    const header = "Timestamp,Usuario,Acción,Recurso,Resultado,IP,Detalles";
    const rows = filtered.map((e) =>
      [formatTs(e.timestamp), e.username, ACTION_LABEL[e.action], `${e.resource}${e.resourceId ? ` (${e.resourceId})` : ""}`, e.result, e.ipAddress, e.details ?? ""].map((v) => `"${v}"`).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `auditoria-${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Auditoría</h1>
            <p className="mt-1 text-sm text-slate-500">Registro de actividad del sistema — solo lectura</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Eventos hoy", value: todayCount, color: "text-slate-700" },
            { label: "Correctos hoy", value: successCount, color: "text-emerald-600" },
            { label: "Fallidos hoy", value: failedCount, color: "text-red-600" },
            { label: "Usuarios activos hoy", value: uniqueUsers, color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Table card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar por usuario, recurso, detalles…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Acción" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las acciones</SelectItem>
              {Object.values(AuditAction).map((a) => (
                <SelectItem key={a} value={a}>{ACTION_LABEL[a]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Resultado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              <SelectItem value={AuditResult.SUCCESS}>Correcto</SelectItem>
              <SelectItem value={AuditResult.FAILED}>Fallido</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0">Desde</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            <span className="text-xs text-slate-500 shrink-0">Hasta</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400" />
          </div>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-40">Timestamp</TableHead>
                <TableHead className="w-32">Usuario</TableHead>
                <TableHead className="w-36">Acción</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead className="hidden xl:table-cell">Detalles</TableHead>
                <TableHead className="hidden lg:table-cell w-28">IP</TableHead>
                <TableHead className="w-28 text-center">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No hay eventos en el periodo seleccionado.
                  </TableCell>
                </TableRow>
              ) : filtered.map((entry) => (
                <TableRow key={entry.id} className={`hover:bg-slate-50 ${entry.result === AuditResult.FAILED ? "bg-red-50/30" : ""}`}>
                  <TableCell className="font-mono text-xs text-slate-500">{formatTs(entry.timestamp)}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-medium text-slate-800">{entry.username}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLOR[entry.action]}`}>
                      {ACTION_LABEL[entry.action]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-700">{entry.resource}</span>
                    {entry.resourceId && (
                      <span className="ml-1 font-mono text-xs text-slate-400">({entry.resourceId})</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-slate-500 max-w-xs truncate">
                    {entry.details ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs text-slate-400">{entry.ipAddress}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={entry.result === AuditResult.SUCCESS ? "success" : "destructive"} className="text-xs">
                      {entry.result === AuditResult.SUCCESS ? "Correcto" : "Fallido"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
