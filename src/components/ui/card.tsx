import * as React from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  solid = false,
  hover = false,
  as: Tag = "div",
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  solid?: boolean;
  hover?: boolean;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={cn(
        solid ? "glass-solid" : "glass",
        "rounded-2xl",
        hover && "hover-lift",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
          {eyebrow}
        </span>
      )}
      <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-pretty text-[15px] leading-relaxed text-white/55">{description}</p>
      )}
    </div>
  );
}

type BadgeTone = "brand" | "success" | "warning" | "danger" | "neutral" | "violet";

const badgeTones: Record<BadgeTone, string> = {
  brand: "bg-brand-500/12 text-brand-200 ring-brand-400/25",
  success: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  warning: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  danger: "bg-rose-400/10 text-rose-300 ring-rose-400/25",
  neutral: "bg-white/[0.07] text-white/65 ring-white/12",
  violet: "bg-violet-400/10 text-violet-300 ring-violet-400/25",
};

export function Badge({
  tone = "brand",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} aria-hidden="true" />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-brand-200 ring-1 ring-white/10">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/50">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-white/[0.08]", className)} />;
}

export function StatTile({
  label,
  value,
  icon,
  hint,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  tone?: BadgeTone;
}) {
  const glow: Record<BadgeTone, string> = {
    brand: "from-brand-500/18",
    success: "from-emerald-500/18",
    warning: "from-amber-500/18",
    danger: "from-rose-500/18",
    neutral: "from-white/10",
    violet: "from-violet-500/18",
  };

  return (
    <div className="glass-solid relative overflow-hidden rounded-2xl p-5">
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl",
          glow[tone]
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium uppercase tracking-wider text-white/45">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold text-white">{value}</p>
          {hint && <p className="mt-1 text-[12px] text-white/40">{hint}</p>}
        </div>
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-brand-200 ring-1 ring-white/10">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
