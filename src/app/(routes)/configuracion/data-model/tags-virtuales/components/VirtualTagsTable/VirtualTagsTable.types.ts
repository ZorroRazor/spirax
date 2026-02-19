import type { VirtualTag } from "../../types/virtual-tag.types";

export type VirtualTagsTableProps = {
  tags: VirtualTag[];
  allPhysicalTags: { tagUUID: string; name: string }[];
  onToggleEnable: (id: number) => void;
  onEdit: (tag: VirtualTag) => void;
  onDelete: (id: number) => void;
  onDuplicate: (tag: VirtualTag) => void;
  onBulkEnable: (ids: number[]) => void;
  onBulkDisable: (ids: number[]) => void;
  onBulkDelete: (ids: number[]) => void;
};
