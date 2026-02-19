"use client";

import { useState, useEffect } from "react";
import { Settings2, GitBranch } from "lucide-react";
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
import { HierarchyTreeSelector } from "../HierarchyTreeSelector/HierarchyTreeSelector";
import { HierarchyManagerDialog } from "../HierarchyManagerDialog/HierarchyManagerDialog";
import { ManageListDialog } from "../ManageListDialog/ManageListDialog";
import {
  ReadMode,
  ScalingType,
  type AssetHierarchy,
  type PhysicalTagScaling,
} from "../../types/physical-tag.types";
import type { TagFormDialogProps } from "./TagFormDialog.types";

type TabId = "basico" | "origen" | "escalado";

const TABS: { id: TabId; label: string }[] = [
  { id: "basico", label: "Básico" },
  { id: "origen", label: "Origen y Adquisición" },
  { id: "escalado", label: "Escalado" },
];

const EMPTY_HIERARCHY: AssetHierarchy = { planta: "", area: "", seccion: "", equipo: "" };

const SCALING_FORMULAS: Record<string, string> = {
  [ScalingType.LINEAR]:
    "((ScaledHigh − ScaledLow) / (RawHigh − RawLow)) × (RawValue − RawLow) + ScaledLow",
  [ScalingType.SQUARE_ROOT]:
    "sqrt((RawValue − RawLow) / (RawHigh − RawLow)) × (ScaledHigh − ScaledLow) + ScaledLow",
};

export function TagFormDialog({
  open,
  onClose,
  onSubmit,
  editingTag,
  existingTags,
  servers,
  hierarchyData,
  onHierarchyChange,
  classifications,
  onClassificationsChange,
  engUnits,
  onEngUnitsChange,
}: TagFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("basico");

  // ── Tab 1: Básico ──────────────────────────────────────────────────────────
  const [enable, setEnable] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hierarchy, setHierarchy] = useState<AssetHierarchy>(EMPTY_HIERARCHY);
  const [classification, setClassification] = useState("");
  const [engUnit, setEngUnit] = useState("");

  // ── Tab 2: Origen ──────────────────────────────────────────────────────────
  const [serverId, setServerId] = useState<number | "">("");
  const [origin, setOrigin] = useState("");
  const [scanRate, setScanRate] = useState(1000);
  const [readMode, setReadMode] = useState("");

  // ── Tab 3: Escalado ────────────────────────────────────────────────────────
  const [scalingEnabled, setScalingEnabled] = useState(false);
  const [scalingType, setScalingType] = useState<ScalingType>(ScalingType.NONE);
  const [rawLow, setRawLow] = useState<number | "">("");
  const [rawHigh, setRawHigh] = useState<number | "">("");
  const [scaledLow, setScaledLow] = useState<number | "">("");
  const [scaledHigh, setScaledHigh] = useState<number | "">("");
  const [clampLow, setClampLow] = useState(false);
  const [clampHigh, setClampHigh] = useState(false);
  const [negateValue, setNegateValue] = useState(false);

  // ── Manage list / hierarchy dialogs ────────────────────────────────────────
  const [manageClassifications, setManageClassifications] = useState(false);
  const [manageUnits, setManageUnits] = useState(false);
  const [manageHierarchy, setManageHierarchy] = useState(false);

  // ── Errors ─────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Load existing ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setActiveTab("basico");
    setErrors({});

    if (editingTag) {
      setEnable(editingTag.enable);
      setName(editingTag.name);
      setDescription(editingTag.description ?? "");
      setHierarchy(editingTag.hierarchy);
      setClassification(editingTag.classification ?? "");
      setEngUnit(editingTag.engUnit ?? "");
      setServerId(editingTag.serverId);
      setOrigin(editingTag.origin);
      setScanRate(editingTag.scanRate);
      setReadMode(editingTag.readMode ?? "");

      const sc = editingTag.scaling;
      if (sc) {
        setScalingEnabled(true);
        setScalingType(sc.type);
        setRawLow(sc.rawLow ?? "");
        setRawHigh(sc.rawHigh ?? "");
        setScaledLow(sc.scaledLow ?? "");
        setScaledHigh(sc.scaledHigh ?? "");
        setClampLow(sc.clampLow ?? false);
        setClampHigh(sc.clampHigh ?? false);
        setNegateValue(sc.negateValue ?? false);
      } else {
        setScalingEnabled(false);
        setScalingType(ScalingType.NONE);
        setRawLow(""); setRawHigh("");
        setScaledLow(""); setScaledHigh("");
        setClampLow(false); setClampHigh(false); setNegateValue(false);
      }
    } else {
      setEnable(true);
      setName(""); setDescription("");
      setHierarchy(EMPTY_HIERARCHY);
      setClassification(""); setEngUnit("");
      setServerId(""); setOrigin("");
      setScanRate(1000); setReadMode("");
      setScalingEnabled(false);
      setScalingType(ScalingType.NONE);
      setRawLow(""); setRawHigh("");
      setScaledLow(""); setScaledHigh("");
      setClampLow(false); setClampHigh(false); setNegateValue(false);
    }
  }, [editingTag, open]);

  // Reset type to NONE whenever scaling is enabled
  const handleScalingToggle = (checked: boolean) => {
    setScalingEnabled(checked);
    if (checked) setScalingType(ScalingType.NONE);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    } else {
      const dup = existingTags.find((t) => t.name === name.trim() && t.id !== editingTag?.id);
      if (dup) newErrors.name = "Ya existe un tag con ese nombre";
    }

    if (!serverId) newErrors.serverId = "Debes seleccionar un servidor";
    if (!origin.trim()) newErrors.origin = "El origen del dato es obligatorio";

    if (scanRate < 100 || scanRate > 3600000) {
      newErrors.scanRate = "Debe estar entre 100 ms y 3600000 ms (1 hora)";
    }

    if (scalingEnabled && scalingType !== ScalingType.NONE) {
      if (rawLow === "") newErrors.rawLow = "Obligatorio";
      if (rawHigh === "") newErrors.rawHigh = "Obligatorio";
      if (scaledLow === "") newErrors.scaledLow = "Obligatorio";
      if (scaledHigh === "") newErrors.scaledHigh = "Obligatorio";
    }

    setErrors(newErrors);

    if (newErrors.name) setActiveTab("basico");
    else if (newErrors.serverId || newErrors.origin || newErrors.scanRate) setActiveTab("origen");
    else if (newErrors.rawLow || newErrors.rawHigh || newErrors.scaledLow || newErrors.scaledHigh) setActiveTab("escalado");

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const scaling: PhysicalTagScaling | undefined = scalingEnabled
      ? {
          type: scalingType,
          ...(scalingType !== ScalingType.NONE && {
            rawLow: Number(rawLow),
            rawHigh: Number(rawHigh),
            scaledLow: Number(scaledLow),
            scaledHigh: Number(scaledHigh),
          }),
          clampLow, clampHigh, negateValue,
        }
      : undefined;

    onSubmit({
      enable,
      name: name.trim(),
      description: description.trim() || undefined,
      hierarchy,
      serverId: Number(serverId),
      origin: origin.trim(),
      scanRate,
      readMode: (readMode as ReadMode) || undefined,
      classification: classification || undefined,
      engUnit: engUnit || undefined,
      scaling,
    });
    onClose();
  };

  const isEdit = !!editingTag;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          key={editingTag?.id ?? "new"}
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {isEdit ? `Editar Tag: ${editingTag.name}` : "Nuevo Tag Físico"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Modifica la configuración del tag"
                : "Configura un nuevo tag físico asociado a un servidor de datos"}
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
                      placeholder="Ej: T-TEMP-001"
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
                      placeholder="Descripción funcional del tag"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

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

                </div>
              )}

              {/* ── Tab 2: Origen y Adquisición ───────────────────────── */}
              {activeTab === "origen" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Servidor *</Label>
                    <Select
                      value={String(serverId)}
                      onValueChange={(v) => setServerId(Number(v))}
                    >
                      <SelectTrigger className={errors.serverId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Selecciona un servidor…" />
                      </SelectTrigger>
                      <SelectContent>
                        {servers.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name} ({s.driver})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.serverId && <p className="text-xs text-red-500">{errors.serverId}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="origin">Origen del dato *</Label>
                    <Input
                      id="origin"
                      placeholder="ns=2;s=Temperature.T1  /  40001  /  sensors/temp  /  col_value"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className={errors.origin ? "border-red-500" : ""}
                    />
                    {errors.origin && <p className="text-xs text-red-500">{errors.origin}</p>}
                    <p className="text-xs text-slate-500">
                      NodeId (OPC UA), registro Modbus, topic MQTT, columna SQL, etc.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scanRate">Scan Rate (ms) *</Label>
                      <Input
                        id="scanRate"
                        type="number"
                        min={100}
                        max={3600000}
                        value={scanRate}
                        onChange={(e) => setScanRate(Number(e.target.value))}
                        className={errors.scanRate ? "border-red-500" : ""}
                      />
                      {errors.scanRate && <p className="text-xs text-red-500">{errors.scanRate}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Modo de lectura</Label>
                      <Select
                        value={readMode || "__none__"}
                        onValueChange={(v) => setReadMode(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Por defecto —</SelectItem>
                          {Object.values(ReadMode).map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 3: Escalado ──────────────────────────────────── */}
              {activeTab === "escalado" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scalingEnabled"
                      checked={scalingEnabled}
                      onCheckedChange={(c) => handleScalingToggle(c as boolean)}
                    />
                    <Label htmlFor="scalingEnabled">Activar escalado</Label>
                  </div>

                  {scalingEnabled && (
                    <div className="space-y-4 rounded-md border border-slate-200 p-4">
                      <div className="space-y-2">
                        <Label>Type *</Label>
                        <Select
                          value={scalingType}
                          onValueChange={(v) => setScalingType(v as ScalingType)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.values(ScalingType).map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {scalingType !== ScalingType.NONE && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Raw Low *</Label>
                              <Input
                                type="number"
                                value={rawLow}
                                onChange={(e) => setRawLow(e.target.value === "" ? "" : Number(e.target.value))}
                                className={errors.rawLow ? "border-red-500" : ""}
                              />
                              {errors.rawLow && <p className="text-xs text-red-500">{errors.rawLow}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Raw High *</Label>
                              <Input
                                type="number"
                                value={rawHigh}
                                onChange={(e) => setRawHigh(e.target.value === "" ? "" : Number(e.target.value))}
                                className={errors.rawHigh ? "border-red-500" : ""}
                              />
                              {errors.rawHigh && <p className="text-xs text-red-500">{errors.rawHigh}</p>}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Scaled Low *</Label>
                              <Input
                                type="number"
                                value={scaledLow}
                                onChange={(e) => setScaledLow(e.target.value === "" ? "" : Number(e.target.value))}
                                className={errors.scaledLow ? "border-red-500" : ""}
                              />
                              {errors.scaledLow && <p className="text-xs text-red-500">{errors.scaledLow}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Scaled High *</Label>
                              <Input
                                type="number"
                                value={scaledHigh}
                                onChange={(e) => setScaledHigh(e.target.value === "" ? "" : Number(e.target.value))}
                                className={errors.scaledHigh ? "border-red-500" : ""}
                              />
                              {errors.scaledHigh && <p className="text-xs text-red-500">{errors.scaledHigh}</p>}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="clampLow" checked={clampLow} onCheckedChange={(c) => setClampLow(c as boolean)} />
                              <Label htmlFor="clampLow">Clamp Low</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="clampHigh" checked={clampHigh} onCheckedChange={(c) => setClampHigh(c as boolean)} />
                              <Label htmlFor="clampHigh">Clamp High</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="negateValue" checked={negateValue} onCheckedChange={(c) => setNegateValue(c as boolean)} />
                              <Label htmlFor="negateValue">Negate Value</Label>
                            </div>
                          </div>

                          {SCALING_FORMULAS[scalingType] && (
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-medium text-slate-600 mb-1">Fórmula:</p>
                              <p className="font-mono text-xs text-slate-700">
                                {scalingType}: {SCALING_FORMULAS[scalingType]}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {!scalingEnabled && (
                    <p className="text-sm text-slate-500">
                      Activa el escalado para aplicar transformación lineal o raíz cuadrada al valor raw.
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">{isEdit ? "Guardar cambios" : "Crear tag"}</Button>
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
