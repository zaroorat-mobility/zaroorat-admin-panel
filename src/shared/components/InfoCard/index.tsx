import { type ReactNode } from "react";
import { cn } from "@/shared/utils";

export type InfoCardVariant =
  | "purple"
  | "green"
  | "blue"
  | "slate"
  | "indigo"
  | "red"
  | "orange"
  | "default"
  | "amber";

export interface InfoCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  subtitle?: ReactNode;
  variant?: InfoCardVariant;
  className?: string;
}

const COLOR_MAP = {
  purple: { border: "border-primary/20", iconText: "text-primary", bgGradient: "bg-primary/5/40 dark:bg-primary/10" },
  green:  { border: "border-green-200 dark:border-green-800/40", iconText: "text-green-600 dark:text-green-400", bgGradient: "bg-green-50/40 dark:bg-green-950/10" },
  blue:   { border: "border-blue-200 dark:border-blue-800/40", iconText: "text-blue-600 dark:text-blue-400", bgGradient: "bg-blue-50/40 dark:bg-blue-950/10" },
  slate:  { border: "border-slate-200 dark:border-slate-800/40", iconText: "text-slate-500 dark:text-slate-400", bgGradient: "bg-slate-50/40 dark:bg-slate-900/10" },
  indigo: { border: "border-primary/20", iconText: "text-primary", bgGradient: "bg-primary/5/40 dark:bg-primary/10" },
  red:    { border: "border-red-200 dark:border-red-800/40", iconText: "text-red-600 dark:text-red-400", bgGradient: "bg-red-50/40 dark:bg-red-950/10" },
  orange: { border: "border-orange-200 dark:border-amber-800/40", iconText: "text-orange-600 dark:text-amber-400", bgGradient: "bg-orange-50/40 dark:bg-amber-950/10" },

  // Backwards compatibility mappings
  default: { border: "border-slate-200 dark:border-slate-800/40", iconText: "text-slate-500", bgGradient: "bg-slate-50/40" },
  amber:   { border: "border-orange-200 dark:border-amber-800/40", iconText: "text-orange-600 dark:text-amber-400", bgGradient: "bg-orange-50/40 dark:bg-amber-950/10" },
};

export function InfoCard({
  label,
  value,
  icon,
  trend,
  trendDirection = "up",
  subtitle,
  variant = "slate",
  className = "",
}: InfoCardProps) {
  // Normalize variants for backwards compatibility
  const normalizedVariant = variant === "default" ? "slate" : variant === "amber" ? "orange" : variant;
  const c = COLOR_MAP[normalizedVariant] || COLOR_MAP.slate;

  return (
    <div
      className={cn(
        c.bgGradient,
        c.border,
        "border border-t-2 border-t-primary rounded-xl h-[110px] px-4 py-3 flex flex-col transition-all duration-200 hover:shadow-sm text-left select-none",
        className
      )}
    >
      {/* Top Row: Label & Icon */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-none">{label}</span>
        {icon && <span className={cn("flex-shrink-0", c.iconText)}>{icon}</span>}
      </div>

      {/* Middle Row: Value */}
      <div className="mt-1.5 text-[24px] font-bold leading-none text-slate-900 dark:text-white tracking-tight">
        {value}
      </div>

      {/* Bottom Row: Subtitle/Trend */}
      <div className="mt-auto text-[11px] leading-none text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
        {trend && (
          <span className={cn(
            "font-semibold flex items-center gap-0.5",
            trendDirection === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
          )}>
            {trendDirection === 'up' ? '↗' : '↘'} {trend}
          </span>
        )}
        <span>{subtitle || 'vs last week'}</span>
      </div>
    </div>
  );
}

interface InfoCardGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
};

export function InfoCardGrid({ children, cols = 4, className = "" }: InfoCardGridProps) {
  return (
    <div className={cn("grid gap-4", GRID_COLS[cols], className)}>
      {children}
    </div>
  );
}
export default InfoCard
