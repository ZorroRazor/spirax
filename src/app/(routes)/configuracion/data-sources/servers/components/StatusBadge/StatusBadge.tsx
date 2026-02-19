import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServerStatus } from "../../types/server.types";
import type { StatusBadgeProps } from "./StatusBadge.types";

const statusConfig = {
  [ServerStatus.CONNECTED]: {
    variant: "success" as const,
    label: "Connected",
  },
  [ServerStatus.DISCONNECTED]: {
    variant: "secondary" as const,
    label: "Disconnected",
  },
  [ServerStatus.ERROR]: {
    variant: "destructive" as const,
    label: "Error",
  },
  [ServerStatus.DEGRADED]: {
    variant: "warning" as const,
    label: "Degraded",
  },
};

export function StatusBadge({ status, message }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!message) {
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className="cursor-help">
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
