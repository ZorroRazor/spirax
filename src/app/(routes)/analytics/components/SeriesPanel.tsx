"use client";

import { useState } from "react";
import { Plus, Trash2, EyeOff, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { SeriesConfig, TagRef } from "../types/analytics.types";
import { AggregationFn, DataSource } from "../types/analytics.types";
import { SERIES_COLORS, ALL_TAGS } from "../utils/mockData";

type Props = {
  series: SeriesConfig[];
  onAdd: (s: SeriesConfig) => void;
  onRemove: (id: string) => void;
  onUpdate: (s: SeriesConfig) => void;
};

const SOURCE_BADGE: Record<DataSource, string> = {
  [DataSource.PHYSICAL]: "bg-blue-100 text-blue-700",
  [DataSource.VIRTUAL]: "bg-purple-100 text-purple-700",
  [DataSource.KPI]: "bg-amber-100 text-amber-700",
};

const SOURCE_LABEL: Record<DataSource, string> = {
  [DataSource.PHYSICAL]: "Físico",
  [DataSource.VIRTUAL]: "Virtual",
  [DataSource.KPI]: "KPI",
};

export function SeriesPanel({ series, onAdd, onRemove, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<DataSource | "all">("all");

  const filteredTags = (ALL_TAGS as TagRef[]).filter((t) => {
    const q = search.toLowerCase();
    if (sourceFilter !== "all" && t.source !== sourceFilter) return false;
    return t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q);
  });

  const addTag = (tag: TagRef) => {
    const alreadyAdded = series.some((s) => s.tagRef.name === tag.name);
    if (alreadyAdded) return;
    const nextColor = SERIES_COLORS[series.length % SERIES_COLORS.length];
    const newSeries: SeriesConfig = {
      id: `s-${tag.name}-${Date.now()}`,
      tagRef: tag,
      alias: tag.description ?? tag.name,
      unit: tag.engUnit ?? "",
      color: nextColor,
      enabled: true,
      aggregation: AggregationFn.AVG,
      yAxisSide: "left",
    };
    onAdd(newSeries);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Added series */}
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">
          Series seleccionadas ({series.length})
        </p>
        {series.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Añade tags desde la lista inferior.</p>
        ) : (
          <div className="space-y-1.5">
            {series.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 bg-white">
                {/* Series header */}
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                    style={{ background: s.color }}
                  />
                  <button
                    type="button"
                    className="flex-1 text-left text-xs font-medium text-slate-900 truncate"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    title={s.alias}
                  >
                    {s.alias || s.tagRef.name}
                  </button>
                  <Button
                    variant="ghost" size="icon-xs"
                    onClick={() => onUpdate({ ...s, enabled: !s.enabled })}
                    title={s.enabled ? "Ocultar" : "Mostrar"}
                  >
                    {s.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-slate-400" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon-xs"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    title="Opciones"
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform ${expandedId === s.id ? "rotate-180" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost" size="icon-xs"
                    className="text-red-400 hover:text-red-600"
                    onClick={() => onRemove(s.id)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Expanded options */}
                {expandedId === s.id && (
                  <div className="border-t border-slate-100 px-2 py-2 space-y-2 bg-slate-50">
                    <div className="space-y-1">
                      <Label className="text-xs">Alias</Label>
                      <Input
                        value={s.alias}
                        onChange={(e) => onUpdate({ ...s, alias: e.target.value })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unidad</Label>
                      <Input
                        value={s.unit}
                        onChange={(e) => onUpdate({ ...s, unit: e.target.value })}
                        className="h-7 text-xs"
                        placeholder="kW, °C, %…"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Agregación</Label>
                      <Select value={s.aggregation} onValueChange={(v) => onUpdate({ ...s, aggregation: v as AggregationFn })}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(AggregationFn).map((fn) => (
                            <SelectItem key={fn} value={fn}>{fn.toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Color</Label>
                      <div className="flex gap-1 flex-wrap">
                        {SERIES_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`h-5 w-5 rounded-full border-2 transition-transform ${s.color === c ? "border-slate-900 scale-110" : "border-white shadow"}`}
                            style={{ background: c }}
                            onClick={() => onUpdate({ ...s, color: c })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tag catalog */}
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">
          Catálogo de tags
        </p>
        <div className="space-y-2">
          {/* Search + filter */}
          <Input
            placeholder="Buscar tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex gap-1 flex-wrap">
            {(["all", DataSource.PHYSICAL, DataSource.VIRTUAL, DataSource.KPI] as const).map((src) => (
              <button
                key={src}
                type="button"
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors ${
                  sourceFilter === src
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
                onClick={() => setSourceFilter(src)}
              >
                {src === "all" ? "Todos" : SOURCE_LABEL[src]}
              </button>
            ))}
          </div>

          {/* Tag list */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredTags.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">Sin resultados</p>
            ) : (
              filteredTags.map((tag) => {
                const added = series.some((s) => s.tagRef.name === tag.name);
                return (
                  <button
                    key={tag.name}
                    type="button"
                    disabled={added}
                    onClick={() => addTag(tag)}
                    className={`w-full flex items-start gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                      added
                        ? "border-slate-100 bg-slate-50 opacity-50 cursor-default"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <Plus className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${added ? "text-slate-300" : "text-blue-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-medium text-slate-900">{tag.name}</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${SOURCE_BADGE[tag.source]}`}>
                          {SOURCE_LABEL[tag.source]}
                        </span>
                      </div>
                      {tag.description && (
                        <p className="text-slate-500 truncate">{tag.description}</p>
                      )}
                      {tag.engUnit && <p className="text-slate-400">{tag.engUnit}</p>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
