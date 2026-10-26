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
      color('--accent-edge', 'the gold boundary of a gold fill; the lit notch'),
      color('--focus', 'the focus ring'),
    ],
  },
  {
    id: 'data',
    title: 'Elements, rarity and charts',
    description: 'Data marks only: always beside a sigil or stars and a word. In daylight they are graphics (3:1), never text.',
    tokens: [
      color('--el-glacio'),
      color('--el-fusion'),
      color('--el-electro'),
      color('--el-aero'),
      color('--el-spectro'),
      color('--el-havoc'),
      color('--rarity-5', '5 star'),
      color('--rarity-4', '4 star'),
      color('--rarity-3', '3 star'),
      color('--chart-1', 'the one data hue'),
      color('--chart-2', 'the comparison series'),
      color('--chart-grid'),
    ],
  },
  {
    id: 'band',
    title: 'Night band (fixed look)',
    description: 'The band, banner cards and the phone tab bar keep the night look in both themes.',
    tokens: [
      color('--band-bg'),
      color('--band-surface'),
      color('--band-ink'),
      color('--band-muted'),
      color('--band-line'),
      color('--band-accent'),
      color('--field-dot', 'the resonance field'),
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
      color('--selected-bg', 'a selected row or card, under the gold edge'),
      color('--selection-bg'),
      color('--selection-ink'),
      num('--disabled-opacity', 'content of a disabled control'),
      num('--stale-opacity', 'a region refreshing with its old content on screen'),
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
      length('--tracking-title'),
      num('--stretch-display', 'Saira width for display and names'),
      num('--stretch-title', 'Saira width for section and card titles'),
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
      length('--notch-control', 'the 45° notch on controls'),
      length('--notch-card', 'the notch on cards and panels'),
      length('--notch-sheet', 'the notch on sheets, dialogs and banners'),
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
      time('--dur-draw', 'a line or notch edge drawing'),
      time('--dur-ripple', 'the resonance ring'),
      time('--dur-tune', 'one waveform period (a loop)'),
      time('--dur-field', 'the field drift, once'),
      time('--tooltip-delay', 'the first tooltip on hover'),
      time('--hold-success', 'how long "Saved" stays'),
      easing('--ease-sweep', 'the official site curve: the active line travelling'),
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
  { name: 'Display', token: '--step-display', role: 'a banner or Resonator name; 125% width, caps', sample: 'Carlotta' },
  { name: 'Step 3', token: '--step-3', role: 'page titles; KPI values', sample: 'Resonators' },
  { name: 'Step 2', token: '--step-2', role: 'section titles with the gold-start rule; countdowns', sample: 'Current banners' },
  { name: 'Step 1', token: '--step-1', role: 'card and panel titles', sample: 'Jinhsi main DPS build' },
  { name: 'Step 0', token: '--step-0', role: 'body text in guides', sample: 'Swap to a Crit Rate main stat on the cost 4 Echo if you are under 70% after substats.' },
  { name: 'Step -1', token: '--step--1', role: 'tables, labels, buttons', sample: 'Crit Rate 64.2% · Crit DMG 212.0% · Energy Regen 110.0%' },
  { name: 'Step -2', token: '--step--2', role: 'captions, tags, badges', sample: 'Ends 1 Nov, 11:59 UTC+8' },
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
  { id: 'info-fill', label: 'Info fill against a surface', foreground: '--info', background: '--surface', minimum: 3 },
  { id: 'positive-fill', label: 'Success fill against a surface', foreground: '--positive', background: '--surface', minimum: 3 },
  { id: 'warning-fill', label: 'Warning fill against a surface', foreground: '--warning', background: '--surface', minimum: 3 },
  { id: 'negative-fill', label: 'Danger fill against a surface', foreground: '--negative', background: '--surface', minimum: 3 },
  { id: 'accent-edge', label: 'Gold boundary against a surface', foreground: '--accent-edge', background: '--surface', minimum: 3 },
  { id: 'band-ink', label: 'Text on the night band', foreground: '--band-ink', background: '--band-bg', minimum: 4.5 },
  { id: 'band-muted', label: 'Secondary text on the night band', foreground: '--band-muted', background: '--band-bg', minimum: 4.5 },
  { id: 'band-accent', label: 'Countdown gold on the night band', foreground: '--band-accent', background: '--band-bg', minimum: 4.5 },
  { id: 'band-line', label: 'Band line on the night band', foreground: '--band-line', background: '--band-bg', minimum: 3 },
  { id: 'el-glacio', label: 'Glacio mark on a surface', foreground: '--el-glacio', background: '--surface', minimum: 3 },
  { id: 'el-fusion', label: 'Fusion mark on a surface', foreground: '--el-fusion', background: '--surface', minimum: 3 },
  { id: 'el-electro', label: 'Electro mark on a surface', foreground: '--el-electro', background: '--surface', minimum: 3 },
  { id: 'el-aero', label: 'Aero mark on a surface', foreground: '--el-aero', background: '--surface', minimum: 3 },
  { id: 'el-spectro', label: 'Spectro mark on a surface', foreground: '--el-spectro', background: '--surface', minimum: 3 },
  { id: 'el-havoc', label: 'Havoc mark on a surface', foreground: '--el-havoc', background: '--surface', minimum: 3 },
  { id: 'rarity-5', label: '5 star mark on a surface', foreground: '--rarity-5', background: '--surface', minimum: 3 },
  { id: 'rarity-4', label: '4 star mark on a surface', foreground: '--rarity-4', background: '--surface', minimum: 3 },
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
  ...(
    [
      ['frame', 'Frame', 'The notched panel behind every card, control and dialog: a line layer and a fill layer cut with one 45° notch; the notch edge lights gold.', ['panel', 'raised', 'sunken', 'outline', 'band', 'hover', 'focus-within', 'selected'], 'COMPONENTS.md §Frame'],
      ['focus-skip', 'Focus ring and skip link', 'One outline ring, 2 px, offset 2 px, 3:1 on every surface; two-tone on art. The skip link is the first stop.', ['focus-visible', 'on the night band'], 'craft.md §States'],
      ['button', 'Button', 'A local action. Primary gold (one per screen), secondary, quiet, danger, icon-only with a tooltip. Notched; the edge lights on hover and focus.', ['idle', 'hover', 'focus', 'pressed', 'disabled with reason', 'icon-only'], 'COMPONENTS.md §Button'],
      ['action-states', 'ActionButton in product words', 'The async button in product words: the waveform while pending, settle into a check with one ripple on success, detune on error.', ['live', 'pending', 'slow', 'success', 'error'], 'interaction.md §Actions'],
      ['link', 'Link', 'Navigates. Underlined in running text, gold and bold when standalone, an external mark and hidden text for other sites.', ['inline', 'standalone', 'external', 'current page'], 'COMPONENTS.md §Link'],
      ['segmented', 'Segmented control', 'One view setting (grid or table, density). Radio-group keys; the fading active line under the choice.', ['selected', 'hover', 'focus'], 'COMPONENTS.md §Button group'],
      ['menu', 'Menu button', 'Actions on one object. Arrow keys, type-ahead, Esc returns focus; the destructive item last after a separator; a disabled item with its reason.', ['closed', 'open', 'active item', 'disabled item', 'danger item'], 'COMPONENTS.md §Menu button'],
      ['field', 'Field and text input', 'Label, optional marker, hint, a sunken notched well, one message slot (error, warning, success).', ['idle', 'hover', 'focus', 'error', 'pending with success', 'warning', 'read-only', 'disabled', 'long value'], 'interaction.md §Forms'],
      ['search-input', 'Search input', 'Filters a list on this page. Esc clears; the clear button appears when filled.', ['filled'], 'COMPONENTS.md §Text input'],
      ['textarea', 'Textarea with count', 'Build notes: grows to 8 lines, the count turns to a warning at 90% and an error past the limit; paste is never cut.', ['idle', 'near the limit'], 'COMPONENTS.md §Textarea'],
      ['code-input', 'Code input', 'One paste-safe input for the 6-digit sign-in code, one-time-code autofill.', ['typing', 'checking', 'wrong code'], 'COMPONENTS.md §Code input'],
      ['select', 'Select', 'One value from a short list, or several with a count. Select-only combobox keys.', ['single', 'multiple'], 'COMPONENTS.md §Select'],
      ['combobox', 'Combobox', 'Pick a Resonator by typing: any word order, any case. Searching, nothing matches and failed rows.', ['ready', 'searching', 'failed'], 'COMPONENTS.md §Combobox'],
      ['choices', 'Checkbox, radio group, fieldset', 'Native inputs drawn by the tokens: checked, indeterminate, disabled, a required group with its error.', ['checked', 'unchecked', 'indeterminate', 'disabled', 'group error'], 'COMPONENTS.md §Checkbox, §Radio group'],
      ['switch', 'Switch', 'Applies and saves at once: optimistic, a waveform while saving, rolls back with a message on failure.', ['on', 'off', 'saving', 'failed'], 'interaction.md §Actions, optimistic'],
      ['slider', 'Slider', 'Level 1-90 and Echo level 0-25, always with the number field (dragging is never the only way).', ['value', 'focus'], 'COMPONENTS.md §Slider'],
      ['date-picker', 'Date input and picker', 'Typed dates always work; the designed grid marks today and banner days, a range, keyboard by day and month.', ['open', 'range', 'today', 'banner day', 'format error'], 'COMPONENTS.md §Date input'],
      ['error-summary', 'Error summary', 'After a failed submit: focus moves here; each line links to its field.', ['two errors'], 'interaction.md §Forms'],
      ['shell', 'App shell, band, sidebar', 'The night band (logo, search, theme, account), the tab column (expanded or rail) with the fading active line, the content plane (ea-route), the footer.', ['expanded', 'rail', 'current item', 'route change'], 'design-system.md §5'],
      ['phone-nav', 'Phone tab bar and sheet', 'Five destinations on the band; More opens a sheet with a close button (the tap alternative to swiping).', ['current', 'sheet open'], 'COMPONENTS.md §Phone tab bar'],
      ['command-menu', 'Command menu', 'Global search on Ctrl K: grouped results, recent searches, searching, nothing matches, failed.', ['recent', 'results', 'searching', 'failed'], 'COMPONENTS.md §Command menu'],
      ['cap-nav', 'Top bar navigation (resonance cap)', 'Plain links on the night band; one gold hairline lifts into a low, even arch over the current item and glides to the next; a click adds a Spectro glint and three sparks; hover shows a faint arch.', ['current', 'hover', 'after a click (glint)', 'none current', 'reduced motion'], 'COMPONENTS.md §Top bar navigation'],
      ['tabs', 'Tabs', 'Panels of one object; automatic activation; a disabled tab with its reason; the line slides on the sweep curve.', ['current', 'disabled', 'count'], 'COMPONENTS.md §Tabs'],
      ['accordion', 'Accordion', 'Optional detail; the chevron turns over the disclosure duration.', ['expanded', 'collapsed'], 'COMPONENTS.md §Accordion'],
      ['breadcrumbs-pagination', 'Breadcrumbs, back link, pagination', 'Where you are and the way back; numbered pages with the current one marked.', ['trail', 'back link', 'first, middle, last page'], 'COMPONENTS.md §Breadcrumbs, §Pagination'],
      ['footer', 'Footer and logo', 'The unofficial notice and help in the same place (the rights-holder contact returns once there is an address). Logo lock-up and mark.', ['full', 'logo', 'mark'], 'COMPONENTS.md §Footer, §Logo'],
      ['banner', 'Banner', 'A state of the app or page under the band: offline, back online, maintenance, signed out.', ['warning', 'positive', 'info', 'negative'], 'interaction.md §Notifications'],
      ['dialog', 'Dialog', 'Confirm (names the item), typed confirmation for deleting the account, a form dialog with its pending button.', ['confirm', 'typed confirm', 'form'], 'COMPONENTS.md §Dialog'],
      ['status-tag', 'Status tag', 'Icon or waveform plus a word: saved, saving, offline, syncing, synced, ends soon, rerun, failed.', ['eight kinds'], 'COMPONENTS.md §Status tag'],
      ['tooltip-popover', 'Tooltip and popover', 'Tooltip on hover after the delay and on focus at once; popover on click or Enter.', ['tooltip', 'popover'], 'COMPONENTS.md §Tooltip, §Popover'],
      ['card', 'Card', 'A news item or event; the whole card is one link; the notch lights on hover and focus.', ['idle', 'hover', 'focus', 'long title'], 'COMPONENTS.md §Card'],
      ['resonator-card', 'Resonator card', 'The official portrait card where one exists (credited, testing only), else our sigil on the element-tinted field; rarity bar and stars, element and weapon. A link, or a toggle with selection ticks.', ['portrait', 'sigil fallback', 'compact', 'selected'], 'COMPONENTS.md §Resonator card'],
      ['banner-card', 'Banner card and countdown', 'The night band in both themes, the countdown with its absolute time and Live seconds, ends soon, rerun, ended, arriving.', ['live', 'live seconds off', 'ends soon', 'rerun', 'ended', 'arriving'], 'COMPONENTS.md §Banner card'],
      ['table', 'Table and stat list', 'Ruled rows, tabular numbers, sortable headers, a selected row; the stat list with dotted leaders and deltas.', ['sorted', 'selected row', 'missing value', 'deltas'], 'design-system.md §5 Tables'],
      ['tags', 'Chevron tags and chips', 'Category tags between chevrons; toggle chips for filters; applied filter chips with remove.', ['tag', 'toggle on', 'toggle off', 'applied'], 'COMPONENTS.md §Chevron tag'],
      ['marks', 'Element and rarity marks, avatar', 'Sigil plus name; stars plus "n star"; initials avatar.', ['six elements', 'three rarities', 'three sizes'], 'COMPONENTS.md §Element mark'],
      ['kpi', 'KPI tile', 'A build stat against its target; the answer tile is larger with the gold edge; the delta underline draws when it changes.', ['answer', 'above target', 'missing'], 'design-system.md §5 Figures'],
      ['charts', 'Chart set', 'Bar list with targets, line with a gap for missing data, ring for a share; skeleton and empty; table alternative.', ['bars', 'loading', 'empty', 'line', 'ring', 'as table'], 'design-system.md §5 Charts'],
      ['filter-bar', 'Filter bar', 'Element toggles, weapon multi-select, rarity, the live count, Clear filters, applied chips.', ['filters on'], 'COMPONENTS.md §Filter bar'],
      ['dashboard', 'Dashboard grid', 'Home blocks sized by importance on a 12-column grid; each block owns its loading and error.', ['banners and events'], 'COMPONENTS.md §Dashboard grid'],
      ['echo-slot', 'Echo slot', 'Cost, Echo, set, main and substats; empty prompt; selected; over-budget warning; invalid main stat; waiting to sync.', ['filled', 'selected', 'warning', 'error', 'empty waiting'], 'COMPONENTS.md §Echo slot'],
      ['team-builder', 'Team slot and builder', 'Three routes to place: drag, select then "Place in slot n", or the combobox. Duplicate error, Undo on remove.', ['filled', 'drop target', 'duplicate', 'builder'], 'COMPONENTS.md §Team slot'],
      ['theme', 'Theme switch', 'System, Daylight, Night; stored and applied before first paint.', ['segmented', 'band menu'], 'design-system.md §2 Themes'],
      ['build-panel', 'Build panel (Resonator menu)', 'The in-game Resonator menu: vertical tabs Attributes, Weapon, Echo, Resonance Chain, Forte beside the portrait; arrow keys move; phones get a scrolling tab row.', ['attributes', 'weapon', 'echo', 'chain', 'forte', 'loading', 'phone'], 'COMPONENTS.md §Build panel'],
      ['weapon', 'Weapon card', 'Like the in-game Weapon tab: icon on its rarity, type and level, base ATK, secondary stat, Rank and passive (sample text).', ['5 star', 'rank'], 'COMPONENTS.md §Weapon card'],
      ['echo', 'Echo loadout, Echo detail, Sonata effect', 'Like the in-game Echo tab: five slots with cost and level, the selected Echo with main, fixed and substats, the Sonata 2- and 5-piece bonuses marked active.', ['selected slot', 'locked substats', 'icon fallback', 'set active'], 'COMPONENTS.md §Echo card'],
      ['forte', 'Forte tree', 'Like the in-game Forte screen: five skill columns, inherent skills above, Outro below, levels, the build priority as a numbered badge, the selected skill detail.', ['selected', 'priority', 'max level'], 'COMPONENTS.md §Forte tree'],
      ['resonance-chain', 'Resonance Chain', 'Six nodes S1-S6: unlocked filled, the next outlined, the rest locked, with words for screen readers.', ['S0', 'S2', 'S6'], 'COMPONENTS.md §Resonance Chain'],
      ['voice-lines', 'Voice lines', 'Language switch and one player per line, the transcript always shown; one clip plays at a time; a failed clip keeps its transcript.', ['idle', 'playing', 'paused', 'error'], 'COMPONENTS.md §Audio player'],
      ['music', 'Music player', 'One track: play or pause, seek by keys or click, time, the waveform tuning while it plays.', ['idle', 'playing', 'paused', 'ended'], 'COMPONENTS.md §Audio player'],
      ['ui-sounds', 'Interface sounds', 'Our own synthesized press, success, error and open sounds; off by default, a switch and volume; never the only cue.', ['off', 'on', 'volume'], 'COMPONENTS.md §Interface sounds'],      ['icons', 'Icons and sigils', 'The authored line set and the six element sigils; sr-only text for icon-only controls.', ['16', '24', '64'], 'craft.md §Icons'],
    ] as const
  ).map(([id, title, summary, states, standard]) => ({ id, title, summary, states, standard })),
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
    id: 'toast',
    title: 'Toasts and undo',
    summary: 'Delete with Undo, and a background export that reports back with a toast.',
    watch:
      'The toast is never the only way back: “Recently deleted” keeps the builds. Hover or focus pauses it; F8 jumps to it; Escape closes it. A failed export stays until dismissed.',
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
    summary: 'One region: the draw-on skeleton on the first load, the list kept, dimmed and greyed on a refresh, empty and error states.',
    watch:
      'Fast: no indicator. Slow: the skeleton, or the dim and the bar, at 400 ms. Stalled: "Still loading builds" over the region at 8 s. Outdated: the no-results state. Fail: the error state with Try again, or an inline error over the kept list.',
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
/* The Resonance language keeps these; the other primitives in ./vfx (ignite, scanlines, noise, scan, glitch, shake,
   pulse, wipe, flicker, decode) belong to the Signal language the person did not pick and are not used. */
export const EFFECTS: readonly EffectEntry[] = [
  { id: 'ea-edge', title: 'Lit notch (ea-edge)', kind: 'standing', use: 'frequent: hover, focus, selection', summary: 'The notch corner of a frame draws in gold over the draw duration. No glow.' },
  { id: 'ea-draw', title: 'Draw (ea-draw)', kind: 'one-shot', use: 'occasional: a section entering, a dialog title, a delta changing', summary: 'A line draws from its start: the gold start of the section rule.' },
  { id: 'ea-ticks', title: 'Selection ticks (ea-ticks)', kind: 'one-shot', use: 'occasional: a card selected', summary: 'Four corner ticks close in from 8 px out.' },
  { id: 'ea-wave', title: 'Tune, settle, detune (ea-wave)', kind: 'standing', use: 'occasional: waiting, done, failed', summary: 'The waveform hums while work runs, flattens when done, jitters in red once when it fails.' },
  { id: 'ea-ripple', title: 'Resonate (ea-ripple)', kind: 'one-shot', use: 'occasional: primary press, a result', summary: 'One gold ring expands and fades over the ripple duration.' },
  { id: 'ea-field', title: 'Resonance field (ea-field)', kind: 'one-shot', use: 'rare: a banner arriving, first use', summary: 'The dot field drifts once for 4.8 s, then stays still.' },
  { id: 'sweep', title: 'Light pass (sweep)', kind: 'one-shot', use: 'occasional: a live update arriving', summary: 'One band of gold light crosses the night band once.' },
  { id: 'burst', title: 'Burst', kind: 'script', use: 'rare: the first full build, once per account', summary: 'Twelve gold particles from the save button, on a throwaway canvas.' },
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
  { id: 'changelog', title: 'Changelog' },
]

/** The system's version and its latest changes, as SYSTEM.md records them (newest first). */
export const SYSTEM_VERSION = '0.5.0'

export const CHANGELOG: readonly string[] = [
  '0.5.0 · Combobox: leaving the field closes the list and clears a search that matches nothing; the banner skeleton\'s stand-in title is not a heading.',
  '0.5.0 · CapNav: one gold hairline that lifts into a low, even arch over the current item, glides between items and glints after a click.',
  '0.5.0 · Team slot: a filled slot shows its Resonator\'s art; an error hides the art so the message reads clear; placed Resonators are left out of the search; errors clear when the team changes.',
  '0.5.0 · Team builder: the duplicate says how to fix it; Remove focuses the slot\'s search; Undo announces and returns focus; onChange reports the team.',
  '0.5.0 · Combobox: a pointer pick keeps focus in the field; the match count is announced, not a live region; no results says the next step.',
  '0.5.0 · Region: a wait that ends in an error or empty cover is never announced as "loaded"; Forte detail is no longer a live region.',
  '0.5.0 · Banner card: its action on its own line; the featured countdown is the card\'s largest numeral; the skeleton is the loaded height with a tuning waveform.',
  '0.5.0 · Resonator card and team slot: full-body cut-outs where no portrait card exists; Build panel takes any five Echoes; .ea-night; stat values in the display numeral face.',
  '0.4.0 · Waits say when they run long: regions show "Still loading…" at 8 s; old results dim and go grey; the filter count says "Updating…".',
  '0.4.0 · Every card and row skeleton draws on in the component\'s own shape; skeleton bars read in dark (--skeleton-bg is ink at 12%).',
  '0.4.0 · Phones: 0 targets under 44 px down to 320 (the date picker becomes a full-width sheet); the first screen reaches the content.',
  '0.4.0 · Builder text removed from user copy; sequence cards pair; Resonator card meta on two fixed lines.',
  '0.3.0 · Failures show their cause and stay on screen: Send code, a build tab, the Echo planner sync; retry keeps loading and keeps focus.',
  '0.3.0 · Draw-on skeleton: the component itself with tuning bars and a notched outline that draws on; Region reserves one size for every state.',
  '0.3.0 · Touch floor: 0 targets under 44 px at 390, nothing past the screen at 320; compact Resonator cards follow the in-game team select.',
  '0.3.0 · Team builder, Forte tree, Resonance Chain and Echo loadout lay out by their own width, so a narrow column never overlaps them.',
  '0.3.0 · New token --stale-opacity (0.6); the sequences speak Echo Atlas (builds, Echoes) instead of the starter\'s projects.',
  '0.2.0 · Resonator page: build panel (Attributes, Weapon, Echo, Resonance Chain, Forte) modelled on the in-game menu; Echo, Sonata, Forte and chain components.',
  '0.2.0 · In-game icons for the weapon, Sonata, Echoes, skills and Resonance Chain (local copies, credited); the chain shows each node\'s icon and name.',
  '0.2.0 · Build panel switches to its phone form by its own width; full-width demo. Weapon card wraps its art when narrow.',
  '0.2.0 · /system layout: page grids name their column minmax(0, 1fr); a full layout 1.5 s → 8 ms at phone width.',
  '0.2.0 · Audio: voice lines and music players (sample clips), interface sounds (off by default).',
  '0.2.0 · Banner cards carry the featured Resonator portrait slot.',
  '0.2.0 · Scenarios play their flow at the chosen latency when they scroll into view.',
  '0.2.0 · Touch floor: standalone links, breadcrumbs, pager, checks and switches reach 44 px on touch; the shell turns into its phone form by its own width.',
  '0.2.0 · Landmarks named per demo, no second main, demo headings under the card title.',
  '0.2.0 · /system: one sticky row with a Controls disclosure; the selected marker is a quiet line, gold stays for primary actions.',
  '0.1.0 · Official Resonator portraits (credited, testing only) on the Resonator card; the sigil plate stays the fallback.',
  '0.1.0 · First system: Resonance Terminal foundations, 62 component specs, the Resonance motion language, interaction and content standards.',
]
