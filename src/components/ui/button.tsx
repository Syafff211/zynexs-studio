import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap rounded-xl transition-all duration-300 disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 shadow-[0_10px_30px_-12px_rgba(31,69,245,0.85)] hover:shadow-[0_16px_44px_-14px_rgba(31,69,245,0.95)] hover:brightness-[1.08]",
  secondary:
    "text-white/90 bg-white/[0.07] border border-white/12 backdrop-blur-xl hover:bg-white/[0.12] hover:border-white/25",
  outline:
    "text-white/85 border border-white/18 bg-transparent hover:bg-white/[0.07] hover:border-white/30",
  ghost: "text-white/70 hover:text-white hover:bg-white/[0.07]",
  danger:
    "text-white bg-gradient-to-r from-rose-600 to-rose-500 shadow-[0_10px_30px_-14px_rgba(244,63,94,0.8)] hover:brightness-110",
  success:
    "text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-[0_10px_30px_-14px_rgba(16,185,129,0.8)] hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[15px]",
  icon: "h-10 w-10 p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});

export const buttonStyles = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(base, variants[variant], sizes[size], className);
