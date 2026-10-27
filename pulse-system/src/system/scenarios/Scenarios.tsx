/**
 * Scenarios: PULSE-1's flows built from the system, so the whole loading → waiting → result story can be seen and
 * tuned before the landing exists. The rows are the action and wait inventory in COMPONENTS.md and INTERACTION.md.
 * Each is driven by the /system toolbar:
 *
 *   latency   fast | slow | very slow | stalled | fail   (latency.ts)
 *   outcome   results | empty                            what the patch bank returns
 *   network   online | offline                           offline rejects at once, like a dropped connection
 *
 * Opened with `?latency=<id>` (autorun), each scenario plays its story once as it scrolls into view, so a capture
 * shows every state without a click. More states are reachable from the URL:
 *
 *   ?field=empty | duplicate     Save your patch: the field errors instead of a save
 *   ?sound=no-device             Turn the sound on: the no-output error (latency fail gives the blocked browser)
 *   ?signal=clip | demo          Watch the level: the clip state, or a labelled demo signal where audio cannot run
 *   ?filter=fx                   Load a patch: start on the FX filter (no results)
 *   ?scenario=<id>               play only that scenario's story, so neighbours in the same row never interfere
 *
 * The bank is simulated (labelled so on the page); the sound engine is real Web Audio. Each scenario root carries
 * `data-scenario="<id>"`, which is how capture scripts find it.
 */
import { useEffect, useRef, useState, type ComponentType, type JSX, type RefObject } from 'react'
import { ActionButton, ErrorState, InlineMessage, announce, toast, useAnnouncements } from '../feedback'
import { SimulatedFailure, isAbort, simulate, wait, type LatencyId } from '../latency'
import {
  DEFAULT_PATCH,
  EnvelopeDisplay,
  Keyboard,
  Knob,
  Oled,
  PatchList,
  PatchListSkeleton,
  PatchNameField,
  Scope,
  SoundSwitch,
  WaveformSelector,
  engine,
  fmt,
  type BankFilter,
  type Patch,
  type PatchRow,
} from '../instrument'
import { SAMPLE_PATCHES } from '../instrument/demos'
import { FACTORY_PATCHES } from '../instrument/patches'

export type Outcome = 'results' | 'empty'
export type Network = 'online' | 'offline'

export interface ScenarioProps {
  latency: LatencyId
  outcome: Outcome
  network: Network
  /** /system opened with ?latency=: play the scenario's story once as it scrolls into view */
  autorun?: boolean
}

export interface ScenarioEntry {
  readonly id: string
  readonly title: string
  readonly summary: string
  /** What the standard says should happen: the reviewer checks the screen against this. */
  readonly watch: string
}

/** Thrown when the network control is offline: the request never reaches the bank. */
export class OfflineError extends Error {
  constructor() {
    super('You are offline.')
    this.name = 'OfflineError'
  }
}

async function request<T>(latency: LatencyId, network: Network, value: T, signal?: AbortSignal): Promise<T> {
  if (network === 'offline') {
    await wait(120, signal)
    throw new OfflineError()
  }
  return simulate(latency, value, signal)
}

const param = (name: string): string | null =>
  typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(name)

/**
 * Runs `story` once, the first time `ref` is half in view, when `enabled`. The guard is set inside the observer
 * callback, so StrictMode's double effect run cannot cancel it.
 */
function useStory(id: string, ref: RefObject<HTMLElement | null>, enabled: boolean | undefined, story: () => void): void {
  const only = param('scenario')
  if (only && only !== id) enabled = false
  const done = useRef(false)
  const latest = useRef(story)
  latest.current = story
  useEffect(() => {
    const el = ref.current
    if (!enabled || !el || done.current) return
    const io = new IntersectionObserver(
      (entries) => {
        if (done.current || !entries.some((e) => e.isIntersecting)) return
        done.current = true
        io.disconnect()
        latest.current()
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, enabled])
}

/** The patch values each sample patch carries: the factory bank (patches.ts). */
const PATCH_VALUES: Record<string, Partial<Patch>> = Object.fromEntries(FACTORY_PATCHES.map((f) => [f.id, f.patch]))

/** OLED line 2 holds 16 characters: short wave names keep the cutoff whole ("SAW 1.24 kHz"). */
const WAVE_SHORT: Record<Patch['wave'], string> = { sine: 'SIN', triangle: 'TRI', sawtooth: 'SAW', square: 'SQR' }

const SIM_NOTE = <p className="sys-note">The patch bank is simulated; the sound is real.</p>

/** What a screen reader heard since the page opened (the last three announcements), so a capture shows it. */
export function Heard(): JSX.Element {
  const { log } = useAnnouncements()
  const last = log.slice(0, 3)
  return (
    <p className="sys-meta" data-heard>
      <span className="sys-note__label">Screen reader heard</span>{' '}
      {last.length ? last.map((e) => `“${e.text}”${e.politeness === 'assertive' ? ' (assertive)' : ''}`).join(' · ') : 'nothing yet'}
    </p>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// 1. Turn the sound on: the one backlit key, its states and its errors
// -------------------------------------------------------------------------------------------------------------------
function SoundStartScenario(props: ScenarioProps): JSX.Element {
  const { status, patch } = engine.useEngine()
  const root = useRef<HTMLDivElement>(null)
  const key = useRef<HTMLButtonElement>(null)
  const failure = param('sound') === 'no-device' ? 'no-device' : props.latency === 'fail' ? 'blocked' : null
  useStory('sound-start', root, props.autorun, () => {
    void engine.stop().then(() => window.setTimeout(() => key.current?.click(), 300))
  })
  return (
    <div className="sys-stack" data-scenario="sound-start" ref={root}>
      <Oled
        line1={status === 'on' ? 'Sound on' : status === 'starting' ? 'Starting' : 'Sound off'}
        line2={status === 'on' ? `${WAVE_SHORT[patch.wave]} ${fmt.hz(patch.cutoff).shown}` : 'Press the key'}
        pending={status === 'starting'}
      />
      <SoundSwitch forceFailure={failure} buttonRef={key} />
      <Keyboard octaves={1} />
      <p className="sys-note">Starting the sound needs no network. Latency “fail” shows the blocked browser; ?sound=no-device the missing output.</p>
    </div>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// 2. Load a patch: the bank region, filters, a row that loads, no results, an empty bank, failures
// -------------------------------------------------------------------------------------------------------------------
function PatchLoadScenario(props: ScenarioProps): JSX.Element {
  const { patch } = engine.useEngine()
  const root = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<BankFilter>(() => (param('filter') === 'fx' ? 'fx' : 'all'))
  const [rows, setRows] = useState<readonly PatchRow[] | null>(null)
  const [bankError, setBankError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [spinner, setSpinner] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)
  const [gliding, setGliding] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const loadAfterFetch = useRef(false)

  async function fetchBank(f: BankFilter): Promise<void> {
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    setBusy(true)
    setBankError(false)
    setRows(null)
    try {
      const found = SAMPLE_PATCHES.filter((r) => f === 'all' || r.type === f)
      const result = await request(props.latency, props.network, props.outcome === 'empty' || f === 'fx' ? [] : found, own.signal)
      setRows(result)
      const label = f === 'all' ? 'patches' : `${f.toUpperCase()} patches`
      announce(result.length ? `${result.length} ${label}` : f === 'all' ? 'The bank is empty' : `No ${label} in this bank yet`)
      if (loadAfterFetch.current && result.length) {
        loadAfterFetch.current = false
        // as a keyboard user would: focus the first row, then load it; focus stays on the row
        window.setTimeout(() => {
          root.current?.querySelector<HTMLElement>('[role="option"]')?.focus()
          void load(result[0])
        }, 200)
      }
    } catch (e) {
      if (!isAbort(e)) setBankError(true)
    } finally {
      if (controller.current === own) setBusy(false)
    }
  }

  useEffect(() => {
    // first load waits for the story under autorun, so a capture sees the skeleton
    if (!props.autorun) void fetchBank(filter)
    return () => controller.current?.abort()
  }, [filter, props.latency, props.outcome, props.network]) // eslint-disable-line react-hooks/exhaustive-deps

  useStory('patch-load', root, props.autorun, () => {
    loadAfterFetch.current = true
    void fetchBank(filter)
  })

  async function load(row: PatchRow): Promise<void> {
    if (loading) return
    setLoading(row.id)
    setRowError(null)
    const t = window.setTimeout(() => setSpinner(row.id), 400)
    try {
      await request(props.latency, props.network, row)
      setGliding(true)
      engine.setPatch(PATCH_VALUES[row.id] ?? {})
      setSelected(row.id)
      announce(`${row.name} loaded`)
      window.setTimeout(() => setGliding(false), 260)
    } catch (e) {
      setRowError(
        e instanceof OfflineError
          ? `You're offline, so ${row.name} didn't load. Your current sound is untouched.`
          : e instanceof SimulatedFailure
            ? `The bank didn't answer, so ${row.name} didn't load. Your current sound is untouched.`
            : `The bank took too long to answer. Your current sound is untouched.`,
      )
    } finally {
      window.clearTimeout(t)
      setSpinner(null)
      setLoading(null)
    }
  }

  const current = SAMPLE_PATCHES.find((r) => r.id === selected)
  const emptyBank = rows !== null && rows.length === 0 && filter === 'all'
  const status = bankError ? (
    <ErrorState title="Couldn't load the patch bank" onRetry={() => fetchBank(filter)}>
      {props.network === 'offline' ? "You're offline. Your current sound is untouched." : "The bank didn't answer. Your current sound is untouched."}
    </ErrorState>
  ) : rows === null ? (
    <PatchListSkeleton />
  ) : rows.length === 0 ? (
    <div className="fb fb-state" data-kind={emptyBank ? 'first-use' : 'no-results'}>
      <p className="fb-state__title">{emptyBank ? 'The bank is empty' : `No ${filter.toUpperCase()} patches in this bank yet`}</p>
      <p className="fb-state__body">
        {emptyBank ? 'Turn a few knobs, then save the sound as your first patch.' : 'Try another type, or make the first one.'}
      </p>
      <div className="fb-state__actions">
        {emptyBank ? (
          <a className="fb fb-btn" data-variant="primary" href="#scenarios">
            Make the first patch
          </a>
        ) : (
          <button type="button" className="fb fb-btn" data-variant="primary" onClick={() => setFilter('all')}>
            Show all patches
          </button>
        )}
      </div>
    </div>
  ) : undefined

  return (
    <div className="sys-stack" data-scenario="patch-load" ref={root}>
      <div className="sys-row-wrap">
        <Oled
          line1={loading ? 'Loading' : (current?.name ?? 'Init patch')}
          line2={loading ? SAMPLE_PATCHES.find((r) => r.id === loading)?.name : current ? `Patch ${String(current.number).padStart(3, '0')}` : 'Pick a patch'}
          pending={!!loading}
          error={!!rowError}
        />
        <Knob label="Cutoff" value={patch.cutoff} min={40} max={12000} log defaultValue={1240} format={fmt.hz} gliding={gliding} onChange={(v) => engine.setPatch({ cutoff: v })} />
        <Knob label="Resonance" value={patch.resonance} min={0.1} max={18} defaultValue={4} format={fmt.q} gliding={gliding} onChange={(v) => engine.setPatch({ resonance: v })} />
      </div>
      {rowError ? (
        <InlineMessage
          tone="error"
          title="Patch didn't load"
          action={
            <button type="button" className="fb fb-btn" data-variant="secondary" onClick={() => setRowError(null)}>
              Dismiss
            </button>
          }
        >
          {rowError}
        </InlineMessage>
      ) : null}
      <PatchList filter={filter} onFilter={setFilter} rows={rows ?? []} selectedId={selected} loadingId={loading} spinnerId={spinner} onLoad={load} busy={busy} status={status} />
      {SIM_NOTE}
    </div>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// 3. Save your patch (optimistic): the row appears at once; a failure rolls back and returns the name
// -------------------------------------------------------------------------------------------------------------------
let nextNumber = 101

function PatchSaveScenario(props: ScenarioProps): JSX.Element {
  const root = useRef<HTMLDivElement>(null)
  const [name, setName] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [rows, setRows] = useState<PatchRow[]>([])
  const input = useRef<HTMLInputElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useStory('patch-save', root, props.autorun, () => {
    const mode = param('field')
    if (mode === 'duplicate') setRows([{ id: 'mine-old', number: 100, name: 'NIGHT BASS', type: 'bass', mine: true, status: 'saved' }])
    setName(mode === 'empty' ? '' : 'NIGHT BASS')
    window.setTimeout(() => button.current?.click(), 300)
  })

  async function save(): Promise<void> {
    const clean = name.trim()
    // every failure throws its own words, so the button announces exactly what the field shows
    const fail = (reason: string): never => {
      setFieldError(reason)
      input.current?.focus()
      throw new Error(reason)
    }
    if (!clean) fail('Name your patch to save it.')
    if (rows.some((r) => r.name.toLowerCase() === clean.toLowerCase())) fail(`You already have a patch called ${clean}. Try another name.`)
    setFieldError(null)
    const row: PatchRow = { id: `mine-${nextNumber}`, number: nextNumber++, name: clean, type: 'lead', mine: true, status: 'saving' }
    setRows((r) => [row, ...r]) // optimistic: the row is there at once
    setName('')
    try {
      await request(props.latency, props.network, true)
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status: 'saved' } : x)))
      announce(`${clean} saved`)
    } catch (e) {
      // roll back: the row leaves, the name returns to the field with the reason under it, focus goes to the field
      setRows((r) => r.filter((x) => x.id !== row.id))
      setName(clean)
      fail(
        e instanceof OfflineError
          ? `You're offline, so ${clean} wasn't saved. Your name is back in the box. Try again when you're online.`
          : `Couldn't save ${clean}: the bank didn't answer. Your name is back in the box. Try again.`,
      )
    }
  }

  return (
    <div className="sys-stack" data-scenario="patch-save" ref={root}>
      <PatchNameField
        value={name}
        onChange={(v) => {
          setName(v)
          if (fieldError) setFieldError(null)
        }}
        error={fieldError}
        inputRef={input}
      />
      <ActionButton ref={button} onAction={save} pendingLabel="Saving…" successLabel="Saved" successMessage={false} variant="primary" errorMessage={(e) => (e instanceof Error ? e.message : "Couldn't save the patch. Try again.")}>
        Save patch
      </ActionButton>
      {rows.length ? (
        <PatchList filter="mine" onFilter={() => {}} rows={rows} selectedId={null} loadingId={null} onLoad={() => {}} />
      ) : (
        <div className="fb fb-state" data-kind="first-use">
          <p className="fb-state__title">No saved patches yet</p>
          <p className="fb-state__body">Dial in something you like, then name it.</p>
          <div className="fb-state__actions">
            <button type="button" className="fb fb-btn" data-variant="secondary" onClick={() => input.current?.focus()}>
              Name this patch
            </button>
          </div>
        </div>
      )}
      {SIM_NOTE}
    </div>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// 4. Offline, then sync: patches queue on this device and sync when the network returns
// -------------------------------------------------------------------------------------------------------------------
function OfflineSyncScenario(props: ScenarioProps): JSX.Element {
  const root = useRef<HTMLDivElement>(null)
  // the story drives its own network: offline, two saves, then back online
  const [storyNet, setStoryNet] = useState<Network | null>(null)
  const network = storyNet ?? props.network
  const offline = network === 'offline'
  const [rows, setRows] = useState<PatchRow[]>([{ id: 'q1', number: 201, name: 'Late Pad', type: 'pad', mine: true, status: 'synced' }])
  const [name, setName] = useState('Wet Echo')
  const [failedNote, setFailedNote] = useState<string | null>(null)
  const wasOffline = useRef(offline)

  async function sync(ids: readonly string[]): Promise<void> {
    if (!ids.length) return
    setFailedNote(null)
    setRows((all) => all.map((r) => (ids.includes(r.id) ? { ...r, status: 'syncing' } : r)))
    // every queued patch syncs at once; the toast and the failure message wait for all of them
    const results = await Promise.allSettled(ids.map((id) => simulate(props.latency, id)))
    let synced = 0
    results.forEach((result, i) => {
      const id = ids[i]
      if (result.status === 'fulfilled') synced++
      setRows((all) => all.map((r) => (r.id === id ? { ...r, status: result.status === 'fulfilled' ? 'synced' : 'failed' } : r)))
    })
    if (synced) toast(`Back online. ${synced} patch${synced === 1 ? '' : 'es'} synced.`, { tone: 'success' })
    const failed = ids.length - synced
    if (failed) {
      const note = `${failed} patch${failed === 1 ? '' : 'es'} couldn't sync: the bank didn't answer. ${failed === 1 ? "It's" : "They're"} still on this device.`
      setFailedNote(note)
      announce(note, 'assertive')
    }
  }

  // Back online: sync every waiting row.
  useEffect(() => {
    const cameBack = wasOffline.current && !offline
    wasOffline.current = offline
    if (cameBack) void sync(rows.filter((r) => r.status === 'waiting' || r.status === 'failed').map((r) => r.id))
  }, [offline]) // eslint-disable-line react-hooks/exhaustive-deps

  useStory('offline-sync', root, props.autorun, () => {
    setStoryNet('offline')
    window.setTimeout(() => {
      add('Wet Echo', 'offline')
      add('Dust Pad', 'offline')
    }, 200)
    window.setTimeout(() => setStoryNet('online'), 1200)
  })

  function add(fixed?: string, net: Network = network): void {
    const clean = fixed ?? (name.trim() || 'Untitled')
    const row: PatchRow = { id: `q-${nextNumber}`, number: nextNumber++, name: clean, type: 'fx', mine: true, status: net === 'offline' ? 'waiting' : 'saving' }
    setRows((r) => [row, ...r])
    if (!fixed) setName('')
    if (net === 'offline') announce(`${clean} saved on this device. It will sync when you're back online.`)
    else void sync([row.id])
  }

  const failedIds = rows.filter((r) => r.status === 'failed').map((r) => r.id)

  return (
    <div className="sys-stack" data-scenario="offline-sync" ref={root}>
      {/* one slot holds all three messages stacked; only the current one shows, so the tallest sets the height and
          a change of state moves nothing */}
      <div className="sys-slot">
        <div data-on={offline || undefined} aria-hidden={!offline} inert={!offline}>
          <InlineMessage tone="warning" title="Offline">
            New patches stay on this device until you're back.
          </InlineMessage>
        </div>
        <div data-on={(!offline && !!failedNote) || undefined} aria-hidden={offline || !failedNote} inert={offline || !failedNote}>
          <InlineMessage
            tone="error"
            title="Sync didn't finish"
            action={
              <button type="button" className="fb fb-btn" data-variant="secondary" onClick={() => void sync(failedIds)}>
                Try again
              </button>
            }
          >
            {failedNote ?? "2 patches couldn't sync: the bank didn't answer. They're still on this device."}
          </InlineMessage>
        </div>
        <div data-on={(!offline && !failedNote) || undefined} aria-hidden={offline || !!failedNote} inert={offline || !!failedNote}>
          <InlineMessage tone="success" title="Online">
            Patches sync as you save them.
          </InlineMessage>
        </div>
      </div>
      <div className="sys-row-wrap">
        <PatchNameField value={name} onChange={setName} onEnter={() => add()} />
        <button type="button" className="fb fb-btn" data-variant="secondary" onClick={() => add()}>
          Save patch
        </button>
      </div>
      <PatchList
        filter="mine"
        onFilter={() => {}}
        rows={rows}
        selectedId={null}
        loadingId={null}
        onLoad={() => {}}
        dim={offline}
        rowAction={(row) =>
          row.status === 'failed' ? (
            <button type="button" className="pi-quiet" onClick={(e) => { e.stopPropagation(); void sync([row.id]) }}>
              Try again
            </button>
          ) : null
        }
      />
      <p className="sys-note">With autorun: offline, two saves, back online after 1.2 s. By hand: switch Network to Offline, save, switch back.</p>
    </div>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// 5. Watch the level (live updates): the real scope, the LFO and the clip state
// -------------------------------------------------------------------------------------------------------------------
function LiveMeterScenario(props: ScenarioProps): JSX.Element {
  const { patch, status } = engine.useEngine()
  const root = useRef<HTMLDivElement>(null)
  const signal = param('signal')
  const [clip, setClip] = useState(signal === 'clip')
  const [demo, setDemo] = useState(signal === 'demo')
  useStory('live-meter', root, props.autorun, () => {
    if (signal === 'demo' || signal === 'clip') return // a forced state: nothing to start
    void engine.start().then((result) => {
      if (result !== 'on') {
        setDemo(true) // no audio in this browser: show a labelled demo signal instead
        return
      }
      engine.noteOn(57)
      window.setTimeout(() => engine.noteOff(57), 6000)
    })
  })
  return (
    <div className="sys-stack" data-scenario="live-meter" ref={root}>
      <Scope variant="panel" demo={clip ? 'clip' : demo && (signal === 'demo' || status !== 'on') ? 'sine' : 'live'} />
      <div className="sys-row-wrap">
        <WaveformSelector value={patch.wave} onChange={(w) => engine.setPatch({ wave: w })} />
        <Knob label="LFO rate" value={patch.lfoRate} min={0.05} max={12} log defaultValue={0.8} format={(v) => ({ shown: `${v.toFixed(1)} Hz`, spoken: `${v.toFixed(1)} hertz` })} onChange={(v) => engine.setPatch({ lfoRate: v })} />
        <Knob label="LFO depth" value={patch.lfoDepth} min={0} max={1} defaultValue={0.2} format={fmt.pct} onChange={(v) => engine.setPatch({ lfoDepth: v })} />
        <Knob label="Volume" value={patch.volume} min={0} max={1} defaultValue={0.7} format={fmt.pct} onChange={(v) => engine.setPatch({ volume: v })} />
      </div>
      <Keyboard octaves={1} />
      <div className="sys-row-wrap">
        <button type="button" className="pi-quiet" aria-pressed={clip} onClick={() => setClip((c) => !c)}>
          Show the clip state
        </button>
      </div>
      <EnvelopeDisplay patch={patch} />
    </div>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// 6. First visit (first use): the scope poster, the hint, one backlit key; then the sound starts
// -------------------------------------------------------------------------------------------------------------------
function FirstSoundScenario(props: ScenarioProps): JSX.Element {
  const root = useRef<HTMLDivElement>(null)
  const key = useRef<HTMLButtonElement>(null)
  const [visit, setVisit] = useState(0)
  useStory('first-sound', root, props.autorun, () => {
    // a first visit starts with the sound off, whatever ran before; then the visitor presses the key
    void engine.stop().then(() => window.setTimeout(() => key.current?.click(), 1500))
  })
  return (
    <div className="sys-stack" data-scenario="first-sound" key={visit} ref={root}>
      <Scope variant="hero" />
      <SoundSwitch forceFailure={props.latency === 'fail' ? 'blocked' : null} buttonRef={key} />
      <div className="sys-row-wrap">
        <button
          type="button"
          className="pi-quiet"
          onClick={() => {
            void engine.stop()
            engine.setPatch(DEFAULT_PATCH)
            setVisit((v) => v + 1)
          }}
        >
          Reset to a first visit
        </button>
      </div>
    </div>
  )
}

export const SCENARIOS: readonly ScenarioEntry[] = [
  {
    id: 'sound-start',
    title: 'Turn the sound on',
    summary: 'The real Web Audio engine starting from the one backlit key, with the OLED and a playable octave.',
    watch: 'Fast: “Sound off” at once, LED on, “Sound on” announced. Fail: the key returns to “Turn the sound on” and the blocked-browser message sits under it with what to check. ?sound=no-device: the no-output message.',
  },
  {
    id: 'patch-load',
    title: 'Load a patch',
    summary: 'The bank region (skeleton, rows, an empty bank, no results for FX, failure with retry) and a row that loads into the knobs.',
    watch: 'Slow: vent-slot skeleton until the bank answers; the first row then loads with its spinner and the OLED steps “LOADING...”; knobs move in detents, focus stays on the row. Empty: “The bank is empty” with Make the first patch; the FX filter: “No FX patches…” with Show all patches. Fail or offline: the error with its cause and Try again, the current sound untouched.',
  },
  {
    id: 'patch-save',
    title: 'Save your patch (optimistic)',
    summary: 'The new row appears at once with a blinking LED; the server answers after.',
    watch: 'Any latency: the row is there instantly, “Saving”, then “Saved”. ?field=empty or duplicate: the field error under the field, focus in the field. Fail or offline: the row leaves, the name returns to the field with the reason under it and focus in it.',
  },
  {
    id: 'offline-sync',
    title: 'Offline, then sync',
    summary: 'Patches saved offline queue on this device and sync when the network returns.',
    watch: 'Offline: the warning banner, rows dimmed but readable, new rows “Waiting to sync”. Back online: “Syncing”, then “Synced” and one toast with the count. Fail: “Couldn’t sync” on the row with Try again, and a message with the cause above the list.',
  },
  {
    id: 'live-meter',
    title: 'Watch the level',
    summary: 'The live scope fed by the real analyser, the LFO, and the clip state.',
    watch: 'Sound on and a note held: the trace follows the audio, the LED blinks at the LFO rate, the readout gives the level. Nothing moves layout. Pause scope stops it. Clip (?signal=clip): the negative LED and the words, never colour alone. Where audio cannot run, a demo signal says so.',
  },
  {
    id: 'first-sound',
    title: 'First visit',
    summary: 'What a first visitor sees before any sound: the scope poster, the hint, one backlit key; then the sound starts.',
    watch: 'Everything readable without WebGL or sound. One primary key. The hint says what to do. After the sound starts, the hint goes and the scope goes live.',
  },
]

export const SCENARIO_DEMOS: Readonly<Record<string, ComponentType<ScenarioProps>>> = {
  'sound-start': SoundStartScenario,
  'patch-load': PatchLoadScenario,
  'patch-save': PatchSaveScenario,
  'offline-sync': OfflineSyncScenario,
  'live-meter': LiveMeterScenario,
  'first-sound': FirstSoundScenario,
}
