"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HIERARCHY_DATA } from "../../types/hierarchy.data";
import type { AssetHierarchy } from "../../types/physical-tag.types";

interface AssetHierarchySelectorProps {
  value: AssetHierarchy;
  onChange: (h: AssetHierarchy) => void;
}

const EMPTY = "";

export function AssetHierarchySelector({
  value,
  onChange,
}: AssetHierarchySelectorProps) {
  const plantas = Object.keys(HIERARCHY_DATA);

  const areas = value.planta
    ? Object.keys(HIERARCHY_DATA[value.planta] ?? {})
    : [];

  const secciones =
    value.planta && value.area
      ? Object.keys(HIERARCHY_DATA[value.planta]?.[value.area] ?? {})
      : [];

  const equipos =
    value.planta && value.area && value.seccion
      ? (HIERARCHY_DATA[value.planta]?.[value.area]?.[value.seccion] ?? [])
      : [];

  const handlePlantaChange = (planta: string) => {
    onChange({ planta, area: EMPTY, seccion: EMPTY, equipo: EMPTY });
  };

  const handleAreaChange = (area: string) => {
    onChange({ ...value, area, seccion: EMPTY, equipo: EMPTY });
  };

  const handleSeccionChange = (seccion: string) => {
    onChange({ ...value, seccion, equipo: EMPTY });
  };

  const handleEquipoChange = (equipo: string) => {
    onChange({ ...value, equipo });
  };

  return (
    <div className="space-y-2">
      <Label>Jerarquía de Activos *</Label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Planta</Label>
          <Select value={value.planta || EMPTY} onValueChange={handlePlantaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona planta…" />
            </SelectTrigger>
            <SelectContent>
              {plantas.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Área</Label>
          <Select
            value={value.area || EMPTY}
            onValueChange={handleAreaChange}
            disabled={!value.planta}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona área…" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Sección</Label>
          <Select
            value={value.seccion || EMPTY}
            onValueChange={handleSeccionChange}
            disabled={!value.area}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona sección…" />
            </SelectTrigger>
            <SelectContent>
              {secciones.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Equipo</Label>
          <Select
            value={value.equipo || EMPTY}
            onValueChange={handleEquipoChange}
            disabled={!value.seccion}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona equipo…" />
            </SelectTrigger>
            <SelectContent>
              {equipos.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
