import { CustomIconProps } from "./CustomIcon.types";

export function CustomIcon(props: CustomIconProps) {
  const { icon: Icon } = props;

  return (
    <div className="rounded-lg bg-slate-900/10 p-2 text-slate-700">
      <Icon strokeWidth={1.8} className="h-4 w-4" />
    </div>
  );
}
