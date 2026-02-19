"use client";

import { useState, useEffect, useRef } from "react";
import { Settings2, GitBranch, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HierarchyTreeSelector } from "../../../tags-fisicos/components/HierarchyTreeSelector/HierarchyTreeSelector";
import { HierarchyManagerDialog } from "../../../tags-fisicos/components/HierarchyManagerDialog/HierarchyManagerDialog";
import { ManageListDialog } from "../../../tags-fisicos/components/ManageListDialog/ManageListDialog";
import {
  KpiPeriod,
  KpiDirection,
  KpiFunction,
  type AssetHierarchy,
  type KpiThresholds,
} from "../../types/kpi.types";
import type { KpiFormDialogProps } from "./KpiFormDialog.types";

type TabId = "basico" | "formula" | "objetivos";
type FormulaMode = "libre" | "predefinida";

const TABS: { id: TabId; label: string }[] = [
  { id: "basico", label: "Básico" },
  { id: "formula", label: "Fórmula" },
  { id: "objetivos", label: "Objetivos" },
];

const EMPTY_HIERARCHY: AssetHierarchy = { planta: "", area: "", seccion: "", equipo: "" };

const OPERATORS = ["+", "-", "*", "/", "(", ")", "AND", "OR", "NOT", "<", ">", "==", "!=", "IF", "WHERE"];

// ── Predefined KPI functions ───────────────────────────────────────────────────
type KpiFnDef = {
  fn: KpiFunction;
  params: { key: string; label: string; type: "tag" | "number"; placeholder?: string }[];
  template: (args: Record<string, string>) => string;
  description: string;
  resultUnit: string;
};

const KPI_FUNCTIONS: KpiFnDef[] = [
  {
    fn: KpiFunction.SPECIFIC_CONSUMPTION,
    params: [
      { key: "energy", label: "Tag energía (kWh)", type: "tag", placeholder: "Ej: E-KW-TOTAL" },
      { key: "production", label: "Tag producción (ud)", type: "tag", placeholder: "Ej: DB-PROD-UNITS" },
    ],
    template: ({ energy, production }) =>
      `TOTALIZE({${energy}}) / {${production}}`,
    description: "Consumo de energía por unidad producida",
    resultUnit: "kWh/ud",
  },
  {
    fn: KpiFunction.EFFICIENCY,
    params: [
      { key: "output", label: "Tag producción real (ud)", type: "tag", placeholder: "Ej: DB-PROD-UNITS" },
      { key: "target", label: "Objetivo (ud)", type: "number", placeholder: "Ej: 1000" },
    ],
    template: ({ output, target }) =>
      `EFFICIENCY({${output}}, ${target})`,
    description: "Ratio de producción real vs objetivo × 100",
    resultUnit: "%",
  },
  {
    fn: KpiFunction.AVAILABILITY,
    params: [
      { key: "machine", label: "Tag estado máquina (bool)", type: "tag", placeholder: "Ej: PLC-STATUS" },
      { key: "period_ms", label: "Periodo (ms)", type: "number", placeholder: "Ej: 86400000" },
    ],
    template: ({ machine, period_ms }) =>
      `AVAILABILITY({${machine}}, ${period_ms})`,
    description: "Tiempo activo / periodo total × 100",
    resultUnit: "%",
  },
  {
    fn: KpiFunction.ENERGY_COST,
    params: [
      { key: "energy", label: "Tag energía (kWh)", type: "tag", placeholder: "Ej: E-KW-TOTAL" },
      { key: "price", label: "Precio (€/kWh)", type: "number", placeholder: "Ej: 0.12" },
    ],
    template: ({ energy, price }) =>
      `TOTALIZE({${energy}}) * ${price}`,
    description: "Coste total = energía acumulada × precio unitario",
    resultUnit: "€",
  },
  {
    fn: KpiFunction.DEVIATION_BASELINE,
    params: [
      { key: "value", label: "Tag valor actual", type: "tag", placeholder: "Ej: E-KW-TOTAL" },
      { key: "baseline", label: "Baseline de referencia", type: "number", placeholder: "Ej: 280" },
    ],
    template: ({ value, baseline }) =>
      `DEVIATION_BASELINE({${value}}, ${baseline})`,
    description: "(valor − baseline) / baseline × 100",
    resultUnit: "%",
  },
  {
    fn: KpiFunction.OFF_HOURS_CONSUMPTION,
    params: [
      { key: "energy", label: "Tag energía (kWh)", type: "tag", placeholder: "Ej: E-KW-TOTAL" },
    ],
    template: ({ energy }) =>
      `OFF_HOURS_CONSUMPTION({${energy}})`,
    description: "TOTALIZE(energía) WHERE Context = NoLaboral",
    resultUnit: "kWh",
  },
];

// ── Formula validation ─────────────────────────────────────────────────────────
function validateFormulaSyntax(formula: string): string | null {
  if (!formula.trim()) return "La fórmula no puede estar vacía";

  let depth = 0;
  for (const ch of formula) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth < 0) return "Paréntesis no balanceados";
  }
  if (depth !== 0) return "Paréntesis no balanceados";

  const tagNamePattern = /^\{[A-Za-z0-9_\-\.]+\}$/;
  const braceContent = formula.match(/\{[^}]*\}/g) ?? [];
  for (const ref of braceContent) {
    if (!tagNamePattern.test(ref)) {
      return `Referencia inválida: ${ref}. Usa el buscador para insertar tags.`;
    }
  }
  return null;
}

// ── Period groups ──────────────────────────────────────────────────────────────
const TEMPORAL_PERIODS = [
  KpiPeriod.MINUTO,
  KpiPeriod.HORA,
  KpiPeriod.DIA,
  KpiPeriod.SEMANA,
  KpiPeriod.MES,
  KpiPeriod.PERSONALIZADO,
];
const OPERATIVE_PERIODS = [
  KpiPeriod.TURNO,
  KpiPeriod.ORDEN_FABRICACION,
  KpiPeriod.LOTE,
  KpiPeriod.CONTEXTO,
];

// Periods that allow selecting a specific operating context
const CONTEXT_PERIODS = new Set<KpiPeriod>([
  KpiPeriod.TURNO,
  KpiPeriod.ORDEN_FABRICACION,
  KpiPeriod.LOTE,
  KpiPeriod.CONTEXTO,
]);

// ── Mock operating contexts (mirrors configuracion/estructura/contextos) ────────
type ContextOption = { id: string; label: string; type: string; status: "Activo" | "Planificado" | "Cerrado" };
const OPERATING_CONTEXTS: ContextOption[] = [
  { id: "ctx-001", label: "Turno M – Semana 07/2025",          type: "Turno",              status: "Activo"      },
  { id: "ctx-002", label: "Turno T – Semana 07/2025",          type: "Turno",              status: "Activo"      },
  { id: "ctx-003", label: "Turno N – Semana 07/2025",          type: "Turno",              status: "Planificado" },
  { id: "ctx-004", label: "OF-2025-0042 – Producto A Lote 3",  type: "Orden de Fabricación", status: "Activo"    },
  { id: "ctx-005", label: "OF-2025-0041 – Producto B Lote 1",  type: "Orden de Fabricación", status: "Cerrado"   },
  { id: "ctx-006", label: "Lote 2025-03-A – Línea 1",          type: "Lote",               status: "Activo"      },
  { id: "ctx-007", label: "Lote 2025-02-B – Línea 2",          type: "Lote",               status: "Cerrado"     },
  { id: "ctx-008", label: "Mantenimiento preventivo Q1",        type: "Mantenimiento",      status: "Planificado" },
  { id: "ctx-009", label: "Periodo de pruebas línea 3",        type: "Proyecto",           status: "Activo"      },
  { id: "ctx-010", label: "Parada técnica anual 2025",         type: "Parada técnica",     status: "Planificado" },
];

// ── Main component ─────────────────────────────────────────────────────────────
export function KpiFormDialog({
  open,
  onClose,
  onSubmit,
  editingKpi,
  existingKpis,
  allTags,
  hierarchyData,
  onHierarchyChange,
  categories,
  onCategoriesChange,
  units,
  onUnitsChange,
}: KpiFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("basico");

  // ── Tab 1: Básico ─────────────────────────────────────────────────────────
  const [enable, setEnable] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hierarchy, setHierarchy] = useState<AssetHierarchy>(EMPTY_HIERARCHY);
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [period, setPeriod] = useState<KpiPeriod>(KpiPeriod.DIA);
  const [contextRef, setContextRef] = useState<string>("");

  // ── Tab 2: Fórmula ────────────────────────────────────────────────────────
  const [formulaMode, setFormulaMode] = useState<FormulaMode>("libre");
  const [formula, setFormula] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [validationResult, setValidationResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showFunctions, setShowFunctions] = useState(false);
  const formulaRef = useRef<HTMLTextAreaElement>(null);

  // Predefined function state
  const [selectedKpiFn, setSelectedKpiFn] = useState<KpiFunction>(KpiFunction.SPECIFIC_CONSUMPTION);
  const [fnParams, setFnParams] = useState<Record<string, string>>({});

  // ── Tab 3: Objetivos ──────────────────────────────────────────────────────
  const [direction, setDirection] = useState<KpiDirection>(KpiDirection.LOWER);
  const [target, setTarget] = useState<number | "">("");
  const [warningLow, setWarningLow] = useState<number | "">("");
  const [warningHigh, setWarningHigh] = useState<number | "">("");
  const [criticalLow, setCriticalLow] = useState<number | "">("");
  const [criticalHigh, setCriticalHigh] = useState<number | "">("");

  // ── Manage dialogs ────────────────────────────────────────────────────────
  const [manageCategories, setManageCategories] = useState(false);
  const [manageUnits, setManageUnits] = useState(false);
  const [manageHierarchy, setManageHierarchy] = useState(false);

  // ── Errors ────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Load existing KPI ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setActiveTab("basico");
    setErrors({});
    setValidationResult(null);
    setTagSearch("");
    setFnParams({});
    setFormulaMode("libre");

    if (editingKpi) {
      setEnable(editingKpi.enable);
      setName(editingKpi.name);
      setDescription(editingKpi.description ?? "");
      setHierarchy(editingKpi.hierarchy);
      setCategory(editingKpi.category ?? "");
      setUnit(editingKpi.unit ?? "");
      setPeriod(editingKpi.period);
      setContextRef(editingKpi.contextRef ?? "");
      setFormula(editingKpi.formula);

      const th = editingKpi.thresholds;
      if (th) {
        setDirection(th.direction);
        setTarget(th.target ?? "");
        setWarningLow(th.warningLow ?? "");
        setWarningHigh(th.warningHigh ?? "");
        setCriticalLow(th.criticalLow ?? "");
        setCriticalHigh(th.criticalHigh ?? "");
      } else {
        setDirection(KpiDirection.LOWER);
        setTarget(""); setWarningLow(""); setWarningHigh("");
        setCriticalLow(""); setCriticalHigh("");
      }
    } else {
      setEnable(true);
      setName(""); setDescription("");
      setHierarchy(EMPTY_HIERARCHY);
      setCategory(""); setUnit("");
      setPeriod(KpiPeriod.DIA);
      setContextRef("");
      setFormula("");
      setDirection(KpiDirection.LOWER);
      setTarget(""); setWarningLow(""); setWarningHigh("");
      setCriticalLow(""); setCriticalHigh("");
    }
  }, [editingKpi, open]);

  // ── Insert at cursor ──────────────────────────────────────────────────────
  const insertAtCursor = (text: string) => {
    const ta = formulaRef.current;
    if (!ta) { setFormula((f) => f + text); return; }
    const start = ta.selectionStart ?? formula.length;
    const end = ta.selectionEnd ?? formula.length;
    const next = formula.slice(0, start) + text + formula.slice(end);
    setFormula(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // ── Tag search ────────────────────────────────────────────────────────────
  const filteredTags = allTags
    .filter((t) =>
      t.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(tagSearch.toLowerCase())
    )
    .slice(0, 8);

  // ── Build predefined formula ──────────────────────────────────────────────
  const currentFnDef = KPI_FUNCTIONS.find((f) => f.fn === selectedKpiFn)!;
  const handleApplyPredefined = () => {
    const generated = currentFnDef.template(fnParams);
    setFormula(generated);
    setFormulaMode("libre");
    setValidationResult(null);
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const handleValidate = () => {
    const err = validateFormulaSyntax(formula);
    setValidationResult(err
      ? { ok: false, message: err }
      : { ok: true, message: "Fórmula válida — sintaxis correcta" }
    );
  };

  // ── Form validation ───────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    } else {
      const dup = existingKpis.find((k) => k.name === name.trim() && k.id !== editingKpi?.id);
      if (dup) newErrors.name = "Ya existe un KPI con ese nombre";
    }

    if (!formula.trim()) {
      newErrors.formula = "La fórmula es obligatoria";
    }

    setErrors(newErrors);
    if (newErrors.name) setActiveTab("basico");
    else if (newErrors.formula) setActiveTab("formula");
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const thresholds: KpiThresholds | undefined =
      target !== "" || warningLow !== "" || warningHigh !== "" ||
      criticalLow !== "" || criticalHigh !== ""
        ? {
            direction,
            target: target !== "" ? Number(target) : undefined,
            warningLow: warningLow !== "" ? Number(warningLow) : undefined,
            warningHigh: warningHigh !== "" ? Number(warningHigh) : undefined,
            criticalLow: criticalLow !== "" ? Number(criticalLow) : undefined,
            criticalHigh: criticalHigh !== "" ? Number(criticalHigh) : undefined,
          }
        : undefined;

    onSubmit({
      enable,
      name: name.trim(),
      description: description.trim() || undefined,
      hierarchy,
      category: category || undefined,
      unit: unit || undefined,
      period,
      contextRef: CONTEXT_PERIODS.has(period) && contextRef ? contextRef : undefined,
      formula: formula.trim(),
      thresholds,
    });
    onClose();
  };

  const isEdit = !!editingKpi;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          key={editingKpi?.id ?? "new"}
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {isEdit ? `Editar KPI: ${editingKpi.name}` : "Nuevo KPI"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Modifica la configuración del KPI"
                : "Define un indicador de rendimiento con fórmula, periodo y umbrales"}
            </DialogDescription>
          </DialogHeader>

          {/* Tab navigation */}
          <div className="flex gap-1 border-b border-slate-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {tab.id === "formula" && errors.formula && (
                  <span className="ml-1 text-red-500">•</span>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">

              {/* ── Tab 1: Básico ─────────────────────────────────────── */}
              {activeTab === "basico" && (
                <div className="space-y-4">
                  {isEdit && (
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">KPIUUID (solo lectura)</Label>
                      <p className="font-mono text-xs text-slate-600 bg-slate-50 rounded px-3 py-2 border">
                        {editingKpi.kpiUUID}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox id="enable" checked={enable} onCheckedChange={(c) => setEnable(c as boolean)} />
                    <Label htmlFor="enable">Habilitar KPI</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kpiName">KPI Name *</Label>
                    <Input
                      id="kpiName"
                      placeholder="Ej: KPI-CONS-ESPECIFICO-L1"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      rows={2}
                      placeholder="Descripción funcional del KPI"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Hierarchy */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium leading-none">Jerarquía de Activos</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        title="Gestionar jerarquía"
                        onClick={() => setManageHierarchy(true)}
                      >
                        <GitBranch className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <HierarchyTreeSelector
                      value={hierarchy}
                      onChange={setHierarchy}
                      hierarchyData={hierarchyData}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Categoría */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Categoría</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          title="Gestionar categorías"
                          onClick={() => setManageCategories(true)}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Select
                        value={category || "__none__"}
                        onValueChange={(v) => setCategory(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Ninguna —</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Unidad */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Unidad</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          title="Gestionar unidades"
                          onClick={() => setManageUnits(true)}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Select
                        value={unit || "__none__"}
                        onValueChange={(v) => setUnit(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Ninguna —</SelectItem>
                          {units.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Periodo */}
                  <div className="space-y-2">
                    <Label>Periodo de evaluación *</Label>
                    <Select
                      value={period}
                      onValueChange={(v) => {
                        setPeriod(v as KpiPeriod);
                        // Clear context ref when switching to a non-operative period
                        if (!CONTEXT_PERIODS.has(v as KpiPeriod)) setContextRef("");
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__sep_temporal__" disabled className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
                          — Temporales —
                        </SelectItem>
                        {TEMPORAL_PERIODS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                        <SelectItem value="__sep_operative__" disabled className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
                          — Operativos —
                        </SelectItem>
                        {OPERATIVE_PERIODS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Context picker — shown only for operative periods */}
                  {CONTEXT_PERIODS.has(period) && (
                    <div className="space-y-2">
                      <Label>Contexto operativo</Label>
                      <Select
                        value={contextRef || "__none__"}
                        onValueChange={(v) => setContextRef(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un contexto…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Cualquier contexto activo —</SelectItem>
                          {OPERATING_CONTEXTS.map((ctx) => (
                            <SelectItem key={ctx.id} value={ctx.id}>
                              <span className="flex items-center gap-2">
                                <span
                                  className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                                    ctx.status === "Activo"      ? "bg-emerald-500" :
                                    ctx.status === "Planificado" ? "bg-amber-500"   : "bg-zinc-400"
                                  }`}
                                />
                                {ctx.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Opcional. El KPI se calculará sobre el contexto seleccionado.
                        ● Activo · ● Planificado · ● Cerrado
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 2: Fórmula ─────────────────────────────────────── */}
              {activeTab === "formula" && (
                <div className="space-y-4">
                  {/* Quality note */}
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <strong>Propagación de calidad:</strong> Calidad Bad en entradas → KPI Bad.
                    Huecos de datos → KPI Uncertain. QualitySource = KPI.
                  </div>

                  {/* Formula mode toggle */}
                  <div className="flex gap-1 rounded-lg border border-slate-200 p-1 w-fit">
                    {(["libre", "predefinida"] as FormulaMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => { setFormulaMode(mode); setValidationResult(null); }}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                          formulaMode === mode
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {mode === "libre" ? "Fórmula libre" : "Función predefinida"}
                      </button>
                    ))}
                  </div>

                  {/* ── Predefined function mode ──────────────────────── */}
                  {formulaMode === "predefinida" && (
                    <div className="space-y-4 rounded-md border border-slate-200 p-4">
                      <div className="space-y-2">
                        <Label>Función KPI *</Label>
                        <Select
                          value={selectedKpiFn}
                          onValueChange={(v) => {
                            setSelectedKpiFn(v as KpiFunction);
                            setFnParams({});
                          }}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {KPI_FUNCTIONS.map((f) => (
                              <SelectItem key={f.fn} value={f.fn}>{f.fn}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">{currentFnDef.description}</p>
                        <p className="text-xs text-slate-500">
                          Resultado esperado: <strong>{currentFnDef.resultUnit}</strong>
                        </p>
                      </div>

                      {/* Dynamic param inputs */}
                      <div className="space-y-3">
                        {currentFnDef.params.map((param) => (
                          <div key={param.key} className="space-y-1">
                            <Label className="text-xs">{param.label}</Label>
                            <Input
                              placeholder={param.placeholder}
                              value={fnParams[param.key] ?? ""}
                              onChange={(e) =>
                                setFnParams((prev) => ({ ...prev, [param.key]: e.target.value }))
                              }
                            />
                            {param.type === "tag" && (
                              <p className="text-[10px] text-slate-400">
                                Introduce el nombre exacto del tag (sin llaves)
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Preview */}
                      {currentFnDef.params.every((p) => fnParams[p.key]) && (
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-xs font-medium text-slate-500 mb-1">Vista previa:</p>
                          <p className="font-mono text-xs text-slate-700">
                            {currentFnDef.template(fnParams)}
                          </p>
                        </div>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyPredefined}
                        disabled={!currentFnDef.params.every((p) => fnParams[p.key])}
                      >
                        Aplicar fórmula
                      </Button>
                    </div>
                  )}

                  {/* ── Free formula mode ─────────────────────────────── */}
                  {formulaMode === "libre" && (
                    <>
                      {/* Tag search */}
                      <div className="space-y-2">
                        <Label>Buscar tag para insertar referencia</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            placeholder="Buscar tag por nombre…"
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        {tagSearch && (
                          <div className="rounded-md border border-slate-200 bg-white shadow-sm max-h-40 overflow-y-auto">
                            {filteredTags.length === 0 ? (
                              <p className="px-3 py-2 text-xs text-slate-500">Sin resultados</p>
                            ) : (
                              filteredTags.map((t) => (
                                <button
                                  key={t.name}
                                  type="button"
                                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                  onClick={() => {
                                    insertAtCursor(`{${t.name}}`);
                                    setTagSearch("");
                                  }}
                                >
                                  <span>
                                    <span className="font-medium text-slate-800">{t.name}</span>
                                    {t.engUnit && (
                                      <span className="ml-1 text-slate-500">({t.engUnit})</span>
                                    )}
                                  </span>
                                  {t.description && (
                                    <span className="text-slate-400 text-[10px] truncate max-w-[180px]">
                                      {t.description}
                                    </span>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Operators */}
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Operadores</Label>
                        <div className="flex flex-wrap gap-1">
                          {OPERATORS.map((op) => (
                            <button
                              key={op}
                              type="button"
                              onClick={() => insertAtCursor(` ${op} `)}
                              className="px-2 py-0.5 text-xs rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-mono"
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Formula textarea */}
                      <div className="space-y-2">
                        <Label htmlFor="formula">Expresión *</Label>
                        <Textarea
                          id="formula"
                          ref={formulaRef}
                          rows={5}
                          placeholder={
                            `Ej: TOTALIZE({E-KW-TOTAL}) / {DB-PROD-UNITS}\n` +
                            `Ej: EFFICIENCY({DB-PROD-UNITS}, 1000)\n` +
                            `Ej: TOTALIZE({E-KW-TOTAL}) * 0.12`
                          }
                          value={formula}
                          onChange={(e) => {
                            setFormula(e.target.value);
                            setValidationResult(null);
                          }}
                          className={`font-mono text-xs ${errors.formula ? "border-red-500" : ""}`}
                        />
                        {errors.formula && <p className="text-xs text-red-500">{errors.formula}</p>}
                        <p className="text-xs text-slate-500">
                          Referencia a tags: <code className="bg-slate-100 px-1 rounded">{"{TAG_NAME}"}</code>.
                          Los nombres se resuelven a KPIUUID/TagUUID internamente.
                        </p>
                      </div>

                      {/* Validate */}
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" size="sm" onClick={handleValidate}>
                          Validar fórmula
                        </Button>
                        {validationResult && (
                          <span className={`text-xs font-medium ${validationResult.ok ? "text-green-700" : "text-red-600"}`}>
                            {validationResult.ok ? "✓" : "✗"} {validationResult.message}
                          </span>
                        )}
                      </div>

                      {/* KPI function reference */}
                      <div className="rounded-md border border-slate-200">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => setShowFunctions((v) => !v)}
                        >
                          Funciones KPI predefinidas
                          {showFunctions
                            ? <ChevronDown className="h-4 w-4 text-slate-400" />
                            : <ChevronRight className="h-4 w-4 text-slate-400" />
                          }
                        </button>
                        {showFunctions && (
                          <div className="border-t border-slate-200 divide-y divide-slate-100 max-h-56 overflow-y-auto">
                            {KPI_FUNCTIONS.map((fn) => (
                              <div key={fn.fn} className="px-3 py-2 flex items-start gap-3">
                                <button
                                  type="button"
                                  className="shrink-0 font-mono text-xs text-blue-700 hover:underline whitespace-nowrap"
                                  title="Insertar nombre de función"
                                  onClick={() => insertAtCursor(fn.fn.toUpperCase().replace(/ /g, "_") + "(")}
                                >
                                  {fn.fn}
                                </button>
                                <div className="min-w-0">
                                  <p className="text-xs text-slate-500">{fn.description}</p>
                                  <p className="text-[10px] text-slate-400">
                                    Resultado: {fn.resultUnit} · Parámetros: {fn.params.map((p) => p.label).join(", ")}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Tab 3: Objetivos ────────────────────────────────────── */}
              {activeTab === "objetivos" && (
                <div className="space-y-4">
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Los umbrales se evalúan con el último valor calculado del KPI para determinar el estado semafórico (🟢 Verde / 🟡 Ámbar / 🔴 Rojo).
                  </div>

                  {/* Direction */}
                  <div className="space-y-2">
                    <Label>Dirección *</Label>
                    <Select
                      value={direction}
                      onValueChange={(v) => setDirection(v as KpiDirection)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.values(KpiDirection).map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Indica si un valor más alto, más bajo o dentro de rango es mejor.
                    </p>
                  </div>

                  {/* Target */}
                  <div className="space-y-2">
                    <Label htmlFor="target">Objetivo (Target)</Label>
                    <Input
                      id="target"
                      type="number"
                      placeholder="Valor objetivo"
                      value={target}
                      onChange={(e) => setTarget(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>

                  {/* Warning thresholds */}
                  <div className="space-y-2">
                    <Label className="text-amber-700">Umbrales Ámbar (Warning)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="warningLow" className="text-xs text-slate-500">Warning Low</Label>
                        <Input
                          id="warningLow"
                          type="number"
                          placeholder="Límite inferior ámbar"
                          value={warningLow}
                          onChange={(e) => setWarningLow(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="warningHigh" className="text-xs text-slate-500">Warning High</Label>
                        <Input
                          id="warningHigh"
                          type="number"
                          placeholder="Límite superior ámbar"
                          value={warningHigh}
                          onChange={(e) => setWarningHigh(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Critical thresholds */}
                  <div className="space-y-2">
                    <Label className="text-red-700">Umbrales Rojo (Critical)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="criticalLow" className="text-xs text-slate-500">Critical Low</Label>
                        <Input
                          id="criticalLow"
                          type="number"
                          placeholder="Límite inferior crítico"
                          value={criticalLow}
                          onChange={(e) => setCriticalLow(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="criticalHigh" className="text-xs text-slate-500">Critical High</Label>
                        <Input
                          id="criticalHigh"
                          type="number"
                          placeholder="Límite superior crítico"
                          value={criticalHigh}
                          onChange={(e) => setCriticalHigh(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visual summary */}
                  {(target !== "" || warningLow !== "" || warningHigh !== "" || criticalLow !== "" || criticalHigh !== "") && (
                    <div className="rounded-md border border-slate-200 p-3 space-y-1 text-xs">
                      <p className="font-medium text-slate-700 mb-2">Resumen de umbrales</p>
                      {criticalLow !== "" && <p className="text-red-600">🔴 Critical Low: &lt; {criticalLow}{unit ? ` ${unit}` : ""}</p>}
                      {warningLow !== "" && <p className="text-amber-600">🟡 Warning Low: &lt; {warningLow}{unit ? ` ${unit}` : ""}</p>}
                      {target !== "" && <p className="text-green-700">🎯 Target: {target}{unit ? ` ${unit}` : ""}</p>}
                      {warningHigh !== "" && <p className="text-amber-600">🟡 Warning High: &gt; {warningHigh}{unit ? ` ${unit}` : ""}</p>}
                      {criticalHigh !== "" && <p className="text-red-600">🔴 Critical High: &gt; {criticalHigh}{unit ? ` ${unit}` : ""}</p>}
                      <p className="text-slate-500 mt-1">Dirección: {direction}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">{isEdit ? "Guardar cambios" : "Crear KPI"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage categories popup */}
      <ManageListDialog
        open={manageCategories}
        onClose={() => setManageCategories(false)}
        title="Gestionar Categorías"
        items={categories}
        onChange={onCategoriesChange}
      />

      {/* Manage units popup */}
      <ManageListDialog
        open={manageUnits}
        onClose={() => setManageUnits(false)}
        title="Gestionar Unidades"
        items={units}
        onChange={onUnitsChange}
      />

      {/* Manage hierarchy popup */}
      <HierarchyManagerDialog
        open={manageHierarchy}
        onClose={() => setManageHierarchy(false)}
        hierarchyData={hierarchyData}
        onChange={onHierarchyChange}
      />
    </>
  );
}
