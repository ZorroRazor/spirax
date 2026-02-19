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
import { VirtualType, type AssetHierarchy } from "../../types/virtual-tag.types";
import type { VirtualTagFormDialogProps } from "./VirtualTagFormDialog.types";

type TabId = "definicion" | "formula";

const TABS: { id: TabId; label: string }[] = [
  { id: "definicion", label: "Definición" },
  { id: "formula", label: "Fórmula / Script" },
];

const EMPTY_HIERARCHY: AssetHierarchy = { planta: "", area: "", seccion: "", equipo: "" };

// ── Predefined functions reference ────────────────────────────────────────────
type FnDef = { name: string; signature: string; description: string };
const PREDEFINED_FUNCTIONS: FnDef[] = [
  { name: "SUM", signature: "SUM(tag1, tag2, ...)", description: "Suma de valores" },
  { name: "AVG", signature: "AVG(tag1, tag2, ...)", description: "Media aritmética" },
  { name: "MIN", signature: "MIN(tag1, tag2, ...)", description: "Valor mínimo" },
  { name: "MAX", signature: "MAX(tag1, tag2, ...)", description: "Valor máximo" },
  { name: "STDDEV", signature: "STDDEV(tag1, tag2, ...)", description: "Desviación estándar" },
  { name: "COUNT", signature: "COUNT(tag1, tag2, ...)", description: "Cuenta valores válidos" },
  { name: "TOTALIZE", signature: "TOTALIZE(tag, dt_ms)", description: "Integral acumulada en el tiempo" },
  { name: "RATE", signature: "RATE(tag, dt_ms)", description: "Tasa de cambio" },
  { name: "DIFF", signature: "DIFF(tag)", description: "Diferencia respecto al valor anterior" },
  { name: "ON_DURATION", signature: "ON_DURATION(tag, dt_ms)", description: "Tiempo que el tag está activo (1/true)" },
  { name: "OFF_DURATION", signature: "OFF_DURATION(tag, dt_ms)", description: "Tiempo que el tag está inactivo (0/false)" },
  { name: "TRANSITIONS_COUNT", signature: "TRANSITIONS_COUNT(tag)", description: "Número de transiciones 0→1 ó 1→0" },
  { name: "EFFICIENCY", signature: "EFFICIENCY(produced, target)", description: "Eficiencia = produced / target × 100" },
  { name: "SPECIFIC_CONSUMPTION", signature: "SPECIFIC_CONSUMPTION(energy, units)", description: "Consumo específico = energy / units" },
];

// ── Operator buttons ──────────────────────────────────────────────────────────
const OPERATORS = ["+", "-", "*", "/", "(", ")", "AND", "OR", "NOT", "<", ">", "==", "!=", "IF"];

// ── Basic formula validation ──────────────────────────────────────────────────
function validateFormulaSyntax(formula: string): string | null {
  if (!formula.trim()) return "La fórmula no puede estar vacía";

  // Check balanced parentheses
  let depth = 0;
  for (const ch of formula) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth < 0) return "Paréntesis no balanceados";
  }
  if (depth !== 0) return "Paréntesis no balanceados";

  // Check tag name references format: {TAG_NAME}
  const tagNamePattern = /^\{[A-Za-z0-9_\-\.]+\}$/;
  const braceContent = formula.match(/\{[^}]*\}/g) ?? [];
  for (const ref of braceContent) {
    if (!tagNamePattern.test(ref)) {
      return `Referencia inválida: ${ref}. Usa el buscador para insertar tags.`;
    }
  }

  return null; // valid
}

// ── Main component ─────────────────────────────────────────────────────────────
export function VirtualTagFormDialog({
  open,
  onClose,
  onSubmit,
  editingTag,
  existingTags,
  allPhysicalTags,
  hierarchyData,
  onHierarchyChange,
  classifications,
  onClassificationsChange,
  engUnits,
  onEngUnitsChange,
}: VirtualTagFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("definicion");

  // ── Tab 1: Definición ─────────────────────────────────────────────────────
  const [enable, setEnable] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hierarchy, setHierarchy] = useState<AssetHierarchy>(EMPTY_HIERARCHY);
  const [classification, setClassification] = useState("");
  const [engUnit, setEngUnit] = useState("");
  const [virtualType, setVirtualType] = useState<VirtualType>(VirtualType.MATEMATICO);
  const [evaluateRate, setEvaluateRate] = useState(5000);

  // ── Tab 2: Fórmula ────────────────────────────────────────────────────────
  const [formula, setFormula] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [validationResult, setValidationResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showFunctions, setShowFunctions] = useState(false);
  const formulaRef = useRef<HTMLTextAreaElement>(null);

  // ── Manage dialogs ────────────────────────────────────────────────────────
  const [manageClassifications, setManageClassifications] = useState(false);
  const [manageUnits, setManageUnits] = useState(false);
  const [manageHierarchy, setManageHierarchy] = useState(false);

  // ── Errors ────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Load existing tag ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setActiveTab("definicion");
    setErrors({});
    setValidationResult(null);
    setTagSearch("");

    if (editingTag) {
      setEnable(editingTag.enable);
      setName(editingTag.name);
      setDescription(editingTag.description ?? "");
      setHierarchy(editingTag.hierarchy);
      setClassification(editingTag.classification ?? "");
      setEngUnit(editingTag.engUnit ?? "");
      setVirtualType(editingTag.virtualType);
      setEvaluateRate(editingTag.evaluateRate);
      setFormula(editingTag.formula);
    } else {
      setEnable(true);
      setName(""); setDescription("");
      setHierarchy(EMPTY_HIERARCHY);
      setClassification(""); setEngUnit("");
      setVirtualType(VirtualType.MATEMATICO);
      setEvaluateRate(5000);
      setFormula("");
    }
  }, [editingTag, open]);

  // ── Insert text at cursor in formula textarea ─────────────────────────────
  const insertAtCursor = (text: string) => {
    const ta = formulaRef.current;
    if (!ta) {
      setFormula((f) => f + text);
      return;
    }
    const start = ta.selectionStart ?? formula.length;
    const end = ta.selectionEnd ?? formula.length;
    const newFormula = formula.slice(0, start) + text + formula.slice(end);
    setFormula(newFormula);
    // Restore cursor after inserted text
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // ── Tag search filter ─────────────────────────────────────────────────────
  const filteredPhysicalTags = allPhysicalTags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(tagSearch.toLowerCase())
  ).slice(0, 8);

  // ── Validate formula ──────────────────────────────────────────────────────
  const handleValidate = () => {
    const err = validateFormulaSyntax(formula);
    if (err) {
      setValidationResult({ ok: false, message: err });
    } else {
      setValidationResult({ ok: true, message: "Fórmula válida — sintaxis correcta" });
    }
  };

  // ── Form validation ───────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    } else {
      const dup = existingTags.find((t) => t.name === name.trim() && t.id !== editingTag?.id);
      if (dup) newErrors.name = "Ya existe un tag virtual con ese nombre";
    }

    if (evaluateRate < 100 || evaluateRate > 3600000) {
      newErrors.evaluateRate = "Debe estar entre 100 ms y 3600000 ms (1 hora)";
    }

    if (!formula.trim()) {
      newErrors.formula = "La fórmula es obligatoria";
    }

    setErrors(newErrors);

    if (newErrors.name) setActiveTab("definicion");
    else if (newErrors.evaluateRate) setActiveTab("definicion");
    else if (newErrors.formula) setActiveTab("formula");

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      enable,
      name: name.trim(),
      description: description.trim() || undefined,
      hierarchy,
      classification: classification || undefined,
      engUnit: engUnit || undefined,
      virtualType,
      evaluateRate,
      formula: formula.trim(),
    });
    onClose();
  };

  const isEdit = !!editingTag;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          key={editingTag?.id ?? "new"}
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {isEdit ? `Editar Tag Virtual: ${editingTag.name}` : "Nuevo Tag Virtual"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Modifica la definición y fórmula del tag virtual"
                : "Define un tag calculado a partir de expresiones sobre otros tags"}
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

              {/* ── Tab 1: Definición ─────────────────────────────────── */}
              {activeTab === "definicion" && (
                <div className="space-y-4">
                  {isEdit && (
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">TagUUID (solo lectura)</Label>
                      <p className="font-mono text-xs text-slate-600 bg-slate-50 rounded px-3 py-2 border">
                        {editingTag.tagUUID}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox id="enable" checked={enable} onCheckedChange={(c) => setEnable(c as boolean)} />
                    <Label htmlFor="enable">Habilitar tag</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagName">Tag Name *</Label>
                    <Input
                      id="tagName"
                      placeholder="Ej: VT-TEMP-AVG"
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
                      placeholder="Descripción funcional del tag virtual"
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
                    {/* Clasificación */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Clasificación</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          title="Gestionar clasificaciones"
                          onClick={() => setManageClassifications(true)}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Select
                        value={classification || "__none__"}
                        onValueChange={(v) => setClassification(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Ninguna —</SelectItem>
                          {classifications.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Unidades */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Unidades de ingeniería</Label>
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
                        value={engUnit || "__none__"}
                        onValueChange={(v) => setEngUnit(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Ninguna —</SelectItem>
                          {engUnits.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Virtual Type */}
                    <div className="space-y-2">
                      <Label>Tipo Virtual *</Label>
                      <Select
                        value={virtualType}
                        onValueChange={(v) => setVirtualType(v as VirtualType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(VirtualType).map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Evaluate Rate */}
                    <div className="space-y-2">
                      <Label htmlFor="evaluateRate">Evaluate Rate (ms) *</Label>
                      <Input
                        id="evaluateRate"
                        type="number"
                        min={100}
                        max={3600000}
                        value={evaluateRate}
                        onChange={(e) => setEvaluateRate(Number(e.target.value))}
                        className={errors.evaluateRate ? "border-red-500" : ""}
                      />
                      {errors.evaluateRate && (
                        <p className="text-xs text-red-500">{errors.evaluateRate}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 2: Fórmula / Script ─────────────────────────── */}
              {activeTab === "formula" && (
                <div className="space-y-4">
                  {/* Quality note */}
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <strong>Propagación de calidad:</strong> Si algún tag de entrada tiene calidad Bad, el resultado será Bad.
                    Gaps de datos o calidad Uncertain en entradas → resultado Uncertain.
                  </div>

                  {/* Tag search */}
                  <div className="space-y-2">
                    <Label>Buscar tag para insertar referencia</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Buscar tag por nombre…"
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    {tagSearch && (
                      <div className="rounded-md border border-slate-200 bg-white shadow-sm max-h-40 overflow-y-auto">
                        {filteredPhysicalTags.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-slate-500">Sin resultados</p>
                        ) : (
                          filteredPhysicalTags.map((t) => (
                            <button
                              key={t.tagUUID}
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

                  {/* Operator buttons */}
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
                      placeholder={`Ej: AVG({T-TEMP-001}, {T-TEMP-002})\nEj: {E-KW-TOTAL} * 1.05 + 10\nEj: IF({P-PRES-VAPOR} > 100, {P-PRES-VAPOR}, 0)`}
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
                      Usa el buscador para insertar referencias automáticamente. Los nombres se resuelven a UUID internamente.
                    </p>
                  </div>

                  {/* Validate button + result */}
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={handleValidate}>
                      Validar fórmula
                    </Button>
                    {validationResult && (
                      <span
                        className={`text-xs font-medium ${
                          validationResult.ok ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {validationResult.ok ? "✓" : "✗"} {validationResult.message}
                      </span>
                    )}
                  </div>

                  {/* Predefined functions reference */}
                  <div className="rounded-md border border-slate-200">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => setShowFunctions((v) => !v)}
                    >
                      Referencia de funciones predefinidas
                      {showFunctions
                        ? <ChevronDown className="h-4 w-4 text-slate-400" />
                        : <ChevronRight className="h-4 w-4 text-slate-400" />
                      }
                    </button>
                    {showFunctions && (
                      <div className="border-t border-slate-200 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                        {PREDEFINED_FUNCTIONS.map((fn) => (
                          <div key={fn.name} className="px-3 py-2 flex items-start gap-3">
                            <button
                              type="button"
                              className="shrink-0 font-mono text-xs text-blue-700 hover:underline"
                              title="Insertar nombre de función"
                              onClick={() => insertAtCursor(fn.name + "(")}
                            >
                              {fn.name}
                            </button>
                            <div className="min-w-0">
                              <p className="font-mono text-xs text-slate-600">{fn.signature}</p>
                              <p className="text-xs text-slate-500">{fn.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">{isEdit ? "Guardar cambios" : "Crear tag virtual"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage classifications popup */}
      <ManageListDialog
        open={manageClassifications}
        onClose={() => setManageClassifications(false)}
        title="Gestionar Clasificaciones"
        items={classifications}
        onChange={onClassificationsChange}
      />

      {/* Manage units popup */}
      <ManageListDialog
        open={manageUnits}
        onClose={() => setManageUnits(false)}
        title="Gestionar Unidades de Ingeniería"
        items={engUnits}
        onChange={onEngUnitsChange}
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
