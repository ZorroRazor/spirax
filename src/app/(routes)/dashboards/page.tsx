"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ArrowLeft, Eye, PencilRuler, Save, Plus, Trash2, Copy,
  Zap, TrendingUp, BarChart2, Gauge, Bell, Type, RefreshCw,
  Pencil, X, PanelLeft, LayoutDashboard, Share2, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────────────────────────────
type WidgetType = "kpi" | "trend" | "bar" | "gauge" | "alarms" | "text";

type WidgetConfig = {
  tagName?: string;
  value?: number;
  target?: number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  status?: "ok" | "warning" | "critical";
  series?: { name: string; color: string }[];
  period?: string;
  min?: number;
  max?: number;
  current?: number;
  text?: string;
  fontSize?: "sm" | "base" | "xl";
  maxItems?: number;
};

type Widget = {
  id: string;
  type: WidgetType;
  title: string;
  colSpan: number;
  rowSpan: number;
  config: WidgetConfig;
};

type DashboardCategory = "Industria" | "Edificios" | "Oficinas" | "Residencial" | "General";

type Dashboard = {
  id: string;
  name: string;
  description: string;
  category: DashboardCategory;
  owner: string;
  visibility: "Privado" | "Compartido" | "Por rol";
  isLive: boolean;
  widgets: Widget[];
  createdAt: string;
  updatedAt: string;
};

// ── Seeded pseudo-random (deterministic) ──────────────────────────────────────
function sr(seed: string, i: number): number {
  let h = 0;
  for (let c = 0; c < seed.length; c++) h = (h * 31 + seed.charCodeAt(c)) | 0;
  return Math.abs(((h + i * 2654435761) | 0) % 1000) / 1000;
}

function trendPts(id: string, n = 24): string {
  const vals = Array.from({ length: n }, (_, i) =>
    40 + 20 * Math.sin(i * 0.35 + sr(id, 0) * 3) + sr(id, i) * 14 - 7
  );
  const mn = Math.min(...vals), mx = Math.max(...vals) + 0.01;
  return vals.map((v, i) =>
    `${(i / (n - 1)) * 100},${(1 - (v - mn) / (mx - mn)) * 68 + 6}`
  ).join(" ");
}

function barH(id: string, n = 7): number[] {
  return Array.from({ length: n }, (_, i) => 10 + sr(id, i + 50) * 85);
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const INITIAL_DASHBOARDS: Dashboard[] = [
  {
    id: "db-01", name: "Dashboard Energía — Planta Norte", description: "Consumo eléctrico y eficiencia operativa en tiempo real",
    category: "Industria", owner: "admin", visibility: "Compartido", isLive: true,
    createdAt: "2025-10-01T08:00:00Z", updatedAt: "2026-02-17T09:00:00Z",
    widgets: [
      { id: "w1", type: "kpi", title: "Consumo Actual", colSpan: 3, rowSpan: 1, config: { tagName: "E-KW-TOTAL", value: 342, target: 380, unit: "kW", trend: "down", status: "ok" } },
      { id: "w2", type: "kpi", title: "Temperatura Horno", colSpan: 3, rowSpan: 1, config: { tagName: "T-TEMP-001", value: 258, target: 250, unit: "°C", trend: "up", status: "warning" } },
      { id: "w3", type: "kpi", title: "Eficiencia L1", colSpan: 3, rowSpan: 1, config: { tagName: "VT-EFF-LINE1", value: 83, target: 85, unit: "%", trend: "stable", status: "ok" } },
      { id: "w4", type: "gauge", title: "Factor de Carga", colSpan: 3, rowSpan: 1, config: { min: 0, max: 100, current: 68, unit: "%" } },
      { id: "w5", type: "trend", title: "Consumo últimas 24h", colSpan: 8, rowSpan: 2, config: { series: [{ name: "E-KW-TOTAL", color: "#3b82f6" }, { name: "T-TEMP-001", color: "#ef4444" }], period: "24h" } },
      { id: "w6", type: "alarms", title: "Alarmas Activas", colSpan: 4, rowSpan: 2, config: { maxItems: 5 } },
      { id: "w7", type: "bar", title: "Consumo por Área", colSpan: 12, rowSpan: 2, config: { series: [{ name: "Por área", color: "#3b82f6" }], period: "7d" } },
    ],
  },
  {
    id: "db-02", name: "Panel Operario Turno", description: "Variables operativas para operarios de producción",
    category: "Industria", owner: "supervisor-01", visibility: "Compartido", isLive: true,
    createdAt: "2025-11-15T08:00:00Z", updatedAt: "2026-02-18T06:00:00Z",
    widgets: [
      { id: "w8", type: "kpi", title: "Unidades Producidas", colSpan: 4, rowSpan: 1, config: { tagName: "DB-PROD-UNITS", value: 1240, target: 1500, unit: "uds", trend: "up", status: "warning" } },
      { id: "w9", type: "kpi", title: "Presión Vapor", colSpan: 4, rowSpan: 1, config: { tagName: "P-PRES-VAPOR", value: 4.3, target: 4.5, unit: "bar", trend: "down", status: "ok" } },
      { id: "w10", type: "kpi", title: "Caudal Agua", colSpan: 4, rowSpan: 1, config: { tagName: "F-FLOW-HH2O", value: 3.1, target: 3.2, unit: "m³/h", trend: "stable", status: "ok" } },
      { id: "w11", type: "trend", title: "Producción por hora", colSpan: 8, rowSpan: 2, config: { series: [{ name: "Producción", color: "#10b981" }], period: "8h" } },
      { id: "w12", type: "alarms", title: "Alarmas", colSpan: 4, rowSpan: 2, config: { maxItems: 4 } },
    ],
  },
  {
    id: "db-03", name: "KPIs Dirección", description: "Panel ejecutivo de KPIs energéticos y de producción",
    category: "General", owner: "admin", visibility: "Por rol", isLive: false,
    createdAt: "2025-12-01T08:00:00Z", updatedAt: "2026-02-10T10:00:00Z",
    widgets: [
      { id: "w13", type: "kpi", title: "Coste Eléctrico Día", colSpan: 3, rowSpan: 1, config: { tagName: "KPI-COSTE-ELEC-DIA", value: 312, target: 350, unit: "€/día", trend: "down", status: "ok" } },
      { id: "w14", type: "kpi", title: "Eficiencia Producción", colSpan: 3, rowSpan: 1, config: { tagName: "KPI-EFF-PROD", value: 79, target: 85, unit: "%", trend: "stable", status: "warning" } },
      { id: "w15", type: "kpi", title: "Consumo Mensual", colSpan: 3, rowSpan: 1, config: { tagName: "E-KW-TOTAL", value: 18420, target: 20000, unit: "kWh", trend: "down", status: "ok" } },
      { id: "w16", type: "kpi", title: "Temperatura Media", colSpan: 3, rowSpan: 1, config: { tagName: "VT-TEMP-AVG", value: 217, target: 220, unit: "°C", trend: "stable", status: "ok" } },
      { id: "w17", type: "bar", title: "Coste energético últimos 30 días", colSpan: 12, rowSpan: 2, config: { series: [{ name: "Coste €/día", color: "#f59e0b" }], period: "30d" } },
    ],
  },
  {
    id: "db-04", name: "HVAC Edificio Central", description: "Climatización y ocupación edificio central",
    category: "Edificios", owner: "analista-01", visibility: "Compartido", isLive: false,
    createdAt: "2026-01-10T08:00:00Z", updatedAt: "2026-02-12T11:00:00Z",
    widgets: [
      { id: "w18", type: "kpi", title: "Temperatura Interior", colSpan: 4, rowSpan: 1, config: { tagName: "T-TEMP-INT", value: 21.5, target: 22, unit: "°C", trend: "stable", status: "ok" } },
      { id: "w19", type: "kpi", title: "Consumo HVAC", colSpan: 4, rowSpan: 1, config: { tagName: "E-HVAC", value: 45, target: 50, unit: "kW", trend: "down", status: "ok" } },
      { id: "w20", type: "gauge", title: "Ocupación", colSpan: 4, rowSpan: 1, config: { min: 0, max: 200, current: 134, unit: "personas" } },
      { id: "w21", type: "trend", title: "Temp y Consumo HVAC 24h", colSpan: 12, rowSpan: 2, config: { series: [{ name: "Temp", color: "#3b82f6" }, { name: "HVAC kW", color: "#10b981" }], period: "24h" } },
    ],
  },
];

const TEMPLATES = [
  { id: "tpl-01", name: "Dashboard Energético Industrial", category: "Industria", description: "KPIs de consumo + tendencias + alarmas", widgetCount: 7 },
  { id: "tpl-02", name: "Panel Producción", category: "Industria", description: "Variables operativas por turno", widgetCount: 5 },
  { id: "tpl-03", name: "Dashboard HVAC Edificio", category: "Edificios", description: "Climatización, ocupación y eficiencia", widgetCount: 4 },
  { id: "tpl-04", name: "Consumo Oficina", category: "Oficinas", description: "Horario laboral vs no laboral", widgetCount: 4 },
  { id: "tpl-05", name: "KPIs Dirección", category: "General", description: "Panel ejecutivo de indicadores clave", widgetCount: 5 },
  { id: "tpl-06", name: "Dashboard Vivienda", category: "Residencial", description: "Consumo doméstico y tarifas", widgetCount: 4 },
];

const TOOLBOX: { label: string; items: { type: WidgetType; label: string; icon: React.ReactNode; defaultColSpan: number; defaultRowSpan: number }[] }[] = [
  { label: "Indicadores", items: [
    { type: "kpi", label: "KPI Card", icon: <Zap className="h-4 w-4" />, defaultColSpan: 3, defaultRowSpan: 1 },
    { type: "gauge", label: "Medidor", icon: <Gauge className="h-4 w-4" />, defaultColSpan: 3, defaultRowSpan: 1 },
  ]},
  { label: "Gráficas", items: [
    { type: "trend", label: "Tendencia", icon: <TrendingUp className="h-4 w-4" />, defaultColSpan: 6, defaultRowSpan: 2 },
    { type: "bar", label: "Barras", icon: <BarChart2 className="h-4 w-4" />, defaultColSpan: 6, defaultRowSpan: 2 },
  ]},
  { label: "Operaciones", items: [
    { type: "alarms", label: "Alarmas", icon: <Bell className="h-4 w-4" />, defaultColSpan: 4, defaultRowSpan: 2 },
  ]},
  { label: "Contenido", items: [
    { type: "text", label: "Texto", icon: <Type className="h-4 w-4" />, defaultColSpan: 6, defaultRowSpan: 1 },
  ]},
];

// ── Widget renderers ───────────────────────────────────────────────────────────
function KpiWidget({ w }: { w: Widget }) {
  const { tagName = "—", value = 0, target, unit = "", trend = "stable", status = "ok" } = w.config;
  const statusColor = status === "ok" ? "text-emerald-600" : status === "warning" ? "text-amber-500" : "text-red-600";
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-slate-400";
  const deviation = target ? ((value - target) / target * 100) : null;
  return (
    <div className="h-full flex flex-col justify-between p-1">
      <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate">{tagName}</p>
      <div className="flex items-end gap-1.5">
        <span className={`text-2xl font-bold tabular-nums leading-none ${statusColor}`}>{value.toLocaleString("es-ES")}</span>
        <span className="text-xs text-slate-500 pb-0.5">{unit}</span>
        <span className={`text-base font-bold pb-0.5 ${trendColor}`}>{trendIcon}</span>
      </div>
      {target !== undefined && (
        <p className="text-[10px] text-slate-400">
          Obj: {target.toLocaleString("es-ES")} {unit}
          {deviation !== null && (
            <span className={Math.abs(deviation) < 5 ? "text-emerald-500" : deviation > 0 ? "text-amber-500" : "text-red-500"}>
              {" "}({deviation > 0 ? "+" : ""}{deviation.toFixed(1)}%)
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function TrendWidget({ w }: { w: Widget }) {
  const pts = trendPts(w.id);
  const color = w.config.series?.[0]?.color ?? "#3b82f6";
  const color2 = w.config.series?.[1]?.color;
  const pts2 = color2 ? trendPts(w.id + "2") : null;
  return (
    <div className="h-full flex flex-col gap-1 p-1">
      {w.config.series && (
        <div className="flex gap-3 flex-wrap">
          {w.config.series.map((s) => (
            <span key={s.name} className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <svg viewBox="0 0 100 80" className="flex-1 w-full" preserveAspectRatio="none" overflow="visible">
        <defs>
          <linearGradient id={`g-${w.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={`0,80 ${pts} 100,80`} fill={`url(#g-${w.id})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {pts2 && <polyline points={pts2} fill="none" stroke={color2} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 2" />}
      </svg>
      {w.config.period && <p className="text-[10px] text-slate-400 text-right">{w.config.period}</p>}
    </div>
  );
}

function BarWidget({ w }: { w: Widget }) {
  const heights = barH(w.id);
  const color = w.config.series?.[0]?.color ?? "#3b82f6";
  const max = Math.max(...heights);
  const labels = ["L", "M", "X", "J", "V", "S", "D"];
  return (
    <div className="h-full flex flex-col gap-1 p-1">
      <svg viewBox="0 0 100 70" className="flex-1 w-full" preserveAspectRatio="none">
        {heights.map((h, i) => {
          const bw = 10, gap = 4.3, x = i * (bw + gap) + 2;
          const bh = (h / max) * 60;
          return <rect key={i} x={x} y={70 - bh} width={bw} height={bh} fill={color} fillOpacity={0.6 + 0.4 * (h / max)} rx="1.5" />;
        })}
      </svg>
      <div className="flex justify-around text-[9px] text-slate-400 px-1">
        {labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

function GaugeWidget({ w }: { w: Widget }) {
  const { min = 0, max = 100, current = 65, unit = "" } = w.config;
  const pct = Math.max(0, Math.min(1, (current - min) / (max - min)));
  const color = pct < 0.6 ? "#10b981" : pct < 0.85 ? "#f59e0b" : "#ef4444";
  return (
    <div className="h-full flex flex-col justify-center gap-2 px-1">
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>{current.toLocaleString("es-ES")}</span>
        <span className="text-xs text-slate-500 pb-0.5">{unit}</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{min} {unit}</span><span>{max} {unit}</span>
      </div>
    </div>
  );
}

const MOCK_ALARMS = [
  { name: "Sobrecarga eléctrica", priority: "CRÍTICA", since: "02:14" },
  { name: "Temp. horno alta", priority: "ALTA", since: "04:30" },
  { name: "Caudal bajo", priority: "MEDIA", since: "01:05" },
  { name: "Presión inestable", priority: "BAJA", since: "00:20" },
  { name: "Sensor fallido", priority: "ALTA", since: "03:58" },
];
const ALARM_COLOR: Record<string, string> = {
  "CRÍTICA": "text-red-700 bg-red-100",
  "ALTA": "text-amber-700 bg-amber-100",
  "MEDIA": "text-yellow-700 bg-yellow-100",
  "BAJA": "text-slate-600 bg-slate-100",
};

function AlarmsWidget({ w }: { w: Widget }) {
  const count = w.config.maxItems ?? 4;
  return (
    <div className="h-full flex flex-col gap-1 overflow-hidden p-1">
      {MOCK_ALARMS.slice(0, count).map((a, i) => (
        <div key={i} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${ALARM_COLOR[a.priority]}`}>{a.priority}</span>
          <span className="text-xs text-slate-700 truncate flex-1">{a.name}</span>
          <span className="text-[10px] text-slate-400 shrink-0">{a.since}</span>
        </div>
      ))}
    </div>
  );
}

function TextWidget({ w }: { w: Widget }) {
  const sizeClass = w.config.fontSize === "xl" ? "text-2xl font-bold" : w.config.fontSize === "base" ? "text-base" : "text-sm";
  return (
    <div className="h-full flex items-center p-2">
      <p className={`${sizeClass} text-slate-700`}>{w.config.text ?? w.title}</p>
    </div>
  );
}

function WidgetRenderer({ w }: { w: Widget }) {
  if (w.type === "kpi") return <KpiWidget w={w} />;
  if (w.type === "trend") return <TrendWidget w={w} />;
  if (w.type === "bar") return <BarWidget w={w} />;
  if (w.type === "gauge") return <GaugeWidget w={w} />;
  if (w.type === "alarms") return <AlarmsWidget w={w} />;
  if (w.type === "text") return <TextWidget w={w} />;
  return null;
}

// ── Widget config panel ────────────────────────────────────────────────────────
function WidgetConfigPanel({ widget, onChange, onDelete, onClose }: {
  widget: Widget;
  onChange: (updates: Partial<Widget>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Configuración</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
      </div>
      <div className="p-3 space-y-3 flex-1">
        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input value={widget.title} onChange={(e) => onChange({ title: e.target.value })} className="h-7 text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Columnas (1–12)</Label>
            <Input type="number" min={1} max={12} value={widget.colSpan}
              onChange={(e) => onChange({ colSpan: Math.min(12, Math.max(1, Number(e.target.value))) })} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Filas (1–4)</Label>
            <Input type="number" min={1} max={4} value={widget.rowSpan}
              onChange={(e) => onChange({ rowSpan: Math.min(4, Math.max(1, Number(e.target.value))) })} className="h-7 text-xs" />
          </div>
        </div>

        {widget.type === "kpi" && (
          <>
            <div className="space-y-1"><Label className="text-xs">Tag</Label>
              <Input value={widget.config.tagName ?? ""} onChange={(e) => onChange({ config: { ...widget.config, tagName: e.target.value } })} className="h-7 text-xs" placeholder="T-TEMP-001" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Valor</Label>
                <Input type="number" value={widget.config.value ?? ""} onChange={(e) => onChange({ config: { ...widget.config, value: Number(e.target.value) } })} className="h-7 text-xs" /></div>
              <div className="space-y-1"><Label className="text-xs">Objetivo</Label>
                <Input type="number" value={widget.config.target ?? ""} onChange={(e) => onChange({ config: { ...widget.config, target: Number(e.target.value) } })} className="h-7 text-xs" /></div>
              <div className="space-y-1"><Label className="text-xs">Unidad</Label>
                <Input value={widget.config.unit ?? ""} onChange={(e) => onChange({ config: { ...widget.config, unit: e.target.value } })} className="h-7 text-xs" placeholder="kW" /></div>
              <div className="space-y-1"><Label className="text-xs">Estado</Label>
                <Select value={widget.config.status ?? "ok"} onValueChange={(v) => onChange({ config: { ...widget.config, status: v as WidgetConfig["status"] } })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ok">OK</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="critical">Crítico</SelectItem></SelectContent>
                </Select></div>
            </div>
          </>
        )}
        {(widget.type === "trend" || widget.type === "bar") && (
          <div className="space-y-1"><Label className="text-xs">Periodo</Label>
            <Select value={widget.config.period ?? "24h"} onValueChange={(v) => onChange({ config: { ...widget.config, period: v } })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["5m","15m","1h","6h","24h","7d","30d"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {widget.type === "gauge" && (
          <div className="grid grid-cols-3 gap-2">
            {(["min","max","current"] as const).map((k) => (
              <div key={k} className="space-y-1"><Label className="text-xs capitalize">{k}</Label>
                <Input type="number" value={widget.config[k] ?? ""} onChange={(e) => onChange({ config: { ...widget.config, [k]: Number(e.target.value) } })} className="h-7 text-xs" /></div>
            ))}
          </div>
        )}
        {widget.type === "text" && (
          <div className="space-y-1"><Label className="text-xs">Texto</Label>
            <Input value={widget.config.text ?? ""} onChange={(e) => onChange({ config: { ...widget.config, text: e.target.value } })} className="h-7 text-xs" /></div>
        )}
        {widget.type === "alarms" && (
          <div className="space-y-1"><Label className="text-xs">Máx. alarmas</Label>
            <Input type="number" min={1} max={10} value={widget.config.maxItems ?? 4}
              onChange={(e) => onChange({ config: { ...widget.config, maxItems: Number(e.target.value) } })} className="h-7 text-xs" /></div>
        )}
      </div>
      <div className="p-3 border-t border-slate-200">
        <Button variant="destructive" size="sm" className="w-full gap-2" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />Eliminar widget
        </Button>
      </div>
    </div>
  );
}

// ── Dashboard Editor ───────────────────────────────────────────────────────────
let _wid = 200;
function newWid() { return `w-new-${++_wid}`; }

function DashboardEditor({ dashboard, onBack, onSave }: {
  dashboard: Dashboard;
  onBack: () => void;
  onSave: (db: Dashboard) => void;
}) {
  const [db, setDb] = useState<Dashboard>(dashboard);
  const [editMode, setEditMode] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showToolbox, setShowToolbox] = useState(true);

  const selectedWidget = db.widgets.find((w) => w.id === selectedId) ?? null;

  const addWidget = useCallback((type: WidgetType, colSpan: number, rowSpan: number) => {
    const id = newWid();
    const defaults: Record<WidgetType, WidgetConfig> = {
      kpi: { tagName: "TAG-001", value: 100, target: 120, unit: "kW", trend: "stable", status: "ok" },
      trend: { series: [{ name: "Serie 1", color: "#3b82f6" }], period: "24h" },
      bar: { series: [{ name: "Serie 1", color: "#3b82f6" }], period: "7d" },
      gauge: { min: 0, max: 100, current: 50, unit: "%" },
      alarms: { maxItems: 4 },
      text: { text: "Título o descripción", fontSize: "base" },
    };
    setDb((p) => ({ ...p, widgets: [...p.widgets, { id, type, title: type.toUpperCase(), colSpan, rowSpan, config: defaults[type] }] }));
    setSelectedId(id);
  }, []);

  const updateWidget = useCallback((id: string, updates: Partial<Widget>) => {
    setDb((p) => ({ ...p, widgets: p.widgets.map((w) => w.id === id ? { ...w, ...updates } : w) }));
  }, []);

  const deleteWidget = useCallback((id: string) => {
    setDb((p) => ({ ...p, widgets: p.widgets.filter((w) => w.id !== id) }));
    setSelectedId(null);
  }, []);

  const ROW_H = 160;
  const showConfig = editMode && selectedWidget;

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />Dashboards
        </Button>
        <div className="h-4 w-px bg-slate-200" />
        {editMode && (
          <Button variant="ghost" size="sm" onClick={() => setShowToolbox((p) => !p)} className="gap-1.5">
            <PanelLeft className="h-4 w-4" />Toolbox
          </Button>
        )}
        <input
          className="flex-1 max-w-sm text-sm font-medium border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-300 rounded px-2 py-1"
          value={db.name}
          onChange={(e) => setDb((p) => ({ ...p, name: e.target.value }))}
        />
        {db.isLive && (
          <Badge variant="destructive" className="text-xs gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />LIVE
          </Badge>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button onClick={() => setEditMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${editMode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              <PencilRuler className="h-3.5 w-3.5" />Editar
            </button>
            <button onClick={() => { setEditMode(false); setSelectedId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${!editMode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              <Eye className="h-3.5 w-3.5" />Ver
            </button>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => onSave(db)}>
            <Save className="h-3.5 w-3.5" />Guardar
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Toolbox */}
        {editMode && showToolbox && (
          <aside className="w-52 shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-3 space-y-4">
            {TOOLBOX.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button key={item.type} onClick={() => addWidget(item.type, item.defaultColSpan, item.defaultRowSpan)}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors text-left">
                      <span className="text-slate-400">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>
        )}

        {/* Canvas */}
        <main
          className="flex-1 overflow-auto p-4"
          onClick={() => editMode && setSelectedId(null)}
        >
          {db.widgets.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-slate-400">
              <LayoutDashboard className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm font-medium">Canvas vacío</p>
              <p className="text-xs mt-1">Añade widgets desde la barra lateral</p>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                gridAutoRows: `${ROW_H}px`,
                backgroundImage: editMode ? "linear-gradient(to right, rgba(148,163,184,0.15) 1px, transparent 1px)" : "none",
                backgroundSize: `calc(100% / 12) auto`,
              }}
            >
              {db.widgets.map((w) => (
                <div
                  key={w.id}
                  className={`rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col transition-all
                    ${editMode ? "cursor-pointer hover:shadow-md" : ""}
                    ${editMode && selectedId === w.id ? "border-slate-900 ring-2 ring-slate-900/20 shadow-md" : "border-slate-200"}
                  `}
                  style={{ gridColumn: `span ${w.colSpan}`, gridRow: `span ${w.rowSpan}` }}
                  onClick={(e) => { e.stopPropagation(); if (editMode) setSelectedId(w.id); }}
                >
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-600 truncate">{w.title}</p>
                    {editMode && (
                      <button onClick={(e) => { e.stopPropagation(); deleteWidget(w.id); }} className="text-slate-300 hover:text-red-500 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden px-3 pb-2 pt-1">
                    <WidgetRenderer w={w} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Config panel */}
        {showConfig && (
          <aside className="w-60 shrink-0 border-l border-slate-200 bg-white">
            <WidgetConfigPanel
              widget={selectedWidget}
              onChange={(updates) => updateWidget(selectedWidget.id, updates)}
              onDelete={() => deleteWidget(selectedWidget.id)}
              onClose={() => setSelectedId(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

// ── Dashboard List ─────────────────────────────────────────────────────────────
const CAT_COLOR: Record<DashboardCategory, string> = {
  Industria: "bg-blue-100 text-blue-700",
  Edificios: "bg-teal-100 text-teal-700",
  Oficinas: "bg-purple-100 text-purple-700",
  Residencial: "bg-emerald-100 text-emerald-700",
  General: "bg-slate-100 text-slate-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function DashboardList({ dashboards, onEdit, onCreate }: {
  dashboards: Dashboard[];
  onEdit: (db: Dashboard) => void;
  onCreate: (db: Dashboard) => void;
}) {
  const [activeTab, setActiveTab] = useState<"mine" | "templates">("mine");
  const [search, setSearch] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<DashboardCategory>("Industria");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? dashboards.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)) : dashboards;
  }, [dashboards, search]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const db: Dashboard = {
      id: `db-${Date.now()}`, name: newName.trim(), description: newDesc.trim(),
      category: newCategory, owner: "admin", visibility: "Privado", isLive: false,
      widgets: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    onCreate(db);
    setNewDialogOpen(false);
    setNewName(""); setNewDesc("");
  };

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboards</h1>
            <p className="mt-1 text-sm text-slate-500">Crea y personaliza dashboards con widgets, KPIs y gráficas.</p>
          </div>
          <Button onClick={() => setNewDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Nuevo Dashboard
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Dashboards totales", value: dashboards.length, color: "text-slate-700" },
            { label: "En tiempo real", value: dashboards.filter((d) => d.isLive).length, color: "text-red-600" },
            { label: "Compartidos", value: dashboards.filter((d) => d.visibility === "Compartido").length, color: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4">
          <div className="flex">
            {(["mine", "templates"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                {tab === "mine" ? "Mis Dashboards" : "Plantillas"}
              </button>
            ))}
          </div>
          <div className="relative w-56">
            <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>

        <div className="p-4">
          {activeTab === "mine" && (
            filtered.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-slate-400">
                <LayoutDashboard className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No hay dashboards.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((db) => (
                  <div key={db.id} className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CAT_COLOR[db.category]}`}>{db.category}</span>
                          {db.isLive && <Badge variant="destructive" className="text-[9px] py-0 px-1 h-4">LIVE</Badge>}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 truncate">{db.name}</p>
                        <p className="text-xs text-slate-500 truncate">{db.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{db.widgets.length} widgets</span>
                      <span>·</span>
                      <span>{db.visibility}</span>
                      <span>·</span>
                      <span>{formatDate(db.updatedAt)}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => onEdit(db)}>
                        <PencilRuler className="mr-1.5 h-3 w-3" />Editar
                      </Button>
                      <Button variant="outline" size="icon-xs" title="Ver"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="outline" size="icon-xs" title="Compartir"><Share2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="outline" size="icon-xs" title="Duplicar"><Copy className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "templates" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((tpl) => (
                <div key={tpl.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CAT_COLOR[tpl.category as DashboardCategory]}`}>{tpl.category}</span>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{tpl.name}</p>
                    <p className="text-xs text-slate-500">{tpl.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{tpl.widgetCount} widgets incluidos</p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1.5"
                    onClick={() => {
                      const db: Dashboard = { id: `db-${Date.now()}`, name: tpl.name, description: tpl.description, category: tpl.category as DashboardCategory, owner: "admin", visibility: "Privado", isLive: false, widgets: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                      onCreate(db);
                    }}>
                    <Plus className="h-3 w-3" />Usar plantilla
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={newDialogOpen} onOpenChange={(v) => { if (!v) setNewDialogOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Dashboard</DialogTitle>
            <DialogDescription>Crea un dashboard en blanco y empieza a añadir widgets.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nombre *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Mi Dashboard" autoFocus /></div>
            <div className="space-y-1"><Label>Descripción</Label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descripción breve" /></div>
            <div className="space-y-1"><Label>Categoría</Label>
              <Select value={newCategory} onValueChange={(v) => setNewCategory(v as DashboardCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Industria","Edificios","Oficinas","Residencial","General"] as DashboardCategory[]).map((c) =>
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  )}
                </SelectContent>
              </Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Crear y editar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>(INITIAL_DASHBOARDS);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);

  const handleSave = useCallback((db: Dashboard) => {
    setDashboards((p) => {
      const exists = p.find((d) => d.id === db.id);
      return exists ? p.map((d) => d.id === db.id ? { ...db, updatedAt: new Date().toISOString() } : d) : [...p, { ...db, updatedAt: new Date().toISOString() }];
    });
    setEditingDashboard(null);
  }, []);

  const handleCreate = useCallback((db: Dashboard) => {
    setDashboards((p) => [...p, db]);
    setEditingDashboard(db);
  }, []);

  if (editingDashboard) {
    return (
      <DashboardEditor
        dashboard={editingDashboard}
        onBack={() => setEditingDashboard(null)}
        onSave={handleSave}
      />
    );
  }

  return (
    <DashboardList
      dashboards={dashboards}
      onEdit={setEditingDashboard}
      onCreate={handleCreate}
    />
  );
}
