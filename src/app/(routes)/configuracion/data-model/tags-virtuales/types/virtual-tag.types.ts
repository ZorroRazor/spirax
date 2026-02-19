import type { AssetHierarchy } from "../../tags-fisicos/types/physical-tag.types";

export type { AssetHierarchy };

export enum VirtualType {
  MATEMATICO = "Matemático",
  LOGICO = "Lógico",
  TOTALIZADOR = "Totalizador",
  AGREGADO = "Agregado",
  FUNCION = "Función",
  SCRIPT = "Script",
}

export enum VirtualTagStatus {
  OK = "ok",
  UNCERTAIN = "uncertain",
  BAD = "bad",
}

export type VirtualTag = {
  id: number;
  tagUUID: string;
  enable: boolean;
  name: string;
  description?: string;
  hierarchy: AssetHierarchy;
  classification?: string;
  engUnit?: string;
  virtualType: VirtualType;
  evaluateRate: number; // ms
  formula: string; // expression with {tagUUID} references
  status: VirtualTagStatus;
  statusMessage?: string;
};

export type VirtualTagFormData = Omit<
  VirtualTag,
  "id" | "tagUUID" | "status" | "statusMessage"
>;
