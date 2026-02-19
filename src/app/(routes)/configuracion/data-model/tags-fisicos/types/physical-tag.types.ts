export enum TagStatus {
  OK = "ok",
  BAD = "bad",
  UNCERTAIN = "uncertain",
  NO_DATA = "no_data",
}

export enum DataClassification {
  AGUA = "Agua",
  AIRE = "Aire",
  ELECTRICIDAD = "Electricidad",
  VAPOR = "Vapor",
  GAS = "Gas",
  TEMPERATURA = "Temperatura",
  PRESION = "Presión",
  CAUDAL = "Caudal",
  OTRO = "Otro",
}

export enum EngUnit {
  KW = "kW",
  KWH = "kWh",
  KG_H = "kg/h",
  M3_H = "m³/h",
  BAR = "bar",
  CELSIUS = "°C",
  PERCENT = "%",
  NONE = "—",
}

export enum ScalingType {
  NONE = "None",
  LINEAR = "Linear",
  SQUARE_ROOT = "Square Root",
}

export enum ReadMode {
  POLLING = "Polling",
  SUBSCRIPTION = "Subscription",
}

export enum QualityDefault {
  GOOD = "Good",
  BAD = "Bad",
  UNCERTAIN = "Uncertain",
}

export type AssetHierarchy = {
  planta: string;
  area: string;
  seccion: string;
  equipo: string;
};

export type PhysicalTagScaling = {
  type: ScalingType;
  rawLow?: number;
  rawHigh?: number;
  scaledLow?: number;
  scaledHigh?: number;
  clampLow?: boolean;
  clampHigh?: boolean;
  negateValue?: boolean;
};

export type PhysicalTag = {
  id: number;
  tagUUID: string;
  enable: boolean;
  name: string;
  description?: string;
  hierarchy: AssetHierarchy;
  serverId: number;
  origin: string;
  scanRate: number;
  readMode?: ReadMode;
  classification?: string;
  engUnit?: string;
  scaling?: PhysicalTagScaling;
  status: TagStatus;
  statusMessage?: string;
};

export type PhysicalTagFormData = Omit<
  PhysicalTag,
  "id" | "tagUUID" | "status" | "statusMessage"
>;
