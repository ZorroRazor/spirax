import type { AlarmRule } from "../../types/alarm.types";

export type AlarmTableProps = {
  alarms: AlarmRule[];
  onToggleEnable: (id: number) => void;
  onEdit: (alarm: AlarmRule) => void;
  onDelete: (id: number) => void;
  onDuplicate: (alarm: AlarmRule) => void;
  onBulkEnable: (ids: number[]) => void;
  onBulkDisable: (ids: number[]) => void;
  onBulkDelete: (ids: number[]) => void;
};
