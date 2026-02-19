import type { PhysicalTag } from "../../types/physical-tag.types";

export type ServerRef = {
  id: number;
  name: string;
  driver: string;
};

export interface PhysicalTagsTableProps {
  tags: PhysicalTag[];
  servers: ServerRef[];
  onToggleEnable: (id: number) => void;
  onEdit: (tag: PhysicalTag) => void;
  onDelete: (id: number) => void;
  onDuplicate: (tag: PhysicalTag) => void;
  onBulkEnable: (ids: number[]) => void;
  onBulkDisable: (ids: number[]) => void;
  onBulkDelete: (ids: number[]) => void;
}
