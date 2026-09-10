import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Check, FileText, Sparkles, ShieldCheck, Clock } from "lucide-react";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { ProductShareButton } from "@/components/store/product-share-dialog";
import { ProductCard } from "@/components/store/product-card";
import { Accordion } from "@/components/ui/accordion";
import { GlassCard, Badge, SectionHeading } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { getProductBySlug, getRelatedProducts } from "@/services/catalog";
import { formatIDR } from "@/lib/utils";
import { env } from "@/lib/env";
import { BRAND } from "@/lib/constants";

/**
 * Rendered per request rather than prerendered.
 *
 * The storefront layout reads the session cookie to render the account menu,
 * and `cookies()` is incompatible with static/ISR generation — with
 * `generateStaticParams` here, on-demand ISR of an unknown slug threw
 * DYNAMIC_SERVER_USAGE and returned a 500 instead of a 404.
 *
 * Rendering dynamically costs almost nothing: every catalog read below goes
 * through `unstable_cache`, so the database is hit at most once per TTL and
 * is invalidated immediately when an admin edits a product.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Produk tidak ditemukan", robots: { index: false, follow: false } };
  }

  const description =
    product.short_description ||
    product.description?.slice(0, 155) ||
    `${product.name} tersedia di ${BRAND.name} dengan harga ${formatIDR(product.price)}.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/store/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} — ${BRAND.name}`,
      description,
      url: `/store/${product.slug}`,
      images: product.image_url ? [{ url: product.image_url, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${BRAND.name}`,
      description,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category_id, product.id, 4);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description ?? product.description ?? product.name,
    sku: product.id,
    category: product.category?.name,
    image: product.image_url ? [product.image_url] : undefined,
    brand: { "@type": "Brand", name: BRAND.name },
    offers: {
      "@type": "Offer",
      url: `${env.siteUrl}/store/${product.slug}`,
      priceCurrency: "IDR",
      price: product.price,
      availability: product.is_active
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: BRAND.name },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: env.siteUrl },
      { "@type": "ListItem", position: 2, name: "Store", item: `${env.siteUrl}/store` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${env.siteUrl}/store/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="container-page py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-7">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/45">
            <li>
              <Link href="/" className="transition-colors hover:text-white">
                Home
              </Link>
            </li>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <li>
              <Link href="/store" className="transition-colors hover:text-white">
                Store
              </Link>
            </li>
            {product.category && (
              <>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                <li>
                  <Link
                    href={`/store?category=${product.category.slug}`}
                    className="transition-colors hover:text-white"
                  >
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <li className="truncate font-medium text-white/75" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
          {/* Left column */}
          <div className="min-w-0">
            {/* Visual */}
            <GlassCard className="relative overflow-hidden rounded-3xl">
              <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden sm:aspect-[16/9]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-br from-brand-600/22 via-transparent to-accent-500/18"
                />
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="relative flex flex-col items-center gap-4">
                    <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/[0.07] ring-1 ring-white/12 backdrop-blur-xl">
                      <Icon name={product.icon} className="h-11 w-11 text-brand-200" />
                    </span>
                    <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/35">
                      {product.category?.name ?? "Digital Product"}
                    </span>
                  </div>
                )}

                {product.badge && (
                  <div className="absolute left-4 top-4 z-10">
                    <Badge tone="violet">{product.badge}</Badge>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Title block */}
            <header className="mt-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {product.category && <Badge tone="brand">{product.category.name}</Badge>}
                  {product.duration && (
                    <Badge tone="neutral">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {product.duration}
                    </Badge>
                  )}
                  {product.is_featured && <Badge tone="warning">Unggulan</Badge>}
                </div>
                <ProductShareButton product={product} />
              </div>

              <h1 className="mt-3.5 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {product.name}
              </h1>

              {product.short_description && (
                <p className="mt-3 text-pretty text-[15.5px] leading-relaxed text-white/60">
                  {product.short_description}
                </p>
              )}
            </header>

            {/* Description */}
            {product.description && (
              <section className="mt-8" aria-labelledby="desc-heading">
                <h2 id="desc-heading" className="text-lg font-semibold text-white">
                  Deskripsi
                </h2>
                <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed text-white/60">
                  {product.description.split("\n").filter(Boolean).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Features */}
            {product.features.length > 0 && (
              <section className="mt-8" aria-labelledby="features-heading">
                <h2
                  id="features-heading"
                  className="flex items-center gap-2 text-lg font-semibold text-white"
                >
                  <Sparkles className="h-4.5 w-4.5 text-brand-300" aria-hidden="true" />
                  Yang kamu dapatkan
                </h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {product.features.map((feature) => (
                    <li
                      key={feature}
                      className="glass flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[14px] text-white/70"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requirements */}
            {product.requirements.length > 0 && (
              <section className="mt-8" aria-labelledby="req-heading">
                <h2
                  id="req-heading"
                  className="flex items-center gap-2 text-lg font-semibold text-white"
                >
                  <FileText className="h-4.5 w-4.5 text-amber-300" aria-hidden="true" />
                  Data yang diperlukan
                </h2>
                <GlassCard solid className="mt-4 p-5">
                  <ul className="space-y-2.5">
                    {product.requirements.map((requirement, index) => (
                      <li key={requirement} className="flex items-start gap-3 text-[14px] text-white/70">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-400/12 text-[11px] font-bold text-amber-300">
                          {index + 1}
                        </span>
                        {requirement}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 flex items-start gap-2 border-t border-white/[0.08] pt-3.5 text-[12.5px] leading-relaxed text-white/40">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Data hanya digunakan untuk memproses pesanan kamu dan tidak dibagikan ke pihak
                    lain.
                  </p>
                </GlassCard>
              </section>
            )}

            {/* Product FAQ */}
            {product.faqs.length > 0 && (
              <section className="mt-8" aria-labelledby="pfaq-heading">
                <h2 id="pfaq-heading" className="text-lg font-semibold text-white">
                  FAQ Produk
                </h2>
                <Accordion
                  className="mt-4"
                  items={product.faqs.map((faq, index) => ({
                    id: `${product.id}-faq-${index}`,
                    question: faq.question,
                    answer: faq.answer,
                  }))}
                />
              </section>
            )}
          </div>

          {/* Right column — sticky purchase panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ProductPurchasePanel product={product} />
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16 sm:mt-20" aria-labelledby="related-heading">
            <SectionHeading
              align="left"
              eyebrow="Rekomendasi"
              title={<span id="related-heading">Produk terkait</span>}
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} compact />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
