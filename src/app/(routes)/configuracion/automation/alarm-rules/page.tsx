"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlarmTable } from "./components/AlarmTable/AlarmTable";
import { AlarmFormDialog } from "./components/AlarmFormDialog/AlarmFormDialog";
import {
  AlarmType, AlarmPriority, AlarmCategory, AlarmSourceType, AlarmStatus,
  type AlarmRule, type AlarmRuleFormData,
} from "./types/alarm.types";
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
];

const MOCK_ALARMS: AlarmRule[] = [
  {
    id: 1, alarmUUID: "a1a1a1a1-1111-2222-3333-a1a1a1a1a1a1",
    enable: true, name: "ALM-KW-PICO", description: "Consumo eléctrico supera pico crítico",
    type: AlarmType.THRESHOLD, priority: AlarmPriority.CRITICAL, category: AlarmCategory.ENERGIA,
    hierarchy: { planta: "Planta Norte", area: "Área Utilities", seccion: "Sección Eléctrica", equipo: "Cuadro-QE01" },
    sourceType: AlarmSourceType.PHYSICAL_TAG,
    expression: "{E-KW-TOTAL} > 400 DURANTE 300000",
    temporalFilter: { minActivationMs: 300000, rearmMs: 600000, hysteresis: 10 },
    notification: { channels: ["panel", "email", "push"], shortMessage: "Consumo crítico: {VALOR} kW en {ACTIVO}", detailedMessage: "El consumo ha superado 400 kW durante 5 minutos. Valor actual: {VALOR} kW." },
    status: AlarmStatus.ACTIVE, statusMessage: "Activa desde hace 12 min — valor actual: 423 kW",
  },
  {
    id: 2, alarmUUID: "b2b2b2b2-1111-2222-3333-b2b2b2b2b2b2",
    enable: true, name: "ALM-TEMP-ALTA", description: "Temperatura horno supera límite operativo",
    type: AlarmType.THRESHOLD, priority: AlarmPriority.HIGH, category: AlarmCategory.MANTENIMIENTO,
    hierarchy: { planta: "Planta Norte", area: "Área Producción", seccion: "Sección Moldeado", equipo: "Moldeadora-M01" },
    sourceType: AlarmSourceType.PHYSICAL_TAG,
    expression: "{T-TEMP-001} > 275",
    temporalFilter: { delayMs: 5000, hysteresis: 3 },
    notification: { channels: ["panel", "push"], shortMessage: "Temperatura alta: {VALOR}°C" },
    status: AlarmStatus.ACKNOWLEDGED, statusMessage: "Reconocida por ops-01 a las 10:42",
  },
  {
    id: 3, alarmUUID: "c3c3c3c3-1111-2222-3333-c3c3c3c3c3c3",
    enable: true, name: "ALM-EFF-BAJA", description: "Eficiencia de producción por debajo del umbral mínimo",
    type: AlarmType.COMPARISON, priority: AlarmPriority.MEDIUM, category: AlarmCategory.PRODUCCION,
    hierarchy: { planta: "Planta Norte", area: "Área Producción", seccion: "Sección Ensamblado", equipo: "Mesa-E01" },
    sourceType: AlarmSourceType.VIRTUAL_TAG,
    expression: "{VT-EFF-LINE1} < 80 DURANTE 1800000",
    temporalFilter: { minActivationMs: 1800000, rearmMs: 3600000 },
    notification: { channels: ["panel", "email"], shortMessage: "Eficiencia baja: {VALOR}%" },
    status: AlarmStatus.INACTIVE, statusMessage: "Sin activaciones en las últimas 24h",
  },
  {
    id: 4, alarmUUID: "d4d4d4d4-1111-2222-3333-d4d4d4d4d4d4",
    enable: true, name: "ALM-COMM-PLC", description: "Pérdida de comunicación con PLC-001",
    type: AlarmType.COMMUNICATION, priority: AlarmPriority.CRITICAL, category: AlarmCategory.COMUNICACION,
    hierarchy: { planta: "Planta Norte", area: "Área Producción", seccion: "", equipo: "" },
    sourceType: AlarmSourceType.COMMUNICATION,
    expression: "AUSENCIA({T-TEMP-001}) DURANTE 30000",
    temporalFilter: { minActivationMs: 30000, rearmMs: 60000 },
    notification: { channels: ["panel", "email", "push", "webhook"], shortMessage: "PLC-001 sin comunicación > 30s" },
    status: AlarmStatus.RESOLVED, statusMessage: "Resuelta — comunicación restaurada a las 09:15",
  },
  {
    id: 5, alarmUUID: "e5e5e5e5-1111-2222-3333-e5e5e5e5e5e5",
    enable: true, name: "ALM-KPI-COSTE", description: "KPI coste eléctrico diario en estado crítico",
    type: AlarmType.THRESHOLD, priority: AlarmPriority.HIGH, category: AlarmCategory.ENERGIA,
    hierarchy: { planta: "Planta Norte", area: "Área Utilities", seccion: "Sección Eléctrica", equipo: "Cuadro-QE01" },
    sourceType: AlarmSourceType.KPI,
    expression: "{KPI-COSTE-ELEC-DIA} > 400",
    notification: { channels: ["panel", "email"], shortMessage: "Coste eléctrico crítico: {VALOR} €/día" },
    status: AlarmStatus.ACTIVE, statusMessage: "Activa — coste actual: 348 €/día (umbral: 400)",
  },
];

export default function AlarmRulesPage() {
  const [alarms, setAlarms] = useState<AlarmRule[]>(MOCK_ALARMS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmRule | null>(null);
  const [hierarchyData, setHierarchyData] = useState<HierarchyTree>(HIERARCHY_DATA);

  const nextId = () => Math.max(...alarms.map((a) => a.id), 0) + 1;

  const handleAdd = (data: AlarmRuleFormData) => {
    setAlarms((prev) => [...prev, { ...data, id: nextId(), alarmUUID: crypto.randomUUID(), status: AlarmStatus.INACTIVE, statusMessage: "Recién creada — pendiente de primera evaluación" }]);
  };
  const handleUpdate = (data: AlarmRuleFormData) => {
    if (!editingAlarm) return;
    setAlarms((prev) => prev.map((a) => (a.id === editingAlarm.id ? { ...a, ...data } : a)));
    setEditingAlarm(null);
  };
  const handleDelete = (id: number) => setAlarms((prev) => prev.filter((a) => a.id !== id));
  const handleDuplicate = (alarm: AlarmRule) =>
    setAlarms((prev) => [...prev, { ...alarm, id: nextId(), alarmUUID: crypto.randomUUID(), name: `${alarm.name} (copia)`, status: AlarmStatus.INACTIVE, statusMessage: "Duplicada" }]);
  const handleToggleEnable = (id: number) =>
    setAlarms((prev) => prev.map((a) => a.id === id ? { ...a, enable: !a.enable, statusMessage: !a.enable ? "Habilitada" : "Deshabilitada" } : a));
  const handleBulkEnable = (ids: number[]) => { const s = new Set(ids); setAlarms((prev) => prev.map((a) => s.has(a.id) ? { ...a, enable: true } : a)); };
  const handleBulkDisable = (ids: number[]) => { const s = new Set(ids); setAlarms((prev) => prev.map((a) => s.has(a.id) ? { ...a, enable: false } : a)); };
  const handleBulkDelete = (ids: number[]) => { const s = new Set(ids); setAlarms((prev) => prev.filter((a) => !s.has(a.id))); };

  const activeCount = alarms.filter((a) => a.status === AlarmStatus.ACTIVE).length;

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Alarm Rules</h1>
            <p className="mt-1 text-sm text-slate-600">
              {alarms.length} alarma{alarms.length !== 1 ? "s" : ""} configurada{alarms.length !== 1 ? "s" : ""}
              {activeCount > 0 && <span className="ml-2 text-red-600 font-medium">· {activeCount} activa{activeCount !== 1 ? "s" : ""}</span>}
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Alarma
          </Button>
        </div>
      </header>

      <AlarmTable
        alarms={alarms}
        onToggleEnable={handleToggleEnable}
        onEdit={(a) => { setEditingAlarm(a); setIsFormOpen(true); }}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onBulkEnable={handleBulkEnable}
        onBulkDisable={handleBulkDisable}
        onBulkDelete={handleBulkDelete}
      />

      <AlarmFormDialog
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingAlarm(null); }}
        onSubmit={(data) => { editingAlarm ? handleUpdate(data) : handleAdd(data); }}
        editingAlarm={editingAlarm}
        existingAlarms={alarms}
        allTags={ALL_TAGS}
        hierarchyData={hierarchyData}
        onHierarchyChange={setHierarchyData}
      />
    </section>
  );
}
