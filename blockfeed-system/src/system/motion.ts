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

const s = (ms: number) => ms / 1000

/**
 * Durations in ms (CSS: --dur-*). Product UI stays at 400 or below and most of it at 250 or below; 600 and 800
 * are for scenes on a landing page and must be scroll-linked or user-controlled when they run long.
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
  hero: 800,
} as const

/** A CSS `steps()` timing function as a plain easing function, so motion/react and canvas code step the same way. */
type Jump = 'start' | 'end' | 'none'
export function stepEase(count: number, jump: Jump): (t: number) => number {
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    if (jump === 'start') return Math.ceil(t * count) / count
    if (jump === 'none') return Math.min(1, Math.floor(t * count) / (count - 1))
    return Math.floor(t * count) / count
  }
}

/**
 * Easings (CSS: --ease-*). All stepped: motion lands in whole frames, the way a game screen redraws. `css` is the
 * exact string in tokens.css; the functions are what motion/react takes as `ease`.
 */
export const easeCss = {
  /** Moving or resizing while staying on screen: six frames. */
  standard: 'steps(6, end)',
  /** Entering, and in-place exits: the first frame already moved. */
  enter: 'steps(4, jump-start)',
  /** Permanent exits that leave the screen or their container: hold, then drop in three frames. */
  exit: 'steps(3, end)',
  /** Rare expressive entrances (a milestone). */
  enterEmphasized: 'steps(8, jump-start)',
  exitEmphasized: 'steps(6, end)',
  /** Loops and pulses: two states. */
  symmetric: 'steps(2, jump-none)',
} as const

export const ease = {
  standard: stepEase(6, 'end'),
  enter: stepEase(4, 'start'),
  exit: stepEase(3, 'end'),
  enterEmphasized: stepEase(8, 'start'),
  exitEmphasized: stepEase(6, 'end'),
  symmetric: stepEase(2, 'none'),
  linear: 'linear' as const,
}

/**
 * GSAP ease strings. GSAP's built-in `steps(n)` jumps at the end of each step; that is close enough for the rare
 * choreography GSAP would run here, and needs no plugin. Scrubbed values use `'none'`.
 */
export const gsapEase = {
  standard: 'steps(6)',
  enter: 'steps(4)',
  exit: 'steps(3)',
  enterEmphasized: 'steps(8)',
  exitEmphasized: 'steps(6)',
  symmetric: 'steps(2)',
  linear: 'none',
} as const

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

/** Distances in pixel units (CSS: --travel-*, calc(var(--u) * n)). Zero under reduced motion. */
export const distanceUnits = { sm: 4, md: 8, lg: 12 } as const
/** The same distances in px at GUI scale 2, for code that needs a number before it can measure `--u`. */
export const distance = { sm: 8, md: 16, lg: 24 } as const

/** The size of one pixel unit in CSS px right now (2, or 3 at GUI scale 3). */
export function unitPx(): number {
  if (typeof document === 'undefined') return 2
  return Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 2
}

/**
 * Nothing scales in this system (CSS: --scale-from, --press-scale): scaling resamples pixel art into uneven pixels.
 * Overlays rise by `distance.sm` instead, and a press sinks one unit (CSS: --press-travel).
 */
export const scaleFrom = 1
export const pressScale = 1
export const pressTravelUnits = 1

/** Loops that carry status (CSS: --dur-loop-*): spinner turn, indeterminate bar pass, skeleton blink cycle. */
export const loopMs = { spin: 800, slide: 1400, pulse: 1600 } as const

/** How long a finished state (a saved check, a swapped label) stays before it settles. */
export const holdMs = { success: 1500 } as const

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
  scene: { duration: s(durationMs['4xl']), ease: ease.enterEmphasized }, // one milestone beat
  /* the style's own effects (vfx/) */
  pop: { duration: s(durationMs.md), ease: ease.symmetric }, // a state flipped: two-frame hop
  glint: { duration: s(durationMs['3xl']), ease: ease.standard }, // new or special: a band of light crosses once
  pickup: { duration: s(durationMs['3xl']), ease: ease.linear }, // a gain flies to where it is kept (8 frames, built in)
  xp: { duration: s(durationMs['2xl']), ease: ease.standard }, // experience bar fills
  shake: { duration: s(durationMs['2xl']), ease: ease.linear }, // refused: whole-unit swings (built in)
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
  /** Menu, dropdown, popover: rises from its trigger by `distance.sm` in stepped frames; no scale. */
  popover: {
    initial: { opacity: 0, y: distance.sm },
    animate: { opacity: 1, y: 0, transition: transition.popoverIn },
    exit: { opacity: 0, transition: transition.popoverOut },
  },
  /** Dialog: rises into place; the backdrop uses `fade` with the same enter and exit durations. */
  modal: {
    initial: { opacity: 0, y: distance.sm },
    animate: { opacity: 1, y: 0, transition: transition.modalIn },
    exit: { opacity: 0, transition: transition.modalOut },
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
  duration: s(durationMs['4xl']),
  ease: gsapEase.enterEmphasized,
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

/** Travel in px for code that moves things itself (canvas, script), in whole units at the current scale: zero when reduced. */
export function travel(size: keyof typeof distanceUnits): number {
  return prefersReducedMotion() ? 0 : distanceUnits[size] * unitPx()
}

/** The scale an overlay starts from: always 1 here (kept so callers written to the starter API still work). */
export function scaleStart(): number {
  return scaleFrom
}
