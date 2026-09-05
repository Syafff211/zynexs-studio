"use client";

import * as React from "react";
import { useMounted } from "@/hooks/use-mounted";
import Link from "next/link";
import { X, Megaphone, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types";

const STORAGE_PREFIX = "zynex.announcement.dismissed.";

const variantStyles: Record<string, string> = {
  info: "from-brand-600/25 via-brand-500/12 to-accent-500/20 text-brand-100",
  promo: "from-violet-600/25 via-brand-500/14 to-accent-500/22 text-violet-100",
  warning: "from-amber-600/25 via-amber-500/12 to-rose-500/18 text-amber-100",
};

const variantIcon: Record<string, React.ReactNode> = {
  info: <Megaphone className="h-4 w-4" aria-hidden="true" />,
  promo: <Sparkles className="h-4 w-4" aria-hidden="true" />,
  warning: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
};

export function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
  const mounted = useMounted();
  const [dismissed, setDismissed] = React.useState(false);

  // Rendered only after hydration, so reading sessionStorage here cannot
  // cause a server/client mismatch.
  const dismissedThisSession = React.useMemo(() => {
    if (!mounted || !announcement) return false;
    try {
      return window.sessionStorage.getItem(STORAGE_PREFIX + announcement.id) === "1";
    } catch {
      return false;
    }
  }, [mounted, announcement]);

  if (!announcement || !mounted || dismissed || dismissedThisSession) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(STORAGE_PREFIX + announcement.id, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="status"
      className={cn(
        "relative border-b border-white/[0.07] bg-gradient-to-r",
        variantStyles[announcement.variant] ?? variantStyles.info
      )}
    >
      <div className="container-page flex items-center gap-3 py-2.5">
        <span className="hidden shrink-0 sm:block">
          {variantIcon[announcement.variant] ?? variantIcon.info}
        </span>
        <p className="min-w-0 flex-1 text-center text-[13px] font-medium leading-snug sm:text-left">
          {announcement.message}
          {announcement.link_url && (
            <Link
              href={announcement.link_url}
              className="ml-2 inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {announcement.link_label || "Lihat"} →
            </Link>
          )}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup pengumuman"
          className="-mr-1 shrink-0 rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
