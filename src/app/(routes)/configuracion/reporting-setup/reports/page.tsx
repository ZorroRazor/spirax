"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Play, Download, FileText, LayoutTemplate, CalendarDays, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Types ──────────────────────────────────────────────────────────────────────
enum ReportCategory {
  OPERATIONAL = "Operativo",
  ENERGY = "Energético",
  OF = "Órdenes de Fabricación",
  BUILDINGS = "Edificios/Oficinas",
  AUDIT = "Auditoría",
}

enum ReportType {
  DAILY_CONSUMPTION = "Consumos diarios/semanales/mensuales",
  PRODUCTION_PERIOD = "Producción por periodo",
  SHIFT_SUMMARY = "Resumen por turno",
  CONTEXT_SUMMARY = "Resumen por Contexto Operativo",
  ENERGY_CONSUMPTION = "Consumo por tipo de energía",
  SPECIFIC_CONSUMPTION = "Consumo específico",
  ENERGY_COST = "Costes energéticos",
  HISTORICAL_COMPARISON = "Comparativas históricas",
  ENERGY_KPI = "KPIs energéticos",
  OF_TOTAL = "Consumo total por OF",
  OF_ENERGY_COST = "Coste energético por OF",
  OF_KPI = "KPI por producto/receta",
  OF_COMPARISON = "Comparativa entre OF",
  LABOR_HOURS = "Consumo horario laboral vs no laboral",
  HVAC_OCCUPANCY = "HVAC con/sin ocupación",
  ZONE_COMPARISON = "Comparativa entre zonas",
  TARIFF_ANALYSIS = "Análisis por tarifas",
  ISO50001 = "ISO 50001/9001",
  DATA_TRACEABILITY = "Trazabilidad de datos",
  DATA_QUALITY = "Calidad del dato",
  CORRECTIONS = "Cambios y correcciones manuales",
}

const CATEGORY_TYPES: Record<ReportCategory, ReportType[]> = {
  [ReportCategory.OPERATIONAL]: [ReportType.DAILY_CONSUMPTION, ReportType.PRODUCTION_PERIOD, ReportType.SHIFT_SUMMARY, ReportType.CONTEXT_SUMMARY],
  [ReportCategory.ENERGY]: [ReportType.ENERGY_CONSUMPTION, ReportType.SPECIFIC_CONSUMPTION, ReportType.ENERGY_COST, ReportType.HISTORICAL_COMPARISON, ReportType.ENERGY_KPI],
  [ReportCategory.OF]: [ReportType.OF_TOTAL, ReportType.OF_ENERGY_COST, ReportType.OF_KPI, ReportType.OF_COMPARISON],
  [ReportCategory.BUILDINGS]: [ReportType.LABOR_HOURS, ReportType.HVAC_OCCUPANCY, ReportType.ZONE_COMPARISON, ReportType.TARIFF_ANALYSIS],
  [ReportCategory.AUDIT]: [ReportType.ISO50001, ReportType.DATA_TRACEABILITY, ReportType.DATA_QUALITY, ReportType.CORRECTIONS],
};

const CATEGORY_COLOR: Record<ReportCategory, string> = {
  [ReportCategory.OPERATIONAL]: "bg-blue-100 text-blue-700",
  [ReportCategory.ENERGY]: "bg-amber-100 text-amber-700",
  [ReportCategory.OF]: "bg-purple-100 text-purple-700",
  [ReportCategory.BUILDINGS]: "bg-teal-100 text-teal-700",
  [ReportCategory.AUDIT]: "bg-red-100 text-red-700",
};

enum ReportVisibility { PRIVATE = "Privada", SHARED = "Compartida", BY_ROLE = "Por rol" }

type ReportFormat = "PDF" | "Excel" | "Word";

type Report = {
  id: number;
  reportUUID: string;
  name: string;
  description: string;
  category: ReportCategory;
  type: ReportType;
  templateId: number | null;
  owner: string;
  visibility: ReportVisibility;
  formats: ReportFormat[];
  createdAt: string;
  lastGeneratedAt?: string;
};

const TEMPLATE_SECTIONS = ["Portada", "Resumen ejecutivo", "Tablas de datos", "Gráficas", "KPIs destacados", "Comentarios automáticos", "Anexos"] as const;
type TemplateSection = (typeof TEMPLATE_SECTIONS)[number];

type ReportTemplate = {
  id: number;
  name: string;
  description: string;
  sections: TemplateSection[];
  usedBy: number;
  createdAt: string;
};

enum ScheduleFrequency {
  DAILY = "Diario",
  WEEKLY = "Semanal",
  MONTHLY = "Mensual",
  PERIOD_CLOSE = "Al cierre de periodo",
  CONTEXT_CLOSE = "Al cierre de contexto",
  OF_CLOSE = "Al cierre de OF",
}

type ReportSchedule = {
  id: number;
  reportId: number;
  reportName: string;
  frequency: ScheduleFrequency;
  time: string;
  timezone: string;
  active: boolean;
  lastRun?: string;
  nextRun?: string;
};

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_TEMPLATES: ReportTemplate[] = [
  { id: 1, name: "Plantilla Energía Estándar", description: "Portada + KPIs + gráficas de consumo + tabla", sections: ["Portada", "Resumen ejecutivo", "KPIs destacados", "Gráficas", "Tablas de datos"], usedBy: 4, createdAt: "2025-09-01T08:00:00Z" },
  { id: 2, name: "Plantilla Turno Operativo", description: "Resumen de producción y consumo por turno", sections: ["Resumen ejecutivo", "Tablas de datos", "Comentarios automáticos"], usedBy: 2, createdAt: "2025-09-15T10:00:00Z" },
  { id: 3, name: "Plantilla OF Completo", description: "Informe de OF con KPIs, consumo y coste", sections: ["Portada", "Resumen ejecutivo", "KPIs destacados", "Gráficas", "Tablas de datos", "Comentarios automáticos"], usedBy: 2, createdAt: "2025-10-01T08:00:00Z" },
  { id: 4, name: "Plantilla Auditoría ISO", description: "Trazabilidad + calidad del dato + cambios", sections: ["Portada", "Resumen ejecutivo", "Tablas de datos", "Comentarios automáticos", "Anexos"], usedBy: 1, createdAt: "2025-11-01T08:00:00Z" },
];

const MOCK_REPORTS: Report[] = [
  { id: 1, reportUUID: "RPT-001", name: "Consumo Eléctrico Diario — Planta Norte", description: "Resumen diario de consumo por área", category: ReportCategory.ENERGY, type: ReportType.DAILY_CONSUMPTION, templateId: 1, owner: "admin", visibility: ReportVisibility.SHARED, formats: ["PDF", "Excel"], createdAt: "2025-09-10T08:00:00Z", lastGeneratedAt: "2026-02-17T06:05:00Z" },
  { id: 2, reportUUID: "RPT-002", name: "Informe Semanal de Producción", description: "Unidades producidas y consumo por turno semanal", category: ReportCategory.OPERATIONAL, type: ReportType.SHIFT_SUMMARY, templateId: 2, owner: "supervisor-01", visibility: ReportVisibility.SHARED, formats: ["PDF"], createdAt: "2025-10-01T08:00:00Z", lastGeneratedAt: "2026-02-16T22:00:00Z" },
  { id: 3, reportUUID: "RPT-003", name: "KPI Energético Mensual", description: "KPIs consolidados de energía del mes", category: ReportCategory.ENERGY, type: ReportType.ENERGY_KPI, templateId: 1, owner: "analista-01", visibility: ReportVisibility.BY_ROLE, formats: ["PDF", "Excel"], createdAt: "2025-10-15T10:00:00Z", lastGeneratedAt: "2026-02-01T06:00:00Z" },
  { id: 4, reportUUID: "RPT-004", name: "Informe OF — Carcasa XP-200", description: "Consumo y coste por orden de fabricación", category: ReportCategory.OF, type: ReportType.OF_TOTAL, templateId: 3, owner: "supervisor-01", visibility: ReportVisibility.SHARED, formats: ["PDF", "Excel"], createdAt: "2025-11-01T08:00:00Z", lastGeneratedAt: "2026-02-15T14:30:00Z" },
  { id: 5, reportUUID: "RPT-005", name: "Comparativa OF — Histórico", description: "Comparativa entre las últimas 5 OFs", category: ReportCategory.OF, type: ReportType.OF_COMPARISON, templateId: 3, owner: "analista-01", visibility: ReportVisibility.BY_ROLE, formats: ["Excel"], createdAt: "2025-11-15T10:00:00Z" },
  { id: 6, reportUUID: "RPT-006", name: "Consumo Horario Laboral vs No Laboral", description: "Análisis energético en horario laboral", category: ReportCategory.BUILDINGS, type: ReportType.LABOR_HOURS, templateId: 1, owner: "admin", visibility: ReportVisibility.SHARED, formats: ["PDF"], createdAt: "2025-12-01T08:00:00Z", lastGeneratedAt: "2026-02-10T07:00:00Z" },
  { id: 7, reportUUID: "RPT-007", name: "Auditoría Trazabilidad de Datos", description: "Historial de cambios manuales y correcciones", category: ReportCategory.AUDIT, type: ReportType.DATA_TRACEABILITY, templateId: 4, owner: "admin", visibility: ReportVisibility.PRIVATE, formats: ["PDF", "Excel", "Word"], createdAt: "2025-12-15T08:00:00Z" },
  { id: 8, reportUUID: "RPT-008", name: "Análisis por Tarifas Eléctricas", description: "Consumo desagregado por periodos tarifarios", category: ReportCategory.BUILDINGS, type: ReportType.TARIFF_ANALYSIS, templateId: 1, owner: "analista-01", visibility: ReportVisibility.SHARED, formats: ["PDF", "Excel"], createdAt: "2026-01-10T10:00:00Z", lastGeneratedAt: "2026-02-13T06:00:00Z" },
];

const MOCK_SCHEDULES: ReportSchedule[] = [
  { id: 1, reportId: 1, reportName: "Consumo Eléctrico Diario — Planta Norte", frequency: ScheduleFrequency.DAILY, time: "06:00", timezone: "Europe/Madrid", active: true, lastRun: "2026-02-17T06:05:00Z", nextRun: "2026-02-18T06:00:00Z" },
  { id: 2, reportId: 2, reportName: "Informe Semanal de Producción", frequency: ScheduleFrequency.WEEKLY, time: "22:00", timezone: "Europe/Madrid", active: true, lastRun: "2026-02-16T22:00:00Z", nextRun: "2026-02-23T22:00:00Z" },
  { id: 3, reportId: 3, reportName: "KPI Energético Mensual", frequency: ScheduleFrequency.MONTHLY, time: "06:00", timezone: "Europe/Madrid", active: true, lastRun: "2026-02-01T06:00:00Z", nextRun: "2026-03-01T06:00:00Z" },
  { id: 4, reportId: 4, reportName: "Informe OF — Carcasa XP-200", frequency: ScheduleFrequency.OF_CLOSE, time: "—", timezone: "Europe/Madrid", active: true, lastRun: "2026-02-15T14:30:00Z" },
  { id: 5, reportId: 6, reportName: "Consumo Horario Laboral vs No Laboral", frequency: ScheduleFrequency.WEEKLY, time: "07:00", timezone: "Europe/Madrid", active: false, lastRun: "2026-02-10T07:00:00Z" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const VISIBILITY_CONFIG: Record<ReportVisibility, { label: string; variant: "success" | "secondary" | "warning" }> = {
  [ReportVisibility.SHARED]: { label: "Compartida", variant: "success" },
  [ReportVisibility.BY_ROLE]: { label: "Por rol", variant: "warning" },
  [ReportVisibility.PRIVATE]: { label: "Privada", variant: "secondary" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Generate Dialog ────────────────────────────────────────────────────────────
function GenerateDialog({ open, report, onClose }: { open: boolean; report: Report | null; onClose: () => void }) {
  const [period, setPeriod] = useState("7d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<ReportFormat>("PDF");
  const [state, setState] = useState<"idle" | "generating" | "done">("idle");

  useEffect(() => { if (open) setState("idle"); }, [open]);

  const handleGenerate = () => {
    setState("generating");
    setTimeout(() => setState("done"), 2200);
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generar informe</DialogTitle>
          <DialogDescription>{report.name}</DialogDescription>
        </DialogHeader>

        {state === "done" ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-900">Informe generado</p>
              <p className="text-sm text-slate-500 mt-1">Listo para descargar en formato {format}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {}} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar {format}
              </Button>
              <Button variant="outline" onClick={onClose}>Cerrar</Button>
            </div>
          </div>
        ) : state === "generating" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
            <p className="text-sm text-slate-500">Generando informe…</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Periodo</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="yesterday">Ayer</SelectItem>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="month">Mes actual</SelectItem>
                    <SelectItem value="last_month">Mes anterior</SelectItem>
                    <SelectItem value="custom">Rango personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {period === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Desde</Label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <Label>Hasta</Label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400" />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <Label>Formato de salida</Label>
                <div className="flex gap-2">
                  {report.formats.map((f) => (
                    <button key={f} onClick={() => setFormat(f)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${format === f ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1">
                <p className="text-xs font-medium text-slate-600">Configuración del informe</p>
                <p className="text-xs text-slate-500">Tipo: {report.type}</p>
                <p className="text-xs text-slate-500">Propietario: {report.owner}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleGenerate} className="gap-2">
                <Play className="h-4 w-4" />
                Generar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Report Form Dialog ─────────────────────────────────────────────────────────
function ReportFormDialog({
  open, onClose, onSubmit, editingReport, templates,
}: {
  open: boolean; onClose: () => void;
  onSubmit: (r: Omit<Report, "id" | "reportUUID" | "createdAt">) => void;
  editingReport: Report | null; templates: ReportTemplate[];
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategory>(ReportCategory.ENERGY);
  const [type, setType] = useState<ReportType>(ReportType.DAILY_CONSUMPTION);
  const [templateId, setTemplateId] = useState<string>("__none__");
  const [owner, setOwner] = useState("admin");
  const [visibility, setVisibility] = useState<ReportVisibility>(ReportVisibility.SHARED);
  const [formats, setFormats] = useState<ReportFormat[]>(["PDF"]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      if (editingReport) {
        setName(editingReport.name); setDescription(editingReport.description); setCategory(editingReport.category);
        setType(editingReport.type); setTemplateId(editingReport.templateId ? String(editingReport.templateId) : "__none__");
        setOwner(editingReport.owner); setVisibility(editingReport.visibility); setFormats([...editingReport.formats]);
      } else {
        setName(""); setDescription(""); setCategory(ReportCategory.ENERGY);
        setType(ReportType.DAILY_CONSUMPTION); setTemplateId("__none__"); setOwner("admin");
        setVisibility(ReportVisibility.SHARED); setFormats(["PDF"]);
      }
    }
  }, [open, editingReport]);

  const toggleFormat = (f: ReportFormat) =>
    setFormats((p) => p.includes(f) ? p.filter((x) => x !== f) : [...p, f]);

  const handleSubmit = () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    if (formats.length === 0) { setError("Selecciona al menos un formato"); return; }
    onSubmit({
      name: name.trim(), description: description.trim(), category, type,
      templateId: templateId !== "__none__" ? Number(templateId) : null,
      owner, visibility, formats,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingReport ? "Editar informe" : "Nuevo informe"}</DialogTitle>
          <DialogDescription>Define la configuración del informe.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="space-y-1">
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Nombre del informe" />
          </div>
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción breve" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Categoría *</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v as ReportCategory); setType(CATEGORY_TYPES[v as ReportCategory][0]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ReportCategory).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES[category].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Plantilla</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin plantilla</SelectItem>
                  {templates.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Visibilidad</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as ReportVisibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ReportVisibility).map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Propietario</Label>
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="admin" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Formatos de salida *</Label>
            <div className="flex gap-2">
              {(["PDF", "Excel", "Word"] as ReportFormat[]).map((f) => (
                <button key={f} type="button" onClick={() => toggleFormat(f)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${formats.includes(f) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editingReport ? "Guardar" : "Crear informe"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Tab: Informes ──────────────────────────────────────────────────────────────
function InformesTab({ templates }: { templates: ReportTemplate[] }) {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [generateReport, setGenerateReport] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("__all__");

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return reports.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      if (categoryFilter !== "__all__" && r.category !== categoryFilter) return false;
      return true;
    });
  }, [reports, searchQuery, categoryFilter]);

  let nextId = Math.max(...reports.map((r) => r.id), 0) + 1;

  const handleAdd = (data: Omit<Report, "id" | "reportUUID" | "createdAt">) => {
    setReports((p) => [...p, { ...data, id: nextId++, reportUUID: `RPT-${String(nextId).padStart(3, "0")}`, createdAt: new Date().toISOString() }]);
  };
  const handleUpdate = (data: Omit<Report, "id" | "reportUUID" | "createdAt">) => {
    if (!editingReport) return;
    setReports((p) => p.map((r) => r.id === editingReport.id ? { ...r, ...data } : r));
    setEditingReport(null);
  };
  const handleDelete = (r: Report) => {
    if (window.confirm(`¿Eliminar "${r.name}"?`)) setReports((p) => p.filter((x) => x.id !== r.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar informes…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las categorías</SelectItem>
            {Object.values(ReportCategory).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="ml-auto" onClick={() => { setEditingReport(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Informe
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell w-32">Categoría</TableHead>
              <TableHead className="hidden lg:table-cell">Tipo</TableHead>
              <TableHead className="hidden sm:table-cell w-24">Formatos</TableHead>
              <TableHead className="hidden md:table-cell w-24">Visibilidad</TableHead>
              <TableHead className="hidden xl:table-cell">Última generación</TableHead>
              <TableHead className="text-right w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">Sin informes.</TableCell></TableRow>
            ) : filtered.map((report) => {
              const vc = VISIBILITY_CONFIG[report.visibility];
              const tmpl = templates.find((t) => t.id === report.templateId);
              return (
                <TableRow key={report.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{report.name}</p>
                      <p className="text-xs text-slate-400">{report.reportUUID}{tmpl ? ` · ${tmpl.name}` : ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLOR[report.category]}`}>{report.category}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-slate-500 max-w-[200px] truncate">{report.type}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-0.5">
                      {report.formats.map((f) => <Badge key={f} variant="secondary" className="text-[10px] px-1.5 py-0">{f}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={vc.variant} className="text-xs">{vc.label}</Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-slate-500">
                    {report.lastGeneratedAt ? formatDate(report.lastGeneratedAt) : <span className="text-slate-300">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => setGenerateReport(report)} title="Generar">
                        <Play className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => { setEditingReport(report); setIsFormOpen(true); }} title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={() => handleDelete(report)} title="Eliminar">
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

      <ReportFormDialog open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingReport(null); }}
        onSubmit={(d) => { editingReport ? handleUpdate(d) : handleAdd(d); }}
        editingReport={editingReport} templates={templates} />
      <GenerateDialog open={!!generateReport} report={generateReport} onClose={() => setGenerateReport(null)} />
    </div>
  );
}

// ── Tab: Plantillas ────────────────────────────────────────────────────────────
function PlantillasTab({
  templates, setTemplates,
}: {
  templates: ReportTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<ReportTemplate[]>>;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<ReportTemplate | null>(null);
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [tplSections, setTplSections] = useState<TemplateSection[]>([]);

  useEffect(() => {
    if (isFormOpen) {
      if (editingTpl) {
        setTplName(editingTpl.name); setTplDesc(editingTpl.description); setTplSections([...editingTpl.sections]);
      } else {
        setTplName(""); setTplDesc(""); setTplSections(["Portada", "Resumen ejecutivo"]);
      }
    }
  }, [isFormOpen, editingTpl]);

  const toggleSection = (s: TemplateSection) =>
    setTplSections((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  const handleSubmit = () => {
    if (!tplName.trim()) return;
    if (editingTpl) {
      setTemplates((p) => p.map((t) => t.id === editingTpl.id ? { ...t, name: tplName.trim(), description: tplDesc.trim(), sections: tplSections } : t));
    } else {
      const newId = Math.max(...templates.map((t) => t.id), 0) + 1;
      setTemplates((p) => [...p, { id: newId, name: tplName.trim(), description: tplDesc.trim(), sections: tplSections, usedBy: 0, createdAt: new Date().toISOString() }]);
    }
    setIsFormOpen(false); setEditingTpl(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Las plantillas definen la estructura reutilizable de los informes: secciones, componentes y estilo.</p>
        <Button size="sm" onClick={() => { setEditingTpl(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Nueva plantilla
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <LayoutTemplate className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{tpl.name}</p>
                  <p className="text-xs text-slate-500">{tpl.description}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon-xs" onClick={() => { setEditingTpl(tpl); setIsFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon-xs" className="hover:text-red-600"
                  onClick={() => { if (window.confirm(`¿Eliminar "${tpl.name}"?`)) setTemplates((p) => p.filter((t) => t.id !== tpl.id)); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {tpl.sections.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
            </div>
            <p className="text-xs text-slate-400">Usada en {tpl.usedBy} informe{tpl.usedBy !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(v) => { if (!v) { setIsFormOpen(false); setEditingTpl(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTpl ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Nombre de la plantilla" />
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Input value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} placeholder="Descripción breve" />
            </div>
            <div className="space-y-2">
              <Label>Secciones del documento</Label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_SECTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 select-none">
                    <Checkbox checked={tplSections.includes(s)} onCheckedChange={() => toggleSection(s)} />
                    <span className="text-sm text-slate-700">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsFormOpen(false); setEditingTpl(null); }}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingTpl ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Tab: Programaciones ────────────────────────────────────────────────────────
function ProgramacionesTab() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>(MOCK_SCHEDULES);

  const toggleActive = (id: number) =>
    setSchedules((p) => p.map((s) => s.id === id ? { ...s, active: !s.active } : s));

  const deleteSchedule = (id: number) => {
    if (window.confirm("¿Eliminar esta programación?")) setSchedules((p) => p.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Configura la generación automática de informes según frecuencia, hora y zona horaria.</p>
        <Button size="sm">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Nueva programación
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Informe</TableHead>
              <TableHead className="w-44">Frecuencia</TableHead>
              <TableHead className="hidden md:table-cell w-20 text-center">Hora</TableHead>
              <TableHead className="hidden lg:table-cell">Zona horaria</TableHead>
              <TableHead className="hidden lg:table-cell">Última ejecución</TableHead>
              <TableHead className="hidden xl:table-cell">Próxima ejecución</TableHead>
              <TableHead className="w-20 text-center">Activa</TableHead>
              <TableHead className="text-right w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((s) => (
              <TableRow key={s.id} className={`hover:bg-slate-50 ${!s.active ? "opacity-60" : ""}`}>
                <TableCell>
                  <p className="text-sm font-medium text-slate-900 truncate max-w-[220px]">{s.reportName}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700">{s.frequency}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-center font-mono text-sm">{s.time}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-slate-500">{s.timezone}</TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-slate-500">{s.lastRun ? formatDate(s.lastRun) : "—"}</TableCell>
                <TableCell className="hidden xl:table-cell text-xs text-slate-500">{s.nextRun ? formatDate(s.nextRun) : "—"}</TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={s.active} onCheckedChange={() => toggleActive(s.id)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-xs"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={() => deleteSchedule(s.id)}>
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

// ── Main page ──────────────────────────────────────────────────────────────────
const TABS = ["Informes", "Plantillas", "Programaciones"] as const;
type TabId = (typeof TABS)[number];

const TAB_ICON: Record<TabId, React.ReactNode> = {
  Informes: <FileText className="h-4 w-4" />,
  Plantillas: <LayoutTemplate className="h-4 w-4" />,
  Programaciones: <CalendarDays className="h-4 w-4" />,
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("Informes");
  const [templates, setTemplates] = useState<ReportTemplate[]>(MOCK_TEMPLATES);

  const totalScheduled = MOCK_SCHEDULES.filter((s) => s.active).length;

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Informes</h1>
            <p className="mt-1 text-sm text-slate-500">
              Genera y programa informes operativos, energéticos, de OF y auditoría en PDF, Excel o Word.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Informes definidos", value: MOCK_REPORTS.length, color: "text-slate-700" },
            { label: "Plantillas", value: templates.length, color: "text-blue-600" },
            { label: "Programaciones activas", value: totalScheduled, color: "text-emerald-600" },
            { label: "Categorías", value: Object.keys(ReportCategory).length, color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200 px-4">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {TAB_ICON[tab]}{tab}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === "Informes" && <InformesTab templates={templates} />}
          {activeTab === "Plantillas" && <PlantillasTab templates={templates} setTemplates={setTemplates} />}
          {activeTab === "Programaciones" && <ProgramacionesTab />}
        </div>
      </div>
    </section>
  );
}
