import type { EventRule } from "../../types/event-rule.types";

export type EventRuleTableProps = {
  rules: EventRule[];
  onToggleEnable: (id: number) => void;
  onEdit: (rule: EventRule) => void;
  onDelete: (id: number) => void;
  onDuplicate: (rule: EventRule) => void;
  onBulkEnable: (ids: number[]) => void;
  onBulkDisable: (ids: number[]) => void;
  onBulkDelete: (ids: number[]) => void;
};
