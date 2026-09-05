"use server";

import { createAdminClient, requireAdmin, getSessionUser, createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif", "image/svg+xml"];

export interface UploadResult {
  ok: boolean;
  message: string;
  url?: string;
}

function validate(file: File | null): string | null {
  if (!file || file.size === 0) return "Pilih file gambar terlebih dahulu.";
  if (file.size > MAX_BYTES) return "Ukuran gambar maksimal 4 MB.";
  if (!ALLOWED.includes(file.type)) return "Format harus PNG, JPG, WEBP, AVIF, GIF, atau SVG.";
  return null;
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return file.type.split("/")[1] ?? "png";
}

/** Admin-only upload for product images and landing page assets. */
export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: "Akses ditolak." };
  }

  const file = formData.get("file") as File | null;
  const bucket = String(formData.get("bucket") ?? "product-images");
  const invalid = validate(file);
  if (invalid || !file) return { ok: false, message: invalid ?? "File tidak valid." };
  if (!["product-images", "site-assets"].includes(bucket)) {
    return { ok: false, message: "Bucket tidak diizinkan." };
  }

  const admin = createAdminClient();
  const name = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, "")) || "image"}.${extensionFor(file)}`;

  const { error } = await admin.storage
    .from(bucket)
    .upload(name, file, { cacheControl: "31536000", upsert: false, contentType: file.type });

  if (error) return { ok: false, message: `Gagal upload: ${error.message}` };

  const { data } = admin.storage.from(bucket).getPublicUrl(name);
  return { ok: true, message: "Gambar berhasil diupload.", url: data.publicUrl };
}

/** Users upload their own avatar into a folder named after their user id. */
export async function uploadAvatarAction(formData: FormData): Promise<UploadResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Kamu harus login terlebih dahulu." };

  const file = formData.get("file") as File | null;
  const invalid = validate(file);
  if (invalid || !file) return { ok: false, message: invalid ?? "File tidak valid." };

  const supabase = await createClient();
  const path = `${user.id}/avatar-${Date.now()}.${extensionFor(file)}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });

  if (error) return { ok: false, message: `Gagal upload: ${error.message}` };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);

  return { ok: true, message: "Foto profil diperbarui.", url: data.publicUrl };
}
