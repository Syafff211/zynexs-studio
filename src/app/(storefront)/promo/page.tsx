import type { Metadata } from "next";
import Link from "next/link";
import { Tag, Clock, Users, Sparkles, ArrowRight, Infinity as InfinityIcon } from "lucide-react";
import { GlassCard, Badge, EmptyState, SectionHeading } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { CopyCodeButton } from "@/components/store/copy-code-button";
import { getPublicPromos, getSiteSettings } from "@/services/catalog";
import { formatIDR, formatDate } from "@/lib/utils";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Promo & Kode Diskon",
  description:
    "Daftar kode promo aktif Zynex Studio. Hemat lebih banyak untuk domain, AI Pro, Canva Pro, dan layanan digital lainnya.",
  alternates: { canonical: "/promo" },
  openGraph: {
    title: "Promo & Kode Diskon — Zynex Studio",
    description: "Kode promo aktif untuk produk digital Zynex Studio.",
    url: "/promo",
  },
};

export default async function PromoPage() {
  const [promos, settings] = await Promise.all([getPublicPromos(), getSiteSettings()]);

  const available = promos.filter(
    (promo) => promo.max_redemptions === null || promo.redemption_count < promo.max_redemptions
  );

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-10 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Promo Aktif
        </span>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Kode promo <span className="text-gradient">Zynex Studio</span>
        </h1>
        <p className="mt-3 text-pretty text-[15px] leading-relaxed text-white/55">
          Salin kodenya, tempel saat checkout, dan hemat langsung. Setiap akun hanya bisa memakai
          satu kode promo sebanyak satu kali.
        </p>
      </header>

      {available.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((promo) => {
            const remaining =
              promo.max_redemptions === null
                ? null
                : Math.max(0, promo.max_redemptions - promo.redemption_count);
            const nearlyGone = remaining !== null && remaining <= 1;

            return (
              <li key={promo.code}>
                <GlassCard solid hover className="relative flex h-full flex-col overflow-hidden p-5">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/18 blur-2xl"
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-brand-500/18 text-violet-200 ring-1 ring-white/10">
                      <Tag className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {nearlyGone ? (
                      <Badge tone="danger">Hampir habis</Badge>
                    ) : (
                      <Badge tone="success">Tersedia</Badge>
                    )}
                  </div>

                  <p className="relative mt-4 text-2xl font-bold text-white">
                    {promo.discount_type === "percentage"
                      ? `${promo.discount_value}%`
                      : formatIDR(promo.discount_value)}
                    <span className="ml-1.5 text-[13px] font-medium text-white/45">OFF</span>
                  </p>

                  {promo.description && (
                    <p className="relative mt-1.5 text-[13.5px] leading-relaxed text-white/50">
                      {promo.description}
                    </p>
                  )}

                  <div className="relative mt-4">
                    <CopyCodeButton code={promo.code} />
                  </div>

                  <dl className="relative mt-4 space-y-2 border-t border-white/[0.08] pt-4 text-[12.5px]">
                    {promo.min_purchase > 0 && (
                      <div className="flex items-center justify-between">
                        <dt className="text-white/40">Min. belanja</dt>
                        <dd className="font-medium text-white/70">
                          {formatIDR(promo.min_purchase)}
                        </dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5 text-white/40">
                        <Users className="h-3 w-3" aria-hidden="true" />
                        Kuota
                      </dt>
                      <dd className="font-medium text-white/70">
                        {promo.max_redemptions === null ? (
                          <span className="inline-flex items-center gap-1">
                            <InfinityIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            Tanpa batas
                          </span>
                        ) : (
                          `${promo.redemption_count} / ${promo.max_redemptions} terpakai`
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5 text-white/40">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        Berlaku
                      </dt>
                      <dd className="font-medium text-white/70">
                        {promo.expires_at ? `s/d ${formatDate(promo.expires_at)}` : "Tanpa batas"}
                      </dd>
                    </div>
                  </dl>

                  {promo.max_redemptions !== null && (
                    <div className="relative mt-3.5">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-brand-500 transition-all"
                          style={{
                            width: `${Math.min(100, (promo.redemption_count / promo.max_redemptions) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </GlassCard>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={<Tag className="h-6 w-6" />}
          title="Belum ada promo aktif"
          description="Pantau terus halaman ini — promo baru bisa muncul kapan saja. Ikuti sosial media kami agar tidak ketinggalan."
          action={
            <Link href="/store" className={buttonStyles("primary", "lg")}>
              Lihat Katalog
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
      )}

      {/* Rules */}
      <section className="mt-16" aria-labelledby="promo-rules">
        <SectionHeading
          align="left"
          eyebrow="Syarat & Ketentuan"
          title={<span id="promo-rules">Aturan penggunaan promo</span>}
        />
        <GlassCard className="mt-6 p-5 sm:p-6">
          <ol className="space-y-3 text-[14px] leading-relaxed text-white/60">
            {[
              "Setiap kode promo memiliki batas jumlah penggunaan (kuota) yang berlaku untuk seluruh pengguna.",
              "Satu akun hanya dapat menggunakan kode promo yang sama sebanyak satu kali.",
              "Jika kuota promo sudah habis, kode otomatis tidak dapat digunakan lagi.",
              "Kode promo yang sudah kedaluwarsa atau dinonaktifkan admin tidak dapat digunakan.",
              "Validasi promo dilakukan sepenuhnya di server saat checkout untuk memastikan keadilan.",
              "Kode promo tidak dapat digabungkan dengan kode promo lain dalam satu pesanan.",
            ].map((rule, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md bg-brand-500/15 text-[11px] font-bold text-brand-200">
                  {index + 1}
                </span>
                {rule}
              </li>
            ))}
          </ol>
        </GlassCard>
      </section>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/store" className={buttonStyles("primary", "lg", "w-full sm:w-auto")}>
          Belanja &amp; Pakai Promo
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <a
          href={`https://wa.me/${settings.whatsapp_number}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles("secondary", "lg", "w-full sm:w-auto")}
        >
          Tanya Admin
        </a>
      </div>
    </div>
  );
}
