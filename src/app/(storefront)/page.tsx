import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { Benefits, HowToOrder, PromoBanner } from "@/components/home/sections";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading, EmptyState, GlassCard } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { buttonStyles } from "@/components/ui/button";
import { getFeaturedProducts, getSiteSettings, getFaqs, getProducts } from "@/services/catalog";
import { waLink } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import { env } from "@/lib/env";

export const revalidate = 60;

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [settings, featured, faqs, allProducts] = await Promise.all([
    getSiteSettings(),
    getFeaturedProducts(6),
    getFaqs(),
    getProducts(),
  ]);

  const homeFaqs = faqs.slice(0, 6);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: BRAND.name,
    description: BRAND.description,
    url: env.siteUrl,
    slogan: BRAND.tagline,
    areaServed: "ID",
    currenciesAccepted: "IDR",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: `+${settings.whatsapp_number}`,
      email: settings.support_email,
      availableLanguage: ["id", "en"],
    },
    sameAs: settings.social_links.map((social) => social.url),
  };

  const faqJsonLd = homeFaqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: homeFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <Hero settings={settings} products={featured} />

      <Benefits benefits={settings.benefits} />

      {/* Featured products */}
      <section className="container-page py-16 sm:py-20" aria-labelledby="featured-heading">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Produk Populer"
            title={<span id="featured-heading">Paling banyak dipesan</span>}
            description="Produk digital pilihan dengan harga terbaik dan proses tercepat."
            className="max-w-xl"
          />
          <Link
            href="/store"
            className={buttonStyles("secondary", "md", "shrink-0 whitespace-nowrap")}
          >
            Lihat Semua Produk
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {featured.length ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">
            {featured.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="Katalog masih kosong"
            description="Tambahkan produk dari Admin Panel atau jalankan npm run seed untuk mengisi data awal."
            action={
              <Link href="/admin/products" className={buttonStyles("primary", "md")}>
                Buka Admin Panel
              </Link>
            }
          />
        )}
      </section>

      <PromoBanner settings={settings} />

      <HowToOrder />

      {/* FAQ preview */}
      {homeFaqs.length > 0 && (
        <section className="container-page py-16 sm:py-20" aria-labelledby="faq-heading">
          <SectionHeading
            eyebrow="FAQ"
            title={<span id="faq-heading">Pertanyaan yang sering muncul</span>}
            description="Belum ketemu jawabannya? Chat admin kami langsung lewat WhatsApp."
          />
          <div className="mx-auto mt-10 max-w-3xl">
            <Accordion
              items={homeFaqs.map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
              }))}
              defaultOpenId={homeFaqs[0]?.id}
            />
            <div className="mt-6 text-center">
              <Link href="/faq" className={buttonStyles("ghost", "md")}>
                Lihat semua FAQ
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="container-page pb-8 pt-6 sm:pb-16">
        <GlassCard solid className="relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-72 w-[36rem] max-w-full rounded-full bg-brand-500/20 blur-[100px]"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Siap mulai dengan <span className="text-gradient">Zynex Studio</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-[15px] leading-relaxed text-white/55">
              {allProducts.length > 0
                ? `${allProducts.length} produk digital siap dipesan hari ini. Proses cepat, harga terjangkau, dukungan penuh.`
                : "Produk digital siap dipesan. Proses cepat, harga terjangkau, dukungan penuh."}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/store" className={buttonStyles("primary", "lg", "w-full sm:w-auto")}>
                Belanja Sekarang
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={waLink(
                  settings.whatsapp_number,
                  "Halo Zynex Studio 👋 saya ingin bertanya tentang produk digital."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles("secondary", "lg", "w-full sm:w-auto")}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Chat Admin
              </a>
            </div>
          </div>
        </GlassCard>
      </section>
    </>
  );
}
