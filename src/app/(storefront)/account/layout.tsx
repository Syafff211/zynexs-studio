import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Settings,
  Tag,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import { cn, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/card";

const NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Pesanan", icon: Package },
  { href: "/account#promo", label: "Riwayat Promo", icon: Tag },
  { href: "/account#settings", label: "Pengaturan", icon: Settings },
];

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/account");

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <div className="glass-solid rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-[15px] font-bold text-white">
                {initials(profile.full_name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-white">
                  {profile.full_name ?? "Pengguna"}
                </p>
                <p className="truncate text-[12.5px] text-white/45">{profile.email}</p>
              </div>
            </div>

            {profile.role === "admin" && (
              <div className="mt-3.5">
                <Link href="/admin">
                  <Badge tone="violet">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    Admin — buka panel
                  </Badge>
                </Link>
              </div>
            )}
          </div>

          <nav aria-label="Menu akun" className="mt-3">
            <ul className="glass-solid space-y-0.5 rounded-2xl p-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="border-t border-white/[0.07] pt-1">
                <Link
                  href="/store"
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Kembali ke Store
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
