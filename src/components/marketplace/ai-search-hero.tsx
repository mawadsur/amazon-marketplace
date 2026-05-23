"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { LoadingDots } from "@/components/motion";

const PROMPTS = [
  "handwoven silk saree from Tamil Nadu under $100",
  "brass diya set for Diwali gift",
  "Jaipur block-print bedcover, indigo, queen size",
  "Kanchipuram bridal saree, gold border",
  "wooden temple from Karnataka, mid-century",
  "Meenakari earrings under $80",
];

export function AiSearchHero() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(PROMPTS[0]);
  const [pending, startTransition] = useTransition();

  // Rotate placeholder every 3.5s so the buyer sees what's possible.
  useEffect(() => {
    if (reduced) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % PROMPTS.length;
      setPlaceholder(PROMPTS[i]);
    }, 3500);
    return () => clearInterval(id);
  }, [reduced]);

  function submit(value: string) {
    const q = value.trim();
    if (!q) return;
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    });
  }

  return (
    <section className="relative isolate overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div className="absolute inset-0 -z-10 gradient-hero" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto max-w-5xl px-4 pb-16 pt-20 sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            AI-powered marketplace
          </motion.div>

          <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
            <span className="block bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
              Tell us what you&apos;re
            </span>
            <span className="block bg-gradient-to-r from-primary via-amber-400 to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x">
              looking for.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Handcrafts, textiles, and jewelry from vetted shops across India.
            Search in plain English — our AI finds the artisan.
          </p>
        </motion.div>

        {/* The search bar */}
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
          className="mx-auto mt-10 max-w-2xl"
        >
          <div className="group relative">
            {/* Glow effect on focus */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 blur-md transition-opacity duration-500 group-focus-within:opacity-100" />
            <div className="glass-strong relative flex items-center gap-2 rounded-2xl px-4 py-3 shadow-2xl shadow-black/40">
              <Sparkles className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden />
              <input
                aria-label="Search the marketplace with AI"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-base placeholder:text-muted-foreground/70 focus:outline-none sm:text-lg"
              />
              <button
                type="submit"
                disabled={pending}
                className="group/btn flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-70"
              >
                {pending ? (
                  <>
                    <LoadingDots />
                    <span className="ml-1">Searching</span>
                  </>
                ) : (
                  <>
                    Search
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" aria-hidden />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Suggested prompts */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground">Try:</span>
            {PROMPTS.slice(0, 3).map((p, i) => (
              <motion.button
                key={p}
                type="button"
                onClick={() => {
                  setQuery(p);
                  submit(p);
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="cursor-pointer rounded-full border border-border bg-card/50 px-3 py-1 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground"
              >
                {p.length > 38 ? p.slice(0, 36) + "…" : p}
              </motion.button>
            ))}
          </div>
        </motion.form>
      </div>
    </section>
  );
}
