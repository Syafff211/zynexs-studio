import Link from "next/link";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { Logo } from "./logo";
import { Icon } from "@/components/ui/icon";
import { waLink } from "@/lib/utils";
import type { SiteSettings } from "@/types";

const STORE_LINKS = [
  { href: "/store", label: "Semua Produk" },
  { href: "/store?category=domain", label: "Domain" },
  { href: "/store?category=ai", label: "AI Tools" },
  { href: "/store?category=design", label: "Design" },
  { href: "/store?category=social-media", label: "Social Media" },
];

const HELP_LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/#cara-order", label: "Cara Order" },
  { href: "/promo", label: "Promo Aktif" },
  { href: "/account/orders", label: "Lacak Pesanan" },
];

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-white/[0.07]">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/50">
              {settings.footer_description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {settings.social_links.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="glass flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:text-white"
                >
                  <Icon name={social.icon} className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <nav className="lg:col-span-2" aria-label="Menu toko">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white/80">Store</h2>
            <ul className="mt-4 space-y-2.5">
              {STORE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-white/50 transition-colors hover:text-brand-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="lg:col-span-2" aria-label="Menu bantuan">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white/80">Bantuan</h2>
            <ul className="mt-4 space-y-2.5">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-white/50 transition-colors hover:text-brand-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white/80">
              Hubungi Kami
            </h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={waLink(settings.whatsapp_number, "Halo Zynex Studio 👋 saya ingin bertanya.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass group flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-300">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-white">WhatsApp</span>
                    <span className="block truncate text-[12.5px] text-white/45">
                      +{settings.whatsapp_number}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${settings.support_email}`}
                  className="glass group flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/12 text-brand-300">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-white">Email</span>
                    <span className="block truncate text-[12.5px] text-white/45">
                      {settings.support_email}
                    </span>
                  </span>
                </a>
              </li>
              <li className="flex items-center gap-3 px-3.5 py-1 text-[12.5px] text-white/40">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                Melayani seluruh Indonesia · Online 24/7
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] pt-6 sm:flex-row">
          <p className="text-[13px] text-white/40">
            © {year} {settings.footer_copyright}
          </p>
          <p className="text-[13px] text-white/30">
            Premium Digital Products &amp; Services · Made in Indonesia 🇮🇩
          </p>
        </div>
      </div>
    </footer>
  );
}
