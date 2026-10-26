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
    id: 'craft',
    title: 'The craft',
    description:
      'Gold leaf marks one finished thing; the bead is piping; petal dust names a cake style, never a status. The ganache band and the cake keep their look in both themes.',
    tokens: [
      color('--gold', 'gold leaf: the price fleck, a confirmed tasting'),
      color('--gold-ink', 'gold as text (rare)'),
      color('--bead', 'bead borders and lace'),
      color('--petal-classic'),
      color('--petal-classic-ink'),
      color('--petal-modern'),
      color('--petal-modern-ink'),
      color('--petal-floral'),
      color('--petal-floral-ink'),
      color('--petal-naked'),
      color('--petal-naked-ink'),
      color('--petal-sculptural'),
      color('--petal-sculptural-ink'),
      color('--petal-flavour'),
      color('--petal-flavour-ink'),
      color('--band-bg', 'the ganache band (fixed)'),
      color('--band-ink'),
      color('--band-muted'),
      color('--band-accent'),
      color('--band-gold'),
      color('--cake-fondant', 'the cake (fixed)'),
      color('--cake-buttercream'),
      color('--cake-crumb'),
      color('--cake-stand'),
      color('--cake-petal-1'),
      color('--cake-petal-2'),
      color('--cake-petal-3'),
      color('--slice-lemon-elderflower-sponge', 'a flavour slice: crumb and filling (fixed, 0.4.0)'),
      color('--slice-lemon-elderflower-fill'),
      color('--slice-vanilla-raspberry-sponge'),
      color('--slice-vanilla-raspberry-fill'),
      color('--slice-chocolate-caramel-sponge'),
      color('--slice-chocolate-caramel-fill'),
      color('--slice-pistachio-rose-sponge'),
      color('--slice-pistachio-rose-fill'),
      color('--slice-earl-grey-honey-sponge'),
      color('--slice-earl-grey-honey-fill'),
      color('--slice-coconut-lime-sponge'),
      color('--slice-coconut-lime-fill'),
      color('--slice-hazelnut-praline-sponge'),
      color('--slice-hazelnut-praline-fill'),
      color('--slice-carrot-orange-sponge'),
      color('--slice-carrot-orange-fill'),
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
      time('--hold-success', 'how long "Booked" stays'),
      time('--dur-pipe', 'a mark piped on'),
      time('--dur-bead', 'a bead row arriving, once'),
      time('--dur-count', 'a figure rolling to its value'),
      time('--dur-turn', 'one turn of the turntable'),
      time('--dur-select', 'a chosen surface sliding'),
      time('--dur-stack', 'a tier set down'),
      time('--delay-tooltip', 'the first tooltip waits'),
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
  { name: 'Display', token: '--step-display', role: 'one headline per page (Fraunces, SOFT 100)', sample: 'The cake you’ll cut together' },
  { name: 'Step 3', token: '--step-3', role: 'section titles', sample: 'Built tier by tier' },
  { name: 'Step 2', token: '--step-2', role: 'card titles, the price range', sample: 'Peony cascade' },
  { name: 'Step 1', token: '--step-1', role: 'lead paragraphs, sub-groups', sample: 'Sugar flowers, shaped by hand, petal by petal' },
  { name: 'Step 0', token: '--step-0', role: 'body text (Figtree)', sample: 'Three tiers, 6, 8 and 10 inch, serve about 74. Taste six flavours with us before you choose.' },
  { name: 'Step -1', token: '--step--1', role: 'labels, captions, the compact table', sample: 'Sample price, with delivery within 20 miles' },
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
  { token: '--gold-ink', label: 'Gold as text', minimum: 4.5 },
  { token: '--gold', label: 'Gold leaf (ornament)', minimum: 3 },
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
  { id: 'petal-classic', label: 'Classic chip text', foreground: '--petal-classic-ink', background: '--petal-classic', minimum: 4.5 },
  { id: 'petal-modern', label: 'Modern chip text', foreground: '--petal-modern-ink', background: '--petal-modern', minimum: 4.5 },
  { id: 'petal-floral', label: 'Floral chip text', foreground: '--petal-floral-ink', background: '--petal-floral', minimum: 4.5 },
  { id: 'petal-naked', label: 'Naked chip text', foreground: '--petal-naked-ink', background: '--petal-naked', minimum: 4.5 },
  { id: 'petal-sculptural', label: 'Sculptural chip text', foreground: '--petal-sculptural-ink', background: '--petal-sculptural', minimum: 4.5 },
  { id: 'petal-flavour', label: 'Flavour cell text', foreground: '--petal-flavour-ink', background: '--petal-flavour', minimum: 4.5 },
  { id: 'band-ink', label: 'Band text (footer, toast)', foreground: '--band-ink', background: '--band-bg', minimum: 4.5 },
  { id: 'band-muted', label: 'Band secondary text', foreground: '--band-muted', background: '--band-bg', minimum: 4.5 },
  { id: 'band-accent', label: 'Band action (Undo)', foreground: '--band-accent', background: '--band-bg', minimum: 4.5 },
  { id: 'band-gold', label: 'Band gold (logo pearl)', foreground: '--band-gold', background: '--band-bg', minimum: 3 },
  { id: 'selection', label: 'Selected text', foreground: '--selection-ink', background: '--selection-bg', minimum: 4.5 },
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
    id: 'empty-state',
    title: 'EmptyState',
    summary: 'First use, no results with the query echoed, cleared. The empty cake board is piped on once.',
    states: ['first use', 'no results', 'cleared'],
    standard: 'COMPONENTS.md §Empty state',
  },
  {
    id: 'error-state',
    title: 'ErrorState',
    summary: 'A region that failed to load: the piped error ring, what still works, Try again.',
    states: ['shown', 'retrying', 'failed again'],
    standard: 'COMPONENTS.md §Error state',
  },
  { id: 'focus-ring', title: 'Focus ring and skip link', summary: 'One outline, 2 px with a 2 px offset; two-tone on pictures. The skip link appears on focus.', states: ['focus-visible', 'on a picture', 'skip link'], standard: 'COMPONENTS.md §Focus ring' },
  { id: 'icon', title: 'Icon (piped line set)', summary: '1.5 px strokes, round caps, a bead where a stroke ends; every stroke can be piped on.', states: ['decorative', 'piped on'], standard: 'COMPONENTS.md §Icon' },
  { id: 'logo', title: 'Logo', summary: 'The lace-edged board with a gold pearl; the wordmark’s i-dot is the pearl. On ink and on the band.', states: ['lockup', 'mark 16 / 32 / 64', 'on the band'], standard: 'COMPONENTS.md §Logo' },
  { id: 'bead-border', title: 'Bead border', summary: 'A row of piped dots that closes a group in place of a hairline; pipes in once on arrival.', states: ['full', 'short', 'arrival'], standard: 'COMPONENTS.md §Bead border' },
  { id: 'button', title: 'Button', summary: 'Primary garnet, secondary on fondant, quiet in garnet ink. One primary per screen. Never a pill, never gold.', states: ['idle', 'hover', 'focus', 'pressed', 'disabled (says why)', 'large'], standard: 'COMPONENTS.md §Button' },
  { id: 'icon-button', title: 'Icon button and toggle', summary: 'A named icon with a tooltip on hover (after 500 ms) and on focus; the heart is a toggle.', states: ['idle', 'hover', 'focus', 'pressed', 'on', 'pending', 'disabled'], standard: 'COMPONENTS.md §Icon button' },
  { id: 'link', title: 'Link', summary: 'Underlined in running text; stand-alone links name where they go; the current section gets a bead.', states: ['inline', 'stand-alone', 'current'], standard: 'COMPONENTS.md §Link' },
  { id: 'header', title: 'Header with phone menu', summary: 'Logo, five sections, theme, the primary action; a sheet behind Menu on phones; the bead border under it.', states: ['desktop', 'current section', 'menu open (phone)'], standard: 'COMPONENTS.md §Header' },
  { id: 'footer', title: 'Footer (ganache band)', summary: 'The same in both themes; the contact route always in the same place; says prices are samples.', states: ['idle', 'links'], standard: 'COMPONENTS.md §Footer' },
  { id: 'field', title: 'Field', summary: 'Label, hint, control, message. Errors show icon, words and edge; the ring is piped on after the text.', states: ['idle', 'filled', 'error', 'warning', 'success (real check)', 'read-only', 'pending', 'long value'], standard: 'COMPONENTS.md §Field' },
  { id: 'inputs', title: 'Select and textarea', summary: 'A select for six options or more; a textarea with a count that turns to warning ink at 90 %.', states: ['select', 'textarea with count', 'near the limit'], standard: 'COMPONENTS.md §Text input' },
  { id: 'search-field', title: 'Search field', summary: 'Filters as you type; Esc clears; the count under it; focus stays in the field.', states: ['filled', 'count', 'clear'], standard: 'COMPONENTS.md §Search field' },
  { id: 'number-stepper', title: 'Number stepper', summary: 'Tiers and guests: typing, arrows, Page Up/Down, Home/End; at a limit the button says why.', states: ['idle', 'at a limit', 'out of range'], standard: 'COMPONENTS.md §Number stepper' },
  { id: 'chapter-rail', title: 'Chapter rail', summary: 'A scroll story’s chapters on the ganache band: the current one lit, each a link that jumps to its chapter; scrolls sideways on a phone.', states: ['first lit', 'middle lit', 'narrow: scrolls sideways', 'focus'], standard: 'COMPONENTS.md §Chapter rail' },
  { id: 'film-player', title: 'Film player', summary: 'A rendered camera journey scrubbed by scroll: poster first, frames after first paint, key frames only under reduced motion, stills on phones.', states: ['poster', 'scrubbing', 'stills mode', 'reduced motion'], standard: 'COMPONENTS.md §Film player' },
  { id: 'segmented', title: 'Segmented control', summary: 'Shape and finish: the chosen surface slides over --dur-select; an impossible option says why.', states: ['selected', 'unavailable with a reason'], standard: 'COMPONENTS.md §Segmented control' },
  { id: 'choice-chips', title: 'Choice chips (style chips)', summary: 'Pearl chips in their style’s petal dust; choosing one lets the dust settle and pipes the tick.', states: ['unselected', 'selected', 'single', 'multiple', 'with count'], standard: 'COMPONENTS.md §Choice chips' },
  { id: 'checkbox', title: 'Checkbox', summary: 'An independent yes or no; the tick is piped on.', states: ['unchecked', 'checked'], standard: 'COMPONENTS.md §Checkbox' },
  { id: 'date-picker', title: 'Date picker', summary: 'A typed input and a designed month grid; unavailable days stay visible and say why; Monday weddings warn.', states: ['closed', 'open', 'selected', 'unavailable', 'today', 'error', 'loading the month'], standard: 'COMPONENTS.md §Date picker' },
  { id: 'time-slots', title: 'Time-slot picker', summary: 'Pearl pills in a radio group; a slot taken live changes its label in place and never moves.', states: ['populated', 'selected', 'full', 'just taken (live)', 'skeleton'], standard: 'COMPONENTS.md §Time-slot picker' },
  { id: 'file-input', title: 'File input', summary: 'Up to five pictures with progress and Cancel; refused files say why; the button always works.', states: ['empty', 'uploading', 'done', 'too large', 'wrong type', 'failed', 'full'], standard: 'COMPONENTS.md §File input' },
  { id: 'error-summary', title: 'Error summary', summary: '“There is a problem”, one link per error, same words as the fields; takes focus on a failed submit.', states: ['shown'], standard: 'COMPONENTS.md §Error summary' },
  { id: 'cake-card', title: 'Cake card', summary: 'A rendered study at 4:5 with its credit, the style chip and the facts; the picture box keeps the petal dust while loading or failed.', states: ['populated', 'long name', 'picture failed', 'skeleton'], standard: 'COMPONENTS.md §Cake card' },
  { id: 'flavour-card', title: 'Flavour card', summary: 'A pairing with allergens in words and an optimistic keep-for-tasting heart.', states: ['idle', 'kept', 'keeping', 'failed', 'box full'], standard: 'COMPONENTS.md §Flavour card' },
  { id: 'tasting-box', title: 'Tasting box', summary: 'Six slots you can count; full earns the gold fleck; removing offers Undo (the only toast).', states: ['partly full', 'full', 'first use'], standard: 'COMPONENTS.md §Tasting box' },
  { id: 'booking-card', title: 'Booking card', summary: 'The confirmed tasting, the one celebration: gild, one glint, petals once; takes focus.', states: ['appears', 'celebration'], standard: 'COMPONENTS.md §Booking card' },
  { id: 'servings-table', title: 'Servings table', summary: 'The tiers drawn to scale with measuring lines, and the portions table; the guest count marks a row.', states: ['first use', 'match', 'out of range', 'scrolls on a phone'], standard: 'COMPONENTS.md §Servings table' },
  { id: 'price-range', title: 'Price range', summary: 'The live sample price: figures roll in tabular figures, the fleck is gilded once, a complete design glints.', states: ['idle', 'updating', 'over budget'], standard: 'COMPONENTS.md §Price range' },
  { id: 'cake-stand', title: 'Cake stand', summary: 'The poster at first paint, the live 3D cake after; tiers are set down; rotate buttons, never a drag only.', states: ['poster', 'loading 3D', 'live', 'set a tier down', 'hero still', '3D failed'], standard: 'COMPONENTS.md §Cake stand' },
  { id: 'accordion', title: 'Accordion', summary: 'The questions: several open at once; the chevron turns; matches highlighted when searching.', states: ['collapsed', 'expanded'], standard: 'COMPONENTS.md §Accordion' },
  { id: 'dialog', title: 'Dialog and phone sheet', summary: 'A cake’s details: grows from 0.95 on desktop, slides up as a sheet on phones; focus to the heading and back.', states: ['closed', 'open', 'closing'], standard: 'COMPONENTS.md §Dialog' },
  { id: 'theme-toggle', title: 'Theme toggle', summary: 'Match my device, light or dark; stored and applied before first paint.', states: ['closed', 'open', 'chosen'], standard: 'COMPONENTS.md §Theme toggle' },
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
      'Fast: only “Saved”. Slow: pending at once, the spinner at 400 ms, then “Saved” for 1.5 s. Stalled: “Still saving…” at 8 s. Fail: the error beside the button and the typed value kept.',
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
    title: 'Load a list',
    summary: 'One region: skeleton on the first load, the list kept and dimmed on a refresh, empty and error states.',
    watch:
      'Fast: no indicator. Slow: the skeleton, or the dim and the bar, at 400 ms. Overdue: the no-results state. Fail: the error state with Try again, or an inline error over the kept list.',
  },
  {
    id: 'toast',
    title: 'Toasts and undo',
    summary: 'Delete with Undo, and a background export that reports back with a toast.',
    watch:
      'The toast is never the only way back: “Recently deleted” keeps the drafts. Hover or focus pauses it; F8 jumps to it; Escape closes it. A failed export stays until dismissed.',
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
  { id: 'pipe', title: 'Pipe', kind: 'one-shot', use: 'occasional: a tick on success, an error ring, the empty board', summary: 'A line draws on along its path like royal icing from a no. 1 nozzle; a bead appears where it lifts. Drawn at once under reduced motion.' },
  { id: 'bead', title: 'Bead', kind: 'one-shot', use: 'once per element: a group closes, a skeleton line', summary: 'A row of beads is piped in left to right. There at once under reduced motion.' },
  { id: 'gild', title: 'Gild', kind: 'one-shot', use: 'rare: the price fleck, a full tasting box, a booking', summary: 'Gold leaf pressed on: from 0.9 and a fade, once.' },
  { id: 'glint', title: 'Glint', kind: 'one-shot', use: 'reserved: unused since 0.3.0 (calmer motion); kept for a page hero only', summary: 'One soft band of gold light crosses, once. Skipped under reduced motion.' },
  { id: 'dust', title: 'Dust', kind: 'one-shot', use: 'frequent: a chip, a slot or a heart is chosen', summary: 'The petal dust settles into the chosen thing (opacity of a fill).' },
  { id: 'count', title: 'Count', kind: 'script', use: 'occasional: the price range changes', summary: 'A figure rolls to its new value in tabular figures, with no reflow; the final value is announced.' },
  { id: 'turn', title: 'Turn', kind: 'standing', use: 'while loading: the spinner', summary: 'The turntable: one bead rides the rim, linear, --dur-turn. Keeps turning, slower, under reduced motion.' },
  { id: 'stack', title: 'Stack', kind: 'one-shot', use: 'occasional: a tier is set down, a flavour joins the box', summary: 'Settles down by --travel-sm/lg with no bounce. In place under reduced motion.' },
  { id: 'petals', title: 'Petals', kind: 'script', use: 'once: the confirmed tasting, never a routine action', summary: 'Sugar petals fall for 1.2 s on a throwaway canvas. Skipped under reduced motion.' },
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
