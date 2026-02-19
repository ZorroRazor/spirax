"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bolt,
  Bot,
  CalendarClock,
  ChevronRight,
  ChartBar,
  ClipboardList,
  Database,
  FileBarChart2,
  FileOutput,
  Gauge,
  HardDrive,
  Layers2,
  LayoutDashboard,
  Lock,
  Network,
  Radio,
  Radar,
  Shield,
  Tags,
  UserCog,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/* ── Section label ─────────────────────────────────────────────────────── */
function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-0.5 mt-5 select-none px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 first:mt-1">
      {label}
    </p>
  );
}

/* ── Top-level navigation link ─────────────────────────────────────────── */
function TopLink({
  label,
  icon: Icon,
  href = "/",
}: {
  label: string;
  icon: LucideIcon;
  href?: string;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-sky-50 text-sky-700"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-sky-500" : "text-zinc-400",
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/* ── Nested navigation link ────────────────────────────────────────────── */
function MenuLink({
  label,
  icon: Icon,
  href = "/",
}: {
  label: string;
  icon: LucideIcon;
  href?: string;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-sky-50 font-medium text-sky-700"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800",
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          isActive ? "text-sky-500" : "text-zinc-400",
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/* ── Collapsible section group ─────────────────────────────────────────── */
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon: Icon,
  groupPrefix,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon: LucideIcon;
  groupPrefix?: string;
}) {
  const pathname = usePathname();
  const isGroupActive = groupPrefix ? pathname.startsWith(groupPrefix) : false;

  return (
    <details className="group block" open={defaultOpen || isGroupActive}>
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors marker:content-none [&::-webkit-details-marker]:hidden",
          isGroupActive
            ? "text-zinc-800 font-medium"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800",
        )}
      >
        <span className="flex items-center gap-2.5">
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              isGroupActive ? "text-zinc-600" : "text-zinc-400",
            )}
          />
          <span className="truncate">{title}</span>
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform duration-150 group-open:rotate-90" />
      </summary>
      <div className="ml-[18px] mt-0.5 flex flex-col gap-0.5 border-l border-zinc-100 pl-3 pb-0.5">
        {children}
      </div>
    </details>
  );
}

/* ── Brand header ──────────────────────────────────────────────────────── */
function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5 px-1 pb-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
        <Bolt className="h-4 w-4 text-sky-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-none text-zinc-900">Engyon</p>
        <p className="mt-0.5 truncate text-xs text-zinc-400">Planta Norte</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </div>
    </div>
  );
}

/* ── Navigation tree ───────────────────────────────────────────────────── */
function SidebarMenu() {
  return (
    <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Main views */}
      <SectionLabel label="Principal" />
      <div className="flex flex-col gap-0.5">
        <TopLink href="/" label="Overview" icon={Gauge} />
        <TopLink href="/dashboards" label="Dashboards" icon={LayoutDashboard} />
        <TopLink href="/analytics" label="Analytics" icon={ChartBar} />
        <TopLink href="/reporting" label="Reporting" icon={FileBarChart2} />
      </div>

      {/* Operations */}
      <SectionLabel label="Operaciones" />
      <div className="flex flex-col gap-0.5">
        <TopLink href="/operaciones/alarmas" label="Alarmas" icon={Bell} />
        <TopLink href="/operaciones/eventos" label="Eventos" icon={Radar} />
      </div>

      {/* Configuration */}
      <SectionLabel label="Configuración" />
      <div className="flex flex-col gap-0.5">
        <CollapsibleSection
          title="Data Sources"
          icon={Database}
          groupPrefix="/configuracion/data-sources"
        >
          <MenuLink href="/configuracion/data-sources/servers" label="Servers" icon={HardDrive} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Data Model"
          icon={Tags}
          groupPrefix="/configuracion/data-model"
        >
          <MenuLink href="/configuracion/data-model/tags-fisicos" label="Tags Físicos" icon={Tags} />
          <MenuLink href="/configuracion/data-model/tags-virtuales" label="Tags Virtuales" icon={Tags} />
          <MenuLink href="/configuracion/data-model/kpi" label="KPI" icon={Gauge} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Automation"
          icon={Radio}
          groupPrefix="/configuracion/automation"
        >
          <MenuLink href="/configuracion/automation/alarm-rules" label="Alarm Rules" icon={Bell} />
          <MenuLink href="/configuracion/automation/events" label="Events" icon={Radar} />
          <MenuLink href="/configuracion/automation/ia" label="IA" icon={Bot} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Estructura"
          icon={Layers2}
          groupPrefix="/configuracion/estructura"
        >
          <MenuLink href="/configuracion/estructura/jerarquia" label="Jerarquía de Activos" icon={Network} />
          <MenuLink href="/configuracion/estructura/contextos" label="Contextos Operativos" icon={CalendarClock} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Reporting Setup"
          icon={ClipboardList}
          groupPrefix="/configuracion/reporting-setup"
        >
          <MenuLink href="/configuracion/reporting-setup/reports" label="Reports" icon={FileBarChart2} />
          <MenuLink href="/configuracion/reporting-setup/export-rules" label="Export Rules" icon={FileOutput} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Security"
          icon={Shield}
          groupPrefix="/configuracion/security"
        >
          <MenuLink href="/configuracion/security/usuarios" label="Usuarios" icon={Users} />
          <MenuLink href="/configuracion/security/roles" label="Roles" icon={UserCog} />
          <MenuLink href="/configuracion/security/grupos" label="Grupos" icon={UsersRound} />
          <MenuLink href="/configuracion/security/auditoria" label="Auditoría" icon={Lock} />
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4">
        <div className="border-t border-zinc-100 pt-3">
          <Link
            href="/design-system"
            className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Wrench className="h-3 w-3" />
            Design System
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ── Sidebar shell ─────────────────────────────────────────────────────── */
export function Sidebar() {
  return (
    <aside className="flex h-full w-56 min-w-56 flex-col rounded-xl border border-zinc-200 bg-white px-3 pb-3 pt-4">
      <SidebarBrand />
      <div className="mb-1 border-t border-zinc-100" />
      <SidebarMenu />
    </aside>
  );
}
