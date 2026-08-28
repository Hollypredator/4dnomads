# Design System: 4dnomads ("NomadStay")

Single source of truth for prompting Google Stitch to generate new screens
for this app. **This documents the system already implemented and running in
production** (`src/app/globals.css`) — it does not invent a new aesthetic.
Any Stitch generation that drifts from these exact values produces a screen
that will visibly clash with every existing one. When in doubt, match the
existing screens over anything more "on-trend" a generic prompt would pull in.

Origin: pulled from a real Stitch design set the founder selected (project
`17502068394573156412`, "NomadStay"), adopted 2026-08-28 replacing an earlier
from-scratch blue/ink system. The palette values below are extracted from
that design set's own Tailwind config, not eyeballed off screenshots.

## 1. Visual Theme & Atmosphere

**Density:** Daily App Balanced (5/10). This is a utility app people check
several times a day — hosts, stay requests, messages — not a browsing
showcase. Generous but not gallery-airy; content-dense screens (Explore,
Dashboard) stay legible without excessive whitespace.

**Variance:** Offset Asymmetric (6/10). The marketing hero is an asymmetric
split (copy left, illustration right on desktop; stacked with the
illustration behind a scrim on mobile). Card grids inside the app use a
2-column city grid and a horizontally snapping host carousel, never a
symmetric 3-equal-column row.

**Motion:** Fluid CSS (5/10), not Cinematic. A one-shot IntersectionObserver
reveal (fade + lift + blur-resolve) on scroll-in, custom cubic-bezier easing
throughout, tactile press/lift on buttons and cards. No scroll-jacking, no
parallax, no perpetual ambient loops — the app is meant to feel calm and
trustworthy (hospitality-exchange, not a product launch).

**Mood:** Warm accent against a cool ground. The signature tension of this
system is a rust-orange primary sitting on blue-tinted "paper" surfaces
with navy body text and warm pinkish-brown outlines — not a single-hue
palette, and not the generic AI-default indigo/violet ("LILA RULE" avoided
deliberately). It should read as considered and specific to this product,
not swapped in from a template.

## 2. Color Palette & Roles

All values are the Material 3 scheme this app already runs. Do not
substitute a different accent, a zinc/slate neutral base, or a
warmer/cooler grey — the cool-surface / warm-accent contrast IS the palette.

- **Cool Paper** (`#F7F9FF`) — page background (`--bg-page`). Never pure white.
- **Card White** (`#FFFFFF`) — card/panel fill (`--bg-card`), sits one step
  lighter than the page so elevation is legible without heavy shadow.
- **Surface Low** (`#EDF4FF`) — hover/pressed background tint.
- **Surface Container** (`#E7EEFE`) — chip/badge fill, selected-filter fill.
- **Surface High** (`#DAEAFE`) — highest-elevation container tint (modals, sheets).
- **Ink Navy** (`#0D1D2B`) — primary text (`--text-primary`). Not pure black.
- **Slate Secondary** (`#516071`) — secondary text, metadata, timestamps.
- **Umber Tertiary** (`#5A413A`) — tertiary text and the warm-on-cool
  `on-surface-variant`. Deliberately warm against the cool ink/slate above —
  this is the signature contrast, not an inconsistency to normalize away.
- **Rust Primary** (`#B22C00`) — the single accent. CTAs, links, active tab
  indicators, focus rings. Used identically everywhere; there is no second
  competing accent hue.
- **Rust Hover** (`#881F00`) — primary hover/pressed state.
- **Coral Container** (`#FF5F33`) — bright secondary-strength fill for
  gradients (promo banners) and high-emphasis chips. Never the primary CTA fill.
- **Blush Fixed** (`#FFDBD1`) — palest tint of the accent; selected-chip fill,
  badge backgrounds, the panel top-edge highlight.
- **Powder Secondary** (`#D1E1F5`) — secondary-container fill (vouch cards,
  quote blocks) — the app's one cool "content" tint distinct from the page ground.
- **Outline Warm** (`#8F7068`) — default 1px border color on cards and inputs.
- **Outline Blush** (`#E3BEB5`) — lighter border/divider variant.
- **Success Green** (`#2E7D32`) — verified badges, success states only.
- **Error Rust** (`#BA1A1A`) — form errors, emergency-alert accents, destructive actions.

**Banned for this project specifically:** any electric-blue, indigo, or
violet accent (an earlier iteration of this app used one and it was
deliberately replaced for reading as generic/AI-default); pure black text;
a second accent hue competing with rust; warm-grey and cool-grey mixed in
the same screen.

## 3. Typography Rules

- **Display / Headlines:** `Lexend`, weight 600–700. Track-tight at the
  largest size only (`-0.02em` at 40px, loosening to `0` by 24px and below).
  Hierarchy comes from size + weight, not decoration.
- **Body:** `Inter`, weights 400–600. Relaxed 1.6 line-height for paragraph
  text. `Inter` is the correct choice here — it is this system's actual
  body face, not a fallback to replace.
- **Scale** (matches the source design's own type tokens exactly):
  `12 / 14 / 16 / 18 / 20 / 24 / 28 / 32 / 40 px`. Do not introduce
  intermediate sizes.
- **No monospace anywhere** — this app has no code, timestamps, or
  high-density numeric tables that would call for one.
- **No serif anywhere** — the brand voice is direct and app-native, not editorial.

## 4. Component Stylings

- **Buttons:** Fully rounded pills (`border-radius: 9999px`), not rounded
  rectangles. Primary CTA height 56px with a soft navy-tinted shadow
  (`0 4px 12px rgba(13,29,43,0.08)`); default buttons 40–44px. Hover on
  primary = 1px lift + shadow; active/press = `scale(0.98)`, replacing the
  lift while held. No outer glow, ever.
- **Cards/Panels:** `border-radius: 12px` (not the exaggerated 24–32px
  squircle some templates default to), 1px warm outline border, a soft
  navy-tinted ambient shadow, plus a 1px inner top-edge highlight in
  **Blush Fixed** — the one cue that keeps a flat-color card from reading as
  a plain rectangle. Used for genuine content grouping only; list rows
  inside a screen (settings rows, chat threads) use a plain bottom divider
  instead of nested cards.
- **Chips/Filters:** 40px pill, unselected = white fill + warm outline;
  selected = **Blush Fixed** fill + **Rust Hover**-colored text, never a
  solid rust fill (that's reserved for primary CTAs).
- **Inputs:** Label above, 16px minimum font size on the field itself
  (smaller silently triggers iOS auto-zoom-on-focus, which is the fastest
  way a packaged app starts feeling like a website), helper text below in
  Slate Secondary, error text below in Error Rust. Focus = rust-tinted
  ring (`rgba(178,44,0,0.18)`), never the browser default blue.
- **Avatars:** Circular, photo with an initials fallback underneath (never a
  generic silhouette icon) so a broken/expired photo URL degrades to
  something identifiable rather than an empty circle.
- **Loading states:** Skeleton blocks matching the real layout's exact
  dimensions (already implemented per-route via Next's `loading.tsx`).
  Never a centered spinner.
- **Empty states:** Icon + one-line title + one supporting sentence + a
  clear next action (e.g. "Start a discussion"), never a bare grey sentence
  saying nothing exists. A brand-new account or an empty city is a normal
  state this product ships with, not an error.
- **Verified/trust badges:** Small pill, Success Green on its light tint,
  filled shield icon. Reserved for the identity-verification signal only —
  never reused for a marketing claim.

## 5. Layout Principles

- **Mobile-first, and mobile IS the primary target.** This build ships
  inside a Capacitor native-app shell; screens must read as a native app,
  not a responsive website, at phone width. Design at 375px first.
- Root/tab-level screens get a 56px top app bar (search • wordmark • inbox);
  pushed/detail screens get a back-arrow header instead. Never both, never neither.
- Bottom navigation: 5-item tab bar with a Material-3 pill indicator behind
  the active icon (not a full-row color change), filled icon when active /
  outline when inactive, plus a "More" sheet for secondary destinations.
  Top corners rounded, elevated with an upward shadow rather than a flat
  top border.
- No symmetric 3-equal-card feature rows. Use a 2-column grid (city cards),
  a horizontally snapping carousel (host cards, `scroll-snap-type: x mandatory`),
  or a vertical feed (vouches), depending on content shape.
- Container widths: `640px` (forms), `900px` (article/detail content),
  `1400px`-class outer bound on marketing sections. Centered with side padding,
  never a raw percentage/`calc()` grid hack.
- Full-height sections use `min-height: 100dvh`, never `100vh` (iOS Safari
  viewport jump).
- No stock photography anywhere in this app (no image storage exists for
  hero/marketing content) — hero and empty-state visuals are original SVG
  illustration in the same rust/navy palette, not photos.

## 6. Responsive Rules

- Breakpoint: `768px`. Below it, the desktop top nav and footer are fully
  hidden (`display: none`) — not just visually de-emphasized — and the
  bottom tab bar + app bar take over entirely. This is a hard swap, not a
  gradual collapse.
- No horizontal scroll except the two intentional snap-carousels (host
  cards, filter chips) — anything else overflowing horizontally on a phone
  is a bug.
- Headlines do not need `clamp()` here since the type scale is already a
  fixed token set per breakpoint (mobile gets `headline-lg-mobile` at 28px
  where desktop gets `headline-lg` at 32px) — pick the token, don't interpolate.
- Every tap target is at least 44×44px, 56px for primary actions.
- Safe-area insets (`env(safe-area-inset-bottom)`) are mandatory on the tab
  bar and any fixed bottom element — this is a packaged app with a home
  indicator to clear, not a browser tab.

## 7. Motion & Interaction

- Custom easing only: `cubic-bezier(0.16, 1, 0.3, 1)` at 150ms (micro),
  250ms (base), 350ms (slow). No `linear`, no default `ease`/`ease-in-out`.
- Scroll-triggered content reveal: fade + 20px lift + blur(6px)→blur(0),
  one-shot via `IntersectionObserver` (never a scroll-position listener),
  staggered by index in list contexts (`delay = min(i, 6) * 50ms`).
- Buttons: hover = lift + shadow; press = `scale(0.98)`, replacing the
  hover lift while held, not stacking with it.
- Cards in a list: press = `scale(0.97)` (`.press-card`), hover = 2px lift
  + shadow (`.panel-hover`) on devices that support hover.
- Animate `transform`/`opacity`/`filter` only — never `top`/`left`/`width`/`height`.
- `backdrop-filter: blur()` only on fixed/sticky chrome (app bar, header,
  tab bar) — never on a scrolling content container.
- No perpetual ambient loops (pulsing, floating, shimmering) on static
  content — reserved for skeleton loaders only, where the shimmer
  communicates "still loading."

## 8. Anti-Patterns (Banned)

- No invented statistics or social proof ("10,000+ stays", "50k members",
  "100% verified") — every number this app shows is a real row count from
  the database, including when that count is honestly zero.
- No stock photography or generic Unsplash-style imagery — original SVG
  illustration only, in-palette.
- No pricing language anywhere in the core product ("$X/month", "book now")
  — this is a free hospitality exchange, not a rental marketplace; a
  screen that implies payment is out of scope by product definition, not a style note.
  Donation amounts (Support page only) are the sole exception, clearly
  separate from the hosting flow.
- No electric-blue/indigo/violet accent (explicitly replaced already — see §2).
- No pure black text or backgrounds.
- No generic circular spinner — skeleton loaders only.
- No symmetric 3-equal-card rows.
- No emojis in UI copy (a 🚨 exists on one legacy emergency-alert button and
  is being phased out — do not add more).
- No AI-copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen",
  "Empower") — copy is plain and specific ("Belong anywhere you work", not
  "Elevate your travel experience").
- No fabricated testimonial names/quotes — the vouch feed and reviews only
  ever render real rows from the database; never seed placeholder people.
- No two headers stacked on one screen (top app bar AND back-arrow header
  together) — they are mutually exclusive by route type.
- No footer or persistent site-map chrome on mobile — this build is
  packaged for app stores and must not read as a website there.
