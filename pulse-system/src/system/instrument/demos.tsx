/**
 * The /system demos of the instrument components: every state from COMPONENTS.md drawn by the real component, and
 * the live ones wired to the real engine. SystemPage.tsx merges this table into its COMPONENT_DEMOS.
 */
import { useState, type ComponentType, type JSX } from 'react'
import { ActionButton } from '../feedback'
import type { LatencyId } from '../latency'
import { simulate } from '../latency'
import { FACTORY_PATCHES } from './patches'
import { PageKeys, pageKeyIds } from './PageKeys'
import {
  EnvelopeDisplay,
  FinishSwitch,
  Fader,
  Keyboard,
  StepLoop,
  Knob,
  Led,
  Oled,
  PatchList,
  PatchListSkeleton,
  PatchNameField,
  Scope,
  SiteFooter,
  SiteHeader,
  SoundSwitch,
  SpecList,
  WaveformSelector,
  applyFinish,
  engine,
  fmt,
  type BankFilter,
  type Finish,
  type PatchRow,
} from '.'

interface DemoProps {
  latency: LatencyId
  autorun: boolean
}

/** The bank rows, from the factory patches (patches.ts). */
export const SAMPLE_PATCHES: readonly PatchRow[] = FACTORY_PATCHES.map(({ id, number, name, type }) => ({ id, number, name, type }))

export const SPECS = [
  { term: 'Voices', value: '8, two oscillators each, plus sub and noise' },
  { term: 'Waves', value: 'Sine, triangle, saw, square' },
  { term: 'Filter', value: '12 dB low-pass, 40 Hz to 12 kHz' },
  { term: 'Envelope', value: 'ADSR, 1 ms to 5 s; filter envelope up to 4 octaves' },
  { term: 'LFO', value: '0.05 to 12 Hz, to cutoff' },
  { term: 'Effects', value: 'Drive, delay, reverb' },
  { term: 'Keys', value: '49 (4 octaves), velocity' },
  { term: 'Screen', value: '128 × 32 OLED, amber' },
  { term: 'Size', value: '700 × 160 × 48 mm' },
] as const

function Cell({ caption, children }: { caption: string; children: JSX.Element | JSX.Element[] }): JSX.Element {
  return (
    <figure className="sys-cell">
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

function KnobDemo(): JSX.Element {
  const { patch } = engine.useEngine()
  return (
    <div className="sys-stack">
      <div className="sys-cells">
        <Cell caption="idle">
          <Knob label="Cutoff" value={1240} min={40} max={12000} log defaultValue={1240} format={fmt.hz} onChange={() => {}} />
        </Cell>
        <Cell caption="hover">
          <Knob label="Resonance" value={4} min={0.1} max={18} defaultValue={4} format={fmt.q} onChange={() => {}} preview="hover" />
        </Cell>
        <Cell caption="focus">
          <Knob label="Attack" value={0.012} min={0.001} max={4} log defaultValue={0.012} format={fmt.ms} onChange={() => {}} preview="focus" />
        </Cell>
        <Cell caption="dragged">
          <Knob label="Sustain" value={0.6} min={0} max={1} defaultValue={0.6} format={fmt.pct} onChange={() => {}} preview="dragged" />
        </Cell>
      </div>
      <p className="sys-note">Live: drag up and down, use the arrow keys, click the arc to jump, double-click to reset.</p>
      <div className="sys-row-wrap">
        <Knob label="Cutoff" size="lg" value={patch.cutoff} min={40} max={12000} log defaultValue={1240} format={fmt.hz} onChange={(v) => engine.setPatch({ cutoff: v })} />
        <Knob label="Release" value={patch.release} min={0.001} max={4} log defaultValue={0.8} format={fmt.ms} onChange={(v) => engine.setPatch({ release: v })} />
      </div>
    </div>
  )
}

function KeyboardDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      <Keyboard octaves={1} previewNote={52} />
      <p className="sys-note">One octave with E3 pinned pressed. Turn the sound on in the Sound switch card to hear it.</p>
    </div>
  )
}

function WaveformDemo(): JSX.Element {
  const { patch } = engine.useEngine()
  return <WaveformSelector value={patch.wave} onChange={(w) => engine.setPatch({ wave: w })} />
}

function SoundSwitchDemo({ latency }: DemoProps): JSX.Element {
  return (
    <div className="sys-stack">
      <SoundSwitch forceFailure={latency === 'fail' ? 'blocked' : null} />
      <p className="sys-note">Latency “fail” makes the start fail the way a blocking browser does.</p>
      <div className="sys-cells">
        <Cell caption="no device">
          <div className="pi-sound__msg">
            <Led state="negative" word="No output" />
          </div>
        </Cell>
      </div>
    </div>
  )
}

function LedDemo(): JSX.Element {
  return (
    <div className="sys-cells">
      <Cell caption="off"><Led state="off" word="Off" /></Cell>
      <Cell caption="on"><Led state="on" word="On" /></Cell>
      <Cell caption="blink"><Led state="blink" word="Saving" /></Cell>
      <Cell caption="positive"><Led state="positive" word="Synced" /></Cell>
      <Cell caption="warning"><Led state="warning" word="Waiting to sync" /></Cell>
      <Cell caption="negative"><Led state="negative" word="Clip" /></Cell>
    </div>
  )
}

function OledDemo(): JSX.Element {
  const [n, setN] = useState(0)
  const values = ['1.24KHZ', '880HZ', '12.0KHZ']
  return (
    <div className="sys-stack">
      <div className="sys-cells">
        <Cell caption="idle"><Oled line1="Night Bass" line2="Patch 001" /></Cell>
        <Cell caption="live value"><Oled line1={`Cut ${values[n % 3]}`} line2="Cutoff" /></Cell>
        <Cell caption="pending"><Oled line1="Loading" line2="Night Bass" pending /></Cell>
        <Cell caption="error"><Oled line1="Try again" line2="Bank offline" error /></Cell>
        <Cell caption="off"><Oled line1="Sound off" /></Cell>
      </div>
      <button type="button" className="sys-btn" onClick={() => setN((v) => v + 1)}>
        Type a new value
      </button>
    </div>
  )
}

function ScopeDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      <Scope variant="panel" />
      <div className="sys-cells">
        <Cell caption="clip"><Scope variant="panel" demo="clip" /></Cell>
      </div>
    </div>
  )
}

function EnvelopeDemo(): JSX.Element {
  const { patch } = engine.useEngine()
  return (
    <div className="sys-stack">
      <EnvelopeDisplay patch={patch} />
      <div className="sys-row-wrap">
        {(['attack', 'decay', 'release'] as const).map((k) => (
          <Knob key={k} label={k[0].toUpperCase() + k.slice(1)} value={patch[k]} min={0.001} max={4} log defaultValue={0.3} format={fmt.ms} onChange={(v) => engine.setPatch({ [k]: v })} />
        ))}
        <Knob label="Sustain" value={patch.sustain} min={0} max={1} defaultValue={0.6} format={fmt.pct} onChange={(v) => engine.setPatch({ sustain: v })} />
      </div>
      <EnvelopeDisplay patch={patch} editing="d" />
    </div>
  )
}

function PatchListDemo({ latency }: DemoProps): JSX.Element {
  const [filter, setFilter] = useState<BankFilter>('all')
  const [selected, setSelected] = useState<string | null>('p1')
  const [loading, setLoading] = useState<string | null>(null)
  const rows = SAMPLE_PATCHES.filter((r) => filter === 'all' || r.type === filter)
  const withStatus: PatchRow[] = [
    { id: 's1', number: 101, name: 'My Bass', type: 'bass', mine: true, status: 'saving' },
    { id: 's2', number: 102, name: 'Late Pad', type: 'pad', mine: true, status: 'waiting' },
    { id: 's3', number: 103, name: 'Zap', type: 'fx', mine: true, status: 'synced' },
    { id: 's4', number: 104, name: 'Buzz', type: 'lead', mine: true, status: 'failed' },
  ]
  return (
    <div className="sys-stack">
      <PatchList
        filter={filter}
        onFilter={setFilter}
        rows={rows}
        selectedId={selected}
        loadingId={loading}
        spinnerId={loading}
        onLoad={async (row) => {
          setLoading(row.id)
          try {
            await simulate(latency, row.id)
            setSelected(row.id)
          } catch {
            /* the Patch load scenario shows the failure path */
          } finally {
            setLoading(null)
          }
        }}
      />
      <div className="sys-cells">
        <Cell caption="each row status">
          <PatchList filter="mine" onFilter={() => {}} rows={withStatus} selectedId={null} loadingId={null} onLoad={() => {}} />
        </Cell>
        <Cell caption="skeleton">
          <PatchList filter="all" onFilter={() => {}} rows={[]} selectedId={null} loadingId={null} onLoad={() => {}} busy status={<PatchListSkeleton />} />
        </Cell>
      </div>
    </div>
  )
}

function FieldDemo(): JSX.Element {
  const [value, setValue] = useState('')
  return (
    <div className="sys-stack">
      <PatchNameField value={value} onChange={setValue} />
      <div className="sys-cells">
        <Cell caption="focus, empty">
          <PatchNameField value="" onChange={() => {}} preview="focus" />
        </Cell>
        <Cell caption="filled">
          <PatchNameField value="NIGHT BASS" onChange={() => {}} />
        </Cell>
        <Cell caption="error, empty">
          <PatchNameField value="" onChange={() => {}} error="Name your patch to save it." />
        </Cell>
        <Cell caption="long value">
          <PatchNameField value="SIXTEEN CHARS ON" onChange={() => {}} />
        </Cell>
      </div>
    </div>
  )
}

function FinishDemo(): JSX.Element {
  const [finish, setFinish] = useState<Finish>(() => (document.documentElement.dataset.theme === 'light' ? 'bone' : 'graphite'))
  return (
    <FinishSwitch
      value={finish}
      onChange={(f) => {
        setFinish(f)
        applyFinish(f)
      }}
    />
  )
}

function RailDemo(): JSX.Element {
  const [finish, setFinish] = useState<Finish>('graphite')
  return (
    <div className="sys-stack">
      <SiteHeader finish={finish} onFinish={setFinish} current="#play" />
      <SiteFooter />
    </div>
  )
}

function SpecDemo(): JSX.Element {
  return <SpecList items={SPECS} />
}

function LinkDemo(): JSX.Element {
  return (
    <div className="sys-cells">
      <Cell caption="inline">
        <p className="pi-help">
          Want the details? <a href="#specs">Read the spec sheet</a>.
        </p>
      </Cell>
      <Cell caption="nav, current">
        <nav aria-label="Example" className="pi-nav">
          <ul className="pi-nav__list" style={{ position: 'static', visibility: 'visible', clipPath: 'none' }}>
            <li><a href="#play" aria-current="true">Play</a></li>
            <li><a href="#specs">Specs</a></li>
          </ul>
        </nav>
      </Cell>
    </div>
  )
}

function ButtonDemo(): JSX.Element {
  return (
    <div className="sys-cells">
      <Cell caption="primary (backlit key)">
        <ActionButton variant="primary" onAction={() => undefined}>Show all patches</ActionButton>
      </Cell>
      <Cell caption="secondary">
        <ActionButton variant="secondary" onAction={() => undefined}>Octave up</ActionButton>
      </Cell>
      <Cell caption="quiet">
        <button type="button" className="pi-quiet">Reset Cutoff</button>
      </Cell>
      <Cell caption="pressed (inverts)">
        <ActionButton variant="secondary" preview="pressed" onAction={() => undefined}>Sound off</ActionButton>
      </Cell>
    </div>
  )
}

const DEMO_BANKS = [
  { id: 'main', label: 'Main' },
  { id: 'voice', label: 'Voice' },
  { id: 'fx', label: 'Mod & FX' },
  { id: 'loop', label: 'Loop' },
] as const

function PageKeysDemo(): JSX.Element {
  const [bank, setBank] = useState<string>('main')
  return (
    <div className="sys-stack">
      <PageKeys keys={DEMO_BANKS} value={bank} onChange={setBank} idBase="sys-banks" label="Control banks" />
      {DEMO_BANKS.map((b) => {
        const ids = pageKeyIds('sys-banks', b.id)
        return (
          <div key={b.id} role="tabpanel" id={ids.panel} aria-labelledby={ids.tab} hidden={bank !== b.id} className="sys-note">
            The {b.label} bank: its controls sit here. Arrows move between the keys; the open bank's LED is lit.
          </div>
        )
      })}
    </div>
  )
}

function FaderDemo(): JSX.Element {
  const [a, setA] = useState(0.012)
  const [s, setS] = useState(0.6)
  return (
    <div className="sys-cells">
      <Cell caption="attack, log, 1 ms to 5 s">
        <Fader label="A" value={a} min={0.001} max={5} log defaultValue={0.012} format={fmt.ms} onChange={setA} />
      </Cell>
      <Cell caption="sustain, linear">
        <Fader label="S" value={s} min={0} max={1} defaultValue={0.6} format={fmt.pct} onChange={setS} />
      </Cell>
      <Cell caption="min">
        <Fader label="R" value={0.001} min={0.001} max={8} log defaultValue={0.8} format={fmt.ms} onChange={() => {}} />
      </Cell>
      <Cell caption="max">
        <Fader label="D" value={5} min={0.001} max={5} log defaultValue={0.34} format={fmt.ms} onChange={() => {}} />
      </Cell>
    </div>
  )
}

function StepLoopDemo({ autorun }: DemoProps): JSX.Element {
  return <StepLoop autoplay={autorun} />
}

export const INSTRUMENT_DEMOS: Readonly<Record<string, ComponentType<DemoProps>>> = {
  fader: FaderDemo,
  'page-keys': PageKeysDemo,
  'step-loop': StepLoopDemo,
  button: ButtonDemo,
  link: LinkDemo,
  knob: KnobDemo,
  keyboard: KeyboardDemo,
  waveform: WaveformDemo,
  'sound-switch': SoundSwitchDemo,
  led: LedDemo,
  oled: OledDemo,
  scope: ScopeDemo,
  envelope: EnvelopeDemo,
  'patch-list': PatchListDemo,
  'patch-name-field': FieldDemo,
  'finish-switch': FinishDemo,
  'site-rail': RailDemo,
  'spec-list': SpecDemo,
}
