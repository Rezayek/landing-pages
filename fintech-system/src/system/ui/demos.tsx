/**
 * The /system page demos of Kitty's components: each component in its states, drawn by the real component, with the
 * sample household (sample.ts). Keys match the ids in registry.ts (KITTY_COMPONENTS). Pinned states use
 * `preview`; overlays render `inline` so they can be seen at rest.
 */
import { useEffect, useId, useRef, useState, type ComponentType, type JSX, type ReactNode } from 'react'
import { ArrowLeftRight, Bell, Ellipsis, Filter, House, Pencil, Receipt, Settings, Trash2, Users } from 'lucide-react'
import { ActionButton, Skeleton } from '../feedback'
import { simulate, type LatencyId } from '../latency'
import {
  AmountInput,
  Checkbox,
  CodeInput,
  Combobox,
  DateInput,
  ErrorSummary,
  Field,
  Fieldset,
  FileInput,
  RadioGroup,
  Select,
  SegmentedControl,
  Slider,
  Switch,
  TextInput,
  Textarea,
  counterFor,
  parseAmount,
} from './forms'
import {
  Amount,
  Avatar,
  AvatarStack,
  Button,
  ButtonGroup,
  Card,
  IconButton,
  Logo,
  PersonTag,
  SkipLink,
  StatusTag,
  TextLink,
  Tick,
  VisuallyHidden,
} from './core'
import { CommandMenu, Dialog, MenuButton, Popover, Sheet } from './overlays'
import { BackLink, BottomTabBar, Breadcrumbs, Footer, Pagination, Sidebar, Tabs, TopBar, AppShell } from './nav'
import {
  Accordion,
  AllowanceCard,
  Banner,
  BalanceCard,
  BudgetMeter,
  DashboardGrid,
  DescriptionList,
  ErrorPage,
  FilterBar,
  GridItem,
  KpiTile,
  RequestCard,
  TransactionRow,
  TransactionTable,
} from './data'
import { BarList, ChartLegend, LineChart, RingChart, StackedBar } from './charts'
import { Ledger } from './ledger'
import { BALANCE_PENCE, BALANCE_SERIES, BUDGETS, PEOPLE, SPENDING_BY_CATEGORY, SPENDING_BY_PERSON, TRANSACTIONS, personById } from './sample'

export interface KittyDemoProps {
  latency: LatencyId
}

const [ada, , ivy, theo] = PEOPLE
const people = PEOPLE.map((p) => ({ id: p.id, label: p.name, hint: p.role === 'kid' ? 'Kid' : 'Parent', person: p }))

function Cell({ caption, children }: { caption: string; children: ReactNode }): JSX.Element {
  return (
    <figure className="sys-cell">
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

/* Core ------------------------------------------------------------------------------------------------------------ */

function FocusRingDemo(): JSX.Element {
  return (
    <div className="sys-cells">
      <Cell caption="button">
        <Button preview="focus">Save budget</Button>
      </Cell>
      <Cell caption="link">
        <span className="k-focusable" data-preview="focus" style={{ borderRadius: 2 }}>
          <TextLink href="#activity">View all activity</TextLink>
        </span>
      </Cell>
      <Cell caption="on the band">
        <div style={{ padding: 'var(--space-3)', background: 'var(--band-bg)', borderRadius: 'var(--radius-card)' }}>
          <button type="button" className="k-btn" data-variant="secondary" style={{ outline: '2px solid var(--band-ink)', outlineOffset: 2 }}>
            Ask for money
          </button>
        </div>
      </Cell>
    </div>
  )
}

function SkipLinkDemo(): JSX.Element {
  return (
    <div style={{ position: 'relative', minBlockSize: 72 }}>
      <SkipLink preview="focus" />
      <p className="sys-note" style={{ paddingBlockStart: 56 }}>
        Shown as it appears on the first Tab. At rest it is off screen.
      </p>
    </div>
  )
}

function VisuallyHiddenDemo(): JSX.Element {
  return (
    <p>
      <AvatarStack people={PEOPLE} max={3} /> <VisuallyHidden>Read aloud: Ada, Sam, Ivy and 1 more: Theo</VisuallyHidden>
      <span className="sys-note"> The stack's names are read aloud, not shown.</span>
    </p>
  )
}

function ThemeSwitchDemo(): JSX.Element {
  const [theme, setTheme] = useState('system')
  const [more, setMore] = useState(false)
  return (
    <div className="k-stack" style={{ maxInlineSize: 420 }}>
      <RadioGroup
        legend="Theme"
        name="theme-demo"
        value={theme}
        onChange={setTheme}
        options={[
          { id: 'system', label: 'Match this device' },
          { id: 'light', label: 'Light' },
          { id: 'dark', label: 'Dark' },
        ]}
      />
      <Switch label="More contrast" hint="Darker text and stronger lines" checked={more} onChange={setMore} />
      <p className="sys-note">A demo of the control: the page toolbar above applies it for real.</p>
    </div>
  )
}

function LogoDemo(): JSX.Element {
  return (
    <div className="sys-cells">
      <Cell caption="full, a link home">
        <Logo href="#home" />
      </Cell>
      <Cell caption="mark only (rail, favicon)">
        <Logo markOnly />
      </Cell>
      <Cell caption="on the band">
        <span style={{ display: 'inline-flex', padding: 'var(--space-3)', background: 'var(--band-bg)', borderRadius: 'var(--radius-card)' }}>
          <Logo tone="band" />
        </span>
      </Cell>
    </div>
  )
}

const VARIANTS = ['primary', 'secondary', 'quiet', 'danger', 'danger-quiet'] as const

function ButtonDemo(): JSX.Element {
  return (
    <div className="sys-matrix">
      {VARIANTS.map((variant) => (
        <div key={variant} className="sys-matrix__row">
          <h4>{variant}</h4>
          <div className="sys-cells">
            <Cell caption="idle">
              <Button variant={variant}>{variant.startsWith('danger') ? 'Remove Sam' : 'Save budget'}</Button>
            </Cell>
            <Cell caption="hover">
              <Button variant={variant} preview="hover">
                {variant.startsWith('danger') ? 'Remove Sam' : 'Save budget'}
              </Button>
            </Cell>
            <Cell caption="focus">
              <Button variant={variant} preview="focus">
                {variant.startsWith('danger') ? 'Remove Sam' : 'Save budget'}
              </Button>
            </Cell>
            <Cell caption="pressed">
              <Button variant={variant} preview="pressed">
                {variant.startsWith('danger') ? 'Remove Sam' : 'Save budget'}
              </Button>
            </Cell>
          </div>
        </div>
      ))}
      <div className="sys-matrix__row">
        <h4>small, with icon, unavailable</h4>
        <div className="sys-cells">
          <Cell caption="small (compact rows)">
            <Button size="sm">Split</Button>
          </Cell>
          <Cell caption="with icon">
            <Button icon={Receipt}>Add a receipt</Button>
          </Cell>
          <Cell caption="unavailable, with its reason">
            <Button variant="primary" unavailableReason="Only parents can approve requests">
              Approve £5.00
            </Button>
          </Cell>
        </div>
      </div>
    </div>
  )
}

function IconButtonDemo(): JSX.Element {
  return (
    <div className="sys-cells">
      <Cell caption="idle">
        <IconButton icon={Ellipsis} label="More actions" />
      </Cell>
      <Cell caption="hover, with its tooltip">
        <span style={{ display: 'inline-block', paddingBlockEnd: 'var(--space-6)' }}>
          <IconButton icon={Filter} label="Filters" preview="hover" showTip />
        </span>
      </Cell>
      <Cell caption="focus">
        <IconButton icon={Settings} label="Settings" preview="focus" />
      </Cell>
      <Cell caption="pressed">
        <IconButton icon={Pencil} label="Edit food budget" preview="pressed" />
      </Cell>
      <Cell caption="toggled">
        <IconButton icon={Filter} label="Filters" aria-pressed="true" />
      </Cell>
      <Cell caption="with badge">
        <IconButton icon={Bell} label="Notifications, 2 new" badge />
      </Cell>
      <Cell caption="secondary">
        <IconButton icon={Trash2} label="Delete budget" variant="secondary" />
      </Cell>
    </div>
  )
}

function LinkDemo(): JSX.Element {
  return (
    <div className="k-stack">
      <p style={{ margin: 0 }}>
        Your statement is in <TextLink href="#settings">Settings → Statements</TextLink> for 7 days.
      </p>
      <div className="sys-cells">
        <Cell caption="standalone">
          <TextLink standalone href="#activity">
            View all activity
          </TextLink>
        </Cell>
        <Cell caption="hover">
          <TextLink href="#activity" preview="hover">
            Forgot passcode
          </TextLink>
        </Cell>
        <Cell caption="current page">
          <TextLink href="#budgets" current>
            Budgets
          </TextLink>
        </Cell>
        <Cell caption="external">
          <TextLink href="https://example.com" external>
            Get help
          </TextLink>
        </Cell>
      </div>
    </div>
  )
}

function ButtonGroupDemo(): JSX.Element {
  return (
    <div className="k-stack">
      <ButtonGroup label="Ivy’s request">
        <Button variant="quiet">Decline</Button>
        <Button variant="primary">Approve £5.00</Button>
      </ButtonGroup>
      <div style={{ maxInlineSize: 320 }}>
        <ButtonGroup label="Remove Sam" stacked>
          <Button>Cancel</Button>
          <Button variant="danger">Remove Sam</Button>
        </ButtonGroup>
      </div>
    </div>
  )
}

function MenuDemo(): JSX.Element {
  return (
    <div className="sys-cells" style={{ alignItems: 'flex-start', minBlockSize: 260 }}>
      <Cell caption="open: row actions">
        <MenuButton
          defaultOpen
          items={[
            { id: 'split', label: 'Split this bill', icon: Users },
            { id: 'category', label: 'Change category', icon: Pencil },
            { id: 'receipt', label: 'Add a receipt', icon: Receipt },
            { id: 'remove', label: 'Remove Sam', icon: Trash2, danger: true, separatorBefore: true },
            { id: 'parent', label: 'Remove Ada', unavailableReason: 'A kid cannot remove a parent' },
          ]}
          trigger={(props) => (
            <button type="button" className="k-iconbtn" aria-label="More actions for Tesco Express" {...props}>
              <Ellipsis className="k-icon" aria-hidden="true" />
            </button>
          )}
        />
      </Cell>
      <Cell caption="closed: try it">
        <MenuButton
          items={[
            { id: 'okafor', label: 'The Okafor home' },
            { id: 'nan', label: 'Nan’s flat' },
          ]}
          trigger={(props) => (
            <button type="button" className="k-btn" data-variant="secondary" {...props}>
              Switch household
            </button>
          )}
        />
      </Cell>
    </div>
  )
}

function TooltipDemo(): JSX.Element {
  return (
    <div className="sys-cells" style={{ minBlockSize: 72 }}>
      <Cell caption="shown on hover after 600 ms, at once on focus">
        <span style={{ display: 'inline-block', paddingBlockEnd: 'var(--space-6)' }}>
          <IconButton icon={House} label="Home" showTip />
        </span>
      </Cell>
    </div>
  )
}

function StatusTagDemo(): JSX.Element {
  return (
    <div className="k-row">
      <StatusTag tone="positive">Paid</StatusTag>
      <StatusTag tone="positive">Approved</StatusTag>
      <StatusTag tone="info">Waiting</StatusTag>
      <StatusTag tone="info">Invited</StatusTag>
      <StatusTag tone="warning">Nearly at limit</StatusTag>
      <StatusTag tone="warning">Waiting to send</StatusTag>
      <StatusTag tone="negative">£12.40 over</StatusTag>
      <StatusTag tone="negative">Not sent</StatusTag>
      <StatusTag tone="neutral">Pending</StatusTag>
      <StatusTag tone="neutral">Owes £1,240.00</StatusTag>
    </div>
  )
}

function AmountDemo(): JSX.Element {
  const [pence, setPence] = useState(BALANCE_PENCE)
  return (
    <div className="k-stack">
      <div className="sys-cells">
        <Cell caption="out">
          <Amount pence={-4210} signed />
        </Cell>
        <Cell caption="in">
          <Amount pence={140000} signed />
        </Cell>
        <Cell caption="balance">
          <Amount pence={BALANCE_PENCE} />
        </Cell>
        <Cell caption="pending">
          <Amount pence={-1500} signed pending />
        </Cell>
        <Cell caption="zero">
          <Amount pence={0} />
        </Cell>
        <Cell caption="missing">
          <Amount pence={null} />
        </Cell>
        <Cell caption="hidden">
          <Amount pence={BALANCE_PENCE} hidden />
        </Cell>
        <Cell caption="large">
          <Amount pence={84210} size="lg" />
        </Cell>
        <Cell caption="long">
          <Amount pence={1234567890} size="lg" />
        </Cell>
      </div>
      <div className="k-row">
        <Amount pence={pence} size="xl" live />
        <Button size="sm" onClick={() => setPence((p) => p - 4210)}>
          Sam spends £42.10
        </Button>
      </div>
    </div>
  )
}

function AvatarDemo(): JSX.Element {
  return (
    <div className="k-stack">
      <div className="k-row">
        {PEOPLE.map((p) => (
          <Avatar key={p.id} person={p} size={40} />
        ))}
        <Avatar person={{ id: 'max', name: 'Max', role: 'kid', colour: 5, invited: true }} size={40} />
      </div>
      <div className="k-row">
        <Avatar person={ada} size={24} />
        <Avatar person={ada} size={32} />
        <Avatar person={ada} size={40} />
        <Avatar person={ada} size={64} />
      </div>
      <AvatarStack people={[...PEOPLE, { id: 'max', name: 'Max', role: 'kid', colour: 5 }, { id: 'leo', name: 'Leo', role: 'kid', colour: 1 }]} />
    </div>
  )
}

function PersonTagDemo(): JSX.Element {
  const [inBill, setInBill] = useState<string[]>(['ada', 'sam', 'ivy'])
  const [filters, setFilters] = useState<string[]>(['sam', 'ivy'])
  return (
    <div className="k-stack">
      <div className="k-row">
        {PEOPLE.map((p) => (
          <PersonTag key={p.id} person={p} pressed={inBill.includes(p.id)} lockedReason={p.id === 'ada' ? 'Ada paid, so she’s in' : undefined} onToggle={() => setInBill((all) => (all.includes(p.id) ? all.filter((x) => x !== p.id) : [...all, p.id]))} />
        ))}
      </div>
      <div className="k-row">
        {filters.map((id) => (
          <PersonTag key={id} person={personById(id)} onRemove={() => setFilters((f) => f.filter((x) => x !== id))} />
        ))}
        <PersonTag person={{ id: 'max', name: 'Max', role: 'kid', colour: 5, invited: true }} />
      </div>
    </div>
  )
}

function CardDemo(): JSX.Element {
  return (
    <div className="sys-pair">
      <Card title="This month" action={<TextLink standalone href="#analytics">View spending</TextLink>}>
        <KpiTile label="Spent" pence={84210} delta={{ text: '£120.40 less than September', tone: 'good', direction: 'down' }} />
      </Card>
      <Card title="Ivy’s saving goal" href="#goal">
        <p style={{ margin: 0 }} className="k-muted">
          The whole card is one link; its title is the link text.
        </p>
      </Card>
      <Card title="Selected" selected>
        <p style={{ margin: 0 }}>A selectable card, checked.</p>
      </Card>
    </div>
  )
}

/* Forms ----------------------------------------------------------------------------------------------------------- */

function FieldDemo(): JSX.Element {
  const ids = { a: useId(), b: useId(), c: useId(), d: useId(), e: useId() }
  return (
    <div className="sys-pair">
      <Field id={ids.a} label="Household name" hint="40 characters or fewer">
        {(d) => <TextInput id={ids.a} aria-describedby={d} defaultValue="The Okafor home" />}
      </Field>
      <Field id={ids.b} label="Email address or phone" message={{ tone: 'negative', text: 'Email address must include @, like sam@example.com' }}>
        {(d) => <TextInput id={ids.b} aria-describedby={d} invalid defaultValue="sam.example.com" />}
      </Field>
      <Field id={ids.c} label="Amount to send" message={{ tone: 'warning', text: 'That’s more than half the kitty' }}>
        {(d) => <AmountInput id={ids.c} value="700.00" onChange={() => {}} describedBy={d} />}
      </Field>
      <Field id={ids.d} label="Email address or phone" message={{ tone: 'positive', text: 'Max already has Kitty: they will join this household' }} pending={false}>
        {(d) => <TextInput id={ids.d} aria-describedby={d} defaultValue="max@example.com" />}
      </Field>
      <Field id={ids.e} label="Note" optional pending>
        {(d) => <TextInput id={ids.e} aria-describedby={d} placeholder="Football boots" />}
      </Field>
    </div>
  )
}

function TextInputDemo(): JSX.Element {
  const [search, setSearch] = useState('tesco')
  const id = useId()
  return (
    <div className="sys-pair">
      <Cell caption="idle">
        <TextInput aria-label="Name" placeholder="sam@example.com" />
      </Cell>
      <Cell caption="hover">
        <TextInput aria-label="Name" preview="hover" defaultValue="Sam" />
      </Cell>
      <Cell caption="focus">
        <TextInput aria-label="Name" preview="focus" defaultValue="Sam" />
      </Cell>
      <Cell caption="error">
        <TextInput aria-label="Email" invalid defaultValue="sam.example.com" />
      </Cell>
      <Cell caption="read-only">
        <TextInput aria-label="Household" readOnly defaultValue="The Okafor home" />
      </Cell>
      <Cell caption="disabled">
        <TextInput aria-label="Household" disabled defaultValue="The Okafor home" />
      </Cell>
      <Cell caption="search, with clear">
        <TextInput id={id} aria-label="Search activity" search value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} />
      </Cell>
      <Cell caption="long value">
        <TextInput aria-label="Note" defaultValue="Football boots for Saturday's match and the spare shin pads Theo keeps losing" />
      </Cell>
    </div>
  )
}

function AmountInputDemo(): JSX.Element {
  const [value, setValue] = useState('20')
  const id = useId()
  const pence = parseAmount(value)
  const over = pence !== null && !Number.isNaN(pence) && pence > BALANCE_PENCE
  const bad = pence !== null && Number.isNaN(pence)
  return (
    <div className="sys-pair">
      <Field id={id} label="Amount to send" hint="Up to £1,284.50, the money in the kitty" message={over ? { tone: 'negative', text: 'There is £1,284.50 in the kitty. Add money, or send less.' } : bad ? { tone: 'negative', text: 'Amount must be in pounds and pence, like 12.50' } : null}>
        {(d) => <AmountInput id={id} value={value} onChange={setValue} invalid={over || bad} describedBy={d} size="lg" />}
      </Field>
      <div className="k-stack">
        <Cell caption="compact, in a split row">
          <AmountInput id={`${id}-b`} value="21.00" onChange={() => {}} label="Sam's share" />
        </Cell>
        <p className="sys-note">Type 2000 to see the over-balance error, or 12.345 for the format error.</p>
      </div>
    </div>
  )
}

const NEAR = 'For the school trip to the science museum on Friday, plus the gift shop, plus the train there and back with Theo too'
const OVER = `${NEAR}, and a sandwich at lunch because the café is dear.`

function TextareaField({ initial, caption }: { initial: string; caption: string }): JSX.Element {
  const [text, setText] = useState(initial)
  const id = useId()
  const counter = counterFor(text.length, 140)
  return (
    <Cell caption={caption}>
      <Field id={id} label="Why do you need it?" optional counter={counter} message={counter.tone === 'negative' ? { tone: 'negative', text: 'Note must be 140 characters or fewer' } : null}>
        {(d) => <Textarea id={id} value={text} onChange={(e) => setText(e.target.value)} aria-describedby={d} invalid={counter.tone === 'negative'} />}
      </Field>
    </Cell>
  )
}

function TextareaDemo(): JSX.Element {
  return (
    <div className="sys-pair">
      <TextareaField initial="For the school trip to the science museum on Friday" caption="idle" />
      <TextareaField initial={NEAR} caption="near the limit (20 or fewer left)" />
      <TextareaField initial={OVER} caption="over the limit" />
    </div>
  )
}

function CodeInputDemo({ latency }: KittyDemoProps): JSX.Element {
  const [code, setCode] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'wrong'>('idle')
  const id = useId()
  return (
    <div className="sys-pair">
      <Field id={id} label="Enter your passcode" hint="Try 123456 (sample); anything else is wrong" message={state === 'wrong' ? { tone: 'negative', text: 'That passcode is not right. 2 tries left.' } : null}>
        {(d) => (
          <CodeInput
            id={id}
            value={code}
            onChange={(v) => {
              setCode(v)
              if (state === 'wrong') setState('idle')
            }}
            invalid={state === 'wrong'}
            busy={state === 'busy'}
            describedBy={d}
            onComplete={async (v) => {
              setState('busy')
              try {
                await simulate(latency, true)
                setState(v === '123456' ? 'idle' : 'wrong')
                if (v !== '123456') setCode('')
              } catch {
                setState('wrong')
                setCode('')
              }
            }}
          />
        )}
      </Field>
      <Cell caption="filling (3 of 6)">
        <CodeInput id={`${id}-fill`} label="Passcode, filling" value="123" onChange={() => {}} previewFocus />
      </Cell>
      <Cell caption="checking">
        <CodeInput id={`${id}-busy`} label="Passcode, checking" value="123456" onChange={() => {}} busy />
      </Cell>
      <Cell caption="wrong">
        <div className="k-stack">
          <CodeInput id={`${id}-wrong`} label="Passcode, wrong" value="" onChange={() => {}} invalid />
          <p className="k-field__msg" data-tone="negative">
            That passcode is not right. 2 tries left.
          </p>
        </div>
      </Cell>
      <Cell caption="locked">
        <CodeInput id={`${id}-locked`} label="Passcode, locked" value="" onChange={() => {}} locked />
      </Cell>
    </div>
  )
}

const CATEGORIES = ['Groceries', 'Bills', 'School', 'Transport', 'Fun', 'Home'].map((c) => ({ id: c, label: c }))

function SelectDemo(): JSX.Element {
  const [value, setValue] = useState<string | null>('Groceries')
  return (
    <div className="sys-pair" style={{ minBlockSize: 300 }}>
      <Cell caption="open">
        <Select id="cat-open" label="Category" options={CATEGORIES} value={value} onChange={setValue} defaultOpen />
      </Cell>
      <Cell caption="placeholder">
        <Select id="cat-empty" label="Category" options={CATEGORIES} value={null} onChange={() => {}} placeholder="Choose a category" />
      </Cell>
      <Cell caption="loading options">
        <Select id="cat-load" label="Category" options={[]} value={null} onChange={() => {}} loading defaultOpen placeholder="Choose a category" />
      </Cell>
    </div>
  )
}

function ComboboxDemo(): JSX.Element {
  const [value, setValue] = useState<string | null>(null)
  const [invited, setInvited] = useState<string | null>(null)
  const id = useId()
  return (
    <div className="sys-pair">
      <Cell caption="live: type a name, or “Max”">
        <Field id={id} label="To">
          {(d) => <Combobox id={id} options={people} value={value} onChange={setValue} describedBy={d} onInvite={(name) => setInvited(name)} />}
        </Field>
        {invited ? <p className="sys-note">Invite {invited} would open the invite flow.</p> : null}
      </Cell>
      <Cell caption="typing “s”: filtered, first active">
        <Combobox id={`${id}-typing`} options={people} value={null} onChange={() => {}} initialText="s" defaultOpen placeholder="To" />
      </Cell>
      <Cell caption="selected">
        <Combobox id={`${id}-selected`} options={people} value="sam" onChange={() => {}} placeholder="To" />
      </Cell>
      <Cell caption="no results, with invite">
        <Combobox id={`${id}-none`} options={people} value={null} onChange={() => {}} initialText="Max" defaultOpen onInvite={() => {}} placeholder="To" />
      </Cell>
    </div>
  )
}

function CheckboxDemo(): JSX.Element {
  const [rows, setRows] = useState<string[]>(['t1'])
  const all = TRANSACTIONS.slice(0, 3).map((t) => t.id)
  return (
    <div className="k-stack">
      <Checkbox label="Select all" checked={rows.length === all.length} indeterminate={rows.length > 0 && rows.length < all.length} onChange={() => setRows(rows.length === all.length ? [] : all)} />
      {TRANSACTIONS.slice(0, 3).map((t) => (
        <Checkbox key={t.id} label={t.payee} checked={rows.includes(t.id)} onChange={() => setRows((r) => (r.includes(t.id) ? r.filter((x) => x !== t.id) : [...r, t.id]))} />
      ))}
      <Checkbox label="Notify me when a kid asks for money" hint="You can change this in Settings" defaultChecked />
      <Checkbox label="Close the household" disabled hint="Only Ada can close it" />
    </div>
  )
}

function RadioGroupDemo(): JSX.Element {
  const [rhythm, setRhythm] = useState('weekly')
  const [colour, setColour] = useState('3')
  return (
    <div className="sys-pair">
      <RadioGroup
        legend="How often"
        name="rhythm"
        value={rhythm}
        onChange={setRhythm}
        options={[
          { id: 'weekly', label: 'Every week', hint: 'On the day you choose' },
          { id: 'monthly', label: 'Every month', hint: 'On the same date' },
        ]}
      />
      <RadioGroup
        legend="Choose your colour"
        name="colour"
        value={colour}
        onChange={setColour}
        inline
        options={[
          { id: '1', label: 'Tomato', swatch: 1, disabled: true, hint: 'Ada’s colour' },
          { id: '2', label: 'Sky', swatch: 2, disabled: true, hint: 'Sam’s colour' },
          { id: '3', label: 'Plum', swatch: 3 },
          { id: '4', label: 'Teal', swatch: 4 },
          { id: '5', label: 'Honey', swatch: 5 },
        ]}
      />
    </div>
  )
}

function SwitchDemo({ latency }: KittyDemoProps): JSX.Element {
  const [on, setOn] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  return (
    <div className="k-stack" style={{ maxInlineSize: 420 }}>
      <Switch
        label="Face ID"
        hint="Use Face ID instead of your passcode"
        checked={on}
        pending={pending}
        onChange={async (next) => {
          setOn(next)
          setError(false)
          setPending(true)
          try {
            await simulate(latency, true)
          } catch {
            setOn(!next)
            setError(true)
          } finally {
            setPending(false)
          }
        }}
      />
      {error ? <p className="k-field__msg" data-tone="negative">Not saved. Try again.</p> : null}
      <Switch label="Hide balances" checked onChange={() => {}} />
      <Switch label="Live balance (saving)" checked onChange={() => {}} pending />
      <div>
        <Switch label="Notify me when a kid asks (not saved)" checked={false} onChange={() => {}} />
        <p className="k-field__msg" data-tone="negative">
          Not saved. Try again.
        </p>
      </div>
      <Switch label="Touch ID" checked={false} onChange={() => {}} unavailableReason="This phone doesn’t support Touch ID" />
    </div>
  )
}

function SliderDemo(): JSX.Element {
  const [pence, setPence] = useState(30000)
  const [text, setText] = useState('300.00')
  const id = useId()
  return (
    <div className="k-stack" style={{ maxInlineSize: 420 }}>
      <Field id={id} label="Monthly limit" hint="Last month: £276.40">
        {(d) => (
          <AmountInput
            id={id}
            value={text}
            describedBy={d}
            onChange={(t) => {
              setText(t)
              const p = parseAmount(t)
              if (p !== null && !Number.isNaN(p)) setPence(Math.min(100000, p))
            }}
          />
        )}
      </Field>
      <Slider
        id={`${id}-range`}
        label="Monthly limit"
        min={0}
        max={100000}
        step={500}
        value={pence}
        marker="Last month: £276.40"
        onChange={(p) => {
          setPence(p)
          setText((p / 100).toFixed(2))
        }}
      />
    </div>
  )
}

function SegmentedDemo(): JSX.Element {
  const [period, setPeriod] = useState('month')
  const [split, setSplit] = useState('equal')
  return (
    <div className="k-stack">
      <SegmentedControl
        label="Period"
        value={period}
        onChange={setPeriod}
        options={[
          { id: 'month', label: 'This month' },
          { id: '3m', label: '3 months' },
          { id: 'year', label: 'Year', unavailable: true },
        ]}
      />
      <p className="sys-note">“Year” is unavailable: there is no year of data yet.</p>
      <SegmentedControl label="Split" value={split} onChange={setSplit} block options={[{ id: 'equal', label: 'Equal' }, { id: 'custom', label: 'Custom' }]} />
    </div>
  )
}

function DateDemo(): JSX.Element {
  const [value, setValue] = useState('30 Oct 2026')
  const id = useId()
  return (
    <div style={{ minBlockSize: 380, maxInlineSize: 360 }}>
      <Field id={id} label="First payday" hint="For example, 30 Oct 2026">
        {(d) => <DateInput id={id} value={value} onChange={setValue} describedBy={d} min={new Date(2026, 9, 23)} defaultOpen />}
      </Field>
    </div>
  )
}

function FieldsetDemo(): JSX.Element {
  const [rows, setRows] = useState(['sam@example.com', 'theo@example.com'])
  return (
    <Fieldset legend="Invite family" hint="They’ll get a link to join the Okafor home">
      {rows.map((row, i) => (
        <div key={i} className="k-row" style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }}>
          <div style={{ flex: 1 }}>
            <Field id={`invite-${i}`} label="Email address or phone">
              {(d) => <TextInput id={`invite-${i}`} aria-describedby={d} defaultValue={row} />}
            </Field>
          </div>
          <IconButton icon={Trash2} label={`Remove invite for ${row}`} onClick={() => setRows((r) => r.filter((_, j) => j !== i))} />
        </div>
      ))}
      <div>
        <Button variant="quiet" onClick={() => setRows((r) => [...r, ''])}>
          Add another
        </Button>
      </div>
    </Fieldset>
  )
}

function ErrorSummaryDemo(): JSX.Element {
  return (
    <ErrorSummary
      errors={[
        { fieldId: 'invite-0', text: 'Enter an email address or phone number' },
        { fieldId: 'household-name', text: 'Enter a name for your household' },
      ]}
    />
  )
}

function FileRow({ name }: { name: string }): JSX.Element {
  return (
    <div className="k-file-row">
      <span className="k-file-row__thumb">
        <Receipt className="k-icon" aria-hidden="true" />
      </span>
      <span style={{ flex: 1, minInlineSize: 0, overflowWrap: 'anywhere' }}>{name}</span>
      <StatusTag tone="positive">Uploaded</StatusTag>
    </div>
  )
}

const FILE_PROPS = { label: 'Choose a photo', hint: 'JPG, PNG or PDF, up to 10 MB', accept: 'image/*,application/pdf', maxBytes: 10 * 1024 * 1024 } as const

function FileInputDemo(): JSX.Element {
  const [file, setFile] = useState<string | null>(null)
  return (
    <div className="sys-pair">
      <Cell caption="live: choose a file; no receipt yet">
        <div className="k-stack" style={{ inlineSize: '100%' }}>
          <FileInput {...FILE_PROPS} onFile={(f) => setFile(f.name)} />
          {file ? (
            <FileRow name={file} />
          ) : (
            <p className="k-muted" style={{ margin: 0 }}>
              No receipt
            </p>
          )}
        </div>
      </Cell>
      <Cell caption="drag over (desktop)">
        <div style={{ inlineSize: '100%' }}>
          <FileInput {...FILE_PROPS} onFile={() => {}} previewOver />
        </div>
      </Cell>
      <Cell caption="uploaded">
        <div className="k-stack" style={{ inlineSize: '100%' }}>
          <FileInput {...FILE_PROPS} label="Replace the photo" onFile={() => {}} />
          <FileRow name="tesco-receipt-23-oct.jpg" />
        </div>
      </Cell>
      <Cell caption="too big">
        <div style={{ inlineSize: '100%' }}>
          <FileInput {...FILE_PROPS} onFile={() => {}} error="The photo must be 10 MB or smaller. This one is 14.2 MB." />
        </div>
      </Cell>
    </div>
  )
}

/* Overlays -------------------------------------------------------------------------------------------------------- */

function PopoverDemo(): JSX.Element {
  return (
    <div className="sys-pair">
      <Cell caption="open: the options, Clear and Done">
      <div style={{ minBlockSize: 240 }}>
      <Popover
        defaultOpen
        title="Person"
        trigger={(props) => (
          <button type="button" className="k-btn k-filter-btn" data-active {...props}>
            Person: Sam, Ivy
          </button>
        )}
        footer={(close) => (
          <>
            <Button variant="quiet" onClick={close}>
              Clear
            </Button>
            <Button onClick={close}>Done</Button>
          </>
        )}
      >
        {PEOPLE.map((p) => (
          <Checkbox key={p.id} label={p.name} defaultChecked={p.id === 'sam' || p.id === 'ivy'} />
        ))}
      </Popover>
      </div>
      </Cell>
      <Cell caption="closed: the trigger says what is chosen">
        <Popover
          title="Date"
          trigger={(props) => (
            <button type="button" className="k-btn k-filter-btn" {...props}>
              Date: This month
            </button>
          )}
        >
          <p className="k-muted">Date presets</p>
        </Popover>
      </Cell>
    </div>
  )
}

function DialogDemo({ latency }: KittyDemoProps): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className="k-stack">
      <Dialog
        inline
        open
        onClose={() => {}}
        title="Remove Sam from the household?"
        footer={
          <>
            <Button>Cancel</Button>
            <Button variant="danger">Remove Sam</Button>
          </>
        }
      >
        <p>Sam will lose access to the kitty and its activity. Their own Kitty account stays. You cannot undo this.</p>
      </Dialog>
      <div>
        <Button onClick={() => setOpen(true)}>Open the budget dialog</Button>
      </div>
      <BudgetDialog open={open} onClose={() => setOpen(false)} latency={latency} />
    </div>
  )
}

export function BudgetDialog({ open, onClose, latency, onSaved, inline, autoSave }: { open: boolean; onClose: () => void; latency: LatencyId; onSaved?: (pence: number) => void; /** Drawn in place (the /system run), not in the top layer. */ inline?: boolean; /** Press Save once it opens (the run). */ autoSave?: boolean }): JSX.Element | null {
  const [text, setText] = useState('300.00')
  const saveRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open || !autoSave) return
    const timer = window.setTimeout(() => saveRef.current?.click(), 250)
    return () => window.clearTimeout(timer)
  }, [open, autoSave])
  const [error, setError] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const id = useId()
  return (
    !open && inline ? null : <Dialog
      open={open}
      onClose={onClose}
      title="Food budget"
      size="form"
      inline={inline}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <ActionButton
            ref={saveRef}
            variant="primary"
            pendingLabel="Saving…"
            successLabel="Saved"
            slowLabel="Still saving…"
            successMessage="Food budget saved"
            errorMessage={() => 'Could not save the food budget. Your changes are still here. Try again.'}
            onAction={async (signal) => {
              setFailure(null)
              const pence = parseAmount(text)
              if (pence === null || Number.isNaN(pence)) {
                setError('Amount must be in pounds and pence, like 12.50')
                requestAnimationFrame(() => document.getElementById(id)?.focus())
                throw Object.assign(new Error('invalid'), { name: 'ValidationError' })
              }
              setError(null)
              await simulate(latency, true, signal)
              return pence
            }}
            onSuccess={(pence) => {
              onSaved?.(pence as number)
              onClose()
            }}
            onError={(e) => setFailure(e instanceof Error && e.name === 'ValidationError' ? null : 'Could not save the food budget. Your changes are still here. Try again.')}
          >
            Save budget
          </ActionButton>
        </>
      }
    >
      <Field id={id} label="Monthly limit" hint="Last month: £276.40" message={error ? { tone: 'negative', text: error } : null}>
        {(d) => <AmountInput id={id} value={text} onChange={setText} describedBy={d} invalid={!!error} />}
      </Field>
      {failure ? <p className="k-field__msg" data-tone="negative">{failure}</p> : null}
    </Dialog>
  )
}

function SheetDemo(): JSX.Element {
  return (
    <div className="sys-pair" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))' }}>
      <Cell caption="side (desktop)">
        <SheetDetail />
      </Cell>
      <Cell caption="bottom (phones)">
        <Sheet inline open side="bottom" onClose={() => {}} title="Change category">
          {['Groceries', 'Home', 'Fun'].map((c) => (
            <button key={c} type="button" className="k-menu-item">
              {c}
            </button>
          ))}
        </Sheet>
      </Cell>
      <Cell caption="loading">
        <Sheet inline open onClose={() => {}} title="Tesco Express">
          <div className="k-stack" aria-busy="true">
            <Skeleton variant="rect" width="8rem" height={35} />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rect" width="100%" height={20} />
            ))}
          </div>
        </Sheet>
      </Cell>
      <Cell caption="long content: the body scrolls, the head stays">
        <Sheet inline open onClose={() => {}} title="Statement, October" frameHeight={360}>
          <ul className="k-list">
            {TRANSACTIONS.map((row) => (
              <li key={row.id}>
                <TransactionRow row={row} />
              </li>
            ))}
          </ul>
        </Sheet>
      </Cell>
    </div>
  )
}

function SheetDetail(): JSX.Element {
  const t = TRANSACTIONS[0]
  const person = personById(t.person)
  return (
    <Sheet inline open onClose={() => {}} title={t.payee}>
      <Amount pence={t.pence} signed size="xl" />
      <DescriptionList
        items={[
          { term: 'Person', value: <span className="k-cell-person"><Avatar person={person} size={24} decorative />{person.name}</span> },
          { term: 'Category', value: t.category },
          { term: 'Date', value: 'Today, 14:05' },
          { term: 'Receipt', value: null },
        ]}
      />
      <div className="k-row">
        <Button icon={Users}>Split this bill</Button>
        <Button variant="quiet">Report a problem</Button>
      </div>
    </Sheet>
  )
}

const COMMANDS = [
  { id: 'go-activity', group: 'Go to', label: 'Activity', icon: ArrowLeftRight },
  { id: 'go-budgets', group: 'Go to', label: 'Budgets' },
  { id: 'p-sam', group: 'People', label: 'Sam', hint: 'Parent', icon: Users },
  { id: 'p-ivy', group: 'People', label: 'Ivy', hint: 'Kid', icon: Users },
  { id: 't-tesco', group: 'Transactions', label: 'Tesco Express', hint: '−£42.10 · Today' },
] as const

function CommandMenuDemo(): JSX.Element {
  return (
    <div className="sys-pair">
      <Cell caption="open, recent items">
        <CommandMenu inline open onClose={() => {}} items={COMMANDS} />
      </Cell>
      <Cell caption="no results">
        <CommandMenu inline open onClose={() => {}} items={COMMANDS} initialQuery="xyz" />
      </Cell>
    </div>
  )
}

/* Navigation ------------------------------------------------------------------------------------------------------ */

function AppShellDemo(): JSX.Element {
  return (
    <div style={{ border: 'var(--border) solid var(--line)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
      <AppShell current="home" embedded>
        <h4 style={{ margin: 0, fontSize: 'var(--step-3)' }}>Good morning, Ada</h4>
        <BalanceCard label="Family kitty" pence={BALANCE_PENCE} members={PEOPLE.map((p, i) => ({ person: p, spentPence: [40210, 32010, 6400, 5590][i] }))} inPence={140000} outPence={84210} updated="Updated just now" action={<Button variant="primary">Send money</Button>} />
      </AppShell>
    </div>
  )
}

function SidebarDemo(): JSX.Element {
  return (
    <div className="sys-pair" style={{ alignItems: 'start' }}>
      <Cell caption="expanded">
        <div style={{ inlineSize: 'var(--sidebar-w)', minBlockSize: 480, display: 'flex' }}>
          <Sidebar current="activity" label="Main, expanded demo" />
        </div>
      </Cell>
      <Cell caption="rail (labels in tooltips)">
        <div style={{ inlineSize: 'var(--rail-w)', minBlockSize: 480, display: 'flex' }}>
          <Sidebar current="activity" rail label="Main, rail demo" />
        </div>
      </Cell>
    </div>
  )
}

function TabBarDemo(): JSX.Element {
  return (
    <div className="sys-pair">
      <Cell caption="parent">
        <div style={{ inlineSize: '100%', maxInlineSize: 390 }}>
          <BottomTabBar current="budgets" label="Main on phones, parent demo" />
        </div>
      </Cell>
      <Cell caption="kid">
        <div style={{ inlineSize: '100%', maxInlineSize: 390 }}>
          <BottomTabBar current="home" kid label="Main on phones, kid demo" />
        </div>
      </Cell>
    </div>
  )
}

function TopBarDemo(): JSX.Element {
  return (
    <div className="k-stack">
      <TopBar unread={2} />
      <TopBar unread={0} scrolled />
    </div>
  )
}

function TabsDemo(): JSX.Element {
  const [tab, setTab] = useState('category')
  return (
    <Tabs label="Spending" tabs={[{ id: 'category', label: 'By category' }, { id: 'person', label: 'By person' }]} value={tab} onChange={setTab}>
      {tab === 'category' ? <BarList caption="Spending by category, October 2026" rows={SPENDING_BY_CATEGORY.slice(0, 3)} /> : <StackedBar caption="Spending by person, October 2026" rows={SPENDING_BY_PERSON} />}
    </Tabs>
  )
}

function BreadcrumbsDemo(): JSX.Element {
  return <Breadcrumbs trail={[{ label: 'Settings', href: '#settings' }, { label: 'Family', href: '#family' }, { label: 'Sam' }]} />
}

function PaginationDemo(): JSX.Element {
  const [page, setPage] = useState(2)
  return <Pagination page={page} pages={25} total={1240} perPage={50} onPage={setPage} />
}

function BackLinkDemo(): JSX.Element {
  return <BackLink to="#activity" label="Back to Activity" />
}

function FooterDemo(): JSX.Element {
  return <Footer />
}

/* Feedback (Kitty additions) -------------------------------------------------------------------------------------- */

function BannerDemo(): JSX.Element {
  return (
    <div className="k-stack">
      <Banner tone="warning" scope="global" title="You’re not connected">
        You can look around. Money cannot move until you’re back.
      </Banner>
      <Banner tone="positive" scope="global" title="You’re back">
        2 changes sent.
      </Banner>
      <Banner tone="warning" title="Food is over budget" action={<TextLink standalone href="#budgets">View budget</TextLink>}>
        £412.40 spent of £400.00 this month.
      </Banner>
      <Banner tone="negative" scope="page" title="Ivy’s card is frozen" action={<Button size="sm">Unfreeze card</Button>}>
        Ivy cannot spend until you unfreeze it.
      </Banner>
      <Banner tone="info" scope="global" title="Scheduled maintenance" onDismiss={() => {}}>
        Sending money will pause on Sun 1 Nov from 02:00 to 03:00. (sample)
      </Banner>
    </div>
  )
}

function ErrorPageDemo({ latency }: KittyDemoProps): JSX.Element {
  return (
    <div className="sys-grid">
      <ErrorPage code={404} />
      <ErrorPage code={500} />
      <ErrorPage code={503} onRetry={(signal) => simulate(latency, true, signal)} />
    </div>
  )
}

/* Data ------------------------------------------------------------------------------------------------------------ */

function TableDemo(): JSX.Element {
  const [sort, setSort] = useState<{ key: 'date' | 'amount'; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' })
  const rows = [...TRANSACTIONS.slice(0, 6), { ...TRANSACTIONS[1], id: 'tw', payee: 'Cinema refund', status: 'waiting' as const, pence: 1200 }]
  const sorted = sort.key === 'amount' ? [...rows].sort((a, b) => (sort.dir === 'asc' ? a.pence - b.pence : b.pence - a.pence)) : rows
  return (
    <TransactionTable
      caption="Recent activity"
      rows={sorted}
      sort={sort}
      selected={['t3']}
      newIds={['t1']}
      onSort={(key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))}
    />
  )
}

function ListRowDemo(): JSX.Element {
  return (
    <ul className="k-list" style={{ maxInlineSize: 420 }}>
      {[TRANSACTIONS[0], TRANSACTIONS[3], { ...TRANSACTIONS[6], status: 'failed' as const }, { ...TRANSACTIONS[8], payee: 'B&Q Home and Garden Centre, Wandsworth branch' }].map((row) => (
        <li key={row.id}>
          <TransactionRow row={row} onRetry={() => {}} />
        </li>
      ))}
    </ul>
  )
}

function DescriptionListDemo(): JSX.Element {
  return (
    <div style={{ maxInlineSize: 520 }}>
      <DescriptionList
        onChange={() => {}}
        items={[
          { term: 'To', value: 'Sam', change: 'Change recipient' },
          { term: 'Amount', value: <Amount pence={2000} />, change: 'Change amount' },
          { term: 'From', value: 'The family kitty' },
          { term: 'Arrives', value: 'In seconds' },
          { term: 'Note', value: null },
        ]}
      />
    </div>
  )
}

function KpiDemo(): JSX.Element {
  return (
    <div className="sys-grid">
      <KpiTile label="Spent" pence={84210} answer delta={{ text: '£120.40 less than September', tone: 'good', direction: 'down' }} />
      <KpiTile label="Money in" pence={140000} delta={{ text: '£52.00 more than September', tone: 'good', direction: 'up' }} />
      <KpiTile label="Fun" pence={9620} delta={{ text: '£31.00 more than September', tone: 'bad', direction: 'up' }} />
      <KpiTile label="Saved" pence={0} delta={{ text: 'First month', tone: 'none' }} />
    </div>
  )
}

const MEMBERS = PEOPLE.map((p, i) => ({ person: p, spentPence: [40210, 32010, 6400, 5590][i] }))

function BalanceCardDemo(): JSX.Element {
  const [pence, setPence] = useState(BALANCE_PENCE)
  const [tick, setTick] = useState(0)
  return (
    <div className="sys-pair">
      <BalanceCard
        label="Family kitty"
        pence={pence}
        members={MEMBERS}
        inPence={140000}
        outPence={84210}
        updated="Updated just now"
        tick={tick}
        action={
          <span className="k-row">
            <Button size="sm" onClick={() => { setPence((p) => p + 10000); setTick((t) => t + 1) }}>
              Add £100.00 (demo)
            </Button>
            <Button variant="primary">Send money</Button>
          </span>
        }
      />
      <BalanceCard label="Ivy’s money" pence={1200} members={[]} inPence={500} outPence={1800} updated="Updated 12 min ago" stale band action={<Button variant="secondary">Ask for money</Button>} />
      <BalanceCard label="Family kitty" pence={BALANCE_PENCE} members={MEMBERS} inPence={140000} outPence={84210} updated="Updated just now" hidden />
    </div>
  )
}

function BudgetMeterDemo(): JSX.Element {
  return (
    <div className="k-stack" style={{ gap: 'var(--space-5)', maxInlineSize: 560 }}>
      {BUDGETS.map((b) => (
        <BudgetMeter key={b.category} category={b.category} spent={b.spent} limit={b.limit} onEdit={() => {}} />
      ))}
      <BudgetMeter category="Fun" spent={13000} limit={15000} />
    </div>
  )
}

function AllowanceDemo({ latency }: KittyDemoProps): JSX.Element {
  return (
    <div className="sys-grid">
      <AllowanceCard kid={ivy} amount={500} rhythm="Friday" next="Fri 30 Oct" spent={1800} saved={1200} onTopUp={(signal) => simulate(latency, true, signal)} onEdit={() => {}} onPause={() => {}} />
      <AllowanceCard kid={theo} amount={500} rhythm="Friday" next={null} spent={400} saved={600} paused onEdit={() => {}} onPause={() => {}} />
      <AllowanceCard kid={ivy} amount={500} rhythm="Friday" next="Fri 6 Nov" spent={1800} saved={1200} paidToday kidView />
    </div>
  )
}

function RequestCardDemo({ latency }: KittyDemoProps): JSX.Element {
  return (
    <div className="sys-grid">
      <RequestCard kid={ivy} pence={500} reason="For the school trip to the science museum" when="2 hours ago" status="waiting" onApprove={(signal) => simulate(latency, true, signal)} onDecline={() => {}} />
      <RequestCard kid={theo} pence={2500} reason="New football boots" when="Yesterday" status="approved" />
      <RequestCard kid={ivy} pence={4000} reason="A game" when="Mon 26 Oct" status="declined" />
      <RequestCard kid={theo} pence={200000} reason="A bike, please, I'll pay it back" when="Today" status="waiting" overBalance onApprove={(signal) => simulate(latency, true, signal)} onDecline={() => {}} />
    </div>
  )
}

function FilterBarSample({ initial, label }: { initial: string[]; label: string }): JSX.Element {
  const [who, setWho] = useState<string[]>(initial)
  return (
    <FilterBar
      label={label}
      count={`${who.length ? 12 : 124} transactions`}
      onClear={who.length ? () => setWho([]) : undefined}
      filters={[
        {
          id: 'person',
          label: 'Person',
          value: who.length ? who.map((w) => personById(w).name).join(', ') : 'All',
          active: who.length > 0,
          render: () => (
            <>
              {PEOPLE.map((p) => (
                <Checkbox key={p.id} label={p.name} checked={who.includes(p.id)} onChange={() => setWho((w) => (w.includes(p.id) ? w.filter((x) => x !== p.id) : [...w, p.id]))} />
              ))}
            </>
          ),
        },
        { id: 'category', label: 'Category', value: 'All', active: false, render: () => <p className="k-muted">Categories</p> },
        { id: 'date', label: 'Date', value: 'This month', active: false, render: () => <p className="k-muted">Date presets</p> },
      ]}
    >
      <div style={{ inlineSize: 'min(240px, 100%)' }}>
        <TextInput aria-label={`Search activity, ${label}`} search placeholder="Search activity" />
      </div>
    </FilterBar>
  )
}

function FilterBarDemo(): JSX.Element {
  // Each bar's popover opens over the one below it, so no space is held empty for it
  return (
    <div className="k-stack" style={{ gap: 'var(--space-5)' }}>
      <Cell caption="applied: the count and Clear filters (press Person to open its options)">
        <FilterBarSample initial={['sam']} label="Filter activity, applied demo" />
      </Cell>
      <Cell caption="no filters: every value reads All">
        <FilterBarSample initial={[]} label="Filter activity, no filters demo" />
      </Cell>
    </div>
  )
}

function DashboardGridDemo(): JSX.Element {
  return (
    <DashboardGrid>
      <GridItem span={7}>
        <BalanceCard label="Family kitty" pence={BALANCE_PENCE} members={MEMBERS} inPence={140000} outPence={84210} updated="Updated just now" />
      </GridItem>
      <GridItem span={5}>
        <Card title="This month">
          <KpiTile label="Spent" pence={84210} delta={{ text: '£120.40 less than September', tone: 'good', direction: 'down' }} />
          <BudgetMeter category="Groceries" spent={31240} limit={40000} />
        </Card>
      </GridItem>
    </DashboardGrid>
  )
}

function LedgerDemo(): JSX.Element {
  const [replay, setReplay] = useState(0)
  const week = [
    { id: 'a', day: 'Fri', person: personById('ivy'), what: 'Pocket money', pence: -500 },
    { id: 'b', day: 'Thu', person: personById('sam'), what: 'Tesco Express', pence: -4210 },
    { id: 'c', day: 'Thu', person: personById('ada'), what: 'Octopus Energy, split 4 ways', pence: -8400 },
  ]
  return (
    <div className="sys-pair">
      <Cell caption="writing in (press Replay), with a request line">
        <Ledger
          key={replay}
          write
          title="The kitty · this week"
          label="Sample household"
          headingLevel={4}
          lines={[
            ...week,
            {
              id: 'd',
              day: 'Wed',
              person: personById('ivy'),
              what: 'asked for £5.00 for the school trip',
              actions: (
                <>
                  <Button variant="quiet" size="sm">
                    Decline
                  </Button>
                  <Button size="sm">Approve £5.00</Button>
                </>
              ),
            },
          ]}
          totalPence={128450}
        />
        <Button variant="quiet" size="sm" onClick={() => setReplay((n) => n + 1)}>
          Replay
        </Button>
      </Cell>
      <Cell caption="fresh line, noted with the tick">
        <Ledger
          title="The kitty · this week"
          headingLevel={4}
          lines={[...week, { id: 'd', day: 'Wed', person: personById('ivy'), what: 'School trip', pence: -500, note: 'Approved by you', tick: 1 }]}
          totalPence={127950}
          caption="That’s how a request works in Kitty: Ivy asks, a parent decides."
        />
      </Cell>
      <Cell caption="compact, with a waiting line">
        <Ledger compact title="Next on the list" headingLevel={4} lines={[{ id: 'w', day: 'Today', what: 'Your household', waiting: true }]} />
      </Cell>
      <Cell caption="narrow (under 26rem): who and what stack">
        <div style={{ inlineSize: '100%', maxInlineSize: 300 }}>
          <Ledger compact title="This week" headingLevel={4} lines={week} totalPence={115850} totalLabel="Running total" />
        </div>
      </Cell>
    </div>
  )
}

function AccordionDemo(): JSX.Element {
  return (
    <Accordion
      items={[
        { id: 'a', title: 'How do kids ask for money?', body: <p style={{ margin: 0 }}>From their own view: they choose an amount, add a reason, and you get a request to approve.</p> },
        { id: 'b', title: 'When is pocket money paid?', body: <p style={{ margin: 0 }}>On the day you choose, at 07:00. You can pause it any time.</p> },
      ]}
    />
  )
}

/* Charts ---------------------------------------------------------------------------------------------------------- */

function BarListDemo(): JSX.Element {
  return <BarList caption="Spending by category, October 2026" rows={SPENDING_BY_CATEGORY} />
}

function LineChartDemo(): JSX.Element {
  return <LineChart caption="The kitty through October" points={BALANCE_SERIES} summary="The kitty went from £1,020.00 to £1,284.50 in October" />
}

function StackedBarDemo(): JSX.Element {
  return <StackedBar caption="Spending by person, October 2026" rows={SPENDING_BY_PERSON} />
}

function RingDemo(): JSX.Element {
  return (
    <div className="sys-pair">
      <RingChart part={1800} whole={3000} name="Saved £18.00 of £30.00" partLabel="Saved £18.00" restLabel="of £30.00" />
      <RingChart part={5000} whole={5000} name="Saved £50.00 of £50.00, goal reached" partLabel="Goal reached" restLabel="£50.00" />
    </div>
  )
}

function LegendDemo(): JSX.Element {
  return (
    <div className="k-stack">
      <ChartLegend toggleable items={PEOPLE.map((p) => ({ id: p.id, label: p.name, colour: p.colour }))} />
      <ChartLegend items={[{ id: 'line', label: 'Balance', line: true, value: '£1,284.50' }]} />
    </div>
  )
}

function TickDemo(): JSX.Element {
  const [play, setPlay] = useState(1)
  return (
    <div className="k-row">
      <Tick play={play} label="Paid" />
      <Button size="sm" onClick={() => setPlay((p) => p + 1)}>
        Replay the tick
      </Button>
      <span className="sys-note">Static under reduced motion.</span>
    </div>
  )
}

export const KITTY_DEMOS: Readonly<Record<string, ComponentType<KittyDemoProps>>> = {
  'focus-ring': FocusRingDemo,
  'skip-link': SkipLinkDemo,
  'visually-hidden': VisuallyHiddenDemo,
  'theme-switch': ThemeSwitchDemo,
  logo: LogoDemo,
  button: ButtonDemo,
  'icon-button': IconButtonDemo,
  link: LinkDemo,
  'button-group': ButtonGroupDemo,
  menu: MenuDemo,
  tooltip: TooltipDemo,
  field: FieldDemo,
  'text-input': TextInputDemo,
  'amount-input': AmountInputDemo,
  textarea: TextareaDemo,
  'code-input': CodeInputDemo,
  select: SelectDemo,
  combobox: ComboboxDemo,
  checkbox: CheckboxDemo,
  'radio-group': RadioGroupDemo,
  switch: SwitchDemo,
  slider: SliderDemo,
  segmented: SegmentedDemo,
  'date-input': DateDemo,
  fieldset: FieldsetDemo,
  'error-summary': ErrorSummaryDemo,
  'file-input': FileInputDemo,
  popover: PopoverDemo,
  dialog: DialogDemo,
  sheet: SheetDemo,
  'command-menu': CommandMenuDemo,
  'app-shell': AppShellDemo,
  sidebar: SidebarDemo,
  'tab-bar': TabBarDemo,
  'top-bar': TopBarDemo,
  tabs: TabsDemo,
  breadcrumbs: BreadcrumbsDemo,
  pagination: PaginationDemo,
  'back-link': BackLinkDemo,
  footer: FooterDemo,
  banner: BannerDemo,
  'status-tag': StatusTagDemo,
  'error-page': ErrorPageDemo,
  card: CardDemo,
  amount: AmountDemo,
  avatar: AvatarDemo,
  'person-tag': PersonTagDemo,
  table: TableDemo,
  'list-row': ListRowDemo,
  'description-list': DescriptionListDemo,
  kpi: KpiDemo,
  'balance-card': BalanceCardDemo,
  'budget-meter': BudgetMeterDemo,
  'allowance-card': AllowanceDemo,
  'request-card': RequestCardDemo,
  'filter-bar': FilterBarDemo,
  'dashboard-grid': DashboardGridDemo,
  ledger: LedgerDemo,
  accordion: AccordionDemo,
  'bar-list': BarListDemo,
  'line-chart': LineChartDemo,
  'stacked-bar': StackedBarDemo,
  ring: RingDemo,
  legend: LegendDemo,
  tick: TickDemo,
}

