import type { Metadata } from "next";
import { CheckoutView } from "@/components/cart/checkout-view";
import { getProfile } from "@/lib/supabase/server";
import { isStaticQrisConfigured } from "@/lib/qris";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Buat order dan selesaikan pembayaran Zynex Studio melalui QRIS.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};

export default async function CheckoutPage() {
  const profile = await getProfile();
  const qrisConfigured = isStaticQrisConfigured();

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Checkout</h1>
        <p className="mt-2 text-[15px] text-white/55">
          Isi data pemesan, buat order, lalu bayar melalui QRIS statis DANA Bisnis.
        </p>
      </header>

      <CheckoutView profile={profile} qrisConfigured={qrisConfigured} />
    </div>
  );
}
