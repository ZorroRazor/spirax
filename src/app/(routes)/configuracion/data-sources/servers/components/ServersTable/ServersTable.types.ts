import type { Server } from "../../types/server.types";

export type ServersTableProps = {
  servers: Server[];
  onToggleEnable: (id: number) => void;
  onEdit: (server: Server) => void;
  onDelete: (id: number) => void;
  onConfigureDriver: (server: Server) => void;
};
