/**
 * The /system demos of the Maison Sucre components (COMPONENTS.md), one per registry entry, each drawn by the real
 * component in its states. Pointer states (hover, focus, pressed) are pinned with `preview` so they can be seen at
 * rest. SystemPage.tsx merges these into its component table.
 */
import { useRef, useState, type ComponentType, type JSX } from 'react'
import { FilmPlayer, type FilmSpec } from './film'
import { EmptyState, ErrorState } from './feedback'
import * as Icons from './feedback/icons'
import type { LatencyId } from './latency'
import { simulate } from './latency'
import {
  Accordion,
  BeadBorder,
  ChapterRail,
  Button,
  Checkbox,
  ChoiceChips,
  DatePicker,
  Dialog,
  ErrorSummary,
  Field,
  FileInput,
  Footer,
  Header,
  IconButton,
  Logo,
  Mark,
  NumberStepper,
  SearchField,
  Segmented,
  Select,
  TextInput,
  TextLink,
  Textarea,
  ThemeToggle,
  TimeSlots,
  TimeSlotsSkeleton,
  describedBy,
  type Preview,
} from './ui'
import {
  BookingCard,
  CAKES,
  CakeCard,
  CakeCardSkeleton,
  CakeStand,
  DEFAULT_DESIGN,
  FAQ,
  FLAVOURS,
  FlavourCard,
  PriceRange,
  STYLES,
  ServingsTable,
  TastingBox,
  priceFor,
} from './cake'

interface DemoProps {
  latency: LatencyId
  autorun: boolean
}

const noop = (): void => {}
const PREVIEWS: readonly (Preview | 'idle')[] = ['idle', 'hover', 'focus', 'pressed']

function Cell({ caption, children }: { caption: string; children: JSX.Element | JSX.Element[] }): JSX.Element {
  return (
    <figure className="sys-cell">
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

function FocusDemo(): JSX.Element {
  return (
    <div className="sys-row-wrap">
      <Cell caption="focus ring (keyboard)">
        <Button preview="focus">Book a tasting</Button>
      </Cell>
      <Cell caption="two-tone ring on a picture">
        <div style={{ inlineSize: '8rem' }}>
          <CakeCard cake={CAKES[0]} onOpen={noop} />
        </div>
      </Cell>
      <Cell caption="skip link, focused">
        <a href="#main" className="ms-btn" data-variant="secondary" data-preview="focus">
          Skip to the cakes
        </a>
      </Cell>
    </div>
  )
}

function IconsDemo(): JSX.Element {
  const names = Object.keys(Icons).filter((k) => k.endsWith('Icon') && k !== 'ToneIcon') as (keyof typeof Icons)[]
  return (
    <div className="sys-row-wrap" style={{ fontSize: 'var(--icon-lg)' }}>
      {names.map((name) => {
        const Icon = Icons[name] as ComponentType
        return (
          <figure key={name} className="sys-cell" title={name} style={{ alignItems: 'center' }}>
            <span data-vfx-play="pipe" style={{ display: 'inline-flex' }}>
              <Icon />
            </span>
            <figcaption>{name.replace('Icon', '').toLowerCase()}</figcaption>
          </figure>
        )
      })}
    </div>
  )
}

function LogoDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      <Logo />
      <div className="sys-row-wrap" style={{ alignItems: 'end', color: 'var(--ink)' }}>
        <Mark className="sys-mark-16" />
        <Mark className="sys-mark-32" />
        <Mark className="sys-mark-64" />
      </div>
      <div className="ms-footer" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-card)' }}>
        <Logo />
      </div>
    </div>
  )
}

function BeadDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      <BeadBorder />
      <BeadBorder variant="short" />
      <p className="sys-note">It pipes in left to right the first time it comes into view, once.</p>
    </div>
  )
}

function ButtonDemo(): JSX.Element {
  return (
    <div className="sys-matrix">
      {(['primary', 'secondary', 'quiet'] as const).map((variant) => (
        <div key={variant} className="sys-matrix__row">
          <h4>{variant}</h4>
          <div className="sys-cells">
            {PREVIEWS.map((p) => (
              <Cell key={p} caption={p}>
                <Button variant={variant} preview={p === 'idle' ? undefined : p}>
                  {variant === 'primary' ? 'Book a tasting' : variant === 'secondary' ? 'Design your cake' : 'Start again'}
                </Button>
              </Cell>
            ))}
            <Cell caption="disabled, says why">
              <Button variant={variant} disabled disabledReason="Choose a tier first">
                Continue
              </Button>
            </Cell>
          </div>
        </div>
      ))}
      <div className="sys-matrix__row">
        <h4>large (the hero's primary)</h4>
        <div className="sys-cells">
          <Button variant="primary" size="large">
            Book a tasting
          </Button>
        </div>
      </div>
    </div>
  )
}

function IconButtonDemo(): JSX.Element {
  return (
    <div className="sys-cells">
      {PREVIEWS.map((p) => (
        <Cell key={p} caption={p}>
          <IconButton label="Keep for tasting" icon={<Icons.HeartIcon />} preview={p === 'idle' ? undefined : p} />
        </Cell>
      ))}
      <Cell caption="toggle on">
        <IconButton label="Kept for tasting" icon={<Icons.HeartIcon filled />} pressed />
      </Cell>
      <Cell caption="pending (optimistic)">
        <IconButton label="Kept for tasting" icon={<Icons.HeartIcon filled />} pressed word="Keeping…" />
      </Cell>
      <Cell caption="disabled: box full">
        <IconButton label="Keep for tasting" icon={<Icons.HeartIcon />} disabled disabledReason="Your box is full" />
      </Cell>
    </div>
  )
}

function LinkDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      <p>
        Read the <TextLink href="#questions">answers to common questions</TextLink> before your tasting.
      </p>
      <div className="sys-row-wrap">
        <TextLink href="#design" standalone>
          Design your cake <Icons.ArrowIcon />
        </TextLink>
        <TextLink href="#cakes" current>
          Cakes (current section)
        </TextLink>
      </div>
    </div>
  )
}

function HeaderDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      <div className="sys-frame-box">
        <Header current="#cakes" onBook={noop} />
      </div>
      <p className="sys-note">At the 320 or 768 width the links move behind Menu, a sheet that closes on Esc.</p>
    </div>
  )
}

function FooterDemo(): JSX.Element {
  return (
    <div className="sys-frame-box">
      <Footer headingLevel={4} />
    </div>
  )
}

function FieldDemo(): JSX.Element {
  const ids = ['f-idle', 'f-filled', 'f-error', 'f-warning', 'f-success', 'f-readonly', 'f-pending', 'f-long'] as const
  return (
    <div className="sys-grid-2">
      <Field id={ids[0]} label="Your names" hint="As you'd like them piped on the board">
        <TextInput id={ids[0]} aria-describedby={describedBy(ids[0], true, false)} />
      </Field>
      <Field id={ids[1]} label="Email address">
        <TextInput id={ids[1]} defaultValue="ana.and.sam@example.com" />
      </Field>
      <Field id={ids[2]} label="Email address" message="Email address must include @, like you@example.com">
        <TextInput id={ids[2]} defaultValue="ana.example.com" invalid aria-describedby={describedBy(ids[2], false, true)} />
      </Field>
      <Field id={ids[3]} label="Wedding date" message="We deliver Tuesday to Saturday. Monday weddings collect from the kitchen. (Sample.)" tone="warning">
        <TextInput id={ids[3]} defaultValue="Mon 14 Jun 2027" aria-describedby={describedBy(ids[3], false, true)} />
      </Field>
      <Field id={ids[4]} label="Venue postcode" message="Found: SW4" tone="success">
        <TextInput id={ids[4]} defaultValue="SW4 0JH" aria-describedby={describedBy(ids[4], false, true)} />
      </Field>
      <Field id={ids[5]} label="Your names (sending)">
        <TextInput id={ids[5]} defaultValue="Ana and Sam" readOnly />
      </Field>
      <Field id={ids[6]} label="Venue postcode (checking)">
        <TextInput id={ids[6]} defaultValue="SW4 0JH" checking />
      </Field>
      <Field id={ids[7]} label="Your names" optional>
        <TextInput id={ids[7]} defaultValue="Anastasia Konstantinopoulou-Whitworth and Samuel Oyelaran-Featherstonehaugh" />
      </Field>
    </div>
  )
}

function InputsDemo(): JSX.Element {
  const [notes, setNotes] = useState('We met in a bakery queue, so something with lemon please. '.repeat(15))
  return (
    <div className="sys-grid-2">
      <Field id="i-select" label="Flavour for tier 1">
        <Select id="i-select" defaultValue={FLAVOURS[0].id}>
          {FLAVOURS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="i-notes" label="Tell us about your day" optional>
        <Textarea id="i-notes" value={notes} maxLength={1000} countId="i-notes-count" aria-describedby="i-notes-count" onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </div>
  )
}

function SearchDemo(): JSX.Element {
  const [q, setQ] = useState('gluten')
  return <SearchField id="s-demo" label="Search the questions" value={q} onChange={setQ} count={`${FAQ.filter((f) => f.question.toLowerCase().includes(q.toLowerCase())).length} answers`} />
}

function StepperDemo(): JSX.Element {
  const [tiers, setTiers] = useState(3)
  const [guests, setGuests] = useState(400)
  return (
    <div className="sys-row-wrap" style={{ alignItems: 'start' }}>
      <Field id="st-tiers" label="Tiers">
        <NumberStepper id="st-tiers" value={tiers} min={1} max={5} unit="tiers" minReason="One tier is the smallest" maxReason="Five tiers is our tallest cake" onChange={setTiers} />
      </Field>
      <Field id="st-guests" label="Guests (at the limit)" message={guests > 400 ? 'Guests must be between 20 and 400. For more, ask us about a larger cake.' : undefined}>
        <NumberStepper id="st-guests" value={guests} min={20} max={999} unit="guests" invalid={guests > 400} onChange={setGuests} />
      </Field>
    </div>
  )
}

function SegmentedDemo(): JSX.Element {
  const [shape, setShape] = useState<'round' | 'square' | 'hexagon'>('round')
  const [finish, setFinish] = useState('fondant')
  return (
    <div className="sys-stack">
      <Segmented
        legend="Shape"
        options={[
          { value: 'round', label: 'Round' },
          { value: 'square', label: 'Square' },
          { value: 'hexagon', label: 'Hexagon', disabledReason: 'Hexagon cakes go up to four tiers (sample rule)' },
        ]}
        value={shape}
        onChange={setShape}
        hint="Hexagon is unavailable for five tiers, and says so."
      />
      <Segmented
        legend="Finish"
        options={[
          { value: 'fondant', label: 'Fondant' },
          { value: 'buttercream', label: 'Buttercream' },
          { value: 'semi-naked', label: 'Semi-naked' },
          { value: 'naked', label: 'Naked' },
        ]}
        value={finish}
        onChange={setFinish}
      />
    </div>
  )
}

function ChipsDemo(): JSX.Element {
  const [style, setStyle] = useState<string | null>('floral')
  const [flowers, setFlowers] = useState<string[]>(['peonies'])
  return (
    <div className="sys-stack">
      <ChoiceChips legend="Style (single)" options={STYLES.map((s) => ({ value: s.value, label: s.label, petal: s.petal, count: CAKES.filter((c) => c.style === s.value).length }))} value={style} onChange={setStyle} />
      <ChoiceChips
        legend="Flowers you love (multiple)"
        multiple
        options={[
          { value: 'peonies', label: 'Peonies', petal: 'floral' },
          { value: 'sweet-peas', label: 'Sweet peas', petal: 'modern' },
          { value: 'ranunculus', label: 'Ranunculus', petal: 'flavour' },
          { value: 'none', label: 'No flowers' },
        ]}
        value={flowers}
        onChange={setFlowers}
      />
    </div>
  )
}

function CheckboxDemo(): JSX.Element {
  const [on, setOn] = useState(true)
  return (
    <div className="sys-stack">
      <Checkbox label="Include my design from the builder" checked={on} onChange={(e) => setOn(e.target.checked)} />
      <Checkbox label="Email me a copy of my request" defaultChecked={false} />
    </div>
  )
}

function DateDemo(): JSX.Element {
  const today = new Date()
  const [date, setDate] = useState<Date | null>(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9))
  return (
    <div className="sys-grid-2">
      <DatePicker
        id="d-inline"
        label="Tasting date"
        hint="Mondays are closed; some days are full (sample)"
        value={date}
        onChange={setDate}
        inline
        today={today}
        rule={(d) => (d.getDay() === 1 ? { unavailable: 'the kitchen bakes on Mondays' } : d.getDate() % 9 === 0 ? { unavailable: 'full' } : {})}
      />
      <div className="sys-stack">
        <DatePicker id="d-closed" label="Wedding date" value={null} onChange={noop} />
        <DatePicker id="d-error" label="Wedding date" value={null} onChange={noop} message="Enter a wedding date in the future, like 14 Jun 2027" />
        <DatePicker id="d-busy" label="Tasting date (loading the month)" value={null} onChange={noop} inline busy />
      </div>
    </div>
  )
}

function SlotsDemo(): JSX.Element {
  const [time, setTime] = useState<string | null>('11:00')
  return (
    <div className="sys-stack">
      <TimeSlots
        legend="Times on Sat 15 Nov"
        slots={[
          { time: '10:00' },
          { time: '11:00' },
          { time: '12:30', taken: true },
          { time: '14:00', taken: true, takenLive: true },
          { time: '15:30' },
          { time: '17:00' },
        ]}
        value={time}
        onChange={setTime}
        freshness="Times checked just now"
      />
      <TimeSlotsSkeleton legend="Times on Sun 16 Nov" />
    </div>
  )
}

function FileDemo({ latency }: DemoProps): JSX.Element {
  let n = 0
  return (
    <FileInput
      label="Pictures you love"
      latency={latency}
      pick={() => {
        n++
        return n % 2
          ? [
              { id: `a${n}`, name: 'peonies.jpg', sizeMb: 3.1 },
              { id: `b${n}`, name: 'IMG_2041.HEIC', sizeMb: 12.4 },
            ]
          : [{ id: `c${n}`, name: 'venue.png', sizeMb: 1.2 }]
      }}
    />
  )
}

function SummaryDemo(): JSX.Element {
  return (
    <ErrorSummary
      errors={[
        { id: 'f-idle', text: 'Enter your names' },
        { id: 'f-error', text: 'Email address must include @, like you@example.com' },
        { id: 'd-error', text: 'Enter your wedding date' },
      ]}
    />
  )
}

function CakeCardDemo(): JSX.Element {
  return (
    <div className="ms-cakegrid">
      <CakeCard cake={CAKES[0]} onOpen={noop} />
      <CakeCard cake={CAKES[10]} onOpen={noop} />
      <CakeCard cake={CAKES[3]} onOpen={noop} brokenPicture />
      <CakeCardSkeleton petal="sculptural" />
    </div>
  )
}

function FlavourCardDemo({ latency }: DemoProps): JSX.Element {
  const [kept, setKept] = useState<string[]>([FLAVOURS[1].id])
  return (
    <div className="sys-stack">
      {FLAVOURS.slice(0, 2).map((f) => (
        <FlavourCard
          key={f.id}
          flavour={f}
          kept={kept.includes(f.id)}
          boxFull={false}
          headingLevel={4}
          onToggle={async (fl, keep) => {
            await simulate(latency, true)
            setKept((all) => (keep ? [...all, fl.id] : all.filter((x) => x !== fl.id)))
          }}
        />
      ))}
      <FlavourCard flavour={FLAVOURS[3]} kept={false} boxFull headingLevel={4} onToggle={async () => undefined} />
    </div>
  )
}

function TastingBoxDemo(): JSX.Element {
  const [kept, setKept] = useState(FLAVOURS.slice(0, 4))
  return (
    <div className="sys-stack">
      <TastingBox kept={kept} onRemove={(f) => setKept((all) => all.filter((x) => x.id !== f.id))} onRestore={(f, i) => setKept((all) => [...all.slice(0, i), f, ...all.slice(i)])} headingLevel={4} />
      <TastingBox kept={FLAVOURS.slice(0, 6)} onRemove={noop} onRestore={noop} headingLevel={4} />
      <TastingBox kept={[]} onRemove={noop} onRestore={noop} headingLevel={4} />
    </div>
  )
}

function BookingCardDemo(): JSX.Element {
  const [run, setRun] = useState(0)
  const [date] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12)
  })
  return (
    <div className="sys-stack">
      <BookingCard key={run} date={date} time="11:00" flavours={['Lemon and elderflower', 'Pistachio and rose']} reference="MS-2611" celebrate={run > 0} focusOnMount={run > 0} />
      <Button variant="secondary" onClick={() => setRun((r) => r + 1)}>
        Play the celebration
      </Button>
    </div>
  )
}

function ServingsDemo(): JSX.Element {
  const [guests, setGuests] = useState<number | null>(120)
  return <ServingsTable guests={guests} onGuests={setGuests} />
}

function PriceDemo(): JSX.Element {
  const [tiers, setTiers] = useState(3)
  const design = { ...DEFAULT_DESIGN, tiers, flowers: 'cascade' as const }
  return (
    <div className="sys-stack">
      <PriceRange range={priceFor(design)} tiers={tiers} complete={tiers >= 4} />
      <PriceRange range={priceFor({ ...design, tiers: 5 })} tiers={5} budget={600} />
      <div className="sys-row-wrap">
        <Button variant="secondary" onClick={() => setTiers((t) => Math.max(1, t - 1))}>
          One tier fewer
        </Button>
        <Button variant="secondary" onClick={() => setTiers((t) => Math.min(5, t + 1))}>
          One tier more
        </Button>
      </div>
    </div>
  )
}

function StandDemo(): JSX.Element {
  const [tiers, setTiers] = useState(3)
  return (
    <div className="sys-grid-2">
      <div className="sys-stack">
        <CakeStand design={{ ...DEFAULT_DESIGN, tiers, flowers: 'cascade', goldLeaf: true }} variant="builder" />
        <div className="sys-row-wrap">
          <Button variant="secondary" onClick={() => setTiers((t) => Math.min(5, t + 1))}>
            Set a tier down
          </Button>
          <Button variant="quiet" onClick={() => setTiers((t) => Math.max(1, t - 1))}>
            Lift a tier off
          </Button>
        </div>
      </div>
      <div className="sys-stack">
        <CakeStand design={{ ...DEFAULT_DESIGN, tiers: 3, flowers: 'cascade' }} variant="hero" poster="/system/cake-study.webp" />
        <CakeStand design={{ ...DEFAULT_DESIGN, tiers: 2, finish: 'naked', flowers: 'spray' }} live={false} failLive />
      </div>
    </div>
  )
}

function AccordionDemo(): JSX.Element {
  return <Accordion items={FAQ.slice(0, 4).map((f) => ({ id: f.id, question: f.question, answer: <p style={{ margin: 0 }}>{f.answer}</p> }))} query="" headingLevel={4} />
}

function DialogDemo(): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className="sys-stack">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open Peony cascade
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Peony cascade"
        actions={
          <>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Design one like this
            </Button>
            <Button variant="quiet" onClick={() => setOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        <p>Sugar peonies and ranunculus falling from the top tier to the board. 3 tiers · about 74 portions · from £590 (sample price).</p>
      </Dialog>
      <p className="sys-note">A centred panel on wide screens, a bottom sheet under 640 px; Esc, the scrim and Close all close it.</p>
    </div>
  )
}

function ThemeDemo(): JSX.Element {
  return (
    <div className="sys-row-wrap">
      <ThemeToggle />
      <span className="sys-note">Stored as ms-theme; applied before first paint.</span>
    </div>
  )
}

function EmptyDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      <EmptyState kind="first-use" title="Keep up to six flavours" headingLevel={4} action={<Button variant="secondary">See the flavours</Button>}>
        Choose the ones you'd like to taste together; we'll bake a slice of each.
      </EmptyState>
      <EmptyState kind="no-results" title={'No cakes match "Naked" and 5 tiers'} filters={['Naked', '5 tiers']} headingLevel={4} action={<Button variant="secondary">Show all styles</Button>}>
        Our naked cakes go up to four tiers. Try fewer tiers, or see every style.
      </EmptyState>
      <EmptyState kind="cleared" title="Your box is empty again" headingLevel={4}>
        Keep any flavour to add it back.
      </EmptyState>
    </div>
  )
}

function ErrorStateDemo({ latency }: DemoProps): JSX.Element {
  return (
    <ErrorState title="Could not load tasting times" onRetry={(signal) => simulate(latency, true, signal)} announceOnMount={false}>
      Check your connection, then try again.
    </ErrorState>
  )
}

function ChapterRailDemo(): JSX.Element {
  const steps = [
    { href: '#rail-demo', label: 'The board' },
    { href: '#rail-demo', label: 'Piping' },
    { href: '#rail-demo', label: 'Sugar flowers' },
    { href: '#rail-demo', label: 'The topper' },
  ]
  return (
    <div className="sys-stack" id="rail-demo">
      <ChapterRail steps={steps} current={0} label="Chapters, first lit" />
      <ChapterRail steps={steps} current={2} label="Chapters, third lit" />
      <div style={{ maxInlineSize: 260 }}>
        <ChapterRail steps={steps} current={3} label="Chapters, narrow: scrolls sideways" />
      </div>
    </div>
  )
}

/** The film player in its stills mode (the landing page's five portrait chapter frames), scrubbed by this page's scroll. */
const DEMO_FILM: FilmSpec = {
  frames: 241,
  keys: [0, 60, 120, 180, 240].map((frame, i) => ({ id: String(i), frame })),
  sets: {
    desktop: { size: [1080, 1920], path: '/maison-sucre-landing/film/phone/', stillsOnly: true },
    phone: { size: [1080, 1920], path: '/maison-sucre-landing/film/phone/', stillsOnly: true },
  },
  ext: 'webp',
  digits: 3,
}

function FilmDemo(): JSX.Element {
  const track = useRef<HTMLDivElement>(null)
  const [chapter, setChapter] = useState(0)
  return (
    <div ref={track} style={{ blockSize: '160vh', position: 'relative' }}>
      <div style={{ position: 'sticky', insetBlockStart: 'calc(var(--sticky-top) + var(--space-4))', blockSize: '60vh', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
        <FilmPlayer film={DEMO_FILM} trigger={track} onChapter={setChapter} poster={{ desktop: '/maison-sucre-landing/film/phone/000.webp', phone: '/maison-sucre-landing/film/phone/000.webp' }} />
        <p className="sys-note" style={{ position: 'absolute', insetBlockEnd: 8, insetInlineStart: 8, margin: 0, background: 'var(--surface)', padding: '4px 8px', borderRadius: 8 }}>
          Chapter {chapter + 1} of 5 · scroll this card past
        </p>
      </div>
    </div>
  )
}

export const MS_COMPONENT_DEMOS: Readonly<Record<string, ComponentType<DemoProps>>> = {
  'focus-ring': FocusDemo,
  icon: IconsDemo,
  logo: LogoDemo,
  'bead-border': BeadDemo,
  'chapter-rail': ChapterRailDemo,
  'film-player': FilmDemo,
  button: ButtonDemo,
  'icon-button': IconButtonDemo,
  link: LinkDemo,
  header: HeaderDemo,
  footer: FooterDemo,
  field: FieldDemo,
  inputs: InputsDemo,
  'search-field': SearchDemo,
  'number-stepper': StepperDemo,
  segmented: SegmentedDemo,
  'choice-chips': ChipsDemo,
  checkbox: CheckboxDemo,
  'date-picker': DateDemo,
  'time-slots': SlotsDemo,
  'file-input': FileDemo,
  'error-summary': SummaryDemo,
  'cake-card': CakeCardDemo,
  'flavour-card': FlavourCardDemo,
  'tasting-box': TastingBoxDemo,
  'booking-card': BookingCardDemo,
  'servings-table': ServingsDemo,
  'price-range': PriceDemo,
  'cake-stand': StandDemo,
  accordion: AccordionDemo,
  dialog: DialogDemo,
  'theme-toggle': ThemeDemo,
  'empty-state': EmptyDemo,
  'error-state': ErrorStateDemo,
}
