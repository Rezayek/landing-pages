/**
 * Demos of the Echo Atlas components for /system: each draws the real component in the states its matrix lists
 * (COMPONENTS.md). Pointer states are pinned with `preview`. The ids match registry.ts COMPONENTS.
 */
import { useRef, useState, type ComponentType, type JSX, type ReactNode } from 'react'
import { ActionButton, Spinner } from './feedback'
import { simulate, type LatencyId } from './latency'
import {
  Accordion,
  AppShell,
  Avatar,
  Banner,
  BannerCard,
  BarList,
  BackLink,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  ChevronTag,
  Chip,
  CodeInput,
  Combobox,
  CommandMenu,
  DatePicker,
  DescriptionList,
  Delta,
  Dialog,
  EchoSlot,
  ElementMark,
  ELEMENTS,
  ErrorSummary,
  Field,
  Fieldset,
  FilterBar,
  Footer,
  IconButton,
  KpiTile,
  LineChart,
  Logo,
  MenuButton,
  NO_FILTERS,
  Pagination,
  PhoneTabBar,
  Popover,
  RadioGroup,
  RarityMark,
  RESONATORS,
  ResonatorCard,
  Ring,
  SAMPLE_BANNERS,
  SAMPLE_ECHOES,
  SearchInput,
  SectionTitle,
  Segmented,
  Select,
  Sheet,
  Sigil,
  Slider,
  StatusTag,
  Switch,
  Table,
  Tabs,
  TeamBuilder,
  TeamSlot,
  TextInput,
  TextLink,
  TextareaField,
  ThemeSwitch,
  ToggleChip,
  Tooltip,
  byId,
  type CommandItem,
  type Filters,
  type Resonator,
} from './components'
import { BuildPanel, CapNav, EchoCard, EchoLoadout, ForteTree, JINHSI_BUILD, MusicPlayer, ResonanceChain, SoundSettingsPanel, VoiceLines, WeaponCard } from './components'
import { WavePath } from './feedback/Spinner'
import { ripple } from './ea'
import { burst, play } from './vfx'

interface DemoProps {
  latency: LatencyId
  autorun: boolean
}

function Row({ label, children }: { label?: string; children: ReactNode }): JSX.Element {
  return (
    <div className="sys-state">
      {label ? <span className="sys-state__label">{label}</span> : null}
      <div className="sys-row-wrap">{children}</div>
    </div>
  )
}

const noop = (): void => {}

function FrameDemo(): JSX.Element {
  return (
    <div className="sys-grid ea-ui">
      {(['panel', 'raised', 'sunken', 'outline', 'band'] as const).map((tone) => (
        <div key={tone} className="ea-frame ea-edge" data-tone={tone === 'panel' ? undefined : tone} tabIndex={0} style={{ padding: 'var(--inset-card)', minBlockSize: '5rem' }}>
          {tone} · hover or focus lights the notch
        </div>
      ))}
      <div className="ea-frame" data-tone="outline" data-selected="true" style={{ padding: 'var(--inset-card)', ['--ea-lit' as string]: 1 }}>
        selected
      </div>
    </div>
  )
}

function FocusDemo(): JSX.Element {
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <Row label="focus-visible (pinned)">
        <Button preview="focus">Save team</Button>
        <a className="ea-link" data-standalone="" href="#main" style={{ outline: 'var(--focus-width) solid var(--focus)', outlineOffset: 'var(--focus-offset)' }}>
          Skip to content
        </a>
      </Row>
      <Row label="on the night band: two-tone ring">
        <span className="ea-frame" data-tone="band" style={{ padding: 'var(--space-3)' }}>
          <Button preview="focus">Open the build</Button>
        </span>
      </Row>
    </div>
  )
}

function ButtonDemo(): JSX.Element {
  const variants = ['primary', 'secondary', 'quiet', 'danger'] as const
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      {variants.map((variant) => (
        <Row key={variant} label={variant}>
          <Button variant={variant}>{variant === 'danger' ? 'Delete account' : 'Save team'}</Button>
          <Button variant={variant} preview="hover">
            Hover
          </Button>
          <Button variant={variant} preview="focus">
            Focus
          </Button>
          <Button variant={variant} preview="pressed">
            Pressed
          </Button>
          <Button variant={variant} disabledReason="Add a Resonator first.">
            Disabled
          </Button>
        </Row>
      ))}
      <Row label="icon-only (tooltip on hover and focus)">
        <IconButton icon="star" label="Star Jinhsi" />
        <IconButton icon="edit" label="Edit build" preview="focus" />
        <IconButton icon="trash" label="Remove build" variant="secondary" />
      </Row>
    </div>
  )
}

function ActionsDemo({ latency }: DemoProps): JSX.Element {
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <Row label="live (toolbar latency)">
        <ActionButton variant="primary" pendingLabel="Saving build…" successLabel="Build saved" onAction={(signal) => simulate(latency, true, signal)}>
          Save build
        </ActionButton>
        <ActionButton variant="secondary" pendingLabel="Saving team…" successLabel="Team saved" onAction={(signal) => simulate(latency, true, signal)}>
          Save team
        </ActionButton>
      </Row>
      <Row label="pinned">
        {(['pending', 'slow', 'success', 'error'] as const).map((state) => (
          <ActionButton key={state} variant="primary" preview={state} pendingLabel="Saving build…" successLabel="Build saved" slowLabel="Still saving…" onAction={noop}>
            Save build
          </ActionButton>
        ))}
      </Row>
    </div>
  )
}

function LinkDemo(): JSX.Element {
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <p style={{ margin: 0 }}>
        Read the <TextLink href="#guide">Jinhsi rotation guide</TextLink> before you farm Echoes.
      </p>
      <Row>
        <TextLink href="#all" standalone>
          All news
        </TextLink>
        <TextLink href="#src" external>
          Patch notes source
        </TextLink>
        <TextLink href="#home" current>
          Home (current page)
        </TextLink>
      </Row>
    </div>
  )
}

function SegmentedDemo(): JSX.Element {
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  return (
    <Row>
      <Segmented label="View" value={view} onChange={setView} options={[{ id: 'grid', label: 'Grid', icon: 'grid' }, { id: 'table', label: 'Table', icon: 'list' }]} />
      <Segmented label="Density" value={density} onChange={setDensity} options={[{ id: 'comfortable', label: 'Comfortable' }, { id: 'compact', label: 'Compact' }]} />
    </Row>
  )
}

function MenuDemo(): JSX.Element {
  const [last, setLast] = useState('none yet')
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)', minBlockSize: '15rem' }}>
      <Row label={`Last chosen: ${last}`}>
        <MenuButton
          label="More actions for Jinhsi"
          onSelect={setLast}
          items={[
            { id: 'Copy link', label: 'Copy link', icon: 'link' },
            { id: 'Compare', label: 'Compare', icon: 'grid' },
            { id: 'Add to team', label: 'Add to team', icon: 'team', disabledReason: 'Your team is full.' },
            { id: 'Remove build', label: 'Remove build', icon: 'trash', tone: 'danger', separatorBefore: true },
          ]}
        />
      </Row>
    </div>
  )
}

function FieldDemo(): JSX.Element {
  const [name, setName] = useState('Jinhsi main DPS')
  return (
    <div className="ea-ui sys-grid">
      <Field label="Build name">{(c) => <TextInput control={c} value={name} onChange={setName} />}</Field>
      <Field label="Build name" preview="hover">
        {(c) => <TextInput control={c} value="Hover" onChange={noop} />}
      </Field>
      <Field label="Build name" preview="focus">
        {(c) => <TextInput control={c} value="Focus" onChange={noop} />}
      </Field>
      <Field label="Build name" message={{ tone: 'error', text: "You already have a build called 'Jinhsi main DPS'" }}>
        {(c) => <TextInput control={c} value="Jinhsi main DPS" onChange={noop} />}
      </Field>
      <Field label="Build name" pending message={{ tone: 'success', text: 'Name is free' }}>
        {(c) => <TextInput control={c} value="Jinhsi quick swap" onChange={noop} />}
      </Field>
      <Field label="Echo cost" message={{ tone: 'warning', text: 'Echo cost is 13 of 12. Remove or swap an Echo.' }}>
        {(c) => <TextInput control={c} value="13" onChange={noop} />}
      </Field>
      <Field label="Account email" readOnly hint="Read-only: change it in Account">
        {(c) => <TextInput control={c} value="rover@example.com" onChange={noop} readOnly />}
      </Field>
      <Field label="Server region" disabled hint="Unavailable while syncing">
        {(c) => <TextInput control={c} value="Asia" onChange={noop} disabled />}
      </Field>
      <Field label="Build name" optional>
        {(c) => <TextInput control={c} value="An unusually long build name that keeps going past the edge" onChange={noop} />}
      </Field>
    </div>
  )
}

function SearchDemo(): JSX.Element {
  const [q, setQ] = useState('jin')
  return <SearchInput label="Search Resonators" placeholder="Search Resonators" value={q} onChange={setQ} />
}

function TextareaDemo(): JSX.Element {
  const [notes, setNotes] = useState('Swap to Hoochief if Energy Regen falls under 120%.')
  return (
    <div className="sys-grid ea-ui">
      <TextareaField label="Build notes" value={notes} onChange={setNotes} />
      <TextareaField label="Build notes (near the limit)" value={'x'.repeat(470)} onChange={noop} />
    </div>
  )
}

function CodeDemo(): JSX.Element {
  const [code, setCode] = useState('4821')
  return (
    <div className="sys-grid ea-ui">
      <CodeInput value={code} onChange={setCode} hint="From the email we sent. Paste works." />
      <CodeInput value="482193" onChange={noop} pending />
      <CodeInput value="000000" onChange={noop} message={{ tone: 'error', text: 'That code is wrong or has expired. Send a new code.' }} />
    </div>
  )
}

function SelectDemo(): JSX.Element {
  const [one, setOne] = useState<string[]>(['Asia'])
  const [many, setMany] = useState<string[]>(['Sword', 'Pistols'])
  return (
    <div className="sys-grid ea-ui" style={{ minBlockSize: '18rem' }}>
      <Select label="Server region" options={['America', 'Europe', 'Asia', 'SEA', 'HMT'].map((x) => ({ id: x, label: x }))} value={one} onChange={setOne} />
      <Select label="Weapon" multiple options={['Broadblade', 'Sword', 'Pistols', 'Gauntlets', 'Rectifier'].map((x) => ({ id: x, label: x }))} value={many} onChange={setMany} placeholder="Any weapon" />
    </div>
  )
}

function ComboDemo(): JSX.Element {
  const [picked, setPicked] = useState('none')
  const options = RESONATORS.map((r) => ({ id: r.id, label: r.name, lead: <Sigil element={r.element} />, meta: <RarityMark rarity={r.rarity} /> }))
  return (
    <div className="sys-grid ea-ui" style={{ minBlockSize: '20rem' }}>
      <div>
        <Combobox label="Find a Resonator" placeholder="Search Resonators" options={options} onSelect={(o) => setPicked(o.label)} />
        <p className="sys-note">Picked: {picked}</p>
      </div>
      <Combobox label="Loading options" options={options} onSelect={noop} status="pending" />
      <Combobox label="Failed options" options={options} onSelect={noop} status="error" onRetry={noop} />
    </div>
  )
}

function ChoiceDemo(): JSX.Element {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  const [main, setMain] = useState<string | null>('crit-dmg')
  return (
    <div className="sys-grid ea-ui">
      <Fieldset legend="Show in the database">
        <Checkbox label="5★ Resonators" checked={a} onChange={setA} />
        <Checkbox label="4★ Resonators" checked={b} onChange={setB} />
        <Checkbox label="All rarities" checked={a && b} indeterminate={a !== b} onChange={(v) => (setA(v), setB(v))} />
        <Checkbox label="Unreleased (disabled)" checked={false} onChange={noop} disabled />
      </Fieldset>
      <RadioGroup
        legend="Cost 4 main stat"
        value={main}
        onChange={setMain}
        options={[
          { id: 'crit-dmg', label: 'Crit DMG' },
          { id: 'crit-rate', label: 'Crit Rate' },
          { id: 'atk', label: 'ATK%' },
          { id: 'heal', label: 'Healing Bonus', disabled: true },
        ]}
      />
      <RadioGroup legend="Cost 1 main stat (required)" value={null} onChange={noop} error="Choose a main stat" options={[{ id: 'atk', label: 'ATK%' }, { id: 'hp', label: 'HP%' }]} />
    </div>
  )
}

function SwitchDemo({ latency }: DemoProps): JSX.Element {
  const [on, setOn] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function toggle(next: boolean): Promise<void> {
    setOn(next)
    setPending(true)
    setError(null)
    try {
      await simulate(latency, true)
    } catch {
      setOn(!next)
      setError("Couldn't save this setting. Try again.")
    } finally {
      setPending(false)
    }
  }
  return (
    <div className="sys-grid ea-ui">
      <Switch label="Banner reminders" checked={on} pending={pending} error={error} onChange={(n) => void toggle(n)} />
      <Switch label="Show 4★ (off)" checked={false} onChange={noop} />
      <Switch label="Saving (pinned)" checked pending onChange={noop} />
      <Switch label="Failed (pinned)" checked={false} error="Couldn't save this setting. Try again." onChange={noop} />
    </div>
  )
}

function SliderDemo(): JSX.Element {
  const [level, setLevel] = useState(80)
  const [echo, setEcho] = useState(25)
  return (
    <div className="sys-grid ea-ui">
      <Slider label="Resonator level" value={level} onChange={setLevel} min={1} max={90} ticks={[1, 20, 40, 60, 80, 90]} />
      <Slider label="Echo level" value={echo} onChange={setEcho} min={0} max={25} ticks={[0, 5, 10, 15, 20, 25]} />
    </div>
  )
}

function DateDemo(): JSX.Element {
  const [from, setFrom] = useState('2026-10-24')
  return (
    <div className="ea-ui" style={{ minBlockSize: '26rem' }}>
      <DatePicker label="From" value={from} onChange={setFrom} today="2026-10-24" bannerDays={['2026-10-24', '2026-11-01', '2026-11-12']} rangeEnd="2026-11-01" initiallyOpen />
    </div>
  )
}

function ErrorSummaryDemo(): JSX.Element {
  return (
    <ErrorSummary
      errors={[
        { field: 'build-name', text: 'Enter a build name' },
        { field: 'main-stat', text: 'Choose a main stat' },
      ]}
    />
  )
}

function ShellDemo(): JSX.Element {
  const [current, setCurrent] = useState('resonators')
  const [rail, setRail] = useState(false)
  const [cmd, setCmd] = useState(false)
  const items: CommandItem[] = [
    ...RESONATORS.slice(0, 6).map((r) => ({ id: r.id, group: 'Resonators' as const, label: r.name, icon: 'resonators' as const })),
    { id: 'celestial', group: 'Echoes', label: 'Celestial Light set', icon: 'echo' },
    { id: 'g1', group: 'Guides', label: 'Jinhsi rotation guide', icon: 'guide' },
    { id: 'p1', group: 'Pages', label: 'Banner calendar', icon: 'calendar' },
  ]
  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <AppShell current={current} onNavigate={setCurrent} rail={rail} onToggleRail={() => setRail((r) => !r)} onSearch={() => setCmd(true)}>
        <Breadcrumbs trail={[{ label: 'Home', href: '#home' }, { label: 'Resonators', href: '#resonators' }, { label: 'Jinhsi' }]} />
        <SectionTitle level={2} aside="46 Resonators">
          {current === 'home' ? 'Home' : current === 'resonators' ? 'Resonators' : current}
        </SectionTitle>
        <p style={{ margin: 0, color: 'var(--muted)' }}>The content plane re-mounts with a fade and a short rise on every navigation.</p>
      </AppShell>
      <CommandMenu open={cmd} onClose={() => setCmd(false)} items={items} />
    </div>
  )
}

function PhoneNavDemo(): JSX.Element {
  const [current, setCurrent] = useState('home')
  const [more, setMore] = useState(false)
  return (
    <div className="ea-ui" style={{ maxInlineSize: '24rem', display: 'grid', gap: 'var(--space-3)' }}>
      <BackLink to="Resonators" />
      <PhoneTabBar current={current} onNavigate={setCurrent} onMore={() => setMore(true)} />
      <Sheet open={more} title="More" onClose={() => setMore(false)}>
        {['Team builder', 'Tier list', 'Guides', 'Account'].map((x) => (
          <a key={x} className="ea-nav-item" href={`#${x}`} onClick={() => setMore(false)}>
            {x}
          </a>
        ))}
      </Sheet>
    </div>
  )
}

function CommandDemo(): JSX.Element {
  const [open, setOpen] = useState<null | 'ready' | 'pending' | 'error'>(null)
  const items: CommandItem[] = RESONATORS.slice(0, 8).map((r) => ({ id: r.id, group: 'Resonators', label: r.name, icon: 'resonators' }))
  return (
    <Row>
      <Button onClick={() => setOpen('ready')}>Open search (Ctrl K)</Button>
      <Button onClick={() => setOpen('pending')}>Searching state</Button>
      <Button onClick={() => setOpen('error')}>Failed state</Button>
      <CommandMenu open={open !== null} status={open ?? 'ready'} onClose={() => setOpen(null)} items={items} onRetry={() => setOpen('ready')} />
    </Row>
  )
}

// short labels, so the demo bar fits a 320 px card as the landing's phone bar does
const CAP_ITEMS = [
  { id: 'resonators', label: 'Builds', href: '#cap-resonators' },
  { id: 'planner', label: 'Planner', href: '#cap-planner' },
  { id: 'banners', label: 'Banners', href: '#cap-banners' },
] as const

function CapNavDemo(): JSX.Element {
  const [current, setCurrent] = useState<string>('planner')
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div className="sys-capnav-band">
        <CapNav items={CAP_ITEMS} current={current} onNavigate={(id) => setCurrent(id)} label="Demo sections" />
      </div>
      <div className="sys-capnav-band">
        <CapNav items={CAP_ITEMS} current={null} label="Demo sections, none current" />
      </div>
      <p className="sys-note">Click an item: the swell glides, the glint passes once, three sparks rise. The second bar has no current item (before the first section): the strands lie flat.</p>
    </div>
  )
}

function TabsDemo(): JSX.Element {
  return (
    <div className="ea-ui">
      <Tabs
        label="Jinhsi"
        items={[
          { id: 'builds', label: 'Builds', count: 3, panel: <DescriptionList items={[{ label: 'Weapon', value: 'Ages of Harvest' }, { label: 'Echo set', value: 'Celestial Light' }, { label: 'Cost 4 main', value: 'Crit DMG' }]} /> },
          { id: 'skills', label: 'Skills', panel: <p style={{ margin: 0 }}>Skill priority: Resonance Skill, Forte Circuit, Liberation.</p> },
          { id: 'echoes', label: 'Echoes', count: 5, panel: <p style={{ margin: 0 }}>Five Echoes, 4-3-3-1-1.</p> },
          { id: 'teams', label: 'Teams', disabledReason: 'No teams logged for this version yet', panel: null },
        ]}
      />
    </div>
  )
}

function AccordionDemo(): JSX.Element {
  return (
    <div className="ea-ui">
      <Accordion
        initiallyOpen={['cost']}
        items={[
          { id: 'cost', title: 'Why 4-3-3-1-1?', body: 'It fits the 12-cost limit and gives two main stats of elemental damage.' },
          { id: 'er', title: 'How much Energy Regen?', body: 'Enough to cast Liberation on rotation; the guide lists the breakpoints.' },
        ]}
      />
    </div>
  )
}

function CrumbsDemo(): JSX.Element {
  const [page, setPage] = useState(2)
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <Breadcrumbs trail={[{ label: 'Resonators', href: '#r' }, { label: 'Jinhsi', href: '#j' }, { label: 'Main DPS build' }]} />
      <BackLink to="Resonators" />
      <Pagination page={page} pages={8} onPage={setPage} />
    </div>
  )
}

function FooterDemo(): JSX.Element {
  return (
    <div className="ea-ui">
      <Footer />
      <Row label="logo lock-up and mark">
        <Logo />
        <Logo markOnly />
      </Row>
    </div>
  )
}

function BannerDemo(): JSX.Element {
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <Banner tone="warning" action={<Button>Retry now</Button>}>
        You're offline. Changes are kept on this device and sync when you're back.
      </Banner>
      <Banner tone="positive">Back online · synced</Banner>
      <Banner tone="info" icon="clock">
        Game data updates in 01:12:40 for version 3.8. The hub stays open.
      </Banner>
      <Banner tone="negative" urgent action={<Button>Sign in</Button>}>
        You've been signed out. Your open build is kept on this device.
      </Banner>
    </div>
  )
}

function DialogDemo({ latency }: DemoProps): JSX.Element {
  const [open, setOpen] = useState<null | 'confirm' | 'typed' | 'form'>(null)
  const [typed, setTyped] = useState('')
  const [name, setName] = useState('Jinhsi main DPS')
  return (
    <Row>
      <Button onClick={() => setOpen('confirm')}>Discard changes…</Button>
      <Button variant="danger" onClick={() => setOpen('typed')}>
        Delete account…
      </Button>
      <Button onClick={() => setOpen('form')}>Rename build…</Button>
      <Dialog
        open={open === 'confirm'}
        kind="alertdialog"
        title="Discard changes to 'Jinhsi main DPS'?"
        onClose={() => setOpen(null)}
        initialFocus="[data-keep]"
        actions={
          <>
            <Button variant="secondary" data-keep="" onClick={() => setOpen(null)}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={() => setOpen(null)}>
              Discard changes
            </Button>
          </>
        }
      >
        <p>Your unsaved Echo changes will be lost.</p>
      </Dialog>
      <Dialog
        open={open === 'typed'}
        kind="alertdialog"
        title="Delete your account?"
        onClose={() => setOpen(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <ActionButton
              variant="danger"
              disabled={typed !== 'rover@example.com'}
              disabledReason="Type your email to confirm."
              pendingLabel="Deleting account…"
              successLabel="Account deleted"
              onAction={(signal) => simulate(latency, true, signal)}
              onDone={() => setOpen(null)}
            >
              Delete account
            </ActionButton>
          </>
        }
      >
        <p>This deletes your account and all 14 saved builds and 3 teams. It can't be undone. Type your email to confirm.</p>
        <Field label="Your email">{(c) => <TextInput control={c} value={typed} onChange={setTyped} placeholder="rover@example.com" />}</Field>
      </Dialog>
      <Dialog
        open={open === 'form'}
        title="Rename build"
        onClose={() => setOpen(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <ActionButton variant="primary" pendingLabel="Saving name…" successLabel="Name saved" onAction={(signal) => simulate(latency, true, signal)} onDone={() => setOpen(null)}>
              Save name
            </ActionButton>
          </>
        }
      >
        <Field label="Build name" hint="40 characters or fewer">
          {(c) => <TextInput control={c} value={name} onChange={setName} maxLength={60} />}
        </Field>
      </Dialog>
    </Row>
  )
}

function StatusDemo(): JSX.Element {
  return (
    <Row>
      <StatusTag kind="saved">Saved</StatusTag>
      <StatusTag kind="saving">Saving</StatusTag>
      <StatusTag kind="offline">Offline · 3 changes waiting</StatusTag>
      <StatusTag kind="syncing">Syncing</StatusTag>
      <StatusTag kind="synced">Synced</StatusTag>
      <StatusTag kind="ends-soon">Ends soon</StatusTag>
      <StatusTag kind="rerun">Rerun</StatusTag>
      <StatusTag kind="failed">Not synced</StatusTag>
    </Row>
  )
}

function TooltipDemo(): JSX.Element {
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-5)', paddingBlockStart: 'var(--space-6)', minBlockSize: '14rem' }}>
      <Row label="tooltip (hover after the delay, focus at once; one pinned open)">
        <Tooltip text="Crit Rate">CR</Tooltip>
        <Tooltip text="Crit DMG" openInitially>
          CD
        </Tooltip>
        <Tooltip text="Energy Regen">ER</Tooltip>
      </Row>
      <Row label="popover (opens on click or Enter)">
        <Popover label="How is Crit Rate counted?" title="Crit Rate">
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 'var(--step--1)' }}>Base 5%, plus every Crit Rate main and substat, plus weapon and set bonuses.</p>
        </Popover>
      </Row>
    </div>
  )
}

function CardDemo(): JSX.Element {
  return (
    <div className="sys-grid ea-ui">
      <Card tag="Notice" title="Version 3.8 Resonator preview" href="#news" meta="24 Oct" />
      <Card tag="Event" title="Tower of Adversity resets" href="#event" meta="Ends 27 Oct, 04:00 UTC+8" preview="hover" />
      <Card tag="Notice" title="An unusually long news headline that wraps over two lines and keeps the card tidy" href="#news2" meta="23 Oct" preview="focus" />
    </div>
  )
}

function ResonatorCardDemo(): JSX.Element {
  const [sel, setSel] = useState('carlotta')
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <ul className="ea-grid">
        {['jinhsi', 'carlotta', 'camellya', 'sanhua', 'xiangli-yao'].map((id) => (
          <li key={id}>
            <ResonatorCard resonator={byId(id)} href="#r" />
          </li>
        ))}
      </ul>
      <Row label="selectable (team builder): selected shows the ticks">
        {['jinhsi', 'carlotta', 'shorekeeper'].map((id) => (
          <ResonatorCard key={id} resonator={byId(id)} size="compact" selected={sel === id} onSelect={() => setSel(id)} />
        ))}
      </Row>
    </div>
  )
}

function BannerCardDemo(): JSX.Element {
  const [live, setLive] = useState(true)
  const [key, setKey] = useState(0)
  const now = useRef(Date.now())
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <BannerCard
        key={key}
        kind="Featured Resonator"
        title="Changli"
        resonatorId="changli"
        endsAt={now.current + SAMPLE_BANNERS[0].endsInMs}
        arriving={key > 0}
        liveSeconds={live}
        onLiveSecondsChange={setLive}
        action={
          <a className="ea-btn ea-frame ea-edge" data-variant="primary" href="#changli">
            Open the build
          </a>
        }
      />
      <Row label="compact: ending soon, rerun, ended">
        <BannerCard size="compact" kind="Featured Resonator" title="Jinhsi" resonatorId="jinhsi" endsAt={now.current + 20 * 3600_000} rerun liveSeconds={false} />
        <BannerCard size="compact" kind="Event" title="Tower of Adversity" endsAt={now.current - 1000} ended liveSeconds={false} />
      </Row>
      <span>
        <Button onClick={() => setKey((k) => k + 1)}>Replay arrival</Button>
      </span>
    </div>
  )
}

function TableDemo(): JSX.Element {
  const [sort, setSort] = useState<{ id: string; dir: 'ascending' | 'descending' }>({ id: 'name', dir: 'ascending' })
  const rows = [...RESONATORS.slice(0, 6)].sort((a, b) => {
    const k = sort.id === 'rarity' ? a.rarity - b.rarity : a.name.localeCompare(b.name)
    return sort.dir === 'ascending' ? k : -k
  })
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <Table<Resonator>
        caption="Resonators, 6 of 46 (sample)"
        rows={rows}
        rowKey={(r) => r.id}
        selected={['carlotta']}
        sort={sort}
        onSort={(id) => setSort((s) => ({ id, dir: s.id === id && s.dir === 'ascending' ? 'descending' : 'ascending' }))}
        columns={[
          { id: 'name', label: 'Resonator', sortable: true, cell: (r) => r.name },
          { id: 'element', label: 'Element', cell: (r) => <ElementMark element={r.element} /> },
          { id: 'weapon', label: 'Weapon', cell: (r) => r.weapon },
          { id: 'role', label: 'Role', cell: (r) => r.role },
          { id: 'rarity', label: 'Rarity', numeric: true, sortable: true, cell: (r) => <RarityMark rarity={r.rarity} /> },
        ]}
      />
      <div data-density="compact">
        <DescriptionList
          items={[
            { label: 'ATK', value: '2,104' },
            { label: 'Crit Rate', value: '64.2%', delta: <Delta value={-5.8} better={false} /> },
            { label: 'Crit DMG', value: '212.0%', delta: <Delta value={12} better /> },
            { label: 'Energy Regen', value: null },
          ]}
        />
      </div>
    </div>
  )
}

function TagsDemo(): JSX.Element {
  const [on, setOn] = useState<string[]>(['glacio'])
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <Row label="chevron tags">
        <ChevronTag>Notice</ChevronTag>
        <ChevronTag>Event</ChevronTag>
        <ChevronTag tone="accent">Featured Resonator</ChevronTag>
      </Row>
      <Row label="toggle chips (filters)">
        {ELEMENTS.slice(0, 3).map((e) => (
          <ToggleChip key={e} pressed={on.includes(e)} onToggle={() => setOn((l) => (l.includes(e) ? l.filter((x) => x !== e) : [...l, e]))}>
            <Sigil element={e} /> {e[0].toUpperCase() + e.slice(1)}
          </ToggleChip>
        ))}
        <ToggleChip pressed={false} onToggle={noop} preview="hover">
          5★
        </ToggleChip>
      </Row>
      <Row label="applied filter chips">
        <Chip removeLabel="Remove filter: Glacio" onRemove={noop}>
          Glacio
        </Chip>
        <Chip removeLabel="Remove filter: Pistols" onRemove={noop}>
          Pistols
        </Chip>
      </Row>
    </div>
  )
}

function MarksDemo(): JSX.Element {
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <Row label="element marks: sigil + name">
        {ELEMENTS.map((e) => (
          <ElementMark key={e} element={e} />
        ))}
      </Row>
      <Row label="rarity marks">
        <RarityMark rarity={5} />
        <RarityMark rarity={4} />
        <RarityMark rarity={3} />
      </Row>
      <Row label="avatar">
        <Avatar initials="RV" size="sm" />
        <Avatar initials="RV" />
        <Avatar initials="RV" size="lg" />
      </Row>
    </div>
  )
}

function KpiDemo(): JSX.Element {
  const [cr, setCr] = useState(64.2)
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <div className="ea-kpis">
        <KpiTile label="Crit Rate" value={cr} target={70} answer />
        <KpiTile label="Crit DMG" value={212} target={200} />
        <KpiTile label="Energy Regen" value={null} target={120} />
      </div>
      <span>
        <Button onClick={() => setCr((v) => Math.round((v + 2.1) * 10) / 10)}>Add a Crit Rate substat</Button>
      </span>
    </div>
  )
}

function ChartsDemo(): JSX.Element {
  return (
    <div className="sys-grid ea-ui">
      <BarList
        title="Stats vs. target (sample)"
        max={250}
        data={[
          { label: 'Crit Rate', value: 64, target: 70, display: '64.2%' },
          { label: 'Crit DMG', value: 212, target: 200, display: '212.0%' },
          { label: 'Energy Regen', value: 110, target: 120, display: '110.0%' },
        ]}
      />
      <BarList title="Loading" max={1} data={[]} state="loading" />
      <BarList title="Empty" max={1} data={[]} state="empty" />
      <LineChart
        title="Usage rate by version (sample)"
        labels={['3.4', '3.5', '3.6', '3.7', '3.8']}
        series={[
          { name: 'Jinhsi', values: [62, 58, null, 51, 49] },
          { name: 'Carlotta', values: [30, 41, 47, 55, 60] },
        ]}
      />
      <Ring value={4} total={5} label="Celestial Light pieces" />
    </div>
  )
}

function FilterBarDemo(): JSX.Element {
  const [f, setF] = useState<Filters>({ ...NO_FILTERS, elements: ['glacio'], rarities: [5] })
  const count = RESONATORS.filter((r) => (!f.elements.length || f.elements.includes(r.element)) && (!f.weapons.length || f.weapons.includes(r.weapon)) && (!f.rarities.length || f.rarities.includes(r.rarity))).length
  return (
    <div className="ea-ui" style={{ minBlockSize: '16rem' }}>
      <FilterBar value={f} onChange={setF} count={count} />
    </div>
  )
}

function DashboardDemo(): JSX.Element {
  return (
    <div className="ea-ui" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(18rem, 100%), 1fr))', gap: 'var(--gap-group)' }}>
      <div style={{ display: 'grid', gap: 'var(--space-3)', gridColumn: 'span 2' }}>
        <SectionTitle>Current banners</SectionTitle>
        <BannerCard size="compact" kind="Featured Resonator" title="Carlotta" resonatorId="carlotta" endsAt={Date.now() + SAMPLE_BANNERS[0].endsInMs} liveSeconds={false} />
      </div>
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <SectionTitle>Events</SectionTitle>
        <Card tag="Event" title="Tower of Adversity" href="#e" meta="Ends 27 Oct" />
      </div>
    </div>
  )
}

function EchoSlotDemo(): JSX.Element {
  return (
    <div className="ea-ui" data-density="compact">
      <ul className="ea-slots">
        <EchoSlot slot={SAMPLE_ECHOES[0]} index={0} onEdit={noop} />
        <EchoSlot slot={SAMPLE_ECHOES[1]} index={1} state="selected" onEdit={noop} />
        <EchoSlot slot={SAMPLE_ECHOES[2]} index={2} state="warning" message="Echo cost is 13 of 12. Remove or swap an Echo." onEdit={noop} />
        <EchoSlot slot={{ ...SAMPLE_ECHOES[3], main: 'Crit Rate 22.0%' }} index={3} state="error" message="A cost 1 Echo can't have Crit Rate as its main stat" onEdit={noop} />
        <EchoSlot slot={SAMPLE_ECHOES[4]} index={4} syncing="waiting" onEdit={noop} />
      </ul>
    </div>
  )
}

function TeamSlotDemo(): JSX.Element {
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <ul className="ea-team">
        <TeamSlot index={0} resonator={byId('jinhsi')} onRemove={noop} />
        <TeamSlot index={1} resonator={null} state="target" />
        <TeamSlot index={2} resonator={byId('jinhsi')} error="Jinhsi is already in slot 1. Pick another Resonator, or clear slot 1 first." onRemove={noop} />
      </ul>
      <TeamBuilder />
    </div>
  )
}

function ThemeDemo(): JSX.Element {
  return (
    <Row label="settings form; the band uses the compact menu">
      <ThemeSwitch />
      <ThemeSwitch compact />
    </Row>
  )
}

function IconsDemo(): JSX.Element {
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <Row label="element sigils (our own, at 16, 24 and 64 px)">
        {ELEMENTS.map((e) => (
          <span key={e} style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <Sigil element={e} />
            <Sigil element={e} size="lg" />
            <Sigil element={e} size="xl" label={e} />
          </span>
        ))}
      </Row>
      <Row label="sr-only text: icon buttons carry their names">
        <IconButton icon="sync" label="Sync now" />
        <span className="ea-sr-only">This sentence is only for screen readers.</span>
      </Row>
    </div>
  )
}


const VOICE_SAMPLE = [
  { id: 'greet', title: 'Greeting', transcript: 'Sample transcript: a short greeting. The real app shows the line in the chosen language.' },
  { id: 'about', title: 'About the Resonator', transcript: 'Sample transcript: a line about who she is.' },
  { id: 'battle', title: 'Battle start', transcript: 'Sample transcript: a short battle cry.' },
] as const

function BuildPanelDemo(): JSX.Element {
  return <BuildPanel build={JINHSI_BUILD} />
}
function WeaponDemo(): JSX.Element {
  return <WeaponCard weapon={JINHSI_BUILD.weapon} />
}
function EchoDemo(): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <EchoLoadout echoes={JINHSI_BUILD.echoes} sonata={{ ...JINHSI_BUILD.sonata, equipped: 5 }} />
      <Row label="a cost 1 Echo below +25 (substats locked) and an Echo with no icon in the data yet (our fallback)">
        <EchoCard echo={JINHSI_BUILD.echoes[4]} />
        <EchoCard echo={{ ...JINHSI_BUILD.echoes[1], icon: null, name: 'Hoochief (no icon yet)' }} />
      </Row>
    </div>
  )
}
function ForteDemo(): JSX.Element {
  return <ForteTree skills={JINHSI_BUILD.forte} />
}
function ChainDemo(): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <ResonanceChain nodes={JINHSI_BUILD.chain.nodes} unlocked={0} />
      <ResonanceChain nodes={JINHSI_BUILD.chain.nodes} unlocked={2} />
      <ResonanceChain nodes={JINHSI_BUILD.chain.nodes} unlocked={6} />
    </div>
  )
}
function VoiceDemo(): JSX.Element {
  return <VoiceLines lines={[...VOICE_SAMPLE, { id: 'broken', title: 'A clip that fails to load', transcript: 'The transcript stays even when the audio fails.' }]} broken="broken" />
}
function MusicDemo(): JSX.Element {
  return <MusicPlayer title="Resonator theme (sample tone)" subtitle="Generated sample, not game music" />
}
function SoundDemo(): JSX.Element {
  return <SoundSettingsPanel />
}
/** The style's own effects for the Effects section (MOTION-SYSTEM.md §Theme expression). */
export function EaEffectDemo({ id }: { id: string }): JSX.Element {
  const host = useRef<HTMLDivElement>(null)
  const [run, setRun] = useState(0)
  const [selected, setSelected] = useState(false)
  const play1 = (): void => {
    const el = host.current
    if (!el) return
    if (id === 'ea-ripple') ripple(el)
    else if (id === 'sweep') void play(el, 'sweep')
    else if (id === 'burst') burst(el, { colors: [getComputedStyle(el).getPropertyValue('--accent').trim()] })
    else if (id === 'ea-ticks') setSelected((s) => !s)
    else setRun((r) => r + 1)
  }
  const body: Record<string, ReactNode> = {
    'ea-edge': (
      <div className="ea-frame ea-edge" data-tone="outline" tabIndex={0} style={{ padding: 'var(--space-4)' }}>
        Hover or focus: the notch lights
      </div>
    ),
    'ea-draw': (
      <div key={run}>
        <SectionTitle level={3}>Builds</SectionTitle>
      </div>
    ),
    'ea-ticks': (
      <div className="ea-frame ea-ticks" data-tone="outline" data-selected={selected || undefined} style={{ padding: 'var(--space-4)' }}>
        <span className="ea-ticks__mark" aria-hidden="true" />
        {selected ? 'Selected' : 'Not selected'}
      </div>
    ),
    'ea-wave': (
      <span style={{ display: 'inline-flex', gap: 'var(--space-3)', alignItems: 'center', color: 'var(--accent-ink)' }}>
        <Spinner size="lg" label="Loading" />
        <span className="ea-wave" data-settle="" key={`s${run}`}>
          <WavePath />
        </span>
        <span className="ea-wave" data-detune="" key={`d${run}`}>
          <WavePath />
        </span>
        tune · settle · detune
      </span>
    ),
    'ea-ripple': (
      <div className="ea-frame" data-tone="outline" style={{ padding: 'var(--space-5)', position: 'relative' }}>
        A primary press or a result
      </div>
    ),
    'ea-field': (
      <div className="ea-frame" data-tone="band" style={{ position: 'relative', blockSize: '7rem', overflow: 'hidden' }}>
        <span key={run} className="ea-field" data-field={run ? 'drift' : undefined} />
      </div>
    ),
    sweep: (
      <div className="ea-frame" data-tone="band" style={{ padding: 'var(--space-5)' }}>
        A new banner arrives
      </div>
    ),
    burst: (
      <div className="ea-frame" data-tone="outline" style={{ padding: 'var(--space-5)' }}>
        First full build saved
      </div>
    ),
  }
  return (
    <div className="ea-ui" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <div ref={host} style={{ position: 'relative' }}>
        {body[id]}
      </div>
      {id === 'ea-edge' ? null : (
        <span>
          <Button onClick={play1}>Play</Button>
        </span>
      )}
    </div>
  )
}

export const EA_DEMOS: Readonly<Record<string, ComponentType<DemoProps>>> = {
  frame: FrameDemo,
  'focus-skip': FocusDemo,
  button: ButtonDemo,
  'action-states': ActionsDemo,
  link: LinkDemo,
  segmented: SegmentedDemo,
  menu: MenuDemo,
  field: FieldDemo,
  'search-input': SearchDemo,
  textarea: TextareaDemo,
  'code-input': CodeDemo,
  select: SelectDemo,
  combobox: ComboDemo,
  choices: ChoiceDemo,
  switch: SwitchDemo,
  slider: SliderDemo,
  'date-picker': DateDemo,
  'error-summary': ErrorSummaryDemo,
  shell: ShellDemo,
  'phone-nav': PhoneNavDemo,
  'command-menu': CommandDemo,
  'cap-nav': CapNavDemo,
  tabs: TabsDemo,
  accordion: AccordionDemo,
  'breadcrumbs-pagination': CrumbsDemo,
  footer: FooterDemo,
  banner: BannerDemo,
  dialog: DialogDemo,
  'status-tag': StatusDemo,
  'tooltip-popover': TooltipDemo,
  card: CardDemo,
  'resonator-card': ResonatorCardDemo,
  'banner-card': BannerCardDemo,
  table: TableDemo,
  tags: TagsDemo,
  marks: MarksDemo,
  kpi: KpiDemo,
  charts: ChartsDemo,
  'filter-bar': FilterBarDemo,
  dashboard: DashboardDemo,
  'echo-slot': EchoSlotDemo,
  'team-builder': TeamSlotDemo,
  theme: ThemeDemo,
  icons: IconsDemo,
  'build-panel': BuildPanelDemo,
  weapon: WeaponDemo,
  echo: EchoDemo,
  forte: ForteDemo,
  'resonance-chain': ChainDemo,
  'voice-lines': VoiceDemo,
  music: MusicDemo,
  'ui-sounds': SoundDemo,
}
