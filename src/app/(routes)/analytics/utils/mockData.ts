import type { DataPoint, SeriesConfig, PeriodConfig, TagRef } from "../types/analytics.types";
import { TimePeriodPreset } from "../types/analytics.types";

// ── Period helpers ─────────────────────────────────────────────────────────────
export function periodToRange(period: PeriodConfig): { from: number; to: number } {
  const now = Date.now();
  const presetMs: Record<string, number> = {
    "5m": 5 * 60000,
    "15m": 15 * 60000,
    "1h": 60 * 60000,
    "6h": 6 * 60 * 60000,
    "24h": 24 * 60 * 60000,
    "7d": 7 * 24 * 60 * 60000,
    "30d": 30 * 24 * 60 * 60000,
  };
  if (period.preset === TimePeriodPreset.CUSTOM && period.from && period.to) {
    return { from: new Date(period.from).getTime(), to: new Date(period.to).getTime() };
  }
  const ms = presetMs[period.preset] ?? 60 * 60000;
  return { from: now - ms, to: now };
}

// ── Resolution ─────────────────────────────────────────────────────────────────
function resolveStepMs(rangeMs: number): number {
  if (rangeMs <= 5 * 60000) return 10000;        // 10s
  if (rangeMs <= 15 * 60000) return 30000;       // 30s
  if (rangeMs <= 60 * 60000) return 60000;       // 1m
  if (rangeMs <= 6 * 60 * 60000) return 5 * 60000;  // 5m
  if (rangeMs <= 24 * 60 * 60000) return 15 * 60000; // 15m
  if (rangeMs <= 7 * 24 * 60 * 60000) return 60 * 60000; // 1h
  return 6 * 60 * 60000;                         // 6h
}

// ── Per-tag signal parameters ──────────────────────────────────────────────────
const TAG_PARAMS: Record<string, { base: number; amp: number; freq: number; noise: number }> = {
  "T-TEMP-001":         { base: 250,  amp: 18,  freq: 0.00012, noise: 2   },
  "T-TEMP-002":         { base: 180,  amp: 12,  freq: 0.00010, noise: 1.5 },
  "E-KW-TOTAL":         { base: 340,  amp: 65,  freq: 0.00008, noise: 8   },
  "F-FLOW-HH2O":        { base: 3.2,  amp: 0.8, freq: 0.00015, noise: 0.1 },
  "P-PRES-VAPOR":       { base: 4.5,  amp: 1.2, freq: 0.00009, noise: 0.2 },
  "DB-PROD-UNITS":      { base: 850,  amp: 120, freq: 0.00005, noise: 15  },
  "VT-TEMP-AVG":        { base: 215,  amp: 15,  freq: 0.00011, noise: 1   },
  "VT-EFF-LINE1":       { base: 82,   amp: 8,   freq: 0.00007, noise: 1.5 },
  "KPI-COSTE-ELEC-DIA": { base: 320,  amp: 80,  freq: 0.00004, noise: 10  },
  "KPI-EFF-PROD":       { base: 78,   amp: 10,  freq: 0.00006, noise: 2   },
};

// Deterministic noise using tag name as seed
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateSignal(tagName: string, ts: number, seriesIdx: number): number {
  const p = TAG_PARAMS[tagName] ?? { base: 100, amp: 20, freq: 0.0001, noise: 3 };
  const signal = p.base + p.amp * Math.sin(p.freq * ts + seriesIdx * 1.3);
  const n = (pseudoRandom(ts / 1000 + seriesIdx * 77) - 0.5) * 2 * p.noise;
  return Math.round((signal + n) * 100) / 100;
}

// ── Main generator ─────────────────────────────────────────────────────────────
export function generateSeriesData(
  series: SeriesConfig[],
  period: PeriodConfig
): Map<string, DataPoint[]> {
  const { from, to } = periodToRange(period);
  const rangeMs = to - from;
  const stepMs = resolveStepMs(rangeMs);
  const result = new Map<string, DataPoint[]>();

  series.forEach((s, idx) => {
    const points: DataPoint[] = [];
    for (let ts = from; ts <= to; ts += stepMs) {
      // Introduce occasional gaps (~2%)
      if (pseudoRandom(ts / stepMs + idx * 13) < 0.02) {
        points.push({ ts, value: null });
      } else {
        points.push({ ts, value: generateSignal(s.tagRef.name, ts, idx) });
      }
    }
    result.set(s.id, points);
  });

  return result;
}

// ── Axis helpers ───────────────────────────────────────────────────────────────
export function niceRange(min: number, max: number, ticks = 5): { min: number; max: number; step: number } {
  const range = max - min || 1;
  const rawStep = range / (ticks - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = Math.ceil(rawStep / magnitude) * magnitude;
  const nMin = Math.floor(min / step) * step;
  const nMax = Math.ceil(max / step) * step;
  return { min: nMin, max: nMax, step };
}

export function formatTs(ts: number, rangeMs: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (rangeMs <= 24 * 60 * 60000) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatValue(v: number | null, unit: string): string {
  if (v === null) return "—";
  return `${v.toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${unit}`.trim();
}

// ── Default saved analytics ────────────────────────────────────────────────────
import type { AnalyticsView } from "../types/analytics.types";
import { VizType, DataSource, AggregationFn, ResolutionPreset, RealTimeInterval, NullHandling } from "../types/analytics.types";

export const SERIES_COLORS = ["#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6","#06b6d4","#f97316","#ec4899"];

function makeView(partial: Partial<AnalyticsView> & { id: string; name: string; series: SeriesConfig[] }): AnalyticsView {
  return {
    description: "",
    vizType: VizType.TREND,
    period: { preset: TimePeriodPreset.H1 },
    resolution: ResolutionPreset.AUTO,
    nullHandling: NullHandling.INTERPOLATE,
    realTime: { enabled: false, intervalMs: RealTimeInterval.S5, windowPreset: TimePeriodPreset.M15, paused: false },
    vizOptions: { showLegend: true, showGrid: true, yAutoScale: true },
    createdAt: "2026-02-10T08:00:00.000Z",
    updatedAt: "2026-02-17T14:30:00.000Z",
    ...partial,
  };
}

function makeSeries(tagName: string, alias: string, unit: string, source: DataSource, idx: number): SeriesConfig {
  return {
    id: `s-${tagName}-${idx}`,
    tagRef: { name: tagName, source },
    alias,
    unit,
    color: SERIES_COLORS[idx % SERIES_COLORS.length],
    enabled: true,
    aggregation: AggregationFn.AVG,
    yAxisSide: "left",
  };
}

export const SAVED_ANALYTICS: AnalyticsView[] = [
  makeView({
    id: "av-01",
    name: "Consumo eléctrico + temperatura",
    description: "Correlación entre consumo y temperatura del horno",
    series: [
      makeSeries("E-KW-TOTAL", "Consumo total", "kW", DataSource.PHYSICAL, 0),
      makeSeries("T-TEMP-001", "Temp. entrada", "°C", DataSource.PHYSICAL, 1),
    ],
    period: { preset: TimePeriodPreset.H6 },
    updatedAt: "2026-02-17T14:30:00.000Z",
  }),
  makeView({
    id: "av-02",
    name: "KPI de eficiencia y coste",
    description: "Seguimiento de KPIs de negocio",
    vizType: VizType.BAR,
    series: [
      makeSeries("KPI-EFF-PROD", "Eficiencia producción", "%", DataSource.KPI, 2),
      makeSeries("KPI-COSTE-ELEC-DIA", "Coste eléctrico", "€/día", DataSource.KPI, 4),
    ],
    period: { preset: TimePeriodPreset.D7 },
    updatedAt: "2026-02-15T09:00:00.000Z",
  }),
  makeView({
    id: "av-03",
    name: "Tabla de variables proceso",
    description: "Raw data — temperatura, presión y caudal",
    vizType: VizType.TABLE,
    series: [
      makeSeries("T-TEMP-001", "Temp. entrada", "°C", DataSource.PHYSICAL, 0),
      makeSeries("P-PRES-VAPOR", "Presión vapor", "bar", DataSource.PHYSICAL, 5),
      makeSeries("F-FLOW-HH2O", "Caudal agua", "m³/h", DataSource.PHYSICAL, 2),
    ],
    period: { preset: TimePeriodPreset.H24 },
    updatedAt: "2026-02-14T16:45:00.000Z",
  }),
  makeView({
    id: "av-04",
    name: "Monitor en tiempo real",
    description: "Tags críticos con refresco en vivo",
    series: [
      makeSeries("E-KW-TOTAL", "Consumo", "kW", DataSource.PHYSICAL, 0),
      makeSeries("T-TEMP-001", "Temp. horno", "°C", DataSource.PHYSICAL, 1),
      makeSeries("VT-EFF-LINE1", "Eficiencia L1", "%", DataSource.VIRTUAL, 2),
    ],
    realTime: { enabled: true, intervalMs: RealTimeInterval.S5, windowPreset: TimePeriodPreset.M15, paused: false },
    period: { preset: TimePeriodPreset.M15 },
    updatedAt: "2026-02-18T08:00:00.000Z",
  }),
];

export const ALL_TAGS: TagRef[] = [
  { name: "T-TEMP-001",  description: "Temperatura entrada horno",      engUnit: "°C",    source: DataSource.PHYSICAL },
  { name: "T-TEMP-002",  description: "Temperatura salida horno",       engUnit: "°C",    source: DataSource.PHYSICAL },
  { name: "E-KW-TOTAL",  description: "Consumo eléctrico total",        engUnit: "kW",    source: DataSource.PHYSICAL },
  { name: "F-FLOW-HH2O", description: "Caudal agua refrigeración",      engUnit: "m³/h",  source: DataSource.PHYSICAL },
  { name: "P-PRES-VAPOR",description: "Presión vapor saturado",         engUnit: "bar",   source: DataSource.PHYSICAL },
  { name: "DB-PROD-UNITS",description: "Unidades producidas",           engUnit: "",      source: DataSource.PHYSICAL },
  { name: "VT-TEMP-AVG", description: "Temperatura media horno",        engUnit: "°C",    source: DataSource.VIRTUAL  },
  { name: "VT-EFF-LINE1",description: "Eficiencia línea 1",             engUnit: "%",     source: DataSource.VIRTUAL  },
  { name: "KPI-COSTE-ELEC-DIA", description: "KPI coste eléctrico diario", engUnit: "€/día", source: DataSource.KPI },
  { name: "KPI-EFF-PROD",description: "KPI eficiencia de producción",   engUnit: "%",     source: DataSource.KPI      },
];
