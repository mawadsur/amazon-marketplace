import { cn } from "@/lib/utils";

/**
 * Shimmer skeleton — uses a moving gradient instead of opacity pulse so it
 * reads as "loading content" rather than "broken element". Matches the
 * gold-accent palette via primary/15 highlight band.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-shimmer",
        "before:bg-[linear-gradient(90deg,transparent,hsl(var(--primary)/0.15),transparent)]",
        "before:bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
