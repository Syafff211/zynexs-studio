"use client";

import * as React from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Search,
  Upload,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, Badge, EmptyState } from "@/components/ui/card";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";
import {
  saveProductAction,
  deleteProductAction,
  toggleProductActiveAction,
  toggleProductFeaturedAction,
  saveCategoryAction,
  deleteCategoryAction,
} from "@/actions/admin";
import { uploadImageAction } from "@/actions/upload";
import { cn, formatIDR, slugify } from "@/lib/utils";
import type { Category, ProductWithCategory } from "@/types";

export function ProductManager({
  products,
  categories,
}: {
  products: ProductWithCategory[];
  categories: Category[];
}) {
  const { success, error: toastError } = useToast();
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<ProductWithCategory | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<ProductWithCategory | null>(null);
  const [categoryModal, setCategoryModal] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const filtered = products.filter((product) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      product.name.toLowerCase().includes(needle) ||
      product.slug.includes(needle) ||
      (product.category?.name ?? "").toLowerCase().includes(needle)
    );
  });

  const runToggle = async (fn: () => Promise<{ ok: boolean; message: string }>, id: string) => {
    setPendingId(id);
    const result = await fn();
    if (result.ok) success(result.message);
    else toastError("Gagal", result.message);
    setPendingId(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    const result = await deleteProductAction(deleting.id);
    if (result.ok) success(result.message);
    else toastError("Gagal", result.message);
    setBusy(false);
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Produk</h1>
          <p className="mt-1.5 text-[14.5px] text-white/50">
            {products.length} produk · {products.filter((p) => p.is_active).length} aktif
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setCategoryModal(true)}>
            Kelola Kategori
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Produk Baru
          </Button>
        </div>
      </header>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari produk berdasarkan nama, slug, atau kategori…"
          aria-label="Cari produk"
          className="pl-10"
        />
      </div>

      {filtered.length ? (
        <>
          {/* Desktop table */}
          <GlassCard solid className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[12px] uppercase tracking-wider text-white/45">
                    <th scope="col" className="px-4 py-3 font-medium">Produk</th>
                    <th scope="col" className="px-4 py-3 font-medium">Kategori</th>
                    <th scope="col" className="px-4 py-3 font-medium">Harga</th>
                    <th scope="col" className="px-4 py-3 font-medium">Durasi</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filtered.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt=""
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            ) : (
                              <Icon name={product.icon} className="h-4 w-4 text-brand-200" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">{product.name}</p>
                            <p className="truncate text-[12px] text-white/35">/{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/60">{product.category?.name ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-white">
                        {product.is_custom_price ? "Custom" : formatIDR(product.price)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-white/55">
                        {product.duration ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone={product.is_active ? "success" : "neutral"}>
                            {product.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                          {product.is_featured && <Badge tone="warning">Featured</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconAction
                            label={product.is_featured ? "Hapus dari unggulan" : "Jadikan unggulan"}
                            onClick={() =>
                              runToggle(
                                () =>
                                  toggleProductFeaturedAction(product.id, !product.is_featured),
                                product.id
                              )
                            }
                            disabled={pendingId === product.id}
                            active={product.is_featured}
                          >
                            <Star
                              className={cn("h-4 w-4", product.is_featured && "fill-current")}
                            />
                          </IconAction>
                          <IconAction
                            label={product.is_active ? "Nonaktifkan" : "Aktifkan"}
                            onClick={() =>
                              runToggle(
                                () => toggleProductActiveAction(product.id, !product.is_active),
                                product.id
                              )
                            }
                            disabled={pendingId === product.id}
                          >
                            {product.is_active ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </IconAction>
                          <IconAction label="Edit produk" onClick={() => setEditing(product)}>
                            <Pencil className="h-4 w-4" />
                          </IconAction>
                          <IconAction
                            label="Hapus produk"
                            danger
                            onClick={() => setDeleting(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden">
            {filtered.map((product) => (
              <li key={product.id}>
                <GlassCard solid className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-white/10">
                      {product.image_url ? (
                        <Image src={product.image_url} alt="" fill sizes="44px" className="object-cover" />
                      ) : (
                        <Icon name={product.icon} className="h-5 w-5 text-brand-200" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-white">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-white/45">
                        {product.category?.name ?? "Tanpa kategori"}
                        {product.duration ? ` · ${product.duration}` : ""}
                      </p>
                      <p className="mt-1.5 text-[15px] font-bold text-white">
                        {product.is_custom_price ? "Custom" : formatIDR(product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone={product.is_active ? "success" : "neutral"}>
                      {product.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                    {product.is_featured && <Badge tone="warning">Featured</Badge>}
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-1.5 border-t border-white/[0.07] pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        runToggle(
                          () => toggleProductFeaturedAction(product.id, !product.is_featured),
                          product.id
                        )
                      }
                      aria-label="Toggle unggulan"
                    >
                      <Star className={cn("h-4 w-4", product.is_featured && "fill-current")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        runToggle(
                          () => toggleProductActiveAction(product.id, !product.is_active),
                          product.id
                        )
                      }
                      aria-label="Toggle aktif"
                    >
                      {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(product)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(product)}
                      aria-label="Hapus"
                      className="text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </GlassCard>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title={query ? "Produk tidak ditemukan" : "Belum ada produk"}
          description={
            query
              ? "Coba kata kunci lain."
              : "Tambahkan produk pertama kamu atau jalankan npm run seed."
          }
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Produk Baru
            </Button>
          }
        />
      )}

      {(creating || editing) && (
        <ProductFormModal
          product={editing}
          categories={categories}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {categoryModal && (
        <CategoryModal categories={categories} onClose={() => setCategoryModal(false)} />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        destructive
        title="Hapus produk?"
        description={`"${deleting?.name}" akan dihapus permanen. Riwayat order lama tetap menyimpan snapshot nama & harga.`}
        confirmLabel="Ya, hapus"
      />
    </div>
  );
}

function IconAction({
  children,
  label,
  onClick,
  danger,
  active,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "rounded-lg p-2 transition-colors disabled:opacity-40",
        danger
          ? "text-white/40 hover:bg-rose-500/12 hover:text-rose-300"
          : active
            ? "text-amber-300 hover:bg-amber-500/12"
            : "text-white/40 hover:bg-white/[0.08] hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */

function ProductFormModal({
  product,
  categories,
  onClose,
}: {
  product: ProductWithCategory | null;
  categories: Category[];
  onClose: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState(product?.image_url ?? "");
  const [name, setName] = React.useState(product?.name ?? "");
  const [slug, setSlug] = React.useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(product));
  const formRef = React.useRef<HTMLFormElement>(null);

  // Auto-derive the slug from the name until the admin edits it manually.
  const onNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const formData = new FormData(event.currentTarget);
    formData.set("imageUrl", imageUrl);
    const result = await saveProductAction(null, formData);
    if (result.ok) {
      success(result.message);
      onClose();
    } else {
      toastError("Gagal", result.message);
    }
    setSaving(false);
  };

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("bucket", "product-images");
    const result = await uploadImageAction(formData);
    if (result.ok && result.url) {
      setImageUrl(result.url);
      success("Gambar terupload");
    } else {
      toastError("Gagal upload", result.message);
    }
    setUploading(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={product ? "Edit Produk" : "Produk Baru"}
      description="Semua perubahan tersimpan langsung ke Supabase."
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="button" loading={saving} onClick={() => formRef.current?.requestSubmit()}>
            {product ? "Simpan Perubahan" : "Buat Produk"}
          </Button>
        </>
      }
    >
      <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        {product && <input type="hidden" name="id" value={product.id} />}

        <Field label="Nama Produk" htmlFor="p-name" required>
          <Input
            id="p-name"
            name="name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
            minLength={2}
          />
        </Field>

        <Field label="Slug" htmlFor="p-slug" required hint="URL: /store/slug">
          <Input
            id="p-slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            required
            pattern="[a-z0-9\-]+"
          />
        </Field>

        <Field label="Deskripsi Singkat" htmlFor="p-short" className="sm:col-span-2" hint="Maksimal 200 karakter, tampil di kartu produk">
          <Input
            id="p-short"
            name="shortDescription"
            defaultValue={product?.short_description ?? ""}
            maxLength={200}
          />
        </Field>

        <Field label="Deskripsi Lengkap" htmlFor="p-desc" className="sm:col-span-2">
          <Textarea
            id="p-desc"
            name="description"
            defaultValue={product?.description ?? ""}
            rows={4}
          />
        </Field>

        <Field label="Kategori" htmlFor="p-cat">
          <Select id="p-cat" name="categoryId" defaultValue={product?.category_id ?? ""}>
            <option value="" className="bg-ink-900">Tanpa kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="bg-ink-900">
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Durasi" htmlFor="p-duration" hint="Contoh: 1 Tahun, 18 Bulan">
          <Input id="p-duration" name="duration" defaultValue={product?.duration ?? ""} />
        </Field>

        <Field label="Harga (Rp)" htmlFor="p-price" required>
          <Input
            id="p-price"
            name="price"
            type="number"
            min={0}
            step={500}
            defaultValue={product?.price ?? 0}
            required
          />
        </Field>

        <Field label="Harga Coret (Rp)" htmlFor="p-compare" hint="Kosongkan jika tidak ada">
          <Input
            id="p-compare"
            name="compareAtPrice"
            type="number"
            min={0}
            step={500}
            defaultValue={product?.compare_at_price ?? ""}
          />
        </Field>

        <Field label="Badge" htmlFor="p-badge" hint="Contoh: Best Seller, Promo">
          <Input id="p-badge" name="badge" defaultValue={product?.badge ?? ""} maxLength={40} />
        </Field>

        <Field label="Icon (Lucide)" htmlFor="p-icon" hint="Globe, Bot, Palette, Share2…">
          <Input id="p-icon" name="icon" defaultValue={product?.icon ?? ""} maxLength={60} />
        </Field>

        <Field
          label="Fitur"
          htmlFor="p-features"
          className="sm:col-span-2"
          hint="Satu fitur per baris"
        >
          <Textarea
            id="p-features"
            name="features"
            defaultValue={(product?.features ?? []).join("\n")}
            rows={4}
            placeholder={"Aktif 1 tahun penuh\nGratis DNS management"}
          />
        </Field>

        <Field
          label="Data yang Diperlukan"
          htmlFor="p-req"
          className="sm:col-span-2"
          hint="Satu item per baris"
        >
          <Textarea
            id="p-req"
            name="requirements"
            defaultValue={(product?.requirements ?? []).join("\n")}
            rows={3}
            placeholder={"Nama domain yang diinginkan\nEmail aktif"}
          />
        </Field>

        <Field
          label="FAQ Produk"
          htmlFor="p-faqs"
          className="sm:col-span-2"
          hint="Format per baris: Pertanyaan | Jawaban"
        >
          <Textarea
            id="p-faqs"
            name="faqs"
            defaultValue={(product?.faqs ?? [])
              .map((faq) => `${faq.question} | ${faq.answer}`)
              .join("\n")}
            rows={3}
            placeholder="Berapa lama prosesnya? | Umumnya 5–30 menit setelah konfirmasi."
          />
        </Field>

        {/* Image */}
        <div className="sm:col-span-2">
          <p className="mb-2 block text-[13px] font-medium text-white/70">Gambar Produk</p>
          <div className="flex flex-wrap items-center gap-3">
            {imageUrl ? (
              <span className="relative h-16 w-16 overflow-hidden rounded-xl ring-1 ring-white/12">
                <Image src={imageUrl} alt="Pratinjau" fill sizes="64px" className="object-cover" />
              </span>
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/[0.06] text-white/30 ring-1 ring-white/10">
                <Package className="h-6 w-6" aria-hidden="true" />
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              <label
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/12 bg-white/[0.07] px-4 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/[0.12]",
                  uploading && "pointer-events-none opacity-60"
                )}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {uploading ? "Mengupload…" : "Upload Gambar"}
                <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
              </label>
              {imageUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl("")}>
                  Hapus gambar
                </Button>
              )}
            </div>
          </div>
          <Input
            className="mt-2.5"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="atau tempel URL gambar…"
            aria-label="URL gambar produk"
          />
        </div>

        <Field label="Urutan Tampil" htmlFor="p-sort" hint="Angka lebih kecil tampil lebih dulu">
          <Input
            id="p-sort"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={product?.sort_order ?? 0}
          />
        </Field>

        <div className="flex flex-col justify-end gap-2.5 pb-1">
          <Checkbox name="isActive" label="Produk aktif" defaultChecked={product?.is_active ?? true} />
          <Checkbox
            name="isFeatured"
            label="Tampilkan sebagai unggulan"
            defaultChecked={product?.is_featured ?? false}
          />
          <Checkbox
            name="isCustomPrice"
            label="Harga dikelola admin (custom)"
            defaultChecked={product?.is_custom_price ?? false}
          />
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

function CategoryModal({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [removing, setRemoving] = React.useState<Category | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = event.currentTarget;
    const result = await saveCategoryAction(null, new FormData(form));
    if (result.ok) {
      success(result.message);
      form.reset();
      setName("");
    } else {
      toastError("Gagal", result.message);
    }
    setSaving(false);
  };

  return (
    <>
      <Modal open onClose={onClose} title="Kelola Kategori" size="lg">
        <ul className="mb-5 space-y-2">
          {categories.length ? (
            categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-white">{category.name}</p>
                  <p className="truncate text-[12px] text-white/40">/{category.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRemoving(category)}
                  aria-label={`Hapus kategori ${category.name}`}
                  className="shrink-0 rounded-lg p-1.5 text-white/35 transition-colors hover:bg-rose-500/12 hover:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))
          ) : (
            <li className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-[13.5px] text-white/40">
              Belum ada kategori.
            </li>
          )}
        </ul>

        <form onSubmit={onSubmit} className="grid gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-2">
          <Field label="Nama Kategori" htmlFor="c-name" required>
            <Input
              id="c-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
            />
          </Field>
          <Field label="Slug" htmlFor="c-slug" required>
            <Input id="c-slug" name="slug" value={slugify(name)} readOnly required />
          </Field>
          <Field label="Icon (Lucide)" htmlFor="c-icon">
            <Input id="c-icon" name="icon" placeholder="Globe" />
          </Field>
          <Field label="Urutan" htmlFor="c-sort">
            <Input id="c-sort" name="sortOrder" type="number" min={0} defaultValue={0} />
          </Field>
          <div className="sm:col-span-2">
            <Checkbox name="isActive" label="Kategori aktif" defaultChecked />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah Kategori
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          const result = await deleteCategoryAction(removing.id);
          if (result.ok) success(result.message);
          else toastError("Gagal", result.message);
          setRemoving(null);
        }}
        destructive
        title="Hapus kategori?"
        description={`Produk pada kategori "${removing?.name}" akan menjadi tanpa kategori.`}
        confirmLabel="Ya, hapus"
      />
    </>
  );
}
