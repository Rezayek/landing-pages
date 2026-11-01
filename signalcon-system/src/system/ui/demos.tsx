/**
 * /system demos for the SIGNAL//CON components and the style's motion language (registry.ts lists them; SystemPage
 * draws them from UI_DEMOS). Every state a spec lists is shown side by side; effects replay on Play.
 */
import '@fontsource-variable/archivo/standard-italic.css'
import '@fontsource-variable/instrument-sans/index.css'
import '@fontsource-variable/martian-mono/index.css'
import { type ComponentType, type CSSProperties, type JSX, useEffect, useRef, useState } from 'react'
import { ActionButton, InlineMessage } from '../feedback'
import { type LatencyId, simulate } from '../latency'
import { flip, tuneIn } from '../vfx'
import { IconConcert, IconGame, IconPanel } from './icons'
import {
  Accordion,
  Button,
  ButtonLink,
  ChannelCard,
  Chips,
  CopyLink,
  SaveCard,
  Field,
  Mark,
  MotionSwitch,
  NoSignal,
  RadioCards,
  Screen,
  SectionHeader,
  SignalLost,
  Stepper,
  Sticker,
  StockGauge,
  Tabs,
  Tape,
  TicketStub,
  Wordmark,
} from './index'
import { Sheet } from './controls'

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }
const col: CSSProperties = { display: 'grid', gap: 'var(--space-4)' }
const cap: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 'var(--step--2)', color: 'var(--subtle)' }

function Labeled({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)', justifyItems: 'start' }}>
      {children}
      <span style={cap}>{label}</span>
    </div>
  )
}

function ButtonDemo(): JSX.Element {
  return (
    <div style={col}>
      <div style={row}>
        <Labeled label="primary · idle">
          <Button variant="primary">Pick your pass</Button>
        </Labeled>
        <Labeled label="secondary · idle">
          <Button variant="secondary">Switch to 3-Day</Button>
        </Labeled>
        <Labeled label="quiet">
          <Button variant="quiet">Change passes</Button>
        </Labeled>
        <Labeled label="disabled (aria-disabled + reason)">
          <Button variant="secondary" aria-disabled="true" aria-describedby="demo-why">
            One more pass
          </Button>
        </Labeled>
        <span id="demo-why" style={cap}>
          Up to 6 per order
        </span>
      </div>
      <div style={row}>
        <Labeled label="large link">
          <ButtonLink href="#" variant="primary" size="lg" onClick={(e) => e.preventDefault()}>
            Pick your pass
          </ButtonLink>
        </Labeled>
        <span style={cap}>hover, focus-visible (Tab to it) and pressed (hold the pointer: the squash) are live</span>
      </div>
    </div>
  )
}

function BrandDemo(): JSX.Element {
  return (
    <div style={row}>
      <Mark size={64} />
      <Mark size={16} />
      <Wordmark />
      <div data-band="paper" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-card)' }}>
        <Mark size={48} paper /> <Wordmark />
      </div>
    </div>
  )
}

function TapeDemo(): JSX.Element {
  return (
    <div style={row}>
      <Tape tone="acid" mono>
        Anime + games expo · 23–25 Jul 2027
      </Tape>
      <Tape tone="signal">On air</Tape>
      <Tape tone="paper" mono>
        Sample lineup
      </Tape>
      <Tape tone="night" tilt={3}>
        Held
      </Tape>
      <Sticker tone="acid" shape="burst">
        Best value
      </Sticker>
      <Sticker tone="signal">3 days!</Sticker>
    </div>
  )
}

function ScreenDemo(): JSX.Element {
  const [failed, setFailed] = useState(false)
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <Labeled label="populated, with caption">
        <Screen channel="CH 27" caption="CH 27 · Tuned in" style={{ inlineSize: '100%' }}>
          <img src="/signalcon-landing/art/keyart-640.webp" alt="" width={640} height={427} />
        </Screen>
      </Labeled>
      <Labeled label="loading (halftone skeleton)">
        <Screen channel="CH 28" busy style={{ inlineSize: '100%' }}>
          <div className="sg-halftone" style={{ position: 'absolute', inset: 0 }} />
        </Screen>
      </Labeled>
      <Labeled label="error-loading (signal lost)">
        <Screen channel="CH 29" style={{ inlineSize: '100%' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 'var(--space-3)' }}>
            {failed ? <SignalLost>The poster didn't load.</SignalLost> : <Button onClick={() => setFailed(true)}>Fail the image</Button>}
          </div>
        </Screen>
      </Labeled>
    </div>
  )
}

function SectionHeaderDemo(): JSX.Element {
  return (
    <div style={col}>
      <SectionHeader id="demo-sh" channel="CH04" title="Pick your" outlined="pass" sub="Prices include tax. Stock updates live (sample)." />
      <div data-band="paper" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-card)' }}>
        <SectionHeader id="demo-sh2" channel="CH03" title="The guide:" outlined="Fri 23 to Sun 25" sub="On a paper band." />
      </div>
    </div>
  )
}

function SignalStatesDemo(): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
      <NoSignal action={<Button>Show all of Friday</Button>}>No cosplay events on Friday. Cosplay runs Saturday and Sunday.</NoSignal>
      <SignalLost action={<Button>Try again</Button>}>The map didn't load. The address is below.</SignalLost>
    </div>
  )
}

function TabsDemo(): JSX.Element {
  const [v, setV] = useState('fri')
  return (
    <Tabs
      label="Day"
      value={v}
      onChange={setV}
      items={[
        { id: 'fri', label: 'Fri', sub: '23' },
        { id: 'sat', label: 'Sat', sub: '24' },
        { id: 'sun', label: 'Sun', sub: '25' },
      ]}
    >
      <p style={{ margin: 0 }}>Panel for {v}: switching plays the channel flip (static + RGB split, 240 ms).</p>
    </Tabs>
  )
}

function ChipsDemo(): JSX.Element {
  const [v, setV] = useState('all')
  return (
    <Chips
      label="Filter by kind"
      value={v}
      onChange={setV}
      items={[
        { id: 'all', label: 'All' },
        { id: 'concert', label: 'Concerts', icon: <IconConcert size={16} /> },
        { id: 'panel', label: 'Panels', icon: <IconPanel size={16} /> },
        { id: 'game', label: 'Game demos', icon: <IconGame size={16} /> },
      ]}
    />
  )
}

function GaugeDemo(): JSX.Element {
  const [left, setLeft] = useState(412)
  return (
    <div style={col}>
      <div style={row}>
        <Labeled label="plenty">
          <StockGauge left={1240} total={3000} />
        </Labeled>
        <Labeled label="selling fast">
          <StockGauge left={37} total={300} />
        </Labeled>
        <Labeled label="sold out">
          <StockGauge left={0} total={3000} />
        </Labeled>
      </div>
      <div style={row}>
        <StockGauge left={left} total={1500} />
        <Button onClick={() => setLeft((l) => (l > 60 ? 40 : l > 0 ? 0 : 412))}>Sell passes (drop)</Button>
      </div>
    </div>
  )
}

function RadioCardsDemo(): JSX.Element {
  const [v, setV] = useState('three')
  return (
    <RadioCards
      name="demo-tier"
      legend="Choose a pass"
      value={v}
      onChange={setV}
      items={[
        { id: 'day', name: '1-Day' },
        { id: 'three', name: '3-Day', featured: true },
        { id: 'vip', name: 'VIP', disabled: true, disabledReason: 'Sold out' },
      ]}
      render={(t) => <span style={{ fontWeight: 700 }}>{t.name}</span>}
    />
  )
}

function FieldsDemo(): JSX.Element {
  const [q, setQ] = useState('2')
  const [e, setE] = useState('kai@')
  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
      <Stepper label="How many passes" hint="Up to 6 per order" value={q} onChange={setQ} />
      <Stepper label="How many passes (error)" hint="Up to 6 per order" value="0" onChange={() => {}} error="Passes must be between 1 and 6" />
      <Field label="Tell me if Saturday passes come back" value={e} onChange={setE} error="Enter a full email address, like name@example.com" />
    </div>
  )
}

function StubDemo(): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <TicketStub summary="2 × 3-Day · €178" secondsLeft={598} note="Design study: checkout ends here." onRelease={() => {}} onHoldAgain={() => {}} />
      <TicketStub summary="2 × 3-Day · €178" secondsLeft={42} note="Ending soon state." onRelease={() => {}} onHoldAgain={() => {}} />
      <TicketStub summary="" secondsLeft={0} note="" onRelease={() => {}} onHoldAgain={() => {}} />
    </div>
  )
}

function ChannelCardDemo(): JSX.Element {
  const link = (ch: number): string => `${window.location.origin}/p/signalcon-landing#ch-${ch}`
  const art = (src: string | null): JSX.Element => (
    <Screen ratio="4 / 5" busy={src == null} style={{ inlineSize: '100%' }}>
      {src ? <img src={src} alt="" width={480} height={480} /> : <div className="sg-halftone" style={{ position: 'absolute', inset: 0 }} />}
    </Screen>
  )
  const when = { dates: '23–25.07.27', place: 'Relay Hall · Sample' }
  const save = (ch: number, tone: 'signal' | 'acid' | 'cyan', name: string, role: string, onAir: string, image: string) => ({
    spec: { channel: `CH ${ch}`, tone, image, onAir, name, role, ...when },
    filename: `signalcon-2027-ch${ch}-demo.png`,
  })
  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'start' }}>
      <Labeled label="signal tone · save and copy idle (live)">
        <div style={col}>
          <ChannelCard channel="CH 27" tone="signal" art={art('/signalcon-landing/art/guest-kite9.webp')} onAir="Fri 20:00" name="KITE//9" role="Electronic duo, Friday night headliner" {...when} />
          <SaveCard {...save(27, 'signal', 'KITE//9', 'Electronic duo, Friday night headliner', 'Fri 20:00', '/signalcon-landing/art/guest-kite9.webp')} />
          <CopyLink url={link(27)} hash="#ch-27" name="KITE//9" preview="idle" />
        </div>
      </Labeled>
      <Labeled label="acid tone · saved, copied">
        <div style={col}>
          <ChannelCard channel="CH 28" tone="acid" art={art('/signalcon-landing/art/guest-mireille.webp')} onAir="Sat 13:00" name="Mireille Okonkwo-Hayashi" role="Character designer" {...when} />
          <SaveCard {...save(28, 'acid', 'Mireille Okonkwo-Hayashi', 'Character designer', 'Sat 13:00', '/signalcon-landing/art/guest-mireille.webp')} preview="success" />
          <CopyLink url={link(28)} hash="#ch-28" name="Mireille Okonkwo-Hayashi" preview="success" />
        </div>
      </Labeled>
      <Labeled label="cyan tone · art loading · save failed, copy refused">
        <div style={col}>
          <ChannelCard channel="CH 29" tone="cyan" art={art(null)} onAir="Sat 16:30" name="Taro Venn" role="Voice actor" {...when} />
          <SaveCard {...save(29, 'cyan', 'Taro Venn', 'Voice actor', 'Sat 16:30', '/signalcon-landing/art/guest-taro.webp')} preview="error" />
          <CopyLink url={link(29)} hash="#ch-29" name="Taro Venn" preview="error" />
        </div>
      </Labeled>
    </div>
  )
}

function AccordionDemo(): JSX.Element {
  return (
    <Accordion
      items={[
        { q: 'Can I get a refund?', a: <p>Yes, in full, until 1 June 2027.</p> },
        { q: 'Can I leave and come back?', a: <p>Yes. Show your wristband to come back in.</p> },
      ]}
    />
  )
}

function SheetDemo(): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open the sheet</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Mireille Okonkwo-Hayashi">
        <p>Bottom sheet on phones, a centred dialog from 768 px. Esc, the close button or the scrim closes it.</p>
      </Sheet>
    </>
  )
}

function SwitchDemo(): JSX.Element {
  return <MotionSwitch />
}

/** The style's motion language: every treatment of MOTION-SYSTEM.md §Theme expression, replayable. */
function SignalEffectsDemo(): JSX.Element {
  const slam = useRef<HTMLDivElement>(null)
  const wipe = useRef<HTMLDivElement>(null)
  const scr = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const replay = (el: HTMLElement | null, attr: 'slam' | 'wipe'): void => {
    if (!el) return
    el.dataset[attr] = 'armed'
    void el.offsetWidth
    el.dataset[attr] = 'in'
  }
  const cell: CSSProperties = { display: 'grid', gap: 'var(--space-2)', justifyItems: 'start' }
  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <div style={cell}>
        <div ref={slam} data-slam="" style={{ '--slam-rot': '-3deg' } as CSSProperties}>
          <Tape tone="acid">Slam</Tape>
        </div>
        <Button onClick={() => replay(slam.current, 'slam')}>Play slam</Button>
        <span style={cap}>scroll reveal, success, stickers</span>
      </div>
      <div style={cell}>
        <div ref={wipe} data-wipe="" data-band="paper" style={{ '--wipe-color': 'var(--night-950)', position: 'relative', overflow: 'hidden', inlineSize: '100%', blockSize: 110, borderRadius: 'var(--radius-card)', display: 'grid', placeItems: 'center' } as CSSProperties}>
          New channel
        </div>
        <Button onClick={() => replay(wipe.current, 'wipe')}>Play wipe</Button>
        <span style={cap}>section transitions (fades under reduced motion)</span>
      </div>
      <div style={cell}>
        <Screen ref={scr} channel="CH 03" style={{ inlineSize: '100%' }}>
          <img src="/signalcon-landing/art/keyart-640.webp" alt="" width={640} height={427} />
          <canvas ref={canvas} style={{ position: 'absolute', inset: 0, inlineSize: '100%', blockSize: '100%', imageRendering: 'pixelated', opacity: 0 }} aria-hidden />
        </Screen>
        <div style={row}>
          <Button onClick={() => void flip(scr.current)}>Play flip</Button>
          <Button onClick={() => canvas.current && tuneIn(canvas.current)}>Play tune-in</Button>
        </div>
        <span style={cap}>tab switch, error, signature (none under reduced motion)</span>
      </div>
      <div style={cell}>
        <span className="sg-bars" style={{ fontSize: 32, color: 'var(--ink)' }}>
          <i />
          <i />
          <i />
          <i />
        </span>
        <div className="sg-halftone" style={{ inlineSize: 160, blockSize: 60, borderRadius: 'var(--radius-2)' }} />
        <span style={cap}>signal-bars loader · halftone skeleton (drift stops at 5 s)</span>
      </div>
    </div>
  )
}

export const UI_DEMOS: Readonly<Record<string, ComponentType>> = {
  brand: BrandDemo,
  button: ButtonDemo,
  tape: TapeDemo,
  screen: ScreenDemo,
  'section-header': SectionHeaderDemo,
  'signal-states': SignalStatesDemo,
  tabs: TabsDemo,
  chips: ChipsDemo,
  'stock-gauge': GaugeDemo,
  'radio-cards': RadioCardsDemo,
  fields: FieldsDemo,
  'ticket-stub': StubDemo,
  'channel-card': ChannelCardDemo,
  accordion: AccordionDemo,
  sheet: SheetDemo,
  'motion-switch': SwitchDemo,
  'signal-effects': SignalEffectsDemo,
}

/**
 * The hold sequence (registry SEQUENCES "hold"): the page's primary action with its pending, slow, failed and held
 * states, driven by the latency control. Runs once when it scrolls into view with ?latency=.
 */
export function HoldSequence({ latency, autorun }: { latency: LatencyId; autorun: boolean }): JSX.Element {
  const card = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const [held, setHeld] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!autorun || !card.current) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect()
        button.current?.click()
      }
    })
    io.observe(card.current)
    return () => io.disconnect()
  }, [autorun])
  return (
    <div ref={card} style={{ display: 'grid', gap: 'var(--space-4)', maxInlineSize: '32rem' }}>
      {held ? (
        <TicketStub
          summary="2 × 3-Day · €178"
          days="Fri 23 – Sun 25 Jul 2027"
          code="CH 04-327"
          secondsLeft={600}
          note="Design study: checkout ends here. Nothing was charged or sent."
          onRelease={() => setHeld(false)}
          onHoldAgain={() => setHeld(false)}
        />
      ) : (
        <>
          <ActionButton
            ref={button}
            variant="primary"
            onAction={(signal) => simulate(latency, true, signal)}
            pendingLabel="Holding your passes…"
            slowLabel="Still holding. Stay here."
            successMessage={false}
            errorMessage={() => "Couldn't hold your passes. Your picks are still here."}
            onError={() => setError("Couldn't hold your passes. Your picks are still here.")}
            onSuccess={() => {
              setError(null)
              setHeld(true)
            }}
            successHoldMs={0}
          >
            Hold 2 passes · €178
          </ActionButton>
          {error && (
            <InlineMessage tone="error" action={<Button variant="quiet" onClick={() => button.current?.click()}>Try again</Button>}>
              {error}
            </InlineMessage>
          )}
        </>
      )}
    </div>
  )
}
