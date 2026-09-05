"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Users,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Users,
  FileText,
  Settings,
};

export function AdminNav({
  items,
  horizontal = false,
}: {
  items: { href: string; label: string; icon: string }[];
  horizontal?: boolean;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  if (horizontal) {
    return (
      <nav aria-label="Navigasi admin" className="overflow-x-auto border-t border-white/[0.07]">
        <ul className="flex min-w-max gap-1 px-3 py-2">
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-brand-500/15 text-brand-100 ring-1 ring-inset ring-brand-400/25"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Navigasi admin" className="flex-1 overflow-y-auto p-3">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-brand-500/15 text-brand-100 ring-1 ring-inset ring-brand-400/25"
                    : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
