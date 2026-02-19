"use client";

import { useState } from "react";
import { Search, TrendingUp, BarChart2, Table, Trash2, Copy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsView } from "../types/analytics.types";
import { VizType } from "../types/analytics.types";

type Props = {
  views: AnalyticsView[];
  currentId?: string;
  onLoad: (view: AnalyticsView) => void;
  onDuplicate: (view: AnalyticsView) => void;
  onDelete: (id: string) => void;
};

const VIZ_ICON: Record<VizType, React.ReactNode> = {
  [VizType.TREND]: <TrendingUp className="h-4 w-4" />,
  [VizType.BAR]: <BarChart2 className="h-4 w-4" />,
  [VizType.TABLE]: <Table className="h-4 w-4" />,
};

const VIZ_COLOR: Record<VizType, string> = {
  [VizType.TREND]: "text-blue-600 bg-blue-50",
  [VizType.BAR]: "text-amber-600 bg-amber-50",
  [VizType.TABLE]: "text-slate-600 bg-slate-100",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function AnalyticsLibrary({ views, currentId, onLoad, onDuplicate, onDelete }: Props) {
  const [search, setSearch] = useState("");

  const filtered = views.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar analítica…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-8 text-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">
          {search ? "Sin resultados." : "No hay analíticas guardadas."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((view) => {
            const isCurrent = view.id === currentId;
            return (
              <div
                key={view.id}
                className={`rounded-xl border transition-colors ${
                  isCurrent ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5"
                  onClick={() => onLoad(view)}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${VIZ_COLOR[view.vizType]}`}>
                      {VIZ_ICON[view.vizType]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{view.name}</p>
                      {view.description && (
                        <p className="text-xs text-slate-500 truncate">{view.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">
                          {view.series.length} serie{view.series.length !== 1 ? "s" : ""}
                        </span>
                        {view.realTime.enabled && (
                          <Badge variant="destructive" className="text-[9px] py-0 px-1 h-4">LIVE</Badge>
                        )}
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDate(view.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
                <div className="flex border-t border-slate-100 px-2 py-1 gap-1">
                  <Button
                    variant="ghost" size="sm"
                    className="h-6 text-[10px] gap-1 text-slate-500 hover:text-slate-900"
                    onClick={() => onDuplicate(view)}
                    title="Duplicar"
                  >
                    <Copy className="h-3 w-3" />
                    Duplicar
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="h-6 text-[10px] gap-1 text-red-400 hover:text-red-600"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar "${view.name}"?`)) onDelete(view.id);
                    }}
                    title="Eliminar"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
