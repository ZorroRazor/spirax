"use client";

import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import type { HierarchyTree } from "../../types/hierarchy.data";
import type { AssetHierarchy } from "../../types/physical-tag.types";

interface HierarchyTreeSelectorProps {
  value: AssetHierarchy;
  onChange: (h: AssetHierarchy) => void;
  hierarchyData: HierarchyTree;
}

const EMPTY: AssetHierarchy = { planta: "", area: "", seccion: "", equipo: "" };

// Returns true if this node is part of the selected path
function isOnPath(
  value: AssetHierarchy,
  planta?: string,
  area?: string,
  seccion?: string,
  equipo?: string
): boolean {
  if (planta && value.planta !== planta) return false;
  if (area !== undefined && value.area !== area) return false;
  if (seccion !== undefined && value.seccion !== seccion) return false;
  if (equipo !== undefined && value.equipo !== equipo) return false;
  return true;
}

// The exact selected node (all levels match and no deeper selection)
function isSelected(
  value: AssetHierarchy,
  planta?: string,
  area?: string,
  seccion?: string,
  equipo?: string
): boolean {
  if (planta && value.planta !== planta) return false;
  if (area !== undefined && value.area !== area) return false;
  if (seccion !== undefined && value.seccion !== seccion) return false;
  if (equipo !== undefined && value.equipo !== equipo) return false;
  // Check that we're at the right depth (nothing selected below this level)
  if (equipo !== undefined) return true;
  if (seccion !== undefined) return !value.equipo;
  if (area !== undefined) return !value.seccion;
  if (planta !== undefined) return !value.area;
  return false;
}

export function HierarchyTreeSelector({
  value,
  onChange,
  hierarchyData,
}: HierarchyTreeSelectorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Auto-expand the selected path
  useEffect(() => {
    if (value.planta) {
      const next = new Set<string>();
      next.add(value.planta);
      if (value.area) next.add(`${value.planta}/${value.area}`);
      if (value.seccion) next.add(`${value.planta}/${value.area}/${value.seccion}`);
      setExpanded(next);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectPlanta = (planta: string) => {
    const key = planta;
    setExpanded((prev) => new Set([...prev, key]));
    onChange({ ...EMPTY, planta });
  };

  const selectArea = (planta: string, area: string) => {
    const key = `${planta}/${area}`;
    setExpanded((prev) => new Set([...prev, planta, key]));
    onChange({ planta, area, seccion: "", equipo: "" });
  };

  const selectSeccion = (planta: string, area: string, seccion: string) => {
    const key = `${planta}/${area}/${seccion}`;
    setExpanded((prev) => new Set([...prev, planta, `${planta}/${area}`, key]));
    onChange({ planta, area, seccion, equipo: "" });
  };

  const selectEquipo = (planta: string, area: string, seccion: string, equipo: string) => {
    setExpanded((prev) => new Set([...prev, planta, `${planta}/${area}`, `${planta}/${area}/${seccion}`]));
    onChange({ planta, area, seccion, equipo });
  };

  const nodeClass = (selected: boolean, onPath: boolean) =>
    `flex items-center gap-1 w-full text-left rounded px-1.5 py-0.5 text-sm cursor-pointer transition ${
      selected
        ? "bg-slate-900 text-white font-medium"
        : onPath
        ? "bg-slate-100 text-slate-800"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  const breadcrumb = [value.planta, value.area, value.seccion, value.equipo]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="space-y-1">
      <div className="rounded-md border border-slate-200 bg-white p-2 max-h-52 overflow-y-auto">
        {Object.keys(hierarchyData).length === 0 && (
          <p className="text-xs text-slate-400 p-2 text-center">
            Sin jerarquía configurada.
          </p>
        )}
        {Object.keys(hierarchyData).map((planta) => {
          const plantaKey = planta;
          const plantaExpanded = expanded.has(plantaKey);
          const plantaOnPath = value.planta === planta;
          const plantaSelected = isSelected(value, planta);

          return (
            <div key={planta}>
              {/* Planta */}
              <button
                type="button"
                className={nodeClass(plantaSelected, plantaOnPath)}
                onClick={() => selectPlanta(planta)}
              >
                <span
                  className="flex-shrink-0"
                  onClick={(e) => toggle(plantaKey, e)}
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${plantaExpanded ? "rotate-90" : ""}`}
                  />
                </span>
                <span className="font-medium">{planta}</span>
              </button>

              {plantaExpanded && (
                <div className="ml-4">
                  {Object.keys(hierarchyData[planta] ?? {}).map((area) => {
                    const areaKey = `${planta}/${area}`;
                    const areaExpanded = expanded.has(areaKey);
                    const areaOnPath = plantaOnPath && value.area === area;
                    const areaSelected = isSelected(value, planta, area);

                    return (
                      <div key={area}>
                        {/* Área */}
                        <button
                          type="button"
                          className={nodeClass(areaSelected, areaOnPath)}
                          onClick={() => selectArea(planta, area)}
                        >
                          <span
                            className="flex-shrink-0"
                            onClick={(e) => toggle(areaKey, e)}
                          >
                            <ChevronRight
                              className={`h-3.5 w-3.5 transition-transform ${areaExpanded ? "rotate-90" : ""}`}
                            />
                          </span>
                          {area}
                        </button>

                        {areaExpanded && (
                          <div className="ml-4">
                            {Object.keys(hierarchyData[planta]?.[area] ?? {}).map((seccion) => {
                              const secKey = `${planta}/${area}/${seccion}`;
                              const secExpanded = expanded.has(secKey);
                              const secOnPath = areaOnPath && value.seccion === seccion;
                              const secSelected = isSelected(value, planta, area, seccion);

                              return (
                                <div key={seccion}>
                                  {/* Sección */}
                                  <button
                                    type="button"
                                    className={nodeClass(secSelected, secOnPath)}
                                    onClick={() => selectSeccion(planta, area, seccion)}
                                  >
                                    <span
                                      className="flex-shrink-0"
                                      onClick={(e) => toggle(secKey, e)}
                                    >
                                      <ChevronRight
                                        className={`h-3.5 w-3.5 transition-transform ${secExpanded ? "rotate-90" : ""}`}
                                      />
                                    </span>
                                    {seccion}
                                  </button>

                                  {secExpanded && (
                                    <div className="ml-4">
                                      {(hierarchyData[planta]?.[area]?.[seccion] ?? []).map(
                                        (equipo) => {
                                          const eqSelected = isSelected(
                                            value, planta, area, seccion, equipo
                                          );
                                          const eqOnPath = secOnPath && value.equipo === equipo;
                                          return (
                                            <button
                                              key={equipo}
                                              type="button"
                                              className={nodeClass(eqSelected, eqOnPath)}
                                              onClick={() =>
                                                selectEquipo(planta, area, seccion, equipo)
                                              }
                                            >
                                              <span className="h-3.5 w-3.5 flex-shrink-0 text-slate-400">•</span>
                                              {equipo}
                                            </button>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Breadcrumb */}
      <p className="text-xs text-slate-500 min-h-[1rem]">
        {breadcrumb ? (
          <span>
            <span className="font-medium text-slate-700">Seleccionado:</span> {breadcrumb}
          </span>
        ) : (
          <span className="italic">Sin selección</span>
        )}
      </p>
    </div>
  );
}
