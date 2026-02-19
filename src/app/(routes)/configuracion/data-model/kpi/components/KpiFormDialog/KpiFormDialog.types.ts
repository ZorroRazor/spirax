import type { Kpi, KpiFormData } from "../../types/kpi.types";
import type { HierarchyTree } from "../../../tags-fisicos/types/hierarchy.data";

export type TagRef = {
  name: string;
  description?: string;
  engUnit?: string;
};

export type KpiFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: KpiFormData) => void;
  editingKpi?: Kpi | null;
  existingKpis: Kpi[];
  allTags: TagRef[];
  hierarchyData: HierarchyTree;
  onHierarchyChange: (data: HierarchyTree) => void;
  categories: string[];
  onCategoriesChange: (items: string[]) => void;
  units: string[];
  onUnitsChange: (items: string[]) => void;
};
