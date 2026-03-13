"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { Building2, Boxes, MapPin, ChevronRight, ChevronDown, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GeoMarker } from "./components/MapView";

const MapView = dynamic(
  () => import("./components/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-400">Cargando mapa…</div> }
);

// ── Geo data ───────────────────────────────────────────────────────────────────
type AreaData = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sectionCount: number;
};

type SectionData = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  areaName?: string;
};

type PlantData = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  areas: AreaData[];
  sections: SectionData[];
};

const PLANTS: PlantData[] = [
  {
    id: "planta-norte",
    name: "Planta Norte",
    description: "Planta de producción norte",
    lat: 43.2627,
    lng: -2.9253,
    areas: [
      { id: "area-prod", name: "Área Producción", lat: 43.2628, lng: -2.9251, sectionCount: 3 },
    ],
    sections: [
      { id: "sec-moldeado", name: "Sección Moldeado", lat: 43.2629, lng: -2.9249, areaName: "Área Producción" },
      { id: "sec-acabado", name: "Sección Acabado", lat: 43.2625, lng: -2.9255, areaName: "Área Producción" },
      { id: "sec-ensam", name: "Sección Ensamblado", lat: 43.2631, lng: -2.9247, areaName: "Área Producción" },
      { id: "sec-hvac", name: "Sección HVAC", lat: 43.2623, lng: -2.9258, areaName: "Área Utilities" },
      { id: "sec-elec", name: "Sección Eléctrica", lat: 43.2633, lng: -2.9245, areaName: "Área Utilities" },
      { id: "sec-entrada", name: "Sección Entrada", lat: 43.2621, lng: -2.9261, areaName: "Área Almacén" },
      { id: "sec-salida", name: "Sección Salida", lat: 43.2635, lng: -2.9243, areaName: "Área Almacén" },
    ],
  },
  {
    id: "planta-sur",
    name: "Planta Sur",
    description: "Planta logística y mantenimiento",
    lat: 37.3926,
    lng: -5.9911,
    areas: [],
    sections: [
      { id: "sec-recep", name: "Sección Recepción", lat: 37.3928, lng: -5.9908, areaName: "Área Logística" },
      { id: "sec-exped", name: "Sección Expedición", lat: 37.3924, lng: -5.9914, areaName: "Área Logística" },
      { id: "sec-taller", name: "Sección Taller", lat: 37.3930, lng: -5.9905, areaName: "Área Mantenimiento" },
      { id: "sec-repuest", name: "Sección Repuestos", lat: 37.3922, lng: -5.9917, areaName: "Área Mantenimiento" },
    ],
  },
];

type Filter = "all" | "planta" | "area" | "seccion";

const FILTER_LABELS: Record<Filter, string> = {
  all: "Todo",
  planta: "Plantas",
  area: "Áreas",
  seccion: "Secciones",
};

// ── Panel row components ───────────────────────────────────────────────────────
function PlantRow({
  plant, focusId, expanded, onFocus, onToggle,
}: {
  plant: PlantData;
  focusId: string | null;
  expanded: boolean;
  onFocus: (id: string) => void;
  onToggle: () => void;
}) {
  const isActive = focusId === plant.id;
  const totalGeo = plant.areas.length + plant.sections.length;

  return (
    <div className="select-none">
      <button
        onClick={() => { onFocus(plant.id); onToggle(); }}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
          isActive ? "bg-sky-50" : "hover:bg-zinc-50"
        }`}
      >
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isActive ? "bg-sky-600" : "bg-zinc-200"
        }`}>
          <Building2 className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-zinc-500"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium truncate ${isActive ? "text-sky-700" : "text-zinc-800"}`}>
            {plant.name}
          </p>
          <p className="text-xs text-zinc-400 truncate">{plant.description}</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">{totalGeo}</Badge>
        {expanded
          ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
      </button>

      {expanded && (
        <div className="ml-4 border-l border-zinc-100 pl-3 pb-1 space-y-0.5">
          {/* Areas */}
          {plant.areas.map((area) => {
            const areaActive = focusId === area.id;
            return (
              <button
                key={area.id}
                onClick={() => onFocus(area.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                  areaActive ? "bg-emerald-50" : "hover:bg-zinc-50"
                }`}
              >
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  areaActive ? "bg-emerald-600" : "bg-zinc-100"
                }`}>
                  <Network className={`h-3 w-3 ${areaActive ? "text-white" : "text-zinc-400"}`} />
                </div>
                <span className={`flex-1 truncate text-xs font-medium ${
                  areaActive ? "text-emerald-700" : "text-zinc-600"
                }`}>
                  {area.name}
                </span>
                <div className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3 text-zinc-300" />
                  <span className="font-mono text-[10px] text-zinc-300">{area.lat.toFixed(4)}</span>
                </div>
              </button>
            );
          })}

          {/* Sections */}
          {plant.sections.map((sec) => {
            const secActive = focusId === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => onFocus(sec.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                  secActive ? "bg-amber-50" : "hover:bg-zinc-50"
                }`}
              >
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  secActive ? "bg-amber-500" : "bg-zinc-100"
                }`}>
                  <Boxes className={`h-3 w-3 ${secActive ? "text-white" : "text-zinc-400"}`} />
                </div>
                <span className={`flex-1 truncate text-xs font-medium ${
                  secActive ? "text-amber-700" : "text-zinc-600"
                }`}>
                  {sec.name}
                </span>
                <div className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3 text-zinc-300" />
                  <span className="font-mono text-[10px] text-zinc-300">{sec.lat.toFixed(4)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MapsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [expandedPlants, setExpandedPlants] = useState<Set<string>>(new Set(["planta-norte"]));

  const toggleExpand = (id: string) => {
    setExpandedPlants((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const markers = useMemo<GeoMarker[]>(() => {
    const out: GeoMarker[] = [];
    PLANTS.forEach((p) => {
      if (filter === "all" || filter === "planta") {
        out.push({
          id: p.id, name: p.name, type: "planta",
          lat: p.lat, lng: p.lng,
          description: p.description,
          areaCount: p.areas.length,
          sectionCount: p.sections.length,
        });
      }
      if (filter === "all" || filter === "area") {
        p.areas.forEach((a) => out.push({
          id: a.id, name: a.name, type: "area",
          lat: a.lat, lng: a.lng,
          plantName: p.name,
          sectionCount: a.sectionCount,
        }));
      }
      if (filter === "all" || filter === "seccion") {
        p.sections.forEach((s) => out.push({
          id: s.id, name: s.name, type: "seccion",
          lat: s.lat, lng: s.lng,
          plantName: s.areaName ? `${p.name} · ${s.areaName}` : p.name,
        }));
      }
    });
    return out;
  }, [filter]);

  const totalAreas = PLANTS.reduce((a, p) => a + p.areas.length, 0);
  const totalSections = PLANTS.reduce((a, p) => a + p.sections.length, 0);

  const handleMarkerClick = (id: string) => {
    setFocusId(id);
    const plant = PLANTS.find(
      (p) => p.areas.some((a) => a.id === id) || p.sections.some((s) => s.id === id)
    );
    if (plant) setExpandedPlants((prev) => new Set([...prev, plant.id]));
  };

  return (
    <section className="flex h-[calc(100vh-5rem)] flex-col gap-3">
      {/* Header */}
      <header className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
            <MapPin className="h-4 w-4 text-sky-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Mapa de activos</h1>
            <p className="text-xs text-zinc-400">
              {PLANTS.length} plantas · {totalAreas} áreas · {totalSections} secciones
            </p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
          {(["all", "planta", "area", "seccion"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filter === f ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-3">
        {/* Left panel */}
        <aside className="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              Jerarquía de activos
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {PLANTS.map((plant) => (
              <PlantRow
                key={plant.id}
                plant={plant}
                focusId={focusId}
                expanded={expandedPlants.has(plant.id)}
                onFocus={setFocusId}
                onToggle={() => toggleExpand(plant.id)}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="border-t border-zinc-100 p-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400 mb-2">Leyenda</p>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600">
                <Building2 className="h-2.5 w-2.5 text-white" />
              </span>
              <span className="text-xs text-zinc-600">Planta</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600">
                <Network className="h-2 w-2 text-white" />
              </span>
              <span className="text-xs text-zinc-600">Área</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
                <Boxes className="h-2 w-2 text-white" />
              </span>
              <span className="text-xs text-zinc-600">Sección</span>
            </div>
          </div>
        </aside>

        {/* Map */}
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
          <MapView markers={markers} focusId={focusId} onMarkerClick={handleMarkerClick} />
        </div>
      </div>
    </section>
  );
}
