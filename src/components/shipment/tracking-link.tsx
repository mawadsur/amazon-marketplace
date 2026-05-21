// Small wrapper that renders a link to /track/[trackingNumber]. Used in
// buyer/seller shipment views and (later) outbound emails.

import Link from "next/link";

export function TrackingLink({
  trackingNumber,
  className,
  children,
}: {
  trackingNumber: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={`/track/${encodeURIComponent(trackingNumber)}`}
      className={className ?? "font-mono text-sm underline"}
    >
      {children ?? trackingNumber}
    </Link>
  );
}
