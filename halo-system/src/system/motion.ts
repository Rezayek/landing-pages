/**
 * Motion tokens and presets as code.
 *
 * The same values as `tokens.css` (the CSS source) and the tables in `MOTION-SYSTEM.md`. Change all three in one
 * commit and add a changelog line to MOTION-SYSTEM.md. Components import from here and never write a raw
 * duration, curve or spring.
 *
 * - motion/react: `transition.*`, `spring.*` and `preset.*` are transition objects (seconds). Wrap the app in
 *   <MotionConfig reducedMotion={reducedMotionSetting()}>.
 * - GSAP: call `registerGsapEases(CustomEase)` once, then pass `gsapEase.*` as `ease` strings.
 * - CSS: use the `--dur-*` and `--ease-*` custom properties in `tokens.css`, never the numbers.
 * - No runtime dependency: `motion` is imported for types only.
 */
import type { Transition } from 'motion/react'

type Bezier = [number, number, number, number]
const s = (ms: number) => ms / 1000

/**
 * Durations in ms (CSS: --dur-*). Product UI stays at 400 or below and most of it at 250 or below. `scene` (900)
 * and `hero` (1200) are HALO's product moves: the watch turning, rising and settling on its stage. They run once,
 * or follow the person's own input (a swatch, the turn buttons), never on a loop.
 */
export const durationMs = {
  instant: 0,
  xs: 50,
  sm: 100,
  md: 150,
  lg: 200,
  xl: 250,
  '2xl': 300,
  '3xl': 400,
  '4xl': 600,
  scene: 900,
  hero: 1200,
} as const

/** Easings as cubic-bezier control points (CSS: --ease-*). */
const bezierEase = {
  /** Moving or resizing while staying on screen; panels that stay recallable. */
  standard: [0.2, 0, 0, 1],
  /** Entering, and in-place exits (decelerate: the first frames already move). */
  enter: [0, 0, 0, 1],
  /** Permanent exits that leave the screen or their container, 200 ms or shorter (accelerate). */
  exit: [0.3, 0, 1, 1],
  /** Expressive entrances on the landing page. */
  enterEmphasized: [0.05, 0.7, 0.1, 1],
  exitEmphasized: [0.3, 0, 0.8, 0.15],
  /** Loops and pulses only. */
  symmetric: [0.42, 0, 0.58, 1],
  /** A heavy object: slow start (mass), long settle, no overshoot. The product's moves only, never UI. */
  weight: [0.45, 0, 0.1, 1],
} satisfies Record<string, Bezier>

export const ease = { ...bezierEase, linear: 'linear' as const }

/**
 * GSAP ease names. GSAP has no cubic-bezier strings of its own: register these once with CustomEase
 * (`gsap.registerPlugin(CustomEase); registerGsapEases(CustomEase)`), then use the name as `ease`.
 * Constant motion and scrubbed values use `'none'`.
 */
export const gsapEase = {
  standard: 'ui-standard',
  enter: 'ui-enter',
  exit: 'ui-exit',
  enterEmphasized: 'ui-enter-emphasized',
  exitEmphasized: 'ui-exit-emphasized',
  symmetric: 'ui-symmetric',
  weight: 'halo-weight',
  linear: 'none',
} as const

export function registerGsapEases(CustomEase: { create: (id: string, data: string) => unknown }): void {
  for (const [key, points] of Object.entries(bezierEase) as [keyof typeof bezierEase, Bezier][]) {
    CustomEase.create(gsapEase[key], points.join(',')) // four numbers = a cubic-bezier
  }
}

/** The media queries GSAP's matchMedia and CSS use. */
export const mediaQuery = {
  reduce: '(prefers-reduced-motion: reduce)',
  noPreference: '(prefers-reduced-motion: no-preference)',
} as const

/**
 * Springs for anything gesture-driven, retargetable or physical. Always set bounce explicitly: the library
 * default overshoots. Opacity and colour never use a bouncy spring.
 */
export const spring = {
  /** Small controls: switches, press, indicators. */
  fast: { type: 'spring', visualDuration: 0.2, bounce: 0 },
  /** Panels, sheets, layout reflow, shared elements. */
  default: { type: 'spring', visualDuration: 0.35, bounce: 0 },
  /** Full-screen moves and landing hero objects. */
  slow: { type: 'spring', visualDuration: 0.55, bounce: 0 },
  /** Only at the end of a flick or drag that had momentum, or one deliberate celebration. */
  playful: { type: 'spring', visualDuration: 0.35, bounce: 0.2 },
  /** The product released after a drag-to-turn: heavy, critically damped, it settles on the nearest view. */
  product: { type: 'spring', visualDuration: 0.9, bounce: 0 },
} as const satisfies Record<string, Transition>

/**
 * Stiffness, damping and mass for libraries that want physics instead of duration and bounce
 * (Apple's duration/bounce model: mass 1; bounce 0 is critically damped).
 */
export function springPhysics(visualDuration: number, bounce: number): { stiffness: number; damping: number; mass: number } {
  const stiffness = (2 * Math.PI / visualDuration) ** 2
  const damping =
    bounce >= 0 ? (4 * Math.PI * (1 - bounce)) / visualDuration : (4 * Math.PI) / (visualDuration + 4 * Math.PI * bounce)
  return { stiffness, damping, mass: 1 }
}

/** A spring by name, with bounce 0 under reduced motion. Use it wherever a spring is chosen at run time. */
export function springFor(name: keyof typeof spring): Transition {
  return prefersReducedMotion() ? { ...spring[name], bounce: 0 } : spring[name]
}

/** Distances in px (CSS: --travel-*). Zero under reduced motion. */
export const distance = { sm: 8, md: 16, lg: 28 } as const

/** Scale an overlay starts from (never 0) and the press scale (CSS: --scale-from, --press-scale). */
export const scaleFrom = 0.96
export const pressScale = 0.98
/** How far a press sinks, in px (CSS: --press-depth). */
export const pressDepth = 1

/** How long a finished state (a saved check, a swapped label) stays before it settles. */
export const holdMs = { success: 1500 } as const

/** HALO's own durations by role (CSS: --dur-detent, --dur-turn, --dur-sheen, --dur-ring). */
export const haloMs = { detent: durationMs.sm, turn: durationMs.scene, sheen: durationMs.scene, ring: 1600 } as const

/** Stagger for a first reveal only: never on revisits, filter or sort changes, or an update the person triggered. */
export const stagger = {
  /** Rows, cells, menu items and cards inside the app. Items at or beyond `maxItems` appear at once. */
  ui: { stepMs: 30, maxItems: 10, maxSpreadMs: 270 },
  /** Hero and feature groups on the landing page. */
  scene: { stepMs: 60, maxItems: 6, maxSpreadMs: 400 },
} as const

/** Delay in seconds for item `index` of `count`: the step shrinks so the total spread stays inside the cap. */
export function staggerDelay(index: number, count: number, kind: keyof typeof stagger = 'ui'): number {
  if (prefersReducedMotion()) return 0
  const { stepMs, maxItems, maxSpreadMs } = stagger[kind]
  const n = Math.min(count, maxItems)
  if (n < 2 || index < 1) return 0
  const step = Math.min(stepMs, maxSpreadMs / (n - 1))
  return s(step * Math.min(index, n - 1))
}

/** Duration in seconds for a move of `px`: grows with travel, clamped to 150-400 ms (a project formula; derived). */
export function durationForTravel(px: number): number {
  return s(Math.min(durationMs['3xl'], Math.max(durationMs.md, durationMs.md + 0.25 * px)))
}

/**
 * Named transitions by role (CSS: --dur-<role>, --ease-<role>). Exits are shorter than their enters.
 * Properties animated: transform and opacity only.
 */
export const transition = {
  press: { duration: s(durationMs.sm), ease: ease.enter },
  hover: { duration: s(durationMs.sm), ease: ease.enter }, // colour and opacity only
  tooltipIn: { duration: s(durationMs.md), ease: ease.enter }, // the first tooltip waits; neighbours open at 0 ms
  tooltipOut: { duration: s(durationMs.sm), ease: ease.enter },
  popoverIn: { duration: s(durationMs.md), ease: ease.enter },
  popoverOut: { duration: s(durationMs.sm), ease: ease.enter },
  modalIn: { duration: s(durationMs.xl), ease: ease.enter },
  modalOut: { duration: s(durationMs.lg), ease: ease.enter },
  sheetIn: { duration: s(durationMs['3xl']), ease: ease.standard }, // a sheet you can recall ends at rest
  sheetOut: { duration: s(durationMs['2xl']), ease: ease.standard },
  toastIn: { duration: s(durationMs.xl), ease: ease.enter },
  toastOut: { duration: s(durationMs.lg), ease: ease.exit }, // leaves the way it came in
  disclosure: { duration: s(durationMs.lg), ease: ease.standard },
  listIn: { duration: s(durationMs.lg), ease: ease.enter },
  listOut: { duration: s(durationMs.md), ease: ease.enter },
  tab: { duration: s(durationMs.lg), ease: ease.standard },
  routeIn: { duration: s(durationMs.xl), ease: ease.enter },
  routeOut: { duration: s(durationMs.lg), ease: ease.exit },
  swap: { duration: s(durationMs.lg), ease: ease.enter }, // skeleton to content, same size, no layout shift
  successSwap: { duration: s(durationMs.md), ease: ease.enter }, // label or icon cross-fade; hold `holdMs.success`
  scene: { duration: s(durationMs.scene), ease: ease.weight }, // the product settling on its stage
  hero: { duration: s(durationMs.hero), ease: ease.weight }, // the hero watch rising into its shadow
  turn: { duration: s(haloMs.turn), ease: ease.weight }, // the product turning to another view or build
  detent: { duration: s(haloMs.detent), ease: ease.standard }, // the dial's index stepping one detent
  /** What a transform-based transition becomes under reduced motion: a short opacity cross-fade. */
  reduced: { duration: s(durationMs.sm), ease: ease.linear },
} satisfies Record<string, Transition>

/** initial / animate / exit sets for motion/react components. `MotionConfig` drops the transforms when reduced. */
export const preset = {
  /** Fade in place: route content, skeleton to content, status text. */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transition.swap },
    exit: { opacity: 0, transition: transition.routeOut },
  },
  /** Menu, dropdown, popover: grows from its trigger (set transform-origin to the trigger's anchor). */
  popover: {
    initial: { opacity: 0, scale: scaleFrom },
    animate: { opacity: 1, scale: 1, transition: transition.popoverIn },
    exit: { opacity: 0, scale: scaleFrom, transition: transition.popoverOut },
  },
  /** Dialog: grows from the centre; the backdrop uses `fade` with the same enter and exit durations. */
  modal: {
    initial: { opacity: 0, scale: scaleFrom },
    animate: { opacity: 1, scale: 1, transition: transition.modalIn },
    exit: { opacity: 0, scale: scaleFrom, transition: transition.modalOut },
  },
  /** Toast: slides in from its edge and leaves the same way. */
  toast: {
    initial: { opacity: 0, y: distance.md },
    animate: { opacity: 1, y: 0, transition: transition.toastIn },
    exit: { opacity: 0, y: distance.md, transition: transition.toastOut },
  },
  /** List item insert and remove; use `layout` with `spring.default` for reorders and let siblings close the gap. */
  listItem: {
    initial: { opacity: 0, y: distance.sm },
    animate: { opacity: 1, y: 0, transition: transition.listIn },
    exit: { opacity: 0, transition: transition.listOut },
  },
} as const

/** GSAP defaults for one landing page beat: gsap.to(el, { ...gsapScene, y: 0, opacity: 1 }). */
export const gsapScene = {
  duration: s(durationMs.scene),
  ease: gsapEase.weight,
  stagger: s(stagger.scene.stepMs),
} as const

/* Reduced motion ---------------------------------------------------------------------------------------------- */

/**
 * True when the operating system asks for reduced motion or the in-app setting (`data-motion="reduced"` on
 * <html>) is on. Assumes reduced on the server, so the first client render never moves things that should stay still.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  if (document.documentElement.dataset.motion === 'reduced') return true
  return window.matchMedia(mediaQuery.reduce).matches
}

/** For useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => true). Returns the unsubscribe. */
export function subscribeReducedMotion(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const query = window.matchMedia(mediaQuery.reduce)
  query.addEventListener('change', listener)
  const observer = new MutationObserver(listener)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] })
  return () => {
    query.removeEventListener('change', listener)
    observer.disconnect()
  }
}

/** The value for <MotionConfig reducedMotion>: the in-app setting forces it on, otherwise the system decides. */
export function reducedMotionSetting(): 'always' | 'user' {
  if (typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduced') return 'always'
  return 'user'
}

/** Travel in px for code that moves things itself (GSAP, canvas): zero when reduced. */
export function travel(size: keyof typeof distance): number {
  return prefersReducedMotion() ? 0 : distance[size]
}

/** The scale an overlay starts from: 1 (no scale) when reduced. */
export function scaleStart(): number {
  return prefersReducedMotion() ? 1 : scaleFrom
}
