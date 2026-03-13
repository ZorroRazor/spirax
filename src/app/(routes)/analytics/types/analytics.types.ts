// ── Enums ──────────────────────────────────────────────────────────────────────

export enum VizType { TREND = "Tendencia", BAR = "Barras", TABLE = "Tabla" }

export enum DataSource { PHYSICAL = "Tags Físicos", VIRTUAL = "Tags Virtuales", KPI = "KPI" }

export enum AggregationFn { AVG = "avg", MIN = "min", MAX = "max", SUM = "sum", LAST = "last" }

export enum ResolutionPreset {
  AUTO = "auto",
  S1 = "1s", S10 = "10s",
  M1 = "1m", M5 = "5m", M15 = "15m",
  H1 = "1h", H6 = "6h",
  D1 = "1d",
}

export enum TimePeriodPreset {
  M5 = "5m", M15 = "15m",
  H1 = "1h", H6 = "6h", H24 = "24h",
  D7 = "7d", D30 = "30d",
  CUSTOM = "custom",
  CONTEXTO = "contexto",
}

export enum RealTimeInterval { S1 = 1000, S2 = 2000, S5 = 5000, S10 = 10000 }

export enum NullHandling { GAP = "gap", INTERPOLATE = "interpolate", LAST = "last" }

// ── Series ─────────────────────────────────────────────────────────────────────

export type TagRef = {
  name: string;
  description?: string;
  engUnit?: string;
  source: DataSource;
};

export type SeriesConfig = {
  id: string;                 // generated uuid
  tagRef: TagRef;
  alias: string;              // display name
  unit: string;               // displayed unit
  color: string;              // hex color
  enabled: boolean;
  aggregation: AggregationFn;
  yAxisSide: "left" | "right";
};

// ── Analytics view ─────────────────────────────────────────────────────────────

export type PeriodConfig = {
  preset: TimePeriodPreset;
  from?: string;              // ISO, only when preset=CUSTOM or CONTEXTO
  to?: string;
  contextId?: string;         // contextUUID, only when preset=CONTEXTO
};

export type RealTimeConfig = {
  enabled: boolean;
  intervalMs: RealTimeInterval;
  windowPreset: TimePeriodPreset;
  paused: boolean;
};

export type VizOptions = {
  showLegend: boolean;
  showGrid: boolean;
  yAutoScale: boolean;
  yMin?: number;
  yMax?: number;
  // bar specific
  barAggregation?: AggregationFn;
  // table specific
  pageSize?: number;
};

export type AnalyticsView = {
  id: string;
  name: string;
  description?: string;
  vizType: VizType;
  series: SeriesConfig[];
  period: PeriodConfig;
  resolution: ResolutionPreset;
  nullHandling: NullHandling;
  realTime: RealTimeConfig;
  vizOptions: VizOptions;
  createdAt: string;
  updatedAt: string;
};

// ── Data point ─────────────────────────────────────────────────────────────────

export type DataPoint = { ts: number; value: number | null };
export type SeriesData = { seriesId: string; points: DataPoint[] };
