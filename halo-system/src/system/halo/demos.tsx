/**
 * The /system demos of HALO's components: every state from COMPONENTS.md drawn by the real component, the live ones
 * driven by the latency control. SystemPage.tsx merges this table into its COMPONENT_DEMOS.
 */
import { useRef, useState, type ComponentType, type JSX, type ReactNode } from 'react'
import { ActionButton, InlineMessage } from '../feedback'
import { simulate, type LatencyId } from '../latency'
import {
  BANDS,
  Button,
  DEFAULT_BUILD,
  DialControl,
  ErrorSummary,
  FACES,
  FINISHES,
  Field,
  Figure,
  Footer,
  Header,
  IconButton,
  OrderBar,
  OrderSheet,
  PriceSummary,
  ProductViewer,
  SIZES,
  SPECS,
  SaveIcon,
  SegmentedChoice,
  SkipLink,
  SpecList,
  SwatchPicker,
  TextLink,
  ThemeSwitch,
  TurnLeftIcon,
  PauseIcon,
  PlayIcon,
  euro,
  priceOf,
  type Build,
} from '.'

interface DemoProps {
  latency: LatencyId
  autorun: boolean
}

function Row({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="h-demo-row">
      <span className="h-demo-row__label">{label}</span>
      <div className="h-demo-row__body">{children}</div>
    </div>
  )
}

function FocusSkipDemo(): JSX.Element {
  return (
    <div className="h-demo">
      <Row label="focus ring, paper">
        <Button variant="secondary" preview="focus">Compare sizes</Button>
      </Row>
      <Row label="focus ring beside orange">
        <Button variant="primary" preview="focus">Pre-order HALO</Button>
      </Row>
      <div data-stage="black" className="h-demo-stage">
        <Row label="focus ring, black stage">
          <Button variant="primary" preview="focus">Pre-order HALO</Button>
        </Row>
      </div>
      <Row label="skip link (focus it)">
        <div className="h-demo-skip">
          <SkipLink />
        </div>
      </Row>
    </div>
  )
}

function ButtonDemo(): JSX.Element {
  return (
    <div className="h-demo">
      {(['primary', 'secondary', 'quiet'] as const).map((v) => (
        <Row key={v} label={v}>
          <Button variant={v}>{v === 'primary' ? 'Pre-order HALO' : v === 'secondary' ? 'Compare sizes' : 'Use 45 mm'}</Button>
          <Button variant={v} preview="hover">Hover</Button>
          <Button variant={v} preview="pressed">Pressed</Button>
        </Row>
      ))}
      <Row label="large, on black">
        <div data-stage="black" className="h-demo-stage">
          <Button variant="primary" size="large">Pre-order HALO</Button>
        </div>
      </Row>
      <Row label="unavailable">
        <div>
          <Button variant="primary" unavailable="Glacier blue ships from December in 41 mm.">Pre-order</Button>
        </div>
      </Row>
    </div>
  )
}

function IconButtonDemo(): JSX.Element {
  const [saved, setSaved] = useState(false)
  return (
    <div className="h-demo">
      <Row label="quiet · hover · pressed · focus">
        <IconButton label="Turn left" icon={<TurnLeftIcon />} />
        <IconButton label="Turn left" icon={<TurnLeftIcon />} preview="hover" />
        <IconButton label="Turn left" icon={<TurnLeftIcon />} preview="pressed" />
        <IconButton label="Turn left" icon={<TurnLeftIcon />} preview="focus" />
      </Row>
      <Row label="pause · play (a self-moving product)">
        <IconButton label="Pause turning" icon={<PauseIcon />} />
        <IconButton label="Turn again" icon={<PlayIcon />} />
      </Row>
      <Row label="save build (toggle)">
        <IconButton
          label={saved ? 'Saved. Remove the saved build' : 'Save this build'}
          aria-pressed={saved}
          icon={<SaveIcon filled={saved} />}
          variant="secondary"
          onClick={() => setSaved((s) => !s)}
        />
      </Row>
    </div>
  )
}

function LinkDemo(): JSX.Element {
  return (
    <div className="h-demo">
      <p className="h-demo-text">
        Measure your wrist with the <TextLink href="#size-guide">size guide</TextLink> before you choose.
      </p>
      <Row label="navigation · current">
        <TextLink variant="nav" href="#design">Design</TextLink>
        <TextLink variant="nav" href="#training" current>Training</TextLink>
      </Row>
    </div>
  )
}

function FieldDemo(): JSX.Element {
  return (
    <div className="h-demo h-demo-grid">
      <Field label="Wrist size" hint="Measure where you wear it, for example 165 mm" unit="mm" inputMode="decimal" defaultValue="" />
      <Field label="Wrist size" hint="Measure where you wear it, for example 165 mm" unit="mm" defaultValue="165" />
      <Field label="Wrist size" unit="mm" defaultValue="320" error="Enter a wrist size from 120 to 230 mm" />
      <Field label="Wrist size" unit="mm" defaultValue="124" warning="That's a small wrist: 41 mm with the short band fits it" />
      <Field label="Email" type="email" defaultValue="mariam.okonkwo-lindqvist@example.com" readOnly />
    </div>
  )
}

function ErrorSummaryDemo(): JSX.Element {
  return (
    <div className="h-demo">
      <ErrorSummary
        heading="Fix 2 problems to pay"
        errors={[
          { id: 'demo-card', text: 'Your card was declined. Try another card' },
          { id: 'demo-postcode', text: 'Enter a postcode' },
        ]}
      />
    </div>
  )
}

function SegmentedDemo(): JSX.Element {
  const [size, setSize] = useState('45')
  return (
    <div className="h-demo">
      <SegmentedChoice
        label="Case size"
        note={`from ${euro(SIZES.find((s) => s.id === size)?.price ?? 0)}`}
        options={SIZES.map((s) => ({ id: s.id, label: s.label }))}
        value={size}
        onChange={setSize}
      />
      <div data-stage="black" className="h-demo-stage">
        <SegmentedChoice label="Case size, on black" options={SIZES.map((s) => ({ id: s.id, label: s.label }))} value="41" onChange={() => {}} />
      </div>
    </div>
  )
}

function SwatchDemo(): JSX.Element {
  const [band, setBand] = useState('signal')
  const [finish, setFinish] = useState('natural')
  return (
    <div className="h-demo">
      <SwatchPicker
        label="Band"
        options={BANDS.map((b) => ({ id: b.id, label: b.label, hex: b.hex, unavailable: b.soldOutIn === '41' }))}
        value={band}
        onChange={setBand}
      />
      <SwatchPicker label="Case" shape="finish" options={FINISHES.map((f) => ({ id: f.id, label: f.label, hex: f.metal[1] }))} value={finish} onChange={setFinish} />
      <p className="h-demo-note">Glacier blue shows sold out: a diagonal stroke and the words, in the size 41 mm.</p>
    </div>
  )
}

function DialDemo(): JSX.Element {
  const [face, setFace] = useState(1)
  return (
    <div className="h-demo h-demo-dial">
      <div data-stage="black" className="h-demo-stage h-demo-dial__stage">
        <ProductViewer build={DEFAULT_BUILD} face={face} controls={false} width={150} />
        <DialControl label="Face" steps={FACES.map((f) => ({ id: f.id, label: f.label }))} value={face} onChange={setFace} />
      </div>
      <p className="h-demo-note">Drag along the scale, click a tick, use the arrow buttons or the arrow keys.</p>
    </div>
  )
}

function ViewerDemo({ latency }: DemoProps): JSX.Element {
  const [band, setBand] = useState('signal')
  const [seed, setSeed] = useState(0)
  const build: Build = { ...DEFAULT_BUILD, band: band as Build['band'] }
  return (
    <div className="h-demo">
      <div className="h-demo-grid h-demo-grid--3">
        {(['poster', 'loading', 'error'] as const).map((p) => (
          <figure key={p} className="h-demo-fig">
            <ProductViewer build={DEFAULT_BUILD} preview={p} width={120} controls={p !== 'poster'} />
            <figcaption>{p}</figcaption>
          </figure>
        ))}
      </div>
      <p className="h-demo-note">Live, at the selected latency: hover or focus the stage to load the 360° view, then turn it; change the band to see it settle.</p>
      <ProductViewer
        key={seed}
        build={build}
        width={180}
        loadFrames={async (signal, progress) => {
          const steps = 5
          for (let i = 1; i <= steps; i++) {
            await simulate(latency, true, signal)
            progress(i / steps)
            if (latency === 'fast') break
          }
          progress(1)
        }}
      />
      <SwatchPicker label="Band" options={BANDS.map((b) => ({ id: b.id, label: b.label, hex: b.hex }))} value={band} onChange={setBand} />
      <Button variant="quiet" onClick={() => setSeed((s) => s + 1)}>
        Reset the viewer
      </Button>
    </div>
  )
}

function PriceDemo(): JSX.Element {
  return (
    <div className="h-demo h-demo-grid">
      <PriceSummary build={DEFAULT_BUILD} state="ready" delivery="Delivery 10 Nov to 17 Nov" />
      <PriceSummary build={DEFAULT_BUILD} state="stale" delivery="Delivery 10 Nov to 17 Nov" />
      <PriceSummary build={{ ...DEFAULT_BUILD, band: 'glacier', finish: 'black' }} state="ready" delivery="Delivery 24 Nov to 1 Dec" updated="Updated just now" />
      <PriceSummary build={DEFAULT_BUILD} state="skeleton" />
      <PriceSummary build={DEFAULT_BUILD} state="error" onRetry={() => {}} />
    </div>
  )
}

function OrderBarDemo(): JSX.Element {
  return (
    <div className="h-demo">
      <OrderBar build={DEFAULT_BUILD} shown inline label="Your HALO, at rest" onOrder={() => {}} />
      <OrderBar build={DEFAULT_BUILD} shown inline label="Your HALO, updating" priceState="stale" onOrder={() => {}} />
    </div>
  )
}

function OrderSheetDemo({ latency }: DemoProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [paid, setPaid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const opener = useRef<HTMLButtonElement>(null)
  return (
    <div className="h-demo">
      <Button ref={opener} variant="primary" onClick={() => { setOpen(true); setPaid(null); setError(null) }}>
        Pre-order HALO
      </Button>
      <OrderSheet
        open={open}
        onClose={() => setOpen(false)}
        title={paid ? 'Your HALO is reserved' : 'Pre-order HALO'}
        footer={
          paid ? (
            <Button variant="secondary" onClick={() => setOpen(false)}>Back to HALO</Button>
          ) : (
            <>
              <span className="h-demo-total">Total {euro(priceOf(DEFAULT_BUILD))}</span>
              <ActionButton
                variant="primary"
                knownSlow
                pendingLabel="Processing payment…"
                successLabel="Paid"
                slowLabel="Still processing…"
                errorMessage={() => 'The payment did not go through. Nothing was charged. Try again.'}
                onAction={(signal) => simulate(latency, true, signal)}
                onSuccess={() => setPaid('HALO-2611-0427')}
                onError={() => setError('The payment did not go through. Nothing was charged. Try again.')}
              >
                Pay {euro(priceOf(DEFAULT_BUILD))}
              </ActionButton>
            </>
          )
        }
      >
        {paid ? (
          <p>Reference {paid}. We'll email you when it ships. This is a design study: nothing was charged.</p>
        ) : (
          <>
            <PriceSummary build={DEFAULT_BUILD} state="ready" delivery="Delivery 10 Nov to 17 Nov" />
            <Field label="Email" type="email" autoComplete="email" defaultValue="you@example.com" />
            {error ? <InlineMessage tone="error" title="Payment failed">{error}</InlineMessage> : null}
          </>
        )}
      </OrderSheet>
      <p className="h-demo-note">Opens as a centred dialog (a bottom sheet under 640 px). Focus moves to its title; Esc or Close returns it to the button.</p>
    </div>
  )
}

function HeaderDemo(): JSX.Element {
  return (
    <div className="h-demo">
      <div className="h-demo-frame">
        <Header current="#training" />
      </div>
      <div className="h-demo-frame h-demo-frame--phone">
        <Header stage="paper" phone menuOpen />
      </div>
      {/* actionVariant: secondary while a page's own primary button is on screen (halo-landing's hero) */}
      <div className="h-demo-frame">
        <Header current="#battery" actionVariant="secondary" />
      </div>
    </div>
  )
}

function FooterDemo(): JSX.Element {
  return (
    <div className="h-demo">
      <div className="h-demo-frame">
        <Footer />
      </div>
      {/* links: a landing page's own section links in place of Help and Legal */}
      <div className="h-demo-frame">
        <Footer links={[{ href: '#battery', label: 'Battery' }, { href: '#training', label: 'Training' }, { href: '#design', label: 'Design' }, { href: '#specs', label: 'Specs' }]} />
      </div>
      {/* signoff: the composed end, the page's closing line large above the wordmark and the links */}
      <div className="h-demo-frame">
        <Footer links={[{ href: '#battery', label: 'Battery' }, { href: '#specs', label: 'Specs' }]} signoff="Train by the ring." />
      </div>
    </div>
  )
}

function ThemeSwitchDemo(): JSX.Element {
  return (
    <div className="h-demo">
      <ThemeSwitch />
      <p className="h-demo-note">Switches the chrome only; the black and paper stages keep their look.</p>
    </div>
  )
}

function FigureDemo(): JSX.Element {
  return (
    <div className="h-demo h-demo-grid">
      <div data-stage="black" className="h-demo-stage">
        <Figure value="14" unit="days" caption="Everyday battery" note="Illustrative: a design study" />
      </div>
      <Figure value="4:12" unit="/km" caption="Pace, read at a glance" size="inline" />
      <Figure value="€1,249" caption="Longest price the layout holds" size="inline" />
    </div>
  )
}

function SpecListDemo(): JSX.Element {
  return <SpecList groups={SPECS} initiallyOpen={['case']} />
}

export const HALO_DEMOS: Readonly<Record<string, ComponentType<DemoProps>>> = {
  'focus-skip': FocusSkipDemo,
  button: ButtonDemo,
  'icon-button': IconButtonDemo,
  link: LinkDemo,
  field: FieldDemo,
  'error-summary': ErrorSummaryDemo,
  segmented: SegmentedDemo,
  swatch: SwatchDemo,
  dial: DialDemo,
  viewer: ViewerDemo,
  price: PriceDemo,
  'order-bar': OrderBarDemo,
  'order-sheet': OrderSheetDemo,
  header: HeaderDemo,
  footer: FooterDemo,
  'theme-switch': ThemeSwitchDemo,
  figure: FigureDemo,
  'spec-list': SpecListDemo,
}
