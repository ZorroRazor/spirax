"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VirtualTagsTable } from "./components/VirtualTagsTable/VirtualTagsTable";
import { VirtualTagFormDialog } from "./components/VirtualTagFormDialog/VirtualTagFormDialog";
import {
  VirtualType,
  VirtualTagStatus,
  type VirtualTag,
  type VirtualTagFormData,
} from "./types/virtual-tag.types";
import {
  DataClassification,
  EngUnit,
} from "../tags-fisicos/types/physical-tag.types";
import { HIERARCHY_DATA, type HierarchyTree } from "../tags-fisicos/types/hierarchy.data";

// ── Physical tag refs (mirrors data from tags-fisicos page) ──────────────────
const MOCK_PHYSICAL_TAGS = [
  {
    tagUUID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "T-TEMP-001",
    description: "Temperatura entrada horno principal",
    engUnit: "°C",
  },
  {
    tagUUID: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    name: "E-KW-TOTAL",
    description: "Consumo eléctrico total Planta Norte",
    engUnit: "kW",
  },
  {
    tagUUID: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    name: "F-FLOW-HH2O",
    description: "Caudal agua refrigeración",
    engUnit: "m³/h",
  },
  {
    tagUUID: "d4e5f6a7-b8c9-0123-defa-234567890123",
    name: "P-PRES-VAPOR",
    description: "Presión vapor saturado",
    engUnit: "bar",
  },
  {
    tagUUID: "e5f6a7b8-c9d0-1234-efab-345678901234",
    name: "DB-PROD-UNITS",
    description: "Unidades producidas acumuladas (SQL)",
  },
  {
    tagUUID: "f6a7b8c9-d0e1-2345-fabc-456789012345",
    name: "T-TEMP-002",
    description: "Temperatura salida horno principal",
    engUnit: "°C",
  },
];

// ── Mock virtual tags ─────────────────────────────────────────────────────────
const MOCK_VIRTUAL_TAGS: VirtualTag[] = [
  {
    id: 1,
    tagUUID: "11111111-aaaa-bbbb-cccc-111111111111",
    enable: true,
    name: "VT-TEMP-AVG",
    description: "Temperatura media horno entrada/salida",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Producción",
      seccion: "Sección Moldeado",
      equipo: "Moldeadora-M01",
    },
    classification: DataClassification.TEMPERATURA,
    engUnit: EngUnit.CELSIUS,
    virtualType: VirtualType.AGREGADO,
    evaluateRate: 1000,
    formula: "AVG({T-TEMP-001}, {T-TEMP-002})",
    status: VirtualTagStatus.OK,
    statusMessage: "Último valor: 217.5°C",
  },
  {
    id: 2,
    tagUUID: "22222222-aaaa-bbbb-cccc-222222222222",
    enable: true,
    name: "VT-KW-CORRECTED",
    description: "Consumo eléctrico corregido (+5% pérdidas)",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Utilities",
      seccion: "Sección Eléctrica",
      equipo: "Cuadro-QE01",
    },
    classification: DataClassification.ELECTRICIDAD,
    engUnit: EngUnit.KW,
    virtualType: VirtualType.MATEMATICO,
    evaluateRate: 1000,
    formula: "{E-KW-TOTAL} * 1.05",
    status: VirtualTagStatus.OK,
    statusMessage: "Último valor: 312.6 kW",
  },
  {
    id: 3,
    tagUUID: "33333333-aaaa-bbbb-cccc-333333333333",
    enable: true,
    name: "VT-EFF-LINE1",
    description: "Eficiencia línea de producción 1",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Producción",
      seccion: "Sección Ensamblado",
      equipo: "Mesa-E01",
    },
    classification: DataClassification.OTRO,
    engUnit: EngUnit.PERCENT,
    virtualType: VirtualType.FUNCION,
    evaluateRate: 60000,
    formula: "EFFICIENCY({DB-PROD-UNITS}, 1000)",
    status: VirtualTagStatus.BAD,
    statusMessage: "Tag de entrada DB-PROD-UNITS en error",
  },
  {
    id: 4,
    tagUUID: "44444444-aaaa-bbbb-cccc-444444444444",
    enable: true,
    name: "VT-TEMP-RISE",
    description: "Variación temperatura salida horno",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Producción",
      seccion: "Sección Moldeado",
      equipo: "Moldeadora-M01",
    },
    classification: DataClassification.TEMPERATURA,
    engUnit: EngUnit.CELSIUS,
    virtualType: VirtualType.MATEMATICO,
    evaluateRate: 500,
    formula: "DIFF({T-TEMP-002})",
    status: VirtualTagStatus.OK,
    statusMessage: "Último valor: +2.3°C",
  },
  {
    id: 5,
    tagUUID: "55555555-aaaa-bbbb-cccc-555555555555",
    enable: true,
    name: "VT-SPECIFIC-CONS",
    description: "Consumo específico kW por unidad producida",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Utilities",
      seccion: "Sección Eléctrica",
      equipo: "Cuadro-QE01",
    },
    classification: DataClassification.ELECTRICIDAD,
    virtualType: VirtualType.FUNCION,
    evaluateRate: 60000,
    formula: "SPECIFIC_CONSUMPTION({E-KW-TOTAL}, {DB-PROD-UNITS})",
    status: VirtualTagStatus.UNCERTAIN,
    statusMessage: "Datos de producción irregulares",
  },
  {
    id: 6,
    tagUUID: "66666666-aaaa-bbbb-cccc-666666666666",
    enable: false,
    name: "VT-PRES-OK",
    description: "Indicador presión vapor en rango operativo",
    hierarchy: {
      planta: "Planta Sur",
      area: "Área Mantenimiento",
      seccion: "Sección Taller",
      equipo: "Banco-T01",
    },
    classification: DataClassification.VAPOR,
    virtualType: VirtualType.LOGICO,
    evaluateRate: 500,
    formula: "{P-PRES-VAPOR} > 2.5 AND {P-PRES-VAPOR} < 6.0",
    status: VirtualTagStatus.UNCERTAIN,
    statusMessage: "Tag deshabilitado",
  },
];

// ── Page component ────────────────────────────────────────────────────────────
export default function TagsVirtualesPage() {
  const [tags, setTags] = useState<VirtualTag[]>(MOCK_VIRTUAL_TAGS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<VirtualTag | null>(null);

  // Managed lists & hierarchy
  const [hierarchyData, setHierarchyData] = useState<HierarchyTree>(HIERARCHY_DATA);
  const [classifications, setClassifications] = useState<string[]>(Object.values(DataClassification));
  const [engUnits, setEngUnits] = useState<string[]>(Object.values(EngUnit));

  const nextId = () => Math.max(...tags.map((t) => t.id), 0) + 1;

  const handleAdd = (data: VirtualTagFormData) => {
    const newTag: VirtualTag = {
      ...data,
      id: nextId(),
      tagUUID: crypto.randomUUID(),
      status: VirtualTagStatus.UNCERTAIN,
      statusMessage: "Recién creado — pendiente de primera evaluación",
    };
    setTags((prev) => [...prev, newTag]);
  };

  const handleEdit = (tag: VirtualTag) => {
    setEditingTag(tag);
    setIsFormOpen(true);
  };

  const handleUpdate = (data: VirtualTagFormData) => {
    if (!editingTag) return;
    setTags((prev) =>
      prev.map((t) => (t.id === editingTag.id ? { ...t, ...data } : t))
    );
    setEditingTag(null);
  };

  const handleDelete = (id: number) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDuplicate = (tag: VirtualTag) => {
    const copy: VirtualTag = {
      ...tag,
      id: nextId(),
      tagUUID: crypto.randomUUID(),
      name: `${tag.name} (copia)`,
      status: VirtualTagStatus.UNCERTAIN,
      statusMessage: "Duplicado — pendiente de primera evaluación",
    };
    setTags((prev) => [...prev, copy]);
  };

  const handleToggleEnable = (id: number) => {
    setTags((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              enable: !t.enable,
              statusMessage: !t.enable ? "Habilitado" : "Deshabilitado por el usuario",
            }
          : t
      )
    );
  };

  const handleBulkEnable = (ids: number[]) => {
    const set = new Set(ids);
    setTags((prev) =>
      prev.map((t) =>
        set.has(t.id) ? { ...t, enable: true, statusMessage: "Habilitado" } : t
      )
    );
  };

  const handleBulkDisable = (ids: number[]) => {
    const set = new Set(ids);
    setTags((prev) =>
      prev.map((t) =>
        set.has(t.id)
          ? { ...t, enable: false, statusMessage: "Deshabilitado" }
          : t
      )
    );
  };

  const handleBulkDelete = (ids: number[]) => {
    const set = new Set(ids);
    setTags((prev) => prev.filter((t) => !set.has(t.id)));
  };

  const handleDialogClose = () => {
    setIsFormOpen(false);
    setEditingTag(null);
  };

  const handleDialogSubmit = (data: VirtualTagFormData) => {
    if (editingTag) {
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
            <h1 className="text-2xl font-bold text-slate-900">Tags Virtuales</h1>
            <p className="mt-1 text-sm text-slate-600">
              Tags calculados mediante expresiones sobre tags físicos — {tags.length} tag
              {tags.length !== 1 ? "s" : ""} configurado{tags.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Tag Virtual
          </Button>
        </div>
      </header>

      <VirtualTagsTable
        tags={tags}
        allPhysicalTags={MOCK_PHYSICAL_TAGS}
        onToggleEnable={handleToggleEnable}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onBulkEnable={handleBulkEnable}
        onBulkDisable={handleBulkDisable}
        onBulkDelete={handleBulkDelete}
      />

      <VirtualTagFormDialog
        open={isFormOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        editingTag={editingTag}
        existingTags={tags}
        allPhysicalTags={MOCK_PHYSICAL_TAGS}
        hierarchyData={hierarchyData}
        onHierarchyChange={setHierarchyData}
        classifications={classifications}
        onClassificationsChange={setClassifications}
        engUnits={engUnits}
        onEngUnitsChange={setEngUnits}
      />
    </section>
  );
}
