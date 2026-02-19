import type { VirtualTag, VirtualTagFormData } from "../../types/virtual-tag.types";
import type { HierarchyTree } from "../../../tags-fisicos/types/hierarchy.data";

export type PhysicalTagRef = {
  tagUUID: string;
  name: string;
  description?: string;
  engUnit?: string;
};

export type VirtualTagFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VirtualTagFormData) => void;
  editingTag?: VirtualTag | null;
  existingTags: VirtualTag[];
  allPhysicalTags: PhysicalTagRef[];
  hierarchyData: HierarchyTree;
  onHierarchyChange: (data: HierarchyTree) => void;
  classifications: string[];
  onClassificationsChange: (items: string[]) => void;
  engUnits: string[];
  onEngUnitsChange: (items: string[]) => void;
};
