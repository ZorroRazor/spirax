import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { CustomTooltipProps } from "./CustomTooltip.types";

export function CustomTooltip(props: CustomTooltipProps) {
  const { content } = props;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Mostrar ayuda"
            className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <Info strokeWidth={1.8} className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
