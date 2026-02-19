"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhysicalTagsTable } from "./components/PhysicalTagsTable/PhysicalTagsTable";
import { TagFormDialog } from "./components/TagFormDialog/TagFormDialog";
import {
  DataClassification,
  EngUnit,
  ReadMode,
  ScalingType,
  TagStatus,
  type PhysicalTag,
  type PhysicalTagFormData,
} from "./types/physical-tag.types";
import { HIERARCHY_DATA, type HierarchyTree } from "./types/hierarchy.data";
import type { ServerRef } from "./components/PhysicalTagsTable/PhysicalTagsTable.types";

// ── Mock servers (mirroring data-sources/servers mock) ──────────────────────
const MOCK_SERVERS: ServerRef[] = [
  { id: 1, name: "PLC-001", driver: "Modbus TCP" },
  { id: 2, name: "HIST-DB-01", driver: "Data Base SQL" },
  { id: 3, name: "MQTT-DEV", driver: "MQTT" },
  { id: 4, name: "SCADA-OPC-01", driver: "OPC UA" },
];

// ── Mock tags ────────────────────────────────────────────────────────────────
const MOCK_TAGS: PhysicalTag[] = [
  {
    id: 1,
    tagUUID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    enable: true,
    name: "T-TEMP-001",
    description: "Temperatura entrada horno principal",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Producción",
      seccion: "Sección Moldeado",
      equipo: "Moldeadora-M01",
    },
    serverId: 4,
    origin: "ns=2;s=Planta.Horno1.Temp",
    scanRate: 500,
    readMode: ReadMode.SUBSCRIPTION,
    classification: DataClassification.TEMPERATURA,
    engUnit: EngUnit.CELSIUS,
    status: TagStatus.OK,
    statusMessage: "Última lectura: 245.3°C",
  },
  {
    id: 2,
    tagUUID: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    enable: true,
    name: "E-KW-TOTAL",
    description: "Consumo eléctrico total Planta Norte",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Utilities",
      seccion: "Sección Eléctrica",
      equipo: "Cuadro-QE01",
    },
    serverId: 1,
    origin: "40001",
    scanRate: 1000,
    readMode: ReadMode.POLLING,
    classification: DataClassification.ELECTRICIDAD,
    engUnit: EngUnit.KW,
    scaling: {
      type: ScalingType.LINEAR,
      rawLow: 0,
      rawHigh: 65535,

      scaledLow: 0,
      scaledHigh: 1000,
      clampLow: true,
      clampHigh: true,
      negateValue: false,
    },
    status: TagStatus.OK,
    statusMessage: "Online",
  },
  {
    id: 3,
    tagUUID: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    enable: false,
    name: "F-FLOW-HH2O",
    description: "Caudal agua refrigeración",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Utilities",
      seccion: "Sección HVAC",
      equipo: "Unidad-H01",
    },
    serverId: 3,
    origin: "sensors/flow/cooling/main",
    scanRate: 2000,
    classification: DataClassification.AGUA,
    engUnit: EngUnit.M3_H,
    status: TagStatus.NO_DATA,
    statusMessage: "Driver deshabilitado",
  },
  {
    id: 4,
    tagUUID: "d4e5f6a7-b8c9-0123-defa-234567890123",
    enable: true,
    name: "P-PRES-VAPOR",
    description: "Presión vapor saturado",
    hierarchy: {
      planta: "Planta Sur",
      area: "Área Mantenimiento",
      seccion: "Sección Taller",
      equipo: "Banco-T01",
    },
    serverId: 4,
    origin: "ns=2;s=Planta.Vapor.Presion",
    scanRate: 500,
    readMode: ReadMode.SUBSCRIPTION,
    classification: DataClassification.VAPOR,
    engUnit: EngUnit.BAR,
    status: TagStatus.UNCERTAIN,
    statusMessage: "Señal débil - retardo > 2s",
  },
  {
    id: 5,
    tagUUID: "e5f6a7b8-c9d0-1234-efab-345678901234",
    enable: true,
    name: "DB-PROD-UNITS",
    description: "Unidades producidas acumuladas (SQL)",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Producción",
      seccion: "Sección Ensamblado",
      equipo: "Mesa-E01",
    },
    serverId: 2,
    origin: "units_produced",
    scanRate: 60000,
    classification: DataClassification.OTRO,
    status: TagStatus.BAD,
    statusMessage: "Query timeout - reintentos agotados",
  },
  {
    id: 6,
    tagUUID: "f6a7b8c9-d0e1-2345-fabc-456789012345",
    enable: true,
    name: "T-TEMP-002",
    description: "Temperatura salida horno principal",
    hierarchy: {
      planta: "Planta Norte",
      area: "Área Producción",
      seccion: "Sección Moldeado",
      equipo: "Moldeadora-M01",
    },
    serverId: 4,
    origin: "ns=2;s=Planta.Horno1.TempOut",
    scanRate: 500,
    readMode: ReadMode.SUBSCRIPTION,
    classification: DataClassification.TEMPERATURA,
    engUnit: EngUnit.CELSIUS,
    status: TagStatus.OK,
    statusMessage: "Última lectura: 189.7°C",
  },
];

// ── Page component ────────────────────────────────────────────────────────────
export default function TagsFisicosPage() {
  const [tags, setTags] = useState<PhysicalTag[]>(MOCK_TAGS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<PhysicalTag | null>(null);

  // Managed lists & hierarchy
  const [hierarchyData, setHierarchyData] = useState<HierarchyTree>(HIERARCHY_DATA);
  const [classifications, setClassifications] = useState<string[]>(Object.values(DataClassification));
  const [engUnits, setEngUnits] = useState<string[]>(Object.values(EngUnit));

  const nextId = () => Math.max(...tags.map((t) => t.id), 0) + 1;

  const handleAdd = (data: PhysicalTagFormData) => {
    const newTag: PhysicalTag = {
      ...data,
      id: nextId(),
      tagUUID: crypto.randomUUID(),
      status: TagStatus.NO_DATA,
      statusMessage: "Recién creado — pendiente de primera lectura",
    };
    setTags((prev) => [...prev, newTag]);
  };

  const handleEdit = (tag: PhysicalTag) => {
    setEditingTag(tag);
    setIsFormOpen(true);
  };

  const handleUpdate = (data: PhysicalTagFormData) => {
    if (!editingTag) return;
    setTags((prev) =>
      prev.map((t) => (t.id === editingTag.id ? { ...t, ...data } : t))
    );
    setEditingTag(null);
  };

  const handleDelete = (id: number) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDuplicate = (tag: PhysicalTag) => {
    const copy: PhysicalTag = {
      ...tag,
      id: nextId(),
      tagUUID: crypto.randomUUID(),
      name: `${tag.name} (copia)`,
      status: TagStatus.NO_DATA,
      statusMessage: "Duplicado — pendiente de primera lectura",
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
              status: !t.enable ? TagStatus.NO_DATA : TagStatus.NO_DATA,
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
          ? { ...t, enable: false, status: TagStatus.NO_DATA, statusMessage: "Deshabilitado" }
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

  const handleDialogSubmit = (data: PhysicalTagFormData) => {
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
            <h1 className="text-2xl font-bold text-slate-900">Tags Físicos</h1>
            <p className="mt-1 text-sm text-slate-600">
              Gestiona los tags asociados a servidores de datos — {tags.length} tag
              {tags.length !== 1 ? "s" : ""} configurado{tags.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Tag Físico
          </Button>
        </div>
      </header>

      <PhysicalTagsTable
        tags={tags}
        servers={MOCK_SERVERS}
        onToggleEnable={handleToggleEnable}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onBulkEnable={handleBulkEnable}
        onBulkDisable={handleBulkDisable}
        onBulkDelete={handleBulkDelete}
      />

      <TagFormDialog
        open={isFormOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        editingTag={editingTag}
        existingTags={tags}
        servers={MOCK_SERVERS}
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
