/* ─────────────────────────────────────────────────────────────────────────────
   Engyon Design System — Showcase Page
   Standalone route at /design-system (no app sidebar)
   ───────────────────────────────────────────────────────────────────────────── */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System · Engyon",
};

/* ── Tokens reference (mirrors globals.css) ─────────────────────────────── */

const COLOR_SCALE = {
  Primary: [
    { name: "sky-50",  hex: "#F0F9FF", token: "accent",    label: "Fondo sutil"     },
    { name: "sky-100", hex: "#E0F2FE", token: "—",         label: "Hover sutil"     },
    { name: "sky-400", hex: "#38BDF8", token: "—",         label: "Dark accent"     },
    { name: "sky-600", hex: "#0284C7", token: "primary",   label: "Primary"         },
    { name: "sky-700", hex: "#0369A1", token: "—",         label: "Primary hover"   },
    { name: "sky-900", hex: "#0C4A6E", token: "—",         label: "Primary deep"    },
  ],
  Estado: [
    { name: "emerald-500", hex: "#10B981", token: "success",  label: "Correcto / OK"    },
    { name: "amber-500",   hex: "#F59E0B", token: "warning",  label: "Advertencia"      },
    { name: "red-500",     hex: "#EF4444", token: "danger",   label: "Crítico / Error"  },
    { name: "sky-600",     hex: "#0284C7", token: "info",     label: "Informativo"      },
  ],
  Neutral: [
    { name: "zinc-50",  hex: "#FAFAFA", token: "background",        label: "App background"   },
    { name: "zinc-100", hex: "#F4F4F5", token: "secondary / muted",  label: "Surface sutil"   },
    { name: "zinc-200", hex: "#E4E4E7", token: "border",            label: "Borde estándar"   },
    { name: "zinc-400", hex: "#A1A1AA", token: "—",                 label: "Texto muted"      },
    { name: "zinc-600", hex: "#52525B", token: "muted-fg",          label: "Texto secundario" },
    { name: "zinc-900", hex: "#18181B", token: "—",                 label: "Texto alto contr."},
    { name: "zinc-950", hex: "#09090B", token: "foreground",        label: "Foreground"       },
  ],
};

const TYPE_SCALE = [
  { name: "Display",   size: "30px", weight: "600", line: "1.2", use: "Números KPI grandes, dashboards" },
  { name: "H1",        size: "24px", weight: "600", line: "1.3", use: "Títulos de página"               },
  { name: "H2",        size: "20px", weight: "600", line: "1.4", use: "Títulos de sección"              },
  { name: "H3",        size: "16px", weight: "500", line: "1.5", use: "Subtítulos, card headers"        },
  { name: "Body MD",   size: "14px", weight: "400", line: "1.5", use: "Texto de interfaz estándar"      },
  { name: "Body SM",   size: "13px", weight: "400", line: "1.5", use: "Texto secundario, tabla"         },
  { name: "Caption",   size: "12px", weight: "400", line: "1.4", use: "Etiquetas, metadata"             },
  { name: "Label",     size: "10px", weight: "600", line: "1",   use: "Section labels UPPERCASE"        },
];

const SPACING = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];
const RADIUS = [
  { name: "sm",  px: "2px",  token: "radius-sm",  use: "Chips, badges internos" },
  { name: "md",  px: "4px",  token: "radius-md",  use: "Inputs, buttons"        },
  { name: "lg",  px: "6px",  token: "radius-lg",  use: "Cards, dropdowns"       },
  { name: "xl",  px: "10px", token: "radius-xl",  use: "Modales, panels"        },
  { name: "2xl", px: "14px", token: "radius-2xl", use: "Sidebar, containers"    },
];

/* ── KPI Card mock data ─────────────────────────────────────────────────── */
type KpiState = "ok" | "warning" | "critical" | "offline";

const KPI_SAMPLES: {
  label: string;
  value: string;
  unit: string;
  target: string;
  delta: string;
  deltaUp: boolean;
  progress: number;
  state: KpiState;
  stateLabel: string;
}[] = [
  {
    label: "OEE Línea 1",
    value: "98.4",
    unit: "%",
    target: "95.0",
    delta: "+3.4%",
    deltaUp: true,
    progress: 98,
    state: "ok",
    stateLabel: "Correcto",
  },
  {
    label: "Consumo Específico L1",
    value: "4.2",
    unit: "kWh/ud",
    target: "3.5",
    delta: "+0.7",
    deltaUp: false,
    progress: 70,
    state: "warning",
    stateLabel: "Advertencia",
  },
  {
    label: "Temp. Horno Principal",
    value: "187.4",
    unit: "°C",
    target: "150.0",
    delta: "+37.4°C",
    deltaUp: false,
    progress: 92,
    state: "critical",
    stateLabel: "Crítico",
  },
  {
    label: "Presión Vapor Saturado",
    value: "—",
    unit: "bar",
    target: "8.5",
    delta: "—",
    deltaUp: true,
    progress: 0,
    state: "offline",
    stateLabel: "Sin datos",
  },
];

/* ── Alarm samples ──────────────────────────────────────────────────────── */
const ALARM_SAMPLES = [
  {
    priority: "CRÍTICA",
    priorityClass: "priority-critical",
    asset: "Motor T-001",
    message: "Temperatura alta — 187.4°C",
    time: "14:23:01",
    ack: false,
    value: "187.4°C",
    limit: "150°C",
  },
  {
    priority: "ALTA",
    priorityClass: "priority-high",
    asset: "Variador VFD-03",
    message: "Sobrecorriente en arranque",
    time: "14:18:42",
    ack: false,
    value: "48.2 A",
    limit: "40 A",
  },
  {
    priority: "MEDIA",
    priorityClass: "priority-medium",
    asset: "Sensor P-PRES-002",
    message: "Presión fuera de rango nominal",
    time: "13:55:10",
    ack: true,
    value: "9.1 bar",
    limit: "8.5 bar",
  },
  {
    priority: "BAJA",
    priorityClass: "priority-low",
    asset: "Compresor CP-01",
    message: "Filtro de aire — mantenimiento próximo",
    time: "09:00:00",
    ack: true,
    value: "—",
    limit: "—",
  },
];

/* ── SVG Trend chart data ───────────────────────────────────────────────── */
function trendPoints(n = 30, seed = 1): string {
  const vals = Array.from({ length: n }, (_, i) => {
    const s = (seed * 2654435761 + i * 1234567) >>> 0;
    return 55 + 20 * Math.sin(i * 0.4 + seed) + ((s % 100) / 100) * 16 - 8;
  });
  const w = 320,
    h = 88;
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const pts = vals
    .map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y = h - ((v - minV) / (maxV - minV + 1)) * (h - 12) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  // Closed area path
  const first = pts.split(" ")[0].split(",");
  const last = pts.split(" ").slice(-1)[0].split(",");
  return [pts, first[0], last[0]].join("|");
}

function TrendWidget({ title, seed }: { title: string; seed: number }) {
  const raw = trendPoints(30, seed);
  const [pts, x0, xN] = raw.split("|");
  const area = `${x0},88 ${pts} ${xN},88 Z`;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">{title}</p>
      <svg viewBox="0 0 320 88" className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${seed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[20, 44, 68].map((y) => (
          <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#F4F4F5" strokeWidth="1" />
        ))}
        {/* Area fill */}
        <path d={`M ${area}`} fill={`url(#grad-${seed})`} />
        {/* Line */}
        <polyline
          points={pts}
          fill="none"
          stroke="#0284C7"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ── Gauge widget ───────────────────────────────────────────────────────── */
function GaugeWidget({
  label,
  value,
  min,
  max,
  unit,
  state,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  state: KpiState;
}) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const r = 52;
  const cx = 72;
  const cy = 72;
  const startAngle = 210;
  const sweep = 240;
  const angle = startAngle + pct * sweep;
  const toRad = (a: number) => (a * Math.PI) / 180;
  const arcX = (a: number) => cx + r * Math.cos(toRad(a));
  const arcY = (a: number) => cy + r * Math.sin(toRad(a));
  const largeArc = pct * sweep > 180 ? 1 : 0;

  const trackPath = `M ${arcX(startAngle).toFixed(2)} ${arcY(startAngle).toFixed(2)} A ${r} ${r} 0 1 1 ${arcX(startAngle + sweep - 0.01).toFixed(2)} ${arcY(startAngle + sweep - 0.01).toFixed(2)}`;
  const valuePath =
    pct > 0
      ? `M ${arcX(startAngle).toFixed(2)} ${arcY(startAngle).toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${arcX(angle).toFixed(2)} ${arcY(angle).toFixed(2)}`
      : "";

  const stateColors: Record<KpiState, string> = {
    ok: "#10B981",
    warning: "#F59E0B",
    critical: "#EF4444",
    offline: "#A1A1AA",
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <svg viewBox="0 0 144 100" className="mx-auto w-36">
        <path d={trackPath} fill="none" stroke="#F4F4F5" strokeWidth="8" strokeLinecap="round" />
        {pct > 0 && (
          <path
            d={valuePath}
            fill="none"
            stroke={stateColors[state]}
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="font-mono text-[14px] font-medium"
          style={{ fontFamily: "var(--font-ibm-plex-mono, monospace)", fontSize: 14 }}
          fill="#18181B"
        >
          {value}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" style={{ fontSize: 9 }} fill="#A1A1AA">
          {unit}
        </text>
        <text x={arcX(startAngle)} y={arcY(startAngle) + 14} textAnchor="middle" style={{ fontSize: 8 }} fill="#A1A1AA">
          {min}
        </text>
        <text x={arcX(startAngle + sweep)} y={arcY(startAngle + sweep) + 14} textAnchor="middle" style={{ fontSize: 8 }} fill="#A1A1AA">
          {max}
        </text>
      </svg>
    </div>
  );
}

/* ── Bar chart widget ───────────────────────────────────────────────────── */
function BarWidget({ title }: { title: string }) {
  const data = [62, 78, 55, 91, 84, 70, 88];
  const labels = ["L", "M", "X", "J", "V", "S", "D"];
  const maxVal = Math.max(...data);
  const h = 80;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">{title}</p>
      <svg viewBox="0 0 224 88" className="w-full">
        {[20, 44, 68].map((y) => (
          <line key={y} x1="0" y1={y} x2="224" y2={y} stroke="#F4F4F5" strokeWidth="1" />
        ))}
        {data.map((v, i) => {
          const bh = (v / maxVal) * h;
          const x = i * 32 + 4;
          return (
            <g key={i}>
              <rect
                x={x}
                y={h - bh}
                width={24}
                height={bh}
                rx="3"
                fill={v === maxVal ? "#0284C7" : "#BAE6FD"}
              />
              <text
                x={x + 12}
                y={h + 10}
                textAnchor="middle"
                style={{ fontSize: 9 }}
                fill="#A1A1AA"
              >
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Section wrapper ────────────────────────────────────────────────────── */
function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Divider() {
  return <hr className="border-zinc-100" />;
}

/* ── KPI State helpers ──────────────────────────────────────────────────── */
const stateStyles: Record<KpiState, { bar: string; badge: string; text: string }> = {
  ok: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
  },
  warning: {
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    text: "text-amber-700",
  },
  critical: {
    bar: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    text: "text-red-700",
  },
  offline: {
    bar: "bg-zinc-300",
    badge: "bg-zinc-100 text-zinc-500 border-zinc-200",
    text: "text-zinc-400",
  },
};

/* ── PAGE ───────────────────────────────────────────────────────────────── */
export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-zinc-50" style={{ fontFamily: "var(--font-ibm-plex-sans, sans-serif)" }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-200 bg-zinc-900">
        <div className="mx-auto max-w-7xl px-8 py-10">
          <div className="flex items-end justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
                  <svg viewBox="0 0 16 16" className="h-5 w-5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 1L2 8h4l-1 7 7-8H8l1-6z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-zinc-400">Engyon Platform</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white">
                Sistema de Diseño
              </h1>
              <p className="mt-2 text-base text-zinc-400">
                Especificación visual completa · Plataforma IoT Industrial
              </p>
            </div>
            <div className="flex items-center gap-3 pb-1">
              <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                v1.0
              </span>
              <span className="rounded-md border border-sky-800 bg-sky-900/50 px-2.5 py-1 text-xs text-sky-400">
                IBM Plex Sans
              </span>
              <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                Light Mode
              </span>
            </div>
          </div>

          {/* Nav anchors */}
          <nav className="mt-8 flex gap-1 overflow-x-auto">
            {[
              ["#colores", "Colores"],
              ["#tipografia", "Tipografía"],
              ["#espaciado", "Espaciado"],
              ["#componentes", "Componentes"],
              ["#kpi-cards", "KPI Cards"],
              ["#alarmas", "Alarmas"],
              ["#widgets", "Widgets"],
              ["#tabla", "Tabla"],
              ["#patrones", "Patrones"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="shrink-0 rounded-md px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl space-y-16 px-8 py-12">

        {/* ── COLORES ─────────────────────────────────────────────────── */}
        <Section
          id="colores"
          title="Paleta de colores"
          subtitle="Zinc para neutrales, sky-600 como acento técnico. Sin colores saturados ni gradientes decorativos."
        >
          {Object.entries(COLOR_SCALE).map(([group, colors]) => (
            <div key={group} className="mb-8">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {group}
              </h3>
              <div className="flex flex-wrap gap-3">
                {colors.map((c) => (
                  <div key={c.name} className="w-36">
                    <div
                      className="mb-2 h-12 w-full rounded-md border border-zinc-200"
                      style={{ backgroundColor: c.hex }}
                    />
                    <p className="text-xs font-medium text-zinc-800">{c.name}</p>
                    <p className="font-mono text-[11px] text-zinc-400">{c.hex}</p>
                    {c.token !== "—" && (
                      <p className="mt-0.5 text-[11px] text-sky-600">--{c.token}</p>
                    )}
                    <p className="text-[11px] text-zinc-400">{c.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Divider />

        {/* ── TIPOGRAFÍA ──────────────────────────────────────────────── */}
        <Section
          id="tipografia"
          title="Escala tipográfica"
          subtitle="IBM Plex Sans para UI. IBM Plex Mono para valores de datos, nombres de tags y fórmulas."
        >
          <div className="mb-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {/* Type specimens */}
            <div className="divide-y divide-zinc-100">
              {TYPE_SCALE.map((t) => (
                <div key={t.name} className="flex items-center gap-6 px-6 py-4">
                  <div className="w-20 shrink-0">
                    <p className="text-xs font-medium text-zinc-700">{t.name}</p>
                    <p className="font-mono text-[11px] text-zinc-400">
                      {t.size} / {t.weight}
                    </p>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p
                      style={{
                        fontSize: t.size,
                        fontWeight: t.weight,
                        lineHeight: t.line,
                      }}
                      className="truncate text-zinc-900"
                    >
                      {t.name === "Label"
                        ? "NOMBRE DE SECCIÓN"
                        : "Monitorización Industrial · Plataforma Engyon"}
                    </p>
                  </div>
                  <p className="w-48 shrink-0 text-right text-[11px] text-zinc-400">{t.use}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mono specimen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              IBM Plex Mono — Para datos
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="mb-1 text-xs text-zinc-400">Valor KPI</p>
                <p
                  className="text-3xl font-medium text-zinc-900"
                  style={{ fontFamily: "var(--font-ibm-plex-mono, monospace)" }}
                >
                  98.4<span className="text-xl text-zinc-400"> %</span>
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-400">Tag name</p>
                <p
                  className="text-sm text-zinc-700"
                  style={{ fontFamily: "var(--font-ibm-plex-mono, monospace)" }}
                >
                  T-TEMP-001
                  <br />
                  VT-KW-CORRECTED
                  <br />
                  KPI-OEE-L1
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-400">Fórmula</p>
                <p
                  className="text-sm text-zinc-700"
                  style={{ fontFamily: "var(--font-ibm-plex-mono, monospace)" }}
                >
                  TOTALIZE(&#123;E-KW-TOTAL&#125;)
                  <br />/ &#123;DB-PROD-UNITS&#125;
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ── ESPACIADO ───────────────────────────────────────────────── */}
        <Section
          id="espaciado"
          title="Espaciado y radio"
          subtitle="Múltiplos de 4px. Radio base 6px — preciso, industrial."
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Spacing */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Escala de espaciado (px)
              </p>
              <div className="space-y-3">
                {SPACING.map((sp) => (
                  <div key={sp} className="flex items-center gap-3">
                    <div
                      className="shrink-0 bg-sky-500"
                      style={{ width: sp, height: 20, borderRadius: 2 }}
                    />
                    <span className="font-mono text-xs text-zinc-500">{sp}px</span>
                    <span className="text-xs text-zinc-400">= {sp / 4} × 4</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Radius */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Escala de radios
              </p>
              <div className="space-y-4">
                {RADIUS.map((r) => (
                  <div key={r.name} className="flex items-center gap-4">
                    <div
                      className="h-10 w-16 shrink-0 border-2 border-sky-300 bg-sky-50"
                      style={{ borderRadius: r.px }}
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-800">rounded-{r.name}</p>
                      <p className="font-mono text-xs text-zinc-400">
                        {r.px} · --{r.token}
                      </p>
                      <p className="text-xs text-zinc-400">{r.use}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ── COMPONENTES BASE ────────────────────────────────────────── */}
        <Section
          id="componentes"
          title="Componentes base"
          subtitle="Botones, inputs, badges, status indicators. Consistencia en toda la interfaz."
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Buttons */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Botones
              </p>
              <div className="flex flex-col gap-3">
                <button className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 active:bg-sky-800">
                  Acción principal
                </button>
                <button className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:border-zinc-300">
                  Secundario
                </button>
                <button className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900">
                  Ghost
                </button>
                <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700">
                  Destructivo
                </button>
                <button
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-400"
                  disabled
                >
                  Deshabilitado
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded px-2 py-1 text-xs font-medium bg-sky-600 text-white">SM</button>
                <button className="rounded-md px-3 py-1.5 text-sm font-medium bg-sky-600 text-white">MD</button>
                <button className="rounded-md px-4 py-2 text-base font-medium bg-sky-600 text-white">LG</button>
              </div>
            </div>

            {/* Status & badges */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Estados de conexión
              </p>
              <div className="space-y-3">
                {(
                  [
                    { dot: "bg-emerald-500", label: "Conectado", sublabel: "Online" },
                    { dot: "bg-amber-500", label: "Advertencia", sublabel: "Degraded" },
                    { dot: "bg-red-500", label: "Alarma activa", sublabel: "Alarm", pulse: true },
                    { dot: "bg-zinc-400", label: "Desconectado", sublabel: "Offline" },
                  ] as const
                ).map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                      <span className="text-sm text-zinc-800">{s.label}</span>
                    </div>
                    <span className="font-mono text-xs text-zinc-400">{s.sublabel}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Prioridad de alarma
                </p>
                <div className="space-y-2">
                  {(
                    [
                      { cls: "priority-critical", label: "CRÍTICA" },
                      { cls: "priority-high", label: "ALTA" },
                      { cls: "priority-medium", label: "MEDIA" },
                      { cls: "priority-low", label: "BAJA" },
                      { cls: "priority-info", label: "INFO" },
                    ] as const
                  ).map((p) => (
                    <span
                      key={p.label}
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold tracking-wide mr-2 ${p.cls}`}
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Inputs
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700">
                    Nombre del tag
                  </label>
                  <input
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="T-TEMP-001"
                    readOnly
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700">Unidad</label>
                  <select className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100">
                    <option>°C</option>
                    <option>kW</option>
                    <option>bar</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700">Búsqueda</label>
                  <div className="relative">
                    <svg className="absolute left-2.5 top-2 h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    <input
                      className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder="Buscar tags..."
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700">Error</label>
                  <input
                    className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-zinc-900 outline-none"
                    defaultValue="valor-inválido"
                    readOnly
                  />
                  <p className="mt-1 text-xs text-red-600">Formato incorrecto</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ── KPI CARDS ───────────────────────────────────────────────── */}
        <Section
          id="kpi-cards"
          title="KPI Cards"
          subtitle="4 estados: Correcto, Advertencia, Crítico, Sin datos. Fondo blanco, valor en IBM Plex Mono."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {KPI_SAMPLES.map((kpi) => {
              const s = stateStyles[kpi.state];
              return (
                <div
                  key={kpi.label}
                  className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5"
                >
                  {/* Label */}
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    {kpi.label}
                  </p>

                  {/* Value */}
                  <div className="mb-1 flex items-end gap-1.5">
                    <span
                      className={`text-3xl font-medium leading-none ${kpi.state === "offline" ? "text-zinc-300" : "text-zinc-900"}`}
                      style={{ fontFamily: "var(--font-ibm-plex-mono, monospace)" }}
                    >
                      {kpi.value}
                    </span>
                    <span className="mb-0.5 text-sm text-zinc-400">{kpi.unit}</span>
                  </div>

                  {/* Metadata row */}
                  <div className="mb-4 flex items-center gap-3 text-xs text-zinc-400">
                    <span>Obj. {kpi.target}</span>
                    <span className={`font-medium ${kpi.state !== "offline" ? (kpi.deltaUp ? "text-emerald-600" : "text-red-600") : ""}`}>
                      {kpi.delta}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full transition-all ${s.bar}`}
                      style={{ width: `${kpi.progress}%` }}
                    />
                  </div>

                  {/* Status badge */}
                  <span
                    className={`mt-auto inline-flex w-fit items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${s.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.bar}`} />
                    {kpi.stateLabel.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        <Divider />

        {/* ── ALARMAS ─────────────────────────────────────────────────── */}
        <Section
          id="alarmas"
          title="Alarmas y eventos"
          subtitle="Lista de alarmas activas con prioridad, activo, mensaje y estado de reconocimiento."
        >
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {/* Table header */}
            <div className="grid grid-cols-[100px_1fr_1fr_120px_80px] gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              <span>Prioridad</span>
              <span>Activo · Mensaje</span>
              <span>Valor · Límite</span>
              <span>Hora</span>
              <span>ACK</span>
            </div>
            <div className="divide-y divide-zinc-50">
              {ALARM_SAMPLES.map((a, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[100px_1fr_1fr_120px_80px] items-center gap-4 px-5 py-3 text-sm transition hover:bg-zinc-50"
                >
                  <span
                    className={`inline-flex w-fit items-center rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide ${a.priorityClass}`}
                  >
                    {a.priority}
                  </span>
                  <div>
                    <p className="font-medium text-zinc-800">{a.asset}</p>
                    <p className="text-xs text-zinc-500">{a.message}</p>
                  </div>
                  <div
                    className="font-medium text-zinc-700"
                    style={{ fontFamily: "var(--font-ibm-plex-mono, monospace)", fontSize: "12px" }}
                  >
                    {a.value}
                    <span className="ml-2 text-zinc-400">/ {a.limit}</span>
                  </div>
                  <span
                    className="text-xs text-zinc-400"
                    style={{ fontFamily: "var(--font-ibm-plex-mono, monospace)" }}
                  >
                    {a.time}
                  </span>
                  <span
                    className={`inline-flex w-fit rounded px-2 py-0.5 text-[10px] font-semibold ${a.ack ? "bg-zinc-100 text-zinc-500" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                  >
                    {a.ack ? "ACK" : "PEND."}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Empty state */}
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-12">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-700">Sin alarmas activas</p>
            <p className="mt-1 text-xs text-zinc-400">Todos los sistemas operan dentro de los límites configurados</p>
          </div>
        </Section>

        <Divider />

        {/* ── WIDGETS ─────────────────────────────────────────────────── */}
        <Section
          id="widgets"
          title="Widgets de visualización"
          subtitle="Gráficas SVG sin dependencias externas. Las gráficas son protagonistas: bordes mínimos, fondo blanco."
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TrendWidget title="Temperatura entrada horno — 24h" seed={3} />
            <TrendWidget title="Consumo eléctrico total — 24h" seed={7} />
            <BarWidget title="OEE por día — semana actual" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <GaugeWidget label="Temperatura Horno" value={187} min={0} max={250} unit="°C" state="critical" />
            <GaugeWidget label="Presión Vapor" value={7.2} min={0} max={12} unit="bar" state="ok" />
            <GaugeWidget label="Caudal Refrigeración" value={3.8} min={0} max={10} unit="m³/h" state="warning" />
          </div>
        </Section>

        <Divider />

        {/* ── TABLA INDUSTRIAL ────────────────────────────────────────── */}
        <Section
          id="tabla"
          title="Tabla industrial"
          subtitle="Alta densidad de datos. Filas compactas, zebra striping sutil, acciones en hover."
        >
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                  </svg>
                  <input className="rounded-md border border-zinc-200 py-1.5 pl-7 pr-3 text-sm placeholder-zinc-400 outline-none focus:border-sky-400" placeholder="Buscar tags..." readOnly />
                </div>
                <select className="rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-600 outline-none">
                  <option>Todos los tipos</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">8 registros</span>
                <button className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700">
                  + Nuevo Tag
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[180px_1fr_80px_80px_80px_80px] gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              <span>Tag ID</span>
              <span>Descripción</span>
              <span>Valor</span>
              <span>Unidad</span>
              <span>Estado</span>
              <span>Calidad</span>
            </div>

            {/* Rows */}
            {[
              { id: "T-TEMP-001", desc: "Temperatura entrada horno principal", val: "187.4", unit: "°C",  state: "critical", q: "GOOD" },
              { id: "T-TEMP-002", desc: "Temperatura salida horno principal",  val: "142.1", unit: "°C",  state: "ok",       q: "GOOD" },
              { id: "E-KW-TOTAL", desc: "Consumo eléctrico total Planta Norte", val: "248.7", unit: "kW", state: "warning",  q: "GOOD" },
              { id: "F-FLOW-HH2O",desc: "Caudal agua refrigeración",           val: "—",     unit: "m³/h",state: "offline",  q: "BAD"  },
              { id: "P-PRES-VAP", desc: "Presión vapor saturado",              val: "7.2",   unit: "bar", state: "ok",       q: "GOOD" },
            ].map((row, i) => {
              const s = stateStyles[row.state as KpiState];
              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-[180px_1fr_80px_80px_80px_80px] items-center gap-4 px-5 py-2.5 text-sm transition hover:bg-zinc-50 ${i % 2 === 0 ? "" : "bg-zinc-50/50"}`}
                >
                  <span
                    className="font-medium text-zinc-800"
                    style={{ fontFamily: "var(--font-ibm-plex-mono, monospace)", fontSize: "12px" }}
                  >
                    {row.id}
                  </span>
                  <span className="truncate text-zinc-600">{row.desc}</span>
                  <span
                    className="text-zinc-900"
                    style={{ fontFamily: "var(--font-ibm-plex-mono, monospace)", fontSize: "13px" }}
                  >
                    {row.val}
                  </span>
                  <span className="text-xs text-zinc-500">{row.unit}</span>
                  <span className={`inline-flex w-fit items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${s.badge}`}>
                    <span className={`h-1 w-1 rounded-full ${s.bar}`} />
                    {row.state.toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-semibold ${row.q === "GOOD" ? "text-emerald-600" : "text-red-600"}`}>
                    {row.q}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        <Divider />

        {/* ── PATRONES ────────────────────────────────────────────────── */}
        <Section
          id="patrones"
          title="Patrones de layout"
          subtitle="Arquitectura visual consistente. Sidebar 224px fijo, header de página, contenido principal scrollable."
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Page anatomy */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Anatomía de página
              </p>
              <div className="flex gap-2 rounded-lg bg-zinc-100 p-3 text-xs">
                {/* Mock sidebar */}
                <div className="w-20 shrink-0 rounded-md border border-zinc-300 bg-white p-2">
                  <div className="mb-2 h-5 w-full rounded bg-zinc-900 opacity-80" />
                  <div className="mb-2 h-px bg-zinc-200" />
                  <div className="space-y-1">
                    <div className="h-3 rounded bg-sky-100" />
                    <div className="h-3 rounded bg-zinc-100" />
                    <div className="h-3 rounded bg-zinc-100" />
                    <div className="h-px bg-zinc-100 my-1" />
                    <div className="h-3 rounded bg-zinc-100" />
                    <div className="h-3 rounded bg-zinc-100" />
                    <div className="h-px bg-zinc-100 my-1" />
                    <div className="h-3 rounded bg-zinc-100" />
                    <div className="h-3 rounded bg-zinc-100" />
                    <div className="h-3 rounded bg-zinc-100" />
                  </div>
                </div>
                {/* Mock main */}
                <div className="flex-1 rounded-md bg-white p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="h-4 w-24 rounded bg-zinc-200" />
                    <div className="h-6 w-16 rounded bg-sky-500 opacity-80" />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 rounded border border-zinc-100 bg-zinc-50 p-1.5">
                        <div className="h-2 w-full rounded bg-zinc-200 mb-1" />
                        <div className="h-3 w-10 rounded bg-zinc-300" />
                      </div>
                    ))}
                  </div>
                  <div className="h-16 rounded border border-zinc-100 bg-zinc-50 p-1.5">
                    <div className="h-full bg-sky-200 opacity-30 rounded" />
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] text-zinc-500">
                <div><span className="font-medium text-zinc-700">Sidebar</span><br />224px fijo · rounded-xl</div>
                <div><span className="font-medium text-zinc-700">Shell</span><br />bg-zinc-100 · p-4</div>
                <div><span className="font-medium text-zinc-700">Main</span><br />flex-1 · overflow-y-auto</div>
              </div>
            </div>

            {/* Data density modes */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Principios de diseño
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: "◉",
                    title: "Datos como protagonistas",
                    desc: "Las gráficas y valores ocupan el espacio principal. La chrome (UI) es invisible.",
                  },
                  {
                    icon: "▣",
                    title: "Jerarquía clara",
                    desc: "Tamaño + peso + contraste. 3 niveles máximo: título · cuerpo · caption.",
                  },
                  {
                    icon: "⊙",
                    title: "IBM Plex Mono para datos",
                    desc: "Todo valor numérico, tag ID o fórmula usa la fuente monospace. Sin excepciones.",
                  },
                  {
                    icon: "◈",
                    title: "Color semántico",
                    desc: "Sky-600 = interactivo. Emerald/Amber/Red = estado. Zinc = neutro. Nunca decorativo.",
                  },
                  {
                    icon: "◌",
                    title: "Densidad controlada",
                    desc: "Filas de tabla: 36px. Cards: gap-4. Padding de página: 24px. Sin compresión arbitraria.",
                  },
                ].map((p) => (
                  <div key={p.title} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-lg text-sky-500">{p.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{p.title}</p>
                      <p className="text-xs text-zinc-500">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 pt-8 pb-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Engyon Design System</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                IBM Plex Sans · IBM Plex Mono · Tailwind CSS v4 · shadcn/ui
              </p>
            </div>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-500">
              v1.0 · 2025
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
