"use client";

import { useState } from "react";
import type { SeriesConfig, DataPoint, AggregationFn } from "../types/analytics.types";
import { niceRange, formatTs, formatValue, periodToRange } from "../utils/mockData";
import type { PeriodConfig } from "../types/analytics.types";

type Props = {
  series: SeriesConfig[];
  data: Map<string, DataPoint[]>;
  period: PeriodConfig;
  aggregation: AggregationFn;
  showLegend: boolean;
  showGrid: boolean;
};

const MARGIN = { top: 20, right: 20, bottom: 46, left: 60 };
const W = 800;
const H = 340;

function aggregate(values: number[], fn: AggregationFn): number {
  if (!values.length) return 0;
  switch (fn) {
    case "avg": return values.reduce((a, b) => a + b, 0) / values.length;
    case "min": return Math.min(...values);
    case "max": return Math.max(...values);
    case "sum": return values.reduce((a, b) => a + b, 0);
    case "last": return values[values.length - 1];
    default: return values[values.length - 1];
  }
}

// Bucket points into N intervals
function bucketize(points: DataPoint[], from: number, to: number, buckets: number): { center: number; values: number[] }[] {
  const bucketMs = (to - from) / buckets;
  const result = Array.from({ length: buckets }, (_, i) => ({
    center: from + bucketMs * i + bucketMs / 2,
    values: [] as number[],
  }));
  points.forEach((p) => {
    if (p.value === null) return;
    const idx = Math.min(Math.floor((p.ts - from) / bucketMs), buckets - 1);
    if (idx >= 0) result[idx].values.push(p.value);
  });
  return result;
}

export function BarChart({ series, data, period, aggregation, showLegend, showGrid }: Props) {
  const [tooltip, setTooltip] = useState<{ bIdx: number; x: number; y: number } | null>(null);
  const { from, to } = periodToRange(period);
  const rangeMs = to - from;

  const enabledSeries = series.filter((s) => s.enabled);
  const BUCKETS = Math.min(20, Math.max(6, Math.floor(rangeMs / 60000 / 5)));

  // Build aggregated data per series
  const bucketedData = enabledSeries.map((s) => ({
    s,
    buckets: bucketize(data.get(s.id) ?? [], from, to, BUCKETS).map((b) => ({
      center: b.center,
      value: b.values.length ? aggregate(b.values, aggregation) : 0,
    })),
  }));

  // Y scale
  const allAgg = bucketedData.flatMap((bd) => bd.buckets.map((b) => b.value));
  const dataMax = allAgg.length ? Math.max(...allAgg) : 100;
  const { min: yMin, max: yMax, step: yStep } = niceRange(0, dataMax);

  const chartW = W - MARGIN.left - MARGIN.right;
  const chartH = H - MARGIN.top - MARGIN.bottom;

  function yScale(v: number): number {
    const range = yMax - yMin || 1;
    return MARGIN.top + chartH - ((v - yMin) / range) * chartH;
  }

  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax + yStep * 0.01; v += yStep) {
    yTicks.push(Math.round(v * 100) / 100);
  }

  const bucketW = chartW / BUCKETS;
  const barPad = 2;
  const totalBarPad = (enabledSeries.length + 1) * barPad;
  const barW = Math.max(2, (bucketW - totalBarPad) / Math.max(1, enabledSeries.length));

  // X ticks: ~6 evenly spaced
  const xTickStep = Math.max(1, Math.floor(BUCKETS / 6));
  const xTicks = Array.from({ length: BUCKETS }, (_, i) => i).filter((i) => i % xTickStep === 0);

  if (series.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Selecciona al menos una serie para visualizar datos.
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      {showLegend && (
        <div className="flex flex-wrap gap-3 px-1">
          {enabledSeries.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              <span>{s.alias || s.tagRef.name}</span>
              {s.unit && <span className="text-slate-400">({s.unit})</span>}
              <span className="text-slate-400 uppercase text-[10px]">{aggregation}</span>
            </div>
          ))}
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: "260px" }}>
          {/* Grid */}
          {showGrid && yTicks.map((v) => (
            <line
              key={v}
              x1={MARGIN.left} y1={yScale(v).toFixed(1)}
              x2={W - MARGIN.right} y2={yScale(v).toFixed(1)}
              stroke="#e2e8f0" strokeWidth="1"
            />
          ))}

          {/* Y axis */}
          <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + chartH} stroke="#94a3b8" strokeWidth="1.5" />
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={MARGIN.left - 4} y1={yScale(v).toFixed(1)} x2={MARGIN.left} y2={yScale(v).toFixed(1)} stroke="#94a3b8" />
              <text x={MARGIN.left - 8} y={yScale(v)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#64748b">
                {v.toLocaleString("es-ES", { maximumFractionDigits: 1 })}
              </text>
            </g>
          ))}

          {/* X axis */}
          <line x1={MARGIN.left} y1={MARGIN.top + chartH} x2={W - MARGIN.right} y2={MARGIN.top + chartH} stroke="#94a3b8" strokeWidth="1.5" />
          {xTicks.map((bIdx) => {
            const cx = MARGIN.left + bIdx * bucketW + bucketW / 2;
            const ts = from + (rangeMs / BUCKETS) * bIdx;
            return (
              <g key={bIdx}>
                <line x1={cx.toFixed(1)} y1={MARGIN.top + chartH} x2={cx.toFixed(1)} y2={MARGIN.top + chartH + 4} stroke="#94a3b8" />
                <text x={cx} y={MARGIN.top + chartH + 16} textAnchor="middle" fontSize="10" fill="#64748b">
                  {formatTs(ts, rangeMs)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {bucketedData.map(({ s, buckets }, sIdx) =>
            buckets.map((b, bIdx) => {
              const cx = MARGIN.left + bIdx * bucketW + barPad + sIdx * (barW + barPad);
              const barH = Math.max(0, chartH - (yScale(b.value) - MARGIN.top));
              const barY = yScale(b.value);
              const isHovered = tooltip?.bIdx === bIdx;
              return (
                <rect
                  key={`${s.id}-${bIdx}`}
                  x={cx.toFixed(1)} y={barY.toFixed(1)}
                  width={barW.toFixed(1)} height={barH.toFixed(1)}
                  fill={s.color}
                  opacity={isHovered ? 1 : 0.8}
                  rx="2"
                  onMouseEnter={(e) => setTooltip({ bIdx, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: "default" }}
                />
              );
            })
          )}
        </svg>

        {/* Tooltip */}
        {tooltip !== null && (
          <div
            className="pointer-events-none fixed z-20 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          >
            <p className="font-medium text-slate-700 mb-1">
              {formatTs(from + (rangeMs / BUCKETS) * tooltip.bIdx, rangeMs)}
            </p>
            {bucketedData.map(({ s, buckets }) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />
                <span className="text-slate-600">{s.alias || s.tagRef.name}:</span>
                <span className="font-medium">{formatValue(buckets[tooltip.bIdx]?.value ?? null, s.unit)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
