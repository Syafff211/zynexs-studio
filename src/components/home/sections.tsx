import Link from "next/link";
import { ArrowRight, Tag, Copy } from "lucide-react";
import { SectionHeading, GlassCard } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { buttonStyles } from "@/components/ui/button";
import { HOW_TO_ORDER_STEPS } from "@/lib/constants";
import type { BenefitSetting, SiteSettings } from "@/types";

export function Benefits({ benefits }: { benefits: BenefitSetting[] }) {
  if (!benefits.length) return null;

  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="benefits-heading">
      <SectionHeading
        eyebrow="Kenapa Zynex"
        title={
          <span id="benefits-heading">
            Dibuat untuk yang mau <span className="text-gradient">cepat &amp; hemat</span>
          </span>
        }
        description="Semua yang kamu butuhkan untuk mulai online, tanpa ribet dan tanpa biaya tersembunyi."
      />

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <li key={benefit.title}>
            <GlassCard hover className="h-full p-5 sm:p-6">
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/14 text-brand-200 ring-1 ring-white/10">
                <Icon name={benefit.icon} className="h-5 w-5" />
              </span>
              <h3 className="text-[15.5px] font-semibold text-white">{benefit.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/50">
                {benefit.description}
              </p>
            </GlassCard>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HowToOrder() {
  return (
    <section
      id="cara-order"
      className="container-page scroll-mt-24 py-16 sm:py-20"
      aria-labelledby="how-heading"
    >
      <SectionHeading
        eyebrow="Cara Order"
        title={<span id="how-heading">Empat langkah, pesanan jalan</span>}
        description="Tanpa payment gateway rumit. Checkout langsung terhubung ke WhatsApp admin Zynex Studio."
      />

      <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {HOW_TO_ORDER_STEPS.map((step, index) => (
          <li key={step.title} className="relative">
            <GlassCard hover className="h-full p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-[13px] font-bold text-white shadow-lg shadow-brand-600/30">
                  {index + 1}
                </span>
                {index < HOW_TO_ORDER_STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden h-px flex-1 bg-gradient-to-r from-white/15 to-transparent lg:block"
                  />
                )}
              </div>
              <h3 className="text-[15.5px] font-semibold text-white">{step.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/50">
                {step.description}
              </p>
            </GlassCard>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PromoBanner({ settings }: { settings: SiteSettings }) {
  if (!settings.promo_banner_enabled) return null;

  return (
    <section className="container-page py-6 sm:py-10" aria-label="Promo aktif">
      <div className="glass-solid relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/22 blur-[90px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-violet-500/18 blur-[90px]"
        />

        <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-violet-200 ring-1 ring-inset ring-violet-400/25">
              <Tag className="h-3 w-3" aria-hidden="true" />
              {settings.promo_banner_title}
            </span>
            <h2 className="mt-3.5 text-balance text-2xl font-bold text-white sm:text-3xl">
              {settings.promo_banner_text}
            </h2>
            {settings.promo_banner_code && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-white/55">
                Pakai kode
                <code className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-400/45 bg-brand-500/10 px-2.5 py-1 font-mono text-[13.5px] font-bold tracking-wider text-brand-100">
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  {settings.promo_banner_code}
                </code>
                saat checkout.
              </p>
            )}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row">
            <Link href="/promo" className={buttonStyles("secondary", "lg", "w-full sm:w-auto")}>
              Lihat Semua Promo
            </Link>
            <Link href="/store" className={buttonStyles("primary", "lg", "w-full sm:w-auto")}>
              Belanja Sekarang
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
