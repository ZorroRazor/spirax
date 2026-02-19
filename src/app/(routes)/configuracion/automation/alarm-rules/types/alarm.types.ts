import type { AssetHierarchy } from "../../../data-model/tags-fisicos/types/physical-tag.types";

export type { AssetHierarchy };

export enum AlarmType {
  THRESHOLD = "Umbral",
  COMPARISON = "Comparación",
  LOGICAL = "Lógica",
  TEMPORAL = "Temporal",
  COMMUNICATION = "Comunicación",
}

export enum AlarmPriority {
  LOW = "Baja",
  MEDIUM = "Media",
  HIGH = "Alta",
  CRITICAL = "Crítica",
}

export enum AlarmCategory {
  ENERGIA = "Energía",
  PRODUCCION = "Producción",
  MANTENIMIENTO = "Mantenimiento",
  SEGURIDAD = "Seguridad",
  COMUNICACION = "Comunicación",
}

export enum AlarmStatus {
  INACTIVE = "Inactiva",
  ACTIVE = "Activa",
  ACKNOWLEDGED = "Reconocida",
  IN_PROGRESS = "En progreso",
  RESOLVED = "Resuelta",
  CLOSED = "Cerrada",
}

export enum AlarmSourceType {
  PHYSICAL_TAG = "Tag Físico",
  VIRTUAL_TAG = "Tag Virtual",
  KPI = "KPI",
  COMMUNICATION = "Comunicación",
}

export const ALARM_CHANNELS = ["panel", "email", "push", "webhook"] as const;
export type AlarmChannel = (typeof ALARM_CHANNELS)[number];

export type AlarmTemporalFilter = {
  minActivationMs?: number;
  delayMs?: number;
  rearmMs?: number;
  hysteresis?: number;
};

export type AlarmNotification = {
  channels: AlarmChannel[];
  shortMessage?: string;
  detailedMessage?: string;
};

export type AlarmRule = {
  id: number;
  alarmUUID: string;
  enable: boolean;
  name: string;
  description?: string;
  type: AlarmType;
  priority: AlarmPriority;
  category?: AlarmCategory;
  hierarchy: AssetHierarchy;
  sourceType: AlarmSourceType;
  expression: string;
  temporalFilter?: AlarmTemporalFilter;
  notification?: AlarmNotification;
  status: AlarmStatus;
  statusMessage?: string;
};

export type AlarmRuleFormData = Omit<
  AlarmRule,
  "id" | "alarmUUID" | "status" | "statusMessage"
>;
