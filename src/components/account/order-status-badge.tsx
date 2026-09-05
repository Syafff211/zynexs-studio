import { Badge } from "@/components/ui/card";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import type { OrderStatus } from "@/types";

const TONE: Record<OrderStatus, "brand" | "success" | "warning" | "danger" | "neutral" | "violet"> = {
  pending: "warning",
  paid: "brand",
  processing: "violet",
  completed: "success",
  cancelled: "danger",
  refunded: "neutral",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status] ?? "neutral"}>{ORDER_STATUS_LABEL[status] ?? status}</Badge>;
}
