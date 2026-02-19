import type { EventRule, EventRuleFormData } from "../../types/event-rule.types";
import type { HierarchyTree } from "../../../../data-model/tags-fisicos/types/hierarchy.data";

export type TagRef = {
  name: string;
  description?: string;
  engUnit?: string;
};

export type EventRuleFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EventRuleFormData) => void;
  editingRule?: EventRule | null;
  existingRules: EventRule[];
  allTags: TagRef[];
  hierarchyData: HierarchyTree;
  onHierarchyChange: (data: HierarchyTree) => void;
};
