import type { Server } from "../../types/server.types";
import type { DriverConfig } from "../../types/driver-config.types";

export type DriverConfigDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (config: DriverConfig) => void;
  server: Server;
};
