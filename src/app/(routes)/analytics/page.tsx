"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp, BarChart2, Table, Save, BookOpen, Radio, Pause, Play,
  Settings2, Download, RefreshCw, ChevronDown, ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TrendChart } from "./components/TrendChart";
import { BarChart } from "./components/BarChart";
import { TableView } from "./components/TableView";
import { SeriesPanel } from "./components/SeriesPanel";
import { AnalyticsLibrary } from "./components/AnalyticsLibrary";
import type { AnalyticsView, SeriesConfig, PeriodConfig } from "./types/analytics.types";
import {
  VizType, TimePeriodPreset, ResolutionPreset, RealTimeInterval, NullHandling, AggregationFn,
} from "./types/analytics.types";
import { generateSeriesData, SAVED_ANALYTICS } from "./utils/mockData";
import { MOCK_CONTEXTS, ContextStatus } from "../configuracion/estructura/contextos/contextos.shared";

// ── Constants ──────────────────────────────────────────────────────────────────
const PERIOD_PRESETS: { label: string; value: TimePeriodPreset }[] = [
  { label: "5 min",  value: TimePeriodPreset.M5  },
  { label: "15 min", value: TimePeriodPreset.M15 },
  { label: "1 h",    value: TimePeriodPreset.H1  },
  { label: "6 h",    value: TimePeriodPreset.H6  },
  { label: "24 h",   value: TimePeriodPreset.H24 },
  { label: "7 d",    value: TimePeriodPreset.D7  },
  { label: "30 d",   value: TimePeriodPreset.D30 },
  { label: "Custom", value: TimePeriodPreset.CUSTOM },
  { label: "Contexto op.", value: TimePeriodPreset.CONTEXTO },
];

const RT_INTERVALS: { label: string; value: RealTimeInterval }[] = [
  { label: "1 s",  value: RealTimeInterval.S1  },
  { label: "2 s",  value: RealTimeInterval.S2  },
  { label: "5 s",  value: RealTimeInterval.S5  },
  { label: "10 s", value: RealTimeInterval.S10 },
];

const RESOLUTION_OPTIONS: { label: string; value: ResolutionPreset }[] = [
  { label: "Auto",  value: ResolutionPreset.AUTO },
  { label: "1 s",   value: ResolutionPreset.S1   },
  { label: "10 s",  value: ResolutionPreset.S10  },
  { label: "1 min", value: ResolutionPreset.M1   },
  { label: "5 min", value: ResolutionPreset.M5   },
  { label: "15 min",value: ResolutionPreset.M15  },
  { label: "1 h",   value: ResolutionPreset.H1   },
  { label: "1 d",   value: ResolutionPreset.D1   },
];

// ── Default state ──────────────────────────────────────────────────────────────
function defaultView(): Omit<AnalyticsView, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "Nueva analítica",
    description: "",
    vizType: VizType.TREND,
    series: [],
    period: { preset: TimePeriodPreset.H1 },
    resolution: ResolutionPreset.AUTO,
    nullHandling: NullHandling.INTERPOLATE,
    realTime: { enabled: false, intervalMs: RealTimeInterval.S5, windowPreset: TimePeriodPreset.M15, paused: false },
    vizOptions: { showLegend: true, showGrid: true, yAutoScale: true, barAggregation: AggregationFn.AVG, pageSize: 50 },
  };
}

function toDateInputValue(iso: string | undefined): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [savedViews, setSavedViews] = useState<AnalyticsView[]>(SAVED_ANALYTICS);
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);

  // Current view state
  const [name, setName] = useState("Nueva analítica");
  const [description, setDescription] = useState("");
  const [vizType, setVizType] = useState<VizType>(VizType.TREND);
  const [series, setSeries] = useState<SeriesConfig[]>([]);
  const [period, setPeriod] = useState<PeriodConfig>({ preset: TimePeriodPreset.H1 });
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [contextRef, setContextRef] = useState<string>("");
  const [resolution, setResolution] = useState<ResolutionPreset>(ResolutionPreset.AUTO);
  const [nullHandling, setNullHandling] = useState<NullHandling>(NullHandling.INTERPOLATE);
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [yAutoScale, setYAutoScale] = useState(true);
  const [barAgg, setBarAgg] = useState<AggregationFn>(AggregationFn.AVG);
  const [pageSize] = useState(50);
  const [rtEnabled, setRtEnabled] = useState(false);
  const [rtInterval, setRtInterval] = useState<RealTimeInterval>(RealTimeInterval.S5);
  const [rtWindow, setRtWindow] = useState<TimePeriodPreset>(TimePeriodPreset.M15);
  const [rtPaused, setRtPaused] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // UI state
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSeriesPanel, setShowSeriesPanel] = useState(true);
  const [saveDialogName, setSaveDialogName] = useState("");
  const [saveDialogDesc, setSaveDialogDesc] = useState("");

  // Real-time ticker
  const rtRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (rtEnabled && !rtPaused) {
      rtRef.current = setInterval(() => setLastRefresh(Date.now()), rtInterval);
    } else {
      if (rtRef.current) clearInterval(rtRef.current);
    }
    return () => { if (rtRef.current) clearInterval(rtRef.current); };
  }, [rtEnabled, rtPaused, rtInterval]);

  // Effective period (for real-time use window)
  const effectivePeriod: PeriodConfig = useMemo(() => {
    if (rtEnabled) return { preset: rtWindow };
    if (period.preset === TimePeriodPreset.CUSTOM && customFrom && customTo) {
      return { preset: TimePeriodPreset.CUSTOM, from: customFrom, to: customTo };
    }
    if (period.preset === TimePeriodPreset.CONTEXTO && contextRef) {
      const ctx = MOCK_CONTEXTS.find((c) => c.contextUUID === contextRef);
      if (ctx) {
        return {
          preset: TimePeriodPreset.CUSTOM,
          from: ctx.startAt,
          to: ctx.endAt ?? new Date().toISOString(),
        };
      }
    }
    return period;
  }, [rtEnabled, rtWindow, period, customFrom, customTo, contextRef]);

  // Generate chart data
  const chartData = useMemo(() => {
    return generateSeriesData(series, effectivePeriod);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, effectivePeriod, lastRefresh]);

  // ── Load a saved view ────────────────────────────────────────────────────────
  const loadView = useCallback((view: AnalyticsView) => {
    setCurrentId(view.id);
    setName(view.name);
    setDescription(view.description ?? "");
    setVizType(view.vizType);
    setSeries(view.series);
    setPeriod(view.period);
    setCustomFrom(toDateInputValue(view.period.from));
    setCustomTo(toDateInputValue(view.period.to));
    setContextRef(view.period.contextId ?? "");
    setResolution(view.resolution);
    setNullHandling(view.nullHandling);
    setShowLegend(view.vizOptions.showLegend);
    setShowGrid(view.vizOptions.showGrid);
    setYAutoScale(view.vizOptions.yAutoScale);
    setBarAgg(view.vizOptions.barAggregation ?? AggregationFn.AVG);
    setRtEnabled(view.realTime.enabled);
    setRtInterval(view.realTime.intervalMs);
    setRtWindow(view.realTime.windowPreset);
    setRtPaused(false);
    setShowLibrary(false);
  }, []);

  // ── Save current as new / update ────────────────────────────────────────────
  const buildView = useCallback((): AnalyticsView => {
    const now = new Date().toISOString();
    return {
      id: currentId ?? `av-${Date.now()}`,
      name: saveDialogName || name,
      description: saveDialogDesc || description,
      vizType,
      series,
      period: period.preset === TimePeriodPreset.CUSTOM
        ? { preset: TimePeriodPreset.CUSTOM, from: customFrom, to: customTo }
        : period.preset === TimePeriodPreset.CONTEXTO
        ? { preset: TimePeriodPreset.CONTEXTO, contextId: contextRef }
        : period,
      resolution,
      nullHandling,
      realTime: { enabled: rtEnabled, intervalMs: rtInterval, windowPreset: rtWindow, paused: false },
      vizOptions: { showLegend, showGrid, yAutoScale, barAggregation: barAgg, pageSize },
      createdAt: savedViews.find((v) => v.id === currentId)?.createdAt ?? now,
      updatedAt: now,
    };
  }, [currentId, saveDialogName, saveDialogDesc, name, description, vizType, series, period, customFrom, customTo, contextRef, resolution, nullHandling, rtEnabled, rtInterval, rtWindow, showLegend, showGrid, yAutoScale, barAgg, pageSize, savedViews]);

  const handleSave = () => {
    const view = buildView();
    setSavedViews((prev) => {
      const idx = prev.findIndex((v) => v.id === view.id);
      return idx >= 0 ? prev.map((v) => (v.id === view.id ? view : v)) : [...prev, view];
    });
    setCurrentId(view.id);
    setShowSaveDialog(false);
  };

  const handleSaveAs = () => {
    setSaveDialogName(`${name} (copia)`);
    setSaveDialogDesc(description);
    setShowSaveDialog(true);
  };

  const handleSaveNew = () => {
    setSaveDialogName(name);
    setSaveDialogDesc(description);
    setShowSaveDialog(true);
  };

  const handleDuplicate = (view: AnalyticsView) => {
    const now = new Date().toISOString();
    const dup: AnalyticsView = {
      ...view,
      id: `av-${Date.now()}`,
      name: `${view.name} (copia)`,
      createdAt: now,
      updatedAt: now,
    };
    setSavedViews((prev) => [...prev, dup]);
  };

  const handleDelete = (id: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
    if (currentId === id) setCurrentId(undefined);
  };

  const handleNewView = () => {
    const d = defaultView();
    setCurrentId(undefined);
    setName(d.name); setDescription("");
    setVizType(d.vizType); setSeries([]); setPeriod(d.period);
    setCustomFrom(""); setCustomTo(""); setContextRef("");
    setResolution(d.resolution); setNullHandling(d.nullHandling);
    setShowLegend(true); setShowGrid(true); setYAutoScale(true);
    setBarAgg(AggregationFn.AVG);
    setRtEnabled(false); setRtPaused(false);
    setShowLibrary(false);
  };

  // ── Export CSV ───────────────────────────────────────────────────────────────
  const handleExportCsv = () => {
    const headers = ["timestamp", ...series.map((s) => s.alias || s.tagRef.name)].join(",");
    const tsSet = new Set<number>();
    series.forEach((s) => chartData.get(s.id)?.forEach((p) => tsSet.add(p.ts)));
    const rows = [...tsSet].sort((a, b) => a - b).map((ts) => {
      const vals = series.map((s) => {
        const pt = chartData.get(s.id)?.find((p) => p.ts === ts);
        return pt?.value ?? "";
      });
      return [new Date(ts).toISOString(), ...vals].join(",");
    });
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <section className="flex flex-col gap-0 h-full min-h-[calc(100vh-6rem)]">

      {/* ── Toolbar ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-4">
        {/* Row 1: name + type + live + actions */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
          {/* Name */}
          <div className="flex items-center gap-1 flex-1 min-w-[180px] max-w-sm">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm font-medium border-0 shadow-none px-1 focus-visible:ring-1"
              placeholder="Nombre de la analítica"
            />
            {currentId && <Badge variant="secondary" className="text-[10px] shrink-0">Guardada</Badge>}
          </div>

          {/* Viz type */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {([VizType.TREND, VizType.BAR, VizType.TABLE] as const).map((vt) => (
              <button
                key={vt}
                type="button"
                title={vt}
                onClick={() => setVizType(vt)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  vizType === vt ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {vt === VizType.TREND && <TrendingUp className="h-3.5 w-3.5" />}
                {vt === VizType.BAR && <BarChart2 className="h-3.5 w-3.5" />}
                {vt === VizType.TABLE && <Table className="h-3.5 w-3.5" />}
                {vt}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Real-time toggle */}
          <button
            type="button"
            onClick={() => { setRtEnabled(!rtEnabled); setRtPaused(false); }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              rtEnabled
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${rtEnabled && !rtPaused ? "animate-pulse" : ""}`} />
            {rtEnabled ? "LIVE" : "Tiempo Real"}
          </button>

          {rtEnabled && (
            <button
              type="button"
              onClick={() => setRtPaused(!rtPaused)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:border-slate-300"
              title={rtPaused ? "Reanudar" : "Pausar"}
            >
              {rtPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* Settings toggle */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
              showSettings ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
            title="Ajustes"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>

          {/* Actions */}
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExportCsv} title="Exportar CSV">
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setLastRefresh(Date.now())}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={currentId ? handleSave : handleSaveNew}>
            <Save className="h-3.5 w-3.5" />
            {currentId ? "Guardar" : "Guardar como…"}
          </Button>
          {currentId && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleSaveAs}>
              Guardar como…
            </Button>
          )}
          <Button
            variant="outline" size="sm" className="h-8 text-xs gap-1"
            onClick={() => setShowLibrary(!showLibrary)}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Biblioteca
          </Button>
        </div>

        {/* Row 2: period bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2">
          {/* Period presets */}
          <div className="flex gap-1 flex-wrap">
            {PERIOD_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod({ preset: p.value })}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  period.preset === p.value
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          {period.preset === TimePeriodPreset.CUSTOM && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <span className="text-xs text-slate-400">→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          )}

          {/* Operating context selector */}
          {period.preset === TimePeriodPreset.CONTEXTO && (
            <div className="flex items-center gap-2">
              <Select value={contextRef} onValueChange={setContextRef}>
                <SelectTrigger className="h-7 w-64 text-xs">
                  <SelectValue placeholder="Seleccionar contexto operativo…" />
                </SelectTrigger>
                <SelectContent>
                  {[...MOCK_CONTEXTS]
                    .sort((a, b) => {
                      const order: Record<string, number> = {
                        [ContextStatus.ACTIVE]: 0,
                        [ContextStatus.PLANNED]: 1,
                        [ContextStatus.CLOSED]: 2,
                      };
                      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
                    })
                    .map((ctx) => {
                      const dot =
                        ctx.status === ContextStatus.ACTIVE ? "bg-emerald-500" :
                        ctx.status === ContextStatus.PLANNED ? "bg-amber-400" : "bg-zinc-300";
                      return (
                        <SelectItem key={ctx.contextUUID} value={ctx.contextUUID}>
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
                            <span className="font-medium">{ctx.name}</span>
                            <span className="text-slate-400 text-[10px]">· {ctx.type}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {contextRef && (() => {
                const ctx = MOCK_CONTEXTS.find((c) => c.contextUUID === contextRef);
                if (!ctx) return null;
                const fmt = (iso: string) =>
                  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
                return (
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {fmt(ctx.startAt)} → {ctx.endAt ? fmt(ctx.endAt) : <span className="text-emerald-600 font-medium">activo</span>}
                  </span>
                );
              })()}
            </div>
          )}

          <div className="flex-1" />

          {/* Resolution */}
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-slate-500 whitespace-nowrap">Resolución</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as ResolutionPreset)}>
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* RT interval (when live) */}
          {rtEnabled && (
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-slate-500 whitespace-nowrap">Refresco</Label>
              <Select value={String(rtInterval)} onValueChange={(v) => setRtInterval(Number(v) as RealTimeInterval)}>
                <SelectTrigger className="h-7 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RT_INTERVALS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="text-xs text-slate-500 whitespace-nowrap">Ventana</Label>
              <Select value={rtWindow} onValueChange={(v) => setRtWindow(v as TimePeriodPreset)}>
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[TimePeriodPreset.M5, TimePeriodPreset.M15, TimePeriodPreset.H1, TimePeriodPreset.H6].map((p) => (
                    <SelectItem key={p} value={p}>{PERIOD_PRESETS.find(x => x.value === p)?.label ?? p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Row 3: settings (collapsible) */}
        {showSettings && (
          <div className="flex flex-wrap items-center gap-4 px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <div className="flex items-center gap-1.5">
              <input type="checkbox" id="showLegend" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} className="h-3.5 w-3.5" />
              <Label htmlFor="showLegend" className="text-xs cursor-pointer">Leyenda</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <input type="checkbox" id="showGrid" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="h-3.5 w-3.5" />
              <Label htmlFor="showGrid" className="text-xs cursor-pointer">Cuadrícula</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <input type="checkbox" id="yAutoScale" checked={yAutoScale} onChange={(e) => setYAutoScale(e.target.checked)} className="h-3.5 w-3.5" />
              <Label htmlFor="yAutoScale" className="text-xs cursor-pointer">Escala Y automática</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-slate-500">Nulos</Label>
              <Select value={nullHandling} onValueChange={(v) => setNullHandling(v as NullHandling)}>
                <SelectTrigger className="h-7 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NullHandling.GAP}>Mantener hueco</SelectItem>
                  <SelectItem value={NullHandling.INTERPOLATE}>Interpolar</SelectItem>
                  <SelectItem value={NullHandling.LAST}>Último valor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {vizType === VizType.BAR && (
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-slate-500">Agrupación barras</Label>
                <Select value={barAgg} onValueChange={(v) => setBarAgg(v as AggregationFn)}>
                  <SelectTrigger className="h-7 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AggregationFn).map((fn) => (
                      <SelectItem key={fn} value={fn}>{fn.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main layout: sidebar + chart ── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Series panel (collapsible) */}
        <div className={`flex flex-col transition-all duration-200 ${showSeriesPanel ? "w-72 shrink-0" : "w-8 shrink-0"}`}>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm h-full overflow-hidden flex flex-col">
            {/* Panel header */}
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-50 select-none"
              onClick={() => setShowSeriesPanel(!showSeriesPanel)}
            >
              {showSeriesPanel
                ? <ChevronDown className="h-3.5 w-3.5" />
                : <ChevronRight className="h-3.5 w-3.5" />}
              {showSeriesPanel && "Series"}
            </button>
            {showSeriesPanel && (
              <div className="flex-1 overflow-y-auto p-3">
                <SeriesPanel
                  series={series}
                  onAdd={(s) => setSeries((prev) => [...prev, s])}
                  onRemove={(id) => setSeries((prev) => prev.filter((s) => s.id !== id))}
                  onUpdate={(updated) => setSeries((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
                />
              </div>
            )}
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          {/* Live indicator */}
          {rtEnabled && (
            <div className={`flex items-center gap-2 mb-3 text-xs font-medium ${rtPaused ? "text-slate-400" : "text-red-600"}`}>
              <span className={`h-2 w-2 rounded-full ${rtPaused ? "bg-slate-300" : "bg-red-500 animate-pulse"}`} />
              {rtPaused ? "Pausado" : `LIVE · refresco cada ${RT_INTERVALS.find(r => r.value === rtInterval)?.label}`}
              {rtPaused && (
                <button type="button" onClick={() => setRtPaused(false)} className="underline text-slate-600">
                  Reanudar
                </button>
              )}
            </div>
          )}

          {/* Visualization */}
          {vizType === VizType.TREND && (
            <TrendChart
              series={series}
              data={chartData}
              period={effectivePeriod}
              showLegend={showLegend}
              showGrid={showGrid}
              yAutoScale={yAutoScale}
            />
          )}
          {vizType === VizType.BAR && (
            <BarChart
              series={series}
              data={chartData}
              period={effectivePeriod}
              aggregation={barAgg}
              showLegend={showLegend}
              showGrid={showGrid}
            />
          )}
          {vizType === VizType.TABLE && (
            <TableView
              series={series}
              data={chartData}
              period={effectivePeriod}
              pageSize={pageSize}
            />
          )}
        </div>

        {/* Library panel */}
        {showLibrary && (
          <div className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700">Biblioteca</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={handleNewView}>
                  + Nueva
                </Button>
                <button type="button" onClick={() => setShowLibrary(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <AnalyticsLibrary
                views={savedViews}
                currentId={currentId}
                onLoad={loadView}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Save Dialog ── */}
      <Dialog open={showSaveDialog} onOpenChange={(v) => { if (!v) setShowSaveDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar analítica</DialogTitle>
            <DialogDescription>Dale un nombre descriptivo para encontrarla después en la biblioteca.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={saveDialogName} onChange={(e) => setSaveDialogName(e.target.value)} placeholder="Ej. Consumo vs temperatura — turno noche" />
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea value={saveDialogDesc} onChange={(e) => setSaveDialogDesc(e.target.value)} rows={2} placeholder="Describe qué muestra esta analítica…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancelar</Button>
            <Button disabled={!saveDialogName.trim()} onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
