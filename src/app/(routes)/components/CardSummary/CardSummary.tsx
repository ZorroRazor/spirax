import { MoveDownRight, MoveUpRight, TrendingUp } from "lucide-react";

import { CustomIcon } from "@/components/CustomIcon";
import { CustomTooltip } from "@/components/CustomTooltip";
import { cn } from "@/lib/utils";

import { CardSummaryProps } from "./CardSummary.types";

export function CardSummary(props: CardSummaryProps) {
  const { average, icon: Icon, title, tooltipText, total } = props;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CustomIcon icon={Icon} />
          <h3 className="text-sm font-medium text-slate-700">{title}</h3>
        </div>
        <CustomTooltip content={tooltipText} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <p className="text-2xl font-semibold tracking-tight">{total}</p>
        <div
          className={cn(
            "flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium text-white",
            average < 20 && "bg-rose-600",
            average >= 20 && average < 70 && "bg-amber-500",
            average >= 70 && "bg-emerald-600",
          )}
        >
          {average}%
          {average < 20 && <MoveDownRight className="h-3.5 w-3.5" />}
          {average >= 20 && average < 70 && <MoveUpRight className="h-3.5 w-3.5" />}
          {average >= 70 && <TrendingUp className="h-3.5 w-3.5" />}
        </div>
      </div>
    </article>
  );
}
