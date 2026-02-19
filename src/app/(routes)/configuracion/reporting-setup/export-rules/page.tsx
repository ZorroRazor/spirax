"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Mail, FolderOpen, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Types ──────────────────────────────────────────────────────────────────────
enum ExportDestination { EMAIL = "Email", DIRECTORY = "Directorio", FTP = "FTP/SFTP" }
enum ExportTrigger {
  ON_SCHEDULE = "Al ejecutar programación",
  ON_DEMAND = "Solo bajo demanda",
  ON_CONTEXT_CLOSE = "Al cerrar contexto",
  ON_OF_CLOSE = "Al cerrar OF",
}

type ExportFormat = "PDF" | "Excel" | "Word";

type ExportRule = {
  id: number;
  name: string;
  reportName: string;
  trigger: ExportTrigger;
  destination: ExportDestination;
  formats: ExportFormat[];
  active: boolean;
  // Email
  recipients?: string;
  cc?: string;
  subject?: string;
  // FTP / Directory
  path?: string;
  host?: string;
  createdAt: string;
  lastExecutedAt?: string;
  executionCount: number;
};

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_RULES: ExportRule[] = [
  { id: 1, name: "Consumo Diario → Supervisores", reportName: "Consumo Eléctrico Diario — Planta Norte", trigger: ExportTrigger.ON_SCHEDULE, destination: ExportDestination.EMAIL, formats: ["PDF"], active: true, recipients: "supervisor-01@empresa.com, supervisor-02@empresa.com", cc: "admin@engyon.com", subject: "Informe diario consumo eléctrico — {{fecha}}", createdAt: "2025-09-15T08:00:00Z", lastExecutedAt: "2026-02-17T06:05:00Z", executionCount: 159 },
  { id: 2, name: "KPI Mensual → Dirección", reportName: "KPI Energético Mensual", trigger: ExportTrigger.ON_SCHEDULE, destination: ExportDestination.EMAIL, formats: ["PDF", "Excel"], active: true, recipients: "direccion@empresa.com", subject: "KPI Energía — {{mes}} {{año}}", createdAt: "2025-10-20T08:00:00Z", lastExecutedAt: "2026-02-01T06:00:00Z", executionCount: 5 },
  { id: 3, name: "OF Cerrada → Archivo Compartido", reportName: "Informe OF — Carcasa XP-200", trigger: ExportTrigger.ON_OF_CLOSE, destination: ExportDestination.DIRECTORY, formats: ["PDF", "Excel"], active: true, path: "\\\\srv-docs\\produccion\\informes-of\\", createdAt: "2025-11-05T10:00:00Z", lastExecutedAt: "2026-02-15T14:30:00Z", executionCount: 38 },
  { id: 4, name: "Semanal Producción → FTP Cliente", reportName: "Informe Semanal de Producción", trigger: ExportTrigger.ON_SCHEDULE, destination: ExportDestination.FTP, formats: ["Excel"], active: false, host: "ftp.cliente.com:21", path: "/informes/produccion/", createdAt: "2025-11-20T08:00:00Z", lastExecutedAt: "2026-02-09T22:00:00Z", executionCount: 12 },
  { id: 5, name: "Auditoría → Directorio ISO", reportName: "Auditoría Trazabilidad de Datos", trigger: ExportTrigger.ON_DEMAND, destination: ExportDestination.DIRECTORY, formats: ["PDF", "Word"], active: true, path: "C:\\Auditorias\\ISO50001\\", createdAt: "2025-12-20T08:00:00Z", lastExecutedAt: "2026-01-31T16:00:00Z", executionCount: 3 },
  { id: 6, name: "Tarifas Mensual → Analistas", reportName: "Análisis por Tarifas Eléctricas", trigger: ExportTrigger.ON_SCHEDULE, destination: ExportDestination.EMAIL, formats: ["PDF", "Excel"], active: true, recipients: "analista-01@empresa.com", subject: "Análisis tarifas {{mes}}", createdAt: "2026-01-15T10:00:00Z", lastExecutedAt: "2026-02-13T06:00:00Z", executionCount: 2 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const DEST_ICON: Record<ExportDestination, React.ReactNode> = {
  [ExportDestination.EMAIL]: <Mail className="h-4 w-4" />,
  [ExportDestination.DIRECTORY]: <FolderOpen className="h-4 w-4" />,
  [ExportDestination.FTP]: <Server className="h-4 w-4" />,
};

const DEST_COLOR: Record<ExportDestination, string> = {
  [ExportDestination.EMAIL]: "bg-blue-50 text-blue-700",
  [ExportDestination.DIRECTORY]: "bg-amber-50 text-amber-700",
  [ExportDestination.FTP]: "bg-purple-50 text-purple-700",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Export Rule Form Dialog ────────────────────────────────────────────────────
function ExportRuleFormDialog({
  open, onClose, onSubmit, editingRule,
}: {
  open: boolean; onClose: () => void;
  onSubmit: (r: Omit<ExportRule, "id" | "createdAt" | "executionCount">) => void;
  editingRule: ExportRule | null;
}) {
  const [name, setName] = useState("");
  const [reportName, setReportName] = useState("");
  const [trigger, setTrigger] = useState<ExportTrigger>(ExportTrigger.ON_SCHEDULE);
  const [destination, setDestination] = useState<ExportDestination>(ExportDestination.EMAIL);
  const [formats, setFormats] = useState<ExportFormat[]>(["PDF"]);
  const [active, setActive] = useState(true);
  // Email fields
  const [recipients, setRecipients] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  // FTP/Directory fields
  const [path, setPath] = useState("");
  const [host, setHost] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      if (editingRule) {
        setName(editingRule.name); setReportName(editingRule.reportName); setTrigger(editingRule.trigger);
        setDestination(editingRule.destination); setFormats([...editingRule.formats]); setActive(editingRule.active);
        setRecipients(editingRule.recipients ?? ""); setCc(editingRule.cc ?? ""); setSubject(editingRule.subject ?? "");
        setPath(editingRule.path ?? ""); setHost(editingRule.host ?? "");
      } else {
        setName(""); setReportName(""); setTrigger(ExportTrigger.ON_SCHEDULE);
        setDestination(ExportDestination.EMAIL); setFormats(["PDF"]); setActive(true);
        setRecipients(""); setCc(""); setSubject("{{informe}} — {{fecha}}"); setPath(""); setHost("");
      }
    }
  }, [open, editingRule]);

  const toggleFormat = (f: ExportFormat) =>
    setFormats((p) => p.includes(f) ? p.filter((x) => x !== f) : [...p, f]);

  const handleSubmit = () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    if (!reportName.trim()) { setError("El informe es obligatorio"); return; }
    if (formats.length === 0) { setError("Selecciona al menos un formato"); return; }
    onSubmit({
      name: name.trim(), reportName: reportName.trim(), trigger, destination, formats, active,
      recipients: destination === ExportDestination.EMAIL ? recipients || undefined : undefined,
      cc: destination === ExportDestination.EMAIL ? cc || undefined : undefined,
      subject: destination === ExportDestination.EMAIL ? subject || undefined : undefined,
      path: destination !== ExportDestination.EMAIL ? path || undefined : undefined,
      host: destination === ExportDestination.FTP ? host || undefined : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRule ? "Editar regla de exportación" : "Nueva regla de exportación"}</DialogTitle>
          <DialogDescription>Configura cómo y dónde se distribuye el informe generado.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-xs text-red-500 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="space-y-1">
            <Label>Nombre de la regla *</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Ej. Consumo Diario → Supervisores" />
          </div>
          <div className="space-y-1">
            <Label>Informe asociado *</Label>
            <Input value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="Nombre del informe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Disparador</Label>
              <Select value={trigger} onValueChange={(v) => setTrigger(v as ExportTrigger)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ExportTrigger).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Destino</Label>
              <Select value={destination} onValueChange={(v) => setDestination(v as ExportDestination)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ExportDestination).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Formatos *</Label>
            <div className="flex gap-2">
              {(["PDF", "Excel", "Word"] as ExportFormat[]).map((f) => (
                <button key={f} type="button" onClick={() => toggleFormat(f)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${formats.includes(f) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Email fields */}
          {destination === ExportDestination.EMAIL && (
            <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
              <p className="text-xs font-semibold text-blue-700">Configuración Email</p>
              <div className="space-y-1">
                <Label>Destinatarios (separados por coma)</Label>
                <Input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="usuario@empresa.com, otro@empresa.com" />
              </div>
              <div className="space-y-1">
                <Label>CC (opcional)</Label>
                <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@empresa.com" />
              </div>
              <div className="space-y-1">
                <Label>Asunto</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="{{informe}} — {{fecha}}" />
                <p className="text-xs text-slate-400">Variables disponibles: {"{{informe}}"}, {"{{fecha}}"}, {"{{mes}}"}, {"{{año}}"}</p>
              </div>
            </div>
          )}

          {/* Directory / FTP fields */}
          {destination !== ExportDestination.EMAIL && (
            <div className="space-y-3 rounded-lg border border-amber-100 bg-amber-50/40 p-3">
              <p className="text-xs font-semibold text-amber-700">
                Configuración {destination === ExportDestination.FTP ? "FTP/SFTP" : "Directorio"}
              </p>
              {destination === ExportDestination.FTP && (
                <div className="space-y-1">
                  <Label>Host</Label>
                  <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="ftp.servidor.com:21" />
                </div>
              )}
              <div className="space-y-1">
                <Label>Ruta de destino</Label>
                <Input value={path} onChange={(e) => setPath(e.target.value)}
                  placeholder={destination === ExportDestination.FTP ? "/informes/salida/" : "\\\\servidor\\carpeta\\"} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox checked={active} onCheckedChange={(v) => setActive(!!v)} id="active-rule" />
            <Label htmlFor="active-rule" className="cursor-pointer">Regla activa</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editingRule ? "Guardar" : "Crear regla"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ExportRulesPage() {
  const [rules, setRules] = useState<ExportRule[]>(MOCK_RULES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ExportRule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [destFilter, setDestFilter] = useState("__all__");

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return rules.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.reportName.toLowerCase().includes(q)) return false;
      if (destFilter !== "__all__" && r.destination !== destFilter) return false;
      return true;
    });
  }, [rules, searchQuery, destFilter]);

  let nextId = Math.max(...rules.map((r) => r.id), 0) + 1;

  const handleAdd = (data: Omit<ExportRule, "id" | "createdAt" | "executionCount">) => {
    setRules((p) => [...p, { ...data, id: nextId++, createdAt: new Date().toISOString(), executionCount: 0 }]);
  };
  const handleUpdate = (data: Omit<ExportRule, "id" | "createdAt" | "executionCount">) => {
    if (!editingRule) return;
    setRules((p) => p.map((r) => r.id === editingRule.id ? { ...r, ...data } : r));
    setEditingRule(null);
  };
  const handleDelete = (r: ExportRule) => {
    if (window.confirm(`¿Eliminar la regla "${r.name}"?`)) setRules((p) => p.filter((x) => x.id !== r.id));
  };
  const toggleActive = (id: number) =>
    setRules((p) => p.map((r) => r.id === id ? { ...r, active: !r.active } : r));

  const activeCount = rules.filter((r) => r.active).length;

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reglas de Exportación</h1>
            <p className="mt-1 text-sm text-slate-500">
              Distribuye automáticamente los informes generados por email, directorio compartido o FTP/SFTP.
            </p>
          </div>
          <Button onClick={() => { setEditingRule(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Regla
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Reglas totales", value: rules.length, color: "text-slate-700" },
            { label: "Activas", value: activeCount, color: "text-emerald-600" },
            { label: "Ejecuciones totales", value: rules.reduce((a, r) => a + r.executionCount, 0), color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar reglas o informes…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={destFilter} onValueChange={setDestFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Destino" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los destinos</SelectItem>
              {Object.values(ExportDestination).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Informe</TableHead>
                <TableHead className="w-36">Destino</TableHead>
                <TableHead className="hidden sm:table-cell">Disparador</TableHead>
                <TableHead className="hidden lg:table-cell">Detalles de destino</TableHead>
                <TableHead className="hidden xl:table-cell w-24 text-center">Ejecuciones</TableHead>
                <TableHead className="hidden lg:table-cell">Última ejecución</TableHead>
                <TableHead className="w-20 text-center">Activa</TableHead>
                <TableHead className="text-right w-20">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="py-12 text-center text-sm text-slate-400">Sin reglas configuradas.</TableCell></TableRow>
              ) : filtered.map((rule) => (
                <TableRow key={rule.id} className={`hover:bg-slate-50 ${!rule.active ? "opacity-60" : ""}`}>
                  <TableCell className="font-medium text-slate-900 text-sm">{rule.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-slate-500 max-w-[200px] truncate">{rule.reportName}</TableCell>
                  <TableCell>
                    <span className={`flex w-fit items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${DEST_COLOR[rule.destination]}`}>
                      {DEST_ICON[rule.destination]}
                      {rule.destination}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-slate-600">{rule.trigger}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs font-mono text-slate-500 max-w-[200px] truncate">
                    {rule.destination === ExportDestination.EMAIL ? (rule.recipients ?? "—") : (rule.path ?? rule.host ?? "—")}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-center text-sm text-slate-600">{rule.executionCount}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                    {rule.lastExecutedAt ? formatDate(rule.lastExecutedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox checked={rule.active} onCheckedChange={() => toggleActive(rule.id)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => { setEditingRule(rule); setIsFormOpen(true); }} title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={() => handleDelete(rule)} title="Eliminar">
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

      <ExportRuleFormDialog open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingRule(null); }}
        onSubmit={(d) => { editingRule ? handleUpdate(d) : handleAdd(d); }}
        editingRule={editingRule} />
    </section>
  );
}
