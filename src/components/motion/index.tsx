"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { forwardRef } from "react";

/* ------------------------------------------------------------------------
 * Reusable motion primitives. Keep timings tight (150-400ms) per the
 * ui-ux-pro-max animation rules. All respect prefers-reduced-motion via
 * Framer Motion's built-in `useReducedMotion`.
 * --------------------------------------------------------------------- */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
};

export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Section wrapper that fades + slides up on first scroll into view. */
export const Reveal = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  function Reveal(props, ref) {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeUp}
        {...props}
      />
    );
  },
);

/** Grid wrapper that staggers its motion children when scrolled into view. */
export const StaggerGrid = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  function StaggerGrid(props, ref) {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={stagger}
        {...props}
      />
    );
  },
);

/** Single child for use inside StaggerGrid — fades up. */
export const StaggerItem = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  function StaggerItem(props, ref) {
    return <motion.div ref={ref} variants={fadeUp} {...props} />;
  },
);

/** Tile that lifts on hover. Use for product cards, shop cards, etc. */
export const HoverLift = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  function HoverLift(props, ref) {
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        {...props}
      />
    );
  },
);

/** Three-dot loading indicator. Used during AI search / generation. */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span
      className={className}
      role="status"
      aria-label="Loading"
      style={{ display: "inline-flex", gap: 4 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "hsl(var(--primary))",
            display: "inline-block",
          }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
