import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Star } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatIDR } from "@/lib/utils";
import type { ProductWithCategory, SiteSettings } from "@/types";

export function Hero({
  settings,
  products,
}: {
  settings: SiteSettings;
  products: ProductWithCategory[];
}) {
  const showcase = products.slice(0, 3);

  return (
    <section className="relative overflow-hidden pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-24">
      {/* Ambient orbs — decorative only */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-brand-600/20 blur-[100px] animate-pulse-glow" />
        <div className="absolute -right-16 top-32 h-80 w-80 rounded-full bg-violet-600/16 blur-[110px] animate-pulse-glow [animation-delay:1.5s]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-accent-500/12 blur-[100px]" />
      </div>

      <div className="container-page relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Copy */}
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-[12px] font-medium text-brand-200 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {settings.hero_badge}
            </span>

            <h1 className="mt-5 text-balance text-[2.1rem] font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.35rem]">
              {settings.hero_title}{" "}
              <span className="text-gradient">{settings.hero_highlight}</span>
            </h1>

            <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-white/60 sm:text-[16.5px]">
              {settings.hero_subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={settings.hero_cta_href}
                className={buttonStyles("primary", "lg", "w-full sm:w-auto")}
              >
                {settings.hero_cta_label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={settings.hero_secondary_href}
                className={buttonStyles("secondary", "lg", "w-full sm:w-auto")}
              >
                {settings.hero_secondary_label}
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {settings.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-xl font-bold text-white sm:text-2xl">
                      {stat.value}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-white/45">{stat.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Floating glass product cards */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-500/22 via-violet-500/12 to-accent-500/18 blur-2xl"
            />

            <div className="relative space-y-3.5">
              {showcase.map((product, index) => (
                <div
                  key={product.id}
                  className={[
                    "glass rounded-2xl p-4 shadow-2xl",
                    index === 0 ? "animate-float-slow lg:ml-0 lg:mr-10" : "",
                    index === 1 ? "animate-float-slower lg:ml-12 lg:mr-0" : "",
                    index === 2 ? "animate-float-slow [animation-delay:1.2s] lg:ml-4 lg:mr-6" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/25 to-accent-500/18 ring-1 ring-white/10">
                      <Icon name={product.icon} className="h-5 w-5 text-brand-100" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-white">
                        {product.name}
                      </p>
                      <p className="truncate text-[12px] text-white/45">
                        {product.category?.name ?? "Digital"}
                        {product.duration ? ` · ${product.duration}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-[15px] font-bold text-brand-200">
                      {product.is_custom_price ? "Custom" : formatIDR(product.price)}
                    </p>
                  </div>
                </div>
              ))}

              {showcase.length === 0 && (
                <div className="glass rounded-2xl p-6 text-center text-sm text-white/45">
                  Produk akan tampil di sini setelah katalog terisi.
                </div>
              )}

              {/* Trust strip */}
              <div className="glass-solid flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5">
                <span className="flex items-center gap-2 text-[12.5px] font-medium text-white/70">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  Aman
                </span>
                <span className="h-4 w-px bg-white/10" />
                <span className="flex items-center gap-2 text-[12.5px] font-medium text-white/70">
                  <Zap className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  Proses Cepat
                </span>
                <span className="h-4 w-px bg-white/10" />
                <span className="flex items-center gap-2 text-[12.5px] font-medium text-white/70">
                  <Star className="h-4 w-4 fill-brand-300 text-brand-300" aria-hidden="true" />
                  4.9/5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
