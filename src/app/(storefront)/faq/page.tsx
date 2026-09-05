import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, HelpCircle } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { EmptyState, GlassCard } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { getFaqs, getSiteSettings } from "@/services/catalog";
import { waLink } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQ — Pertanyaan yang Sering Diajukan",
  description:
    "Jawaban lengkap seputar pemesanan, pembayaran, promo, dan layanan digital Zynex Studio.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — Zynex Studio",
    description: "Pertanyaan yang sering diajukan seputar Zynex Studio.",
    url: "/faq",
  },
};

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([getFaqs(), getSiteSettings()]);

  const grouped = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
    (acc[faq.category] ??= []).push(faq);
    return acc;
  }, {});

  const jsonLd = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="container-page py-10 sm:py-14">
        <header className="mb-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
            <HelpCircle className="h-3 w-3" aria-hidden="true" />
            Pusat Bantuan
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Pertanyaan yang <span className="text-gradient">sering diajukan</span>
          </h1>
          <p className="mt-3 text-pretty text-[15px] leading-relaxed text-white/55">
            Semua yang perlu kamu tahu tentang pemesanan, promo, dan layanan Zynex Studio.
          </p>
        </header>

        {faqs.length ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
            <div className="space-y-10">
              {Object.entries(grouped).map(([category, list]) => (
                <section key={category} aria-labelledby={`faq-${category}`}>
                  <h2
                    id={`faq-${category}`}
                    className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-brand-300"
                  >
                    {category}
                  </h2>
                  <Accordion
                    items={list.map((faq) => ({
                      id: faq.id,
                      question: faq.question,
                      answer: faq.answer,
                    }))}
                  />
                </section>
              ))}
            </div>

            <aside className="lg:sticky lg:top-24">
              <GlassCard solid className="p-5 sm:p-6">
                <h2 className="text-[16px] font-semibold text-white">Masih ada pertanyaan?</h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">
                  Tim support Zynex Studio siap membantu kamu lewat WhatsApp, biasanya dibalas
                  kurang dari 5 menit.
                </p>
                <a
                  href={waLink(
                    settings.whatsapp_number,
                    "Halo Zynex Studio 👋 saya punya pertanyaan."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles("primary", "md", "mt-4 w-full")}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Chat Admin
                </a>
                <Link href="/store" className={buttonStyles("ghost", "md", "mt-2 w-full")}>
                  Lihat Katalog
                </Link>
              </GlassCard>
            </aside>
          </div>
        ) : (
          <EmptyState
            icon={<HelpCircle className="h-6 w-6" />}
            title="FAQ belum tersedia"
            description="Admin belum menambahkan pertanyaan. Hubungi kami langsung lewat WhatsApp."
            action={
              <a
                href={waLink(settings.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles("primary", "lg")}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Chat Admin
              </a>
            }
          />
        )}
      </div>
    </>
  );
}
