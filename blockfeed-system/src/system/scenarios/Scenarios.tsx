/**
 * Scenarios: Blockfeed's main actions put together from the system's components, so the whole loading → waiting →
 * result story of each can be seen and tuned before any real feature exists. Each one is driven by the /system
 * toolbar:
 *
 *   latency   fast | slow | very slow | stalled | fail   (latency.ts)
 *   outcome   results | empty                            what a successful request returns
 *   network   online | offline                           offline rejects at once, like a dropped connection
 *
 * One scenario per row of the action table in INTERACTION.md, with the words from CONTENT.md. The data is invented
 * (social/fixtures.ts). Each scenario root carries `data-scenario="<id>"`, which is how capture scripts find it.
 */
import { useEffect, useId, useRef, useState, type ComponentType, type FormEvent, type JSX } from 'react'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  InlineMessage,
  ProgressBar,
  Region,
  Skeleton,
  announce,
  toast,
} from '../feedback'
import { SimulatedFailure, isAbort, simulate, wait, type LatencyId } from '../latency'
import { Button, RadioGroup, SearchField, Tag, TextField, XpBar } from '../ui'
import {
  BUILDS,
  CHALLENGE,
  COMMENTS,
  EVENTS,
  ME,
  NOTIFICATIONS,
  PLAYERS,
  REPORTS,
  SERVERS,
  THREADS,
  type Build,
  type CommentItem,
  type Message,
  type Notification,
} from '../social/fixtures'
import {
  DEFAULT_PREFERENCES,
  NO_FILTERS,
  Bell,
  BuildCard,
  ChallengeCard,
  ChatLog,
  Comment,
  CommentComposer,
  FollowButton,
  Gallery,
  MessageComposer,
  NotificationList,
  PlayerRow,
  QueueRow,
  ReportDialog,
  ResultGroup,
  ServerFilterBar,
  ServerRow,
  SettingsPanel,
  filterServers,
  type Preferences,
  type QueueAction,
  type QueueStatus,
  type ServerFilters,
} from '../social'
import { pickup, play, xp } from '../vfx'

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
    super('Not connected.')
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

/** The reason under a failure whose title already says "Could not …": what to do, said once. */
function reasonText(error: unknown): string {
  if (error instanceof OfflineError) return "You're not connected. Check your connection and try again."
  if (error instanceof SimulatedFailure) return "It's on our side. Try again in a moment."
  return 'That took too long. Try again.'
}

/** The words for a failed request (CONTENT.md, Errors). `what` reads as "Could not <what>". */
function failureText(error: unknown, what: string): string {
  if (error instanceof OfflineError) return `You're not connected, so we could not ${what}. Check your connection and try again.`
  if (error instanceof SimulatedFailure) return `Could not ${what}. It's on our side. Try again in a moment.`
  return 'That took too long. Try again.'
}

/** One request in flight per scenario: a new run cancels the last, unmount cancels everything. */
function useRequests(): (run: (signal: AbortSignal) => Promise<void>) => Promise<void> {
  const current = useRef<AbortController | null>(null)
  useEffect(() => () => current.current?.abort(), [])
  return async (run) => {
    current.current?.abort()
    const own = new AbortController()
    current.current = own
    try {
      await run(own.signal)
    } catch (failure) {
      if (!isAbort(failure)) throw failure
    }
  }
}

const BUILD = BUILDS[0]
const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`

// ---------------------------------------------------------------------------------------------------------------
// search: skeleton on first load, old results dimmed on a new search, no results with the query, failure, offline
// ---------------------------------------------------------------------------------------------------------------
function SearchScenario(props: ScenarioProps): JSX.Element {
  const [query, setQuery] = useState('tower')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<Build[] | null>(null)
  const [searched, setSearched] = useState('')
  const [error, setError] = useState<unknown>(null)
  const requests = useRequests()

  function run(): Promise<void> {
    setBusy(true)
    setError(null)
    const term = query.trim().toLowerCase()
    return requests(async (signal) => {
      try {
        const match = BUILDS.filter((b) => !term || b.title.toLowerCase().includes(term) || b.tags.some((t) => t.includes(term)))
        const found = await request(props, match, [], signal)
        setResults(found)
        setSearched(query.trim())
        announce(found.length ? `${plural(found.length, 'build')} for '${query.trim()}'` : `No builds for '${query.trim()}'`)
      } catch (failure) {
        if (!isAbort(failure)) setError(failure)
        throw failure
      } finally {
        setBusy(false)
      }
    }).catch(() => {})
  }

  function onSubmit(event: FormEvent): void {
    event.preventDefault()
    void run()
  }

  return (
    <div className="sys-stack">
      <form onSubmit={onSubmit} className="sys-row" role="search">
        <SearchField label="Search builds" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>
      {error ? (
        <ErrorState title="Could not search builds" onRetry={() => run()}>
          {reasonText(error)}
        </ErrorState>
      ) : (
        <Region
          label="Search results"
          busy={busy}
          hasContent={results !== null}
          minHeight="10rem"
          fallback={
            <div className="sys-stack">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rect" height="calc(var(--u) * 14)" />
              ))}
            </div>
          }
        >
          {results === null ? (
            <p className="sys-note">Search for a build by title or tag: try "tower" or "ocean".</p>
          ) : results.length ? (
            <ResultGroup title="Builds" count={results.length}>
              <ul className="sys-list">
                {results.map((b) => (
                  <li key={b.id}>
                    <span className="sys-strong">{b.title}</span> <span className="sys-note">by {b.author} · {b.tags.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </ResultGroup>
          ) : (
            <EmptyState
              kind="no-results"
              title={`No builds for '${searched}'`}
              filters={[`"${searched}"`]}
              action={
                <Button onClick={() => setQuery('')}>Clear search</Button>
              }
            >
              Try fewer words, or a tag like "survival".
            </EmptyState>
          )}
        </Region>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// sign-in: validation on leaving a field, a summary for 2+ errors, the button's own states, the result in place
// ---------------------------------------------------------------------------------------------------------------
function SignInScenario(props: ScenarioProps): JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const summary = useRef<HTMLDivElement>(null)
  const emailId = useId()

  function check(): { email?: string; password?: string } {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) next.email = 'Enter your email'
    else if (!email.includes('@')) next.email = 'Enter an email like name@example.com'
    if (!password) next.password = 'Enter your password'
    return next
  }

  async function submit(signal: AbortSignal): Promise<void> {
    const found = check()
    setErrors(found)
    setFormError(null)
    const count = Object.keys(found).length
    if (count >= 2) {
      requestAnimationFrame(() => summary.current?.focus())
      return
    }
    if (count === 1) {
      requestAnimationFrame(() => document.getElementById(found.email ? emailId : `${emailId}-pw`)?.focus())
      return
    }
    try {
      await request(props, true, true, signal)
      setSignedIn(true)
      announce(`Signed in as ${ME.name}`)
    } catch (failure) {
      if (!isAbort(failure)) setFormError(failureText(failure, 'sign you in'))
      throw failure
    }
  }

  if (signedIn) {
    return (
      <div className="sys-stack">
        <InlineMessage tone="success" title={`Signed in as ${ME.name}`}>
          Your feed is ready.
        </InlineMessage>
        <Button onClick={() => setSignedIn(false)}>Sign out</Button>
      </div>
    )
  }

  const errorCount = Object.keys(errors).length
  return (
    <form className="sys-stack" noValidate onSubmit={(e) => e.preventDefault()}>
      {errorCount >= 2 ? (
        <div ref={summary} tabIndex={-1}>
          <InlineMessage tone="error" title={`Fix ${errorCount} things to sign in`}>
            <ul className="sys-list">
              {errors.email ? <li>{errors.email}</li> : null}
              {errors.password ? <li>{errors.password}</li> : null}
            </ul>
          </InlineMessage>
        </div>
      ) : null}
      <TextField
        id={emailId}
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => email && setErrors((prev) => ({ ...prev, email: check().email }))}
      />
      <TextField
        id={`${emailId}-pw`}
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        error={errors.password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <ActionButton variant="primary" onAction={submit} pendingLabel="Signing in…" successLabel="Signed in">
        Sign in
      </ActionButton>
      {formError ? <InlineMessage tone="error">{formError}</InlineMessage> : null}
    </form>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// like-save: optimistic; pop on like, pickup to Saved builds; a failure flips back, shakes and says why
// ---------------------------------------------------------------------------------------------------------------
function LikeSaveScenario(props: ScenarioProps): JSX.Element {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedCount, setSavedCount] = useState(4)
  const [problem, setProblem] = useState<string | null>(null)
  const [retry, setRetry] = useState<(() => void) | null>(null)
  const card = useRef<HTMLDivElement>(null)
  const shelf = useRef<HTMLSpanElement>(null)
  const requests = useRequests()

  const likeButton = (): HTMLElement | null => card.current?.querySelector<HTMLElement>('[data-fx="like"]') ?? null
  const saveButton = (): HTMLElement | null => card.current?.querySelector<HTMLElement>('.bf-card__actions button[aria-pressed]:not([data-fx="like"])') ?? null

  function toggleLike(): void {
    const next = !liked
    setLiked(next)
    setProblem(null)
    if (next) void play(likeButton(), 'pop')
    void requests(async (signal) => {
      try {
        await request(props, true, true, signal)
      } catch (failure) {
        if (isAbort(failure)) throw failure
        setLiked(!next)
        void play(likeButton(), 'shake')
        setProblem(failureText(failure, next ? 'like this build' : 'remove your like'))
        setRetry(() => toggleLike)
      }
    })
  }

  function toggleSave(): void {
    const next = !saved
    setSaved(next)
    setSavedCount((n) => n + (next ? 1 : -1))
    setProblem(null)
    if (next) {
      void pickup(saveButton()?.querySelector<HTMLElement>('.bf-icon') ?? saveButton(), shelf.current)
      announce('Added to Saved builds')
    } else {
      toast('Removed from saved', {
        action: {
          label: 'Undo',
          onClick: () => {
            setSaved(true)
            setSavedCount((n) => n + 1)
          },
        },
      })
    }
    void requests(async (signal) => {
      try {
        await request(props, true, true, signal)
      } catch (failure) {
        if (isAbort(failure)) throw failure
        setSaved(!next)
        setSavedCount((n) => n + (next ? -1 : 1))
        void play(saveButton(), 'shake')
        setProblem(failureText(failure, next ? 'save this build' : 'remove it from saved'))
        setRetry(() => toggleSave)
      }
    })
  }

  return (
    <div className="sys-stack">
      <div className="sys-row">
        <span ref={shelf} className="sys-effect-dest">
          Saved builds · <span className="bf-num">{savedCount}</span>
        </span>
      </div>
      <div ref={card}>
        <BuildCard build={BUILD} liked={liked} saved={saved} onLike={toggleLike} onSave={toggleSave} />
      </div>
      {problem ? (
        <InlineMessage
          tone="error"
          onDismiss={() => setProblem(null)}
          action={
            retry ? (
              <Button size="sm" onClick={() => retry()}>
                Try again
              </Button>
            ) : undefined
          }
        >
          {problem}
        </InlineMessage>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// follow: optimistic; the follower count rises and pops; a failure returns the button and explains
// ---------------------------------------------------------------------------------------------------------------
function FollowScenario(props: ScenarioProps): JSX.Element {
  const player = PLAYERS[0]
  const [following, setFollowing] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const count = useRef<HTMLSpanElement>(null)
  const requests = useRequests()

  function toggle(): void {
    const next = !following
    setFollowing(next)
    setProblem(null)
    if (next) {
      void play(count.current, 'pop')
      announce(`Following ${player.name}`)
    }
    void requests(async (signal) => {
      try {
        await request(props, true, true, signal)
      } catch (failure) {
        if (isAbort(failure)) throw failure
        setFollowing(!next)
        setProblem(failureText(failure, `${next ? 'follow' : 'unfollow'} ${player.name}`))
      }
    })
  }

  return (
    <div className="sys-stack">
      <PlayerRow player={player} action={<FollowButton name={player.name} following={following} onToggle={toggle} />} />
      <p className="sys-note">
        Followers:{' '}
        <span ref={count} className="bf-num sys-strong" style={{ display: 'inline-block' }}>
          {(player.followers + (following ? 1 : 0)).toLocaleString()}
        </span>
      </p>
      {problem ? <InlineMessage tone="error">{problem}</InlineMessage> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// post-build: validation, then the experience bar with a count and Cancel; the draft survives cancel and failure
// ---------------------------------------------------------------------------------------------------------------
function PostBuildScenario(props: ScenarioProps): JSX.Element {
  const [title, setTitle] = useState('Lighthouse on the reef')
  const [seed, setSeed] = useState('-4172144997902289642')
  const [error, setError] = useState<string | null>(null)
  const [titleError, setTitleError] = useState<string | undefined>()
  const [progress, setProgress] = useState<number | null>(null)
  const [posted, setPosted] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)
  const files = 3

  useEffect(() => () => controller.current?.abort(), [])

  async function post(): Promise<void> {
    if (!title.trim()) {
      setTitleError('Add a title')
      return
    }
    setTitleError(undefined)
    setError(null)
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    setProgress(0)
    try {
      if (props.network === 'offline') throw new OfflineError()
      const step = Math.max(60, ({ fast: 120, slow: 600, 'very-slow': 1600, stalled: 4000, fail: 500 } as Record<string, number>)[props.latency] ?? 500)
      for (let i = 1; i <= files; i++) {
        await wait(step, own.signal)
        if (props.latency === 'fail' && i === 2) throw new SimulatedFailure()
        setProgress(Math.round((i / files) * 100))
      }
      setProgress(null)
      setPosted(title.trim())
      toast('Build posted', { tone: 'success', action: { label: 'View', onClick: () => announce(`Opened ${title.trim()}`) } })
    } catch (failure) {
      setProgress(null)
      if (isAbort(failure)) {
        announce('Upload cancelled. Your details are kept in the draft.')
        return
      }
      setError(failureText(failure, 'post your build'))
    }
  }

  if (posted) {
    return (
      <div className="sys-stack">
        <InlineMessage tone="success" title={`${posted} is posted`}>
          It's on your profile and in your followers' feeds.
        </InlineMessage>
        <Button onClick={() => setPosted(null)}>Post another build</Button>
      </div>
    )
  }

  const uploading = progress !== null
  return (
    <div className="sys-stack">
      <TextField label="Title" value={title} error={titleError} onChange={(e) => setTitle(e.target.value)} disabled={uploading} />
      <TextField label="Seed" optional value={seed} onChange={(e) => setSeed(e.target.value)} disabled={uploading} />
      <p className="sys-note">3 screenshots chosen (invented).</p>
      {uploading ? (
        <ProgressBar
          value={progress}
          label={`Uploading ${Math.min(files, Math.floor((progress / 100) * files) + 1)} of ${files} screenshots`}
          onCancel={() => controller.current?.abort()}
          cancelLabel="Cancel upload"
          completeMessage="Screenshots uploaded"
        />
      ) : (
        <ActionButton variant="primary" onAction={() => post()}>
          Post build
        </ActionButton>
      )}
      {error ? <InlineMessage tone="error" title="Your draft is kept">{error}</InlineMessage> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// comment: shows at once marked "Posting…"; settles or stays "Not posted" with Try again
// ---------------------------------------------------------------------------------------------------------------
function CommentScenario(props: ScenarioProps): JSX.Element {
  const [items, setItems] = useState<readonly CommentItem[]>(props.outcome === 'empty' ? [] : COMMENTS.slice(0, 2))
  return (
    <div className="sys-stack">
      {items.length ? (
        <ul className="sys-list" aria-label="Comments">
          {items.map((c) => (
            <li key={c.id}>
              <Comment item={c} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState kind="first-use" title="No comments yet" headingLevel={4}>
          Be the first to say what you like about this build.
        </EmptyState>
      )}
      <CommentComposer
        onSubmit={(text, signal) => request(props, text, text, signal)}
        onPosted={(text) =>
          setItems((prev) => [...prev, { ...COMMENTS[0], id: `c-new-${prev.length}`, author: ME.id, text, when: 'just now', likes: 0 }])
        }
      />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// servers: filters dim the old list with a bar; each row's player count checks on its own; no results with filters
// ---------------------------------------------------------------------------------------------------------------
function ServersScenario(props: ScenarioProps): JSX.Element {
  const [filters, setFilters] = useState<ServerFilters>(NO_FILTERS)
  const [busy, setBusy] = useState(false)
  const [shown, setShown] = useState<readonly (typeof SERVERS)[number][] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const requests = useRequests()

  function load(next: ServerFilters): void {
    setFilters(next)
    setBusy(true)
    setError(null)
    void requests(async (signal) => {
      try {
        const match = filterServers(SERVERS, next)
        const found = await request(props, match, [], signal)
        setShown(found)
        announce(found.length ? `${plural(found.length, 'server')} match` : 'No servers match')
      } catch (failure) {
        if (isAbort(failure)) throw failure
        setError(failure)
      } finally {
        setBusy(false)
      }
    })
  }

  // first load as the scenario mounts or a control changes
  useEffect(() => {
    load(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.latency, props.outcome, props.network])

  return (
    <div className="sys-stack">
      <ServerFilterBar value={filters} onChange={load} resultCount={busy || error ? undefined : shown?.length} />
      {error ? (
        <ErrorState title="Could not load servers" onRetry={() => load(filters)}>
          {reasonText(error)}
        </ErrorState>
      ) : (
        <Region label="Servers" busy={busy} hasContent={shown !== null} minHeight="12rem" fallback={<Skeleton lines={5} />}>
          {shown && shown.length ? (
            <ul className="sys-list">
              {shown.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <ServerRow server={s} onJoin={(id) => announce(`Copied the address of ${SERVERS.find((x) => x.id === id)?.name ?? 'the server'}`)} />
                </li>
              ))}
            </ul>
          ) : shown ? (
            <EmptyState
              kind="no-results"
              title="No servers match"
              action={<Button onClick={() => load(NO_FILTERS)}>Clear filters</Button>}
            >
              Try another version or mode.
            </EmptyState>
          ) : null}
        </Region>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// vote: not optimistic (one vote, counted on the server); success sends experience orbs to the count
// ---------------------------------------------------------------------------------------------------------------
function VoteScenario(props: ScenarioProps): JSX.Element {
  const [voted, setVoted] = useState<readonly string[]>([])
  const [problem, setProblem] = useState<string | null>(null)
  const [votes, setVotes] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const tally = useRef<HTMLDivElement>(null)
  const requests = useRequests()
  const max = CHALLENGE.votesPerPlayer

  function vote(buildId: string): void {
    if (voted.includes(buildId) || voted.length >= max) return
    setProblem(null)
    const from = root.current?.querySelector<HTMLElement>(`[data-entry="${buildId}"]`) ?? root.current
    void requests(async (signal) => {
      try {
        await request(props, true, true, signal)
        setVoted((prev) => [...prev, buildId])
        void xp(from, tally.current, { count: 5, onArrive: () => setVotes((n) => n + 1) })
        announce('Vote counted')
      } catch (failure) {
        if (isAbort(failure)) throw failure
        setProblem(failureText(failure, 'count your vote'))
      }
    })
  }

  return (
    <div ref={root} className="sys-stack">
      <div ref={tally}>
        <XpBar value={votes} max={max} label={`Votes used: ${votes} of ${max}`} showLabel />
      </div>
      <ChallengeCard voted={voted} onVote={vote} />
      {problem ? <InlineMessage tone="error">{problem}</InlineMessage> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// rsvp: optimistic choice; the going count updates; a failure returns the old choice
// ---------------------------------------------------------------------------------------------------------------
type Rsvp = 'going' | 'maybe' | 'no'
function RsvpScenario(props: ScenarioProps): JSX.Element {
  const event = EVENTS[0]
  const [choice, setChoice] = useState<Rsvp>('no')
  const [problem, setProblem] = useState<string | null>(null)
  const requests = useRequests()

  function change(next: Rsvp): void {
    const before = choice
    setChoice(next)
    setProblem(null)
    if (next === 'going') announce("You're going")
    void requests(async (signal) => {
      try {
        await request(props, true, true, signal)
      } catch (failure) {
        if (isAbort(failure)) throw failure
        setChoice(before)
        setProblem(failureText(failure, 'save your answer'))
      }
    })
  }

  return (
    <div className="sys-stack">
      <p className="sys-strong">{event.title}</p>
      <RadioGroup<Rsvp>
        legend="Are you going?"
        value={choice}
        onChange={change}
        options={[
          { value: 'going', label: 'Going' },
          { value: 'maybe', label: 'Maybe' },
          { value: 'no', label: 'Not going' },
        ]}
      />
      <p className="sys-note">
        <span className="bf-num">{12 + (choice === 'going' ? 1 : 0)}</span> going
      </p>
      {problem ? <InlineMessage tone="error">{problem}</InlineMessage> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// live: notifications arrive while the list is open; the new row rises, the bell count rises and pulses once
// ---------------------------------------------------------------------------------------------------------------
const INCOMING: readonly Notification[] = [
  { id: 'live-1', kind: 'like', who: 'tallowknight', text: 'liked', target: 'Night Market Tower', when: 'just now', unread: true },
  { id: 'live-2', kind: 'comment', who: 'pebblewren', text: 'commented on', target: 'Night Market Tower', when: 'just now', unread: true },
  { id: 'live-3', kind: 'follow', who: 'birchlantern', text: 'started following you', when: 'just now', unread: true },
]

function LiveScenario(props: ScenarioProps): JSX.Element {
  const [items, setItems] = useState<readonly Notification[]>(props.outcome === 'empty' ? [] : NOTIFICATIONS.slice(0, 3))
  const [unread, setUnread] = useState(props.outcome === 'empty' ? 0 : 3)
  const [next, setNext] = useState(0)
  const bell = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)

  function arrive(): void {
    const item = INCOMING[next % INCOMING.length]
    setItems((prev) => [{ ...item, id: `${item.id}-${next}` }, ...prev].slice(0, 6))
    setUnread((n) => n + 1)
    setNext((n) => n + 1)
    announce(`New: ${item.who} ${item.text}${item.target ? ` ${item.target}` : ''}`)
    requestAnimationFrame(() => {
      void play(bell.current?.querySelector<HTMLElement>('.bf-bell') ?? null, 'pulse')
      const row = list.current?.querySelector<HTMLElement>('li')
      if (row) row.classList.add('sys-rise')
    })
  }

  return (
    <div className="sys-stack">
      <div className="sys-row">
        <div ref={bell}>
          <Bell count={unread} onClick={() => setUnread(0)} />
        </div>
        <Button onClick={arrive} disabled={props.network === 'offline'}>
          Simulate a new notification
        </Button>
        <Button variant="ghost" onClick={() => setUnread(0)}>
          Mark all read
        </Button>
      </div>
      {props.network === 'offline' ? (
        <InlineMessage tone="warning">You're not connected. New notifications will show when you're back.</InlineMessage>
      ) : null}
      <div ref={list} key={next}>
        {items.length ? (
          <NotificationList items={items} label="Notifications" />
        ) : (
          <EmptyState kind="cleared" title="All caught up" headingLevel={4}>
            New likes, follows and replies show up here.
          </EmptyState>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// message: the bubble shows at once marked Sending; offline it waits and sends on reconnect
// ---------------------------------------------------------------------------------------------------------------
type Sent = Message & { status: 'sending' | 'waiting' | 'delivered' | 'failed' }
function MessageScenario(props: ScenarioProps): JSX.Element {
  const thread = THREADS[0]
  const [mine, setMine] = useState<readonly Sent[]>([])
  const pending = useRef(new Set<number>())

  async function deliver(index: number, text: string): Promise<void> {
    pending.current.add(index)
    setMine((prev) => prev.map((m, i) => (i === index ? { ...m, status: 'sending' } : m)))
    try {
      await request(props, text, text)
      setMine((prev) => prev.map((m, i) => (i === index ? { ...m, status: 'delivered' } : m)))
    } catch (failure) {
      const status = failure instanceof OfflineError ? 'waiting' : 'failed'
      setMine((prev) => prev.map((m, i) => (i === index ? { ...m, status } : m)))
    } finally {
      pending.current.delete(index)
    }
  }

  function send(text: string): void {
    const index = mine.length
    setMine((prev) => [...prev, { from: ME.id, text, at: 'now', status: props.network === 'offline' ? 'waiting' : 'sending' }])
    if (props.network !== 'offline') void deliver(index, text)
  }

  // back online: everything waiting sends, in order
  useEffect(() => {
    if (props.network !== 'online') return
    mine.forEach((m, i) => {
      if (m.status === 'waiting' && !pending.current.has(i)) void deliver(i, m.text)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.network])

  const STATUS: Record<Sent['status'], string> = {
    sending: 'Sending…',
    waiting: 'Waiting to send',
    delivered: 'Delivered',
    failed: 'Not sent',
  }

  return (
    <div className="sys-stack">
      {props.network === 'offline' ? (
        <InlineMessage tone="warning">You're not connected. Messages will send when you're back.</InlineMessage>
      ) : null}
      <ChatLog messages={[...thread.messages.slice(-2), ...mine]} label={`Conversation with ${thread.with}`} />
      {mine.length ? (
        <ul className="sys-list" aria-label="Your messages">
          {mine.map((m, i) => (
            <li key={i} className="bf-row">
              <span>{m.text}</span>
              <Tag tone={m.status === 'delivered' ? 'positive' : m.status === 'failed' ? 'negative' : m.status === 'waiting' ? 'warning' : 'info'} icon={m.status === 'delivered' ? 'check' : m.status === 'failed' ? 'cross' : 'clock'}>
                {STATUS[m.status]}
              </Tag>
              {m.status === 'failed' || m.status === 'waiting' ? (
                <>
                  {m.status === 'failed' ? (
                    <Button size="sm" onClick={() => void deliver(i, m.text)}>
                      Try again
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => setMine((prev) => prev.filter((_, j) => j !== i))}>
                    Discard
                  </Button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <MessageComposer onSend={send} label={`Message ${thread.with}`} />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// report: the report dialog for a builder; the moderator's queue with undo and focus moving to the next row
// ---------------------------------------------------------------------------------------------------------------
function ReportScenario(props: ScenarioProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [status, setStatus] = useState<Record<string, QueueStatus>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const requests = useRequests()
  const queue = props.outcome === 'empty' ? [] : REPORTS
  const list = useRef<HTMLUListElement>(null)
  const heading = useRef<HTMLParagraphElement>(null)
  // after a decision the row's buttons change; focus moves on to the next row (or the queue heading at the end)
  const focusAfter = (id: string): void => {
    requestAnimationFrame(() => {
      const rows = [...(list.current?.querySelectorAll<HTMLLIElement>(':scope > li') ?? [])]
      const index = queue.findIndex((r) => r.id === id)
      const next = rows.slice(index + 1).find((row) => row.querySelector('button'))
      const target = next?.querySelector<HTMLElement>('button') ?? heading.current
      target?.focus()
    })
  }
  const openCount = queue.filter((r) => (status[r.id] ?? 'open') === 'open').length

  function act(id: string, action: QueueAction): void {
    const before = status[id] ?? 'open'
    const after: QueueStatus = action === 'undo' ? 'open' : action === 'hide' ? 'hidden' : action === 'warn' ? 'warned' : 'dismissed'
    setBusy(id)
    setProblem(null)
    void requests(async (signal) => {
      try {
        await request(props, true, true, signal)
        setStatus((prev) => ({ ...prev, [id]: after }))
        if (action !== 'undo') {
          focusAfter(id)
          toast(action === 'dismiss' ? 'Report dismissed' : action === 'hide' ? 'Post hidden' : 'Author warned', {
            action: { label: 'Undo', onClick: () => setStatus((prev) => ({ ...prev, [id]: before })) },
          })
        }
      } catch (failure) {
        if (isAbort(failure)) throw failure
        setProblem(failureText(failure, 'save that decision'))
      } finally {
        setBusy(null)
      }
    })
  }

  return (
    <div className="sys-stack">
      <div className="sys-row">
        <Button icon="flag" onClick={() => setOpen(true)}>
          Report {BUILD.title}
        </Button>
        {sent ? <span className="sys-note">Report sent. A moderator will look at it.</span> : null}
      </div>
      <ReportDialog
        open={open}
        onClose={() => setOpen(false)}
        subject={BUILD.title}
        onSubmit={(_reason, _details, signal) => request(props, true, true, signal)}
        onSent={() => setSent(true)}
      />
      <p ref={heading} tabIndex={-1} className="sys-strong">
        Moderation queue · {openCount} open
      </p>
      {queue.length ? (
        <ul ref={list} className="sys-list">
          {queue.map((r) => (
            <li key={r.id}>
              <QueueRow report={r} status={status[r.id] ?? 'open'} busy={busy === r.id} onAct={(a) => act(r.id, a)} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState kind="cleared" title="Queue clear" headingLevel={4}>
          Nothing waiting for review.
        </EmptyState>
      )}
      {problem ? <InlineMessage tone="error">{problem}</InlineMessage> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// settings: autosave; "Saved" by the heading; a failed save returns the control and explains
// ---------------------------------------------------------------------------------------------------------------
function SettingsScenario(props: ScenarioProps): JSX.Element {
  const [saved, setSaved] = useState<Preferences>(DEFAULT_PREFERENCES)
  return (
    <SettingsPanel
      saved={saved}
      onSave={(next, signal) => request(props, next, next, signal)}
      onSaved={(next) => {
        setSaved(next)
        announce('Settings saved')
      }}
    />
  )
}

// ---------------------------------------------------------------------------------------------------------------
// first-use: an empty gallery invites the first post; the post replaces the empty state in the same space
// ---------------------------------------------------------------------------------------------------------------
function FirstUseScenario(props: ScenarioProps): JSX.Element {
  const [builds, setBuilds] = useState<readonly Build[]>([])
  const [problem, setProblem] = useState<string | null>(null)

  async function postFirst(signal: AbortSignal): Promise<void> {
    setProblem(null)
    try {
      await request(props, true, true, signal)
      setBuilds([{ ...BUILDS[2], author: ME.id, posted: 'just now' }])
      toast('Build posted', { tone: 'success' })
    } catch (failure) {
      if (!isAbort(failure)) setProblem(failureText(failure, 'post your build'))
      throw failure
    }
  }

  return (
    <div className="sys-stack">
      {builds.length ? (
        <Gallery builds={builds} label={`${ME.name}'s builds`} />
      ) : (
        <EmptyState
          kind="first-use"
          title="No builds yet"
          action={
            <ActionButton variant="primary" onAction={postFirst} pendingLabel="Posting…" successLabel="Posted">
              Post a build
            </ActionButton>
          }
        >
          Post your first build. Add the seed and coordinates so others can visit.
        </EmptyState>
      )}
      {problem ? <InlineMessage tone="error">{problem}</InlineMessage> : null}
      {builds.length ? (
        <Button variant="ghost" onClick={() => setBuilds([])}>
          Start over
        </Button>
      ) : null}
    </div>
  )
}

export const SCENARIOS: readonly ScenarioEntry[] = [
  {
    id: 'search',
    title: 'Search builds',
    summary: 'A query, the results region, no results with the query echoed, a failed search with Try again.',
    watch: 'Fast: results only. Slow: a skeleton at 400 ms on the first search; later searches dim the old results with the top bar. Empty: no results naming the query. Fail or offline: the error replaces the region.',
  },
  {
    id: 'sign-in',
    title: 'Join or sign in',
    summary: 'Validation on leaving a field, a summary for two or more errors, the button’s own states.',
    watch: 'Submit empty: the summary takes focus. One error: focus goes to the field. Fail: the reason under the button, nothing typed is lost. Success: the signed-in state in place.',
  },
  {
    id: 'like-save',
    title: 'Like and save a build (optimistic)',
    summary: 'The heart and bookmark change at once; saving flies the bookmark to Saved builds; removing offers Undo.',
    watch: 'Any latency: instant change, the heart pops, the bookmark arcs to Saved builds. Fail or offline: it flips back, shakes once, the reason shows beside it.',
  },
  {
    id: 'follow',
    title: 'Follow a builder',
    summary: 'Optimistic follow; the follower count rises and pops.',
    watch: 'Instant "Following"; the count pops. Fail or offline: the button returns and the reason shows.',
  },
  {
    id: 'post-build',
    title: 'Post a build (upload, progress, cancel)',
    summary: 'The experience bar counts screenshots up; Cancel keeps the draft; a failure keeps every field.',
    watch: 'Slow: the bar fills in frames with "Uploading 2 of 3 screenshots". Cancel: the form returns with the details. Fail: "Your draft is kept" with the reason. Success: a toast with View.',
  },
  {
    id: 'comment',
    title: 'Comment on a build',
    summary: 'The comment box with its own pending, success and failure; the new comment joins the list.',
    watch: 'Empty: "No comments yet". Posting: the button reads Posting. Fail: the text stays in the box with the reason.',
  },
  {
    id: 'servers',
    title: 'Filter the server list',
    summary: 'Filters by version, mode, region and players; each row shows its ping and player count.',
    watch: 'A filter change dims the old list with the bar, then replaces it and announces the count. Empty: "No servers match" with Clear filters. Fail: the error with Try again.',
  },
  {
    id: 'vote',
    title: 'Vote in the weekly challenge',
    summary: 'One vote per entry, counted on the server; a counted vote sends experience orbs to the votes bar.',
    watch: 'Not optimistic: the vote counts only after the server answers, then orbs fly to the bar and it fills a step. Fail: the reason; the vote is not counted.',
  },
  {
    id: 'rsvp',
    title: 'RSVP to an event',
    summary: 'Going, Maybe, Not going: optimistic; the going count follows.',
    watch: 'The choice changes at once. Fail or offline: the old choice returns with the reason.',
  },
  {
    id: 'live',
    title: 'Notifications arriving live',
    summary: 'New notifications while the list is open: the row rises in, the bell count rises and pulses once.',
    watch: 'Each arrival rises at the top in 4 frames and is announced; the bell pulses once. Offline: the banner, no arrivals. Empty: "All caught up".',
  },
  {
    id: 'message',
    title: 'Send a message (offline and sync)',
    summary: 'The bubble shows at once; offline it waits and sends in order when the connection returns.',
    watch: 'Online: Sending…, then Delivered. Offline: "Waiting to send" and the banner; switch back online and they send in order. Fail: "Not sent" with Try again.',
  },
  {
    id: 'report',
    title: 'Report and moderate (with undo)',
    summary: 'A builder reports a build; a moderator hides, warns or dismisses from the queue, each with Undo.',
    watch: 'Report: the dialog keeps the reason on failure and closes with "Report sent" on success. Queue: the row shows its new state, a toast offers Undo. Empty: "Queue clear".',
  },
  {
    id: 'settings',
    title: 'Change settings',
    summary: 'Appearance, privacy and notifications save as they change.',
    watch: 'A change applies at once with "Saved" by the heading. Fail or offline: the control returns and the reason shows under it.',
  },
  {
    id: 'first-use',
    title: 'First use: an empty gallery',
    summary: 'A new builder with no builds: the empty state invites the first post.',
    watch: 'One primary action. Success: the gallery replaces the empty state in the same space. Fail: the empty state stays with the reason.',
  },
]

export const SCENARIO_DEMOS: Readonly<Record<string, ComponentType<ScenarioProps>>> = {
  search: SearchScenario,
  'sign-in': SignInScenario,
  'like-save': LikeSaveScenario,
  follow: FollowScenario,
  'post-build': PostBuildScenario,
  comment: CommentScenario,
  servers: ServersScenario,
  vote: VoteScenario,
  rsvp: RsvpScenario,
  live: LiveScenario,
  message: MessageScenario,
  report: ReportScenario,
  settings: SettingsScenario,
  'first-use': FirstUseScenario,
}
