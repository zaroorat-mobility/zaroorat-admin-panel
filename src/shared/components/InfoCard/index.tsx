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
  loading?: boolean;
  onClick?: () => void;
}

const BADGE_BG_MAP: Record<string, string> = {
  blue: "bg-[#1F2B6D]",
  slate: "bg-[#1F2B6D]",
  indigo: "bg-[#1F2B6D]",
  purple: "bg-[#1F2B6D]",
  default: "bg-[#1F2B6D]",
  green: "bg-emerald-600",
  amber: "bg-amber-500",
  orange: "bg-amber-500",
  red: "bg-rose-500",
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
  loading = false,
  onClick,
}: InfoCardProps) {
  const normalizedVariant = variant === "default" ? "slate" : variant === "amber" ? "orange" : variant;
  const badgeBg = BADGE_BG_MAP[normalizedVariant] || "bg-[#1F2B6D]";

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between text-left select-none transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:border-slate-300 dark:hover:border-slate-700",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {icon && (
            <div className={cn("w-[42px] h-[42px] rounded-full flex items-center justify-center text-white shadow-sm flex-shrink-0 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:!text-white [&_svg]:!stroke-white", badgeBg)}>
              {icon}
            </div>
          )}
          <div>
            <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
              {loading ? (
                <span className="inline-block h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                value
              )}
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {label}
            </p>
          </div>
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {loading ? (
            <span className="inline-block h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          ) : (
            <>
              <span>{subtitle}</span>
              {trend && (
                <span className={cn(
                  "font-semibold flex items-center gap-0.5",
                  trendDirection === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                )}>
                  {trendDirection === 'up' ? '↗' : '↘'} {trend}
                </span>
              )}
            </>
          )}
        </div>
      )}
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
  5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
};

export function InfoCardGrid({ children, cols = 4, className = "" }: InfoCardGridProps) {
  return (
    <div className={cn("grid gap-4", GRID_COLS[cols], className)}>
      {children}
    </div>
  );
}
export default InfoCard
