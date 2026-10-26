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
    id: 'ground',
    title: 'Ground',
    description: 'The dark backdrop every screen sits on, in both themes, with its own text roles.',
    tokens: [
      color('--bg', 'the backdrop behind every panel'),
      color('--bg-ink', 'titles and words straight on the backdrop'),
      color('--bg-muted', 'secondary words on the backdrop'),
      color('--bg-line', 'rules and frames on the backdrop'),
      color('--overlay', 'the scrim behind a dialog'),
    ],
  },
  {
    id: 'surfaces',
    title: 'Panels and slots',
    description: 'The inventory: a light gray panel (Stone) or a dark one (Deepslate), bevelled, with sunken slots.',
    tokens: [
      color('--surface', 'panels'),
      color('--raised', 'dialogs, menus'),
      color('--sunken', 'wells set into a panel'),
      color('--hi', 'the lit top-left bevel of a panel'),
      color('--sh', 'the shaded bottom-right bevel'),
      color('--edge', 'the one-unit outer edge of everything'),
      color('--slot', 'an inventory slot'),
      color('--slot-dark', 'the slot’s shaded inner edge'),
      color('--slot-light', 'the slot’s lit inner edge'),
      color('--select', 'the white select frame on hover and selection'),
    ],
  },
  {
    id: 'text',
    title: 'Text and lines on panels',
    tokens: [
      color('--ink', 'body text on a panel'),
      color('--muted', 'secondary text'),
      color('--subtle', 'captions'),
      color('--line', 'dividers'),
      color('--line-strong', 'the edge of a control'),
      color('--text-shadow', 'the one-unit shadow under light text on faces'),
    ],
  },
  {
    id: 'faces',
    title: 'Button faces',
    description: 'Every button is a bevelled face: lit top-left, shaded bottom-right; pressed, the two swap.',
    tokens: [
      color('--face', 'the stone button'),
      color('--face-hi'),
      color('--face-sh'),
      color('--face-hover'),
      color('--face-pressed'),
      color('--face-ink', 'its label'),
      color('--accent', 'the primary face: grass'),
      color('--accent-hi'),
      color('--accent-sh'),
      color('--accent-hover'),
      color('--on-accent', 'its label'),
      color('--accent-shadow', 'the shadow under that label'),
      color('--accent-ink', 'the accent as text on a panel'),
      color('--accent-bg', 'a quiet accent container'),
    ],
  },
  {
    id: 'fields',
    title: 'Fields',
    description: 'The black text field of the game’s screens, on every panel tone.',
    tokens: [
      color('--field', 'the field'),
      color('--field-edge', 'its edge'),
      color('--field-ink', 'typed text'),
      color('--field-hint', 'placeholder and hint'),
      color('--field-bad', 'the error edge and OFF state'),
    ],
  },
  {
    id: 'tooltip',
    title: 'Tooltip and toast frame',
    description: 'The dark purple item frame, the same in both themes: tooltips, toasts, the hotbar label.',
    tokens: [
      color('--tip-bg'),
      color('--tip-edge', 'the purple inner edge'),
      color('--tip-ink'),
      color('--tip-muted'),
      color('--tip-shadow'),
    ],
  },
  {
    id: 'game',
    title: 'Tiers, experience, ping',
    description: 'Fixed-look roles from the game’s own vocabulary. Never the only signal: each has a word or a shape.',
    tokens: [
      color('--tier-common', 'an ordinary name'),
      color('--tier-uncommon', 'featured'),
      color('--tier-rare', 'staff pick, links in the frame'),
      color('--tier-epic', 'challenge winner'),
      color('--xp', 'experience: progress, success'),
      color('--xp-dark'),
      color('--xp-empty', 'the empty bar'),
      color('--xp-lip'),
      color('--ping-good'),
      color('--ping-mid'),
      color('--ping-bad'),
      color('--ping-off'),
      color('--presence-off', 'offline dot'),
    ],
  },
  {
    id: 'status',
    title: 'Status',
    description: 'Info, success, warning and danger. Each is a set: a fill (with its text), a text-safe ink and a quiet container.',
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
      color('--negative-hi'),
      color('--negative-sh'),
      color('--on-negative'),
      color('--negative-ink'),
      color('--negative-bg'),
    ],
  },
  {
    id: 'data',
    title: 'Data',
    description: 'Series colours for charts (players over time, votes per entry).',
    tokens: [color('--data-1'), color('--data-2'), color('--data-3'), color('--data-4'), color('--data-5'), color('--data-6')],
  },
  {
    id: 'states',
    title: 'Interaction states',
    tokens: [
      color('--hover-bg', 'hover layer on quiet controls'),
      color('--pressed-bg', 'pressed layer'),
      color('--selection-bg'),
      color('--selection-ink'),
      color('--focus', 'the focus ring, outer band'),
      color('--focus-2', 'the focus ring, inner band'),
      num('--disabled-opacity', 'content of a disabled control'),
      length('--focus-width'),
    ],
  },
  {
    id: 'type',
    title: 'Type',
    description: 'Jersey 10 (SIL OFL 1.1), one weight, a 10-pixel em: every size is a whole number of units per font pixel.',
    tokens: [
      font('--font-display'),
      font('--font-body'),
      length('--size-hint', 'decorative hints and badges only'),
      length('--size-0', 'all reading text'),
      length('--size-2', 'sub-sections'),
      length('--size-3', 'section titles'),
      length('--size-display', 'one headline per screen'),
      num('--leading-body'),
      num('--leading-heading'),
      length('--measure', 'longest line of body text'),
    ],
  },
  {
    id: 'space',
    title: 'Space',
    description: 'All lengths are whole pixel units: --u is 2 px, or 3 px at GUI scale 3.',
    tokens: [
      length('--u', 'one pixel unit'),
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
    description: 'No rounding anywhere. Panels lose one unit at each corner (the notch); everything else is square.',
    tokens: [
      radius('--radius-control', 'buttons and fields: 0'),
      radius('--radius-card', 'panels: 0, with the notch'),
      radius('--radius-tag', 'tags: 0'),
      length('--notch', 'the corner cut of a panel'),
      length('--border', 'border width: one unit'),
    ],
  },
  {
    id: 'elevation',
    title: 'Elevation',
    description: 'Hard offset shadows, no blur, like a block’s shadow. Drawn with drop-shadow on a wrapper, because panels are clipped.',
    tokens: [shadow('--shadow-raised', 'cards lifted off the backdrop'), shadow('--shadow-overlay', 'menus, toasts, dialogs')],
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
      'Press Play. Every curve is stepped, so things move in whole frames; travel is whole units; nothing scales. Under reduced motion the travel goes and each one fades instead.',
    tokens: [
      time('--dur-press', 'press feedback'),
      time('--dur-popover-in', 'tooltip and menu rise'),
      time('--dur-modal-in', 'dialog rise'),
      time('--dur-toast-in'),
      time('--dur-toast-out'),
      time('--dur-swap', 'content replacing content'),
      time('--dur-success-swap', 'the label swap on success'),
      time('--dur-pop', 'a state flipped'),
      time('--dur-glint', 'the enchanted shine'),
      time('--dur-pickup', 'a gain flying home'),
      time('--dur-xp', 'the experience bar fill'),
      time('--dur-shake', 'a refusal'),
      time('--dur-reduced', 'the one fade under reduced motion'),
      time('--hold-success', 'how long "Saved" stays'),
      easing('--ease-standard'),
      easing('--ease-enter'),
      easing('--ease-exit'),
      easing('--ease-enter-emphasized'),
      easing('--ease-exit-emphasized'),
      easing('--ease-symmetric'),
      length('--travel-sm', 'how far an overlay rises'),
      length('--travel-md', 'how far a toast rises'),
      length('--travel-lg'),
      length('--press-travel', 'how far a press sinks'),
      num('--scale-from', 'always 1: nothing scales'),
    ],
  },
]

export interface TypeStep {
  readonly name: string
  readonly token: TokenName
  /** What the step is for. */
  readonly role: string
  /** Sample text in the product's own words. */
  readonly sample: string
}

export const TYPE_STEPS: readonly TypeStep[] = [
  { name: 'Display', token: '--step-display', role: 'one headline per screen (20 units, 30 at 64rem)', sample: 'This week: Lighthouses' },
  { name: 'Step 3', token: '--step-3', role: 'section titles (20 units)', sample: 'Trending builds' },
  { name: 'Step 2', token: '--step-2', role: 'sub-sections (15 units)', sample: 'Night Market Tower' },
  { name: 'Step 0', token: '--step-0', role: 'all reading text, labels, captions (10 units)', sample: 'Seed 7F3A-29QX · X 120, Y 64, Z -340 · 1.21 Survival. C O 0 Q · 2 8 3 5 6 9' },
  { name: 'Hint', token: '--size-hint', role: 'decorative hints and badge numbers only (5 units); the meaning is in the accessible name', sample: '99+' },
]

/**
 * Contrast to measure, from the live values in the current theme. WCAG 2.2 AA: 4.5:1 for text, 3:1 for large text
 * and for the parts of a control that identify it. Text on panels is measured on the panel tones; the ground has its
 * own text roles, measured in the pairs.
 */
export interface ContrastRule {
  readonly token: TokenName
  readonly label: string
  readonly minimum: 3 | 4.5
  /** The surfaces this role is used on; leave out for all. Text on a sunken slot well is --ink only (FOUNDATIONS.md §2). */
  readonly surfaces?: readonly TokenName[]
}

export const CONTRAST_SURFACES: readonly { readonly token: TokenName; readonly label: string }[] = [
  { token: '--surface', label: 'Panel' },
  { token: '--raised', label: 'Raised' },
  { token: '--sunken', label: 'Sunken' },
]

export const CONTRAST_TEXT: readonly ContrastRule[] = [
  { token: '--ink', label: 'Body text', minimum: 4.5 },
  { token: '--muted', label: 'Secondary text', minimum: 4.5, surfaces: ['--surface', '--raised'] },
  { token: '--subtle', label: 'Captions', minimum: 4.5, surfaces: ['--surface', '--raised'] },
  { token: '--accent-ink', label: 'Accent as text', minimum: 4.5, surfaces: ['--surface', '--raised'] },
  { token: '--info-ink', label: 'Info text', minimum: 4.5, surfaces: ['--surface', '--raised'] },
  { token: '--positive-ink', label: 'Success text', minimum: 4.5, surfaces: ['--surface', '--raised'] },
  { token: '--warning-ink', label: 'Warning text', minimum: 4.5, surfaces: ['--surface', '--raised'] },
  { token: '--negative-ink', label: 'Error text', minimum: 4.5, surfaces: ['--surface', '--raised'] },
  { token: '--line-strong', label: 'Control edge', minimum: 3 },
]

export interface ContrastPair {
  readonly id: string
  readonly label: string
  readonly foreground: TokenName
  readonly background: TokenName
  readonly minimum: 3 | 4.5
  /** A second band drawn beside the first (the two-band focus ring): the pair passes on the better of the two. */
  readonly alternate?: TokenName
}

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { id: 'bg-ink', label: 'Titles on the backdrop', foreground: '--bg-ink', background: '--bg', minimum: 4.5 },
  { id: 'bg-muted', label: 'Secondary words on the backdrop', foreground: '--bg-muted', background: '--bg', minimum: 4.5 },
  { id: 'face-ink', label: 'Label on a stone face', foreground: '--face-ink', background: '--face', minimum: 4.5 },
  { id: 'face-ink-hover', label: 'Label on a hovered face', foreground: '--face-ink', background: '--face-hover', minimum: 4.5 },
  { id: 'on-accent', label: 'Label on the grass face', foreground: '--on-accent', background: '--accent', minimum: 4.5 },
  { id: 'field-ink', label: 'Typed text in a field', foreground: '--field-ink', background: '--field', minimum: 4.5 },
  { id: 'field-hint', label: 'Hint in a field', foreground: '--field-hint', background: '--field', minimum: 4.5 },
  { id: 'field-bad', label: 'Error edge and OFF in a field', foreground: '--field-bad', background: '--field', minimum: 4.5 },
  { id: 'xp-field', label: 'ON in a field (experience)', foreground: '--xp', background: '--field', minimum: 4.5 },
  { id: 'tip-ink', label: 'Text in the tooltip frame', foreground: '--tip-ink', background: '--tip-bg', minimum: 4.5 },
  { id: 'tip-muted', label: 'Secondary text in the frame', foreground: '--tip-muted', background: '--tip-bg', minimum: 4.5 },
  { id: 'tier-rare', label: 'Rare tier (links) in the frame', foreground: '--tier-rare', background: '--tip-bg', minimum: 4.5 },
  { id: 'tier-uncommon', label: 'Featured tier in the frame', foreground: '--tier-uncommon', background: '--tip-bg', minimum: 4.5 },
  { id: 'tier-epic', label: 'Winner tier in the frame', foreground: '--tier-epic', background: '--tip-bg', minimum: 4.5 },
  { id: 'xp-tip', label: 'Success icon in the frame', foreground: '--xp', background: '--tip-bg', minimum: 3 },
  { id: 'focus-bg', label: 'Focus ring on the backdrop (better of its two bands)', foreground: '--focus', alternate: '--focus-2', background: '--bg', minimum: 3 },
  { id: 'focus-surface', label: 'Focus ring on a panel (better of its two bands)', foreground: '--focus', alternate: '--focus-2', background: '--surface', minimum: 3 },
  { id: 'focus-sunken', label: 'Focus ring on a slot well (better of its two bands)', foreground: '--focus', alternate: '--focus-2', background: '--sunken', minimum: 3 },
  { id: 'panel-edge', label: 'Panel against the backdrop (its lit bevel)', foreground: '--hi', background: '--bg', minimum: 3 },
  { id: 'ink-sunken', label: 'Body text in a slot well', foreground: '--ink', background: '--sunken', minimum: 4.5 },
  { id: 'on-info', label: 'Text on the info fill', foreground: '--on-info', background: '--info', minimum: 4.5 },
  { id: 'on-positive', label: 'Text on the success fill', foreground: '--on-positive', background: '--positive', minimum: 4.5 },
  { id: 'on-warning', label: 'Text on the warning fill', foreground: '--on-warning', background: '--warning', minimum: 4.5 },
  { id: 'on-negative', label: 'Text on the danger fill', foreground: '--on-negative', background: '--negative', minimum: 4.5 },
  { id: 'info-ink-bg', label: 'Info text on its container', foreground: '--info-ink', background: '--info-bg', minimum: 4.5 },
  { id: 'positive-ink-bg', label: 'Success text on its container', foreground: '--positive-ink', background: '--positive-bg', minimum: 4.5 },
  { id: 'warning-ink-bg', label: 'Warning text on its container', foreground: '--warning-ink', background: '--warning-bg', minimum: 4.5 },
  { id: 'negative-ink-bg', label: 'Error text on its container', foreground: '--negative-ink', background: '--negative-bg', minimum: 4.5 },
  { id: 'ink-info-bg', label: 'Body text in an info message', foreground: '--ink', background: '--info-bg', minimum: 4.5 },
  { id: 'ink-warning-bg', label: 'Body text in a warning message', foreground: '--ink', background: '--warning-bg', minimum: 4.5 },
  { id: 'ink-negative-bg', label: 'Body text in an error message', foreground: '--ink', background: '--negative-bg', minimum: 4.5 },
  { id: 'accent-fill', label: 'Grass face against a panel', foreground: '--accent', background: '--surface', minimum: 3 },
  { id: 'negative-fill', label: 'Danger face against a panel', foreground: '--negative', background: '--surface', minimum: 3 },
  { id: 'xp-empty', label: 'Experience fill against its track', foreground: '--xp', background: '--xp-empty', minimum: 3 },
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
    summary: 'A square whose lit edge hops a quarter turn per frame, for work of unknown length. Always with a label; slower under reduced motion.',
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
  /* Blockfeed's own components (ui/, social/, pixel/): demos in demos.tsx */
  { id: 'logo', title: 'Logo', summary: 'The stack mark and wordmark, drawn on the unit grid. Never a game asset or the game’s font.', states: ['full'], standard: 'FOUNDATIONS.md §7' },
  { id: 'icons', title: 'Icon set', summary: 'Our own pixel icons, crisp at every scale, taking the text colour.', states: ['sm', 'md', 'lg'], standard: 'FOUNDATIONS.md §7' },
  { id: 'panel', title: 'Panel', summary: 'The inventory panel: bevelled, notched, on the dark backdrop; raised for overlays with the hard shadow.', states: ['surface', 'raised', 'lifted'], standard: 'design-system.md §4' },
  { id: 'button', title: 'Button, IconButton, Segmented', summary: 'Bevelled faces. A press sinks one unit and the bevel swaps; hover shows the white select frame.', states: ['idle', 'hover', 'focus', 'pressed', 'toggled', 'disabled', 'sm', 'md', 'lg'], standard: 'interaction.md §Actions' },
  { id: 'slot', title: 'Slot, SlotGrid, Hotbar', summary: 'Inventory slots with counts; the hotbar is the main navigation, its selected slot framed white.', states: ['empty', 'filled', 'with count', 'selected', 'with badge'], standard: 'design-system.md §4 navigation' },
  { id: 'tooltip', title: 'Tooltip', summary: 'The dark purple item frame, in the top layer, on hover and focus with no delay.', states: ['hover', 'focus', 'tiers'], standard: 'INTERACTION.md changed defaults' },
  { id: 'tabs', title: 'Tabs', summary: 'Tabs that join their panel; arrow keys move; the selected tab swaps at once.', states: ['selected', 'idle', 'with count', 'with icon'], standard: 'design-system.md §4' },
  { id: 'tag', title: 'Tag, TagButton, Count, Level, Avatar, Ping', summary: 'Small facts: tags with icon and word, filter tags as toggles, counts, the level badge, presence and ping bars.', states: ['tones', 'pressed', 'presence', 'ping good, mid, bad, unknown'], standard: 'FOUNDATIONS.md §2' },
  { id: 'xp-bar', title: 'XpBar', summary: 'The experience bar for levels and votes; indeterminate for unknown work.', states: ['empty', 'partial', 'indeterminate'], standard: 'MOTION-SYSTEM.md data' },
  { id: 'fields', title: 'TextField, TextArea, SearchField', summary: 'The black field: label above, hint or error below with an icon, a counter on long text.', states: ['idle', 'focus', 'hint', 'error', 'optional', 'disabled', 'counter'], standard: 'interaction.md §Forms' },
  { id: 'choices', title: 'Select, Checkbox, Toggle, Slider, CycleButton, RadioGroup', summary: 'Choices in the game’s options style: ON and OFF in words, the cycle button, the slider with its value.', states: ['on', 'off', 'focus', 'disabled', 'error'], standard: 'design-system.md §4 choices' },
  { id: 'overlays', title: 'Dialog, Menu', summary: 'Rise into place in stepped frames, close at once; focus moves in and back; menus in the top layer.', states: ['open', 'closed', 'destructive'], standard: 'interaction.md §Focus' },
  { id: 'build-card', title: 'BuildCard, LikeButton, CopyField', summary: 'A build: shot, title, tags, version, seed and coordinates with copy, like and save toggles.', states: ['liked', 'saved', 'featured', 'copied'], standard: 'INTERACTION.md optimistic' },
  { id: 'comment', title: 'Comment, CommentComposer', summary: 'A comment with like and reply; the composer with its own pending, success and failure.', states: ['idle', 'posting', 'posted', 'failed'], standard: 'INTERACTION.md action table' },
  { id: 'messages', title: 'ThreadList, ChatLog, MessageComposer', summary: 'Direct messages: threads with unread counts, the log as role=log, the composer.', states: ['unread', 'selected', 'sent'], standard: 'INTERACTION.md offline' },
  { id: 'profile', title: 'ProfileHeader, Gallery, FollowButton, PlayerRow', summary: 'A builder: level, stats, follow, the build gallery as slots.', states: ['following', 'not following', 'empty gallery'], standard: 'design-system.md §4' },
  { id: 'notifications', title: 'NotificationList, Bell', summary: 'The bell with its count; the list as role=log with unread marks in shape and word.', states: ['unread', 'read', 'none', '99+'], standard: 'INTERACTION.md notifications' },
  { id: 'servers', title: 'ServerFilterBar, ServerRow', summary: 'Filters by version, mode, region and players; rows with ping, players and a copy address.', states: ['online', 'full', 'down', 'filtered'], standard: 'INTERACTION.md live feeds' },
  { id: 'groups', title: 'GroupCard', summary: 'A server or realm group with members, and join or leave.', states: ['joined', 'not joined', 'realm'], standard: 'design-system.md §4' },
  { id: 'challenge', title: 'ChallengeCard', summary: 'The weekly build challenge: theme, time left, entries and votes left.', states: ['open', 'voted', 'out of votes', 'closed'], standard: 'INTERACTION.md action table' },
  { id: 'events', title: 'EventCalendar', summary: 'The month grid with event days marked in shape, and the day’s events with RSVP.', states: ['today', 'selected', 'has events', 'going'], standard: 'design-system.md §4' },
  { id: 'moderation', title: 'QueueRow, ReportDialog', summary: 'The report dialog and the moderation queue with hide, warn, dismiss and undo.', states: ['open', 'hidden', 'warned', 'dismissed', 'busy'], standard: 'INTERACTION.md undo tiers' },
  { id: 'settings', title: 'SettingsPanel', summary: 'Appearance (theme, GUI scale, contrast, motion), privacy and notifications, autosaved.', states: ['saved', 'saving', 'failed'], standard: 'INTERACTION.md autosave' },
  { id: 'results', title: 'ResultGroup', summary: 'A titled group of search results with its count.', states: ['with results'], standard: 'interaction.md §Results' },
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
    summary: 'Delete a draft with Undo, and a build that posts in the background and reports back with a toast.',
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
 * Blockfeed's effects in ./vfx (MOTION-SYSTEM.md §Theme expression). All drawn in whole units and stepped frames:
 * no blur, no glow, no scale. Each one has a demo in the Effects section.
 */
export const EFFECTS: readonly EffectEntry[] = [
  { id: 'ignite', title: 'Select frame', kind: 'standing', use: 'frequent: hover and focus on cards and slots', summary: 'A one-unit white frame, instant, like the game cursor over a slot. No glow.' },
  { id: 'scanlines', title: 'Scanlines', kind: 'standing', use: 'texture, still', summary: 'One-unit lines every three units behind the content. Never moves.' },
  { id: 'dither', title: 'Dither', kind: 'standing', use: 'texture, still: locked and unavailable surfaces', summary: 'A two-unit checker, the way old games shaded without gradients.' },
  { id: 'glint', title: 'Glint', kind: 'one-shot', use: 'occasional: new, featured, a winner', summary: 'The enchanted shine: a hard diagonal band steps across once, in 8 frames.' },
  { id: 'scan', title: 'Scan', kind: 'one-shot', use: 'occasional: a background job starts or checks', summary: 'A two-unit line steps down the element once.' },
  { id: 'pop', title: 'Pop', kind: 'one-shot', use: 'frequent: a state flipped (toggle, like, tab)', summary: 'A two-frame hop of two units, the hotbar item bump. No scale.' },
  { id: 'shake', title: 'Shake', kind: 'one-shot', use: 'occasional: a refusal, after the error text shows', summary: 'Three two-unit swings with no tween, 300 ms, once.' },
  { id: 'pulse', title: 'Pulse', kind: 'one-shot', use: 'occasional: something arrived here (a badge, a live row)', summary: 'Hard one-unit rings step outward three times.' },
  { id: 'wipe', title: 'Wipe', kind: 'one-shot', use: 'occasional: a reveal', summary: 'A reveal in six column steps. A short fade under reduced motion.' },
  { id: 'flicker', title: 'Flicker', kind: 'one-shot', use: 'rare: a status word switching (offline, back online)', summary: 'A torch dip: twice in 600 ms, small elements only.' },
  { id: 'pickup', title: 'Pickup', kind: 'script', use: 'occasional: a gain kept somewhere (save, like, follow)', summary: 'A copy of the icon hops in an 8-frame arc to where it is kept, which pops.' },
  { id: 'xp', title: 'Experience', kind: 'script', use: 'occasional: progress earned (vote counted, upload done)', summary: 'Orbs spill out and home into the bar or counter that grew.' },
  { id: 'decode', title: 'Decode', kind: 'script', use: 'occasional: a code or seed arriving', summary: 'Glyphs resolve into the text left to right; the real text is announced at once.' },
  { id: 'burst', title: 'Burst', kind: 'script', use: 'rare: a milestone, never a routine action', summary: 'Square debris that shrinks a unit at a time, snapped to the grid.' },
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
