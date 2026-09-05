import { AlertTriangle, Terminal } from "lucide-react";

/**
 * Rendered only when NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are missing, so a
 * fresh clone explains itself instead of throwing a cryptic runtime error.
 */
export function SetupNotice() {
  return (
    <div className="container-page pt-6">
      <div className="glass-solid rounded-2xl border-amber-400/25 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/12 text-amber-300 ring-1 ring-amber-400/25">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">Supabase belum dikonfigurasi</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">
              Katalog, promo, dan checkout membaca data langsung dari Supabase. Buat project di{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-200 underline underline-offset-2"
              >
                supabase.com
              </a>
              , jalankan <code className="rounded bg-white/10 px-1.5 py-0.5 text-[13px]">supabase/schema.sql</code>{" "}
              di SQL Editor, lalu isi <code className="rounded bg-white/10 px-1.5 py-0.5 text-[13px]">.env.local</code>.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-ink-950/80 p-4 text-[12.5px] leading-relaxed text-white/70">
              <code>{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # server-side only`}</code>
            </pre>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-white/45">
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              Lalu isi data awal dengan <code className="rounded bg-white/10 px-1.5 py-0.5">npm run seed</code>. Panduan lengkap ada di README.md.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
