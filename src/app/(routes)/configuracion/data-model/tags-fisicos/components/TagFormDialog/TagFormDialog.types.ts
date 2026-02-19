import type { PhysicalTag, PhysicalTagFormData } from "../../types/physical-tag.types";
import type { HierarchyTree } from "../../types/hierarchy.data";
import type { ServerRef } from "../PhysicalTagsTable/PhysicalTagsTable.types";

export interface TagFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PhysicalTagFormData) => void;
  editingTag?: PhysicalTag | null;
  existingTags: PhysicalTag[];
  servers: ServerRef[];
  // Managed lists & hierarchy passed from page
  hierarchyData: HierarchyTree;
  onHierarchyChange: (data: HierarchyTree) => void;
  classifications: string[];
  onClassificationsChange: (items: string[]) => void;
  engUnits: string[];
  onEngUnitsChange: (items: string[]) => void;
}
