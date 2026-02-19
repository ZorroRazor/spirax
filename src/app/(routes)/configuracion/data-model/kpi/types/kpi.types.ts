import type { AssetHierarchy } from "../../tags-fisicos/types/physical-tag.types";

export type { AssetHierarchy };

export enum KpiCategory {
  ENERGIA = "Energía",
  PRODUCCION = "Producción",
  COSTE = "Coste",
  CALIDAD = "Calidad",
  MANTENIMIENTO = "Mantenimiento",
  MEDIO_AMBIENTE = "Medio Ambiente",
  OTRO = "Otro",
}

export enum KpiPeriod {
  MINUTO = "Minuto",
  HORA = "Hora",
  DIA = "Día",
  SEMANA = "Semana",
  MES = "Mes",
  PERSONALIZADO = "Periodo personalizado",
  TURNO = "Turno",
  ORDEN_FABRICACION = "Orden de Fabricación",
  LOTE = "Lote",
  CONTEXTO = "Contexto operativo",
}

export enum KpiStatus {
  OK = "ok",
  WARNING = "warning",
  CRITICAL = "critical",
  UNCERTAIN = "uncertain",
  NO_DATA = "no_data",
}

export enum KpiDirection {
  HIGHER = "Higher is better",
  LOWER = "Lower is better",
  IN_RANGE = "In range is better",
}

export enum KpiFunction {
  SPECIFIC_CONSUMPTION = "Consumo específico",
  EFFICIENCY = "Eficiencia",
  AVAILABILITY = "Disponibilidad",
  ENERGY_COST = "Coste energético",
  DEVIATION_BASELINE = "Desviación vs baseline",
  OFF_HOURS_CONSUMPTION = "Consumo fuera de horario",
}

export type KpiThresholds = {
  direction: KpiDirection;
  target?: number;
  warningLow?: number;
  warningHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
};

export type Kpi = {
  id: number;
  kpiUUID: string;
  enable: boolean;
  name: string;
  description?: string;
  hierarchy: AssetHierarchy;
  category?: string;
  unit?: string;
  period: KpiPeriod;
  /** Specific operating context reference when period is an operative type */
  contextRef?: string;
  formula: string;
  thresholds?: KpiThresholds;
  lastValue?: number;
  status: KpiStatus;
  statusMessage?: string;
};

export type KpiFormData = Omit<
  Kpi,
  "id" | "kpiUUID" | "status" | "statusMessage" | "lastValue"
>;
