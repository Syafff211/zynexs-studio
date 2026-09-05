"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, HelpCircle, Megaphone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, Badge, EmptyState } from "@/components/ui/card";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  saveFaqAction,
  deleteFaqAction,
  saveAnnouncementAction,
  deleteAnnouncementAction,
} from "@/actions/admin";
import { formatDateTime } from "@/lib/utils";
import type { Announcement, Faq } from "@/types";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function ContentManager({
  faqs,
  announcements,
}: {
  faqs: Faq[];
  announcements: Announcement[];
}) {
  const [tab, setTab] = React.useState<"faq" | "announcement">("faq");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Konten</h1>
        <p className="mt-1.5 text-[14.5px] text-white/50">
          Kelola FAQ dan pengumuman yang tampil di storefront.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Jenis konten"
        className="glass-solid inline-flex gap-1 rounded-xl p-1"
      >
        {(
          [
            { id: "faq", label: "FAQ", count: faqs.length },
            { id: "announcement", label: "Pengumuman", count: announcements.length },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? "rounded-lg bg-brand-500/18 px-4 py-2 text-[13.5px] font-semibold text-brand-100 ring-1 ring-inset ring-brand-400/25"
                : "rounded-lg px-4 py-2 text-[13.5px] font-medium text-white/55 transition-colors hover:text-white"
            }
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {tab === "faq" ? <FaqSection faqs={faqs} /> : <AnnouncementSection items={announcements} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FaqSection({ faqs }: { faqs: Faq[] }) {
  const { success, error: toastError } = useToast();
  const [editing, setEditing] = React.useState<Faq | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Faq | null>(null);
  const [saving, setSaving] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const result = await saveFaqAction(null, new FormData(event.currentTarget));
    if (result.ok) {
      success(result.message);
      setEditing(null);
      setCreating(false);
    } else {
      toastError("Gagal", result.message);
    }
    setSaving(false);
  };

  const open = creating || Boolean(editing);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          FAQ Baru
        </Button>
      </div>

      {faqs.length ? (
        <ul className="space-y-2.5">
          {faqs.map((faq) => (
            <li key={faq.id}>
              <GlassCard solid className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">{faq.category}</Badge>
                      <Badge tone={faq.is_active ? "success" : "neutral"}>
                        {faq.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <span className="text-[11.5px] text-white/30">urutan {faq.sort_order}</span>
                    </div>
                    <p className="mt-2 text-[14.5px] font-semibold text-white">{faq.question}</p>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-white/50">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(faq)}
                      aria-label="Edit FAQ"
                      className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(faq)}
                      aria-label="Hapus FAQ"
                      className="rounded-lg p-2 text-white/40 transition-colors hover:bg-rose-500/12 hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<HelpCircle className="h-6 w-6" />}
          title="Belum ada FAQ"
          description="Tambahkan pertanyaan yang sering diajukan pelanggan."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              FAQ Baru
            </Button>
          }
        />
      )}

      {open && (
        <Modal
          open
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          title={editing ? "Edit FAQ" : "FAQ Baru"}
          size="lg"
          footer={
            <>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Batal
              </Button>
              <Button
                type="button"
                loading={saving}
                onClick={() => formRef.current?.requestSubmit()}
              >
                Simpan
              </Button>
            </>
          }
        >
          <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Pertanyaan" htmlFor="f-q" required className="sm:col-span-2">
              <Input id="f-q" name="question" defaultValue={editing?.question ?? ""} required minLength={5} />
            </Field>
            <Field label="Jawaban" htmlFor="f-a" required className="sm:col-span-2">
              <Textarea id="f-a" name="answer" defaultValue={editing?.answer ?? ""} rows={5} required minLength={5} />
            </Field>
            <Field label="Kategori" htmlFor="f-cat" hint="Contoh: Umum, Pembayaran, Produk">
              <Input id="f-cat" name="category" defaultValue={editing?.category ?? "Umum"} />
            </Field>
            <Field label="Urutan" htmlFor="f-sort">
              <Input id="f-sort" name="sortOrder" type="number" min={0} defaultValue={editing?.sort_order ?? 0} />
            </Field>
            <div className="sm:col-span-2">
              <Checkbox name="isActive" label="FAQ aktif" defaultChecked={editing?.is_active ?? true} />
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deleteFaqAction(deleting.id);
          if (result.ok) success(result.message);
          else toastError("Gagal", result.message);
          setDeleting(null);
        }}
        destructive
        title="Hapus FAQ?"
        description={deleting?.question}
        confirmLabel="Ya, hapus"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AnnouncementSection({ items }: { items: Announcement[] }) {
  const { success, error: toastError } = useToast();
  const [editing, setEditing] = React.useState<Announcement | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Announcement | null>(null);
  const [saving, setSaving] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const result = await saveAnnouncementAction(null, new FormData(event.currentTarget));
    if (result.ok) {
      success(result.message);
      setEditing(null);
      setCreating(false);
    } else {
      toastError("Gagal", result.message);
    }
    setSaving(false);
  };

  const open = creating || Boolean(editing);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Pengumuman Baru
        </Button>
      </div>

      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const expired = item.expires_at ? new Date(item.expires_at) <= new Date() : false;
            return (
              <li key={item.id}>
                <GlassCard solid className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={item.variant === "promo" ? "violet" : item.variant === "warning" ? "warning" : "brand"}>
                          {item.variant}
                        </Badge>
                        <Badge tone={item.is_active && !expired ? "success" : "neutral"}>
                          {expired ? "Expired" : item.is_active ? "Tayang" : "Nonaktif"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[14.5px] font-medium text-white">{item.message}</p>
                      <p className="mt-1 text-[12px] text-white/35">
                        {item.expires_at
                          ? `Berakhir ${formatDateTime(item.expires_at)}`
                          : "Tanpa batas waktu"}
                        {item.link_url ? ` · ${item.link_url}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <span
                        title={item.is_active ? "Tayang" : "Nonaktif"}
                        className="rounded-lg p-2 text-white/30"
                      >
                        {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        aria-label="Edit pengumuman"
                        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(item)}
                        aria-label="Hapus pengumuman"
                        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-rose-500/12 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="Belum ada pengumuman"
          description="Contoh: 🔥 Promo September — Gunakan kode PROMOZYN!"
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Pengumuman Baru
            </Button>
          }
        />
      )}

      {open && (
        <Modal
          open
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          title={editing ? "Edit Pengumuman" : "Pengumuman Baru"}
          size="lg"
          footer={
            <>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Batal
              </Button>
              <Button type="button" loading={saving} onClick={() => formRef.current?.requestSubmit()}>
                Simpan
              </Button>
            </>
          }
        >
          <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Pesan" htmlFor="a-msg" required className="sm:col-span-2">
              <Input
                id="a-msg"
                name="message"
                defaultValue={editing?.message ?? ""}
                required
                minLength={5}
                maxLength={300}
                placeholder="🔥 Promo September — Gunakan kode PROMOZYN!"
              />
            </Field>
            <Field label="Link URL" htmlFor="a-url" hint="Opsional, contoh: /promo">
              <Input id="a-url" name="linkUrl" defaultValue={editing?.link_url ?? ""} />
            </Field>
            <Field label="Label Link" htmlFor="a-label">
              <Input id="a-label" name="linkLabel" defaultValue={editing?.link_label ?? ""} placeholder="Lihat Promo" />
            </Field>
            <Field label="Variant" htmlFor="a-var">
              <Select id="a-var" name="variant" defaultValue={editing?.variant ?? "info"}>
                <option value="info" className="bg-ink-900">Info</option>
                <option value="promo" className="bg-ink-900">Promo</option>
                <option value="warning" className="bg-ink-900">Warning</option>
              </Select>
            </Field>
            <Field label="Kedaluwarsa" htmlFor="a-exp" hint="Kosongkan untuk tanpa batas">
              <Input
                id="a-exp"
                name="expiresAt"
                type="datetime-local"
                defaultValue={toLocalInput(editing?.expires_at ?? null)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Checkbox name="isActive" label="Tayangkan pengumuman" defaultChecked={editing?.is_active ?? true} />
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deleteAnnouncementAction(deleting.id);
          if (result.ok) success(result.message);
          else toastError("Gagal", result.message);
          setDeleting(null);
        }}
        destructive
        title="Hapus pengumuman?"
        description={deleting?.message}
        confirmLabel="Ya, hapus"
      />
    </div>
  );
}
