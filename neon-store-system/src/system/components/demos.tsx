/**
 * The /system demos of the VOLTCART components, keyed by their registry id (registry.ts). Each draws the real
 * component in its states; hover, focus and pressed are pinned with `preview` so they can be seen at rest.
 */
import { useState, type ComponentType, type JSX } from 'react'
import { ActionButton, EmptyState, ErrorState } from '../feedback'
import { BoltIcon, CartIcon, GridIcon, ListIcon, MonitorIcon, MoonIcon, SunIcon, TrashIcon } from '../feedback/icons'
import { simulate, type LatencyId } from '../latency'
import {
  Accordion,
  BackLink,
  Banner,
  Breadcrumbs,
  Button,
  CartLine,
  Charge,
  Checkbox,
  CodeInput,
  CodeReceipt,
  CopyButton,
  DateInput,
  Dialog,
  DiscountTag,
  ErrorSummary,
  Fieldset,
  FilterChip,
  Footer,
  GAMES,
  GameCard,
  GameCardSkeleton,
  Logo,
  LogoMark,
  MenuButton,
  OrdersTable,
  Pagination,
  PasswordInput,
  PlatformRing,
  PlatformTag,
  Popover,
  PriceChart,
  PriceReadout,
  RadioGroup,
  RangeSlider,
  ReadoutTiles,
  RegionTag,
  SavingsBars,
  SearchInput,
  Segmented,
  Select,
  Sidebar,
  SkipLink,
  StatusTag,
  StepIndicator,
  SummaryList,
  Switch,
  TabBar,
  Tabs,
  TextArea,
  TextInput,
  TextLink,
  TierPicker,
  Tooltip,
  TopBar,
  VisuallyHidden,
  WishlistToggle,
  Wordmark,
} from './index'
import { Combobox, CommandMenu } from './combobox'
import { Kiosk } from './kiosk'
import { MotionPauseButton, MotionPauseProvider } from './motionPause'

interface DemoProps {
  latency: LatencyId
  autorun: boolean
}

const ok = (latency: LatencyId) => (next: boolean) => simulate(latency, next)
const row = (children: JSX.Element[] | JSX.Element) => <div className="vc-row">{children}</div>

/* Core ----------------------------------------------------------------------------------------------------------- */
function FocusRingDemo(): JSX.Element {
  return row([
    <Button key="a" preview="focus">
      Focused button
    </Button>,
    <TextLink key="b" href="#x" preview="focus">
      Focused link
    </TextLink>,
    <GameCard key="c" game={GAMES[0]} preview="focus" />,
  ])
}

function SkipLinkDemo(): JSX.Element {
  return (
    <div className="vc-stack">
      <SkipLink preview="focus" />
      <p className="vc-muted">The first tab stop of every screen; hidden until focused.</p>
    </div>
  )
}

function VisuallyHiddenDemo(): JSX.Element {
  return (
    <p>
      <span aria-hidden="true">−60%</span>
      <VisuallyHidden>60% off</VisuallyHidden> reads as “60% off” to a screen reader.
    </p>
  )
}

function ThemeSwitchDemo(): JSX.Element {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')
  return (
    <Segmented
      label="Theme"
      value={theme}
      onChange={setTheme}
      options={[
        { id: 'system', label: 'System', icon: <MonitorIcon /> },
        { id: 'light', label: 'Light', icon: <SunIcon /> },
        { id: 'dark', label: 'Dark', icon: <MoonIcon /> },
      ]}
    />
  )
}

function ButtonDemo(): JSX.Element {
  return (
    <div className="vc-stack vc-stack--group">
      {(['primary', 'secondary', 'quiet', 'danger'] as const).map((variant) => (
        <div key={variant} className="vc-row">
          <Button variant={variant} icon={variant === 'primary' ? <CartIcon /> : variant === 'danger' ? <TrashIcon /> : undefined}>
            {variant === 'primary' ? 'Add to cart' : variant === 'secondary' ? 'Set alert' : variant === 'quiet' ? 'Clear filters' : 'Remove card'}
          </Button>
          <Button variant={variant} preview="hover">
            Hover
          </Button>
          <Button variant={variant} preview="focus">
            Focus
          </Button>
          <Button variant={variant} preview="pressed">
            Pressed
          </Button>
        </div>
      ))}
      <div className="vc-row">
        <Button variant="primary" disabledReason="Sold out">
          Add to cart
        </Button>
        <Button variant="secondary" iconOnly label="Cart, 3 items" icon={<CartIcon />} />
        <Button variant="primary" size="large">
          Pay $41.20
        </Button>
      </div>
    </div>
  )
}

function LinkDemo(): JSX.Element {
  return (
    <div className="vc-stack">
      <p>
        Keys are for personal use. Read the <TextLink href="#terms">refund rules</TextLink> before you reveal a code.
      </p>
      {row([
        <TextLink key="a" variant="standalone" href="#deals">
          All PS5 deals
        </TextLink>,
        <TextLink key="b" variant="standalone" href="#deals" preview="hover">
          Hover
        </TextLink>,
        <TextLink key="c" variant="standalone" href="#deals" preview="focus">
          Focus
        </TextLink>,
        <TextLink key="d" variant="quiet" href="#store" current>
          Store (current page)
        </TextLink>,
      ])}
    </div>
  )
}

function SegmentedDemo(): JSX.Element {
  const [view, setView] = useState<'grid' | 'table'>('grid')
  return <Segmented label="View" value={view} onChange={setView} options={[{ id: 'grid', label: 'Grid', icon: <GridIcon /> }, { id: 'table', label: 'Table', icon: <ListIcon /> }]} />
}

function MenuDemo(): JSX.Element {
  const [sort, setSort] = useState<'discount' | 'price' | 'new'>('discount')
  return <MenuButton label="Sort" value={sort} onChange={setSort} options={[{ id: 'discount', label: 'Biggest discount' }, { id: 'price', label: 'Lowest price' }, { id: 'new', label: 'Newest' }]} />
}

function WishlistDemo({ latency }: DemoProps): JSX.Element {
  return row([
    <WishlistToggle key="a" game="Neon Drift" saved={false} onSave={ok(latency)} />,
    <WishlistToggle key="b" game="Neon Drift" saved onSave={ok(latency)} />,
    <WishlistToggle key="c" game="Neon Drift" saved={false} withLabel onSave={ok(latency)} />,
  ])
}

function CopyDemo(): JSX.Element {
  return <CopyButton text="7KQ4M-XP2RD-9HT6W-LC3VN-8BF5Y" what="Neon Drift" />
}

function TooltipDemo(): JSX.Element {
  return row([
    <Tooltip key="a" text="Wishlist" open>
      <Button variant="secondary" aria-label="Wishlist (tooltip pinned open)" icon={<BoltIcon />} />
    </Tooltip>,
    <span key="b" className="vc-muted">
      Opens after 500 ms on hover, at once on focus; Esc closes.
    </span>,
  ])
}

function LogoDemo(): JSX.Element {
  return (
    <div className="vc-stack vc-stack--group">
      <Logo />
      <div className="vc-row">
        <LogoMark className="vc-logo__mark--16" />
        <LogoMark />
        <span style={{ color: 'var(--muted)' }}>
          <Wordmark />
        </span>
      </div>
      <p className="vc-muted">Cut V (picked). The rejected options, Charge bar and Bolt A, are described in DESIGN.md §Logo.</p>
    </div>
  )
}

/* Forms ---------------------------------------------------------------------------------------------------------- */
function FieldDemo(): JSX.Element {
  return (
    <div className="vc-stack vc-stack--group">
      <TextInput label="Email" type="email" value="dana@example.com" onChange={() => {}} hint="We send your codes here." />
      <TextInput label="Email" type="email" value="dana@example" onChange={() => {}} error="Email needs an @ and a domain, like name@example.com" />
      <TextInput label="Gift code" value="7KQ4M-XP2RD" onChange={() => {}} pending="Checking code…" />
      <TextInput label="Region" value="Germany" onChange={() => {}} warning="EU keys only. US keys won't activate." />
      <TextInput label="Gift code" value="7KQ4M-XP2RD-9HT6W-LC3VN-8BF5Y" onChange={() => {}} success="Valid: Neon Drift Deluxe upgrade, PC" />
      <TextInput label="Order email" value="dana@example.com" onChange={() => {}} readOnly hint="Read-only on a placed order." />
      <TextInput label="Nickname" optional value="" onChange={() => {}} disabled hint="Sign in to set a nickname." />
    </div>
  )
}

function TextInputDemo(): JSX.Element {
  const [v, setV] = useState('19.99')
  return <TextInput label="Alert price" prefix="$" inputMode="decimal" value={v} onChange={setV} />
}

function SearchDemo({ latency }: DemoProps): JSX.Element {
  const [q, setQ] = useState('neon')
  const [busy, setBusy] = useState(false)
  return (
    <SearchInput
      label="Search games (component demo)"
      value={q}
      onChange={setQ}
      busy={busy}
      onSubmit={async () => {
        setBusy(true)
        await simulate(latency, true).catch(() => {})
        setBusy(false)
      }}
    />
  )
}

function TextAreaDemo(): JSX.Element {
  const [v, setV] = useState('Happy birthday! This one is for the long nights.')
  return <TextArea label="Gift note" optional limit={60} value={v} onChange={setV} />
}

function PasswordDemo(): JSX.Element {
  const [v, setV] = useState('hunter2')
  return <PasswordInput label="Password" value={v} onChange={setV} hint="At least 10 characters" />
}

function CodeInputDemo(): JSX.Element {
  const [v, setV] = useState('7KQ4M-XP2RD-9H')
  return <CodeInput label="Gift code" hint="25 letters and numbers. Paste it in any format." value={v} onChange={setV} />
}

function SelectDemo(): JSX.Element {
  const [currency, setCurrency] = useState<'eur' | 'usd' | 'gbp' | 'jpy'>('eur')
  const [region, setRegion] = useState<'de' | 'fr' | 'us' | 'jp' | ''>('')
  const [sort, setSort] = useState<'discount' | 'price' | 'new'>('discount')
  return (
    <div className="vc-stack vc-stack--group">
      <Select label="Currency" value={currency} onChange={setCurrency} options={[{ id: 'eur', label: 'EUR (€)' }, { id: 'usd', label: 'USD ($)' }, { id: 'gbp', label: 'GBP (£)' }, { id: 'jpy', label: 'JPY (¥)', disabled: true, description: 'Not sold in your region yet' }]} />
      <Select label="Region" value={region} onChange={setRegion} placeholder="Choose a region" hint="Keys are checked against this region." options={[{ id: 'de', label: 'Germany', description: 'EU keys' }, { id: 'fr', label: 'France', description: 'EU keys' }, { id: 'us', label: 'United States', description: 'US keys' }, { id: 'jp', label: 'Japan', description: 'Asia keys' }]} />
      <Select label="Sort by" value={sort} onChange={setSort} error={undefined} options={[{ id: 'discount', label: 'Biggest discount' }, { id: 'price', label: 'Lowest price' }, { id: 'new', label: 'Newest' }]} />
      <Select label="Edition" value="" onChange={() => {}} loading options={[]} placeholder="Loading editions…" />
      <p className="vc-muted">Every dropdown in the system is this designed listbox. <code>NativeSelect</code> exists for a plain form that wants the platform picker, styled to match.</p>
    </div>
  )
}

function ComboboxDemo({ latency }: DemoProps): JSX.Element {
  return <Combobox latency={latency} />
}

function CheckboxDemo(): JSX.Element {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <Fieldset legend="Genre">
      <Checkbox label="All genres" checked={a && b} indeterminate={a !== b} onChange={(on) => { setA(on); setB(on) }} />
      <Checkbox label="Racing" count={38} checked={a} onChange={setA} />
      <Checkbox label="Shooter" count={112} checked={b} onChange={setB} />
      <Checkbox label="Puzzle" count={0} checked={false} disabled onChange={() => {}} />
    </Fieldset>
  )
}

function RadioDemo(): JSX.Element {
  const [v, setV] = useState<'card' | 'wallet' | 'saved'>('saved')
  return <RadioGroup legend="Pay with" name="demo-pay" value={v} onChange={setV} options={[{ id: 'saved', label: 'Visa ending 4242', description: 'Expires 08/28' }, { id: 'card', label: 'New card' }, { id: 'wallet', label: 'Wallet', description: 'Apple Pay or Google Pay' }]} />
}

function SwitchDemo({ latency }: DemoProps): JSX.Element {
  return (
    <div className="vc-stack">
      <Switch label="Price alert for Neon Drift" checked onSave={ok(latency)} />
      <Switch label="Email me when codes arrive" checked={false} onSave={ok(latency)} />
      <Switch label="Weekly deals email" checked={false} onSave={ok(latency)} disabledReason="Sign in to change email settings." />
    </div>
  )
}

function SliderDemo(): JSX.Element {
  const [r, setR] = useState<[number, number]>([10, 40])
  return <RangeSlider legend="Price" min={0} max={70} low={r[0]} high={r[1]} onChange={(a, b) => setR([a, b])} />
}

function StepperDemo(): JSX.Element {
  const [q, setQ] = useState(2)
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <CartLine game={GAMES[0]} qty={q} onQty={setQ} onRemove={() => setQ(1)} />
    </ul>
  )
}

function DateDemo(): JSX.Element {
  const [from, setFrom] = useState('2026-10-01')
  const [to, setTo] = useState('2026-09-20')
  return (
    <div className="vc-row" style={{ alignItems: 'flex-start' }}>
      <DateInput label="From" value={from} onChange={setFrom} />
      <DateInput label="To" value={to} onChange={setTo} error={to < from ? 'The end date must be after the start date' : undefined} />
    </div>
  )
}

function FieldsetDemo(): JSX.Element {
  return (
    <Fieldset legend="Billing details" error="Choose a country for tax">
      <TextInput label="Name on card" value="Dana Okafor" onChange={() => {}} />
      <Select label="Country" value="" onChange={() => {}} placeholder="Choose a country" error="Choose a country for tax" options={[{ id: 'de', label: 'Germany' }, { id: 'fr', label: 'France' }]} />
    </Fieldset>
  )
}

function ErrorSummaryDemo(): JSX.Element {
  return <ErrorSummary focusOnShow={false} errors={[{ fieldId: 'demo-email', text: 'Email needs an @ and a domain, like name@example.com' }, { fieldId: 'demo-country', text: 'Choose a country for tax' }]} />
}

function PaymentDemo({ latency }: DemoProps): JSX.Element {
  return (
    <div className="vc-stack vc-stack--group">
      <Button variant="secondary" size="large">
        Pay with Apple Pay
      </Button>
      <p className="vc-muted">or pay by card</p>
      <TextInput label="Card number" inputMode="numeric" autoComplete="cc-number" value="4242 4242 4242 4242" onChange={() => {}} hint="Sample: a real store uses the payment provider's hosted field." />
      <div className="vc-row" style={{ alignItems: 'flex-start' }}>
        <TextInput label="Expiry (MM/YY)" value="08/28" onChange={() => {}} />
        <TextInput label="Security code" value="" onChange={() => {}} error="Enter the 3 numbers on the back" />
      </div>
      <ActionButton variant="primary" knownSlow pendingLabel="Paying…" slowLabel="Waiting for your bank…" successLabel="Paid" timeoutMs={60000} onAction={(s) => simulate(latency, true, s)} errorMessage={() => 'Your bank declined the payment. You weren’t charged. Try another card.'}>
        Pay $41.20
      </ActionButton>
    </div>
  )
}

/* Navigation ----------------------------------------------------------------------------------------------------- */
function TopBarDemo(): JSX.Element {
  return (
    <div className="vc-stack vc-stack--group">
      <TopBar cartCount={3} cartTotal="$71.47" wishCount={6} navLabel="Primary (demo)" />
      <TopBar cartCount={3} cartTotal="$71.47" wishCount={6} flow={<StepIndicator current={2} />} />
    </div>
  )
}

function SidebarDemo(): JSX.Element {
  return <Sidebar current="library" />
}

function TabBarDemo(): JSX.Element {
  return <TabBar current="cart" cartCount={3} wishCount={6} label="Primary, phone (demo)" />
}

function CommandMenuDemo({ latency }: DemoProps): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open search (/)
      </Button>
      <CommandMenu latency={latency} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function TabsDemo(): JSX.Element {
  return (
    <Tabs label="Library" tabs={[{ id: 'all', label: 'All', count: 38 }, { id: 'pc', label: 'PC', count: 21 }, { id: 'ps5', label: 'PS5', count: 0 }, { id: 'xbox', label: 'Xbox', count: 17 }]}>
      {(id) => (id === 'ps5' ? <EmptyState kind="no-results" title="No PS5 games" action={<Button variant="secondary">All games</Button>}>Your PS5 keys will show here.</EmptyState> : <p className="vc-muted">Showing {id} games.</p>)}
    </Tabs>
  )
}

function BreadcrumbsDemo(): JSX.Element {
  return (
    <div className="vc-stack">
      <Breadcrumbs trail={['Store', 'Browse', 'Racing', 'Neon Drift']} />
      <BackLink to="Racing" />
    </div>
  )
}

function PaginationDemo({ latency }: DemoProps): JSX.Element {
  const [page, setPage] = useState(2)
  return (
    <div className="vc-stack vc-stack--group">
      <Pagination page={page} pages={5} total={97} perPage={20} onPage={setPage} />
      <div className="vc-stack">
        <p className="vc-muted vc-num">48 of 412 games</p>
        <ActionButton variant="secondary" pendingLabel="Loading 24 more…" successLabel="24 more games loaded" successMessage="24 more games loaded" onAction={(s) => simulate(latency, true, s)}>
          Show 24 more
        </ActionButton>
      </div>
    </div>
  )
}

function StepsDemo(): JSX.Element {
  return (
    <div className="vc-stack">
      <StepIndicator current={1} />
      <StepIndicator current={2} />
      <StepIndicator current={3} />
    </div>
  )
}

function FooterDemo(): JSX.Element {
  return <Footer headingLevel={3} />
}

/* Feedback ------------------------------------------------------------------------------------------------------- */
function BannerDemo(): JSX.Element {
  return (
    <div className="vc-stack">
      <Banner tone="warning" title="You're not connected.">
        Your cart is saved on this device.
      </Banner>
      <Banner tone="positive" title="Connected again.">
        Your cart is synced.
      </Banner>
      <Banner tone="info" onDismiss={() => {}} action={<TextLink variant="standalone" href="#region">Change region</TextLink>}>
        Prices in EUR for Germany.
      </Banner>
      <Banner tone="negative">We couldn't issue a code for order VC-48213. See what happens next.</Banner>
    </div>
  )
}

function DialogDemo({ latency }: DemoProps): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Remove saved card
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        headingLevel={3}
        title="Remove saved card ending 4242?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Keep card
            </Button>
            <ActionButton variant="danger" className="vc-danger-fill" pendingLabel="Removing…" successLabel="Removed" successMessage="Card removed" onAction={(s) => simulate(latency, true, s)} onSuccess={() => window.setTimeout(() => setOpen(false), 600)}>
              Remove card
            </ActionButton>
          </>
        }
        initialFocus=".vc-btn"
      >
        <p>You'll need to enter it again next time you pay.</p>
      </Dialog>
    </>
  )
}

function SheetDemo(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [pc, setPc] = useState(true)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Filters (1)
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        headingLevel={3}
        variant="sheet"
        actions={
          <>
            <Button variant="secondary" onClick={() => setPc(false)}>
              Clear filters
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Show {pc ? 21 : 412} games
            </Button>
          </>
        }
      >
        <Fieldset legend="Platform">
          <Checkbox label="PC" count={21} checked={pc} onChange={setPc} />
        </Fieldset>
      </Dialog>
    </>
  )
}

function PopoverDemo(): JSX.Element {
  return (
    <Popover trigger="Why won't this key work for me?" title="Region locks">
      <p className="vc-muted">This is an EU key. Platforms check the region of your account when you redeem it, so it won't activate on a US account.</p>
    </Popover>
  )
}

function StatusDemo(): JSX.Element {
  return row([
    <StatusTag key="a" tone="positive">Delivered</StatusTag>,
    <StatusTag key="b" tone="info">Issuing</StatusTag>,
    <StatusTag key="c" tone="info">Pre-order</StatusTag>,
    <StatusTag key="d" tone="neutral">Refunded</StatusTag>,
    <StatusTag key="e" tone="warning">Region locked</StatusTag>,
    <StatusTag key="f" tone="negative">Not issued</StatusTag>,
  ])
}

function EmptyDemo(): JSX.Element {
  return (
    <div className="vc-stack vc-stack--group">
      <EmptyState kind="first-use" title="No games yet" action={<Button variant="secondary">Browse deals</Button>}>
        Your keys will live here after your first order.
      </EmptyState>
      <EmptyState kind="no-results" title="No games match these filters" filters={['PS5', 'Puzzle', '$0–$5']} action={<Button variant="secondary">Clear filters</Button>}>
        Try removing one.
      </EmptyState>
      <EmptyState kind="locked" title="Sign in to see your orders" action={<Button variant="secondary">Sign in</Button>}>
        Your keys and receipts are tied to your account.
      </EmptyState>
    </div>
  )
}

function ErrorStateDemo({ latency }: DemoProps): JSX.Element {
  return (
    <ErrorState title="Deals didn't load" onRetry={(s) => simulate(latency, true, s)} focusOnMount={false} announceOnMount={false}>
      Your cart is safe. Try again in a moment.
    </ErrorState>
  )
}

function AccordionDemo(): JSX.Element {
  return (
    <div>
      <Accordion title="System requirements" defaultOpen>
        <p>Windows 11, 16 GB RAM, a GPU with 8 GB. 70 GB free space.</p>
      </Accordion>
      <Accordion title="How to redeem">
        <p>Open Steam, choose “Activate a product”, paste the code.</p>
      </Accordion>
    </div>
  )
}

/* Data display --------------------------------------------------------------------------------------------------- */
function GameCardDemo(): JSX.Element {
  return (
    <div className="vc-grid">
      <GameCard game={GAMES[0]} />
      <GameCard game={GAMES[2]} preview="hover" />
      <GameCard game={GAMES[3]} />
      <GameCard game={GAMES[4]} variant="wishlist" />
      <GameCard game={GAMES[1]} variant="library" />
      <GameCardSkeleton />
    </div>
  )
}

function TagsDemo(): JSX.Element {
  return row([
    <PlatformTag key="a" platform="PC" />,
    <PlatformTag key="b" platform="PS5" />,
    <PlatformTag key="c" platform="XBOX" />,
    <PlatformTag key="d" platform="SWITCH" />,
    <DiscountTag key="e" percent={60} />,
    <RegionTag key="f" region="EU" />,
    <FilterChip key="g" label="PS5" onRemove={() => {}} />,
  ])
}

function PriceDemo(): JSX.Element {
  return (
    <div className="vc-stack vc-stack--group">
      <PriceReadout size="large" price={23.99} list={59.99} lowest />
      <PriceReadout price={14.99} list={24.99} />
      <PriceReadout price={8.49} />
      <PriceReadout price={14.99} list={24.99} changedFrom={12.99} />
      <PriceReadout price={23.99} list={59.99} busy />
      <PriceReadout price={0} />
      <PriceReadout price={1249.99} list={1999.99} soldOut />
    </div>
  )
}

function ReadoutDemo(): JSX.Element {
  return <ReadoutTiles items={[{ label: 'Saved this year', value: '$214.60', change: '+$42.00 vs last 30 days', good: true }, { label: 'Games in library', value: '38' }, { label: 'Active alerts', value: '0' }, { label: 'Gift codes', value: '—', change: 'No data yet' }]} />
}

function TableDemo(): JSX.Element {
  return (
    <OrdersTable
      orders={[
        { id: 'VC-48213', date: '2026-10-23', items: 3, total: 71.47, status: 'positive', statusText: 'Delivered' },
        { id: 'VC-47105', date: '2026-09-11', items: 1, total: 49.99, status: 'info', statusText: 'Pre-order' },
        { id: 'VC-46021', date: '2026-08-19', items: 2, total: 22.98, status: 'neutral', statusText: 'Refunded' },
      ]}
    />
  )
}

function SummaryDemo(): JSX.Element {
  return (
    <div className="vc-stack vc-stack--group">
      <SummaryList subtotal={71.47} save={86.5} tax={0} />
      <SummaryList subtotal={71.47} save={86.5} tax={13.58} busy />
    </div>
  )
}

function CartLineDemo(): JSX.Element {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <CartLine game={GAMES[0]} qty={1} readOnly />
      <CartLine game={GAMES[1]} qty={2} busy onQty={() => {}} onRemove={() => {}} />
    </ul>
  )
}

function TierDemo(): JSX.Element {
  const [v, setV] = useState('premium')
  return (
    <div className="vc-stack vc-stack--group">
      <TierPicker
        value={v}
        onChange={setV}
        editions={[
          { id: 'standard', name: 'Standard', price: 7.99, list: 9.99, skips: 0, includes: ['All 100 tiers to earn'] },
          { id: 'premium', name: 'Premium', price: 14.99, list: 24.99, skips: 10, includes: ['+10 tiers at once', 'Two skins'] },
          { id: 'premium-plus', name: 'Premium+', price: 22.49, list: 39.99, skips: 25, includes: ['+25 tiers at once'], soldOut: true },
        ]}
      />
      <Charge segments={10} on={4} />
    </div>
  )
}

function ReceiptDemo(): JSX.Element {
  const [state, setState] = useState<'issuing' | 'slow' | 'delivered' | 'hidden' | 'failed'>('delivered')
  return (
    <div className="vc-stack vc-stack--group">
      <Segmented
        label="Receipt state"
        value={state}
        onChange={setState}
        options={[
          { id: 'issuing', label: 'Issuing' },
          { id: 'slow', label: 'Slow' },
          { id: 'delivered', label: 'Delivered' },
          { id: 'hidden', label: 'Library' },
          { id: 'failed', label: 'Failed' },
        ]}
      />
      <CodeReceipt state={state} step={1} code="7KQ4M-XP2RD-9HT6W-LC3VN-8BF5Y" game="Neon Drift" platform="PC" order="VC-48213" onRetry={() => setState('issuing')} />
    </div>
  )
}

function ChartsDemo(): JSX.Element {
  return (
    <div className="vc-stack vc-stack--group">
      <PriceChart points={[59.99, 59.99, 44.99, 44.99, 39.99, 59.99, 29.99, 19.99, 24.99, 23.99]} compare={[69.99, 69.99, 59.99, 59.99, 49.99, 69.99, 44.99, 34.99, 39.99, 37.99]} />
      <div className="vc-row" style={{ alignItems: 'flex-start', gap: 'var(--gap-group)' }}>
        <div style={{ flex: '1 1 18rem' }}>
          <SavingsBars months={[{ label: 'Jun', value: 12 }, { label: 'Jul', value: 48 }, { label: 'Aug', value: 0 }, { label: 'Sep', value: 31 }, { label: 'Oct', value: 86.5 }]} />
        </div>
        <PlatformRing parts={[{ label: 'PC', value: 21, color: 'data-1' }, { label: 'Xbox', value: 9, color: 'data-2' }, { label: 'PS5', value: 6, color: 'data-3' }, { label: 'Switch', value: 2, color: 'muted' }]} />
      </div>
    </div>
  )
}

function FilterBarDemo(): JSX.Element {
  const [chips, setChips] = useState(['PS5', 'Racing', 'At least 50% off'])
  return (
    <div className="vc-stack">
      <div className="vc-row">
        {chips.map((c) => (
          <FilterChip key={c} label={c} onRemove={() => setChips(chips.filter((x) => x !== c))} />
        ))}
        {chips.length ? (
          <Button variant="quiet" onClick={() => setChips([])}>
            Clear filters
          </Button>
        ) : (
          <span className="vc-muted">No filters</span>
        )}
      </div>
      <p className="vc-muted">The full rail (checkboxes, price slider, region) runs in scenario S2.</p>
    </div>
  )
}

function AvatarDemo(): JSX.Element {
  return row([
    <Button key="a" variant="quiet" iconOnly label="Account menu, Dana" icon={<span className="vc-avatar">D</span>} />,
    <span key="b" className="vc-avatar" aria-hidden="true">
      MK
    </span>,
  ])
}

function DashboardDemo(): JSX.Element {
  return (
    <div className="vc-dash">
      <section className="vc-dash__row" aria-labelledby="dash-deals">
        <div className="vc-dash__head">
          <h3 id="dash-deals">Deals</h3>
          <TextLink variant="standalone" href="#deals">
            See all deals
          </TextLink>
        </div>
        <div className="vc-rail" tabIndex={0} role="region" aria-label="Deals, scroll sideways">
          {GAMES.slice(0, 4).map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </section>
    </div>
  )
}


/* Kiosk (0.6.0, voltcart-landing): idle, in cart, failed add (latency control), cover failed, mini. */
const KIOSK_COVER = '/voltcart-landing/img/cover-neon-drift.webp'
function KioskDemo({ latency }: DemoProps): JSX.Element {
  const [inCart, setInCart] = useState(false)
  const base = { number: 1, title: 'Neon Drift', platform: 'PC' as const, regionLine: 'Works in Europe', price: 16.8, list: 59.99, meta: 'Lowest in 90 days', cover: KIOSK_COVER, onRemove: () => setInCart(false) }
  return (
    <div className="vc-grid">
      <Kiosk {...base} inCart={inCart} onAdd={(signal) => simulate(latency, true, signal)} onAdded={() => setInCart(true)} caption={inCart ? 'In your cart.' : 'Kiosk 01 · Neon Drift · PC'} note="Sample data." />
      <Kiosk {...base} number={2} cover="/voltcart-landing/img/missing.webp" title="Static Bloom" price={8.49} list={29.99} meta="Price dropped today" inCart onAdd={() => Promise.resolve()} onAdded={() => {}} />
      <Kiosk {...base} number={3} size="mini" inCart={false} onAdd={() => Promise.resolve()} onAdded={() => {}} />
    </div>
  )
}

function MotionPauseDemo(): JSX.Element {
  return (
    <MotionPauseProvider>
      <MotionPauseButton />
    </MotionPauseProvider>
  )
}

export const VC_DEMOS: Readonly<Record<string, ComponentType<DemoProps>>> = {
  'focus-ring': FocusRingDemo,
  'skip-link': SkipLinkDemo,
  'visually-hidden': VisuallyHiddenDemo,
  'theme-switch': ThemeSwitchDemo,
  button: ButtonDemo,
  link: LinkDemo,
  segmented: SegmentedDemo,
  menu: MenuDemo,
  'wishlist-toggle': WishlistDemo,
  'copy-button': CopyDemo,
  tooltip: TooltipDemo,
  logo: LogoDemo,
  field: FieldDemo,
  'text-input': TextInputDemo,
  'search-input': SearchDemo,
  textarea: TextAreaDemo,
  password: PasswordDemo,
  'code-input': CodeInputDemo,
  select: SelectDemo,
  combobox: ComboboxDemo,
  checkbox: CheckboxDemo,
  radio: RadioDemo,
  switch: SwitchDemo,
  slider: SliderDemo,
  stepper: StepperDemo,
  date: DateDemo,
  fieldset: FieldsetDemo,
  'error-summary': ErrorSummaryDemo,
  payment: PaymentDemo,
  'top-bar': TopBarDemo,
  sidebar: SidebarDemo,
  'tab-bar': TabBarDemo,
  'command-menu': CommandMenuDemo,
  tabs: TabsDemo,
  breadcrumbs: BreadcrumbsDemo,
  pagination: PaginationDemo,
  steps: StepsDemo,
  footer: FooterDemo,
  banner: BannerDemo,
  dialog: DialogDemo,
  sheet: SheetDemo,
  popover: PopoverDemo,
  'status-tag': StatusDemo,
  'empty-state': EmptyDemo,
  'error-state': ErrorStateDemo,
  accordion: AccordionDemo,
  'game-card': GameCardDemo,
  kiosk: KioskDemo,
  'motion-pause': MotionPauseDemo,
  tags: TagsDemo,
  'price-readout': PriceDemo,
  readout: ReadoutDemo,
  table: TableDemo,
  summary: SummaryDemo,
  'cart-line': CartLineDemo,
  tiers: TierDemo,
  receipt: ReceiptDemo,
  charts: ChartsDemo,
  'filter-bar': FilterBarDemo,
  avatar: AvatarDemo,
  dashboard: DashboardDemo,
}
