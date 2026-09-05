import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Keranjang",
  description: "Tinjau produk digital di keranjang Zynex Studio sebelum checkout.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Keranjang</h1>
        <p className="mt-2 text-[15px] text-white/55">
          Cek kembali pesanan kamu, gunakan kode promo, lalu lanjut ke checkout.
        </p>
      </header>

      <CartView />
    </div>
  );
}
