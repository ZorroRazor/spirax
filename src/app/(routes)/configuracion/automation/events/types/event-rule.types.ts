import type { AssetHierarchy } from "../../../data-model/tags-fisicos/types/physical-tag.types";

export { type AssetHierarchy };

export enum EventType {
  TEMPORAL = "Temporal",
  CONTEXT = "Contexto Operativo",
  DATA = "Datos",
  KPI = "KPI",
  ALARM = "Alarma",
  AI = "Inteligencia Artificial",
}

export enum ActionType {
  REPORT_GENERATE = "Generar informe",
  REPORT_EMAIL = "Enviar informe por email",
  EXPORT_CSV = "Exportar CSV",
  EXPORT_EXCEL = "Exportar Excel",
  EXPORT_FTP = "Exportar a FTP",
  EXPORT_DB = "Escribir en BD externa",
  NOTIFY_EMAIL = "Notificar por email",
  NOTIFY_PUSH = "Notificar push",
  NOTIFY_WEBHOOK = "Llamar webhook",
  NOTIFY_CUSTOM = "Notificación personalizada",
  SYSTEM_ANNOTATION = "Crear anotación",
  SYSTEM_STATUS = "Cambiar estado de activo",
  SYSTEM_LOG = "Escribir en log",
}

export enum EventRuleState {
  ACTIVE = "Activa",
  INACTIVE = "Inactiva",
}

export type EventAction = {
  id: number;
  type: ActionType;
  config: string;
};

export type EventRule = {
  id: number;
  ruleUUID: string;
  enable: boolean;
  name: string;
  description?: string;
  eventType: EventType;
  trigger: string;
  condition?: string;
  hierarchy?: AssetHierarchy;
  actions: EventAction[];
  executionCount: number;
  lastExecuted?: string;
  status: EventRuleState;
  statusMessage?: string;
};

export type EventRuleFormData = Omit<
  EventRule,
  "id" | "ruleUUID" | "status" | "statusMessage" | "executionCount" | "lastExecuted"
>;
