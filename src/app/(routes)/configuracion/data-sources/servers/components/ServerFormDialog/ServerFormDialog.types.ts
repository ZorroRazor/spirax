import type { Server, ServerFormData } from "../../types/server.types";

export type ServerFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ServerFormData) => void;
  editingServer?: Server | null;
};
