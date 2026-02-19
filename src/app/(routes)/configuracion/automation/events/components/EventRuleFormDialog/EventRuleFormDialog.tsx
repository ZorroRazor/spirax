"use client";

import { useState, useEffect } from "react";
import { GitBranch, Plus, Trash2, GripVertical } from "lucide-react";
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
  EventType, ActionType,
  type AssetHierarchy, type EventAction, type EventRuleFormData,
} from "../../types/event-rule.types";
import type { EventRuleFormDialogProps } from "./EventRuleFormDialog.types";

type TabId = "definicion" | "disparador" | "acciones";
const TABS: { id: TabId; label: string }[] = [
  { id: "definicion", label: "Definición" },
  { id: "disparador", label: "Disparador" },
  { id: "acciones", label: "Acciones" },
];

const EMPTY_HIERARCHY: AssetHierarchy = { planta: "", area: "", seccion: "", equipo: "" };

// ── Trigger configuration by EventType ────────────────────────────────────────
const CRON_PRESETS = [
  { label: "Cada hora", value: "0 * * * *" },
  { label: "Cada día a medianoche", value: "0 0 * * *" },
  { label: "Cada lunes a las 08:00", value: "0 8 * * 1" },
  { label: "Primer día del mes", value: "0 0 1 * *" },
  { label: "Cada 15 minutos", value: "*/15 * * * *" },
];

// ── Empty form defaults ────────────────────────────────────────────────────────
function emptyForm(): Omit<EventRuleFormData, "actions"> & { actions: EventAction[] } {
  return {
    enable: true,
    name: "",
    description: "",
    eventType: EventType.TEMPORAL,
    trigger: "",
    condition: "",
    hierarchy: { ...EMPTY_HIERARCHY },
    actions: [],
  };
}

// ── Action type helpers ────────────────────────────────────────────────────────
const ACTION_GROUPS: { label: string; types: ActionType[] }[] = [
  {
    label: "Informes",
    types: [ActionType.REPORT_GENERATE, ActionType.REPORT_EMAIL],
  },
  {
    label: "Exportación de datos",
    types: [ActionType.EXPORT_CSV, ActionType.EXPORT_EXCEL, ActionType.EXPORT_FTP, ActionType.EXPORT_DB],
  },
  {
    label: "Notificaciones",
    types: [ActionType.NOTIFY_EMAIL, ActionType.NOTIFY_PUSH, ActionType.NOTIFY_WEBHOOK, ActionType.NOTIFY_CUSTOM],
  },
  {
    label: "Sistema",
    types: [ActionType.SYSTEM_ANNOTATION, ActionType.SYSTEM_STATUS, ActionType.SYSTEM_LOG],
  },
];

let actionIdCounter = 1000;
function newActionId() { return actionIdCounter++; }

// ── Main component ─────────────────────────────────────────────────────────────
export function EventRuleFormDialog({
  open,
  onClose,
  onSubmit,
  editingRule,
  existingRules,
  allTags,
  hierarchyData,
  onHierarchyChange,
}: EventRuleFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("definicion");
  const [showHierarchyManager, setShowHierarchyManager] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form fields
  const [enable, setEnable] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>(EventType.TEMPORAL);
  const [trigger, setTrigger] = useState("");
  const [cronCustom, setCronCustom] = useState("");
  const [condition, setCondition] = useState("");
  const [hierarchy, setHierarchy] = useState<AssetHierarchy>({ ...EMPTY_HIERARCHY });
  const [actions, setActions] = useState<EventAction[]>([]);
  const [newActionType, setNewActionType] = useState<ActionType | "">("");
  const [newActionConfig, setNewActionConfig] = useState("");

  // Tag search for condition field
  const [tagSearch, setTagSearch] = useState("");
  const filteredTags = allTags.filter(
    (t) =>
      t.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(tagSearch.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setActiveTab("definicion");
      setErrors({});
      setTagSearch("");
      setNewActionType("");
      setNewActionConfig("");
      if (editingRule) {
        setEnable(editingRule.enable);
        setName(editingRule.name);
        setDescription(editingRule.description ?? "");
        setEventType(editingRule.eventType);
        setTrigger(editingRule.trigger);
        setCondition(editingRule.condition ?? "");
        setHierarchy(editingRule.hierarchy ?? { ...EMPTY_HIERARCHY });
        setActions(editingRule.actions.map((a) => ({ ...a })));
      } else {
        const f = emptyForm();
        setEnable(f.enable);
        setName(f.name);
        setDescription(f.description ?? "");
        setEventType(f.eventType);
        setTrigger(f.trigger);
        setCondition(f.condition ?? "");
        setHierarchy({ ...EMPTY_HIERARCHY });
        setActions([]);
      }
    }
  }, [open, editingRule]);

  // ── Validation ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) e.name = "El nombre es obligatorio";
    else if (trimmedName.length < 3) e.name = "Mínimo 3 caracteres";
    else {
      const dup = existingRules.find(
        (r) => r.name.toLowerCase() === trimmedName.toLowerCase() && r.id !== editingRule?.id
      );
      if (dup) e.name = "Ya existe una regla con ese nombre";
    }
    if (!trigger.trim()) e.trigger = "El disparador no puede estar vacío";
    if (actions.length === 0) e.actions = "Añade al menos una acción";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!validate()) {
      if (errors.name || errors.description) setActiveTab("definicion");
      else if (errors.trigger) setActiveTab("disparador");
      else if (errors.actions) setActiveTab("acciones");
      return;
    }
    const data: EventRuleFormData = {
      enable,
      name: name.trim(),
      description: description.trim() || undefined,
      eventType,
      trigger: trigger.trim(),
      condition: condition.trim() || undefined,
      hierarchy,
      actions,
    };
    onSubmit(data);
    onClose();
  }

  // ── Action management ────────────────────────────────────────────────────────
  function addAction() {
    if (!newActionType) return;
    setActions((prev) => [
      ...prev,
      { id: newActionId(), type: newActionType as ActionType, config: newActionConfig.trim() },
    ]);
    setNewActionType("");
    setNewActionConfig("");
  }

  function removeAction(id: number) {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  function moveAction(index: number, dir: -1 | 1) {
    setActions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // ── Trigger helpers ──────────────────────────────────────────────────────────
  function renderTriggerEditor() {
    switch (eventType) {
      case EventType.TEMPORAL:
        return (
          <div className="space-y-3">
            <Label>Expresión Cron *</Label>
            <div className="flex flex-wrap gap-2">
              {CRON_PRESETS.map((p) => (
                <Button
                  key={p.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setTrigger(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <Input
              placeholder="*/15 * * * *"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="font-mono text-sm"
            />
            {trigger && (
              <p className="text-xs text-slate-500">
                Formato: minuto hora día-mes mes día-semana
              </p>
            )}
            {errors.trigger && <p className="text-xs text-red-500">{errors.trigger}</p>}
          </div>
        );

      case EventType.CONTEXT:
        return (
          <div className="space-y-3">
            <Label>Contexto operativo *</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un contexto…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TURNO_INICIO">Inicio de turno</SelectItem>
                <SelectItem value="TURNO_FIN">Fin de turno</SelectItem>
                <SelectItem value="ORDEN_INICIO">Inicio de orden de fabricación</SelectItem>
                <SelectItem value="ORDEN_FIN">Fin de orden de fabricación</SelectItem>
                <SelectItem value="LOTE_INICIO">Inicio de lote</SelectItem>
                <SelectItem value="LOTE_FIN">Fin de lote</SelectItem>
                <SelectItem value="PARADA_PLANIFICADA">Parada planificada</SelectItem>
                <SelectItem value="MANTENIMIENTO">Inicio de mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            {errors.trigger && <p className="text-xs text-red-500">{errors.trigger}</p>}
          </div>
        );

      case EventType.DATA:
        return (
          <div className="space-y-3">
            <Label>Condición sobre datos *</Label>
            <p className="text-xs text-slate-500">
              Construye una expresión usando tags. Usa <code className="bg-slate-100 px-1 rounded">{"{TAG_NAME}"}</code> para referencias.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar tag…"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="max-w-xs text-sm"
              />
              {tagSearch && filteredTags.length > 0 && (
                <div className="absolute z-20 mt-8 max-h-48 w-72 overflow-y-auto rounded border bg-white shadow-md">
                  {filteredTags.slice(0, 10).map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        setTrigger((prev) => prev + `{${t.name}}`);
                        setTagSearch("");
                      }}
                    >
                      <span className="font-mono font-medium">{t.name}</span>
                      {t.description && <span className="text-xs text-slate-500">{t.description}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {[">", "<", ">=", "<=", "==", "!="].map((op) => (
                <Button key={op} type="button" variant="outline" size="sm" className="font-mono text-xs px-2"
                  onClick={() => setTrigger((prev) => prev + ` ${op} `)}>
                  {op}
                </Button>
              ))}
              {["AND", "OR", "NOT", "(", ")"].map((op) => (
                <Button key={op} type="button" variant="outline" size="sm" className="text-xs px-2"
                  onClick={() => setTrigger((prev) => prev + ` ${op} `)}>
                  {op}
                </Button>
              ))}
            </div>
            <Textarea
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="font-mono text-sm"
              rows={3}
              placeholder="{T-TEMP-001} > 280 AND {E-KW-TOTAL} > 350"
            />
            {errors.trigger && <p className="text-xs text-red-500">{errors.trigger}</p>}
          </div>
        );

      case EventType.KPI:
        return (
          <div className="space-y-3">
            <Label>Condición de KPI *</Label>
            <div className="flex flex-wrap gap-1 mb-1">
              {allTags.filter(t => t.name.startsWith("KPI-")).map((t) => (
                <Button key={t.name} type="button" variant="outline" size="sm"
                  className="font-mono text-xs"
                  onClick={() => setTrigger((prev) => prev + `{${t.name}}`)}>
                  {t.name}
                </Button>
              ))}
            </div>
            <Textarea
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="font-mono text-sm"
              rows={2}
              placeholder="{KPI-COSTE-ELEC-DIA} > 400"
            />
            {errors.trigger && <p className="text-xs text-red-500">{errors.trigger}</p>}
          </div>
        );

      case EventType.ALARM:
        return (
          <div className="space-y-3">
            <Label>Condición de alarma *</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado de alarma…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALARM_ACTIVE">Alarma activada</SelectItem>
                <SelectItem value="ALARM_ACKNOWLEDGED">Alarma reconocida</SelectItem>
                <SelectItem value="ALARM_RESOLVED">Alarma resuelta</SelectItem>
                <SelectItem value="ALARM_CRITICAL_ACTIVE">Alarma crítica activada</SelectItem>
                <SelectItem value="ALARM_ANY">Cualquier cambio de estado</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Filtrar por nombre de alarma (opcional)</Label>
              <Input
                placeholder="ALM-KW-PICO"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            {errors.trigger && <p className="text-xs text-red-500">{errors.trigger}</p>}
          </div>
        );

      case EventType.AI:
        return (
          <div className="space-y-3">
            <Label>Evento de IA *</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un evento de IA…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AI_ANOMALY_DETECTED">Anomalía detectada</SelectItem>
                <SelectItem value="AI_PREDICTION_THRESHOLD">Predicción supera umbral</SelectItem>
                <SelectItem value="AI_MAINTENANCE_NEEDED">Mantenimiento predictivo requerido</SelectItem>
                <SelectItem value="AI_PATTERN_CHANGE">Cambio de patrón detectado</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Parámetros adicionales (opcional)</Label>
              <Input
                placeholder="confidence > 0.9"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            {errors.trigger && <p className="text-xs text-red-500">{errors.trigger}</p>}
          </div>
        );

      default:
        return null;
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Editar Regla de Evento" : "Nueva Regla de Evento"}
            </DialogTitle>
            <DialogDescription>
              {editingRule
                ? `Modificando la regla "${editingRule.name}"`
                : "Define el disparador y las acciones que se ejecutarán automáticamente."}
            </DialogDescription>
          </DialogHeader>

          {/* Tab navigation */}
          <div className="flex gap-1 border-b border-slate-200 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-slate-900 text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Definición ── */}
          {activeTab === "definicion" && (
            <div className="space-y-4">
              {/* UUID (edit mode only) */}
              {editingRule && (
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Rule UUID</Label>
                  <p className="font-mono text-xs text-slate-500 bg-slate-50 rounded px-3 py-2 select-all">
                    {editingRule.ruleUUID}
                  </p>
                </div>
              )}

              {/* Enable */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enable"
                  checked={enable}
                  onCheckedChange={(v) => setEnable(!!v)}
                />
                <Label htmlFor="enable">Habilitada</Label>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="EVT-INFORME-DIARIO"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? "border-red-400" : ""}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe qué hace esta regla de evento…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Event Type */}
              <div className="space-y-1">
                <Label>Tipo de Evento *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(EventType).map((et) => (
                    <button
                      key={et}
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        eventType === et
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 hover:border-slate-400 text-slate-700"
                      }`}
                      onClick={() => { setEventType(et); setTrigger(""); setCondition(""); }}
                    >
                      {et}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hierarchy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Jerarquía de activo</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHierarchyManager(true)}
                    className="text-xs gap-1"
                  >
                    <GitBranch className="h-3 w-3" />
                    Gestionar jerarquía
                  </Button>
                </div>
                <HierarchyTreeSelector
                  value={hierarchy}
                  onChange={setHierarchy}
                  hierarchyData={hierarchyData}
                />
              </div>
            </div>
          )}

          {/* ── Tab: Disparador ── */}
          {activeTab === "disparador" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                Tipo de evento: <span className="font-medium text-slate-900">{eventType}</span>
              </div>
              {renderTriggerEditor()}

              {/* Optional extra condition (for DATA/KPI types) */}
              {(eventType === EventType.DATA || eventType === EventType.KPI) && (
                <div className="space-y-1">
                  <Label>Condición adicional (opcional)</Label>
                  <Textarea
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="font-mono text-sm"
                    rows={2}
                    placeholder="Condición de guardia adicional…"
                  />
                  <p className="text-xs text-slate-400">
                    Se evaluará además del disparador principal.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Acciones ── */}
          {activeTab === "acciones" && (
            <div className="space-y-4">
              {/* Action list */}
              {actions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No hay acciones configuradas. Añade al menos una.
                </p>
              ) : (
                <div className="space-y-2">
                  {actions.map((action, idx) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={idx === 0}
                          onClick={() => moveAction(idx, -1)}
                          title="Subir"
                        >
                          <GripVertical className="h-3 w-3 rotate-90" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={idx === actions.length - 1}
                          onClick={() => moveAction(idx, 1)}
                          title="Bajar"
                        >
                          <GripVertical className="h-3 w-3 -rotate-90" />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          <span className="text-xs text-slate-400 mr-2">#{idx + 1}</span>
                          {action.type}
                        </p>
                        {action.config && (
                          <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                            {action.config}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-red-400 hover:text-red-600"
                        onClick={() => removeAction(action.id)}
                        title="Eliminar acción"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {errors.actions && (
                <p className="text-xs text-red-500">{errors.actions}</p>
              )}

              {/* Add new action */}
              <div className="rounded-lg border border-dashed border-slate-300 p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">Añadir acción</p>
                <div className="space-y-1">
                  <Label>Tipo de acción</Label>
                  <Select
                    value={newActionType}
                    onValueChange={(v) => setNewActionType(v as ActionType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una acción…" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_GROUPS.map((group) => (
                        <div key={group.label}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            {group.label}
                          </div>
                          {group.types.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Configuración / Parámetro</Label>
                  <Input
                    placeholder={
                      newActionType === ActionType.NOTIFY_EMAIL
                        ? "ops@empresa.com, manager@empresa.com"
                        : newActionType === ActionType.NOTIFY_WEBHOOK
                        ? "https://hooks.empresa.com/alert"
                        : newActionType === ActionType.EXPORT_FTP
                        ? "ftp://servidor/ruta/"
                        : "Parámetro o configuración de la acción…"
                    }
                    value={newActionConfig}
                    onChange={(e) => setNewActionConfig(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!newActionType}
                  onClick={addAction}
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Añadir
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingRule ? "Guardar cambios" : "Crear regla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HierarchyManagerDialog
        open={showHierarchyManager}
        onClose={() => setShowHierarchyManager(false)}
        hierarchyData={hierarchyData}
        onChange={onHierarchyChange}
      />
    </>
  );
}
