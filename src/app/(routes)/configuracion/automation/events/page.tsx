"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventRuleTable } from "./components/EventRuleTable/EventRuleTable";
import { EventRuleFormDialog } from "./components/EventRuleFormDialog/EventRuleFormDialog";
import {
  EventType, ActionType, EventRuleState,
  type EventRule, type EventRuleFormData,
} from "./types/event-rule.types";
import { HIERARCHY_DATA, type HierarchyTree } from "../../data-model/tags-fisicos/types/hierarchy.data";

const ALL_TAGS = [
  { name: "T-TEMP-001", description: "Temperatura entrada horno", engUnit: "°C" },
  { name: "T-TEMP-002", description: "Temperatura salida horno", engUnit: "°C" },
  { name: "E-KW-TOTAL", description: "Consumo eléctrico total", engUnit: "kW" },
  { name: "F-FLOW-HH2O", description: "Caudal agua refrigeración", engUnit: "m³/h" },
  { name: "P-PRES-VAPOR", description: "Presión vapor saturado", engUnit: "bar" },
  { name: "DB-PROD-UNITS", description: "Unidades producidas" },
  { name: "VT-TEMP-AVG", description: "Temperatura media horno", engUnit: "°C" },
  { name: "VT-EFF-LINE1", description: "Eficiencia línea 1", engUnit: "%" },
  { name: "KPI-COSTE-ELEC-DIA", description: "KPI coste eléctrico diario", engUnit: "€/día" },
  { name: "KPI-EFF-PROD", description: "KPI eficiencia de producción", engUnit: "%" },
];

const MOCK_RULES: EventRule[] = [
  {
    id: 1,
    ruleUUID: "f1f1f1f1-1111-2222-3333-f1f1f1f1f1f1",
    enable: true,
    name: "EVT-INFORME-DIARIO",
    description: "Genera y envía informe diario de consumo energético al inicio de cada jornada",
    eventType: EventType.TEMPORAL,
    trigger: "0 7 * * 1-5",
    hierarchy: { planta: "Planta Norte", area: "Área Utilities", seccion: "Sección Eléctrica", equipo: "" },
    actions: [
      { id: 1, type: ActionType.REPORT_GENERATE, config: "informe-consumo-diario" },
      { id: 2, type: ActionType.REPORT_EMAIL, config: "energia@empresa.com, gerencia@empresa.com" },
    ],
    executionCount: 42,
    lastExecuted: "2026-02-17 07:00:05",
    status: EventRuleState.ACTIVE,
    statusMessage: "Última ejecución completada en 1.2s",
  },
  {
    id: 2,
    ruleUUID: "g2g2g2g2-1111-2222-3333-g2g2g2g2g2g2",
    enable: true,
    name: "EVT-EXPORT-TURNO",
    description: "Exporta histórico de producción al finalizar cada turno",
    eventType: EventType.CONTEXT,
    trigger: "TURNO_FIN",
    hierarchy: { planta: "Planta Norte", area: "Área Producción", seccion: "Sección Moldeado", equipo: "" },
    actions: [
      { id: 3, type: ActionType.EXPORT_EXCEL, config: "/exportaciones/produccion/" },
      { id: 4, type: ActionType.EXPORT_DB, config: "postgresql://bi-server/produccion" },
    ],
    executionCount: 128,
    lastExecuted: "2026-02-17 22:00:12",
    status: EventRuleState.ACTIVE,
    statusMessage: "Activa — se ejecuta en fin de cada turno",
  },
  {
    id: 3,
    ruleUUID: "h3h3h3h3-1111-2222-3333-h3h3h3h3h3h3",
    enable: true,
    name: "EVT-ALERTA-CONSUMO",
    description: "Notifica a mantenimiento cuando el consumo supera el umbral durante el turno de noche",
    eventType: EventType.DATA,
    trigger: "{E-KW-TOTAL} > 350 AND {T-TEMP-001} > 260",
    hierarchy: { planta: "Planta Norte", area: "Área Utilities", seccion: "Sección Eléctrica", equipo: "Cuadro-QE01" },
    actions: [
      { id: 5, type: ActionType.NOTIFY_PUSH, config: "grupo-mantenimiento" },
      { id: 6, type: ActionType.SYSTEM_ANNOTATION, config: "Consumo nocturno elevado detectado" },
    ],
    executionCount: 7,
    lastExecuted: "2026-02-14 02:31:44",
    status: EventRuleState.ACTIVE,
    statusMessage: "Sin activación en las últimas 48h",
  },
  {
    id: 4,
    ruleUUID: "i4i4i4i4-1111-2222-3333-i4i4i4i4i4i4",
    enable: false,
    name: "EVT-KPI-CRITICO",
    description: "Envía webhook cuando el KPI de coste eléctrico supera el límite crítico",
    eventType: EventType.KPI,
    trigger: "{KPI-COSTE-ELEC-DIA} > 400",
    hierarchy: { planta: "Planta Norte", area: "", seccion: "", equipo: "" },
    actions: [
      { id: 7, type: ActionType.NOTIFY_WEBHOOK, config: "https://hooks.empresa.com/kpi-critico" },
      { id: 8, type: ActionType.NOTIFY_EMAIL, config: "direccion@empresa.com" },
    ],
    executionCount: 3,
    lastExecuted: "2026-02-10 14:22:09",
    status: EventRuleState.INACTIVE,
    statusMessage: "Deshabilitada manualmente",
  },
  {
    id: 5,
    ruleUUID: "j5j5j5j5-1111-2222-3333-j5j5j5j5j5j5",
    enable: true,
    name: "EVT-ALARMA-CRITICA",
    description: "Registra en log y notifica cuando se activa cualquier alarma crítica",
    eventType: EventType.ALARM,
    trigger: "ALARM_CRITICAL_ACTIVE",
    hierarchy: { planta: "Planta Norte", area: "", seccion: "", equipo: "" },
    actions: [
      { id: 9, type: ActionType.SYSTEM_LOG, config: "alarm-critical.log" },
      { id: 10, type: ActionType.NOTIFY_PUSH, config: "grupo-operaciones" },
      { id: 11, type: ActionType.NOTIFY_EMAIL, config: "sala-control@empresa.com" },
    ],
    executionCount: 12,
    lastExecuted: "2026-02-17 10:15:33",
    status: EventRuleState.ACTIVE,
    statusMessage: "Activa — escucha alarmas críticas en tiempo real",
  },
];

export default function EventsPage() {
  const [rules, setRules] = useState<EventRule[]>(MOCK_RULES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EventRule | null>(null);
  const [hierarchyData, setHierarchyData] = useState<HierarchyTree>(HIERARCHY_DATA);

  const nextId = () => Math.max(...rules.map((r) => r.id), 0) + 1;

  const handleAdd = (data: EventRuleFormData) => {
    setRules((prev) => [
      ...prev,
      {
        ...data,
        id: nextId(),
        ruleUUID: crypto.randomUUID(),
        status: EventRuleState.INACTIVE,
        statusMessage: "Recién creada — pendiente de primera ejecución",
        executionCount: 0,
      },
    ]);
  };

  const handleUpdate = (data: EventRuleFormData) => {
    if (!editingRule) return;
    setRules((prev) =>
      prev.map((r) => (r.id === editingRule.id ? { ...r, ...data } : r))
    );
    setEditingRule(null);
  };

  const handleDelete = (id: number) => setRules((prev) => prev.filter((r) => r.id !== id));

  const handleDuplicate = (rule: EventRule) =>
    setRules((prev) => [
      ...prev,
      {
        ...rule,
        id: nextId(),
        ruleUUID: crypto.randomUUID(),
        name: `${rule.name} (copia)`,
        status: EventRuleState.INACTIVE,
        statusMessage: "Duplicada",
        executionCount: 0,
        lastExecuted: undefined,
      },
    ]);

  const handleToggleEnable = (id: number) =>
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              enable: !r.enable,
              status: !r.enable ? EventRuleState.ACTIVE : EventRuleState.INACTIVE,
              statusMessage: !r.enable ? "Habilitada" : "Deshabilitada",
            }
          : r
      )
    );

  const handleBulkEnable = (ids: number[]) => {
    const s = new Set(ids);
    setRules((prev) =>
      prev.map((r) =>
        s.has(r.id)
          ? { ...r, enable: true, status: EventRuleState.ACTIVE, statusMessage: "Habilitada" }
          : r
      )
    );
  };

  const handleBulkDisable = (ids: number[]) => {
    const s = new Set(ids);
    setRules((prev) =>
      prev.map((r) =>
        s.has(r.id)
          ? { ...r, enable: false, status: EventRuleState.INACTIVE, statusMessage: "Deshabilitada" }
          : r
      )
    );
  };

  const handleBulkDelete = (ids: number[]) => {
    const s = new Set(ids);
    setRules((prev) => prev.filter((r) => !s.has(r.id)));
  };

  const activeCount = rules.filter((r) => r.status === EventRuleState.ACTIVE).length;

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Event Rules</h1>
            <p className="mt-1 text-sm text-slate-600">
              {rules.length} regla{rules.length !== 1 ? "s" : ""} configurada{rules.length !== 1 ? "s" : ""}
              {activeCount > 0 && (
                <span className="ml-2 text-emerald-600 font-medium">
                  · {activeCount} activa{activeCount !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Regla
          </Button>
        </div>
      </header>

      <EventRuleTable
        rules={rules}
        onToggleEnable={handleToggleEnable}
        onEdit={(r) => { setEditingRule(r); setIsFormOpen(true); }}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onBulkEnable={handleBulkEnable}
        onBulkDisable={handleBulkDisable}
        onBulkDelete={handleBulkDelete}
      />

      <EventRuleFormDialog
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingRule(null); }}
        onSubmit={(data) => { editingRule ? handleUpdate(data) : handleAdd(data); }}
        editingRule={editingRule}
        existingRules={rules}
        allTags={ALL_TAGS}
        hierarchyData={hierarchyData}
        onHierarchyChange={setHierarchyData}
      />
    </section>
  );
}
