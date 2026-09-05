"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  User as UserIcon,
  LayoutDashboard,
  LogOut,
  Package,
  ChevronDown,
} from "lucide-react";
import { Logo } from "./logo";
import { Button, buttonStyles } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { cn, initials } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import type { Profile } from "@/types";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/store", label: "Store" },
  { href: "/promo", label: "Promo" },
  { href: "/#cara-order", label: "Cara Order" },
  { href: "/faq", label: "FAQ" },
];

export function Navbar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const { count, hydrated } = useCart();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const menuRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close every overlay on navigation. Adjusting state during render (rather
  // than in an effect) avoids an extra commit with the menu still open.
  const [lastPathname, setLastPathname] = React.useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  React.useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-white/[0.07] bg-ink-950/72 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.9)]"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-3 lg:h-[70px]" aria-label="Navigasi utama">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors duration-200",
                  isActive(link.href) ? "text-white" : "text-white/60 hover:text-white"
                )}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            {searchOpen ? (
              <form
                action="/store"
                className="flex items-center"
                onSubmit={() => setSearchOpen(false)}
              >
                <input
                  ref={searchInputRef}
                  type="search"
                  name="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => !query && setSearchOpen(false)}
                  placeholder="Cari produk…"
                  aria-label="Cari produk"
                  className="h-10 w-44 rounded-xl border border-white/12 bg-white/[0.06] px-3.5 text-sm text-white placeholder:text-white/35 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 md:w-56"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Buka pencarian"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label={`Keranjang${hydrated && count ? `, ${count} item` : ""}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {hydrated && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 px-1 text-[10px] font-bold text-white ring-2 ring-ink-950">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {/* Account */}
          {profile ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] pl-1.5 pr-2.5 text-white/80 transition-colors hover:bg-white/[0.1]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-[11px] font-bold text-white">
                  {initials(profile.full_name)}
                </span>
                <span className="hidden max-w-24 truncate text-[13px] font-medium sm:block">
                  {profile.full_name?.split(" ")[0] ?? "Akun"}
                </span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", menuOpen && "rotate-180")}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="glass-strong absolute right-0 top-12 w-60 overflow-hidden rounded-2xl p-1.5 shadow-2xl animate-fade-up"
                >
                  <div className="border-b border-white/[0.07] px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-white">
                      {profile.full_name ?? "Pengguna"}
                    </p>
                    <p className="truncate text-[12px] text-white/45">{profile.email}</p>
                  </div>
                  <MenuLink href="/account" icon={<UserIcon className="h-4 w-4" />}>
                    Dashboard
                  </MenuLink>
                  <MenuLink href="/account/orders" icon={<Package className="h-4 w-4" />}>
                    Pesanan Saya
                  </MenuLink>
                  {profile.role === "admin" && (
                    <MenuLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
                      Admin Panel
                    </MenuLink>
                  )}
                  <form action={logoutAction} className="border-t border-white/[0.07] pt-1">
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className={buttonStyles("ghost", "sm", "hidden sm:inline-flex")}>
              Login
            </Link>
          )}

          <Link href="/store" className={buttonStyles("primary", "sm", "hidden md:inline-flex")}>
            Belanja Sekarang
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile navigation */}
      <div
        className={cn(
          "fixed inset-x-0 top-16 z-40 origin-top overflow-y-auto border-b border-white/[0.07] bg-ink-950/95 backdrop-blur-2xl transition-all duration-300 lg:hidden",
          mobileOpen
            ? "max-h-[calc(100dvh-4rem)] opacity-100"
            : "pointer-events-none max-h-0 opacity-0"
        )}
      >
        <div className="container-page space-y-4 py-5">
          <form action="/store" className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              name="q"
              placeholder="Cari produk digital…"
              aria-label="Cari produk"
              className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.05] pl-10 pr-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </form>

          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-white/[0.08] text-white"
                      : "text-white/65 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-2.5 pb-2">
            {profile ? (
              <Link href="/account" className={buttonStyles("secondary", "md", "w-full")}>
                Akun Saya
              </Link>
            ) : (
              <Link href="/login" className={buttonStyles("secondary", "md", "w-full")}>
                Login
              </Link>
            )}
            <Link href="/store" className={buttonStyles("primary", "md", "w-full")}>
              Belanja Sekarang
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white"
    >
      {icon}
      {children}
    </Link>
  );
}

export { Button };
