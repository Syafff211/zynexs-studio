import Link from "next/link";
import { Home, Search } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="glass-solid w-full max-w-lg rounded-3xl p-8 text-center sm:p-12">
        <p className="text-[72px] font-bold leading-none text-gradient">404</p>
        <h1 className="mt-4 text-2xl font-bold text-white">Halaman tidak ditemukan</h1>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/55">
          Sepertinya halaman yang kamu cari sudah dipindahkan atau tidak pernah ada.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Link href="/" className={buttonStyles("primary", "lg", "w-full sm:w-auto")}>
            <Home className="h-4 w-4" aria-hidden="true" />
            Kembali ke Beranda
          </Link>
          <Link href="/store" className={buttonStyles("secondary", "lg", "w-full sm:w-auto")}>
            <Search className="h-4 w-4" aria-hidden="true" />
            Jelajahi Katalog
          </Link>
        </div>
      </div>
    </main>
  );
}
