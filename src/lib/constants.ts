import type { OrderStatus, PromoStatus, SiteSettings } from "@/types";

export const WHATSAPP_NUMBER = "6285141308100";

export const BRAND = {
  name: "Zynex Studio",
  tagline: "Premium Digital Products & Services",
  description:
    "Zynex Studio menyediakan domain murah, AI Pro, Canva Pro, dan berbagai layanan digital dengan proses cepat dan mudah.",
} as const;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Menunggu",
  paid: "Dibayar",
  processing: "Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Refund",
};

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  paid: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
  processing: "bg-violet-400/10 text-violet-300 ring-violet-400/30",
  completed: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
  cancelled: "bg-rose-400/10 text-rose-300 ring-rose-400/30",
  refunded: "bg-slate-400/10 text-slate-300 ring-slate-400/30",
};

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "completed",
  "cancelled",
  "refunded",
];

export const PROMO_MESSAGES: Record<PromoStatus, string> = {
  valid: "✓ Kode promo berhasil digunakan",
  invalid: "Kode promo tidak valid.",
  already_used: "Kamu sudah pernah menggunakan kode promo ini.",
  limit_reached: "Kode promo sudah mencapai batas penggunaan.",
  expired: "Kode promo sudah expired.",
  inactive: "Kode promo tidak aktif.",
  min_purchase: "Total belanja belum memenuhi minimum penggunaan promo.",
};

export const CART_STORAGE_KEY = "zynex.cart.v1";
export const PROMO_STORAGE_KEY = "zynex.promo.v1";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  hero_badge: "Premium Digital Products & Services",
  hero_title: "Digital Product & Services,",
  hero_highlight: "Simple. Fast. Affordable.",
  hero_subtitle:
    "Temukan domain, AI Pro, Canva Pro, dan berbagai layanan digital dalam satu platform.",
  hero_cta_label: "Belanja Sekarang",
  hero_cta_href: "/store",
  hero_secondary_label: "Lihat Promo",
  hero_secondary_href: "/promo",
  promo_banner_enabled: true,
  promo_banner_title: "Promo September",
  promo_banner_text: "Hemat lebih banyak dengan kode promo aktif bulan ini.",
  promo_banner_code: "PROMOZYN",
  benefits: [
    {
      icon: "Wallet",
      title: "Harga Terjangkau",
      description: "Mulai dari Rp2.000 saja. Harga jujur tanpa biaya tersembunyi.",
    },
    {
      icon: "Zap",
      title: "Proses Cepat",
      description: "Pesanan diproses cepat setelah konfirmasi via WhatsApp.",
    },
    {
      icon: "Sparkles",
      title: "Produk Digital",
      description: "Domain, AI Pro, Canva Pro, hingga layanan sosial media.",
    },
    {
      icon: "Headphones",
      title: "Support Customer",
      description: "Tim support siap membantu lewat WhatsApp setiap hari.",
    },
    {
      icon: "MousePointerClick",
      title: "Pemesanan Mudah",
      description: "Pilih produk, checkout, lanjut WhatsApp. Sesederhana itu.",
    },
    {
      icon: "ShieldCheck",
      title: "Aman & Terpercaya",
      description: "Data pesanan tersimpan aman dengan riwayat yang transparan.",
    },
  ],
  stats: [
    { label: "Produk Digital", value: "7+" },
    { label: "Pesanan Diproses", value: "1.2K+" },
    { label: "Rating Pelanggan", value: "4.9/5" },
    { label: "Respon Support", value: "< 5 mnt" },
  ],
  footer_description:
    "Zynex Studio adalah digital store premium untuk domain, akun AI, tools desain, dan layanan sosial media.",
  footer_copyright: "Zynex Studio. All rights reserved.",
  whatsapp_number: WHATSAPP_NUMBER,
  support_email: "support@zynexstudio.id",
  social_links: [
    { label: "WhatsApp", url: `https://wa.me/${WHATSAPP_NUMBER}`, icon: "MessageCircle" },
    { label: "Instagram", url: "https://instagram.com/zynexstudio", icon: "Instagram" },
    { label: "TikTok", url: "https://tiktok.com/@zynexstudio", icon: "Music2" },
  ],
};

export const HOW_TO_ORDER_STEPS = [
  {
    title: "Pilih Produk",
    description: "Telusuri katalog Zynex Studio dan pilih produk digital yang kamu butuhkan.",
  },
  {
    title: "Masukkan Keranjang",
    description: "Atur jumlah pesanan, lalu gunakan kode promo bila kamu punya.",
  },
  {
    title: "Checkout",
    description: "Isi nama, email, dan nomor WhatsApp. Server akan membuat order resmi.",
  },
  {
    title: "Lanjut via WhatsApp",
    description: "Kirim detail order ke admin, selesaikan pembayaran, pesanan diproses.",
  },
] as const;

/**
 * Cache tags for `unstable_cache`d catalog/CMS reads. Admin mutations call
 * `revalidateTag(...)` with these so edits appear immediately instead of
 * waiting for the TTL to lapse.
 */
export const CACHE_TAGS = {
  products: "catalog:products",
  categories: "catalog:categories",
  settings: "cms:settings",
  faqs: "cms:faqs",
  announcements: "cms:announcements",
  promos: "catalog:promos",
} as const;
