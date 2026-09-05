import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/account/auth-form";
import { Skeleton } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun Zynex Studio gratis untuk checkout lebih cepat dan riwayat tersimpan.",
  alternates: { canonical: "/register" },
  robots: { index: true, follow: true },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[34rem] w-full max-w-md rounded-2xl" />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
