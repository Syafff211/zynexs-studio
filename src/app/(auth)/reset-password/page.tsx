import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Atur password baru untuk akun Zynex Studio kamu.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const errorDescription =
    typeof params.error_description === "string" ? params.error_description : undefined;

  return (
    <div className="w-full max-w-md">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Atur Password Baru</h1>
        <p className="mt-2 text-[14px] text-white/55">
          Buat password baru untuk akun Zynex Studio kamu.
        </p>
      </header>
      <ResetPasswordForm
        urlError={error}
        urlErrorDescription={errorDescription?.replace(/\+/g, " ")}
      />
    </div>
  );
}
