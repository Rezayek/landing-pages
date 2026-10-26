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
    id: 'people',
    title: 'People',
    description: 'One colour per family member, meaning who and nothing else: always beside a name or initials.',
    tokens: [
      color('--person-1', 'tomato'),
      color('--person-2', 'sky'),
      color('--person-3', 'plum'),
      color('--person-4', 'teal'),
      color('--person-5', 'honey'),
      num('--avatar-tint', 'how much person colour fills an avatar disc'),
    ],
  },
  {
    id: 'data',
    title: 'Data and the band',
    description: 'A sequential green for amounts by category; the bottle-green band keeps its look in both themes.',
    tokens: [
      color('--data-1'),
      color('--data-2'),
      color('--data-3'),
      color('--data-track', 'the empty part of a bar or meter'),
      color('--band-bg', 'the fixed band'),
      color('--band-ink', 'text on the band'),
      color('--band-muted', 'secondary text on the band'),
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
      font('--font-display', 'Fraunces: page and section titles only'),
      font('--font-body', 'Inter: every control, label and amount'),
      num('--weight-display'),
      num('--weight-strong'),
      num('--leading-compact', 'dense tables and lists'),
      num('--leading-body'),
      num('--leading-heading'),
      num('--leading-display'),
      length('--tracking-display'),
      length('--tracking-heading'),
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
      radius('--radius-tag', 'status tags'),
      radius('--radius-avatar', 'avatars and person tags'),
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
      num('--icon-stroke', 'one stroke width for every icon'),
      length('--sidebar-w'),
      length('--rail-w'),
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
      time('--delay-tooltip', 'the first tooltip waits this long'),
      time('--spin-period', 'one spinner turn'),
      time('--shimmer-period', 'one skeleton pulse'),
      time('--dur-highlight-fade', 'a live new row fades out'),
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
  { name: 'Display', token: '--step-display', role: 'first-use headline; the balance (in Inter)', sample: 'Your kitty is empty' },
  { name: 'Step 3', token: '--step-3', role: 'page titles (Fraunces)', sample: 'Good morning, Ada' },
  { name: 'Step 2', token: '--step-2', role: 'section and dialog titles', sample: 'Requests' },
  { name: 'Step 1', token: '--step-1', role: 'card titles (Inter 600)', sample: 'This month' },
  { name: 'Step 0', token: '--step-0', role: 'body text, fields, the kid view', sample: 'Ivy asked for £5.00 for the school trip on Friday.' },
  { name: 'Step -1', token: '--step--1', role: 'tables, labels, buttons', sample: 'Tesco Express · Sam · Groceries · −£42.10' },
  { name: 'Step -2', token: '--step--2', role: 'captions, axis labels, status tags', sample: 'Updated just now' },
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
  { id: 'person-1', label: 'Person 1 (tomato) against a surface', foreground: '--person-1', background: '--surface', minimum: 3 },
  { id: 'person-2', label: 'Person 2 (sky) against a surface', foreground: '--person-2', background: '--surface', minimum: 3 },
  { id: 'person-3', label: 'Person 3 (plum) against a surface', foreground: '--person-3', background: '--surface', minimum: 3 },
  { id: 'person-4', label: 'Person 4 (teal) against a surface', foreground: '--person-4', background: '--surface', minimum: 3 },
  { id: 'person-5', label: 'Person 5 (honey) against a surface', foreground: '--person-5', background: '--surface', minimum: 3 },
  { id: 'person-5-bg', label: 'Person 5 (honey) against the ground', foreground: '--person-5', background: '--bg', minimum: 3 },
  { id: 'data-1', label: 'Lightest data step against a surface', foreground: '--data-1', background: '--surface', minimum: 3 },
  { id: 'band-ink', label: 'Text on the band', foreground: '--band-ink', background: '--band-bg', minimum: 4.5 },
  { id: 'band-muted', label: 'Secondary text on the band', foreground: '--band-muted', background: '--band-bg', minimum: 4.5 },
]

/**
 * Every component of the system, with the states its matrix shows. `id` ties it to its demo in SystemPage.tsx.
 * A component the inventory (COMPONENTS.md) names and this list does not is not built yet.
 */
export interface ComponentEntry {
  readonly id: string
  /** The inventory group in COMPONENTS.md; the page shows one sub-section per group. */
  readonly group?: 'Feedback' | 'Core' | 'Forms' | 'Overlays' | 'Navigation' | 'Data' | 'Charts'
  readonly title: string
  readonly summary: string
  readonly states: readonly string[]
  /** Where its rules are written, in the workflow skill's guides. */
  readonly standard: string
}


const entry = (group: NonNullable<ComponentEntry['group']>, id: string, title: string, summary: string, states: readonly string[], standard = 'COMPONENTS.md'): ComponentEntry => ({ group, id, title, summary, states, standard })

/** Kitty's own inventory (COMPONENTS.md), each with its demo in ui/demos.tsx. */
const KITTY_COMPONENTS: readonly ComponentEntry[] = [
  entry('Core', 'focus-ring', 'Focus ring', 'One ring on every control, an outline that never fades; two-tone on the band.', ['idle', 'focus-visible', 'on band', 'forced colours'], 'craft.md §States'),
  entry('Core', 'skip-link', 'Skip link', 'The first Tab stop of the shell; jumps to main.', ['hidden', 'focus-visible', 'pressed']),
  entry('Core', 'visually-hidden', 'Visually hidden', 'Words for screen readers only: names in an avatar stack, “(opens in a new tab)”.', ['idle', 'focusable']),
  entry('Core', 'theme-switch', 'Theme switch', 'System, light or dark, plus more contrast. Stored on the device, applied before first paint.', ['system', 'light', 'dark', 'more contrast']),
  entry('Core', 'logo', 'Logo', 'The ledger-ribbon k with the wordmark in Fraunces; mark only in the rail and favicon.', ['full', 'mark only', 'on band', 'link']),
  entry('Core', 'button', 'Button', 'Primary (one per screen), secondary, quiet, danger, danger quiet. Never disabled for an invalid form.', ['idle', 'hover', 'focus', 'pressed', 'small', 'with icon', 'unavailable with reason']),
  entry('Core', 'icon-button', 'Icon button', 'A known action in tight space, always with its tooltip and the same words as its name.', ['idle', 'hover', 'focus', 'pressed', 'toggled', 'with badge', 'secondary']),
  entry('Core', 'link', 'Link', 'Goes somewhere. Underlined in prose; current page by weight, not colour.', ['inline', 'standalone', 'hover', 'current page', 'external']),
  entry('Core', 'button-group', 'Button group', 'Two or three actions about one thing; stacked on narrow screens.', ['inline', 'stacked']),
  entry('Overlays', 'menu', 'Menu button and menu', 'Row actions and switchers. Arrow keys, type-ahead, Esc returns focus.', ['closed', 'open', 'danger item', 'unavailable item'], 'APG menu button'),
  entry('Core', 'tooltip', 'Tooltip', 'Opens on hover after 600 ms and at once on focus; Esc closes it; never holds what you must read.', ['hidden', 'shown']),
  entry('Core', 'status-tag', 'Status tag', 'A short state on a row or card: icon, word and colour every time.', ['positive', 'info', 'warning', 'negative', 'neutral', 'long text']),
  entry('Core', 'amount', 'Amount', 'Every money value: Inter, tabular, two decimals, a real minus sign. A live change swaps once, no count-up.', ['out', 'in', 'balance', 'pending', 'zero', 'missing', 'hidden', 'large', 'long', 'live change']),
  entry('Core', 'avatar', 'Avatar and avatar stack', 'A person: ink initials on their colour tint, with a ring in their colour.', ['initials', 'sizes', 'invited', 'stack with more']),
  entry('Core', 'person-tag', 'Person tag', 'A person as a toggle (who is in a split) or a removable filter.', ['off', 'on', 'locked with reason', 'removable', 'invited']),
  entry('Core', 'card', 'Card', 'A bounded block on a hairline, no shadow at rest; a link card is one link.', ['static', 'link', 'selected']),
  entry('Core', 'tick', 'The tick', 'Kitty’s one expressive moment: money in, an approval, payday, a goal reached.', ['play', 'reduced motion: static'], 'MOTION-SYSTEM.md'),
  entry('Forms', 'field', 'Field', 'Label, hint, the control, its message. Errors on blur after an edit, or on submit.', ['idle', 'error', 'warning', 'success', 'optional', 'pending check']),
  entry('Forms', 'text-input', 'Text input', 'Short values, 16 px so phones never zoom.', ['idle', 'hover', 'focus', 'error', 'read-only', 'disabled', 'search with clear', 'long value']),
  entry('Forms', 'amount-input', 'Amount input', 'Money people type: £ prefix, decimal keypad, formatted on blur, the balance as its hint.', ['standard', 'large', 'compact', 'over the balance', 'format error']),
  entry('Forms', 'textarea', 'Textarea', 'A few sentences with a counter that warns at 20 left and never cuts text off.', ['idle', 'near the limit', 'over the limit']),
  entry('Forms', 'code-input', 'Code input', 'The passcode: one real input under six boxes, paste anywhere, autofill works.', ['live', 'filling', 'checking', 'wrong', 'locked']),
  entry('Forms', 'select', 'Select', 'One value from a short list; a bottom sheet on phones.', ['open', 'placeholder', 'loading options']),
  entry('Forms', 'combobox', 'Combobox', 'Choosing a person from the family: type to filter, invite when nobody matches.', ['live', 'typing with an active option', 'selected', 'no results with invite']),
  entry('Forms', 'checkbox', 'Checkbox', 'Independent choices and select-all with mixed.', ['unchecked', 'checked', 'mixed', 'with hint', 'disabled']),
  entry('Forms', 'radio-group', 'Radio group', 'One of a few, shown at once: rhythm, theme, your person colour.', ['unselected', 'selected', 'unavailable option', 'swatches']),
  entry('Forms', 'switch', 'Switch', 'A setting that applies at once (optimistic); flips back with “Not saved” on failure.', ['off (live)', 'on', 'saving', 'not saved', 'unavailable']),
  entry('Forms', 'slider', 'Slider with amount', 'Rough size by drag, exact value by typing; arrows step £5.', ['idle', 'dragged', 'keyboard step']),
  entry('Forms', 'segmented', 'Segmented control', 'Two to four views of the same data; changes at once.', ['selected', 'unavailable option', 'full width']),
  entry('Forms', 'date-input', 'Date input and picker', 'Typing always works; the calendar helps. Past paydays are unavailable.', ['typed', 'open', 'selected day', 'unavailable days'], 'APG date picker dialog'),
  entry('Forms', 'fieldset', 'Fieldset', 'One question over several fields, with rows to add and remove.', ['rows', 'row added', 'row removed']),
  entry('Forms', 'error-summary', 'Error summary', '“There is a problem” with one link per error; focus moves here on submit.', ['shown', 'link to field']),
  entry('Forms', 'file-input', 'File input', 'A receipt or a photo: the button always works; drag and drop on desktop.', ['live (no receipt)', 'drag over', 'uploaded', 'too big']),
  entry('Overlays', 'popover', 'Popover', 'Small interactive content by its trigger: filter options, the date picker.', ['open', 'closed']),
  entry('Overlays', 'dialog', 'Dialog', 'A decision or a short form that must finish first. Focus on the safe button for a removal.', ['confirm (in place)', 'form: open it', 'pending inside', 'error inside'], 'APG dialog'),
  entry('Overlays', 'sheet', 'Sheet', 'A transaction’s detail beside the list on desktop; menus and forms from the bottom on phones.', ['side', 'bottom', 'loading', 'long content']),
  entry('Overlays', 'command-menu', 'Command menu', 'Ctrl/⌘ K: destinations, people and recent transactions in one search.', ['open with recent items', 'no results']),
  entry('Navigation', 'app-shell', 'App shell', 'Sidebar on the page ground, top bar, main; a rail, then a tab bar as it narrows.', ['desktop', 'rail', 'phone (narrow the width frame)']),
  entry('Navigation', 'sidebar', 'Sidebar', 'Seven destinations, the household switcher, Settings and Help at the foot.', ['expanded', 'rail', 'current', 'with count']),
  entry('Navigation', 'tab-bar', 'Bottom tab bar', 'Phones: five destinations for parents, three for kids, labels always shown.', ['parent', 'kid', 'current', 'with count']),
  entry('Navigation', 'top-bar', 'Top bar', 'Search (Ctrl/⌘ K), notifications, the account menu; an edge once scrolled.', ['at top', 'scrolled', 'unread']),
  entry('Navigation', 'tabs', 'Tabs', 'Sibling panels on one page; an underline and weight mark the selected one.', ['selected', 'keyboard'], 'APG tabs'),
  entry('Navigation', 'breadcrumbs', 'Breadcrumbs', 'Settings sub-pages; on phones a Back link instead.', ['trail', 'current page']),
  entry('Navigation', 'pagination', 'Pagination', 'Activity, 50 rows a page, the page in the URL.', ['current page', 'gaps', 'first and last']),
  entry('Navigation', 'back-link', 'Back link', 'Names where it goes, never “Back” alone.', ['idle']),
  entry('Navigation', 'footer', 'Footer and help slot', 'Help in the same place on every screen; the design-study notice.', ['idle']),
  entry('Feedback', 'banner', 'Banner', 'A condition over an area: not connected, over budget, a frozen card, maintenance.', ['global warning', 'back online', 'section', 'page negative', 'dismissible info']),
  entry('Feedback', 'error-page', 'Error pages', '404, 500 and 503 with a plain sentence, the next step and the help slot; money is safe.', ['404', '500', '503 with retry']),
  entry('Data', 'table', 'Table', 'Activity: amounts right-aligned, tabular; sortable; row actions; a live row enters and glows once.', ['populated', 'sorted', 'selected row', 'new row', 'waiting to send', 'pending']),
  entry('Data', 'list-row', 'List row', 'Phones and the kid view: payee and amount on line one, person, category and date on line two.', ['idle', 'pending', 'not sent with retry', 'long payee']),
  entry('Data', 'description-list', 'Description list', 'The review step of a send, with Change links.', ['populated', 'missing value', 'change links']),
  entry('Data', 'kpi', 'KPI tile', 'One number and its change for a named window; colour means good or bad, words carry it.', ['answer', 'good change', 'bad change', 'no baseline']),
  entry('Data', 'balance-card', 'Balance card', 'The signature: the kitty, who is in it, money in and out; the tick when money arrives.', ['populated', 'live change with tick', 'kid band, stale', 'hidden balances']),
  entry('Data', 'budget-meter', 'Budget meter', 'Spending against a limit: green, then amber at 80 %, then red with the amount over.', ['on track', 'near limit', 'over', 'no limit']),
  entry('Data', 'allowance-card', 'Allowance card', 'A kid’s named envelope: amount and rhythm, next payday, spent and saved.', ['active with top up', 'paused', 'kid view, paid today']),
  entry('Data', 'request-card', 'Request card', 'A kid asks; a parent approves (pending, then the tick and Undo) or declines.', ['waiting', 'approved', 'declined', 'not enough in the kitty']),
  entry('Data', 'filter-bar', 'Filter bar', 'Search, person, category and date, the count, Clear filters.', ['no filters', 'person filter open', 'applied']),
  entry('Data', 'dashboard-grid', 'Dashboard grid', '12 columns that fold to one; each block loads and fails on its own.', ['two blocks']),
  entry('Data', 'ledger', 'Ledger', 'The household’s written page: ruled lines, the total at the foot; a request line with its actions.', ['written', 'writing in', 'fresh line', 'request', 'noted with the tick', 'waiting line', 'compact', 'narrow']),
  entry('Data', 'accordion', 'Accordion', 'Help questions and long settings on phones.', ['collapsed', 'expanded'], 'APG accordion'),
  entry('Charts', 'bar-list', 'Bar list', 'Ranking categories by spend: sorted, one green, every bar labelled, a table alternative.', ['populated', 'as table', 'draw-in once']),
  entry('Charts', 'line-chart', 'Line chart', 'The kitty over time: arrows read each point, the end value labelled, a table alternative.', ['populated', 'point focus', 'as table']),
  entry('Charts', 'stacked-bar', 'Stacked bar', 'Who spent what, in each person’s colour, with names and amounts beside.', ['populated', 'as table']),
  entry('Charts', 'ring', 'Ring chart', 'A share of five parts or fewer: the kid view’s saved of this month.', ['partial', 'complete']),
  entry('Charts', 'legend', 'Chart legend', 'Only where direct labels do not fit; items toggle a series, never the last one.', ['toggleable', 'line swatch']),
]

export const COMPONENTS: readonly ComponentEntry[] = [
  {
    group: 'Feedback',
    id: 'action-button',
    title: 'ActionButton',
    summary:
      'Starts work and shows it in itself. The pending state is set in the same event, a repeat press is ignored, the width never changes and the result is announced.',
    states: ['idle', 'hover', 'focus', 'pressed', 'pending', 'slow', 'success', 'error', 'disabled'],
    standard: 'interaction.md §Actions',
  },
  {
    group: 'Feedback',
    id: 'spinner',
    title: 'Spinner',
    summary: 'A ring for work of unknown length. It keeps turning, slower, under reduced motion.',
    states: ['small', 'medium', 'large'],
    standard: 'interaction.md §Loading',
  },
  {
    group: 'Feedback',
    id: 'skeleton',
    title: 'Skeleton',
    summary: 'Shaped like the content that is coming, from the same layout, so the swap moves nothing. Static under reduced motion.',
    states: ['heading', 'text', 'rect', 'circle', 'next to the loaded row'],
    standard: 'interaction.md §Loading, Skeletons',
  },
  {
    group: 'Feedback',
    id: 'progress-bar',
    title: 'ProgressBar',
    summary: 'Determinate or indeterminate, always with a verb and a count. Never backwards. Cancel for anything past 10 s.',
    states: ['indeterminate', '0%', 'partial', 'complete', 'with cancel'],
    standard: 'interaction.md §Loading, Determinate progress',
  },
  {
    group: 'Feedback',
    id: 'region',
    title: 'Region',
    summary: 'One loading region: a skeleton on the first load, the old content dimmed with a bar on a refresh, one announcement per wait.',
    states: ['first load', 'refreshing', 'loaded'],
    standard: 'interaction.md §Loading',
  },
  {
    group: 'Feedback',
    id: 'inline-message',
    title: 'InlineMessage',
    summary: 'A message beside the thing it is about. Icon and title carry the tone as well as the colour.',
    states: ['info', 'success', 'warning', 'error', 'with action', 'dismissible'],
    standard: 'interaction.md §Notifications',
  },
  {
    group: 'Feedback',
    id: 'toast',
    title: 'Toast',
    summary: 'Short and non-modal. Errors and anything with an action stay until dismissed. Text is spoken through the announcer.',
    states: ['neutral', 'info', 'success', 'warning', 'error', 'with action'],
    standard: 'interaction.md §Notifications, Toasts',
  },
  {
    group: 'Feedback',
    id: 'live-region',
    title: 'LiveRegion',
    summary: 'The announcer: one polite and one assertive region, mounted once. The log mirrors what it says.',
    states: ['polite', 'assertive'],
    standard: 'interaction.md §Focus and announcements',
  },
  ...KITTY_COMPONENTS,
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
    summary: 'Save a budget’s name. Press it twice quickly: the second press is ignored.',
    watch:
      'Fast: only “Saved”. Slow: pending at once, the spinner at 400 ms, then “Saved” for 1.5 s. Stalled: “Still saving…” at 8 s. Fail: the error beside the button and the typed value kept.',
  },
  {
    id: 'job',
    title: 'Long work and cancel',
    summary: 'Export a year’s statement: accepted in 120 ms, then determinate progress, with Cancel past 10 s.',
    watch:
      'Very slow and stalled: the leave-and-notify line and Cancel. Fail: the job stops partway, says what was kept and offers to start again.',
  },
  {
    id: 'list',
    title: 'Load a list',
    summary: 'The budgets list as one region: skeleton on the first load, kept and dimmed on a refresh, empty and error states.',
    watch:
      'Fast: no indicator. Slow: the skeleton, or the dim and the bar, at 400 ms. Overdue: the no-results state. Fail: the error state with Try again, or an inline error over the kept list.',
  },
  {
    id: 'toast',
    title: 'Toasts and undo',
    summary: 'Remove an allowance with Undo, and a background export that reports back with a toast.',
    watch:
      'The toast is never the only way back: “Recently removed” keeps them. Hover or focus pauses it; F8 jumps to it; Escape closes it. A failed export stays until dismissed.',
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
