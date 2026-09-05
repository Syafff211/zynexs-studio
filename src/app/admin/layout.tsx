import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/server";
import { Logo } from "@/components/layout/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/products", label: "Produk", icon: "Package" },
  { href: "/admin/promo", label: "Promo", icon: "Tag" },
  { href: "/admin/orders", label: "Pesanan", icon: "ShoppingBag" },
  { href: "/admin/users", label: "Pengguna", icon: "Users" },
  { href: "/admin/content", label: "Konten", icon: "FileText" },
  { href: "/admin/settings", label: "Landing CMS", icon: "Settings" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side authorization — middleware is a convenience, this is the gate.
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    redirect("/account?error=forbidden");
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/[0.07] bg-ink-950/60 backdrop-blur-2xl lg:flex lg:flex-col">
        <div className="border-b border-white/[0.07] p-5">
          <Logo />
        </div>

        <AdminNav items={[...NAV_ITEMS]} />

        <div className="mt-auto border-t border-white/[0.07] p-4">
          <div className="glass flex items-center gap-3 rounded-xl p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-brand-500 text-[12px] font-bold text-white">
              {initials(profile.full_name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">
                {profile.full_name ?? "Admin"}
              </p>
              <p className="truncate text-[11.5px] text-violet-300">Administrator</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Lihat Storefront
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink-950/85 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo compact={false} />
          <span className="rounded-full bg-violet-500/12 px-2.5 py-1 text-[11px] font-semibold text-violet-200 ring-1 ring-inset ring-violet-400/25">
            Admin
          </span>
        </div>
        <AdminNav items={[...NAV_ITEMS]} horizontal />
      </div>

      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
