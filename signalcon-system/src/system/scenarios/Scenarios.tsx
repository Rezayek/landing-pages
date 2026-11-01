/**
 * Scenarios: the system's components put together into the flows a real product has, so the whole loading → waiting
 * → result story can be seen and tuned before any real feature exists. Each one is driven by the /system toolbar:
 *
 *   latency   fast | slow | very slow | stalled | fail   (latency.ts)
 *   outcome   results | empty                            what a successful request returns
 *   network   online | offline                           offline rejects at once, like a dropped connection
 *
 * They follow guides/interaction.md and guides/content.md of the workflow: the indicator waits 400 ms and stays 500 ms
 * (usePending inside Region and ActionButton), the result appears in place, errors keep what was typed and say what
 * to do, toasts only for results the person cannot see, and every change is announced once.
 *
 * Phase 10 replaces the sample data with the product's own nouns and adds the product's real flows here: a scenario
 * per entry of the action inventories (UX.md) that is not covered yet. Each scenario root carries
 * `data-scenario="<id>"`, which is how capture scripts find it.
 */
import { useEffect, useId, useRef, useState, type ComponentType, type FormEvent, type JSX } from 'react'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  InlineMessage,
  Region,
  Skeleton,
  announce,
  toast,
} from '../feedback'
import { SimulatedFailure, isAbort, simulate, wait, type LatencyId } from '../latency'

export type Outcome = 'results' | 'empty'
export type Network = 'online' | 'offline'

export interface ScenarioProps {
  latency: LatencyId
  outcome: Outcome
  network: Network
}

export interface ScenarioEntry {
  readonly id: string
  readonly title: string
  readonly summary: string
  /** What the standard says should happen: the reviewer checks the screen against this. */
  readonly watch: string
}

/** Thrown when the network control is offline: the request never reaches the server. */
export class OfflineError extends Error {
  constructor() {
    super('You are offline.')
    this.name = 'OfflineError'
  }
}

/** A simulated request that respects all three controls. */
async function request<T>(props: ScenarioProps, results: T, empty: T, signal?: AbortSignal): Promise<T> {
  if (props.network === 'offline') {
    await wait(120, signal)
    throw new OfflineError()
  }
  return simulate(props.latency, props.outcome === 'empty' ? empty : results, signal)
}

function failureText(error: unknown, what: string): string {
  if (error instanceof OfflineError) return `You are offline, so ${what} did not happen. It will work again once you are back online.`
  if (error instanceof SimulatedFailure) return `${what[0].toUpperCase()}${what.slice(1)} did not work. Nothing was lost. Try again.`
  return `This took too long and was stopped. Try again.`
}

const PRODUCTS = ['Field notebook', 'Brass compass', 'Canvas tote', 'Enamel mug', 'Trail map set', 'Wool socks']

// ---------------------------------------------------------------------------------------------------------------
// 1. Search: skeleton on first load, results, no results with the query shown, failure with retry, offline
// ---------------------------------------------------------------------------------------------------------------
function SearchScenario(props: ScenarioProps): JSX.Element {
  const [query, setQuery] = useState('mug')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<string[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const controller = useRef<AbortController | null>(null)
  const fieldId = useId()

  async function run(signal?: AbortSignal): Promise<void> {
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    signal?.addEventListener('abort', () => own.abort(), { once: true })
    setBusy(true)
    setError(null)
    try {
      const term = query.trim().toLowerCase()
      const found = await request(props, PRODUCTS.filter((p) => p.toLowerCase().includes(term) || term === ''), [], own.signal)
      setResults(found)
      announce(found.length ? `${found.length} result${found.length === 1 ? '' : 's'} for “${query}”` : `No results for “${query}”`)
    } catch (failure) {
      if (!isAbort(failure)) setError(failure)
    } finally {
      if (controller.current === own) setBusy(false)
    }
  }

  useEffect(() => () => controller.current?.abort(), [])

  function onSubmit(event: FormEvent): void {
    event.preventDefault()
    void run()
  }

  return (
    <div className="sys-stack">
      <form role="search" onSubmit={onSubmit} className="sys-row-wrap">
        <div className="sys-field">
          <label htmlFor={fieldId}>Search products</label>
          <input id={fieldId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button type="submit" className="sys-btn">
          Search
        </button>
      </form>
      {error ? (
        <ErrorState title="Search did not finish" onRetry={(signal) => run(signal)} focusOnMount={false}>
          {failureText(error, 'the search')}
        </ErrorState>
      ) : (
        <Region
          label="results"
          busy={busy}
          hasContent={results !== null}
          minHeight="12rem"
          loadedMessage={undefined}
          fallback={
            <ul className="sys-list" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <li key={i}>
                  <Skeleton width="60%" />
                </li>
              ))}
            </ul>
          }
        >
          {results === null ? (
            <p className="sys-note">Press Search to run it with the current latency, outcome and network.</p>
          ) : results.length === 0 ? (
            <EmptyState kind="no-results" title="No products match" filters={[`“${query}”`]} headingLevel={4}>
              Check the spelling or search for something broader.
            </EmptyState>
          ) : (
            <ul className="sys-list">
              {results.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </Region>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 2. Sign in: validation on blur, an error summary on submit, the action's own states, the result in place
// ---------------------------------------------------------------------------------------------------------------
function SignInScenario(props: ScenarioProps): JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [submitted, setSubmitted] = useState(false)
  const [signedIn, setSignedIn] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const ids = { email: useId(), password: useId(), emailError: useId(), passwordError: useId(), summary: useId() }
  const summaryRef = useRef<HTMLDivElement>(null)

  const errors = {
    email: !email.trim() ? 'Enter your email address' : !/^\S+@\S+\.\S+$/.test(email) ? 'Enter an email address like name@example.com' : null,
    password: password.length < 8 ? 'Enter a password of at least 8 characters' : null,
  }
  const show = (field: 'email' | 'password'): string | null => (touched[field] || submitted ? errors[field] : null)
  const invalid = Object.values(errors).filter(Boolean)

  if (signedIn) {
    return (
      <div className="sys-stack">
        <InlineMessage tone="success" title="Signed in">
          Welcome back, {signedIn}.
        </InlineMessage>
        <button type="button" className="sys-btn" onClick={() => { setSignedIn(null); setSubmitted(false); setTouched({}) }}>
          Sign out
        </button>
      </div>
    )
  }

  return (
    <form className="sys-stack" noValidate onSubmit={(e) => e.preventDefault()}>
      {submitted && invalid.length > 1 ? (
        <div ref={summaryRef} tabIndex={-1} id={ids.summary}>
          <InlineMessage tone="error" title="Fix 2 problems to sign in">
            <ul>
              {errors.email ? <li><a href={`#${ids.email}`}>{errors.email}</a></li> : null}
              {errors.password ? <li><a href={`#${ids.password}`}>{errors.password}</a></li> : null}
            </ul>
          </InlineMessage>
        </div>
      ) : null}
      <div className="sys-field">
        <label htmlFor={ids.email}>Email</label>
        <input id={ids.email} type="email" autoComplete="email" value={email} aria-invalid={!!show('email')}
          aria-describedby={show('email') ? ids.emailError : undefined}
          onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} />
        {show('email') ? <p id={ids.emailError} className="sys-error">{show('email')}</p> : null}
      </div>
      <div className="sys-field">
        <label htmlFor={ids.password}>Password</label>
        <input id={ids.password} type="password" autoComplete="current-password" value={password} aria-invalid={!!show('password')}
          aria-describedby={show('password') ? ids.passwordError : undefined}
          onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))} />
        {show('password') ? <p id={ids.passwordError} className="sys-error">{show('password')}</p> : null}
      </div>
      <ActionButton
        type="submit"
        variant="primary"
        pendingLabel="Signing in…"
        successLabel="Signed in"
        slowLabel="Still signing in…"
        errorMessage={(e) => failureText(e, 'signing in')}
        onAction={async (signal) => {
          setSubmitted(true)
          setFailure(null)
          if (invalid.length) {
            // Not a failure of the request: focus the summary (2+ problems) or the first invalid field.
            requestAnimationFrame(() => (invalid.length > 1 ? summaryRef.current : document.getElementById(errors.email ? ids.email : ids.password))?.focus())
            throw Object.assign(new Error('invalid'), { name: 'ValidationError' })
          }
          await request(props, true, true, signal)
        }}
        onSuccess={() => setSignedIn(email)}
        onError={(e) => setFailure(e instanceof Error && e.name === 'ValidationError' ? null : failureText(e, 'signing in'))}
      >
        Sign in
      </ActionButton>
      {failure ? (
        <InlineMessage tone="error" title="Could not sign in">
          {failure}
        </InlineMessage>
      ) : null}
    </form>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 3. Optimistic toggle: flips at once, rolls back on failure with the reason next to it
// ---------------------------------------------------------------------------------------------------------------
function OptimisticScenario(props: ScenarioProps): JSX.Element {
  const [saved, setSaved] = useState(['Brass compass'])
  const [error, setError] = useState<{ item: string; text: string } | null>(null)

  async function toggle(item: string): Promise<void> {
    const before = saved
    const next = before.includes(item) ? before.filter((x) => x !== item) : [...before, item]
    setSaved(next) // optimistic: the person sees the result before the server answers
    setError(null)
    try {
      await request(props, true, true)
    } catch (failure) {
      setSaved(before) // roll back, and say so next to the thing that changed
      setError({ item, text: failureText(failure, before.includes(item) ? 'removing it' : 'saving it') })
      announce(`${item} was not ${before.includes(item) ? 'removed' : 'saved'}`, 'assertive')
    }
  }

  return (
    <ul className="sys-list">
      {PRODUCTS.slice(0, 4).map((item) => {
        const on = saved.includes(item)
        return (
          <li key={item} className="sys-stack">
            <div className="sys-row-wrap">
              <span>{item}</span>
              <button type="button" className="sys-btn" aria-pressed={on} onClick={() => void toggle(item)}>
                {on ? '★ Saved' : '☆ Save'}
              </button>
            </div>
            {error?.item === item ? (
              <InlineMessage tone="error" title="Not saved" onDismiss={() => setError(null)}>
                {error.text}
              </InlineMessage>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 4. Offline: a banner while offline, changes queued, synced when the network comes back
// ---------------------------------------------------------------------------------------------------------------
function OfflineScenario(props: ScenarioProps): JSX.Element {
  const [notes, setNotes] = useState<{ text: string; synced: boolean }[]>([{ text: 'Restock mugs', synced: true }])
  const [draft, setDraft] = useState('')
  const [syncing, setSyncing] = useState(false)
  const fieldId = useId()
  const queued = notes.filter((n) => !n.synced).length

  useEffect(() => {
    if (props.network !== 'online' || queued === 0) return
    const controller = new AbortController()
    setSyncing(true)
    simulate(props.latency === 'fail' ? 'slow' : props.latency, true, controller.signal)
      .then(() => {
        setNotes((all) => all.map((n) => ({ ...n, synced: true })))
        toast(`${queued} change${queued === 1 ? '' : 's'} synced`, { tone: 'success' })
      })
      .catch(() => {})
      .finally(() => setSyncing(false))
    return () => controller.abort()
  }, [props.network, props.latency, queued])

  return (
    <div className="sys-stack">
      {props.network === 'offline' ? (
        <InlineMessage tone="warning" title="You are offline" announceText="You are offline. Changes are kept and will sync when you are back.">
          You can keep working. Changes are kept on this device and sync when the connection is back.
        </InlineMessage>
      ) : null}
      <form className="sys-row-wrap" onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; setNotes((all) => [...all, { text: draft.trim(), synced: false }]); setDraft('') }}>
        <div className="sys-field">
          <label htmlFor={fieldId}>New note</label>
          <input id={fieldId} value={draft} onChange={(e) => setDraft(e.target.value)} />
        </div>
        <button type="submit" className="sys-btn">Add note</button>
      </form>
      <ul className="sys-list">
        {notes.map((n, i) => (
          <li key={i}>
            {n.text} <span className="sys-note">{n.synced ? '' : syncing ? '· syncing…' : '· waiting to sync'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 5. Live updates: new items arrive while the person reads; nothing moves until they ask
// ---------------------------------------------------------------------------------------------------------------
function LiveScenario(props: ScenarioProps): JSX.Element {
  const [items, setItems] = useState(['Order 1042 shipped', 'Order 1041 shipped', 'Order 1040 delivered'])
  const [pending, setPending] = useState<string[]>([])
  const next = useRef(1043)

  useEffect(() => {
    if (props.network === 'offline') return
    const timer = setInterval(() => {
      setPending((p) => [`Order ${next.current++} placed`, ...p])
    }, 4000)
    return () => clearInterval(timer)
  }, [props.network])

  function showNew(): void {
    setItems((all) => [...pending, ...all])
    announce(`${pending.length} new item${pending.length === 1 ? '' : 's'} shown`)
    setPending([])
  }

  return (
    <div className="sys-stack">
      {pending.length ? (
        <button type="button" className="sys-btn" onClick={showNew}>
          Show {pending.length} new
        </button>
      ) : (
        <p className="sys-note">{props.network === 'offline' ? 'Paused while offline.' : 'New items arrive every few seconds.'}</p>
      )}
      <ul className="sys-list">
        {items.slice(0, 6).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 6. First use: the empty state invites the first action; the result replaces it in the same space
// ---------------------------------------------------------------------------------------------------------------
function FirstUseScenario(props: ScenarioProps): JSX.Element {
  const [projects, setProjects] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const create = (
    <ActionButton
      variant="primary"
      pendingLabel="Creating…"
      successLabel="Created"
      errorMessage={(e) => failureText(e, 'creating the project')}
      onAction={async (signal) => {
        setError(null)
        await request(props, true, true, signal)
      }}
      onSuccess={() => setProjects((p) => [`Project ${p.length + 1}`, ...p])}
      onError={(e) => setError(failureText(e, 'creating the project'))}
    >
      {projects.length ? 'New project' : 'Create a project'}
    </ActionButton>
  )

  return (
    <div className="sys-stack" style={{ minHeight: '12rem' }}>
      {projects.length === 0 ? (
        <EmptyState kind="first-use" title="Start your first project" action={create} headingLevel={4}>
          Projects keep your pages, assets and notes together.
        </EmptyState>
      ) : (
        <>
          {create}
          <ul className="sys-list">
            {projects.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </>
      )}
      {error ? (
        <InlineMessage tone="error" title="Could not create the project">
          {error}
        </InlineMessage>
      ) : null}
      {projects.length ? (
        <button type="button" className="sys-btn" onClick={() => setProjects([])}>
          Reset to first use
        </button>
      ) : null}
    </div>
  )
}

export const SCENARIOS: readonly ScenarioEntry[] = [
  {
    id: 'search',
    title: 'Search',
    summary: 'A query, a results region, the no-results state with the query shown, a failed search with retry.',
    watch: 'Fast: results only. Slow: a skeleton at 400 ms. Empty: no-results naming the query. Fail or offline: the error replaces the region, with Try again.',
  },
  {
    id: 'sign-in',
    title: 'Sign in',
    summary: 'Validation on blur, an error summary when 2+ fields fail, the button’s own states, the result in place.',
    watch: 'Submit empty: the summary takes focus. One error: focus goes to the field. Fail: the reason under the button, nothing typed is lost. Success: the form becomes the signed-in state.',
  },
  {
    id: 'optimistic',
    title: 'Save for later (optimistic)',
    summary: 'The star flips at once; the server answers after.',
    watch: 'Any latency: the star changes instantly. Fail or offline: it flips back and the reason appears next to that item, announced once.',
  },
  {
    id: 'offline',
    title: 'Offline and sync',
    summary: 'Work continues offline; changes queue and sync when the network returns.',
    watch: 'Offline: a warning banner, new notes marked “waiting to sync”. Back online: “syncing…”, then one toast with the count.',
  },
  {
    id: 'live',
    title: 'Live updates',
    summary: 'New items arrive while the person reads.',
    watch: 'The list never moves on its own: a “Show N new” button collects arrivals; pressing it inserts them and announces the count.',
  },
  {
    id: 'first-use',
    title: 'First use',
    summary: 'An empty account: the empty state invites the first action.',
    watch: 'The empty state has one primary action. Its result replaces the empty state in the same space; a failure keeps the empty state and explains.',
  },
]

export const SCENARIO_DEMOS: Readonly<Record<string, ComponentType<ScenarioProps>>> = {
  search: SearchScenario,
  'sign-in': SignInScenario,
  optimistic: OptimisticScenario,
  offline: OfflineScenario,
  live: LiveScenario,
  'first-use': FirstUseScenario,
}
