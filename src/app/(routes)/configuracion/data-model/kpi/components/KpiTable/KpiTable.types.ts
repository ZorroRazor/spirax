import type { Kpi } from "../../types/kpi.types";

export type TagRef = {
  name: string;
  description?: string;
  engUnit?: string;
};

export type KpiTableProps = {
  kpis: Kpi[];
  onToggleEnable: (id: number) => void;
  onEdit: (kpi: Kpi) => void;
  onDelete: (id: number) => void;
  onDuplicate: (kpi: Kpi) => void;
  onBulkEnable: (ids: number[]) => void;
  onBulkDisable: (ids: number[]) => void;
  onBulkDelete: (ids: number[]) => void;
};
