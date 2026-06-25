"use client";

// Rotating hero slider for the home above-the-fold. Pure client component —
// no server imports (keeps env/prisma out of the browser bundle). Slide data is
// passed in as serializable props from the server page.
//
// Each slide carries an image (always shown as poster + fallback) and an optional
// video. Video is only loaded/played when the DEVICE PERMITS — i.e. the user
// hasn't asked for reduced motion, isn't on data-saver, and isn't on a slow
// connection. Otherwise the still image is shown (progressive enhancement).
//
// UX: auto-rotates (paused on hover/focus, disabled under reduced-motion),
// prev/next arrows, dot indicators, ArrowLeft/Right keyboard nav; only the
// active slide's video plays.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export type HeroSlide = {
  img: string; // poster + fallback, always present
  video?: string; // optional mp4, played only when the device permits
  alt: string;
  eyebrow: string;
  title: string;
  ctaLabel: string;
  ctaHref: string;
  badge?: string;
};

type NetworkInfo = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

const ROTATE_MS = 6000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Start false so SSR + first paint show the still image; upgrade to video
  // after we've confirmed the device can handle it.
  const [videoOk, setVideoOk] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const count = slides.length;

  const go = useCallback((n: number) => setIndex((i) => (n + count) % count), [count]);

  // Decide whether the device permits video (connection- + motion-aware).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const motionMq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection;
    const compute = () => {
      const reduce = motionMq?.matches ?? false;
      const saveData = conn?.saveData === true;
      const slow = /^(slow-2g|2g|3g)$/.test(conn?.effectiveType ?? "");
      setVideoOk(!reduce && !saveData && !slow);
    };
    compute();
    motionMq?.addEventListener?.("change", compute);
    conn?.addEventListener?.("change", compute);
    return () => {
      motionMq?.removeEventListener?.("change", compute);
      conn?.removeEventListener?.("change", compute);
    };
  }, []);

  // Auto-rotate, respecting reduced-motion + pause state.
  useEffect(() => {
    if (paused || count <= 1) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearTimeout(t);
  }, [index, paused, count]);

  // Play only the active slide's video; pause the rest.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) v.play().catch(() => {});
      else v.pause();
    });
  }, [index, videoOk]);

  const active = slides[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative w-full overflow-hidden border-b border-border bg-muted"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[5/2]">
        {slides.map((s, i) => {
          const showVideo = videoOk && Boolean(s.video);
          return (
            <div
              key={s.img}
              aria-hidden={i !== index}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                i === index ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {showVideo ? (
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  className="h-full w-full object-cover object-[72%_center] sm:object-center"
                  muted
                  loop
                  playsInline
                  preload={i === 0 ? "metadata" : "none"}
                  poster={s.img}
                  aria-label={s.alt}
                >
                  <source src={s.video} type="video/mp4" />
                </video>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={s.img}
                  alt={s.alt}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover object-[72%_center] sm:object-center"
                />
              )}
              {/* Scrim: bottom-up on mobile, left-to-right on desktop. */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/25 to-transparent sm:bg-gradient-to-r sm:from-foreground/75 sm:via-foreground/25 sm:to-transparent" />
            </div>
          );
        })}

        {/* Active-slide copy (re-keyed so it fades in on change). */}
        <div className="pointer-events-none absolute inset-0 flex items-end sm:items-center">
          <div className="container mx-auto max-w-7xl px-5 pb-14 sm:px-8 sm:pb-0">
            <div
              key={index}
              className="pointer-events-auto max-w-md text-background motion-safe:animate-[fadeIn_0.6s_ease-out]"
            >
              {active?.badge ? (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden /> {active.badge}
                </span>
              ) : null}
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-background/85">
                {active?.eyebrow}
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.04] tracking-tight drop-shadow-sm sm:text-5xl lg:text-6xl">
                {active?.title}
              </h1>
              <Link href={active?.ctaHref ?? "/shop"} className="amzn-button-yellow mt-6">
                {active?.ctaLabel}
              </Link>
            </div>
          </div>
        </div>

        {/* Prev / Next (desktop) */}
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground shadow-sm backdrop-blur transition hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground shadow-sm backdrop-blur transition hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>

        {/* Dots */}
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.img}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}: ${s.eyebrow}`}
              aria-current={i === index ? "true" : undefined}
              className={`h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                i === index
                  ? "w-6 bg-background"
                  : "w-2 bg-background/50 hover:bg-background/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
