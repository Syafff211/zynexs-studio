"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[zynex]", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="glass-solid w-full max-w-lg rounded-3xl p-8 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-300 ring-1 ring-rose-400/25">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-white">Terjadi kesalahan</h1>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/55">
          Maaf, ada yang tidak berjalan semestinya. Coba muat ulang halaman ini.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[12px] text-white/30">Ref: {error.digest}</p>
        )}
        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button size="lg" onClick={reset} className="w-full sm:w-auto">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Coba Lagi
          </Button>
          <Link href="/" className={buttonStyles("secondary", "lg", "w-full sm:w-auto")}>
            <Home className="h-4 w-4" aria-hidden="true" />
            Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
