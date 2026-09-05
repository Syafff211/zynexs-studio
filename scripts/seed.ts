/**
 * Zynex Studio — database seeder
 *
 *   npm run seed
 *
 * Idempotent: re-running updates existing rows instead of duplicating them.
 * Requires SUPABASE_SERVICE_ROLE_KEY (server-side only) in .env.local.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("\n✗ NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local\n");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CATEGORIES = [
  { name: "Domain", slug: "domain", icon: "Globe", sort_order: 1, description: "Domain murah untuk website dan personal branding." },
  { name: "AI", slug: "ai", icon: "Bot", sort_order: 2, description: "Akses tools AI premium dengan harga terjangkau." },
  { name: "Design", slug: "design", icon: "Palette", sort_order: 3, description: "Tools desain profesional untuk konten kreatif." },
  { name: "Social Media", slug: "social-media", icon: "Share2", sort_order: 4, description: "Layanan peningkatan performa sosial media." },
];

interface SeedProduct {
  name: string;
  slug: string;
  category: string;
  price: number;
  duration: string | null;
  icon: string;
  badge: string | null;
  short_description: string;
  description: string;
  features: string[];
  requirements: string[];
  faqs: { question: string; answer: string }[];
  is_featured: boolean;
  is_custom_price?: boolean;
  sort_order: number;
}

const PRODUCTS: SeedProduct[] = [
  {
    name: "Domain .my.id",
    slug: "domain-my-id",
    category: "domain",
    price: 5000,
    duration: "1 Tahun",
    icon: "Globe",
    badge: "Best Seller",
    short_description: "Domain personal Indonesia paling terjangkau, aktif penuh satu tahun.",
    description:
      "Domain .my.id adalah pilihan terbaik untuk personal branding, portofolio, blog, atau proyek pribadi. Cocok untuk pelajar, freelancer, dan kreator yang ingin punya alamat web sendiri tanpa biaya besar.\nProses registrasi cepat dan langsung bisa dipakai setelah konfirmasi pembayaran.",
    features: [
      "Aktif penuh selama 1 tahun",
      "Gratis DNS management",
      "Bisa dipakai untuk hosting apa pun",
      "Support setup Cloudflare",
      "Cocok untuk portofolio & blog",
    ],
    requirements: ["Nama domain yang diinginkan", "Email aktif untuk notifikasi", "Nomor WhatsApp aktif"],
    faqs: [
      { question: "Berapa lama proses aktivasinya?", answer: "Umumnya 5–30 menit setelah pembayaran dikonfirmasi admin." },
      { question: "Apakah bisa diperpanjang?", answer: "Bisa. Hubungi admin sebelum masa aktif berakhir untuk perpanjangan." },
      { question: "Apakah sudah termasuk hosting?", answer: "Belum. Produk ini khusus registrasi domain, namun bisa dihubungkan ke hosting mana pun." },
    ],
    is_featured: true,
    sort_order: 1,
  },
  {
    name: "Domain .web.id",
    slug: "domain-web-id",
    category: "domain",
    price: 5000,
    duration: "1 Tahun",
    icon: "Globe",
    badge: null,
    short_description: "Domain Indonesia untuk website komunitas, UMKM, dan proyek pribadi.",
    description:
      "Domain .web.id memberi identitas lokal yang kuat untuk website kamu. Cocok untuk komunitas, UMKM, organisasi kecil, maupun website pribadi yang ingin terlihat kredibel.",
    features: [
      "Aktif penuh selama 1 tahun",
      "Identitas domain Indonesia",
      "Gratis DNS management",
      "Cocok untuk UMKM & komunitas",
    ],
    requirements: ["Nama domain yang diinginkan", "Email aktif untuk notifikasi", "Nomor WhatsApp aktif"],
    faqs: [
      { question: "Apa bedanya dengan .my.id?", answer: ".web.id lebih cocok untuk website organisasi/komunitas, sedangkan .my.id lebih personal." },
      { question: "Perlu dokumen khusus?", answer: "Tidak. Cukup nama domain dan data kontak dasar." },
    ],
    is_featured: true,
    sort_order: 2,
  },
  {
    name: "Domain .biz.id",
    slug: "domain-biz-id",
    category: "domain",
    price: 5000,
    duration: "1 Tahun",
    icon: "Globe",
    badge: null,
    short_description: "Domain bisnis Indonesia dengan harga super hemat untuk toko online.",
    description:
      "Domain .biz.id dirancang untuk kebutuhan bisnis. Cocok untuk toko online, jasa, dan usaha kecil yang ingin tampil profesional dengan biaya minimal.",
    features: [
      "Aktif penuh selama 1 tahun",
      "Kesan bisnis yang profesional",
      "Gratis DNS management",
      "Cocok untuk toko online",
    ],
    requirements: ["Nama domain yang diinginkan", "Email aktif untuk notifikasi", "Nomor WhatsApp aktif"],
    faqs: [
      { question: "Cocok untuk toko online?", answer: "Sangat cocok. Ekstensi .biz.id memberi kesan bisnis yang serius." },
    ],
    is_featured: false,
    sort_order: 3,
  },
  {
    name: "Google AI Pro — Head",
    slug: "google-ai-pro-head",
    category: "ai",
    price: 30000,
    duration: "18 Bulan",
    icon: "Bot",
    badge: "Populer",
    short_description: "Akses Google AI Pro sebagai head account, aktif hingga 18 bulan.",
    description:
      "Paket Google AI Pro versi head account memberi kamu kontrol penuh atas akun. Nikmati fitur AI premium untuk produktivitas, riset, dan pembuatan konten selama 18 bulan.",
    features: [
      "Akses penuh Google AI Pro",
      "Masa aktif hingga 18 bulan",
      "Kontrol penuh sebagai head account",
      "Cocok untuk pelajar & profesional",
      "Panduan aktivasi dari admin",
    ],
    requirements: ["Email Google aktif", "Akun belum pernah berlangganan sebelumnya", "Nomor WhatsApp aktif"],
    faqs: [
      { question: "Apa bedanya head dan invite?", answer: "Head berarti kamu menjadi pemilik utama akun, sedangkan invite berarti kamu diundang ke dalam grup langganan." },
      { question: "Berapa lama proses aktivasinya?", answer: "Rata-rata 10–60 menit setelah data diterima admin." },
      { question: "Apakah bisa dipakai di banyak perangkat?", answer: "Bisa, selama masih dalam satu akun yang sama." },
    ],
    is_featured: true,
    sort_order: 4,
  },
  {
    name: "Google AI Pro — Invite",
    slug: "google-ai-pro-invite",
    category: "ai",
    price: 20000,
    duration: "18 Bulan",
    icon: "Bot",
    badge: "Hemat",
    short_description: "Opsi paling hemat untuk menikmati Google AI Pro selama 18 bulan.",
    description:
      "Paket invite cocok untuk kamu yang ingin biaya paling ringan. Kamu akan diundang ke dalam langganan Google AI Pro dan dapat menikmati fitur premium yang sama.",
    features: [
      "Akses fitur Google AI Pro",
      "Masa aktif hingga 18 bulan",
      "Harga paling hemat",
      "Proses undangan dibantu admin",
    ],
    requirements: ["Email Google aktif", "Bersedia menerima undangan langganan", "Nomor WhatsApp aktif"],
    faqs: [
      { question: "Apakah fiturnya sama dengan head?", answer: "Fitur AI yang bisa digunakan sama, perbedaannya hanya pada kepemilikan akun." },
      { question: "Apakah aman?", answer: "Aman. Kamu tetap memakai akun Google milikmu sendiri." },
    ],
    is_featured: true,
    sort_order: 5,
  },
  {
    name: "Canva Pro",
    slug: "canva-pro",
    category: "design",
    price: 2000,
    duration: "1 Bulan",
    icon: "Palette",
    badge: "Termurah",
    short_description: "Canva Pro sebulan penuh hanya Rp2.000 — desain tanpa batas.",
    description:
      "Buka semua fitur premium Canva: jutaan template, background remover, brand kit, dan penyimpanan besar. Cocok untuk pelajar, content creator, dan admin sosial media.",
    features: [
      "Akses semua template premium",
      "Background remover & Magic Studio",
      "Brand kit dan resize otomatis",
      "Penyimpanan cloud besar",
      "Aktif 1 bulan penuh",
    ],
    requirements: ["Email yang terdaftar di Canva", "Nomor WhatsApp aktif"],
    faqs: [
      { question: "Apakah pakai akun saya sendiri?", answer: "Ya, kamu tetap memakai akun Canva milikmu sendiri." },
      { question: "Bisa diperpanjang?", answer: "Bisa, tinggal pesan lagi sebelum masa aktif habis." },
      { question: "Berapa lama prosesnya?", answer: "Biasanya kurang dari 30 menit setelah konfirmasi." },
    ],
    is_featured: true,
    sort_order: 6,
  },
  {
    name: "Suntik All Sosmed",
    slug: "suntik-all-sosmed",
    category: "social-media",
    price: 0,
    duration: null,
    icon: "Share2",
    badge: "Custom",
    short_description: "Tingkatkan followers, likes, dan views untuk semua platform sosial media.",
    description:
      "Layanan peningkatan performa sosial media untuk Instagram, TikTok, YouTube, dan platform lainnya. Harga menyesuaikan platform, jumlah, dan jenis layanan yang kamu butuhkan.\nKonsultasikan kebutuhanmu dengan admin untuk mendapatkan penawaran terbaik.",
    features: [
      "Mendukung banyak platform",
      "Paket fleksibel sesuai kebutuhan",
      "Proses bertahap dan aman",
      "Konsultasi gratis dengan admin",
    ],
    requirements: ["Link profil atau postingan", "Platform yang dituju", "Jumlah yang diinginkan", "Nomor WhatsApp aktif"],
    faqs: [
      { question: "Kenapa harganya tidak ditampilkan?", answer: "Karena harga bergantung pada platform, jenis layanan, dan jumlah yang dipesan." },
      { question: "Apakah butuh password akun?", answer: "Tidak. Kami hanya membutuhkan link publik profil atau postingan." },
    ],
    is_featured: false,
    is_custom_price: true,
    sort_order: 7,
  },
];

const FAQS = [
  { question: "Bagaimana cara memesan di Zynex Studio?", answer: "Pilih produk, tambahkan ke keranjang, lalu klik checkout. Setelah order dibuat, kamu akan diarahkan ke WhatsApp admin untuk menyelesaikan pemesanan.", category: "Pemesanan", sort_order: 1 },
  { question: "Metode pembayaran apa saja yang tersedia?", answer: "Pembayaran dikonfirmasi melalui WhatsApp. Admin akan memberikan detail metode pembayaran yang tersedia saat kamu menghubungi kami.", category: "Pembayaran", sort_order: 2 },
  { question: "Berapa lama pesanan saya diproses?", answer: "Sebagian besar pesanan diproses dalam 5–60 menit setelah pembayaran dikonfirmasi. Produk tertentu bisa memerlukan waktu lebih lama.", category: "Pemesanan", sort_order: 3 },
  { question: "Bagaimana cara memakai kode promo?", answer: "Masukkan kode promo di halaman detail produk, keranjang, atau checkout, lalu klik Redeem. Diskon dihitung dan divalidasi langsung oleh server kami.", category: "Promo", sort_order: 4 },
  { question: "Apakah satu akun bisa memakai kode promo berkali-kali?", answer: "Tidak. Setiap akun hanya dapat menggunakan satu kode promo yang sama sebanyak satu kali. Kuota promo juga terbatas untuk seluruh pengguna.", category: "Promo", sort_order: 5 },
  { question: "Apakah produk digital bisa direfund?", answer: "Refund dipertimbangkan bila pesanan belum diproses atau produk tidak dapat kami kirimkan. Hubungi admin secepatnya bila ada kendala.", category: "Kebijakan", sort_order: 6 },
  { question: "Apakah data saya aman?", answer: "Ya. Data pesanan tersimpan aman di database kami dan hanya digunakan untuk memproses pesananmu.", category: "Kebijakan", sort_order: 7 },
  { question: "Apakah harus punya akun untuk memesan?", answer: "Tidak wajib, kamu bisa checkout sebagai guest. Namun dengan akun, seluruh riwayat pesanan dan promo tersimpan rapi.", category: "Umum", sort_order: 8 },
];

async function main() {
  console.log("\n🚀 Seeding Zynex Studio…\n");

  /* ---------------- Categories ---------------- */
  const categoryIds = new Map<string, string>();
  for (const category of CATEGORIES) {
    const { data, error } = await db
      .from("categories")
      .upsert({ ...category, is_active: true }, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (error) throw new Error(`categories: ${error.message}`);
    categoryIds.set(data.slug, data.id);
  }
  console.log(`✓ ${CATEGORIES.length} kategori`);

  /* ---------------- Products ---------------- */
  for (const product of PRODUCTS) {
    const { category, ...rest } = product;
    const { error } = await db.from("products").upsert(
      {
        ...rest,
        category_id: categoryIds.get(category) ?? null,
        is_active: true,
        is_custom_price: product.is_custom_price ?? false,
      },
      { onConflict: "slug" }
    );
    if (error) throw new Error(`products (${product.slug}): ${error.message}`);
  }
  console.log(`✓ ${PRODUCTS.length} produk`);

  /* ---------------- Promo codes ---------------- */
  const { data: existingPromo } = await db
    .from("promo_codes")
    .select("id")
    .eq("code", "PROMOZYN")
    .maybeSingle();

  if (!existingPromo) {
    const { error } = await db.from("promo_codes").insert([
      {
        code: "PROMOZYN",
        description: "Promo September — potongan Rp10.000 untuk semua produk digital.",
        discount_type: "fixed",
        discount_value: 10000,
        min_purchase: 20000,
        max_redemptions: 3,
        is_active: true,
      },
      {
        code: "ZYNEX20",
        description: "Diskon 20% (maks Rp15.000) untuk pembelian minimal Rp10.000.",
        discount_type: "percentage",
        discount_value: 20,
        max_discount: 15000,
        min_purchase: 10000,
        max_redemptions: 50,
        is_active: true,
      },
      {
        code: "HEMAT2K",
        description: "Potongan Rp2.000 tanpa minimum belanja.",
        discount_type: "fixed",
        discount_value: 2000,
        min_purchase: 0,
        max_redemptions: 100,
        is_active: true,
      },
    ]);
    if (error) throw new Error(`promo_codes: ${error.message}`);
    console.log("✓ 3 kode promo (PROMOZYN, ZYNEX20, HEMAT2K)");
  } else {
    console.log("• kode promo sudah ada, dilewati");
  }

  /* ---------------- FAQs ---------------- */
  const { count: faqCount } = await db.from("faqs").select("*", { count: "exact", head: true });
  if (!faqCount) {
    const { error } = await db.from("faqs").insert(FAQS.map((faq) => ({ ...faq, is_active: true })));
    if (error) throw new Error(`faqs: ${error.message}`);
    console.log(`✓ ${FAQS.length} FAQ`);
  } else {
    console.log("• FAQ sudah ada, dilewati");
  }

  /* ---------------- Announcement ---------------- */
  const { count: annCount } = await db
    .from("announcements")
    .select("*", { count: "exact", head: true });
  if (!annCount) {
    const { error } = await db.from("announcements").insert({
      message: "🔥 Promo September — Gunakan kode PROMOZYN!",
      link_url: "/promo",
      link_label: "Lihat Promo",
      variant: "promo",
      is_active: true,
    });
    if (error) throw new Error(`announcements: ${error.message}`);
    console.log("✓ 1 pengumuman");
  } else {
    console.log("• pengumuman sudah ada, dilewati");
  }

  /* ---------------- Site settings ---------------- */
  const { data: settings } = await db
    .from("site_settings")
    .select("key")
    .eq("key", "global")
    .maybeSingle();

  if (!settings) {
    const { error } = await db.from("site_settings").insert({ key: "global", value: {} });
    if (error) throw new Error(`site_settings: ${error.message}`);
    console.log("✓ site_settings (default)");
  } else {
    console.log("• site_settings sudah ada, dilewati");
  }

  /* ---------------- Optional: promote an admin ---------------- */
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (adminEmail) {
    const { data: profile } = await db
      .from("profiles")
      .select("id, email")
      .ilike("email", adminEmail)
      .maybeSingle();

    if (profile) {
      const { error } = await db.from("profiles").update({ role: "admin" }).eq("id", profile.id);
      if (error) throw new Error(`admin promote: ${error.message}`);
      console.log(`✓ ${adminEmail} dijadikan admin`);
    } else {
      console.log(`! ${adminEmail} belum terdaftar — daftar dulu di /register, lalu jalankan seed lagi`);
    }
  }

  console.log("\n✅ Seed selesai!\n");
  console.log("   Kode promo siap dipakai: PROMOZYN (Rp10.000 off, kuota 3)");
  console.log("   Jadikan akun admin: SEED_ADMIN_EMAIL=you@email.com npm run seed\n");
}

main().catch((error) => {
  console.error("\n✗ Seed gagal:", error instanceof Error ? error.message : error);
  console.error("  Pastikan supabase/schema.sql sudah dijalankan di SQL Editor.\n");
  process.exit(1);
});
