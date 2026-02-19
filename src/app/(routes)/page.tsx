import { Activity, Building2, CircleDollarSign, Leaf, Zap } from "lucide-react";

import { CardSummary } from "./components/CardSummary";
import { Button } from "@/components/ui/button";

const dataCardsSummary = [
  {
    icon: Building2,
    total: "124",
    average: 18,
    title: "Empresas activas",
    tooltipText: "Total de empresas que reportan datos hoy.",
  },
  {
    icon: CircleDollarSign,
    total: "$86,500",
    average: 62,
    title: "Ingreso mensual",
    tooltipText: "Ingresos acumulados del mes actual.",
  },
  {
    icon: Leaf,
    total: "363.95 kWh",
    average: 88,
    title: "Ahorro energetico",
    tooltipText: "Energia optimizada frente al mes anterior.",
  },
];

const latestActivity = [
  { company: "Solar Norte", status: "Estable", usage: "12.4 kWh" },
  { company: "GreenGrid MX", status: "Alerta", usage: "22.8 kWh" },
  { company: "Helio Labs", status: "Optimo", usage: "8.9 kWh" },
  { company: "EcoCharge", status: "Estable", usage: "15.1 kWh" },
];

export default function Home() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Panel principal</p>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard de Engyon</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
              <Zap className="h-4 w-4" />
              Nuevo reporte
            </Button>
            <Button variant="outline" size="sm">
              Perfil demo
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {dataCardsSummary.map(({ icon, total, average, title, tooltipText }) => (
          <CardSummary
            key={title}
            icon={icon}
            total={total}
            average={average}
            title={title}
            tooltipText={tooltipText}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            <h2 className="font-semibold">Actividad reciente</h2>
          </div>
          <div className="space-y-3">
            {latestActivity.map((item) => (
              <div
                key={item.company}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.company}</p>
                  <p className="text-xs text-slate-500">{item.status}</p>
                </div>
                <p className="text-sm font-semibold text-slate-700">{item.usage}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-semibold">Acciones rapidas</h2>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              Ver reporte diario
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Exportar metricas
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Configurar alertas
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
