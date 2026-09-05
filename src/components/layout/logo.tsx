import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
  href = "/",
}: {
  className?: string;
  compact?: boolean;
  href?: string | null;
}) {
  const mark = (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
      <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-accent-500 opacity-90 blur-[2px]" />
      <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500" />
      <svg
        viewBox="0 0 24 24"
        className="relative h-5 w-5 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 6h12L7 18h11" />
      </svg>
    </span>
  );

  const content = (
    <span className={cn("group inline-flex items-center gap-2.5", className)}>
      {mark}
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-bold tracking-tight text-white">
            Zynex<span className="text-brand-300"> Studio</span>
          </span>
          <span className="mt-0.5 text-[9.5px] font-medium uppercase tracking-[0.2em] text-white/35">
            Digital Store
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Zynex Studio — Beranda" className="rounded-xl">
      {content}
    </Link>
  );
}
