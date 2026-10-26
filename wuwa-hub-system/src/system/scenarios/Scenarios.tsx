/**
 * Scenarios: Echo Atlas's real flows built from the system, so every wait, result and failure can be seen and tuned
 * before a feature exists (INTERACTION.md, Action table). Each is driven by the /system toolbar:
 *
 *   latency   fast | slow | very slow | stalled | fail   (latency.ts)
 *   outcome   results | empty                            what a successful request returns
 *   network   online | offline                           offline rejects at once (or queues, where the product queues)
 *
 * 1. Resonator search and filters      S1    filter bar, grid, no results with the filters echoed, retry
 * 2. Sign in, then save build          S2-S3 email code, optimistic save build with rollback
 * 3. Echo planner offline, then sync   S4    edits queue offline, sync on reconnect, milestone on the first full build
 *    (the echo planner celebration is the one milestone this product has; save build is the optimistic action)
 * 4. Live banner countdowns            S5    a banner ends, the next arrives in its slot, Live seconds
 * 5. First visit                       S6    first-use starting points, banners loading
 *
 * Sample data: names from public game knowledge, numbers invented (components/sample.ts). Each root carries
 * `data-scenario="<id>"` for the capture scripts.
 */
import { useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent, type JSX } from 'react'
import { ActionButton, EmptyState, ErrorState, InlineMessage, ProgressBar, Region, announce, toast } from '../feedback'
import { SimulatedFailure, isAbort, simulate, wait, type LatencyId } from '../latency'
import {
  Banner,
  BannerCard,
  BannerCardSkeleton,
  BuildPanel,
  Button,
  CodeInput,
  EchoSlot,
  Field,
  FilterBar,
  Icon,
  JINHSI_BUILD,
  KpiTile,
  NO_FILTERS,
  RESONATORS,
  ResonatorCard,
  ResonatorCardSkeleton,
  SAMPLE_BANNERS,
  SAMPLE_ECHOES,
  SAMPLE_NOTE,
  SectionTitle,
  StatusTag,
  TextInput,
  describeFilters,
  type BuildTab,
  type EchoSlotData,
  type Filters,
  type Resonator,
} from '../components'
import { ripple } from '../ea'
import { burst } from '../vfx'

export type Outcome = 'results' | 'empty'
export type Network = 'online' | 'offline'

export interface ScenarioProps {
  latency: LatencyId
  outcome: Outcome
  network: Network
  /** `?latency=` is in the URL: play the scenario's flow once when it scrolls into view, so a capture shows it. */
  autorun?: boolean
}

/** Runs `run` once, the first time `ref` is mostly in view, when `enabled`. */
function useScenarioAutorun(ref: React.RefObject<HTMLElement | null>, enabled: boolean | undefined, run: () => void): void {
  const latest = useRef(run)
  useEffect(() => {
    latest.current = run
  })
  useEffect(() => {
    const element = ref.current
    if (!enabled || !element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        latest.current()
      },
      { threshold: 0.3 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, enabled])
}

export interface ScenarioEntry {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly watch: string
}

export class OfflineError extends Error {
  constructor() {
    super("You're offline.")
    this.name = 'OfflineError'
  }
}

async function request<T>(props: ScenarioProps, results: T, empty: T, signal?: AbortSignal): Promise<T> {
  if (props.network === 'offline') {
    await wait(120, signal)
    throw new OfflineError()
  }
  return simulate(props.latency, props.outcome === 'empty' ? empty : results, signal)
}

// Retry from an ErrorState never passes its AbortSignal on: the request clears the error, the error state unmounts
// and its signal aborts the very request it started. The scenario's own controller cancels instead.

/**
 * CONTENT.md, Errors: one region-error template for every place: the cause, what to do, then what was kept
 * ("Your filters are kept."), so the scenarios read like the error patterns.
 */
function failureText(error: unknown, what: string, kept = ''): string {
  const tail = kept ? ` ${kept}` : ''
  if (error instanceof OfflineError) return `You're offline. ${what} will work again once you're back online.${tail}`
  if (error instanceof SimulatedFailure) return `Couldn't reach Echo Atlas. Check your connection and try again.${tail}`
  return `This is taking too long. Try again in a moment.${tail}`
}

// ---------------------------------------------------------------------------------------------------------------
// 1. Resonator search and filters
// ---------------------------------------------------------------------------------------------------------------
function matches(r: Resonator, f: Filters): boolean {
  return (
    (!f.elements.length || f.elements.includes(r.element)) &&
    (!f.weapons.length || f.weapons.includes(r.weapon)) &&
    (!f.rarities.length || f.rarities.includes(r.rarity))
  )
}

function ResonatorSearchScenario(props: ScenarioProps): JSX.Element {
  const [filters, setFilters] = useState<Filters>({ ...NO_FILTERS, elements: ['spectro'] })
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<readonly Resonator[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const controller = useRef<AbortController | null>(null)

  async function run(next: Filters, signal?: AbortSignal): Promise<void> {
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    signal?.addEventListener('abort', () => own.abort(), { once: true })
    setBusy(true)
    setError(null)
    try {
      const found = await request(props, RESONATORS.filter((r) => matches(r, next)), [], own.signal)
      setResults(found)
      announce(found.length ? `${found.length} ${found.length === 1 ? 'Resonator' : 'Resonators'}` : 'No Resonators')
    } catch (failure) {
      if (!isAbort(failure)) setError(failure)
    } finally {
      if (controller.current === own) setBusy(false)
    }
  }

  // Filters apply at once; the first load runs on mount, and again when the toolbar changes.
  const key = `${props.latency}|${props.outcome}|${props.network}`
  useEffect(() => {
    void run(filters)
    return () => controller.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  function change(next: Filters): void {
    setFilters(next)
    void run(next)
  }

  // Autorun: a person adds the Glacio filter (the grid stays, the count shows the wait, then the result lands).
  const root = useRef<HTMLDivElement>(null)
  useScenarioAutorun(root, props.autorun, () => change({ ...filters, elements: ['glacio'] }))

  return (
    <div ref={root} className="ea-ui" data-scenario="resonator-search" style={{ display: 'grid', gap: 'var(--gap-group)' }}>
      <SectionTitle aside={results ? `${RESONATORS.length} in the database` : undefined}>Resonators</SectionTitle>
      <FilterBar value={filters} onChange={change} count={busy && results === null ? null : (results?.length ?? null)} pending={busy} />
      {/* The error covers the grid in its own space; the last results keep the height underneath. */}
      <Region
          label="Resonators"
          busy={busy}
          hasContent={results !== null || error !== null}
          minHeight="16rem"
          cover={
            error ? (
              <ErrorState title="Couldn't load Resonators" onRetry={() => run(filters)} focusOnMount={false}>
                {failureText(error, 'Filtering', 'Your filters are kept.')}
              </ErrorState>
            ) : null
          }
          fallback={
            <ul className="ea-grid" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <li key={i}>
                  <ResonatorCardSkeleton />
                </li>
              ))}
            </ul>
          }
        >
          {results && results.length === 0 ? (
            <EmptyState
              kind="no-results"
              title="No Resonator matches"
              filters={describeFilters(filters)}
              action={
                <Button variant="secondary" onClick={() => change(NO_FILTERS)}>
                  Clear filters
                </Button>
              }
            >
              Nothing fits these filters. Try fewer filters.
            </EmptyState>
          ) : (
            <ul className="ea-grid">
              {(results ?? []).slice(0, 12).map((r, i) => (
                <li key={r.id} style={{ ['--i' as string]: i }}>
                  <ResonatorCard resonator={r} href={`#resonator-${r.id}`} />
                </li>
              ))}
            </ul>
          )}
        </Region>
      <p className="sys-note">{SAMPLE_NOTE}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 2. Sign in with an emailed code, then save build (optimistic, rolls back on failure)
// ---------------------------------------------------------------------------------------------------------------
/** The cause, what was kept, and the way out: the button stays live as Try again. */
function sendFailureText(error: unknown): string {
  if (error instanceof OfflineError) return "You're offline, so no code was sent. Your email is kept; send again once you're back."
  return "Couldn't reach Echo Atlas, so no code was sent. Your email is kept; press Send code to try again."
}

function SignInSaveScenario(props: ScenarioProps): JSX.Element {
  const [step, setStep] = useState<'email' | 'code' | 'in'>('email')
  const [email, setEmail] = useState('rover@example.com')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [codeState, setCodeState] = useState<'idle' | 'checking' | 'wrong'>('idle')
  const [saved, setSaved] = useState<'no' | 'yes' | 'saving'>('no')
  const [saveError, setSaveError] = useState<string | null>(null)
  // A failed send keeps the email and puts the cause beside the button (the button announces the same text).
  const [sendError, setSendError] = useState<string | null>(null)
  const codeTimer = useRef<AbortController | null>(null)
  const saveButton = useRef<HTMLDivElement>(null)

  async function sendCode(signal: AbortSignal): Promise<void> {
    setSendError(null)
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError(email ? 'Enter an email address like name@example.com' : 'Enter your email address')
      throw new Error('invalid')
    }
    setEmailError(null)
    await request(props, true, true, signal)
  }

  async function checkCode(value: string): Promise<void> {
    setCode(value)
    if (value.length < 6) return
    codeTimer.current?.abort()
    const own = new AbortController()
    codeTimer.current = own
    setCodeState('checking')
    try {
      await request(props, true, true, own.signal)
      if (value === '000000') throw new SimulatedFailure()
      setStep('in')
      announce('Signed in')
    } catch (failure) {
      if (!isAbort(failure)) setCodeState('wrong')
      return
    }
    setCodeState('idle')
  }

  // Optimistic save build: the mark shows at once (and the status tag reads "Saving" until the server confirms);
  // a failure rolls the mark back and puts the message beside the button.
  async function saveBuild(): Promise<void> {
    setSaveError(null)
    setSaved('saving')
    ripple(saveButton.current?.querySelector('button') ?? null)
    try {
      await request(props, true, true)
      setSaved('yes')
      announce('Build saved')
    } catch (failure) {
      setSaved('no')
      setSaveError(
        failure instanceof OfflineError
          ? "You're offline. Your build is still here and saves when you're back."
          : "Couldn't save your build. It's still in the editor. Try again.",
      )
    }
  }

  // Autorun: the person presses Send code, types the code from the email, then saves the build.
  const root = useRef<HTMLDivElement>(null)
  const auto = useRef(false)
  useScenarioAutorun(root, props.autorun, () => {
    auto.current = true
    root.current?.querySelector<HTMLButtonElement>('[data-autorun="send"]')?.click()
  })
  useEffect(() => {
    if (!auto.current) return
    if (step === 'code') {
      const timer = window.setTimeout(() => void checkCode('482193'), 500)
      return () => window.clearTimeout(timer)
    }
    if (step === 'in') {
      const timer = window.setTimeout(() => void saveBuild(), 500)
      return () => window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  return (
    <div ref={root} className="ea-ui" data-scenario="sign-in-save" style={{ display: 'grid', gap: 'var(--gap-group)', maxInlineSize: '30rem' }}>
      {step === 'email' ? (
        <form
          onSubmit={(event: FormEvent) => event.preventDefault()}
          style={{ display: 'grid', gap: 'var(--space-4)' }}
          aria-label="Sign in"
        >
          <SectionTitle level={3}>Sign in to save builds</SectionTitle>
          <Field label="Email address" hint="We'll send a 6-digit code. No password." message={emailError ? { tone: 'error', text: emailError } : null}>
            {(control) => <TextInput control={control} type="email" autoComplete="email" inputMode="email" value={email} onChange={setEmail} />}
          </Field>
          <span>
            <ActionButton
              data-autorun="send"
              variant="primary"
              pendingLabel="Sending code…"
              successLabel="Code sent"
              successMessage={`Code sent to ${email}`}
              errorLabel="Send code"
              errorMessage={(error) => (error instanceof Error && error.message === 'invalid' ? 'Check the email address' : sendFailureText(error))}
              onAction={sendCode}
              onError={(error) => setSendError(error instanceof Error && error.message === 'invalid' ? null : sendFailureText(error))}
              onDone={() => setStep('code')}
            >
              Send code
            </ActionButton>
          </span>
          {sendError ? (
            <InlineMessage tone="error" title="Code not sent">
              {sendError}
            </InlineMessage>
          ) : null}
        </form>
      ) : step === 'code' ? (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <SectionTitle level={3}>Check your email</SectionTitle>
          <InlineMessage tone="success" title="Code sent">
            Code sent to {email}. It works for 10 minutes.
          </InlineMessage>
          <CodeInput
            value={code}
            onChange={(value) => void checkCode(value)}
            pending={codeState === 'checking'}
            hint="From the email we sent. Paste works."
            message={codeState === 'wrong' ? { tone: 'error', text: 'That code is wrong or has expired. Send a new code.' } : null}
          />
          <span>
            <Button variant="quiet" onClick={() => setStep('email')}>
              Send a new code
            </Button>
          </span>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <SectionTitle level={3} aside={saved === 'yes' ? <StatusTag kind="saved">Saved</StatusTag> : saved === 'saving' ? <StatusTag kind="saving">Saving</StatusTag> : undefined}>
            Jinhsi main DPS
          </SectionTitle>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Signed in as {email}. Save the build to your account.</p>
          <div ref={saveButton} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Button variant="primary" icon={saved !== 'no' ? 'check' : undefined} onClick={() => void saveBuild()}>
              {saved !== 'no' ? 'Build saved' : 'Save build'}
            </Button>
            <Button variant="quiet" onClick={() => setStep('email')}>
              Sign out
            </Button>
          </div>
          {saveError ? (
            <InlineMessage tone="error" title="Not saved" action={<Button onClick={() => void saveBuild()}>Try again</Button>}>
              {saveError}
            </InlineMessage>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 3. Echo planner: edits while offline queue on the device; sync on reconnect; the first full build celebrates
// ---------------------------------------------------------------------------------------------------------------
const CANDIDATE: EchoSlotData = { cost: 1, name: 'Fission Junrock', set: 'Celestial Light', main: 'ATK 18.0%', subs: [['Crit DMG', '13.8%']] }

function EchoPlannerScenario(props: ScenarioProps): JSX.Element {
  const [slots, setSlots] = useState<readonly EchoSlotData[]>(SAMPLE_ECHOES)
  const [queue, setQueue] = useState(0)
  const [sync, setSync] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle')
  const [progress, setProgress] = useState(0)
  const [celebrated, setCelebrated] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  // The network control, or the autorun's own offline-then-online walk (it overrides the control until changed).
  const [netOverride, setNetOverride] = useState<Network | null>(null)
  useEffect(() => setNetOverride(null), [props.network])
  const network = netOverride ?? props.network
  // Read by edits fired from timers (the autorun), which would otherwise see the network of an earlier render.
  const networkNow = useRef(network)
  networkNow.current = network
  const [syncRound, setSyncRound] = useState(0)
  const filled = slots.filter((s) => s.name).length
  const critRate = useMemo(() => 5 + slots.reduce((sum, s) => sum + (s.subs.find(([k]) => k === 'Crit Rate') ? Number.parseFloat(s.subs.find(([k]) => k === 'Crit Rate')![1]) : 0), 0) * 2.1, [slots])
  const critDmg = useMemo(() => 150 + slots.reduce((sum, s) => sum + (s.subs.find(([k]) => k === 'Crit DMG') ? Number.parseFloat(s.subs.find(([k]) => k === 'Crit DMG')![1]) : 0), 0) + (slots[0].name ? 44 : 0), [slots])

  function edit(index: number): void {
    setSlots((current) => current.map((s, i) => (i === index ? (s.name ? { ...s, subs: [...s.subs, ['Crit Rate', '6.3%'] as const] } : CANDIDATE) : s)))
    if (networkNow.current === 'offline') setQueue((q) => q + 1)
    else announce('Echo updated')
  }
  function move(index: number, dir: -1 | 1): void {
    const target = index + dir
    if (target < 0 || target >= slots.length) return
    setSlots((current) => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  // The first full build (4-3-3-1-1) gets the one celebration this product has: once.
  useEffect(() => {
    if (filled === 5 && !celebrated) {
      setCelebrated(true)
      const button = root.current?.querySelector<HTMLElement>('[data-milestone]')
      ripple(button ?? null)
      const gold = getComputedStyle(document.documentElement)
      burst(button ?? null, { count: 12, colors: [gold.getPropertyValue('--accent').trim(), gold.getPropertyValue('--focus').trim()] })
      announce('First full build saved. 4-3-3-1-1, ready to farm.')
    }
  }, [filled, celebrated])

  // Reconnect: replay the queue in order with progress; failure keeps the changes on the device.
  useEffect(() => {
    if (network !== 'online' || queue === 0) return
    const own = new AbortController()
    void (async () => {
      setSync('syncing')
      setProgress(0)
      try {
        for (let i = 1; i <= queue; i++) {
          await simulate(props.latency, true, own.signal)
          setProgress(Math.round((i / queue) * 100))
        }
        setQueue(0)
        setSync('synced')
        announce(`${queue} ${queue === 1 ? 'change' : 'changes'} synced`)
        toast(`${queue} ${queue === 1 ? 'change' : 'changes'} synced`, { tone: 'success' })
      } catch (failure) {
        if (!isAbort(failure)) setSync('failed')
      }
    })()
    return () => own.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network, syncRound])

  // Autorun: go offline, edit two Echo slots (they wait on the device), come back online and watch the sync.
  useScenarioAutorun(root, props.autorun, () => {
    setNetOverride('offline')
    window.setTimeout(() => edit(0), 300)
    window.setTimeout(() => edit(1), 600)
    window.setTimeout(() => setNetOverride('online'), 1400)
  })

  const status =
    network === 'offline' ? (
      <StatusTag kind="offline">{`Offline · ${queue} ${queue === 1 ? 'change' : 'changes'} waiting`}</StatusTag>
    ) : sync === 'syncing' ? (
      <StatusTag kind="syncing">{`Syncing ${queue} ${queue === 1 ? 'change' : 'changes'}`}</StatusTag>
    ) : sync === 'failed' ? (
      <StatusTag kind="failed">Not synced</StatusTag>
    ) : sync === 'synced' ? (
      <StatusTag kind="synced">Synced</StatusTag>
    ) : undefined

  return (
    <div ref={root} className="ea-ui" data-scenario="echo-planner" data-density="compact" style={{ display: 'grid', gap: 'var(--gap-group)' }}>
      <div className="ea-bannerslot">
        {network === 'offline' ? (
          <Banner tone="warning">You're offline. Changes are kept on this device and sync when you're back.</Banner>
        ) : sync === 'failed' ? (
          <Banner tone="negative" urgent action={<Button onClick={() => setSyncRound((n) => n + 1)}>Retry now</Button>}>
            {queue} {queue === 1 ? "change couldn't" : "changes couldn't"} sync. They're kept on this device.
          </Banner>
        ) : (
          <p className="ea-bannerslot__quiet" style={{ margin: 0 }}>
            <Icon name="check" size="sm" />
            {sync === 'syncing' ? "Back online. Sending the changes kept on this device." : 'Online. Edits save to your account as you make them.'}
          </p>
        )}
      </div>
      <SectionTitle aside={status}>Echo planner · Jinhsi</SectionTitle>
      {sync === 'syncing' && queue > 3 ? <ProgressBar value={progress} label={`Syncing ${Math.round((progress / 100) * queue)} of ${queue} changes…`} /> : null}
      <div className="ea-kpis">
        <KpiTile label="Crit Rate" value={Math.round(critRate * 10) / 10} target={70} answer={critRate < 70} />
        <KpiTile label="Crit DMG" value={Math.round(critDmg * 10) / 10} target={200} />
        <KpiTile label="Energy Regen" value={filled ? 110 : null} target={120} />
      </div>
      <ul className="ea-slots">
        {slots.map((slot, i) => (
          <EchoSlot
            key={`${slot.cost}-${slot.name ?? i}`}
            slot={slot}
            index={i}
            syncing={network === 'offline' && queue > 0 && i === 4 ? 'waiting' : undefined}
            onEdit={() => edit(i)}
            onMove={(dir) => move(i, dir)}
          />
        ))}
      </ul>
      <span data-milestone="">
        <Button variant="primary" onClick={() => edit(slots.findIndex((s) => !s.name))} disabledReason={filled === 5 ? 'Every slot has an Echo.' : undefined}>
          Add the cost 1 Echo
        </Button>
      </span>
      {celebrated ? (
        <InlineMessage tone="success" title="First full build saved">
          4-3-3-1-1, ready to farm.
        </InlineMessage>
      ) : null}
      <p className="sys-note">Set Network to Offline, edit a slot, then back to Online to watch the sync. {SAMPLE_NOTE}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 4. Live banner countdowns: a banner ends, the next one arrives in the same slot
// ---------------------------------------------------------------------------------------------------------------
function LiveBannersScenario(props: ScenarioProps): JSX.Element {
  const [liveSeconds, setLiveSeconds] = useState(true)
  const [current, setCurrent] = useState(() => ({ ...SAMPLE_BANNERS[0], endsAt: Date.now() + SAMPLE_BANNERS[0].endsInMs }))
  const [ended, setEnded] = useState(false)
  const [next, setNext] = useState<'idle' | 'loading' | 'none' | 'error'>('idle')
  const [arriving, setArriving] = useState(false)

  async function loadNext(signal?: AbortSignal): Promise<void> {
    setNext('loading')
    try {
      const banner = await request(props, SAMPLE_BANNERS[1], null, signal)
      if (!banner) {
        setNext('none')
        return
      }
      setCurrent({ ...banner, endsAt: Date.now() + banner.endsInMs })
      setEnded(false)
      setArriving(true)
      setNext('idle')
      announce(`${current.title}'s banner ended. Next: ${banner.title}${banner.rerun ? ' rerun' : ''}, live now.`)
    } catch (failure) {
      if (!isAbort(failure)) setNext('error')
    }
  }

  // Autorun: the banner reaches its last second in view, ends in place, and the next one loads into the same slot.
  const root = useRef<HTMLDivElement>(null)
  useScenarioAutorun(root, props.autorun, () => {
    setArriving(false)
    setCurrent((c) => ({ ...c, endsAt: Date.now() + 1200 }))
  })

  return (
    <div ref={root} className="ea-ui" data-scenario="live-banners" style={{ display: 'grid', gap: 'var(--gap-group)' }}>
      <SectionTitle>Current banners</SectionTitle>
      <div style={{ minBlockSize: '18rem', display: 'grid' }}>
        {next === 'none' ? (
          <EmptyState kind="first-use" title="Next banners announced soon" action={<Button onClick={() => void loadNext()}>Check again</Button>}>
            The schedule for the next phase isn't out yet.
          </EmptyState>
        ) : next === 'error' ? (
          <ErrorState title="Couldn't load the next banner" onRetry={() => loadNext()} focusOnMount={false}>
            {failureText(new SimulatedFailure(), 'Loading')}
          </ErrorState>
        ) : (
          <BannerCard
            key={current.id}
            kind={current.kind}
            title={current.title}
            endsAt={current.endsAt}
            rerun={current.rerun}
            resonatorId={current.resonator}
            arriving={arriving}
            ended={ended}
            liveSeconds={liveSeconds}
            onLiveSecondsChange={setLiveSeconds}
            onEnd={() => {
              setEnded(true)
              void loadNext()
            }}
            action={
              <a className="ea-btn ea-frame ea-edge" data-variant="primary" href={`#resonator-${current.resonator ?? ''}`}>
                {ended ? "See what's next" : 'Open the build'}
              </a>
            }
          />
        )}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          onClick={() => {
            setArriving(false)
            setCurrent((c) => ({ ...c, endsAt: Date.now() + 5_000 }))
          }}
        >
          Skip to the last 5 seconds
        </Button>
        {next === 'loading' ? <StatusTag kind="syncing">Loading the next banner</StatusTag> : null}
      </div>
      <p className="sys-note">End times are sample values; the countdown and the absolute time use the sample server time (UTC+8).</p>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 5. First visit: three starting points over the resonance field; banners load in their own region
// ---------------------------------------------------------------------------------------------------------------
const twoBannerSkeletons = (
  <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
    <BannerCardSkeleton />
    <BannerCardSkeleton />
  </div>
)

function FirstVisitScenario(props: ScenarioProps): JSX.Element {
  const [busy, setBusy] = useState(true)
  const [banners, setBanners] = useState<readonly typeof SAMPLE_BANNERS[number][] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [round, setRound] = useState(0)

  async function load(signal?: AbortSignal): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      const found = await request(props, SAMPLE_BANNERS.slice(0, 2), [], signal)
      setBanners(found)
    } catch (failure) {
      if (!isAbort(failure)) setError(failure)
    } finally {
      setBusy(false)
    }
  }
  const key = `${props.latency}|${props.outcome}|${props.network}|${round}`
  useEffect(() => {
    const own = new AbortController()
    setBanners(null)
    void load(own.signal)
    return () => own.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const starts = [
    { title: 'Find a Resonator', body: 'Filter by element, weapon and rarity.', icon: 'resonators' as const },
    { title: 'Plan a build', body: 'Five Echoes, their stats against your targets.', icon: 'planner' as const },
    { title: 'See banners', body: "What's live now and when it ends.", icon: 'calendar' as const },
  ]
  // Autorun: the first visit replays when it scrolls into view (stagger, then the banners region waits and fills).
  const root = useRef<HTMLDivElement>(null)
  useScenarioAutorun(root, props.autorun, () => setRound((r) => r + 1))

  return (
    <div ref={root} className="ea-ui" data-scenario="first-visit" style={{ display: 'grid', gap: 'var(--gap-group)' }}>
      <section className="ea-frame" data-tone="outline" style={{ position: 'relative', display: 'grid', gap: 'var(--space-4)', padding: 'var(--space-6) var(--space-5)', overflow: 'hidden' }}>
        <span className="ea-field" data-shape="low" aria-hidden="true" />
        <SectionTitle level={2}>Start where you are</SectionTitle>
        <p style={{ margin: 0, color: 'var(--muted)', maxInlineSize: 'var(--measure)', position: 'relative' }}>
          Look up a Resonator, plan an Echo build or check this week's banners.
        </p>
        <ul key={round} className="ea-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(12rem, 100%), 1fr))', position: 'relative' }}>
          {starts.map((s, i) => (
            <li key={s.title} style={{ ['--i' as string]: i, animationDuration: 'var(--dur-scene)', animationTimingFunction: 'var(--ease-enter-emphasized)', animationDelay: `calc(${i} * var(--stagger-scene))` }}>
              <a className="ea-card ea-frame ea-edge" data-tone="raised" href={`#${s.icon}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                <strong>{s.title}</strong>
                <span style={{ color: 'var(--muted)', fontSize: 'var(--step--1)' }}>{s.body}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <SectionTitle level={3}>Live now</SectionTitle>
      {/* Two banner cards' worth of space from the first frame: skeleton, banners, empty and error all fill it. */}
      <Region
        label="banners"
        busy={busy}
        hasContent={banners !== null || error !== null}
        reserve={twoBannerSkeletons}
        fallback={twoBannerSkeletons}
        cover={
          error ? (
            <ErrorState title="Couldn't load banners" onRetry={() => load()} focusOnMount={false}>
              {failureText(error, 'Loading banners')}
            </ErrorState>
          ) : null
        }
      >
        {banners && banners.length === 0 ? (
          <EmptyState kind="first-use" title="Next banners announced soon">
            The schedule for the next phase isn't out yet.
          </EmptyState>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {(banners ?? []).map((b) => (
              <BannerCard key={b.id} size="compact" kind={b.kind} title={b.title} resonatorId={b.resonator} endsAt={Date.now() + b.endsInMs} rerun={b.rerun} liveSeconds={false} />
            ))}
          </div>
        )}
      </Region>
      <span>
        <Button variant="quiet" onClick={() => setRound((r) => r + 1)}>
          Replay first visit
        </Button>
      </span>
    </div>
  )
}


// ---------------------------------------------------------------------------------------------------------------
// 6. Open a Resonator build: the in-game Resonator menu; each tab loads at the chosen latency, fails in place
// ---------------------------------------------------------------------------------------------------------------
function ResonatorBuildScenario(props: ScenarioProps): JSX.Element {
  const [tab, setTab] = useState<BuildTab>('attributes')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const controller = useRef<AbortController | null>(null)

  /** Opens a tab; resolves true when it loaded. */
  async function open(next: BuildTab, signal?: AbortSignal): Promise<boolean> {
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    signal?.addEventListener('abort', () => own.abort(), { once: true })
    setTab(next)
    setError(null)
    setLoading(true)
    try {
      await request(props, true, true, own.signal)
      return true
    } catch (failure) {
      if (!isAbort(failure)) setError(failure)
      return false
    } finally {
      if (controller.current === own) setLoading(false)
    }
  }
  useEffect(() => () => controller.current?.abort(), [])

  // Autorun: the person opens Weapon, then Echo, then Forte, each once the last one has shown; like a person, it stops
  // at a failure, so the error stays on screen.
  const root = useRef<HTMLDivElement>(null)
  useScenarioAutorun(root, props.autorun, () => {
    void (async () => {
      for (const next of ['weapon', 'echo', 'forte'] as const) {
        if (!(await open(next))) return
        await wait(700)
      }
    })()
  })

  return (
    <div ref={root} className="ea-ui" data-scenario="resonator-build" style={{ display: 'grid', gap: 'var(--gap-group)' }}>
      <SectionTitle aside="Sample build">Jinhsi</SectionTitle>
      <BuildPanel
        build={JINHSI_BUILD}
        tab={tab}
        onTab={(next) => void open(next)}
        loading={loading}
        error={
          error ? (
            <ErrorState
              title="Couldn't load this tab"
              onRetry={() => {
                // The error (and its button) goes when the retry starts: focus the panel, which then loads in place.
                // No ErrorState signal: it aborts when the error state unmounts, which is at once.
                root.current?.querySelector<HTMLElement>('[role="tabpanel"]')?.focus()
                return open(tab)
              }}
              focusOnMount={false}
            >
              {failureText(error, 'Loading the build', 'The other tabs still work.')}
            </ErrorState>
          ) : undefined
        }
      />
      <p className="sys-note">In-game icons are local copies credited in public/game/CREDITS.md; numbers and descriptions are sample text.</p>
    </div>
  )
}
export const SCENARIOS: readonly ScenarioEntry[] = [
  {
    id: 'resonator-search',
    title: 'Filter Resonators',
    summary: 'Element, weapon and rarity filters over the database grid. Filters apply at once; the count is announced.',
    watch:
      'Fast: the grid swaps with no indicator. Slow: the count shows a waveform, then the grid. Empty outcome: "No Resonator matches" with the filters echoed and Clear filters. Fail or offline: the error with Try again, filters kept.',
  },
  {
    id: 'sign-in-save',
    title: 'Sign in, then save build',
    summary: 'Email code sign-in (no password), then an optimistic save build that rolls back on failure.',
    watch:
      'Send code: pending in the button, then the code step. Type 000000 as the code to see a wrong code: it says so under the field. Save build: the mark shows at once; on fail it returns, the build stays, and the message sits beside the button with Try again.',
  },
  {
    id: 'echo-planner',
    title: 'Echo planner offline, then sync',
    summary: 'Edit Echo slots while offline: changes wait on the device. Back online they sync in order. The first full build celebrates once.',
    watch:
      'Offline: the warning banner and "Offline · n changes waiting". Online: "Syncing", a progress bar past three changes, then "Synced" and a toast. Fail: the banner with Retry now; nothing is lost. Fill the last slot: one ripple and a small gold burst, once.',
  },
  {
    id: 'live-banners',
    title: 'Live banner countdowns',
    summary: 'A countdown on the night band. Skip to its last seconds: it ends in place and the next banner arrives in the same slot.',
    watch:
      'At zero: "Ended", then the next banner fades in with the field drifting once and a light pass. Empty outcome: "Next banners announced soon". Fail: the error with Try again. Live seconds off: minutes only. Nothing moves the layout.',
  },
  {
    id: 'first-visit',
    title: 'First visit',
    summary: 'Three starting points over the resonance field; the banners load in their own region.',
    watch:
      'The starting points rise in with the scene stagger (all at once under reduced motion). Banners: skeleton after the delay, then compact cards; empty and failed variants keep the space.',
  },
  {
    id: 'resonator-build',
    title: 'Open a Resonator build',
    summary: "The in-game Resonator menu: Attributes, Weapon, Echo, Resonance Chain, Forte. Each tab loads at the chosen latency.",
    watch:
      'Fast: the tab swaps with no indicator. Slow: the panel shows "Loading weapon…" with the waveform after the delay, then the tab. Fail or offline: the error in the panel with Try again; the tab column stays usable.',
  },
]

export const SCENARIO_DEMOS: Readonly<Record<string, ComponentType<ScenarioProps>>> = {
  'resonator-search': ResonatorSearchScenario,
  'sign-in-save': SignInSaveScenario,
  'echo-planner': EchoPlannerScenario,
  'live-banners': LiveBannersScenario,
  'first-visit': FirstVisitScenario,
  'resonator-build': ResonatorBuildScenario,
}
