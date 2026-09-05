"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function CopyCodeButton({ code, className }: { code: string; className?: string }) {
  const { success, error } = useToast();
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      success("Kode disalin", `Gunakan ${code} saat checkout.`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      error("Gagal menyalin", "Salin kode secara manual.");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Salin kode promo ${code}`}
      className={cn(
        "group flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-brand-400/40 bg-brand-500/[0.08] px-3.5 py-2.5 transition-colors hover:border-brand-400/70 hover:bg-brand-500/[0.14]",
        className
      )}
    >
      <span className="truncate font-mono text-[14.5px] font-bold tracking-wider text-brand-100">
        {code}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-brand-300">
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Tersalin
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Salin
          </>
        )}
      </span>
    </button>
  );
}
