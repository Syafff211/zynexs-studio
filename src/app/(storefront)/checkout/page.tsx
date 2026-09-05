import type { Metadata } from "next";
import { CheckoutView } from "@/components/cart/checkout-view";
import { getProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Selesaikan pesanan Zynex Studio melalui WhatsApp.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};

export default async function CheckoutPage() {
  const profile = await getProfile();

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Checkout</h1>
        <p className="mt-2 text-[15px] text-white/55">
          Isi data pemesan, lalu lanjutkan pesanan kamu lewat WhatsApp.
        </p>
      </header>

      <CheckoutView profile={profile} />
    </div>
  );
}
