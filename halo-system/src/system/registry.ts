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
    id: 'stages',
    title: 'Stages',
    description: 'The black and paper stages are fixed-look sections: the same in both themes. [data-stage] applies them.',
    tokens: [
      color('--stage-black-bg', 'the black infinity cove'),
      color('--stage-black-ink'),
      color('--stage-black-muted'),
      color('--stage-black-line-strong', 'a control edge on black'),
      color('--stage-black-raised', 'a track or panel on black'),
      color('--stage-paper-bg', 'the paper sweep'),
      color('--stage-paper-ink'),
      color('--stage-paper-muted'),
      color('--stage-paper-line-strong', 'a control edge on paper'),
      color('--accent-edge', 'the orange button edge (3:1 on paper)'),
      color('--toast-bg', 'the toast plate'),
      color('--toast-ink'),
    ],
  },
  {
    id: 'zones',
    title: 'Heart-rate zones (data)',
    description: 'Always with the zone number and name as the second encoding.',
    tokens: [
      color('--zone-1', 'Z1 easy'),
      color('--zone-2', 'Z2 aerobic'),
      color('--zone-3', 'Z3 tempo'),
      color('--zone-4', 'Z4 threshold'),
      color('--zone-5', 'Z5 max'),
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
      length('--tracking-heading'),
      num('--weight-display', 'the stage headline: light'),
      num('--weight-heading'),
      num('--weight-ui', 'buttons, labels'),
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
      length('--space-9'),
      length('--space-10'),
      length('--space-11', 'the widest section gap'),
      length('--gap-tight'),
      length('--gap-group'),
      length('--gap-section'),
      length('--inset-control'),
      length('--inset-card'),
      length('--gutter'),
      length('--container'),
      length('--container-text', 'statements and the footer line'),
      length('--sticky-top', 'the header bar'),
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
      length('--icon-stroke', 'one stroke for every icon'),
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
      time('--dur-scene', 'the product settling (900 ms)'),
      time('--dur-hero', 'the hero watch rising (1200 ms)'),
      time('--dur-turn', 'the product turning to another view'),
      time('--dur-sheen', 'one light sweep'),
      time('--dur-ring', 'one turn of the halo ring'),
      time('--dur-detent', 'one dial step'),
      time('--dur-reduced', 'the one fade under reduced motion'),
      time('--hold-success', 'how long "Saved" stays'),
      easing('--ease-standard'),
      easing('--ease-enter'),
      easing('--ease-exit'),
      easing('--ease-enter-emphasized'),
      easing('--ease-exit-emphasized'),
      easing('--ease-symmetric'),
      easing('--ease-weight', 'the product only: slow start, long settle'),
      length('--travel-sm', 'how far small things move'),
      length('--travel-md'),
      length('--travel-lg'),
      num('--scale-from', 'what an overlay grows from'),
      num('--press-scale', 'scale while pressed'),
      length('--press-depth', 'how far a press sinks'),
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
  { name: 'Display', token: '--step-display', role: 'the stage headline, weight 300, two lines at most', sample: 'Hold the pace.' },
  { name: 'Step 3', token: '--step-3', role: 'a stage statement, a big figure', sample: '14 days on one charge' },
  { name: 'Step 2', token: '--step-2', role: 'configurator and spec group titles, the price', sample: 'Choose your HALO' },
  { name: 'Step 1', token: '--step-1', role: 'lead sentences, row titles', sample: 'Dual-band GPS that holds in the city and under trees' },
  { name: 'Step 0', token: '--step-0', role: 'body text, 17 px', sample: 'Turn the side dial to step through your faces: pace, heart rate, split, swim and battery.' },
  { name: 'Step -1', token: '--step--1', role: 'labels, units, captions, legal', sample: '45 mm · Natural · Signal orange · From €599' },
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
  { id: 'accent-edge', label: 'The orange button edge against the ground', foreground: '--accent-edge', background: '--bg', minimum: 3 },
  { id: 'stage-black-ink', label: 'Ink on the black stage', foreground: '--stage-black-ink', background: '--stage-black-bg', minimum: 4.5 },
  { id: 'stage-black-muted', label: 'Muted on the black stage', foreground: '--stage-black-muted', background: '--stage-black-bg', minimum: 4.5 },
  { id: 'stage-black-line', label: 'Control edge on the black stage', foreground: '--stage-black-line-strong', background: '--stage-black-bg', minimum: 3 },
  { id: 'stage-paper-ink', label: 'Ink on the paper stage', foreground: '--stage-paper-ink', background: '--stage-paper-bg', minimum: 4.5 },
  { id: 'stage-paper-muted', label: 'Muted on the paper stage', foreground: '--stage-paper-muted', background: '--stage-paper-bg', minimum: 4.5 },
  { id: 'stage-paper-line', label: 'Control edge on the paper stage', foreground: '--stage-paper-line-strong', background: '--stage-paper-bg', minimum: 3 },
  { id: 'toast', label: 'Toast text on its plate', foreground: '--toast-ink', background: '--toast-bg', minimum: 4.5 },
  { id: 'zone-1', label: 'Zone 1 on the black stage', foreground: '--zone-1', background: '--stage-black-bg', minimum: 3 },
  { id: 'zone-5', label: 'Zone 5 on the black stage', foreground: '--zone-5', background: '--stage-black-bg', minimum: 3 },
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
    summary: 'A ring for work of unknown length. It keeps turning, slower, under reduced motion.',
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
    id: 'live-region',
    title: 'LiveRegion',
    summary: 'The announcer: one polite and one assertive region, mounted once. The log mirrors what it says.',
    states: ['polite', 'assertive'],
    standard: 'interaction.md §Focus and announcements',
  },
  {
    id: 'focus-skip',
    title: 'Focus ring and skip link',
    summary: 'Ink, never orange, so it stays visible beside the orange button; white on the black stage. The skip link is the first stop.',
    states: ['focus on paper', 'focus beside orange', 'focus on black', 'skip link'],
    standard: 'craft.md §States, COMPONENTS.md',
  },
  {
    id: 'button',
    title: 'Button',
    summary: 'Primary (the band orange, one per screen), secondary, quiet. The case corner, never a pill. A wait makes it an ActionButton.',
    states: ['idle', 'hover', 'pressed', 'focus-visible', 'large on black', 'unavailable with the reason'],
    standard: 'COMPONENTS.md §Button',
  },
  {
    id: 'icon-button',
    title: 'Icon button',
    summary: 'A 44 px target around a 20 px glyph; its name shows on focus, never on hover only.',
    states: ['idle', 'hover', 'pressed', 'focus-visible with label', 'toggle (save build)'],
    standard: 'COMPONENTS.md §Icon button',
  },
  {
    id: 'link',
    title: 'Link',
    summary: 'Underlined in running text; navigation links muted, ink when current. Never orange.',
    states: ['inline', 'navigation', 'current'],
    standard: 'COMPONENTS.md §Link',
  },
  {
    id: 'field',
    title: 'Field',
    summary: 'Label, hint, the input in a sunken well, a unit, and the message with an icon and a word.',
    states: ['empty', 'filled', 'error', 'warning', 'read-only, long value'],
    standard: 'COMPONENTS.md §Field, interaction.md §Forms',
  },
  {
    id: 'error-summary',
    title: 'Error summary',
    summary: 'After a failed submit of the order sheet: one link per error, focus moves here.',
    states: ['appears with links'],
    standard: 'COMPONENTS.md §Error summary',
  },
  {
    id: 'segmented',
    title: 'Segmented choice',
    summary: 'Case size: two options seen at once, a radio group with arrow keys.',
    states: ['selected', 'unselected', 'on black'],
    standard: 'COMPONENTS.md §Segmented choice',
  },
  {
    id: 'swatch',
    title: 'Swatch picker',
    summary: 'Band and case colours; the name is always printed; sold out is a stroke and words.',
    states: ['selected', 'unselected', 'sold out', 'finish'],
    standard: 'COMPONENTS.md §Swatch picker',
  },
  {
    id: 'dial',
    title: 'Dial control',
    summary: 'The side dial as a detent scale: drag, click a tick, step buttons or arrow keys. The orange index dips one detent at a time.',
    states: ['idle', 'stepped', 'dragged', 'focus-visible'],
    standard: 'COMPONENTS.md §Dial control',
  },
  {
    id: 'viewer',
    title: 'Product viewer',
    summary: 'The watch on its stage: a poster first, the 360° view on intent, settles on a build change, turns on input.',
    states: ['poster', 'loading frames', 'ready and turning', 'changing build (stale, settle)', 'error with Try again'],
    standard: 'COMPONENTS.md §Product viewer',
  },
  {
    id: 'price',
    title: 'Price summary',
    summary: 'Price, build and delivery; stale while the estimate runs; never moves what the person reads.',
    states: ['populated', 'stale', 'live change', 'skeleton', 'error'],
    standard: 'COMPONENTS.md §Price summary',
  },
  {
    id: 'order-bar',
    title: 'Order bar',
    summary: 'Sticky at the bottom once the configurator scrolls away: the build, the price and Pre-order.',
    states: ['shown', 'updating'],
    standard: 'COMPONENTS.md §Order bar',
  },
  {
    id: 'order-sheet',
    title: 'Order sheet',
    summary: 'The pre-order flow in a native dialog: a bottom sheet on phones, centred on desktop; the payment ends in every outcome.',
    states: ['closed', 'open', 'pending (known slow)', 'paid', 'declined', 'timed out'],
    standard: 'COMPONENTS.md §Order sheet',
  },
  {
    id: 'header',
    title: 'Header with phone menu',
    summary: 'Wordmark, four section links and Pre-order; on phones a disclosure menu (not a modal).',
    states: ['desktop', 'current section', 'phone, menu open'],
    standard: 'COMPONENTS.md §Header',
  },
  {
    id: 'footer',
    title: 'Footer',
    summary: 'The black stage: the study line, help in the same place on every page, legal, the theme switch.',
    states: ['idle'],
    standard: 'COMPONENTS.md §Footer',
  },
  {
    id: 'theme-switch',
    title: 'Theme switch',
    summary: 'System, Light, Dark for the chrome; the two stages keep their look.',
    states: ['system', 'light', 'dark'],
    standard: 'FOUNDATIONS.md §8',
  },
  {
    id: 'figure',
    title: 'Figure',
    summary: 'A number with its unit in muted text, tabular; illustrative numbers say so.',
    states: ['stage', 'inline', 'long value'],
    standard: 'COMPONENTS.md §Figure',
  },
  {
    id: 'spec-list',
    title: 'Spec list',
    summary: 'Grouped specifications as disclosures, compact density, hairlines between rows only.',
    states: ['collapsed', 'expanded', 'open all'],
    standard: 'COMPONENTS.md §Spec list',
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
    title: 'Save a build',
    summary: 'The action lifecycle in one button. Press it twice quickly: the second press is ignored.',
    watch:
      'Fast: only “Saved”. Slow: pending at once, the halo ring at 400 ms, then “Saved” for 1.5 s. Stalled: “Still saving…” at 8 s. Fail: the reason beside the button and the name kept.',
  },
  // HALO has no long jobs (INTERACTION.md, Long jobs); the list and the toast run in the scenarios Find your size
  // and Save your build, with the product's own nouns.
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
    summary: 'Saved builds and the size guide: first use, no results and cleared. Each replaces the region in the same reserved space. Nothing on HALO is locked.',
  },
  {
    id: 'error-pages',
    title: 'Error pages and failed loads',
    summary: 'The configurator failing to load, and the full-page errors: not found and server error. No maintenance page: a landing has none.',
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
  { id: 'sheen', title: 'Sheen', kind: 'one-shot', use: 'occasional: success, a finish revealed', summary: 'One soft band of studio light crosses the surface, on the weight curve, once.' },
  { id: 'settle', title: 'Settle', kind: 'one-shot', use: 'on input: a build change, a turn', summary: 'The product drops 16 px onto its stage and stops, no overshoot. The product only.' },
  { id: 'rise', title: 'Rise', kind: 'one-shot', use: 'once per load: the hero', summary: 'The watch rises 28 px into its contact shadow, which tightens as it lands.' },
  { id: 'detent', title: 'Detent', kind: 'one-shot', use: 'frequent: each dial step', summary: 'The orange index dips one pixel and back inside 100 ms, like a detent clicking.' },
  { id: 'ring', title: 'Halo ring', kind: 'standing', use: 'loading: a wait over 400 ms', summary: 'A half arc of the halo turning once every 1.6 s; at half speed under reduced motion.' },
  { id: 'stale', title: 'Stale bar', kind: 'standing', use: 'refresh: content on screen waiting', summary: 'Values go muted (still 4.5:1) under a 2 px ink bar.' },
  { id: 'cut', title: 'Stage cut', kind: 'standing', use: 'section change', summary: 'Black to paper with no fade and no slide: the stage is a set, not a slide.' },
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
