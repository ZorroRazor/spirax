"use client";

import {
  WaBadge,
  WaCallout,
  WaCard,
  WaDivider,
  WaProgressBar,
  WaTag,
} from "@home-assistant/webawesome/dist/react";
import {
  Activity,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Droplets,
  Factory,
  Gauge,
  Minus,
  Package,
  ThermometerSun,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const plants = [
  {
    id: "norte",
    name: "Planta Norte",
    location: "Bilbao, Bizkaia",
    tagCount: 842,
    activeAlarms: 2,
    kw: 340,
    kwMax: 500,
    areas: ["Producción", "Utilities", "Almacén"],
  },
  {
    id: "sur",
    name: "Planta Sur",
    location: "Sevilla, Andalucía",
    tagCount: 145,
    activeAlarms: 0,
    kw: 78,
    kwMax: 200,
    areas: ["Logística", "Mantenimiento"],
  },
];

const glanceMetrics: {
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { label: "Consumo Total",    value: "340",   unit: "kW",   icon: Zap,            color: "bg-amber-500/15 text-amber-400"  },
  { label: "Temp. Horno",      value: "215",   unit: "°C",   icon: ThermometerSun, color: "bg-red-500/15 text-red-400"      },
  { label: "Eficiencia Prod.", value: "78.4",  unit: "%",    icon: Gauge,          color: "bg-sky-500/15 text-sky-400"      },
  { label: "Coste Eléctrico",  value: "320",   unit: "€/d",  icon: Activity,       color: "bg-purple-500/15 text-purple-400"},
  { label: "Caudal H₂O",      value: "3.2",   unit: "m³/h", icon: Droplets,       color: "bg-blue-500/15 text-blue-400"    },
  { label: "Producción",       value: "1.820", unit: "ud/h", icon: Package,        color: "bg-green-500/15 text-green-400"  },
];

const kpis: {
  name: string;
  value: string;
  unit: string;
  status: "ok" | "warning" | "critical";
  trend: "up" | "down" | "stable";
}[] = [
  { name: "Eficiencia Producción", value: "78.4",  unit: "%",    status: "warning",  trend: "down"   },
  { name: "Coste Eléctrico",       value: "320",   unit: "€/día",status: "ok",       trend: "stable" },
  { name: "Temperatura Horno",     value: "215",   unit: "°C",   status: "ok",       trend: "up"     },
  { name: "Factor de Carga",       value: "68",    unit: "%",    status: "ok",       trend: "stable" },
  { name: "Consumo Total",         value: "340",   unit: "kW",   status: "warning",  trend: "up"     },
  { name: "Unidades / hora",       value: "1.820", unit: "ud/h", status: "ok",       trend: "up"     },
];

const alarms = [
  { id: 1, priority: "CRÍTICA" as const, name: "Sobrecalentamiento Horno H-01",  plant: "Norte", time: "hace 4 min"  },
  { id: 2, priority: "ALTA"    as const, name: "Presión vapor fuera de rango",   plant: "Norte", time: "hace 22 min" },
  { id: 3, priority: "MEDIA"   as const, name: "Caudal H₂O bajo límite mínimo", plant: "Norte", time: "hace 1 h"    },
];

const activeContexts = [
  { uuid: "CO-001", name: "OF-2026-0142",     type: "OF",        variant: "brand"   },
  { uuid: "CO-002", name: "OF-2026-0143",     type: "OF",        variant: "brand"   },
  { uuid: "CO-003", name: "Turno Mañana S08", type: "TURNO",     variant: "neutral" },
  { uuid: "CO-006", name: "Valle Tarifario",  type: "TARIFARIO", variant: "warning" },
  { uuid: "CO-007", name: "HVAC Norte",       type: "HVAC",      variant: "success" },
];

const activity: { time: string; msg: string; type: "ok" | "info" | "critical" }[] = [
  { time: "09:42", msg: "OF-2026-0142 superó objetivo de producción (62%)",       type: "ok"       },
  { time: "09:18", msg: "Alarma reconocida: Presión vapor fuera de rango",         type: "ok"       },
  { time: "08:55", msg: "Turno Mañana S08 iniciado automáticamente",               type: "info"     },
  { time: "08:30", msg: "Exportación CSV completada — analytics-01",               type: "info"     },
  { time: "07:52", msg: "CRÍTICA: Sobrecalentamiento Horno H-01 detectado",        type: "critical" },
  { time: "07:00", msg: "Contexto tarifario Valle activado",                       type: "info"     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  ok:       "bg-[#4caf50]",
  warning:  "bg-[#ff9800]",
  critical: "bg-[#f44336]",
};

const ALARM_VARIANT: Record<string, "danger" | "warning" | "brand" | "neutral"> = {
  CRÍTICA: "danger",
  ALTA:    "warning",
  MEDIA:   "brand",
  BAJA:    "neutral",
};

const ACTIVITY_DOT: Record<string, string> = {
  ok:       "bg-[#4caf50]",
  info:     "bg-[#03a9f4]",
  critical: "bg-[#f44336]",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <section className="space-y-4 p-4 md:p-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-base font-semibold text-white">Overview</h1>
          <p className="mt-0.5 text-xs text-white/35">Engyon · Planta Norte</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-white/35">
            <Clock className="h-3 w-3" />
            28 feb 2026 · 09:47
          </span>
          <WaBadge
            variant="danger"
            attention="pulse"
            style={{ "--pulse-color": "#f44336" } as React.CSSProperties}
          >
            LIVE
          </WaBadge>
        </div>
      </div>

      {/* ── Plantas ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {plants.map((plant) => {
          const pct = Math.round((plant.kw / plant.kwMax) * 100);
          const hasAlarms = plant.activeAlarms > 0;
          return (
            <WaCard key={plant.id}>
              <div className="p-4">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#03a9f4]/15">
                      <Factory className="h-5 w-5 text-[#03a9f4]" />
                    </div>
                    <div>
                      <p className="font-semibold leading-none text-white">{plant.name}</p>
                      <p className="mt-1 text-xs text-white/35">{plant.location}</p>
                    </div>
                  </div>
                  <WaBadge variant="success">Online</WaBadge>
                </div>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-white/50">
                      <Zap className="h-3 w-3 text-amber-400" />
                      Consumo eléctrico
                    </span>
                    <span className="font-medium text-white">
                      {plant.kw} <span className="text-white/35">kW</span>
                      <span className="mx-1 text-white/20">·</span>
                      <span className="text-white/40">{pct}%</span>
                    </span>
                  </div>
                  <WaProgressBar
                    value={pct}
                    style={{
                      "--track-height": "6px",
                      "--indicator-color": "#03a9f4",
                      "--track-color": "rgba(255,255,255,0.08)",
                    } as React.CSSProperties}
                  />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/[0.04] p-2.5">
                    <p className="mb-1 text-[11px] text-white/35">Tags activos</p>
                    <p className="text-sm font-semibold text-white">{plant.tagCount.toLocaleString("es-ES")}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${hasAlarms ? "bg-red-500/10" : "bg-white/[0.04]"}`}>
                    <p className={`mb-1 text-[11px] ${hasAlarms ? "text-red-400/80" : "text-white/35"}`}>
                      Alarmas activas
                    </p>
                    <p className={`text-sm font-semibold ${hasAlarms ? "text-red-400" : "text-[#4caf50]"}`}>
                      {hasAlarms ? plant.activeAlarms : "Sin alarmas"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {plant.areas.map((area) => (
                    <WaTag key={area} variant="neutral" size="small">{area}</WaTag>
                  ))}
                </div>
              </div>
            </WaCard>
          );
        })}
      </div>

      {/* ── Glance — 6 métricas ── */}
      <WaCard>
        <div className="grid grid-cols-3 divide-x divide-white/[0.06] md:grid-cols-6">
          {glanceMetrics.map(({ label, value, unit, icon: Icon, color }) => (
            <div key={label} className="flex flex-col items-center gap-2.5 p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold leading-none text-white">
                  {value}<span className="ml-0.5 text-xs font-normal text-white/35">{unit}</span>
                </p>
                <p className="mt-1.5 text-[11px] leading-tight text-white/40">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </WaCard>

      {/* ── KPIs + Alarmas ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* KPIs */}
        <WaCard>
          <div slot="header" className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-white/35" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/45">KPIs Estado</span>
          </div>
          <div>
            {kpis.map(({ name, value, unit, status, trend }, i) => (
              <div key={name}>
                {i > 0 && <WaDivider />}
                <div className="flex items-center gap-3 py-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                  <span className="min-w-0 flex-1 truncate text-sm text-white/75">{name}</span>
                  <span className="text-sm font-semibold text-white">
                    {value}<span className="ml-1 text-xs font-normal text-white/35">{unit}</span>
                  </span>
                  {trend === "up"     && <TrendingUp   className="h-3.5 w-3.5 shrink-0 text-[#4caf50]" />}
                  {trend === "down"   && <TrendingDown  className="h-3.5 w-3.5 shrink-0 text-[#f44336]" />}
                  {trend === "stable" && <Minus         className="h-3.5 w-3.5 shrink-0 text-white/25" />}
                </div>
              </div>
            ))}
          </div>
        </WaCard>

        {/* Alarmas con WaCallout */}
        <WaCard>
          <div slot="header" className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-white/35" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/45">Alarmas Activas</span>
            </div>
            {alarms.length > 0 && <WaBadge variant="danger">{alarms.length}</WaBadge>}
          </div>
          <div className="space-y-2">
            {alarms.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <CheckCircle2 className="h-4 w-4 text-[#4caf50]" />
                <p className="text-sm text-white/40">Sin alarmas activas</p>
              </div>
            ) : (
              alarms.map(({ id, priority, name, plant, time }) => (
                <WaCallout key={id} variant={ALARM_VARIANT[priority]}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="mt-0.5 text-xs opacity-60">{plant} · {time}</p>
                    </div>
                    <WaBadge variant={ALARM_VARIANT[priority]} pill>{priority}</WaBadge>
                  </div>
                </WaCallout>
              ))
            )}
          </div>
        </WaCard>
      </div>

      {/* ── Contextos activos — WaTags ── */}
      <WaCard>
        <div className="flex flex-wrap items-center gap-2 py-1">
          <div className="flex items-center gap-2 mr-1 shrink-0">
            <CalendarClock className="h-3.5 w-3.5 text-white/35" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Contextos activos</span>
          </div>
          {activeContexts.map(({ uuid, name, type, variant }) => (
            <WaTag key={uuid} variant={variant as "brand" | "neutral" | "warning" | "success"} pill>
              {name}<span className="ml-1 opacity-50">· {type}</span>
            </WaTag>
          ))}
        </div>
      </WaCard>

      {/* ── Actividad reciente ── */}
      <WaCard>
        <div slot="header" className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-white/35" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/45">Actividad Reciente</span>
        </div>
        <div>
          {activity.map(({ time, msg, type }, i) => (
            <div key={time + msg}>
              {i > 0 && <WaDivider />}
              <div className="flex items-start gap-3 py-2">
                <span className="w-10 shrink-0 pt-0.5 text-xs tabular-nums text-white/30">{time}</span>
                <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${ACTIVITY_DOT[type]}`} />
                <p className="text-sm text-white/65">{msg}</p>
              </div>
            </div>
          ))}
        </div>
      </WaCard>

    </section>
  );
}
