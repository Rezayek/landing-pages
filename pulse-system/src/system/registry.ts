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
      num('--weight-display'),
      num('--weight-legend'),
      length('--tracking-legend', 'engraved legends'),
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
    id: 'instrument',
    title: 'Instrument',
    description: 'The OLED and the scope are the same black glass in both finishes; the LED is the one amber light.',
    tokens: [
      color('--oled-bg', 'OLED and scope glass'),
      color('--oled-ink', 'OLED text'),
      color('--oled-muted', 'OLED second line'),
      color('--scope-grid', 'graticule (decorative)'),
      color('--trace-1', 'the signal'),
      color('--trace-2', 'the envelope'),
      color('--trace-3', 'the LFO (dashed)'),
      color('--led-on'),
      color('--led-off'),
      color('--knob-cap'),
      color('--key-white'),
      color('--key-black'),
      color('--skeleton-slot', 'vent slots'),
      length('--knob-size'),
      length('--knob-size-lg'),
      length('--key-w'),
      length('--key-w-fine'),
      length('--key-h'),
      length('--key-travel', 'how far a key sinks'),
      font('--font-readout', 'Doto, readouts only'),
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
      time('--dur-invert', 'a press shows its negative'),
      time('--dur-led', 'an LED snaps'),
      time('--dur-type', 'a readout types on'),
      time('--dur-power-on', 'two dips, then on'),
      time('--dur-knob', 'detent glide on a patch load'),
      time('--dur-spin', 'one cycle of the pending dots, 3 steps'),
      easing('--ease-step', 'steps(4)'),
      easing('--ease-step-fine', 'steps(8)'),
      easing('--ease-type', 'steps(16)'),
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
  { name: 'Display', token: '--step-display', role: 'one headline per page', sample: 'Twist it.' },
  { name: 'Step 3', token: '--step-3', role: 'section titles', sample: 'One voice, four waves' },
  { name: 'Step 2', token: '--step-2', role: 'module headings', sample: 'The filter you can hear move' },
  { name: 'Step 1', token: '--step-1', role: 'lead paragraphs, OLED line 1', sample: 'Lower the cutoff and the sound gets darker.' },
  { name: 'Step 0', token: '--step-0', role: 'body text', sample: 'Attack 12 ms, decay 340 ms, sustain 60 %, release 800 ms. The note hits at once and fades out slowly.' },
  { name: 'Step -1', token: '--step--1', role: 'captions, helper text, the spec list', sample: 'Up to 16 characters. It shows on the screen.' },
  { name: 'Legend', token: '--step-legend', role: 'engraved panel legends, capitals, 125 % width', sample: 'CUTOFF  RESONANCE  ATTACK' },
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
  { id: 'oled-ink', label: 'OLED text on the glass', foreground: '--oled-ink', background: '--oled-bg', minimum: 4.5 },
  { id: 'oled-muted', label: 'OLED second line on the glass', foreground: '--oled-muted', background: '--oled-bg', minimum: 4.5 },
  { id: 'trace-1', label: 'Signal trace on the scope', foreground: '--trace-1', background: '--scope-bg', minimum: 3 },
  { id: 'trace-3', label: 'LFO trace on the scope', foreground: '--trace-3', background: '--scope-bg', minimum: 3 },
  { id: 'key-hint', label: 'Key hint on a white key', foreground: '--key-white-ink', background: '--key-white', minimum: 4.5 },
  { id: 'accent-on-sunken', label: 'Knob arc on a well', foreground: '--accent', background: '--sunken', minimum: 3 },
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
    summary: 'The OLED dot ellipsis for work of unknown length: three dots that light one by one. Under reduced motion they hold lit.',
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
    id: 'progress-bar',
    title: 'ProgressBar',
    summary: 'Determinate or indeterminate, always with a verb and a count. Never backwards. Cancel for anything past 10 s.',
    states: ['indeterminate', '0%', 'partial', 'complete', 'with cancel'],
    standard: 'interaction.md §Loading, Determinate progress',
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
    id: 'toast',
    title: 'Toast',
    summary: 'Short and non-modal. Errors and anything with an action stay until dismissed. Text is spoken through the announcer.',
    states: ['neutral', 'info', 'success', 'warning', 'error', 'with action'],
    standard: 'interaction.md §Notifications, Toasts',
  },
  {
    id: 'button',
    title: 'Button',
    summary: 'An instant action with no wait: a key cap with a machined edge. Pressing inverts it for one step and sinks it 3 px.',
    states: ['primary (backlit key)', 'secondary', 'quiet', 'hover', 'focus', 'pressed'],
    standard: 'COMPONENTS.md §Button',
  },
  {
    id: 'link',
    title: 'Link',
    summary: 'Navigation only. Inline links underline in amber ink; the current section carries aria-current.',
    states: ['inline', 'hover', 'focus', 'current'],
    standard: 'COMPONENTS.md §Link',
  },
  {
    id: 'site-rail',
    title: 'Header and footer rails',
    summary: 'The instrument\'s top and bottom rails: mark, in-page links, the finish switch and a phone menu; the study notice and the Reduce motion switch.',
    states: ['wide', 'phone menu closed', 'phone menu open', 'skip link on focus'],
    standard: 'COMPONENTS.md §Header and footer',
  },
  {
    id: 'knob',
    title: 'Knob',
    summary: 'Every continuous value: a knurled cap, a 300° amber arc and an engraved legend. Slider pattern; click the arc to jump; ± buttons on touch.',
    states: ['idle', 'hover', 'focus', 'dragged', 'patch-load glide'],
    standard: 'COMPONENTS.md §Knob',
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    summary: 'One or two octaves of real keys. Pointer, touch, Enter or Space, and the computer keys A to K. Sound off still moves the keys.',
    states: ['idle', 'pressed', 'released', 'sound off', 'focus'],
    standard: 'COMPONENTS.md §Keyboard',
  },
  {
    id: 'waveform',
    title: 'Waveform selector',
    summary: 'A radio group of jacks: the selected one lights. Arrow keys move and select.',
    states: ['unselected', 'selected', 'hover', 'focus', 'pressed'],
    standard: 'COMPONENTS.md §Waveform selector',
  },
  {
    id: 'sound-switch',
    title: 'Sound switch',
    summary: 'Starts the real Web Audio engine. The page\'s one backlit key until the sound is on; blocked and no-device errors sit under it.',
    states: ['off', 'starting', 'on', 'blocked', 'no device'],
    standard: 'COMPONENTS.md §Sound switch',
  },
  {
    id: 'led',
    title: 'LED',
    summary: 'A status light, always with its word. Blinks only while live or saving, never over 3 times a second.',
    states: ['off', 'on', 'blink', 'positive', 'warning', 'negative'],
    standard: 'COMPONENTS.md §LED indicator',
  },
  {
    id: 'oled',
    title: 'OLED readout',
    summary: 'Black glass, Doto, 16 characters a line. New values type on one character per step.',
    states: ['idle', 'live value', 'pending', 'error', 'off'],
    standard: 'COMPONENTS.md §OLED readout',
  },
  {
    id: 'scope',
    title: 'Scope',
    summary: 'WebGL2 trace of the real analyser with a short afterglow, loaded after first paint behind an SVG poster. Pause control; text readout as the alternative.',
    states: ['poster', 'no signal', 'live', 'clip', 'paused'],
    standard: 'COMPONENTS.md §Scope',
  },
  {
    id: 'envelope',
    title: 'Envelope display',
    summary: 'The ADSR the four knobs set, redrawn as they turn; the edited stage brightens.',
    states: ['idle', 'editing', 'playing'],
    standard: 'COMPONENTS.md §Envelope display',
  },
  {
    id: 'patch-list',
    title: 'Patch list',
    summary: 'The bank: a filter of jacks over a listbox. Loading, saving, sync and failure show as an LED and a word on the row.',
    states: ['populated', 'skeleton', 'selected', 'row pending', 'saving', 'waiting to sync', 'synced', 'couldn\'t sync'],
    standard: 'COMPONENTS.md §Patch list',
  },
  {
    id: 'patch-name-field',
    title: 'Patch name field',
    summary: 'One field in a sunken well, set in the OLED face so the name looks the way the screen will show it.',
    states: ['idle', 'focus', 'filled', 'error', 'long value'],
    standard: 'COMPONENTS.md §Field',
  },
  {
    id: 'page-keys',
    title: 'Page keys',
    summary: 'The row of keys that switches a synth panel’s control banks (Main, Voice, Mod & FX, Loop), the open bank’s LED lit. The WAI-ARIA tabs pattern.',
    states: ['idle', 'hover', 'focus', 'selected (LED on)', 'pressed'],
    standard: 'COMPONENTS.md §Page keys',
  },
  {
    id: 'fader',
    title: 'Fader',
    summary: 'A long-throw vertical slider in a machined slot: the envelope\'s A D S R. Press anywhere on the track to jump, drag to follow, arrows to step.',
    states: ['idle', 'focus', 'dragged', 'min', 'max'],
    standard: 'COMPONENTS.md §Fader',
  },
  {
    id: 'step-loop',
    title: 'Step loop',
    summary: '32 steps of notes or chords played through the engine at a tempo: four patterns, a generated one, play and stop, 32 lit pads.',
    states: ['stopped', 'playing', 'pattern picked', 'new pattern', 'reduced motion (unchanged: it is sound)'],
    standard: 'COMPONENTS.md §Step loop',
  },
  {
    id: 'finish-switch',
    title: 'Finish switch',
    summary: 'The theme as a hardware finish: Graphite or Bone. Remembered on this device.',
    states: ['graphite', 'bone', 'focus'],
    standard: 'COMPONENTS.md §Finish switch',
  },
  {
    id: 'spec-list',
    title: 'Spec list',
    summary: 'Specifications as a description list, every figure with its unit, marked as invented.',
    states: ['populated'],
    standard: 'COMPONENTS.md §Spec list',
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
    id: 'submit',
    title: 'Submit an action',
    summary: 'A button that saves. Press it twice quickly: the second press is ignored.',
    watch:
      'Fast: only “Saved”. Slow: pending at once, the stepping dots at 400 ms, then “Saved” for 1.5 s. Stalled: “Still saving…” at 8 s. Fail: the error beside the button and the typed value kept.',
  },
  {
    id: 'job',
    title: 'Long work and cancel',
    summary: 'Work known to be slow: accepted in 120 ms, then determinate progress, with Cancel past 10 s.',
    watch:
      'Very slow and stalled: the leave-and-notify line and Cancel. Fail: the job stops partway, says what was kept and offers to start again.',
  },
  {
    id: 'list',
    title: 'Load the patch bank',
    summary: 'One region: vent-slot rows on the first load, the bank kept at full ink under the busy bar on a refresh, empty and error states.',
    watch:
      'Fast: no indicator. Slow: the vent-slot rows, or the kept bank under the busy bar, at 400 ms. Yours: the no-results state. Clear the bank: the first-use state. Fail: the error state with Try again, or an inline error over the kept bank.',
  },
  {
    id: 'toast',
    title: 'Toasts and undo',
    summary: 'Delete with Undo, and a background export that reports back with a toast.',
    watch:
      'The toast is never the only way back: “Recently deleted” keeps the patches. Hover or focus pauses it; F8 jumps to it; Escape closes it. A failed export stays until dismissed.',
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
  { id: 'invert', title: 'Invert', kind: 'one-shot', use: 'frequent: every press', summary: 'The cap shows its negative for one step. Colour only, so it stays under reduced motion.' },
  { id: 'power-on', title: 'Power on', kind: 'one-shot', use: 'occasional: a module, message, row or toast arriving', summary: 'Two short dips, then on. Never more than two, never over 3 a second.' },
  { id: 'type-on', title: 'Type on', kind: 'script', use: 'occasional: a value or word arriving', summary: 'Text types on one character per step. The whole text is set at once for screen readers.' },
  { id: 'led-flash', title: 'LED flash', kind: 'one-shot', use: 'occasional: success', summary: 'The LED snaps on with a short bloom, once.' },
  { id: 'clip', title: 'Clip', kind: 'one-shot', use: 'occasional: error', summary: 'The frame shows a negative edge for one step and keeps a thin one. No shake.' },
  { id: 'dots', title: 'Dots', kind: 'standing', use: 'while a readout waits', summary: 'A stepped ellipsis after a pending readout. Static "..." under reduced motion.' },
  { id: 'led-blink', title: 'LED blink', kind: 'standing', use: 'while live or saving', summary: 'Two blinks a second at most. Steady on under reduced motion.' },
  { id: 'vent-scan', title: 'Vent scan', kind: 'standing', use: 'skeletons, for 5 s', summary: 'Vent-slot rows light one by one in steps, then hold still.' },
  { id: 'spin-step', title: 'Dot step', kind: 'standing', use: 'the pending dots', summary: 'The three readout dots light one by one, 3 steps a cycle. Under reduced motion they hold lit: still saying “working”.' },
  { id: 'dim', title: 'Dim', kind: 'standing', use: 'offline modules', summary: 'Text drops to the subtle tone, still readable at 4.5:1.' },
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
