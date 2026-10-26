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
      font('--font-mono'),
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
      time('--dur-decode', 'the code receipt’s decode, per group'),
      time('--dur-charge', 'a charge bar filling'),
      time('--dur-spin', 'one spinner turn'),
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
  {
    id: 'deal',
    title: 'Deal and data',
    description: 'Volt means the deal: the buy action, the discount tag, the saving. Data colours carry a second encoding.',
    tokens: [
      color('--deal', 'discount tag, lowest-price marker'),
      color('--on-deal', 'text on the deal fill'),
      color('--deal-ink', '“You save” as text'),
      color('--deal-bg', 'the saving’s container'),
      color('--data-1', 'series 1: solid line'),
      color('--data-2', 'series 2: square marker'),
      color('--data-3', 'series 3: dashed line, diamonds'),
    ],
  },
  {
    id: 'receipt',
    title: 'Receipt (fixed look)',
    description: 'The delivered-code surface keeps its paper look in both themes; no theme re-points it.',
    tokens: [color('--band-bg'), color('--band-ink'), color('--band-muted'), color('--band-line')],
  },
  {
    id: 'cuts',
    title: 'Cuts',
    description: 'Square corners with a 45° cut on the top-right and bottom-left, by role.',
    tokens: [length('--cut-control', 'buttons, fields'), length('--cut-card', 'cards, dialogs'), length('--cut-tag', 'tags, checkboxes')],
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
  { name: 'Display', token: '--step-display', role: 'one headline per page', sample: 'Keys for less' },
  { name: 'Step 3', token: '--step-3', role: 'screen titles, the large price', sample: 'Neon Drift $23.99' },
  { name: 'Step 2', token: '--step-2', role: 'section titles', sample: 'Price drops for you' },
  { name: 'Step 1', token: '--step-1', role: 'card prices, dialog titles, keys', sample: '7KQ4M-XP2RD-9HT6W' },
  { name: 'Step 0', token: '--step-0', role: 'body text', sample: 'EU key. It won’t activate in the US. Codes usually arrive in about 1 min.' },
  { name: 'Step -1', token: '--step--1', role: 'labels, tables, helper text', sample: 'Lowest in 90 days · Order VC-48213' },
  { name: 'Step -2', token: '--step--2', role: 'platform and discount tags only', sample: 'PS5 · −60%' },
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
  { token: '--deal-ink', label: 'Saving as text', minimum: 4.5 },
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
  { id: 'on-deal', label: 'Text on the deal fill', foreground: '--on-deal', background: '--deal', minimum: 4.5 },
  { id: 'deal-ink-bg', label: 'Saving text on its container', foreground: '--deal-ink', background: '--deal-bg', minimum: 4.5 },
  { id: 'band-ink', label: 'Receipt text on paper', foreground: '--band-ink', background: '--band-bg', minimum: 4.5 },
  { id: 'band-muted', label: 'Receipt muted text on paper', foreground: '--band-muted', background: '--band-bg', minimum: 4.5 },
  { id: 'data-1', label: 'Data series 1 on a surface', foreground: '--data-1', background: '--surface', minimum: 3 },
  { id: 'data-2', label: 'Data series 2 on a surface', foreground: '--data-2', background: '--surface', minimum: 3 },
  { id: 'data-3', label: 'Data series 3 on a surface', foreground: '--data-3', background: '--surface', minimum: 3 },
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
    id: 'focus-ring',
    title: 'Focus ring',
    summary:
      'One global outline, 2 px off the control, cyan; two-tone on covers. Never removed.',
    states: ['shown', 'on image'],
    standard: 'COMPONENTS.md §Focus ring',
  },
  {
    id: 'skip-link',
    title: 'Skip link',
    summary:
      'The first tab stop: jumps to main. Hidden until focused.',
    states: ['hidden', 'focus-visible'],
    standard: 'COMPONENTS.md §Skip link',
  },
  {
    id: 'visually-hidden',
    title: 'Visually hidden text',
    summary:
      'Names for icon buttons and units for readouts.',
    states: ['static'],
    standard: 'COMPONENTS.md §Visually hidden text',
  },
  {
    id: 'theme-switch',
    title: 'Theme switch',
    summary:
      'System, light, dark as a radio group; stored and applied before first paint.',
    states: ['system', 'light', 'dark'],
    standard: 'COMPONENTS.md §Theme switch',
  },
  {
    id: 'button',
    title: 'Button',
    summary:
      'Primary (one per screen: black block with a volt label in daylight, volt block at night), secondary, quiet, danger, icon-only. Cut corners.',
    states: ['idle', 'hover', 'focus', 'pressed', 'disabled with reason', 'icon-only', 'large'],
    standard: 'COMPONENTS.md §Button',
  },
  {
    id: 'link',
    title: 'Link',
    summary:
      'Inline (underlined), stand-alone, quiet, current page.',
    states: ['idle', 'hover', 'focus', 'current'],
    standard: 'COMPONENTS.md §Link',
  },
  {
    id: 'segmented',
    title: 'Segmented control',
    summary:
      'Two to five views that apply at once: grid or table.',
    states: ['unselected', 'selected', 'hover', 'focus'],
    standard: 'COMPONENTS.md §Button group',
  },
  {
    id: 'menu',
    title: 'Menu button',
    summary:
      'Sort and account menus; single choice marked with a check.',
    states: ['closed', 'open', 'item focus', 'checked'],
    standard: 'COMPONENTS.md §Menu button',
  },
  {
    id: 'wishlist-toggle',
    title: 'Wishlist toggle',
    summary:
      'Optimistic save; rolls back with a toast pointing at it on failure.',
    states: ['off', 'on', 'pending (optimistic)', 'rollback', 'with label'],
    standard: 'INTERACTION.md §Optimistic allow-list',
  },
  {
    id: 'copy-button',
    title: 'Copy button',
    summary:
      'Copies a key; confirms in place; on failure selects the code.',
    states: ['idle', 'copied', 'failed'],
    standard: 'COMPONENTS.md §Copy button',
  },
  {
    id: 'tooltip',
    title: 'Tooltip',
    summary:
      'The visible name of icon buttons; hover after 500 ms, focus at once, Esc.',
    states: ['open'],
    standard: 'COMPONENTS.md §Tooltip',
  },
  {
    id: 'logo',
    title: 'Logo',
    summary:
      'Cut V mark and the hand-drawn wordmark, one colour; minimum 16 px.',
    states: ['lockup', 'mark 16 px', 'mark', 'wordmark'],
    standard: 'DESIGN.md §Logo',
  },
  {
    id: 'field',
    title: 'Field',
    summary:
      'Label, hint, and one line for error, warning, success or a pending check.',
    states: ['idle', 'error', 'pending', 'warning', 'success', 'read-only', 'disabled'],
    standard: 'COMPONENTS.md §Field',
  },
  {
    id: 'text-input',
    title: 'Text input',
    summary:
      'With prefix; inputmode decimal for prices.',
    states: ['idle', 'focus', 'filled'],
    standard: 'COMPONENTS.md §Text input',
  },
  {
    id: 'search-input',
    title: 'Search input',
    summary:
      'Search icon becomes the spinner while searching; clear; the / shortcut.',
    states: ['idle', 'filled', 'pending'],
    standard: 'COMPONENTS.md §Search input',
  },
  {
    id: 'textarea',
    title: 'Textarea with count',
    summary:
      'Counts down; warns near the limit; never blocks typing.',
    states: ['idle', 'near limit', 'over limit'],
    standard: 'COMPONENTS.md §Textarea',
  },
  {
    id: 'password',
    title: 'Password',
    summary:
      'Show toggle, Caps Lock warning, paste allowed.',
    states: ['hidden', 'shown', 'caps lock'],
    standard: 'COMPONENTS.md §Password',
  },
  {
    id: 'code-input',
    title: 'Code input',
    summary:
      'One input grouped 5×5 in mono; paste in any format.',
    states: ['partial', 'complete', 'checking', 'valid', 'error'],
    standard: 'COMPONENTS.md §Code input',
  },
  {
    id: 'select',
    title: 'Select',
    summary:
      'The designed listbox (select-only combobox): value, chevron, a raised list with descriptions, a check on the chosen one; arrows, Home/End, type-ahead, Esc. Native picker on request.',
    states: ['idle', 'placeholder', 'open', 'active option', 'selected', 'disabled option', 'loading options', 'error', 'native'],
    standard: 'COMPONENTS.md §Select',
  },
  {
    id: 'combobox',
    title: 'Combobox',
    summary:
      'Suggestions with price readouts; arrows move; nothing auto-selected.',
    states: ['closed', 'pending', 'populated', 'active option', 'empty', 'error'],
    standard: 'COMPONENTS.md §Combobox',
  },
  {
    id: 'checkbox',
    title: 'Checkbox',
    summary:
      'With counts and an indeterminate parent.',
    states: ['unselected', 'selected', 'indeterminate', 'disabled'],
    standard: 'COMPONENTS.md §Checkbox',
  },
  {
    id: 'radio',
    title: 'Radio group',
    summary:
      'Two to five choices seen together.',
    states: ['unselected', 'selected', 'with description'],
    standard: 'COMPONENTS.md §Radio group',
  },
  {
    id: 'switch',
    title: 'Switch',
    summary:
      'Saves itself; the word On or Off beside the track; rolls back on failure.',
    states: ['off', 'on', 'saving', 'not saved', 'disabled with reason'],
    standard: 'COMPONENTS.md §Switch',
  },
  {
    id: 'slider',
    title: 'Range slider',
    summary:
      'Two thumbs plus number inputs: the click and keyboard alternative to dragging.',
    states: ['idle', 'focus', 'dragged'],
    standard: 'COMPONENTS.md §Slider',
  },
  {
    id: 'stepper',
    title: 'Quantity stepper',
    summary:
      'Minus becomes remove at 1; max 5 with a hint.',
    states: ['idle', 'at 1 (remove)', 'at max'],
    standard: 'COMPONENTS.md §Quantity stepper',
  },
  {
    id: 'date',
    title: 'Date input and picker',
    summary:
      'Typed dates always work; the calendar is an aid.',
    states: ['idle', 'open', 'today', 'selected', 'future disabled', 'error'],
    standard: 'COMPONENTS.md §Date input',
  },
  {
    id: 'fieldset',
    title: 'Fieldset',
    summary:
      'Groups fields under a legend; group error.',
    states: ['idle', 'error'],
    standard: 'COMPONENTS.md §Fieldset',
  },
  {
    id: 'error-summary',
    title: 'Error summary',
    summary:
      'Takes focus on a failed submit; links to each field.',
    states: ['shown'],
    standard: 'interaction.md §A failed submit',
  },
  {
    id: 'payment',
    title: 'Payment fields',
    summary:
      'Wallet first, then the card fields; Pay with the total; 60 s budget.',
    states: ['idle', 'field error', 'paying', 'waiting for the bank', 'declined'],
    standard: 'COMPONENTS.md §Payment fields',
  },
  {
    id: 'top-bar',
    title: 'Top bar',
    summary:
      'Store shell and the checkout flow shell.',
    states: ['store', 'flow'],
    standard: 'COMPONENTS.md §App shell',
  },
  {
    id: 'sidebar',
    title: 'Sidebar',
    summary:
      'Account screens; collapses to a rail.',
    states: ['expanded', 'current', 'collapsed'],
    standard: 'COMPONENTS.md §Sidebar',
  },
  {
    id: 'tab-bar',
    title: 'Mobile tab bar',
    summary:
      'Five destinations with counts.',
    states: ['idle', 'current', 'badge'],
    standard: 'COMPONENTS.md §Mobile tab bar',
  },
  {
    id: 'command-menu',
    title: 'Command menu',
    summary:
      'Search overlay opened by / or Ctrl+K.',
    states: ['closed', 'open'],
    standard: 'COMPONENTS.md §Command menu',
  },
  {
    id: 'tabs',
    title: 'Tabs',
    summary:
      'Views of one subject with counts; automatic activation.',
    states: ['idle', 'selected', 'empty panel'],
    standard: 'COMPONENTS.md §Tabs',
  },
  {
    id: 'breadcrumbs',
    title: 'Breadcrumbs and back link',
    summary:
      'The trail on desktop; the parent as a back link on phones.',
    states: ['trail', 'current', 'back link'],
    standard: 'COMPONENTS.md §Breadcrumbs',
  },
  {
    id: 'pagination',
    title: 'Pagination and load more',
    summary:
      'Numbered pages for orders; Load more for the catalogue.',
    states: ['current', 'disabled ends', 'load more pending'],
    standard: 'COMPONENTS.md §Pagination',
  },
  {
    id: 'steps',
    title: 'Step indicator',
    summary:
      'Cart, Pay, Get your code; the connector charges.',
    states: ['step 1', 'step 2', 'step 3'],
    standard: 'COMPONENTS.md §Step indicator',
  },
  {
    id: 'footer',
    title: 'Footer',
    summary:
      'Help, store, legal and the design-study line.',
    states: ['static'],
    standard: 'COMPONENTS.md §Footer',
  },
  {
    id: 'banner',
    title: 'Banner',
    summary:
      'Global and page states: not connected, connected again, region, failed job.',
    states: ['warning', 'positive', 'info with action', 'negative'],
    standard: 'interaction.md §Banners and inline messages',
  },
  {
    id: 'dialog',
    title: 'Dialog',
    summary:
      'Confirm a tier-1 action; focus starts on the safe button.',
    states: ['closed', 'open', 'pending inside'],
    standard: 'COMPONENTS.md §Dialog',
  },
  {
    id: 'sheet',
    title: 'Sheet',
    summary:
      'Phone filters with a live count on the apply button.',
    states: ['closed', 'open'],
    standard: 'COMPONENTS.md §Sheet',
  },
  {
    id: 'popover',
    title: 'Popover',
    summary:
      'Non-modal detail on click: the region explanation.',
    states: ['closed', 'open'],
    standard: 'COMPONENTS.md §Popover',
  },
  {
    id: 'status-tag',
    title: 'Status tag',
    summary:
      'Order and key states: icon, word and colour.',
    states: ['positive', 'info', 'neutral', 'warning', 'negative'],
    standard: 'COMPONENTS.md §Status tag',
  },
  {
    id: 'empty-state',
    title: 'Empty state',
    summary:
      'First use, no results with the filters echoed, locked.',
    states: ['first use', 'no results', 'locked'],
    standard: 'interaction.md §Empty states',
  },
  {
    id: 'error-state',
    title: 'Error state',
    summary:
      'A failed region: what is safe, Try again.',
    states: ['shown', 'retrying'],
    standard: 'interaction.md §Errors',
  },
  {
    id: 'accordion',
    title: 'Accordion',
    summary:
      'Requirements and how to redeem.',
    states: ['collapsed', 'expanded'],
    standard: 'COMPONENTS.md §Accordion',
  },
  {
    id: 'game-card',
    title: 'Game card',
    summary:
      'Cover, platform and region tags, title, price readout; no hover lift.',
    states: ['store', 'hover', 'region warning', 'sold out', 'price dropped', 'library', 'skeleton', 'long title'],
    standard: 'COMPONENTS.md §Game card',
  },
  {
    id: 'kiosk',
    title: 'Kiosk (deal surface)',
    summary:
      'A deal as a lit street kiosk for marketing pages: HUD micro-meta, corner reticles, saving in money, region line, in-place cart state with a key tab that drops from its slot. Added 0.6.0 for voltcart-landing.',
    states: ['idle', 'hover/focus', 'adding', 'added', 'in cart', 'add failed', 'cover failed', 'mini', 'reduced motion'],
    standard: 'COMPONENTS.md §Kiosk',
  },
  {
    id: 'motion-pause',
    title: 'Motion pause',
    summary: 'One button that stops everything on a page that runs by itself (WCAG 2.2.2); kept for the visit. Added 0.6.0.',
    states: ['playing', 'paused'],
    standard: 'COMPONENTS.md §Motion pause',
  },
  {
    id: 'tags',
    title: 'Tags',
    summary:
      'Platform, discount (volt), region, filter chip.',
    states: ['platform', 'discount', 'region', 'chip'],
    standard: 'COMPONENTS.md §Tag',
  },
  {
    id: 'price-readout',
    title: 'Price readout',
    summary:
      'What you pay, what it cost, what you save, whether it is a real low.',
    states: ['large', 'discounted', 'no discount', 'price changed', 'updating', 'free', 'unavailable'],
    standard: 'COMPONENTS.md §Price readout',
  },
  {
    id: 'readout',
    title: 'Readout tile',
    summary:
      'Account figures with their period; zero prints as 0, missing as a dash.',
    states: ['with change', 'plain', 'zero', 'missing'],
    standard: 'COMPONENTS.md §Readout tile',
  },
  {
    id: 'table',
    title: 'Table',
    summary:
      'Orders: sortable, tabular figures, status tags.',
    states: ['populated', 'sorted'],
    standard: 'design-system.md §5 Tables',
  },
  {
    id: 'summary',
    title: 'Summary list',
    summary:
      'Subtotal, you save, tax, total.',
    states: ['populated', 'updating'],
    standard: 'COMPONENTS.md §Summary list',
  },
  {
    id: 'cart-line',
    title: 'Cart line',
    summary:
      'Read-only and editable with the line price updating.',
    states: ['read-only', 'updating'],
    standard: 'COMPONENTS.md §Cart line',
  },
  {
    id: 'tiers',
    title: 'Tier cards and charge bar',
    summary:
      'Editions as a radio group; the charge shows tiers unlocked at once.',
    states: ['selected', 'unselected', 'sold out'],
    standard: 'COMPONENTS.md §Tier track',
  },
  {
    id: 'receipt',
    title: 'Code receipt',
    summary:
      'The signature: issuing, slow, the decode, the library (hidden key), failed.',
    states: ['issuing', 'slow', 'delivered', 'library', 'failed'],
    standard: 'COMPONENTS.md §Code receipt',
  },
  {
    id: 'charts',
    title: 'Chart set',
    summary:
      'Price history (line, two series with a second encoding), savings (bars), library (ring).',
    states: ['line', 'bars', 'ring', 'table view'],
    standard: 'COMPONENTS.md §Chart set',
  },
  {
    id: 'filter-bar',
    title: 'Filter bar',
    summary:
      'Active filters as chips with Clear filters.',
    states: ['active', 'none'],
    standard: 'COMPONENTS.md §Filter bar',
  },
  {
    id: 'avatar',
    title: 'Avatar',
    summary:
      'An ID chip: the system’s cut, a lined edge and cyan HUD brackets; initials in the display face.',
    states: ['initials'],
    standard: 'COMPONENTS.md §Avatar',
  },
  {
    id: 'dashboard',
    title: 'Dashboard row',
    summary:
      'A store row: heading, See all, a sideways rail on phones.',
    states: ['populated'],
    standard: 'COMPONENTS.md §Dashboard grid',
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
]
