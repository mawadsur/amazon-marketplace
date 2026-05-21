// Visual pill for OrderStatus / PaymentStatus / PayoutStatus. Server-safe.

import { cn } from "@/lib/utils";

type AnyStatus =
  | "PLACED"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "DISPUTED"
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED";

const STYLES: Record<AnyStatus, string> = {
  PLACED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  PROCESSING: "bg-amber-100 text-amber-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-muted text-muted-foreground",
  REFUNDED: "bg-muted text-muted-foreground",
  DISPUTED: "bg-red-100 text-red-800",
  PENDING: "bg-amber-100 text-amber-800",
  AUTHORIZED: "bg-blue-100 text-blue-800",
  CAPTURED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export function OrderStatusPill({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const style = STYLES[value as AnyStatus] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        style,
        className,
      )}
    >
      {value.toLowerCase().replace(/_/g, " ")}
    </span>
  );
}
