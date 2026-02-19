import type { AlarmRule, AlarmRuleFormData } from "../../types/alarm.types";
import type { HierarchyTree } from "../../../../data-model/tags-fisicos/types/hierarchy.data";

export type TagRef = { name: string; description?: string; engUnit?: string };

export type AlarmFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AlarmRuleFormData) => void;
  editingAlarm?: AlarmRule | null;
  existingAlarms: AlarmRule[];
  allTags: TagRef[];
  hierarchyData: HierarchyTree;
  onHierarchyChange: (data: HierarchyTree) => void;
};
