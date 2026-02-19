"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiTable } from "./components/KpiTable/KpiTable";
import { KpiFormDialog } from "./components/KpiFormDialog/KpiFormDialog";
import {
  KpiCategory,
  KpiDirection,
  KpiPeriod,
  KpiStatus,
  type Kpi,
  type KpiFormData,
} from "./types/kpi.types";
import { HIERARCHY_DATA, type HierarchyTree } from "../tags-fisicos/types/hierarchy.data";

// ── Available tags (physical + virtual, referenced by name) ──────────────────
const ALL_TAGS = [
  { name: "T-TEMP-001", description: "Temperatura entrada horno principal", engUnit: "°C" },
  { name: "T-TEMP-002", description: "Temperatura salida horno principal", engUnit: "°C" },
  { name: "E-KW-TOTAL", description: "Consumo eléctrico total Planta Norte", engUnit: "kW" },
  { name: "F-FLOW-HH2O", description: "Caudal agua refrigeración", engUnit: "m³/h" },
  { name: "P-PRES-VAPOR", description: "Presión vapor saturado", engUnit: "bar" },
  { name: "DB-PROD-UNITS", description: "Unidades producidas acumuladas (SQL)" },
  { name: "VT-TEMP-AVG", description: "Temperatura media horno entrada/salida", engUnit: "°C" },
  { name: "VT-KW-CORRECTED", description: "Consumo eléctrico corregido", engUnit: "kW" },
];

// ── Default categories and units ─────────────────────────────────────────────
const DEFAULT_CATEGORIES = Object.values(KpiCategory);
const DEFAULT_UNITS = ["kWh", "kW", "kWh/t", "kWh/ud", "%", "€", "€/día", "h", "ud", "t", "m³", "bar", "°C"];

// ── Mock KPIs ─────────────────────────────────────────────────────────────────
const MOCK_KPIS: Kpi[] = [
  {
    id: 1,
    kpiUUID: "aaaaaaaa-1111-2222-3333-aaaaaaaaaaaa",
    enable: true,
    name: "KPI-CONS-ESP-L1",
    description: "Consumo específico línea de producción 1",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Producción",
      seccion: "Sección Ensamblado",
      equipo: "Mesa-E01",
    },
    category: KpiCategory.ENERGIA,
    unit: "kWh/ud",
    period: KpiPeriod.DIA,
    formula: "TOTALIZE({E-KW-TOTAL}) / {DB-PROD-UNITS}",
    thresholds: {
      direction: KpiDirection.LOWER,
      target: 3.5,
      warningHigh: 4.0,
      criticalHigh: 5.0,
    },
    lastValue: 4.2,
    status: KpiStatus.WARNING,
    statusMessage: "Por encima del objetivo (target: 3.5 kWh/ud)",
  },
  {
    id: 2,
    kpiUUID: "bbbbbbbb-1111-2222-3333-bbbbbbbbbbbb",
    enable: true,
    name: "KPI-EFF-PROD",
    description: "Eficiencia de producción vs objetivo diario",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Producción",
      seccion: "Sección Ensamblado",
      equipo: "Mesa-E01",
    },
    category: KpiCategory.PRODUCCION,
    unit: "%",
    period: KpiPeriod.TURNO,
    formula: "EFFICIENCY({DB-PROD-UNITS}, 1000)",
    thresholds: {
      direction: KpiDirection.HIGHER,
      target: 95,
      warningLow: 85,
      criticalLow: 75,
    },
    lastValue: 94.3,
    status: KpiStatus.OK,
    statusMessage: "En rango objetivo",
  },
  {
    id: 3,
    kpiUUID: "cccccccc-1111-2222-3333-cccccccccccc",
    enable: true,
    name: "KPI-COSTE-ELEC-DIA",
    description: "Coste eléctrico diario a precio de mercado",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Utilities",
      seccion: "Sección Eléctrica",
      equipo: "Cuadro-QE01",
    },
    category: KpiCategory.COSTE,
    unit: "€/día",
    period: KpiPeriod.DIA,
    formula: "TOTALIZE({E-KW-TOTAL}) * 0.12",
    thresholds: {
      direction: KpiDirection.LOWER,
      target: 280,
      warningHigh: 320,
      criticalHigh: 400,
    },
    lastValue: 348,
    status: KpiStatus.CRITICAL,
    statusMessage: "Coste crítico — supera umbral máximo (400 €/día)",
  },
  {
    id: 4,
    kpiUUID: "dddddddd-1111-2222-3333-dddddddddddd",
    enable: true,
    name: "KPI-DISP-HORNO",
    description: "Disponibilidad horno principal",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Producción",
      seccion: "Sección Moldeado",
      equipo: "Moldeadora-M01",
    },
    category: KpiCategory.MANTENIMIENTO,
    unit: "%",
    period: KpiPeriod.DIA,
    formula: "AVAILABILITY({T-TEMP-001}, 86400000)",
    thresholds: {
      direction: KpiDirection.HIGHER,
      target: 98,
      warningLow: 90,
      criticalLow: 80,
    },
    lastValue: 98.5,
    status: KpiStatus.OK,
    statusMessage: "Disponibilidad nominal",
  },
  {
    id: 5,
    kpiUUID: "eeeeeeee-1111-2222-3333-eeeeeeeeeeee",
    enable: true,
    name: "KPI-DESV-BASELINE",
    description: "Desviación consumo eléctrico vs baseline histórico",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Utilities",
      seccion: "Sección Eléctrica",
      equipo: "Cuadro-QE01",
    },
    category: KpiCategory.ENERGIA,
    unit: "%",
    period: KpiPeriod.MES,
    formula: "DEVIATION_BASELINE({E-KW-TOTAL}, 280)",
    thresholds: {
      direction: KpiDirection.LOWER,
      target: 0,
      warningHigh: 10,
      criticalHigh: 20,
    },
    lastValue: undefined,
    status: KpiStatus.UNCERTAIN,
    statusMessage: "Datos de entrada con calidad degradada",
  },
  {
    id: 6,
    kpiUUID: "ffffffff-1111-2222-3333-ffffffffffff",
    enable: false,
    name: "KPI-CONS-NOLABORAL",
    description: "Consumo energético fuera de horario laboral",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Utilities",
      seccion: "Sección Eléctrica",
      equipo: "Cuadro-QE01",
    },
    category: KpiCategory.ENERGIA,
    unit: "kWh",
    period: KpiPeriod.SEMANA,
    formula: "OFF_HOURS_CONSUMPTION({E-KW-TOTAL})",
    thresholds: {
      direction: KpiDirection.LOWER,
      target: 50,
      warningHigh: 100,
      criticalHigh: 200,
    },
    lastValue: undefined,
    status: KpiStatus.NO_DATA,
    statusMessage: "KPI deshabilitado",
  },
];

// ── Page component ─────────────────────────────────────────────────────────────
export default function KpiPage() {
  const [kpis, setKpis] = useState<Kpi[]>(MOCK_KPIS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<Kpi | null>(null);

  // Managed lists & hierarchy
  const [hierarchyData, setHierarchyData] = useState<HierarchyTree>(HIERARCHY_DATA);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS);

  const nextId = () => Math.max(...kpis.map((k) => k.id), 0) + 1;

  const handleAdd = (data: KpiFormData) => {
    const newKpi: Kpi = {
      ...data,
      id: nextId(),
      kpiUUID: crypto.randomUUID(),
      status: KpiStatus.NO_DATA,
      statusMessage: "Recién creado — pendiente de primera evaluación",
    };
    setKpis((prev) => [...prev, newKpi]);
  };

  const handleEdit = (kpi: Kpi) => {
    setEditingKpi(kpi);
    setIsFormOpen(true);
  };

  const handleUpdate = (data: KpiFormData) => {
    if (!editingKpi) return;
    setKpis((prev) =>
      prev.map((k) => (k.id === editingKpi.id ? { ...k, ...data } : k))
    );
    setEditingKpi(null);
  };

  const handleDelete = (id: number) => {
    setKpis((prev) => prev.filter((k) => k.id !== id));
  };

  const handleDuplicate = (kpi: Kpi) => {
    const copy: Kpi = {
      ...kpi,
      id: nextId(),
      kpiUUID: crypto.randomUUID(),
      name: `${kpi.name} (copia)`,
      status: KpiStatus.NO_DATA,
      lastValue: undefined,
      statusMessage: "Duplicado — pendiente de primera evaluación",
    };
    setKpis((prev) => [...prev, copy]);
  };

  const handleToggleEnable = (id: number) => {
    setKpis((prev) =>
      prev.map((k) =>
        k.id === id
          ? { ...k, enable: !k.enable, statusMessage: !k.enable ? "Habilitado" : "Deshabilitado" }
          : k
      )
    );
  };

  const handleBulkEnable = (ids: number[]) => {
    const set = new Set(ids);
    setKpis((prev) =>
      prev.map((k) => (set.has(k.id) ? { ...k, enable: true, statusMessage: "Habilitado" } : k))
    );
  };

  const handleBulkDisable = (ids: number[]) => {
    const set = new Set(ids);
    setKpis((prev) =>
      prev.map((k) =>
        set.has(k.id) ? { ...k, enable: false, status: KpiStatus.NO_DATA, statusMessage: "Deshabilitado" } : k
      )
    );
  };

  const handleBulkDelete = (ids: number[]) => {
    const set = new Set(ids);
    setKpis((prev) => prev.filter((k) => !set.has(k.id)));
  };

  const handleDialogClose = () => {
    setIsFormOpen(false);
    setEditingKpi(null);
  };

  const handleDialogSubmit = (data: KpiFormData) => {
    if (editingKpi) {
      handleUpdate(data);
    } else {
      handleAdd(data);
    }
  };

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">KPI</h1>
            <p className="mt-1 text-sm text-slate-600">
              Indicadores de rendimiento calculados — {kpis.length} KPI
              {kpis.length !== 1 ? "s" : ""} configurado{kpis.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo KPI
          </Button>
        </div>
      </header>

      <KpiTable
        kpis={kpis}
        onToggleEnable={handleToggleEnable}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onBulkEnable={handleBulkEnable}
        onBulkDisable={handleBulkDisable}
        onBulkDelete={handleBulkDelete}
      />

      <KpiFormDialog
        open={isFormOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        editingKpi={editingKpi}
        existingKpis={kpis}
        allTags={ALL_TAGS}
        hierarchyData={hierarchyData}
        onHierarchyChange={setHierarchyData}
        categories={categories}
        onCategoriesChange={setCategories}
        units={units}
        onUnitsChange={setUnits}
      />
    </section>
  );
}
