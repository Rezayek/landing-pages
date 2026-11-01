/**
 * The registry: what the /system page shows, as data. SystemPage.tsx renders from these lists, so a token, a
 * component, a sequence or a pattern that is not listed here is not shown, and a listed one with no demo shows a
 * warning in its place. Phase 10 adds every component of the system's inventory here, with its states, and adds
 * the demo that draws it (the `DEMOS` tables in SystemPage.tsx).
 *
 * Tokens are listed by NAME only. The page reads their values from the live stylesheet, so a value that changes in
 * tokens.css changes on the page and nothing here goes stale. The names are the role names of tokens.css (the
 * contract of the system: roles are added, never renamed). A token listed but not defined shows as "not defined",
 * which is how a typo or a half-finished system shows up.
 */
export type TokenName = `--${string}`

export type TokenKind = 'color' | 'length' | 'radius' | 'time' | 'easing' | 'shadow' | 'number' | 'font'

export interface TokenSpec {
  readonly name: TokenName
  readonly kind: TokenKind
  /** One line: what the token is for. Shown under the name. */
  readonly note?: string
}

export interface TokenGroup {
  readonly id: string
  readonly title: string
  readonly description?: string
  readonly tokens: readonly TokenSpec[]
}

const make =
  (kind: TokenKind) =>
  (name: TokenName, note?: string): TokenSpec => ({ name, kind, note })
const color = make('color')
const length = make('length')
const radius = make('radius')
const time = make('time')
const easing = make('easing')
const shadow = make('shadow')
const num = make('number')
const font = make('font')

export const TOKEN_GROUPS: readonly TokenGroup[] = [
  {
    id: 'surfaces',
    title: 'Surfaces',
    description: 'Grounds that things sit on, one tone step apart.',
    tokens: [
      color('--bg', 'the page ground'),
      color('--surface', 'cards, panels, controls'),
      color('--raised', 'menus, dialogs, toasts'),
      color('--sunken', 'wells and inputs set into a surface'),
      color('--overlay', 'the scrim behind a dialog'),
    ],
  },
  {
    id: 'text',
    title: 'Text and lines',
    tokens: [
      color('--ink', 'body text'),
      color('--muted', 'secondary text'),
      color('--subtle', 'captions and placeholders'),
      color('--line', 'dividers'),
      color('--line-strong', 'the edge of a control'),
    ],
  },
  {
    id: 'accent',
    title: 'Accent and focus',
    tokens: [
      color('--accent', 'the primary action'),
      color('--accent-hover', 'the accent while hovered'),
      color('--on-accent', 'text on the accent'),
      color('--accent-ink', 'the accent as text'),
      color('--accent-bg', 'a quiet accent container'),
      color('--focus', 'the focus ring'),
    ],
  },
  {
    id: 'status',
    title: 'Status',
    description:
      'Info, success, warning and danger. Each is a set: a fill (with its text), a text-safe ink and a quiet container.',
    tokens: [
      color('--info'),
      color('--on-info'),
      color('--info-ink'),
      color('--info-bg'),
      color('--positive'),
      color('--on-positive'),
      color('--positive-ink'),
      color('--positive-bg'),
      color('--warning'),
      color('--on-warning'),
      color('--warning-ink'),
      color('--warning-bg'),
      color('--negative'),
      color('--on-negative'),
      color('--negative-ink'),
      color('--negative-bg'),
    ],
  },
  {
    id: 'states',
    title: 'Interaction states',
    tokens: [
      color('--hover-bg', 'hover layer'),
      color('--pressed-bg', 'pressed layer'),
      color('--selection-bg'),
      color('--selection-ink'),
      num('--disabled-opacity', 'content of a disabled control'),
      length('--focus-width'),
      length('--focus-offset'),
    ],
  },
  {
    id: 'type',
    title: 'Type',
    tokens: [
      font('--font-display'),
      font('--font-body'),
      num('--leading-body'),
      num('--leading-heading'),
      num('--leading-display'),
      length('--tracking-display'),
      length('--measure', 'longest line of body text'),
    ],
  },
  {
    id: 'space',
    title: 'Space',
    tokens: [
      length('--space-1'),
      length('--space-2'),
      length('--space-3'),
      length('--space-4'),
      length('--space-5'),
      length('--space-6'),
      length('--space-7'),
      length('--space-8'),
      length('--gap-tight'),
      length('--gap-group'),
      length('--gap-section'),
      length('--inset-control'),
      length('--inset-card'),
      length('--gutter'),
    ],
  },
  {
    id: 'shape',
    title: 'Shape',
    tokens: [
      radius('--radius-control', 'buttons and fields'),
      radius('--radius-card', 'cards and panels'),
      radius('--radius-sheet', 'sheets and dialogs'),
      radius('--radius-tag', 'tags'),
      length('--border', 'border width'),
    ],
  },
  {
    id: 'elevation',
    title: 'Elevation',
    tokens: [shadow('--shadow-raised', 'cards lifted off the ground'), shadow('--shadow-overlay', 'menus, toasts, dialogs')],
  },
  {
    id: 'sizes',
    title: 'Sizes',
    description: 'Heights are roles: a compact region or a coarse pointer changes them.',
    tokens: [
      length('--target-min', 'the smallest target'),
      length('--tap-min', 'primary actions and touch'),
      length('--control-h', 'button and field height'),
      length('--row-h', 'list row height'),
      length('--icon-sm'),
      length('--icon-md'),
      length('--icon-lg'),
    ],
  },
  {
    id: 'motion',
    title: 'Motion',
    description:
      'Press Play. Durations run on the enter curve; curves run over the sheet duration. Under reduced motion the travel and the press scale go and each one fades instead.',
    tokens: [
      time('--dur-press', 'press feedback'),
      time('--dur-hover'),
      time('--dur-popover-in'),
      time('--dur-modal-in'),
      time('--dur-sheet-in'),
      time('--dur-toast-in'),
      time('--dur-toast-out'),
      time('--dur-swap', 'content replacing content'),
      time('--dur-success-swap', 'the label swap on success'),
      time('--dur-route-in'),
      time('--dur-scene'),
      time('--dur-reduced', 'the one fade under reduced motion'),
      time('--hold-success', 'how long "Saved" stays'),
      easing('--ease-standard'),
      easing('--ease-enter'),
      easing('--ease-exit'),
      easing('--ease-enter-emphasized'),
      easing('--ease-exit-emphasized'),
      easing('--ease-symmetric'),
      length('--travel-sm', 'how far small things move'),
      length('--travel-md'),
      length('--travel-lg'),
      num('--scale-from', 'what an overlay grows from'),
      num('--press-scale', 'scale while pressed'),
    ],
  },
]

export interface TypeStep {
  readonly name: string
  readonly token: TokenName
  /** What the step is for. */
  readonly role: string
  /** Sample text. Neutral on purpose: it only has to show the shape of the letters. */
  readonly sample: string
}

export const TYPE_STEPS: readonly TypeStep[] = [
  { name: 'Display', token: '--step-display', role: 'one headline per page', sample: 'Plan the week' },
  { name: 'Step 3', token: '--step-3', role: 'section titles', sample: 'Plan the week' },
  { name: 'Step 2', token: '--step-2', role: 'sub-sections', sample: 'Plan the week ahead' },
  { name: 'Step 1', token: '--step-1', role: 'lead paragraphs, card titles', sample: 'Plan the week ahead with your team' },
  { name: 'Step 0', token: '--step-0', role: 'body text', sample: 'Plan the week ahead with your team, and see what changed since Friday.' },
  { name: 'Step -1', token: '--step--1', role: 'captions, labels, helper text', sample: 'Updated 4 minutes ago by Dana' },
]

/**
 * Contrast to measure, from the live values in the current theme. WCAG 2.2 AA: 4.5:1 for text, 3:1 for large text
 * and for the parts of a control that identify it. The matrix puts each text role on each surface it can sit on; the
 * pairs cover everything else.
 */
export interface ContrastRule {
  readonly token: TokenName
  readonly label: string
  readonly minimum: 3 | 4.5
}

export const CONTRAST_SURFACES: readonly { readonly token: TokenName; readonly label: string }[] = [
  { token: '--bg', label: 'Ground' },
  { token: '--surface', label: 'Surface' },
  { token: '--raised', label: 'Raised' },
  { token: '--sunken', label: 'Sunken' },
]

export const CONTRAST_TEXT: readonly ContrastRule[] = [
  { token: '--ink', label: 'Body text', minimum: 4.5 },
  { token: '--muted', label: 'Secondary text', minimum: 4.5 },
  { token: '--subtle', label: 'Captions', minimum: 4.5 },
  { token: '--accent-ink', label: 'Accent as text', minimum: 4.5 },
  { token: '--info-ink', label: 'Info text', minimum: 4.5 },
  { token: '--positive-ink', label: 'Success text', minimum: 4.5 },
  { token: '--warning-ink', label: 'Warning text', minimum: 4.5 },
  { token: '--negative-ink', label: 'Error text', minimum: 4.5 },
  { token: '--line-strong', label: 'Control edge', minimum: 3 },
  { token: '--focus', label: 'Focus ring', minimum: 3 },
]

export interface ContrastPair {
  readonly id: string
  readonly label: string
  readonly foreground: TokenName
  readonly background: TokenName
  readonly minimum: 3 | 4.5
}

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { id: 'on-accent', label: 'Text on the accent', foreground: '--on-accent', background: '--accent', minimum: 4.5 },
  { id: 'on-info', label: 'Text on the info fill', foreground: '--on-info', background: '--info', minimum: 4.5 },
  { id: 'on-positive', label: 'Text on the success fill', foreground: '--on-positive', background: '--positive', minimum: 4.5 },
  { id: 'on-warning', label: 'Text on the warning fill', foreground: '--on-warning', background: '--warning', minimum: 4.5 },
  { id: 'on-negative', label: 'Text on the danger fill', foreground: '--on-negative', background: '--negative', minimum: 4.5 },
  { id: 'accent-ink-bg', label: 'Accent text on its container', foreground: '--accent-ink', background: '--accent-bg', minimum: 4.5 },
  { id: 'info-ink-bg', label: 'Info text on its container', foreground: '--info-ink', background: '--info-bg', minimum: 4.5 },
  { id: 'positive-ink-bg', label: 'Success text on its container', foreground: '--positive-ink', background: '--positive-bg', minimum: 4.5 },
  { id: 'warning-ink-bg', label: 'Warning text on its container', foreground: '--warning-ink', background: '--warning-bg', minimum: 4.5 },
  { id: 'negative-ink-bg', label: 'Error text on its container', foreground: '--negative-ink', background: '--negative-bg', minimum: 4.5 },
  { id: 'accent-fill', label: 'Accent fill against a surface', foreground: '--accent', background: '--surface', minimum: 3 },
  { id: 'info-fill', label: 'Info fill against a surface', foreground: '--info', background: '--surface', minimum: 3 },
  { id: 'positive-fill', label: 'Success fill against a surface', foreground: '--positive', background: '--surface', minimum: 3 },
  { id: 'warning-fill', label: 'Warning fill against a surface', foreground: '--warning', background: '--surface', minimum: 3 },
  { id: 'negative-fill', label: 'Danger fill against a surface', foreground: '--negative', background: '--surface', minimum: 3 },
]

/**
 * Every component of the system, with the states its matrix shows. `id` ties it to its demo in SystemPage.tsx.
 * A component the inventory (COMPONENTS.md) names and this list does not is not built yet.
 */
export interface ComponentEntry {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly states: readonly string[]
  /** Where its rules are written, in the workflow skill's guides. */
  readonly standard: string
}

export const COMPONENTS: readonly ComponentEntry[] = [
  {
    id: 'brand',
    title: 'Mark and wordmark',
    summary: 'The Screen-slash mark (a TV with two acid slashes) and the live wordmark, on night and on paper.',
    states: ['mark 64', 'mark 16', 'wordmark', 'on paper'],
    standard: 'craft.md §Logo',
  },
  {
    id: 'button',
    title: 'Button and ButtonLink',
    summary: 'Thick-outline pills in the display face. Primary is acid (one per screen); they squash on press and spring back with an overshoot.',
    states: ['primary', 'secondary', 'quiet', 'hover', 'focus', 'pressed (squash)', 'disabled with reason', 'large link'],
    standard: 'COMPONENTS.md §Button',
  },
  {
    id: 'tape',
    title: 'Tape label and sticker',
    summary: 'Tilted tape and die-cut stickers for short labels. Never interactive.',
    states: ['acid', 'signal', 'paper', 'night', 'burst sticker', 'round sticker'],
    standard: 'COMPONENTS.md §Tape label and sticker',
  },
  {
    id: 'screen',
    title: 'Screen (CRT frame)',
    summary: 'Rounded, outlined, one clipped corner, scanlines, a channel number. Holds pictures and state cards.',
    states: ['populated', 'loading', 'error-loading'],
    standard: 'COMPONENTS.md §Screen',
  },
  {
    id: 'section-header',
    title: 'Section header',
    summary: 'Channel chip, H2 with one outlined phrase, plain sub-line. Works on night and on paper.',
    states: ['on night', 'on paper'],
    standard: 'COMPONENTS.md §Section header',
  },
  {
    id: 'signal-states',
    title: 'No signal and Signal lost',
    summary: 'The empty state and the error state as test cards, each with the cause and the way forward.',
    states: ['empty (no results)', 'error with retry'],
    standard: 'interaction.md §Empty states, §Errors',
  },
  {
    id: 'tabs',
    title: 'Tabs',
    summary: 'ARIA tabs (arrows, Home, End). The panel flips like a channel change.',
    states: ['idle', 'selected', 'hover', 'focus', 'pressed', 'flip on change'],
    standard: 'COMPONENTS.md §Tabs',
  },
  {
    id: 'chips',
    title: 'Filter chips',
    summary: 'Single-choice toggle buttons with a check as well as the fill.',
    states: ['unselected', 'selected', 'hover', 'focus', 'pressed'],
    standard: 'COMPONENTS.md §Filter chips',
  },
  {
    id: 'stock-gauge',
    title: 'Stock gauge',
    summary: 'A four-bar signal meter with the count in words. Bars drop when stock falls; nothing pulses.',
    states: ['plenty', 'selling fast', 'sold out', 'drop'],
    standard: 'COMPONENTS.md §Stock gauge',
  },
  {
    id: 'radio-cards',
    title: 'Radio cards (tiers, days)',
    summary: 'Native radios under chunky cards; the selected card gets the acid outline; a sold-out one stays readable with its reason.',
    states: ['unselected', 'selected', 'featured', 'disabled (sold out)', 'focus'],
    standard: 'COMPONENTS.md §Tier card group',
  },
  {
    id: 'fields',
    title: 'Quantity stepper and email field',
    summary: 'The typed value is kept and validated, never clamped silently; errors sit under the field.',
    states: ['idle', 'limit', 'error', 'email error'],
    standard: 'interaction.md §Forms',
  },
  {
    id: 'ticket-stub',
    title: 'Ticket stub',
    summary: 'The result of a hold, where the button was: summary, countdown, study note, and Change passes as the undo.',
    states: ['held', 'ending soon', 'expired'],
    standard: 'COMPONENTS.md §Ticket stub',
  },
  {
    id: 'channel-card',
    title: 'Channel card, save and copy link',
    summary:
      'One guest as a card made to be shared: a band in one of three tones, the art, an ON AIR tape, the name plate and a sign-off. Save card image draws it as a PNG to post (the share sheet on phones); Copy channel link copies its address and, if the clipboard refuses, says where the link is.',
    states: ['signal tone', 'acid tone', 'cyan tone', 'art loading', 'save idle', 'saved', 'save failed', 'copy idle', 'copied', 'refused'],
    standard: 'COMPONENTS.md §Channel card',
  },
  {
    id: 'accordion',
    title: 'Accordion',
    summary: 'Native details and summary: works without JavaScript.',
    states: ['collapsed', 'expanded', 'focus'],
    standard: 'COMPONENTS.md §Accordion',
  },
  {
    id: 'sheet',
    title: 'Sheet',
    summary: 'A native modal dialog: bottom sheet on phones, centred from 768 px. Focus in and back.',
    states: ['closed', 'open'],
    standard: 'COMPONENTS.md §Sheet',
  },
  {
    id: 'motion-switch',
    title: 'Reduce motion switch',
    summary: 'Sets data-motion="reduced" on html and remembers it on this device.',
    states: ['off', 'on'],
    standard: 'motion.md §Reduced motion',
  },
  {
    id: 'signal-effects',
    title: 'Signal effects (the motion language)',
    summary: 'Slam, wipe, flip, tune-in, signal-bars and halftone: the treatments of MOTION-SYSTEM.md §Theme expression.',
    states: ['slam', 'wipe', 'flip', 'tune-in', 'loader', 'skeleton'],
    standard: 'expression.md',
  },
  {
    id: 'action-button',
    title: 'ActionButton',
    summary:
      'Starts work and shows it in itself. The pending state is set in the same event, a repeat press is ignored, the width never changes and the result is announced.',
    states: ['idle', 'hover', 'focus', 'pressed', 'pending', 'slow', 'success', 'error', 'disabled'],
    standard: 'interaction.md §Actions',
  },
  {
    id: 'spinner',
    title: 'Spinner',
    summary: 'Four signal bars that light in turn for work of unknown length, always with a label; under reduced motion two bars stay lit and the label carries it.',
    states: ['small', 'medium', 'large'],
    standard: 'interaction.md §Loading',
  },
  {
    id: 'skeleton',
    title: 'Skeleton',
    summary: 'Shaped like the content that is coming, from the same layout, so the swap moves nothing. Static under reduced motion.',
    states: ['heading', 'text', 'rect', 'circle', 'next to the loaded row'],
    standard: 'interaction.md §Loading, Skeletons',
  },
  {
    id: 'region',
    title: 'Region',
    summary: 'One loading region: a skeleton on the first load, the old content dimmed with a bar on a refresh, one announcement per wait.',
    states: ['first load', 'refreshing', 'loaded'],
    standard: 'interaction.md §Loading',
  },
  {
    id: 'inline-message',
    title: 'InlineMessage',
    summary: 'A message beside the thing it is about. Icon and title carry the tone as well as the colour.',
    states: ['info', 'success', 'warning', 'error', 'with action', 'dismissible'],
    standard: 'interaction.md §Notifications',
  },
  {
    id: 'live-region',
    title: 'LiveRegion',
    summary: 'The announcer: one polite and one assertive region, mounted once. The log mirrors what it says.',
    states: ['polite', 'assertive'],
    standard: 'interaction.md §Focus and announcements',
  },
]

/**
 * Interactive demos, each driven by the latency control and each ending in every outcome. `id` is also the value of
 * the `data-sequence` attribute on the demo, which is how a capture script finds it.
 */
export interface SequenceEntry {
  readonly id: string
  readonly title: string
  readonly summary: string
  /** What to look for. */
  readonly watch: string
}

export const SEQUENCES: readonly SequenceEntry[] = [
  {
    id: 'hold',
    title: 'Hold passes (the page\x27s primary action)',
    summary: 'The ticket hold: pending in the button, the signal loader after 400 ms, then the ticket stub ejects in place; a failure sits under the button with Try again.',
    watch:
      'Fast: only the stub. Slow: “Holding your passes…” and the bars at 400 ms, then the stub. Stalled: “Still holding. Stay here.” at 8 s. Fail: the message under the button, the picks kept, Try again.',
  },
  {
    id: 'submit',
    title: 'Submit an action',
    summary: 'A button that saves. Press it twice quickly: the second press is ignored.',
    watch:
      'Fast: only “Saved”. Slow: pending at once, the spinner at 400 ms, then “Saved” for 1.5 s. Stalled: “Still saving…” at 8 s. Fail: the error beside the button and the typed value kept.',
  },
  {
    id: 'list',
    title: 'Load a list',
    summary: 'One region: skeleton on the first load, the list kept and dimmed on a refresh, empty and error states.',
    watch:
      'Fast: no indicator. Slow: the skeleton, or the dim and the bar, at 400 ms. Overdue: the no-results state. Fail: the error state with Try again, or an inline error over the kept list.',
  },
]

/** Empty states and error pages of the project: every list, table, feed and chart in the inventory has its variants. */
export interface PatternEntry {
  readonly id: string
  readonly title: string
  readonly summary: string
}

export const PATTERNS: readonly PatternEntry[] = [
  {
    id: 'empty-states',
    title: 'Empty states',
    summary: 'First use, no results, cleared and locked. Each replaces the region in the same reserved space.',
  },
  {
    id: 'error-pages',
    title: 'Error pages and failed loads',
    summary: 'A region that failed to load, and the three full-page errors: not found, server error and service unavailable.',
  },
]

export type EffectKind = 'standing' | 'one-shot' | 'script'

export interface EffectEntry {
  readonly id: string
  readonly title: string
  readonly kind: EffectKind
  /** How often it may play (guides/motion.md, Should it move at all). */
  readonly use: string
  readonly summary: string
}

/**
 * The effect primitives in ./vfx (guides/expression.md). Phase 8 keeps the ones the style contract uses, tunes them,
 * adds the style's own effects here and removes the rest. Each one has a demo in the Effects section.
 */
export const EFFECTS: readonly EffectEntry[] = [
  { id: 'ignite', title: 'Ignite', kind: 'standing', use: 'frequent: hover and focus', summary: 'The edge lights in the effect colour. Colour and shadow only, at the hover duration.' },
  { id: 'scanlines', title: 'Scanlines', kind: 'standing', use: 'texture, still', summary: 'A line texture behind the content. Never moves by itself.' },
  { id: 'noise', title: 'Noise', kind: 'standing', use: 'texture, still', summary: 'Film grain or signal noise from an SVG turbulence, blended over the surface.' },
  { id: 'sweep', title: 'Sweep', kind: 'one-shot', use: 'occasional: success, arrival', summary: 'A band of light crosses the element once.' },
  { id: 'scan', title: 'Scan', kind: 'one-shot', use: 'occasional: loading start, refresh', summary: 'One bright line passes top to bottom.' },
  { id: 'glitch', title: 'Glitch', kind: 'one-shot', use: 'rare: error, route change', summary: 'Slices shift with a chromatic split, under 300 ms, once.' },
  { id: 'shake', title: 'Shake', kind: 'one-shot', use: 'occasional: error garnish', summary: 'Three swings of 5 px or less, under 300 ms. The error text shows first.' },
  { id: 'pulse', title: 'Pulse', kind: 'one-shot', use: 'occasional: success, new item', summary: 'A ring leaves the edge once.' },
  { id: 'wipe', title: 'Wipe', kind: 'one-shot', use: 'occasional: enter, reveal', summary: 'A clip reveal from one side. A short fade under reduced motion.' },
  { id: 'flicker', title: 'Flicker', kind: 'one-shot', use: 'rare: a sign or label switching on', summary: 'Two dips in 600 ms, small elements only: under three flashes a second.' },
  { id: 'decode', title: 'Decode', kind: 'script', use: 'occasional: a value or code arriving', summary: 'Glyphs resolve into the text left to right; the real text is announced at once.' },
  { id: 'burst', title: 'Burst', kind: 'script', use: 'rare: a milestone, never a routine action', summary: 'A short particle burst from the centre, on a throwaway canvas.' },
]

export interface SystemSection {
  readonly id: string
  readonly title: string
}

/** The sections of the page, in order. The navigation is built from this. */
export const SECTIONS: readonly SystemSection[] = [
  { id: 'tokens', title: 'Tokens' },
  { id: 'contrast', title: 'Contrast' },
  { id: 'type', title: 'Type' },
  { id: 'components', title: 'Components' },
  { id: 'sequences', title: 'Sequences' },
  { id: 'scenarios', title: 'Scenarios' },
  { id: 'patterns', title: 'Patterns' },
  { id: 'effects', title: 'Effects' },
]
