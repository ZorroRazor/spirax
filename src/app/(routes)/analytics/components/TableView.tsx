"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SeriesConfig, DataPoint } from "../types/analytics.types";
import { formatValue, periodToRange } from "../utils/mockData";
import type { PeriodConfig } from "../types/analytics.types";

type Props = {
  series: SeriesConfig[];
  data: Map<string, DataPoint[]>;
  period: PeriodConfig;
  pageSize?: number;
};

function formatFullTs(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function TableView({ series, data, period, pageSize = 50 }: Props) {
  const [page, setPage] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);

  const enabledSeries = series.filter((s) => s.enabled);
  const { from, to } = periodToRange(period);

  // Build unified rows: align on same timestamps from first series
  const rows = useMemo(() => {
    const tsSet = new Set<number>();
    enabledSeries.forEach((s) => {
      data.get(s.id)?.forEach((p) => {
        if (p.ts >= from && p.ts <= to) tsSet.add(p.ts);
      });
    });

    const sorted = [...tsSet].sort((a, b) => (sortDesc ? b - a : a - b));
    return sorted.map((ts) => ({
      ts,
      values: enabledSeries.map((s) => {
        const pts = data.get(s.id) ?? [];
        const pt = pts.find((p) => p.ts === ts);
        return pt?.value ?? null;
      }),
    }));
  }, [enabledSeries, data, from, to, sortDesc]);

  const totalPages = Math.ceil(rows.length / pageSize);
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  if (series.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Selecciona al menos una serie para ver la tabla de datos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead
                className="cursor-pointer select-none whitespace-nowrap w-44"
                onClick={() => { setSortDesc(!sortDesc); setPage(0); }}
              >
                Timestamp {sortDesc ? "↓" : "↑"}
              </TableHead>
              {enabledSeries.map((s) => (
                <TableHead key={s.id} className="whitespace-nowrap">
                  {s.alias || s.tagRef.name}
                  {s.unit && <span className="ml-1 text-slate-400 font-normal">({s.unit})</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={enabledSeries.length + 1} className="py-10 text-center text-sm text-slate-400">
                  No hay datos en el periodo seleccionado.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.ts} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                    {formatFullTs(row.ts)}
                  </TableCell>
                  {row.values.map((v, i) => (
                    <TableCell key={i} className={`text-sm ${v === null ? "text-slate-300" : "text-slate-900"}`}>
                      {v === null ? "—" : v.toLocaleString("es-ES", { maximumFractionDigits: 3 })}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {rows.length.toLocaleString()} filas · página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon-xs" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
