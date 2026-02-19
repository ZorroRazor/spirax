"use client";

import { useState, useEffect, useRef } from "react";
import { GitBranch, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HierarchyTreeSelector } from "../../../../data-model/tags-fisicos/components/HierarchyTreeSelector/HierarchyTreeSelector";
import { HierarchyManagerDialog } from "../../../../data-model/tags-fisicos/components/HierarchyManagerDialog/HierarchyManagerDialog";
import {
  AlarmType, AlarmPriority, AlarmCategory, AlarmSourceType,
  ALARM_CHANNELS,
  type AssetHierarchy, type AlarmTemporalFilter, type AlarmNotification, type AlarmChannel,
} from "../../types/alarm.types";
import type { AlarmFormDialogProps } from "./AlarmFormDialog.types";

type TabId = "definicion" | "regla" | "notificaciones";
const TABS: { id: TabId; label: string }[] = [
  { id: "definicion", label: "Definición" },
  { id: "regla", label: "Regla de disparo" },
  { id: "notificaciones", label: "Notificaciones" },
];

const EMPTY_HIERARCHY: AssetHierarchy = { planta: "", area: "", seccion: "", equipo: "" };

const COMPARISON_OPS = [">", "<", ">=", "<=", "==", "!="];
const LOGICAL_OPS = ["AND", "OR", "NOT", "(", ")"];
const TEMPORAL_OPS = ["DURANTE", "AUSENCIA", "CONGELADO", "DELAY"];

function validateExpression(expr: string): string | null {
  if (!expr.trim()) return "La expresión no puede estar vacía";
  let depth = 0;
  for (const ch of expr) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth < 0) return "Paréntesis no balanceados";
  }
  if (depth !== 0) return "Paréntesis no balanceados";
  return null;
}

const CHANNEL_LABELS: Record<AlarmChannel, string> = {
  panel: "Panel de alarmas",
  email: "Email",
  push: "Notificación push",
  webhook: "Webhook / API externa",
};

export function AlarmFormDialog({
  open, onClose, onSubmit, editingAlarm, existingAlarms, allTags, hierarchyData, onHierarchyChange,
}: AlarmFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("definicion");

  // Tab 1
  const [enable, setEnable] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AlarmType>(AlarmType.THRESHOLD);
  const [priority, setPriority] = useState<AlarmPriority>(AlarmPriority.HIGH);
  const [category, setCategory] = useState<AlarmCategory | "">("");
  const [hierarchy, setHierarchy] = useState<AssetHierarchy>(EMPTY_HIERARCHY);

  // Tab 2
  const [sourceType, setSourceType] = useState<AlarmSourceType>(AlarmSourceType.PHYSICAL_TAG);
  const [expression, setExpression] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [validationResult, setValidationResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [minActivationMs, setMinActivationMs] = useState<number | "">("");
  const [delayMs, setDelayMs] = useState<number | "">("");
  const [rearmMs, setRearmMs] = useState<number | "">("");
  const [hysteresis, setHysteresis] = useState<number | "">("");
  const exprRef = useRef<HTMLTextAreaElement>(null);

  // Tab 3
  const [channels, setChannels] = useState<AlarmChannel[]>(["panel"]);
  const [shortMessage, setShortMessage] = useState("");
  const [detailedMessage, setDetailedMessage] = useState("");

  const [manageHierarchy, setManageHierarchy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setActiveTab("definicion");
    setErrors({});
    setValidationResult(null);
    setTagSearch("");

    if (editingAlarm) {
      setEnable(editingAlarm.enable);
      setName(editingAlarm.name);
      setDescription(editingAlarm.description ?? "");
      setType(editingAlarm.type);
      setPriority(editingAlarm.priority);
      setCategory(editingAlarm.category ?? "");
      setHierarchy(editingAlarm.hierarchy);
      setSourceType(editingAlarm.sourceType);
      setExpression(editingAlarm.expression);
      const tf = editingAlarm.temporalFilter;
      setMinActivationMs(tf?.minActivationMs ?? "");
      setDelayMs(tf?.delayMs ?? "");
      setRearmMs(tf?.rearmMs ?? "");
      setHysteresis(tf?.hysteresis ?? "");
      const n = editingAlarm.notification;
      setChannels(n?.channels ?? ["panel"]);
      setShortMessage(n?.shortMessage ?? "");
      setDetailedMessage(n?.detailedMessage ?? "");
    } else {
      setEnable(true); setName(""); setDescription("");
      setType(AlarmType.THRESHOLD); setPriority(AlarmPriority.HIGH); setCategory("");
      setHierarchy(EMPTY_HIERARCHY); setSourceType(AlarmSourceType.PHYSICAL_TAG);
      setExpression(""); setMinActivationMs(""); setDelayMs(""); setRearmMs(""); setHysteresis("");
      setChannels(["panel"]); setShortMessage(""); setDetailedMessage("");
    }
  }, [editingAlarm, open]);

  const insertAtCursor = (text: string) => {
    const ta = exprRef.current;
    if (!ta) { setExpression((e) => e + text); return; }
    const start = ta.selectionStart ?? expression.length;
    const end = ta.selectionEnd ?? expression.length;
    const next = expression.slice(0, start) + text + expression.slice(end);
    setExpression(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + text.length, start + text.length); }, 0);
  };

  const filteredTags = allTags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(tagSearch.toLowerCase())
  ).slice(0, 8);

  const toggleChannel = (ch: AlarmChannel) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 3) errs.name = "El nombre debe tener al menos 3 caracteres";
    else if (existingAlarms.find((a) => a.name === name.trim() && a.id !== editingAlarm?.id)) errs.name = "Ya existe una alarma con ese nombre";
    if (!expression.trim()) errs.expression = "La expresión de disparo es obligatoria";
    setErrors(errs);
    if (errs.name) setActiveTab("definicion");
    else if (errs.expression) setActiveTab("regla");
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const temporalFilter: AlarmTemporalFilter | undefined =
      minActivationMs !== "" || delayMs !== "" || rearmMs !== "" || hysteresis !== ""
        ? {
            minActivationMs: minActivationMs !== "" ? Number(minActivationMs) : undefined,
            delayMs: delayMs !== "" ? Number(delayMs) : undefined,
            rearmMs: rearmMs !== "" ? Number(rearmMs) : undefined,
            hysteresis: hysteresis !== "" ? Number(hysteresis) : undefined,
          }
        : undefined;

    const notification: AlarmNotification | undefined =
      channels.length > 0 || shortMessage || detailedMessage
        ? { channels, shortMessage: shortMessage || undefined, detailedMessage: detailedMessage || undefined }
        : undefined;

    onSubmit({
      enable, name: name.trim(), description: description.trim() || undefined,
      type, priority, category: category || undefined, hierarchy, sourceType,
      expression: expression.trim(), temporalFilter, notification,
    });
    onClose();
  };

  const isEdit = !!editingAlarm;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent key={editingAlarm?.id ?? "new"} className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? `Editar Alarma: ${editingAlarm.name}` : "Nueva Alarma"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Modifica la configuración de la alarma" : "Configura una nueva regla de alarma con expresión de disparo y notificaciones"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-1 border-b border-slate-200">
            {TABS.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${activeTab === tab.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                {tab.label}
                {tab.id === "regla" && errors.expression && <span className="ml-1 text-red-500">•</span>}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">

              {/* ── Tab 1: Definición ──────────────────────────────── */}
              {activeTab === "definicion" && (
                <div className="space-y-4">
                  {isEdit && (
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">AlarmID (solo lectura)</Label>
                      <p className="font-mono text-xs text-slate-600 bg-slate-50 rounded px-3 py-2 border">{editingAlarm.alarmUUID}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox id="enable" checked={enable} onCheckedChange={(c) => setEnable(c as boolean)} />
                    <Label htmlFor="enable">Habilitar alarma</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alarmName">Nombre *</Label>
                    <Input id="alarmName" placeholder="Ej: ALM-KW-PICO" value={name} onChange={(e) => setName(e.target.value)} className={errors.name ? "border-red-500" : ""} />
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="desc">Descripción</Label>
                    <Textarea id="desc" rows={2} placeholder="Descripción funcional de la alarma" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select value={type} onValueChange={(v) => setType(v as AlarmType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.values(AlarmType).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridad *</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as AlarmPriority)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.values(AlarmPriority).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select value={category || "__none__"} onValueChange={(v) => setCategory(v === "__none__" ? "" : v as AlarmCategory)}>
                        <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Ninguna —</SelectItem>
                          {Object.values(AlarmCategory).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium leading-none">Jerarquía de activos (opcional)</span>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => setManageHierarchy(true)} title="Gestionar jerarquía">
                        <GitBranch className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <HierarchyTreeSelector value={hierarchy} onChange={setHierarchy} hierarchyData={hierarchyData} />
                  </div>
                </div>
              )}

              {/* ── Tab 2: Regla de disparo ────────────────────────── */}
              {activeTab === "regla" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fuente de evaluación *</Label>
                    <Select value={sourceType} onValueChange={(v) => setSourceType(v as AlarmSourceType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.values(AlarmSourceType).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  {/* Tag search */}
                  <div className="space-y-2">
                    <Label>Insertar referencia a tag</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input placeholder="Buscar tag por nombre…" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} className="pl-9" />
                    </div>
                    {tagSearch && (
                      <div className="rounded-md border border-slate-200 bg-white shadow-sm max-h-36 overflow-y-auto">
                        {filteredTags.length === 0 ? <p className="px-3 py-2 text-xs text-slate-500">Sin resultados</p> :
                          filteredTags.map((t) => (
                            <button key={t.name} type="button"
                              className="w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
                              onClick={() => { insertAtCursor(`{${t.name}}`); setTagSearch(""); }}>
                              <span className="font-medium text-slate-800">{t.name}{t.engUnit && <span className="ml-1 text-slate-400">({t.engUnit})</span>}</span>
                              {t.description && <span className="text-slate-400 text-[10px] truncate max-w-[160px]">{t.description}</span>}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Operators */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Comparadores</Label>
                    <div className="flex flex-wrap gap-1">
                      {COMPARISON_OPS.map((op) => (
                        <button key={op} type="button" onClick={() => insertAtCursor(` ${op} `)} className="px-2 py-0.5 text-xs rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-mono">{op}</button>
                      ))}
                    </div>
                    <Label className="text-xs text-slate-500">Lógicos y temporales</Label>
                    <div className="flex flex-wrap gap-1">
                      {[...LOGICAL_OPS, ...TEMPORAL_OPS].map((op) => (
                        <button key={op} type="button" onClick={() => insertAtCursor(` ${op} `)} className="px-2 py-0.5 text-xs rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 font-mono text-blue-700">{op}</button>
                      ))}
                    </div>
                  </div>

                  {/* Expression */}
                  <div className="space-y-2">
                    <Label htmlFor="expression">Expresión de disparo *</Label>
                    <Textarea id="expression" ref={exprRef} rows={4}
                      placeholder={`Ej: {E-KW-TOTAL} > 400 DURANTE 300000\nEj: {T-TEMP-001} > 275\nEj: AUSENCIA({T-TEMP-001}) DURANTE 30000\nEj: ({VT-EFF-LINE1} < 80) AND ({E-KW-TOTAL} > 350)`}
                      value={expression} onChange={(e) => { setExpression(e.target.value); setValidationResult(null); }}
                      className={`font-mono text-xs ${errors.expression ? "border-red-500" : ""}`} />
                    {errors.expression && <p className="text-xs text-red-500">{errors.expression}</p>}
                    <p className="text-xs text-slate-500">
                      Tags: <code className="bg-slate-100 px-1 rounded">{"{TAG_NAME}"}</code> · Tiempo en ms (300000 = 5 min)
                    </p>
                  </div>

                  {/* Validate */}
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      const err = validateExpression(expression);
                      setValidationResult(err ? { ok: false, message: err } : { ok: true, message: "Expresión válida — sintaxis correcta" });
                    }}>
                      Validar expresión
                    </Button>
                    {validationResult && (
                      <span className={`text-xs font-medium ${validationResult.ok ? "text-green-700" : "text-red-600"}`}>
                        {validationResult.ok ? "✓" : "✗"} {validationResult.message}
                      </span>
                    )}
                  </div>

                  {/* Temporal filter */}
                  <div className="rounded-md border border-slate-200 p-4 space-y-3">
                    <p className="text-sm font-medium text-slate-700">Filtro temporal (anti-ruido)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Activación mínima (ms)</Label>
                        <Input type="number" placeholder="Ej: 60000" value={minActivationMs}
                          onChange={(e) => setMinActivationMs(e.target.value === "" ? "" : Number(e.target.value))} />
                        <p className="text-[10px] text-slate-400">Condición debe mantenerse este tiempo</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Retardo de disparo (ms)</Label>
                        <Input type="number" placeholder="Ej: 5000" value={delayMs}
                          onChange={(e) => setDelayMs(e.target.value === "" ? "" : Number(e.target.value))} />
                        <p className="text-[10px] text-slate-400">Espera antes de activar</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tiempo de rearme (ms)</Label>
                        <Input type="number" placeholder="Ej: 300000" value={rearmMs}
                          onChange={(e) => setRearmMs(e.target.value === "" ? "" : Number(e.target.value))} />
                        <p className="text-[10px] text-slate-400">Mínimo entre activaciones</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Histéresis</Label>
                        <Input type="number" placeholder="Ej: 5" value={hysteresis}
                          onChange={(e) => setHysteresis(e.target.value === "" ? "" : Number(e.target.value))} />
                        <p className="text-[10px] text-slate-400">Banda muerta al desactivar</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 3: Notificaciones ──────────────────────────── */}
              {activeTab === "notificaciones" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Canales de notificación</Label>
                    {ALARM_CHANNELS.map((ch) => (
                      <div key={ch} className="flex items-center space-x-2">
                        <Checkbox id={`ch-${ch}`} checked={channels.includes(ch)} onCheckedChange={() => toggleChannel(ch)} />
                        <Label htmlFor={`ch-${ch}`}>{CHANNEL_LABELS[ch]}</Label>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortMsg">Mensaje corto</Label>
                    <Input id="shortMsg" placeholder="Ej: Consumo eléctrico crítico en {ACTIVO}" value={shortMessage} onChange={(e) => setShortMessage(e.target.value)} />
                    <p className="text-xs text-slate-500">Variables: <code className="bg-slate-100 px-1 rounded">{"{VALOR}"}</code> <code className="bg-slate-100 px-1 rounded">{"{LIMITE}"}</code> <code className="bg-slate-100 px-1 rounded">{"{ACTIVO}"}</code> <code className="bg-slate-100 px-1 rounded">{"{TIEMPO}"}</code></p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detailMsg">Mensaje detallado</Label>
                    <Textarea id="detailMsg" rows={4}
                      placeholder="Ej: El consumo eléctrico en {ACTIVO} ha superado {LIMITE} kW durante {TIEMPO} minutos. Valor actual: {VALOR} kW."
                      value={detailedMessage} onChange={(e) => setDetailedMessage(e.target.value)} />
                  </div>

                  <div className="rounded-md border border-slate-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <strong>Escalado automático:</strong> Si la alarma no se reconoce en el tiempo configurado, el sistema escalará la prioridad y notificará a responsables de nivel superior.
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">{isEdit ? "Guardar cambios" : "Crear alarma"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <HierarchyManagerDialog open={manageHierarchy} onClose={() => setManageHierarchy(false)} hierarchyData={hierarchyData} onChange={onHierarchyChange} />
    </>
  );
}
