# Mirage — Boutique Warm Redesign (source of truth)

Branch: `redesign/boutique-warm` (off `master`, includes all features + the `fx.ts` client-bundle fix).
Direction chosen by the user: **Boutique Warm** — editorial fashion-store look, warm + ornate, culturally on-brand for sarees/bridal. NOT cold monochrome.

Stack: Next.js 15 App Router, Tailwind 3.4, CSS-variable design tokens in `src/app/globals.css` (HSL via `hsl(var(--token))`). Fonts already wired: Playfair Display (display) + Inter (body).

## Design tokens (edit `src/app/globals.css` `:root`)

Shift the current wine/gold to rose/gold on a pinker cream. Keep the token NAMES (everything inherits):

| Token | New value (HSL) | Hex | Role |
|------|-----------------|-----|------|
| `--background` | `28 60% 97%` | #FDF7F2 | warm cream page bg |
| `--foreground` | `24 22% 12%` | #241B16 | ink text |
| `--card` | `0 0% 100%` | #FFFFFF | card surface |
| `--primary` | `333 78% 42%` | #BE185D | fashion rose — primary CTA |
| `--primary-foreground` | `28 60% 97%` | cream on rose |
| `--secondary` | `32 95% 44%` | #D97706 | gold accent — secondary CTA |
| `--secondary-foreground` | `24 22% 12%` | ink on gold |
| `--accent` | `333 78% 42%` | rose links |
| `--muted` | `26 40% 94%` | #F4E9E1 | warm stone |
| `--muted-foreground` | `24 12% 40%` | warm gray |
| `--border` | `28 30% 88%` | #EADDD2 | warm hairline |
| `--ring` | `333 78% 42%` | rose focus |
| `--star` | `32 95% 44%` | gold stars |
| `--subheader-bg` | `333 55% 30%` | deep rose strip |
| `--header-bg` | `26 30% 14%` | warm espresso |
| `--radius` | `0.5rem` | softer corners (was 0.25) |

Effects: soft cards (`rounded-md`, subtle `shadow-sm` on hover), generous whitespace, hairline borders, Playfair for section titles + hero (oversized, e.g. `text-5xl`/`text-6xl`). Respect `prefers-reduced-motion`. Keep the existing `.amzn-button-*`/`.mirage-*` classes; they read tokens so they'll re-skin automatically — just confirm hover hex values match the new rose/gold.

## Deliverables (the user's asks)

1. **Above-the-fold cleanup** (`src/app/page.tsx`): tighter editorial hero. One clear headline (Playfair, oversized), one subhead, one primary CTA. Remove clutter. Lead with imagery.
2. **Category discovery options in the hero**: let the user pick what they're looking for — a row of category entry points (Sarees, Lehenga & Suits, Jewelry, Bridal Edit, Accessories) as image tiles/chips linking to `/shop/category/*` (+ `/search?...`). Make "what are you looking for?" obvious above the fold.
3. **Generated imagery, populated**: real hero + category images (generated via Higgsfield/Gemini) saved under `public/redesign/` and referenced by the hero + category tiles. No placehold.co in the redesigned hero.
4. **Hero video slide** (headline): one slide in the hero/gallery is a Higgsfield-generated VIDEO of a dress + a girl avatar picking it up and wearing it. File: `public/redesign/hero-tryon.mp4` (poster `public/redesign/hero-tryon-poster.jpg`). Render via the Higgsfield MCP (this session is generating it — see "Asset status" below). Reuse the `<video autoPlay muted loop playsInline poster>` pattern from `product-gallery.tsx`.
5. **Cookies disclaimer**: a dismissible cookie-consent banner (client component, `localStorage` persisted, `aria-live`, theme-tokened, not blocking). Mount in `src/app/layout.tsx`. New: `src/components/marketplace/cookie-banner.tsx`.
6. **Production-ready polish**: footer legal links resolve (not 404), OG/metadata, `aria` labels, focus states, reduced-motion, alt text on generated images, mobile pass (375px). (Heavier P0 items like Stripe live keys are tracked in `TODOS.md` — not this redesign's scope.)
7. **Site-wide rollout**: apply Boutique Warm across every buyer surface — nav, footer, product card, shop card, PDP, cart, checkout, search, shop/category/region pages, sign-in. Tokens do most of it; per-surface agents tighten layout/imagery to the editorial style.

## Fan-out plan (one agent per surface group, after tokens land)

- A: tokens (`globals.css`, `tailwind.config.ts`) + cookie banner + layout — MUST land first (others depend on tokens).
- B: home above-the-fold (`page.tsx`) hero + category options + video slide + generated images.
- C: nav + footer + search bar.
- D: product card + shop card + PDP + product gallery.
- E: cart + checkout + sign-in.
- F: shop / category / region directory pages.

## Guardrails (do not regress)

- **Client-bundle/env leak**: never let a `"use client"` component transitively import `@/lib/env` (or `@/lib/stubs`, which imports env). Currency formatting goes through `@/lib/format` → `@/lib/fx` (both pure). This bug already bit us (ZodError on hydration) — keep client chains env-free.
- Pages query the DB and are `force-dynamic`; don't add server `auth()`+DB reads to components used on static-ish catalog pages (the cart badge is a client fetch for this reason).
- Run `npm run typecheck` + `npm run build` before declaring done. Local dev: Docker `mirage-pg` + `.env`, `npm run dev` on :3000.

## Asset status (filled in as generation completes)

- hero try-on video: <pending — Higgsfield job started this session; save to public/redesign/hero-tryon.mp4>
- category/hero images: <pending>
