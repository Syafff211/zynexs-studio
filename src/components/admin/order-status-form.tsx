"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateOrderStatusAction } from "@/actions/admin";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/constants";
import type { OrderStatus } from "@/types";

export function OrderStatusForm({
  orderId,
  status,
  adminNotes,
}: {
  orderId: string;
  status: OrderStatus;
  adminNotes: string | null;
}) {
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const result = await updateOrderStatusAction(null, new FormData(event.currentTarget));
    if (result.ok) success(result.message);
    else toastError("Gagal", result.message);
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />

      <Field label="Status Pesanan" htmlFor="status" required>
        <Select id="status" name="status" defaultValue={status}>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value} className="bg-ink-900">
              {ORDER_STATUS_LABEL[value]}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Catatan Admin"
        htmlFor="adminNotes"
        hint="Hanya terlihat oleh admin"
      >
        <Textarea
          id="adminNotes"
          name="adminNotes"
          defaultValue={adminNotes ?? ""}
          rows={3}
          maxLength={1000}
          placeholder="Catatan internal untuk pesanan ini…"
        />
      </Field>

      <Button type="submit" loading={saving} className="w-full">
        <Save className="h-4 w-4" aria-hidden="true" />
        Simpan Status
      </Button>
    </form>
  );
}
