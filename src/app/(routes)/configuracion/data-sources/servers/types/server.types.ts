import type { DriverConfig } from "./driver-config.types";

// Enums
export enum DriverType {
  OPC_UA = "OPC UA",
  OPC_DA = "OPC DA",
  DATA_BASE_SQL = "Data Base SQL",
  MODBUS_TCP = "Modbus TCP",
  MQTT = "MQTT",
  API_REST = "API Rest",
  IMPORT_FILE = "Import File",
  MANUAL = "Manual",
}

export enum ServerStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
  DEGRADED = "degraded",
}

// Tipos principales
export type Server = {
  id: number;
  enable: boolean;
  name: string;
  description: string;
  driver: DriverType;
  driverConfig?: DriverConfig;
  tagCounter: number;
  status: ServerStatus;
  statusMessage?: string;
};

export type ServerFormData = Omit<
  Server,
  "id" | "tagCounter" | "status" | "statusMessage"
>;
