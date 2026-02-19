"use client";

import { useRef, useState, useCallback } from "react";
import type { SeriesConfig, DataPoint } from "../types/analytics.types";
import { niceRange, formatTs, formatValue, periodToRange } from "../utils/mockData";
import type { PeriodConfig } from "../types/analytics.types";

type Props = {
  series: SeriesConfig[];
  data: Map<string, DataPoint[]>;
  period: PeriodConfig;
  showLegend: boolean;
  showGrid: boolean;
  yAutoScale: boolean;
  yMin?: number;
  yMax?: number;
};

const MARGIN = { top: 20, right: 20, bottom: 40, left: 60 };
const TICK_COUNT = 5;

export function TrendChart({ series, data, period, showLegend, showGrid, yAutoScale, yMin, yMax }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; ts: number; values: { s: SeriesConfig; v: number | null }[] } | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const { from, to } = periodToRange(period);
  const rangeMs = to - from;

  // Collect all values for Y scale
  const allValues: number[] = [];
  series.forEach((s) => {
    if (hiddenIds.has(s.id)) return;
    data.get(s.id)?.forEach((p) => { if (p.value !== null) allValues.push(p.value); });
  });

  const dataMin = allValues.length ? Math.min(...allValues) : 0;
  const dataMax = allValues.length ? Math.max(...allValues) : 100;
  const { min: yRangeMin, max: yRangeMax, step: yStep } = niceRange(
    yAutoScale ? dataMin : (yMin ?? dataMin),
    yAutoScale ? dataMax : (yMax ?? dataMax),
    TICK_COUNT
  );

  // Compute chart dimensions — use 100% width, fixed height
  const W = 800; // viewBox width
  const H = 340;
  const chartW = W - MARGIN.left - MARGIN.right;
  const chartH = H - MARGIN.top - MARGIN.bottom;

  function xScale(ts: number): number {
    return MARGIN.left + ((ts - from) / (rangeMs || 1)) * chartW;
  }
  function yScale(v: number): number {
    const range = yRangeMax - yRangeMin || 1;
    return MARGIN.top + chartH - ((v - yRangeMin) / range) * chartH;
  }

  // Build polyline points per series
  function buildPath(points: DataPoint[]): string {
    const segments: string[] = [];
    let current = "";
    points.forEach((p) => {
      if (p.value === null) {
        if (current) { segments.push(current); current = ""; }
        return;
      }
      const x = xScale(p.ts);
      const y = yScale(p.value);
      current += current ? ` L ${x.toFixed(1)},${y.toFixed(1)}` : `M ${x.toFixed(1)},${y.toFixed(1)}`;
    });
    if (current) segments.push(current);
    return segments.join(" ");
  }

  // Y-axis ticks
  const yTicks: number[] = [];
  for (let v = yRangeMin; v <= yRangeMax + yStep * 0.01; v += yStep) {
    yTicks.push(Math.round(v * 100) / 100);
  }

  // X-axis ticks (6 evenly spaced)
  const xTickCount = 6;
  const xTicks: number[] = Array.from({ length: xTickCount }, (_, i) =>
    from + (rangeMs / (xTickCount - 1)) * i
  );

  // Mouse move for tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const chartMx = mx - MARGIN.left;
    if (chartMx < 0 || chartMx > chartW) { setTooltip(null); return; }

    const ts = from + (chartMx / chartW) * rangeMs;

    // Find nearest data point for each series
    const values = series.map((s) => {
      if (hiddenIds.has(s.id)) return null;
      const pts = data.get(s.id) ?? [];
      let nearest: DataPoint | null = null as DataPoint | null;
      let minDiff = Infinity;
      pts.forEach((p) => {
        const diff = Math.abs(p.ts - ts);
        if (diff < minDiff) { minDiff = diff; nearest = p; }
      });
      return { s, v: nearest?.value ?? null };
    }).filter(Boolean) as { s: SeriesConfig; v: number | null }[];

    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, ts, values });
  }, [series, data, from, rangeMs, chartW, hiddenIds]);

  const toggleSeries = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (series.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Selecciona al menos una serie para visualizar datos.
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-3 px-1">
          {series.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSeries(s.id)}
              className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 transition-opacity ${hiddenIds.has(s.id) ? "opacity-40" : ""}`}
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <span>{s.alias || s.tagRef.name}</span>
              {s.unit && <span className="text-slate-400">({s.unit})</span>}
            </button>
          ))}
        </div>
      )}

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minHeight: "260px" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Grid */}
          {showGrid && yTicks.map((v) => (
            <line
              key={v}
              x1={MARGIN.left} y1={yScale(v).toFixed(1)}
              x2={W - MARGIN.right} y2={yScale(v).toFixed(1)}
              stroke="#e2e8f0" strokeWidth="1"
            />
          ))}
          {showGrid && xTicks.map((ts) => (
            <line
              key={ts}
              x1={xScale(ts).toFixed(1)} y1={MARGIN.top}
              x2={xScale(ts).toFixed(1)} y2={MARGIN.top + chartH}
              stroke="#e2e8f0" strokeWidth="1"
            />
          ))}

          {/* Y axis */}
          <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + chartH} stroke="#94a3b8" strokeWidth="1.5" />
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={MARGIN.left - 4} y1={yScale(v).toFixed(1)} x2={MARGIN.left} y2={yScale(v).toFixed(1)} stroke="#94a3b8" strokeWidth="1" />
              <text
                x={MARGIN.left - 8} y={yScale(v)}
                textAnchor="end" dominantBaseline="middle"
                fontSize="11" fill="#64748b"
              >
                {v.toLocaleString("es-ES", { maximumFractionDigits: 1 })}
              </text>
            </g>
          ))}

          {/* X axis */}
          <line x1={MARGIN.left} y1={MARGIN.top + chartH} x2={W - MARGIN.right} y2={MARGIN.top + chartH} stroke="#94a3b8" strokeWidth="1.5" />
          {xTicks.map((ts, i) => (
            <g key={ts}>
              <line x1={xScale(ts).toFixed(1)} y1={MARGIN.top + chartH} x2={xScale(ts).toFixed(1)} y2={MARGIN.top + chartH + 4} stroke="#94a3b8" strokeWidth="1" />
              <text
                x={xScale(ts)} y={MARGIN.top + chartH + 16}
                textAnchor={i === 0 ? "start" : i === xTickCount - 1 ? "end" : "middle"}
                fontSize="10" fill="#64748b"
              >
                {formatTs(ts, rangeMs)}
              </text>
            </g>
          ))}

          {/* Series lines */}
          {series.map((s) => {
            if (hiddenIds.has(s.id)) return null;
            const pts = data.get(s.id) ?? [];
            const d = buildPath(pts);
            if (!d) return null;
            return (
              <path
                key={s.id}
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}

          {/* Tooltip crosshair */}
          {tooltip && (
            <line
              x1={xScale(tooltip.ts).toFixed(1)} y1={MARGIN.top}
              x2={xScale(tooltip.ts).toFixed(1)} y2={MARGIN.top + chartH}
              stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,3"
            />
          )}
        </svg>

        {/* Tooltip floating box */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs"
            style={{
              left: Math.min(tooltip.x + 12, 600),
              top: Math.max(tooltip.y - 10, 0),
            }}
          >
            <p className="font-medium text-slate-700 mb-1">{formatTs(tooltip.ts, rangeMs)}</p>
            {tooltip.values.map(({ s, v }) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="text-slate-600">{s.alias || s.tagRef.name}:</span>
                <span className="font-medium text-slate-900">{formatValue(v, s.unit)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
