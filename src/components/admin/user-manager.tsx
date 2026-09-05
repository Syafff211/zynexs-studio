"use client";

import * as React from "react";
import { Search, Shield, ShieldOff, UserCheck, UserX, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, Badge, EmptyState } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { updateUserRoleAction, toggleUserActiveAction } from "@/actions/admin";
import { formatIDR, formatDate, initials } from "@/lib/utils";
import type { Profile } from "@/types";

export interface UserRow extends Profile {
  order_count: number;
  total_spent: number;
  redemption_count: number;
}

export function UserManager({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const { success, error: toastError } = useToast();
  const [query, setQuery] = React.useState("");
  const [viewing, setViewing] = React.useState<UserRow | null>(null);
  const [confirm, setConfirm] = React.useState<{
    user: UserRow;
    action: "role" | "active";
  } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const filtered = users.filter((user) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      (user.full_name ?? "").toLowerCase().includes(needle) ||
      (user.email ?? "").toLowerCase().includes(needle) ||
      (user.phone ?? "").includes(needle)
    );
  });

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    const formData = new FormData();
    formData.set("userId", confirm.user.id);

    let result;
    if (confirm.action === "role") {
      formData.set("role", confirm.user.role === "admin" ? "user" : "admin");
      result = await updateUserRoleAction(formData);
    } else {
      formData.set("isActive", String(!confirm.user.is_active));
      result = await toggleUserActiveAction(formData);
    }

    if (result.ok) success(result.message);

    else toastError("Gagal", result.message);
    setBusy(false);
    setConfirm(null);
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Pengguna</h1>
        <p className="mt-1.5 text-[14.5px] text-white/50">
          {users.length} akun terdaftar · {users.filter((u) => u.role === "admin").length} admin
        </p>
      </header>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama, email, atau nomor WhatsApp…"
          aria-label="Cari pengguna"
          className="pl-10"
        />
      </div>

      {filtered.length ? (
        <>
          {/* Desktop */}
          <GlassCard solid className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[12px] uppercase tracking-wider text-white/45">
                    <th scope="col" className="px-4 py-3 font-medium">Pengguna</th>
                    <th scope="col" className="px-4 py-3 font-medium">Role</th>
                    <th scope="col" className="px-4 py-3 font-medium">Order</th>
                    <th scope="col" className="px-4 py-3 font-medium">Belanja</th>
                    <th scope="col" className="px-4 py-3 font-medium">Promo</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filtered.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-[11px] font-bold text-white">
                            {initials(user.full_name)}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[12rem] truncate font-medium text-white">
                              {user.full_name ?? "Tanpa nama"}
                              {user.id === currentUserId && (
                                <span className="ml-1.5 text-[11px] text-brand-300">(kamu)</span>
                              )}
                            </p>
                            <p className="max-w-[12rem] truncate text-[11.5px] text-white/35">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={user.role === "admin" ? "violet" : "neutral"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-white/60">{user.order_count}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-white/80">
                        {formatIDR(user.total_spent)}
                      </td>
                      <td className="px-4 py-3 text-white/60">{user.redemption_count}</td>
                      <td className="px-4 py-3">
                        <Badge tone={user.is_active ? "success" : "danger"}>
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewing(user)}
                            title="Lihat detail"
                            aria-label={`Detail ${user.full_name ?? user.email}`}
                            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={user.id === currentUserId}
                            onClick={() => setConfirm({ user, action: "role" })}
                            title={user.role === "admin" ? "Turunkan ke user" : "Jadikan admin"}
                            aria-label="Ubah role"
                            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-violet-500/12 hover:text-violet-300 disabled:opacity-25"
                          >
                            {user.role === "admin" ? (
                              <ShieldOff className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={user.id === currentUserId}
                            onClick={() => setConfirm({ user, action: "active" })}
                            title={user.is_active ? "Nonaktifkan" : "Aktifkan"}
                            aria-label="Ubah status aktif"
                            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-rose-500/12 hover:text-rose-300 disabled:opacity-25"
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Mobile */}
          <ul className="space-y-3 lg:hidden">
            {filtered.map((user) => (
              <li key={user.id}>
                <GlassCard solid className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-[13px] font-bold text-white">
                      {initials(user.full_name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-white">
                        {user.full_name ?? "Tanpa nama"}
                      </p>
                      <p className="truncate text-[12.5px] text-white/45">{user.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone={user.role === "admin" ? "violet" : "neutral"}>
                          {user.role}
                        </Badge>
                        <Badge tone={user.is_active ? "success" : "danger"}>
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3 text-center">
                    <div>
                      <dt className="text-[11px] text-white/35">Order</dt>
                      <dd className="text-[14px] font-semibold text-white">{user.order_count}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-white/35">Belanja</dt>
                      <dd className="text-[13px] font-semibold text-white">
                        {formatIDR(user.total_spent)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-white/35">Promo</dt>
                      <dd className="text-[14px] font-semibold text-white">
                        {user.redemption_count}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => setViewing(user)}>
                      Detail
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={user.id === currentUserId}
                      onClick={() => setConfirm({ user, action: "role" })}
                    >
                      {user.role === "admin" ? "Turunkan" : "Jadi Admin"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={user.id === currentUserId}
                      onClick={() => setConfirm({ user, action: "active" })}
                      className="text-rose-300"
                    >
                      {user.is_active ? "Nonaktif" : "Aktifkan"}
                    </Button>
                  </div>
                </GlassCard>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Pengguna tidak ditemukan"
          description="Coba kata kunci lain."
        />
      )}

      {viewing && (
        <Modal
          open
          onClose={() => setViewing(null)}
          title={viewing.full_name ?? "Detail Pengguna"}
          description={viewing.email ?? undefined}
          size="md"
        >
          <dl className="space-y-3 text-[14px]">
            <Row label="Role" value={viewing.role} />
            <Row label="Status" value={viewing.is_active ? "Aktif" : "Nonaktif"} />
            <Row label="WhatsApp" value={viewing.phone ?? "—"} />
            <Row label="Total pesanan" value={String(viewing.order_count)} />
            <Row label="Total belanja" value={formatIDR(viewing.total_spent)} />
            <Row label="Promo digunakan" value={String(viewing.redemption_count)} />
            <Row label="Bergabung" value={formatDate(viewing.created_at)} />
          </dl>

          {viewing.email && (
            <a
              href={`mailto:${viewing.email}`}
              className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-medium text-brand-200 hover:text-brand-100"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Kirim email
            </a>
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        loading={busy}
        destructive={confirm?.action === "active" && confirm.user.is_active}
        title={
          confirm?.action === "role"
            ? confirm.user.role === "admin"
              ? "Turunkan menjadi user?"
              : "Jadikan administrator?"
            : confirm?.user.is_active
              ? "Nonaktifkan pengguna?"
              : "Aktifkan pengguna?"
        }
        description={
          confirm?.action === "role"
            ? "Role admin memberi akses penuh ke panel admin, produk, promo, dan pesanan."
            : "Pengguna nonaktif tetap bisa login namun kehilangan akses admin."
        }
        confirmLabel="Ya, lanjutkan"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-2.5">
      <dt className="text-white/45">{label}</dt>
      <dd className="truncate font-medium text-white/85">{value}</dd>
    </div>
  );
}
