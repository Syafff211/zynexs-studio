import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaymentView } from "@/components/payment/payment-view";
import { isStaticQrisConfigured } from "@/lib/qris";
import { waLink } from "@/lib/utils";
import { getSiteSettings } from "@/services/catalog";
import { getPaymentOrderView } from "@/services/payment";

export const metadata: Metadata = {
  title: "Pembayaran QRIS",
  description: "Detail pembayaran dan status verifikasi order Zynex Studio.",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const rawAccess = query.access;
  const accessToken = typeof rawAccess === "string" ? rawAccess : "";

  const [payment, settings] = await Promise.all([
    getPaymentOrderView(orderId, accessToken),
    getSiteSettings(),
  ]);
  if (!payment) notFound();

  const helpUrl = waLink(
    settings.whatsapp_number,
    `Halo Zynex Studio, saya membutuhkan bantuan untuk pembayaran order ${payment.order.order_number}.`
  );

  return (
    <div className="container-page py-8 sm:py-12">
      <PaymentView
        initialOrder={payment.order}
        accessToken={accessToken}
        canUseRealtime={payment.canUseRealtime}
        qrisConfigured={isStaticQrisConfigured()}
        helpUrl={helpUrl}
      />
    </div>
  );
}
