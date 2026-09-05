import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/account/auth-form";
import { Skeleton } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Zynex Studio untuk melihat pesanan dan riwayat promo kamu.",
  alternates: { canonical: "/login" },
  robots: { index: true, follow: true },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[30rem] w-full max-w-md rounded-2xl" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
