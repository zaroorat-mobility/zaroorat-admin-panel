import React, { type ReactNode } from "react";
import { cn } from "@/shared/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

export function buttonVariants({
  variant = "primary",
}: {
  variant?: ButtonVariant;
} = {}) {
  const variants = {
    primary:
      "bg-[#2B317A] text-white hover:bg-[#252B6A] active:bg-[#1E2258] shadow-sm border border-transparent",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    outline:
      "bg-card hover:bg-muted text-foreground border border-border",
    ghost:
      "bg-transparent hover:bg-muted text-foreground",
    danger:
      "bg-destructive text-destructive-foreground hover:bg-red-600 active:bg-red-700 shadow-sm",
    success:
      "bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-sm",
  };

  return variants[variant];
}

// ── Base Button ───────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  form?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  onClick,
  className = "",
  type = "button",
  form,
  ...props
}, ref) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 select-none whitespace-nowrap active:scale-[0.98]";

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-sm",
  };

  const disabledStyles =
    disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      ref={ref}
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(baseStyles, buttonVariants({ variant }), sizes[size], disabledStyles, className)}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && !loading && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
})

Button.displayName = "Button";

// ── ExportButton ──────────────────────────────────────────────────────────────
// Pre-configured outline button with Excel/CSV export icon.

interface ActionButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ExportButton({
  onClick,
  loading = false,
  disabled = false,
  label = "Export",
  size = "md",
  className = "",
}: ActionButtonProps) {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      className={className}
      icon={
        // Download / export arrow icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      }
    >
      {label}
    </Button>
  );
}

// ── ImportButton ──────────────────────────────────────────────────────────────
// Pre-configured outline button with Excel/CSV import icon.

export function ImportButton({
  onClick,
  loading = false,
  disabled = false,
  label = "Import",
  size = "md",
  className = "",
}: ActionButtonProps) {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      className={className}
      icon={
        // Upload / import arrow icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      }
    >
      {label}
    </Button>
  );
}

// ── IconButton ────────────────────────────────────────────────────────────────
// Square icon-only button (for table row actions, toggles, etc.)

interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  variant?: "ghost" | "outline" | "danger-ghost";
  size?: "sm" | "md";
  active?: boolean;
  className?: string;
}

export function IconButton({
  icon,
  onClick,
  disabled = false,
  title,
  variant = "ghost",
  size = "md",
  active = false,
  className = "",
}: IconButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/20";

  const variants = {
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
    outline: "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
    "danger-ghost": "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
  };

  const sizes = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
  };

  const activeClass = active
    ? "bg-primary/10 text-primary border-primary/20"
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(base, variants[variant], sizes[size], activeClass, disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer", className)}
    >
      {icon}
    </button>
  );
}
export default Button
