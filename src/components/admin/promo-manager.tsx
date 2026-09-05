"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  Users,
  Clock,
  Infinity as InfinityIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, Badge, EmptyState } from "@/components/ui/card";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Field, Input, Select, Checkbox } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { savePromoAction, deletePromoAction, togglePromoActiveAction } from "@/actions/admin";
import { cn, formatIDR, formatDate, formatDateTime } from "@/lib/utils";
import type { PromoCode } from "@/types";

export interface RedemptionRow {
  id: string;
  promo_id: string;
  redeemed_at: string;
  amount: number;
  guest_email: string | null;
  user: { full_name: string | null; email: string | null } | null;
  order: { order_number: string } | null;
}

function promoState(promo: PromoCode) {
  const expired = promo.expires_at ? new Date(promo.expires_at) <= new Date() : false;
  const full =
    promo.max_redemptions !== null && promo.redemption_count >= promo.max_redemptions;

  if (!promo.is_active) return { label: "NONAKTIF", tone: "neutral" as const };
  if (expired) return { label: "EXPIRED", tone: "danger" as const };
  if (full) return { label: "FULL", tone: "danger" as const };
  return { label: "AKTIF", tone: "success" as const };
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function PromoManager({
  promos,
  redemptions,
}: {
  promos: PromoCode[];
  redemptions: RedemptionRow[];
}) {
  const { success, error: toastError } = useToast();
  const [editing, setEditing] = React.useState<PromoCode | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<PromoCode | null>(null);
  const [viewing, setViewing] = React.useState<PromoCode | null>(null);
  const [busy, setBusy] = React.useState(false);

  const toggle = async (promo: PromoCode) => {
    const result = await togglePromoActiveAction(promo.id, !promo.is_active);
    if (result.ok) success(result.message);
    else toastError("Gagal", result.message);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    const result = await deletePromoAction(deleting.id);
    if (result.ok) success(result.message);
    else toastError("Gagal", result.message);
    setBusy(false);
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Promo</h1>
          <p className="mt-1.5 text-[14.5px] text-white/50">
            {promos.length} kode promo · {redemptions.length} redemption tercatat
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Promo Baru
        </Button>
      </header>

      {promos.length ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {promos.map((promo) => {
            const state = promoState(promo);
            const used = promo.redemption_count;
            const max = promo.max_redemptions;
            const ratio = max ? Math.min(100, (used / max) * 100) : 0;
            const promoRedemptions = redemptions.filter((r) => r.promo_id === promo.id);

            return (
              <li key={promo.id}>
                <GlassCard solid className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[16px] font-bold tracking-wider text-white">
                        {promo.code}
                      </p>
                      <p className="mt-1 text-[13px] text-white/50">
                        {promo.discount_type === "percentage"
                          ? `${promo.discount_value}% off`
                          : `${formatIDR(promo.discount_value)} off`}
                        {promo.max_discount ? ` · maks ${formatIDR(promo.max_discount)}` : ""}
                      </p>
                    </div>
                    <Badge tone={state.tone}>{state.label}</Badge>
                  </div>

                  {promo.description && (
                    <p className="mt-2 line-clamp-2 text-[13px] text-white/45">
                      {promo.description}
                    </p>
                  )}

                  {/* Redemption meter */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="flex items-center gap-1.5 text-white/45">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        Redemption
                      </span>
                      <span className="font-semibold text-white">
                        {max === null ? (
                          <span className="inline-flex items-center gap-1">
                            {used} / <InfinityIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        ) : (
                          `${used} / ${max} Redeemed`
                        )}
                      </span>
                    </div>
                    {max !== null && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            ratio >= 100
                              ? "bg-rose-500"
                              : "bg-gradient-to-r from-violet-500 to-brand-500"
                          )}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <dl className="mt-3.5 space-y-1.5 text-[12.5px]">
                    {promo.min_purchase > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-white/40">Min. belanja</dt>
                        <dd className="text-white/65">{formatIDR(promo.min_purchase)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="flex items-center gap-1.5 text-white/40">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        Kedaluwarsa
                      </dt>
                      <dd className="text-white/65">
                        {promo.expires_at ? formatDate(promo.expires_at) : "Tidak ada"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-white/[0.07] pt-3.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewing(promo)}
                      title="Lihat riwayat redemption"
                      aria-label="Lihat riwayat redemption"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggle(promo)}
                      title={promo.is_active ? "Nonaktifkan" : "Aktifkan"}
                      aria-label={promo.is_active ? "Nonaktifkan promo" : "Aktifkan promo"}
                    >
                      {promo.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(promo)}
                      title="Edit"
                      aria-label="Edit promo"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(promo)}
                      title="Hapus"
                      aria-label="Hapus promo"
                      className="text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {promoRedemptions.length > 0 && (
                    <p className="mt-2.5 text-center text-[11.5px] text-white/30">
                      Terakhir dipakai {formatDate(promoRedemptions[0].redeemed_at)}
                    </p>
                  )}
                </GlassCard>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={<Tag className="h-6 w-6" />}
          title="Belum ada kode promo"
          description="Buat kode promo pertama untuk mendorong konversi."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Promo Baru
            </Button>
          }
        />
      )}

      {/* All redemptions */}
      <GlassCard solid className="p-5 sm:p-6">
        <h2 className="text-[16px] font-semibold text-white">Riwayat Redemption</h2>
        {redemptions.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[12px] uppercase tracking-wider text-white/40">
                  <th scope="col" className="pb-2.5 pr-4 font-medium">Pengguna</th>
                  <th scope="col" className="pb-2.5 pr-4 font-medium">Order</th>
                  <th scope="col" className="pb-2.5 pr-4 font-medium">Hemat</th>
                  <th scope="col" className="pb-2.5 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {redemptions.slice(0, 25).map((redemption) => (
                  <tr key={redemption.id}>
                    <td className="max-w-[14rem] truncate py-2.5 pr-4 text-white/75">
                      {redemption.user?.full_name || redemption.user?.email || redemption.guest_email || "Guest"}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[12.5px] text-brand-200">
                      {redemption.order?.order_number ?? "—"}
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-4 font-medium text-emerald-300">
                      {formatIDR(redemption.amount)}
                    </td>
                    <td className="whitespace-nowrap py-2.5 text-white/45">
                      {formatDateTime(redemption.redeemed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[13.5px] text-white/40">
            Belum ada kode promo yang digunakan.
          </p>
        )}
      </GlassCard>

      {(creating || editing) && (
        <PromoFormModal
          promo={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {viewing && (
        <Modal
          open
          onClose={() => setViewing(null)}
          title={`Redemption — ${viewing.code}`}
          description={`${viewing.redemption_count} dari ${viewing.max_redemptions ?? "∞"} kuota terpakai.`}
          size="lg"
        >
          <ul className="space-y-2">
            {redemptions
              .filter((r) => r.promo_id === viewing.id)
              .map((redemption) => (
                <li
                  key={redemption.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-white">
                      {redemption.user?.full_name || redemption.user?.email || redemption.guest_email || "Guest"}
                    </p>
                    <p className="truncate text-[12px] text-white/40">
                      {redemption.order?.order_number ?? "Tanpa order"} ·{" "}
                      {formatDateTime(redemption.redeemed_at)}
                    </p>
                  </div>
                  <Badge tone="success">{formatIDR(redemption.amount)}</Badge>
                </li>
              ))}
            {redemptions.filter((r) => r.promo_id === viewing.id).length === 0 && (
              <li className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[13.5px] text-white/40">
                Belum ada yang menggunakan kode ini.
              </li>
            )}
          </ul>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        destructive
        title="Hapus kode promo?"
        description={`Kode "${deleting?.code}" dan seluruh riwayat redemption-nya akan dihapus.`}
        confirmLabel="Ya, hapus"
      />
    </div>
  );
}

function PromoFormModal({ promo, onClose }: { promo: PromoCode | null; onClose: () => void }) {
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [type, setType] = React.useState(promo?.discount_type ?? "fixed");
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const result = await savePromoAction(null, new FormData(event.currentTarget));
    if (result.ok) {
      success(result.message);
      onClose();
    } else {
      toastError("Gagal", result.message);
    }
    setSaving(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={promo ? "Edit Promo" : "Promo Baru"}
      description="Validasi dan penghitungan diskon dilakukan sepenuhnya di server."
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="button" loading={saving} onClick={() => formRef.current?.requestSubmit()}>
            {promo ? "Simpan Perubahan" : "Buat Promo"}
          </Button>
        </>
      }
    >
      <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        {promo && <input type="hidden" name="id" value={promo.id} />}

        <Field label="Kode Promo" htmlFor="pr-code" required hint="Huruf besar, tanpa spasi">
          <Input
            id="pr-code"
            name="code"
            defaultValue={promo?.code ?? ""}
            required
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9_\-]+"
            className="font-mono uppercase tracking-wider"
            placeholder="PROMOZYN"
          />
        </Field>

        <Field label="Tipe Diskon" htmlFor="pr-type" required>
          <Select
            id="pr-type"
            name="discountType"
            value={type}
            onChange={(event) => setType(event.target.value as "fixed" | "percentage")}
          >
            <option value="fixed" className="bg-ink-900">Fixed (Rp)</option>
            <option value="percentage" className="bg-ink-900">Percentage (%)</option>
          </Select>
        </Field>

        <Field
          label={type === "percentage" ? "Nilai Diskon (%)" : "Nilai Diskon (Rp)"}
          htmlFor="pr-value"
          required
        >
          <Input
            id="pr-value"
            name="discountValue"
            type="number"
            min={1}
            max={type === "percentage" ? 100 : undefined}
            step={type === "percentage" ? 1 : 500}
            defaultValue={promo?.discount_value ?? (type === "percentage" ? 10 : 5000)}
            required
          />
        </Field>

        <Field
          label="Maksimal Diskon (Rp)"
          htmlFor="pr-max"
          hint={type === "percentage" ? "Batas atas untuk diskon persentase" : "Opsional"}
        >
          <Input
            id="pr-max"
            name="maxDiscount"
            type="number"
            min={0}
            step={500}
            defaultValue={promo?.max_discount ?? ""}
          />
        </Field>

        <Field label="Minimum Belanja (Rp)" htmlFor="pr-min">
          <Input
            id="pr-min"
            name="minPurchase"
            type="number"
            min={0}
            step={500}
            defaultValue={promo?.min_purchase ?? 0}
          />
        </Field>

        <Field
          label="Maksimal Redemption"
          htmlFor="pr-maxred"
          hint="Kosongkan untuk tanpa batas"
        >
          <Input
            id="pr-maxred"
            name="maxRedemptions"
            type="number"
            min={promo?.redemption_count || 1}
            defaultValue={promo?.max_redemptions ?? 3}
          />
        </Field>

        <Field label="Kedaluwarsa" htmlFor="pr-exp" hint="Kosongkan untuk tanpa batas waktu">
          <Input
            id="pr-exp"
            name="expiresAt"
            type="datetime-local"
            defaultValue={toLocalInput(promo?.expires_at ?? null)}
          />
        </Field>

        <Field label="Deskripsi" htmlFor="pr-desc" className="sm:col-span-2">
          <Input
            id="pr-desc"
            name="description"
            defaultValue={promo?.description ?? ""}
            maxLength={200}
            placeholder="Promo September untuk semua produk digital"
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox name="isActive" label="Promo aktif" defaultChecked={promo?.is_active ?? true} />
        </div>

        {promo && (
          <p className="rounded-xl bg-white/[0.04] px-3.5 py-3 text-[12.5px] text-white/50 sm:col-span-2">
            Sudah digunakan <strong className="text-white">{promo.redemption_count}</strong> kali.
            Jumlah ini dikelola otomatis oleh database dan tidak dapat diubah manual.
          </p>
        )}
      </form>
    </Modal>
  );
}
