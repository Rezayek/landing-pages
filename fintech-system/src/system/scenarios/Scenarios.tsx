/**
 * Scenarios: Kitty's main jobs (SYSTEM.md §Project, the action table in INTERACTION.md) built from the system's own
 * components, so the whole loading → waiting → result story can be seen and tuned before any real screen exists.
 * Each one is driven by the /system toolbar:
 *
 *   latency   fast | slow | very slow | stalled | fail   (latency.ts)
 *   outcome   results | empty                            what a successful request returns
 *   network   online | offline                           offline rejects at once, like a dropped connection
 *
 * The words come from CONTENT.md; the timings from FEEDBACK_TIMING (INTERACTION.md). Every person and amount is
 * sample data (ui/sample.ts). Each scenario root carries `data-scenario="<id>"` for the capture scripts.
 */
import { useEffect, useId, useRef, useState, type ComponentType, type FormEvent, type JSX, type ReactNode } from 'react'
import { ActionButton, EmptyState, ErrorState, InlineMessage, Region, Skeleton, announce, toast } from '../feedback'
import { SimulatedFailure, isAbort, simulate, wait, type LatencyId } from '../latency'
import {
  AllowanceCard,
  Amount,
  AmountInput,
  BALANCE_PENCE,
  Banner,
  BalanceCard,
  BarList,
  Button,
  BudgetMeter,
  Checkbox,
  CodeInput,
  Combobox,
  DescriptionList,
  ErrorSummary,
  Field,
  FilterBar,
  KpiTile,
  PEOPLE,
  PersonTag,
  RequestCard,
  SegmentedControl,
  StackedBar,
  StatusTag,
  Switch,
  Tabs,
  TextInput,
  Tick,
  TransactionList,
  TransactionRow,
  BUDGETS,
  SPENDING_BY_CATEGORY,
  SPENDING_BY_PERSON,
  TRANSACTIONS,
  formatPence,
  parseAmount,
  personById,
  type Transaction,
} from '../ui'
import { BudgetDialog } from '../ui/demos'

export type Outcome = 'results' | 'empty'
export type Network = 'online' | 'offline'

export interface ScenarioProps {
  latency: LatencyId
  outcome: Outcome
  network: Network
  /** The page was opened with `?latency=`: data scenarios load once on their own, for captures. */
  autorun?: boolean
  /** `?run=1`: each action scenario fills itself in and presses its own button once, so timed captures show
   * pending, success and error in the control itself. */
  run?: boolean
}

/** Press `ref`'s button once after mount when `run` is on (after `prepare` has filled the form in). */
function useRunOnce(run: boolean | undefined, ref: { current: HTMLElement | null }, prepare?: () => void, delay = 250): void {
  useEffect(() => {
    if (!run) return
    prepare?.()
    const timer = window.setTimeout(() => ref.current?.click(), delay)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])
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
    super('You’re not connected.')
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

/** CONTENT.md, Errors: what failed, what was kept or did not happen, the next step. */
function failureText(error: unknown, what: string, kept: string): string {
  if (error instanceof OfflineError) return `You’re not connected. ${kept} Try again once you’re back.`
  if (error instanceof SimulatedFailure) return `Could not ${what}. ${kept} Try again.`
  return `This is taking too long. ${kept} Try again.`
}

/** The body of a region error (the title already says what failed): what is kept, what to do. */
function regionBody(error: unknown, kept: string): string {
  if (error instanceof OfflineError) return `You’re not connected. ${kept} Try again once you’re back.`
  if (error instanceof SimulatedFailure) return `${kept} Check your connection, then try again.`
  return `This is taking too long. ${kept} Try again.`
}

const invalid = (): Error => Object.assign(new Error('invalid'), { name: 'ValidationError' })
const isInvalid = (error: unknown): boolean => error instanceof Error && error.name === 'ValidationError'

function Frame({ id, children }: { id: string; children: ReactNode }): JSX.Element {
  return (
    <div className="k-stack" data-scenario={id} style={{ gap: 'var(--space-4)' }}>
      {children}
    </div>
  )
}

/** The analytics content's skeleton, from the same KPI, tab and bar-row classes, so the swap moves nothing. */
function AnalyticsSkeleton(): JSX.Element {
  return (
    <div className="k-stack" style={{ gap: 'var(--space-5)' }} aria-hidden="true">
      <div className="k-kpi-row">
        {[0, 1].map((i) => (
          <div key={i} className="k-kpi">
            <span className="k-kpi__label" style={{ display: 'flex', alignItems: 'center', minBlockSize: '1.43em' }}>
              <Skeleton variant="rect" width="4rem" height={14} />
            </span>
            <span className="k-amount" data-size={i === 0 ? 'xl' : 'lg'}>
              <Skeleton variant="rect" width="7rem" height={i === 0 ? 35 : 26} />
            </span>
            <span className="k-kpi__delta" style={{ minBlockSize: '1.43em' }}>
              <Skeleton variant="rect" width="11rem" height={14} />
            </span>
          </div>
        ))}
      </div>
      <div className="k-stack" style={{ gap: 'var(--space-4)' }}>
        <div className="k-tabs">
          <span className="k-tab" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Skeleton variant="rect" width="5rem" height={14} />
          </span>
          <span className="k-tab" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Skeleton variant="rect" width="5rem" height={14} />
          </span>
        </div>
        <div className="k-chart">
          <div className="k-card__head" style={{ minBlockSize: 32 }}>
            <Skeleton variant="rect" width="14rem" height={14} />
          </div>
          <ol className="k-bars">
            {SPENDING_BY_CATEGORY.map((row) => (
              <li key={row.category}>
                <span className="k-bar-row">
                  <Skeleton variant="rect" width="5rem" height={12} />
                  <span className="k-bar-row__track" />
                  <Skeleton variant="rect" width="4rem" height={12} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

const FAMILY = PEOPLE.map((p) => ({ id: p.id, label: p.name, hint: p.role === 'kid' ? 'Kid' : 'Parent', person: p }))

// ---------------------------------------------------------------------------------------------------------------
// 1. Send money: person, amount, note → review → send → confirmation step
// ---------------------------------------------------------------------------------------------------------------
function SendMoneyScenario(props: ScenarioProps): JSX.Element {
  const [step, setStep] = useState<'form' | 'review' | 'done'>('form')
  const [to, setTo] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const summary = useRef<HTMLDivElement>(null)
  const done = useRef<HTMLHeadingElement>(null)
  const ids = { to: useId(), amount: useId(), note: useId() }
  const pence = parseAmount(amount)
  const errors = {
    to: !to ? 'Choose who to send to' : null,
    amount: pence === null ? 'Enter an amount' : Number.isNaN(pence) ? 'Amount must be in pounds and pence, like 12.50' : pence > BALANCE_PENCE ? 'There is £1,284.50 in the kitty. Add money, or send less.' : pence < 1 ? 'Amount must be between £0.01 and £1,284.50, the money in the kitty' : null,
  }
  const list = [errors.to ? { fieldId: ids.to, text: errors.to } : null, errors.amount ? { fieldId: ids.amount, text: errors.amount } : null].filter(Boolean) as { fieldId: string; text: string }[]
  const person = to ? personById(to) : null
  const sendRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (step === 'done') done.current?.focus()
  }, [step])

  useEffect(() => {
    if (!props.run) return
    setTo('sam')
    setAmount('20.00')
    setNote('Football boots')
    setStep('review')
  }, [props.run])
  useRunOnce(props.run && step === 'review' ? true : undefined, sendRef)

  if (step === 'done' && person && pence) {
    return (
      <Frame id="send-money">
        <div className="k-row">
          <Tick play={1} label="Sent" />
          <h4 ref={done} tabIndex={-1} style={{ margin: 0, fontSize: 'var(--step-2)' }}>
            Sent {formatPence(pence)} to {person.name}
          </h4>
        </div>
        <p style={{ margin: 0 }}>It usually arrives in seconds. Reference KT-48213 (sample).</p>
        <div className="k-row">
          <Button variant="secondary" onClick={() => { setStep('form'); setTo(null); setAmount(''); setNote(''); setSubmitted(false) }}>
            Back to Home
          </Button>
          <a className="k-link" data-standalone href="#activity">
            View in Activity
          </a>
        </div>
      </Frame>
    )
  }

  if (step === 'review' && person && pence) {
    return (
      <Frame id="send-money">
        <h4 style={{ margin: 0, fontSize: 'var(--step-1)', fontFamily: 'var(--font-body)' }}>Check and send</h4>
        <DescriptionList
          onChange={() => setStep('form')}
          items={[
            { term: 'To', value: person.name, change: 'Change recipient' },
            { term: 'Amount', value: <Amount pence={pence} />, change: 'Change amount' },
            { term: 'From', value: 'The family kitty' },
            { term: 'Arrives', value: 'In seconds' },
            { term: 'Note', value: note || null },
          ]}
        />
        <div className="k-btn-group">
          <Button variant="quiet" onClick={() => setStep('form')}>
            Back
          </Button>
          <ActionButton
            ref={sendRef}
            variant="primary"
            pendingLabel="Sending…"
            successLabel="Sent"
            slowLabel="Still sending…"
            successMessage={`Sent ${formatPence(pence)} to ${person.name}`}
            errorMessage={(e) => failureText(e, `send ${formatPence(pence)} to ${person.name}`, 'Nothing left the kitty.')}
            onAction={async (signal) => {
              setFailure(null)
              await request(props, true, true, signal)
            }}
            onSuccess={() => setStep('done')}
            onError={(e) => setFailure(failureText(e, `send ${formatPence(pence)} to ${person.name}`, 'Nothing left the kitty.'))}
          >
            Send {formatPence(pence)} to {person.name}
          </ActionButton>
        </div>
        {failure ? <InlineMessage tone="error" title="Not sent">{failure}</InlineMessage> : null}
      </Frame>
    )
  }

  return (
    <Frame id="send-money">
      <form
        className="k-stack"
        style={{ gap: 'var(--space-4)' }}
        noValidate
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          setSubmitted(true)
          if (list.length) {
            requestAnimationFrame(() => (list.length > 1 ? summary.current : document.getElementById(list[0].fieldId))?.focus())
            return
          }
          setStep('review')
        }}
      >
        {submitted && list.length > 1 ? <ErrorSummary ref={summary} errors={list} /> : null}
        <Field id={ids.to} label="To" message={submitted && errors.to ? { tone: 'negative', text: errors.to } : null}>
          {(d) => <Combobox id={ids.to} options={FAMILY.filter((f) => f.id !== 'ada')} value={to} onChange={setTo} describedBy={d} invalid={submitted && !!errors.to} />}
        </Field>
        <Field id={ids.amount} label="Amount" hint="Up to £1,284.50, the money in the kitty" message={submitted && errors.amount ? { tone: 'negative', text: errors.amount } : null}>
          {(d) => <AmountInput id={ids.amount} value={amount} onChange={setAmount} describedBy={d} invalid={submitted && !!errors.amount} size="lg" />}
        </Field>
        <Field id={ids.note} label="Note" optional>
          {(d) => <TextInput id={ids.note} value={note} onChange={(e) => setNote(e.target.value)} aria-describedby={d} placeholder="Football boots" />}
        </Field>
        <div>
          <button type="submit" className="k-btn" data-variant="primary">
            Continue
          </button>
        </div>
      </form>
    </Frame>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 2. Split a bill: who is in, equal or custom shares that must add up, then each share as a status
// ---------------------------------------------------------------------------------------------------------------
function SplitScenario(props: ScenarioProps): JSX.Element {
  const bill = 8400
  const [inBill, setInBill] = useState<string[]>(['ada', 'sam', 'ivy', 'theo'])
  const [mode, setMode] = useState('equal')
  const [shares, setShares] = useState<Record<string, string>>({ ada: '21.00', sam: '21.00', ivy: '21.00', theo: '21.00' })
  const [done, setDone] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const equal = Math.floor(bill / Math.max(1, inBill.length))
  const share = (id: string): number => (mode === 'equal' ? equal + (id === inBill[0] ? bill - equal * inBill.length : 0) : parseAmount(shares[id] ?? '') ?? 0)
  const sum = inBill.reduce((total, id) => total + (Number.isNaN(share(id)) ? 0 : share(id)), 0)
  const left = bill - sum
  const splitRef = useRef<HTMLButtonElement>(null)
  useRunOnce(props.run, splitRef)

  if (done) {
    return (
      <Frame id="split">
        <p style={{ margin: 0 }}>
          <strong>B&Q</strong> <Amount pence={-bill} signed /> split {inBill.length} ways
        </p>
        <ul className="k-list">
          {inBill.map((id) => (
            <li key={id} className="k-row" style={{ justifyContent: 'space-between', minBlockSize: 'var(--row-h)' }}>
              <span className="k-cell-person">
                <PersonTag person={personById(id)} />
              </span>
              {id === 'ada' ? <StatusTag tone="positive">Paid</StatusTag> : <StatusTag tone="neutral">Owes {formatPence(share(id))}</StatusTag>}
            </li>
          ))}
        </ul>
        <Button variant="quiet" onClick={() => setDone(false)}>
          Change the split
        </Button>
      </Frame>
    )
  }

  return (
    <Frame id="split">
      <p style={{ margin: 0 }}>
        <strong>B&Q</strong> · <Amount pence={-bill} signed /> · paid by Ada
      </p>
      <fieldset className="k-fieldset">
        <legend style={{ fontSize: 'var(--step-0)' }}>Who’s in this bill?</legend>
        <div className="k-row">
          {PEOPLE.map((p) => (
            <PersonTag key={p.id} person={p} pressed={inBill.includes(p.id)} lockedReason={p.id === 'ada' ? 'Ada paid, so she’s in' : undefined} onToggle={() => setInBill((all) => (all.includes(p.id) ? all.filter((x) => x !== p.id) : [...all, p.id]))} />
          ))}
        </div>
      </fieldset>
      <SegmentedControl label="Split" value={mode} onChange={setMode} options={[{ id: 'equal', label: 'Equal' }, { id: 'custom', label: 'Custom' }]} />
      <div className="k-stack">
        {inBill.map((id) => (
          <div key={id} className="k-row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <span className="k-cell-person">{personById(id).name}</span>
            {mode === 'equal' ? (
              <Amount pence={share(id)} />
            ) : (
              <div style={{ inlineSize: 140 }}>
                <AmountInput id={`share-${id}`} value={shares[id] ?? ''} onChange={(v) => setShares((s) => ({ ...s, [id]: v }))} label={`${personById(id).name}’s share`} />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="k-field__msg" data-tone={left === 0 ? 'positive' : 'warning'} aria-live="polite">
        {left === 0 ? 'All £84.00 shared' : left > 0 ? `${formatPence(left)} still to share` : `${formatPence(-left)} more than the bill`}
      </p>
      <div>
        <ActionButton
          ref={splitRef}
          variant="primary"
          pendingLabel="Splitting…"
          slowLabel="Still splitting…"
          successLabel="Split"
          successMessage={`Split ${formatPence(bill)} ${inBill.length} ways`}
          errorMessage={(e) => (isInvalid(e) ? 'The shares must add up to £84.00.' : failureText(e, 'split the bill', 'Nobody was asked to pay.'))}
          onAction={async (signal) => {
            setFailure(null)
            if (left !== 0) throw invalid()
            await request(props, true, true, signal)
          }}
          onSuccess={() => setDone(true)}
          onError={(e) => setFailure(isInvalid(e) ? 'The shares must add up to £84.00. Change a share, or use Equal.' : failureText(e, 'split the bill', 'Nobody was asked to pay.'))}
        >
          Split {formatPence(bill)}
        </ActionButton>
      </div>
      {failure ? <InlineMessage tone="error" title="Not split">{failure}</InlineMessage> : null}
    </Frame>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 3. Allowance: top up (pending, the tick, a toast with Undo) or set one up from the empty state
// ---------------------------------------------------------------------------------------------------------------
function AllowanceScenario(props: ScenarioProps): JSX.Element {
  const ivy = personById('ivy')
  const [setUp, setSetUp] = useState(props.outcome === 'results')
  const [saved, setSaved] = useState(1200)
  const [tick, setTick] = useState(0)
  const [failure, setFailure] = useState<string | null>(null)
  useEffect(() => setSetUp(props.outcome === 'results'), [props.outcome])
  const root = useRef<HTMLDivElement>(null)
  const topUpRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (props.run) topUpRef.current = root.current?.querySelector<HTMLElement>('.fb-btn') ?? null
  }, [props.run, setUp])
  useRunOnce(props.run && props.outcome === 'results' ? true : undefined, topUpRef, undefined, 350)

  if (!setUp) {
    return (
      <div ref={root} style={{ display: 'contents' }}>
      <Frame id="allowance">
        <EmptyState
          kind="first-use"
          title="Give Ivy a regular allowance"
          headingLevel={4}
          action={
            <ActionButton variant="primary" pendingLabel="Setting up…" slowLabel="Still setting up…" successLabel="Set up" successMessage="Ivy’s allowance saved" errorMessage={(e) => failureText(e, 'set up Ivy’s allowance', 'Nothing was changed.')} onAction={(signal) => request(props, true, true, signal)} onSuccess={() => setSetUp(true)} onError={(e) => setFailure(failureText(e, 'set up Ivy’s allowance', 'Nothing was changed.'))}>
              Set up Ivy’s allowance
            </ActionButton>
          }
        >
          Choose an amount and a day. It arrives on its own.
        </EmptyState>
        {failure ? <InlineMessage tone="error" title="Not set up">{failure}</InlineMessage> : null}
      </Frame>
      </div>
    )
  }

  return (
    <div ref={root} style={{ display: 'contents' }}>
    <Frame id="allowance">
      <AllowanceCard
        kid={ivy}
        amount={500}
        rhythm="Friday"
        next="Fri 30 Oct"
        spent={1800}
        saved={saved}
        tick={tick}
        message={failure ? <InlineMessage tone="error" title="Not topped up">{failure}</InlineMessage> : null}
        onTopUp={async (signal) => {
          setFailure(null)
          await request(props, true, true, signal)
        }}
        onTopUpDone={() => {
          setSaved((s) => s + 1000)
          setTick((t) => t + 1)
          toast('Topped up Ivy with £10.00.', {
            tone: 'success',
            duration: 10000,
            action: {
              label: 'Undo',
              onClick: () => {
                setSaved((s) => s - 1000)
                setTick(0)
                announce('Undone')
              },
            },
          })
        }}
        onTopUpError={(e) => setFailure(failureText(e, 'top up Ivy', 'Nothing was sent.'))}
        onEdit={() => {}}
      />
    </Frame>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 4. Search and filter activity: skeleton first, stale-while-pending after, no results with Clear filters
// ---------------------------------------------------------------------------------------------------------------
function ActivityScenario(props: ScenarioProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [who, setWho] = useState<string[]>([])
  const [rows, setRows] = useState<readonly Transaction[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const controller = useRef<AbortController | null>(null)

  async function run(nextQuery = query, nextWho = who, signal?: AbortSignal): Promise<void> {
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    signal?.addEventListener('abort', () => own.abort(), { once: true })
    setBusy(true)
    setError(null)
    try {
      const term = nextQuery.trim().toLowerCase()
      const matches = TRANSACTIONS.filter((t) => (!term || t.payee.toLowerCase().includes(term)) && (!nextWho.length || nextWho.includes(t.person)))
      const found = await request(props, matches, [], own.signal)
      setRows(found)
      announce(found.length ? `${found.length} transaction${found.length === 1 ? '' : 's'}` : 'No transactions match')
    } catch (failure) {
      if (!isAbort(failure)) setError(failure)
    } finally {
      if (controller.current === own) setBusy(false)
    }
  }

  useEffect(() => {
    if (!(props.run || (props.autorun && props.run === undefined))) return
    // Under the Empty outcome the run searches with a word and a person, so the no-results state echoes both
    if (props.outcome === 'empty') {
      setQuery('pizza')
      setWho(['sam'])
      void run('pizza', ['sam'])
    } else void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.run])
  useEffect(() => () => controller.current?.abort(), [])

  const filters = [
    {
      id: 'person',
      label: 'Person',
      value: who.length ? who.map((w) => personById(w).name).join(', ') : 'All',
      active: who.length > 0,
      render: () => (
        <>
          {PEOPLE.map((p) => (
            <Checkbox
              key={p.id}
              label={p.name}
              checked={who.includes(p.id)}
              onChange={() => {
                const next = who.includes(p.id) ? who.filter((x) => x !== p.id) : [...who, p.id]
                setWho(next)
                void run(query, next)
              }}
            />
          ))}
        </>
      ),
    },
  ]

  return (
    <Frame id="activity">
      <FilterBar
        label="Filter activity (scenario)"
        filters={filters}
        count={rows ? `${rows.length} transaction${rows.length === 1 ? '' : 's'}` : ''}
        onClear={() => {
          setWho([])
          setQuery('')
          void run('', [])
        }}
      >
        <form
          style={{ inlineSize: 'min(240px, 100%)' }}
          onSubmit={(event) => {
            event.preventDefault()
            void run()
          }}
        >
          <TextInput aria-label="Search activity" search placeholder="Search activity" value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} />
        </form>
        <Button onClick={() => void run()}>Search</Button>
      </FilterBar>
      {error ? (
        <ErrorState title="Could not load activity" onRetry={(signal) => run(query, who, signal)} focusOnMount={false} headingLevel={4}>
          {regionBody(error, 'Your filters are kept.')}
        </ErrorState>
      ) : (
        <Region
          label="activity"
          busy={busy}
          hasContent={rows !== null}
          loadedMessage={false}
          onCancel={() => {
            controller.current?.abort()
            setBusy(false)
            announce('Search stopped. Your filters are kept.')
          }}
          minHeight="16rem"
          fallback={<TransactionList caption="Activity" rows={[]} skeleton skeletonRows={TRANSACTIONS.length} />}
        >
          {rows === null ? (
            <p className="sys-note">Press Search, or pick a person, to load activity at the current latency, outcome and network.</p>
          ) : rows.length === 0 ? (
            <EmptyState
              kind="no-results"
              title={query ? `No transactions match “${query}”` : 'No transactions match'}
              filters={[...(query ? [`Search: ${query}`] : []), ...who.map((w) => `Person: ${personById(w).name}`)]}
              onRemoveFilter={(chip) => {
                const nextQuery = chip.startsWith('Search: ') ? '' : query
                const nextWho = chip.startsWith('Person: ') ? who.filter((w) => `Person: ${personById(w).name}` !== chip) : who
                setQuery(nextQuery)
                setWho(nextWho)
                void run(nextQuery, nextWho)
              }}
              headingLevel={4} action={<Button onClick={() => { setWho([]); setQuery(''); void run('', []) }}>Clear filters</Button>}>
              Check the spelling, or clear a filter.
            </EmptyState>
          ) : (
            <TransactionList caption="Activity" rows={rows} />
          )}
        </Region>
      )}
    </Frame>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 5. Analytics: each chart its own region; a period change refreshes in place; empty month
// ---------------------------------------------------------------------------------------------------------------
function AnalyticsScenario(props: ScenarioProps): JSX.Element {
  const [period, setPeriod] = useState('month')
  const [tab, setTab] = useState('category')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [empty, setEmpty] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const controller = useRef<AbortController | null>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (props.run || (props.autorun && props.run === undefined)) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.run])
  useEffect(() => () => controller.current?.abort(), [])

  async function load(signal?: AbortSignal): Promise<void> {
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    signal?.addEventListener('abort', () => own.abort(), { once: true })
    setState('busy')
    setError(null)
    try {
      const data = await request(props, true, false, own.signal)
      setEmpty(!data)
      loaded.current = true
      setState('done')
    } catch (e) {
      if (!isAbort(e)) {
        setError(e)
        setState('error')
      }
    }
  }

  return (
    <Frame id="analytics">
      <div className="k-row" style={{ justifyContent: 'space-between' }}>
        <SegmentedControl label="Period" value={period} onChange={(p) => { setPeriod(p); void load() }} options={[{ id: 'month', label: 'This month' }, { id: '3m', label: '3 months' }, { id: 'year', label: 'Year' }]} />
        <Button onClick={() => void load()}>{state === 'idle' ? 'Load spending' : 'Reload'}</Button>
      </div>
      {state === 'error' ? (
        <ErrorState title="Could not load spending" onRetry={(signal) => load(signal)} focusOnMount={false} headingLevel={4}>
          {regionBody(error, 'Your period is kept.')}
        </ErrorState>
      ) : (
        <Region
          label="spending"
          busy={state === 'busy'}
          hasContent={loaded.current}
          loadedMessage="Spending loaded."
          onCancel={() => {
            controller.current?.abort()
            setState(loaded.current ? 'done' : 'idle')
            announce(loaded.current ? 'Stopped. Showing the spending you had.' : 'Stopped loading spending.')
          }}
          minHeight="18rem"
          fallback={<AnalyticsSkeleton />}
        >
          {state === 'idle' ? (
            <p className="sys-note">Press Load spending to fetch it at the current latency, outcome and network.</p>
          ) : empty ? (
            <EmptyState kind="first-use" title="Nothing spent this month yet" headingLevel={4}>
              Spending by category shows here as it happens.
            </EmptyState>
          ) : (
            <div className="k-stack" style={{ gap: 'var(--space-5)' }}>
              <div className="k-kpi-row">
                <KpiTile label="Spent" pence={84210} answer delta={{ text: '£120.40 less than September', tone: 'good', direction: 'down' }} />
                <KpiTile label="Money in" pence={140000} delta={{ text: '£52.00 more than September', tone: 'good', direction: 'up' }} />
              </div>
              <Tabs label="Spending" tabs={[{ id: 'category', label: 'By category' }, { id: 'person', label: 'By person' }]} value={tab} onChange={setTab}>
                {tab === 'category' ? <BarList caption="Spending by category, October 2026" rows={SPENDING_BY_CATEGORY} /> : <StackedBar caption="Spending by person, October 2026" rows={SPENDING_BY_PERSON} />}
              </Tabs>
            </div>
          )}
        </Region>
      )}
    </Frame>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 6. Approve a kid's request: pending (not optimistic), the tick, a toast with Undo; decline; all caught up
// ---------------------------------------------------------------------------------------------------------------
function RequestScenario(props: ScenarioProps): JSX.Element {
  const ivy = personById('ivy')
  const [status, setStatus] = useState<'waiting' | 'approved' | 'declined'>('waiting')
  const [failure, setFailure] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const heading = useRef<HTMLHeadingElement | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const approveRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (props.run) approveRef.current = root.current?.querySelector<HTMLElement>('[data-variant="primary"]') ?? null
  }, [props.run])
  useRunOnce(props.run && props.outcome === 'results' ? true : undefined, approveRef, undefined, 350)

  if (props.outcome === 'empty') {
    return (
      <Frame id="request">
        <EmptyState kind="cleared" title="All caught up" headingLevel={4}>
          New requests show here as they come in.
        </EmptyState>
      </Frame>
    )
  }

  return (
    <div ref={root} style={{ display: 'contents' }}>
    <Frame id="request">
      <RequestCard
        kid={ivy}
        pence={500}
        reason="For the school trip to the science museum"
        when="2 hours ago"
        status={status}
        tick={tick}
        headingRef={(el) => {
          heading.current = el
        }}
        message={failure ? <InlineMessage tone="error" title="Not approved">{failure}</InlineMessage> : null}
        onApprove={async (signal) => {
          setFailure(null)
          await request(props, true, true, signal)
        }}
        onApproved={() => {
          setStatus('approved')
          setTick((t) => t + 1)
          requestAnimationFrame(() => heading.current?.focus())
          toast('Approved £5.00 for Ivy.', {
            tone: 'success',
            duration: 10000,
            action: {
              label: 'Undo',
              onClick: () => {
                setStatus('waiting')
                setTick(0)
                announce('Undone. Ivy’s request is waiting again.')
              },
            },
          })
        }}
        onApproveError={(e) => setFailure(failureText(e, 'approve Ivy’s request', 'Nothing was sent.'))}
        onDecline={() => {
          setStatus('declined')
          requestAnimationFrame(() => heading.current?.focus())
          toast('Declined Ivy’s request.', { tone: 'info', duration: 10000, action: { label: 'Undo', onClick: () => setStatus('waiting') } })
        }}
      />
      {status !== 'waiting' ? (
        <Button variant="quiet" onClick={() => { setStatus('waiting'); setTick(0) }}>
          Reset the request
        </Button>
      ) : null}
    </Frame>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 7. Budget: edit in a dialog (pending inside, error inside, the meter redraws), overspend banner
// ---------------------------------------------------------------------------------------------------------------
function BudgetScenario(props: ScenarioProps): JSX.Element {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (props.run) setOpen(true)
  }, [props.run])
  const [limit, setLimit] = useState(40000)
  const groceries = BUDGETS[0]
  const over = groceries.spent > limit
  return (
    <Frame id="budget">
      {over ? (
        <Banner tone="warning" title="Groceries is over budget">
          {formatPence(groceries.spent)} spent of {formatPence(limit)} this month.
        </Banner>
      ) : null}
      <BudgetMeter category="Groceries" spent={groceries.spent} limit={limit} onEdit={() => setOpen(true)} />
      <BudgetMeter category="Home" spent={BUDGETS[2].spent} limit={BUDGETS[2].limit} />
      <p className="sys-note">Try a limit of 300 to see the near and over states, or Fail latency for the error inside the dialog.</p>
      <BudgetDialog
        open={open}
        onClose={() => setOpen(false)}
        latency={props.network === 'offline' ? 'fail' : props.latency}
        inline={props.run}
        autoSave={props.run}
        onSaved={(pence) => {
          setLimit(pence)
          announce(`Groceries budget saved: ${formatPence(pence)}`)
        }}
      />
    </Frame>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 8. Sign in with the passcode: checking, wrong with tries left, locked, Face ID
// ---------------------------------------------------------------------------------------------------------------
function SignInScenario(props: ScenarioProps): JSX.Element {
  const [code, setCode] = useState('')
  const [tries, setTries] = useState(3)
  const [state, setState] = useState<'idle' | 'busy' | 'wrong' | 'failed' | 'in'>('idle')
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const locked = tries === 0
  const ran = useRef(false)
  useEffect(() => {
    if (!props.run || ran.current) return
    ran.current = true
    const timer = window.setTimeout(() => {
      setCode('111111')
      void check('111111')
    }, 250)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.run])

  async function check(v: string): Promise<void> {
    setState('busy')
    try {
      await request(props, true, true)
      if (v === '123456') setState('in')
      else {
        setTries((t) => t - 1)
        setState('wrong')
        setCode('')
        announce('That passcode is not right.', 'assertive')
        requestAnimationFrame(() => input.current?.focus())
      }
    } catch {
      setState('failed')
      setCode('')
      requestAnimationFrame(() => input.current?.focus())
    }
  }

  if (state === 'in') {
    return (
      <Frame id="sign-in">
        <InlineMessage tone="success" title="Signed in">
          Home opens here, with focus on its heading.
        </InlineMessage>
        <Button onClick={() => { setState('idle'); setCode(''); setTries(3) }}>Sign out</Button>
      </Frame>
    )
  }

  return (
    <Frame id="sign-in">
      <Field
        id={id}
        label="Enter your passcode"
        hint="Sample: 123456 is right; anything else is wrong"
        message={state === 'wrong' && !locked ? { tone: 'negative', text: `That passcode is not right. ${tries} ${tries === 1 ? 'try' : 'tries'} left.` } : state === 'failed' ? { tone: 'negative', text: 'Could not reach Kitty. Check your connection, then try again.' } : null}
      >
        {(d) => (
          <CodeInput
            ref={input}
            id={id}
            value={code}
            busy={state === 'busy'}
            locked={locked}
            invalid={state === 'wrong' || state === 'failed'}
            describedBy={d}
            onChange={(v) => {
              setCode(v)
              if (state !== 'busy') setState('idle')
            }}
            onComplete={(v) => void check(v)}
          />
        )}
      </Field>
      {locked ? (
        <InlineMessage tone="error" title="Too many tries">
          Try again in 5 minutes, or use Face ID. (sample time)
        </InlineMessage>
      ) : null}
      <div className="k-row">
        <Button onClick={() => setState('in')}>Use Face ID</Button>
        <a className="k-link" href="#forgot">
          Forgot passcode
        </a>
      </div>
    </Frame>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 9. Live balance: someone else spends; the balance swaps once; rows wait behind "N new" while the person reads
// ---------------------------------------------------------------------------------------------------------------
const LIVE: readonly Transaction[] = [
  { id: 'l1', date: 'Today', payee: 'Pret A Manger', person: 'sam', category: 'Fun', pence: -680 },
  { id: 'l2', date: 'Today', payee: 'Co-op', person: 'ada', category: 'Groceries', pence: -1240 },
  { id: 'l3', date: 'Today', payee: 'Bus fare', person: 'theo', category: 'Transport', pence: -175 },
  { id: 'l4', date: 'Today', payee: 'Refund: Argos', person: 'ada', category: 'Home', pence: 2500 },
]

function LiveScenario(props: ScenarioProps): JSX.Element {
  const [balance, setBalance] = useState(BALANCE_PENCE)
  const [rows, setRows] = useState<readonly Transaction[]>(TRANSACTIONS.slice(0, 4))
  const [buffer, setBuffer] = useState<readonly Transaction[]>([])
  const [paused, setPaused] = useState(false)
  const [newIds, setNewIds] = useState<readonly string[]>([])
  const [updated, setUpdated] = useState('Updated just now')
  const next = useRef(0)
  const offline = props.network === 'offline'

  useEffect(() => {
    if (offline) {
      setUpdated('Updated 12 min ago')
      return
    }
    setUpdated('Updated just now')
    if (paused) return
    const timer = window.setInterval(() => {
      const item = { ...LIVE[next.current % LIVE.length], id: `live-${next.current}` }
      next.current += 1
      setBalance((b) => b + item.pence)
      setBuffer((b) => [item, ...b])
      announce(`${personById(item.person).name} ${item.pence < 0 ? 'spent' : 'got'} ${formatPence(item.pence)} at ${item.payee}`)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [offline, paused])

  return (
    <Frame id="live">
      {offline ? (
        <Banner tone="warning" scope="global" title="You’re not connected">
          You can look around. Money cannot move until you’re back.
        </Banner>
      ) : null}
      <BalanceCard label="Family kitty" pence={balance} members={PEOPLE.map((p, i) => ({ person: p, spentPence: [40210, 32010, 6400, 5590][i] }))} inPence={140000} outPence={84210} updated={updated} stale={offline} />
      <div className="k-row" style={{ justifyContent: 'space-between' }}>
        {buffer.length ? (
          <Button
            onClick={() => {
              setRows((r) => [...buffer, ...r].slice(0, 8))
              setNewIds(buffer.map((b) => b.id))
              announce(`${buffer.length} new transaction${buffer.length === 1 ? '' : 's'} shown`)
              setBuffer([])
            }}
          >
            {buffer.length} new transaction{buffer.length === 1 ? '' : 's'}
          </Button>
        ) : (
          <span className="sys-note">{offline ? 'Paused while not connected.' : paused ? 'Live updates paused.' : 'Someone spends every 5 seconds.'}</span>
        )}
        <Switch label="Live updates" checked={!paused} onChange={(on) => setPaused(!on)} />
      </div>
      <ul className="k-list">
        {rows.map((row) => (
          <li key={row.id} style={newIds.includes(row.id) ? { animation: 'k-row-in var(--dur-list-in) var(--ease-enter), k-row-glow calc(var(--hold-success) + var(--dur-highlight-fade)) linear' } : undefined}>
            <TransactionRow row={row} />
          </li>
        ))}
      </ul>
    </Frame>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 10. First use: name the household, invite family, the empty kitty
// ---------------------------------------------------------------------------------------------------------------
function FirstUseScenario(props: ScenarioProps): JSX.Element {
  const [name, setName] = useState('')
  const [invites, setInvites] = useState(['', ''])
  const [submitted, setSubmitted] = useState(false)
  const [created, setCreated] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const summary = useRef<HTMLDivElement>(null)
  const nameId = useId()
  const errors = [
    !name.trim() ? { fieldId: nameId, text: 'Enter a name for your household' } : null,
    ...invites.map((v, i) => (v.trim() && !/@|^0\d{9,10}$/.test(v.replace(/\s/g, '')) ? { fieldId: `${nameId}-inv-${i}`, text: 'Email address must include @, like sam@example.com' } : null)),
  ].filter(Boolean) as { fieldId: string; text: string }[]
  const count = invites.filter((v) => v.trim()).length
  const createRef = useRef<HTMLButtonElement>(null)
  useRunOnce(props.run, createRef, () => {
    setName('The Okafor home')
    setInvites(['sam@example.com', 'theo@example.com'])
  }, 300)

  if (created) {
    return (
      <Frame id="first-use">
        <BalanceCard
          label={name || 'Family kitty'}
          pence={0}
          members={[]}
          inPence={0}
          outPence={0}
          updated="Updated just now"
          action={<Button variant="primary">Add money</Button>}
        />
        <div className="k-row">
          {invites.filter((v) => v.trim()).map((v, i) => (
            <PersonTag key={v} person={{ id: v, name: v.split('@')[0], role: 'parent', colour: ((i + 2) as 2 | 3), invited: true }} />
          ))}
        </div>
        <Button variant="quiet" onClick={() => { setCreated(false); setSubmitted(false) }}>
          Start again
        </Button>
      </Frame>
    )
  }

  return (
    <Frame id="first-use">
      <h4 style={{ margin: 0, fontSize: 'var(--step-2)' }}>Name your household</h4>
      <p style={{ margin: 0 }} className="k-muted">You can invite family next.</p>
      {submitted && errors.length > 1 ? <ErrorSummary ref={summary} errors={errors} /> : null}
      <Field id={nameId} label="Household name" hint="40 characters or fewer" message={submitted && !name.trim() ? { tone: 'negative', text: 'Enter a name for your household' } : null}>
        {(d) => <TextInput id={nameId} value={name} onChange={(e) => setName(e.target.value)} aria-describedby={d} invalid={submitted && !name.trim()} placeholder="The Okafor home" />}
      </Field>
      <fieldset className="k-fieldset">
        <legend style={{ fontSize: 'var(--step-0)' }}>Invite family (optional)</legend>
        {invites.map((value, i) => {
          const fid = `${nameId}-inv-${i}`
          const bad = submitted && errors.some((e) => e.fieldId === fid)
          return (
            <Field key={i} id={fid} label={`Email address or phone, person ${i + 1}`} message={bad ? { tone: 'negative', text: 'Email address must include @, like sam@example.com' } : null}>
              {(d) => <TextInput id={fid} value={value} invalid={bad} aria-describedby={d} placeholder="sam@example.com" onChange={(e) => setInvites((all) => all.map((x, j) => (j === i ? e.target.value : x)))} />}
            </Field>
          )
        })}
      </fieldset>
      <div>
        <ActionButton
          ref={createRef}
          variant="primary"
          pendingLabel={count ? `Sending ${count} invite${count === 1 ? '' : 's'}…` : 'Creating…'}
          slowLabel={count ? 'Still sending invites…' : 'Still creating…'}
          successLabel={count ? 'Invites sent' : 'Created'}
          errorMessage={(e) => (isInvalid(e) ? 'There is a problem with the form.' : failureText(e, 'create the household', 'Everything you typed is still here.'))}
          onAction={async (signal) => {
            setSubmitted(true)
            setFailure(null)
            if (errors.length) {
              requestAnimationFrame(() => (errors.length > 1 ? summary.current : document.getElementById(errors[0].fieldId))?.focus())
              throw invalid()
            }
            await request(props, true, true, signal)
          }}
          onSuccess={() => setCreated(true)}
          onError={(e) => setFailure(isInvalid(e) ? null : failureText(e, 'create the household', 'Everything you typed is still here.'))}
        >
          {count ? `Create and send ${count} invite${count === 1 ? '' : 's'}` : 'Create household'}
        </ActionButton>
      </div>
      {failure ? <InlineMessage tone="error" title="Not created">{failure}</InlineMessage> : null}
    </Frame>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 11. Not connected and sync: category changes queue as "Waiting to send", money moves wait for the network
// ---------------------------------------------------------------------------------------------------------------
function OfflineScenario(props: ScenarioProps): JSX.Element {
  const [rows, setRows] = useState<Transaction[]>(TRANSACTIONS.slice(0, 3).map((t) => ({ ...t, status: undefined })))
  const [syncing, setSyncing] = useState(false)
  const [back, setBack] = useState(false)
  const offline = props.network === 'offline'
  const queued = rows.filter((r) => r.status === 'waiting').length
  const wasOffline = useRef(offline)
  const sendRef = useRef<HTMLButtonElement>(null)
  const [sendFailure, setSendFailure] = useState<string | null>(null)
  useRunOnce(props.run, sendRef)

  useEffect(() => {
    if (offline) {
      wasOffline.current = true
      setBack(false)
      return
    }
    if (!wasOffline.current) return
    wasOffline.current = false
    if (queued === 0) return
    const controller = new AbortController()
    setSyncing(true)
    simulate(props.latency, true, controller.signal)
      .then(() => {
        setRows((all) => all.map((r) => (r.status === 'waiting' ? { ...r, status: undefined } : r)))
        setBack(true)
        toast('All changes sent', { tone: 'success' })
      })
      .catch(() => {
        if (!controller.signal.aborted) setRows((all) => all.map((r) => (r.status === 'waiting' ? { ...r, status: 'failed' } : r)))
      })
      .finally(() => setSyncing(false))
    return () => controller.abort()
  }, [offline, props.latency, queued])

  function recategorise(id: string): void {
    setRows((all) => all.map((r) => (r.id === id ? { ...r, category: r.category === 'Groceries' ? 'Home' : 'Groceries', status: offline ? 'waiting' : undefined } : r)))
  }

  return (
    <Frame id="offline">
      {offline ? (
        <Banner tone="warning" scope="global" title="You’re not connected">
          You can look around. Money cannot move until you’re back.
        </Banner>
      ) : back ? (
        <Banner tone="positive" scope="global" title="You’re back">
          Changes sent.
        </Banner>
      ) : null}
      <p className="sys-note">Switch Network to Offline, change a category (it queues), then switch back online.</p>
      <ul className="k-list">
        {rows.map((row) => (
          <li key={row.id} className="k-stack" style={{ gap: 0 }}>
            <TransactionRow row={row} onRetry={() => setRows((all) => all.map((r) => (r.id === row.id ? { ...r, status: undefined } : r)))} />
            <div style={{ paddingInlineStart: 'calc(40px + var(--space-6))' }}>
              <Button variant="quiet" size="sm" onClick={() => recategorise(row.id)}>
                Move to {row.category === 'Groceries' ? 'Home' : 'Groceries'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {syncing ? <p className="sys-note" aria-live="polite">Sending {queued} change{queued === 1 ? '' : 's'}…</p> : null}
      <div className="k-stack">
        <div>
          <ActionButton
            ref={sendRef}
            variant="primary"
            pendingLabel="Sending…"
            slowLabel="Still sending…"
            successLabel="Sent"
            successMessage="Sent £20.00 to Sam"
            errorMessage={(e) => failureText(e, 'send £20.00 to Sam', 'Nothing left the kitty.')}
            onAction={async (signal) => {
              setSendFailure(null)
              await request(props, true, true, signal)
            }}
            onError={(e) => setSendFailure(failureText(e, 'send £20.00 to Sam', 'Nothing left the kitty.'))}
          >
            Send £20.00 to Sam
          </ActionButton>
        </div>
        {sendFailure ? (
          <InlineMessage tone="error" title="Not sent">
            {sendFailure}
          </InlineMessage>
        ) : offline ? (
          <span className="k-field__hint">You’re not connected. Money can move once you’re back.</span>
        ) : null}
      </div>
    </Frame>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 12. Settings switches: optimistic, a spinner after the delay, flips back with "Not saved" on failure
// ---------------------------------------------------------------------------------------------------------------
function SettingsScenario(props: ScenarioProps): JSX.Element {
  const [values, setValues] = useState<Record<string, boolean>>({ faceId: false, requests: true, hide: false })
  const [pending, setPending] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const ran = useRef(false)
  useEffect(() => {
    if (!props.run || ran.current) return
    ran.current = true
    const t = window.setTimeout(() => void change('faceId', true), 250)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.run])

  async function change(key: string, next: boolean): Promise<void> {
    setValues((v) => ({ ...v, [key]: next }))
    setFailed(null)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPending(key), 400)
    try {
      await request(props, true, true)
    } catch {
      setValues((v) => ({ ...v, [key]: !next }))
      setFailed(key)
      announce('Not saved. Try again.')
    } finally {
      window.clearTimeout(timer.current)
      setPending(null)
    }
  }

  const row = (key: string, label: string, hint: string): JSX.Element => (
    <div>
      <Switch label={label} hint={hint} checked={values[key]} pending={pending === key} onChange={(next) => void change(key, next)} />
      {failed === key ? (
        <p className="k-field__msg" data-tone="negative">
          Not saved. Try again.
        </p>
      ) : null}
    </div>
  )

  return (
    <Frame id="settings">
      {row('faceId', 'Face ID', 'Use Face ID instead of your passcode')}
      {row('requests', 'Notify me when a kid asks for money', 'A notification on this phone')}
      {row('hide', 'Hide balances', 'Show £•••• until you tap')}
    </Frame>
  )
}

export const SCENARIOS: readonly ScenarioEntry[] = [
  {
    id: 'send-money',
    title: 'Send money',
    summary: 'Choose who, the amount and a note; check it; send. Ends on a confirmation step.',
    watch: 'Continue with nothing: the summary takes focus. Over £1,284.50: the amount error. Slow: “Sending…” at 400 ms. Fail or offline: “Could not send … Nothing left the kitty.” beside the button, all input kept. Success: the confirmation heading takes focus.',
  },
  {
    id: 'split',
    title: 'Split a bill',
    summary: 'Who is in (Ada paid, so she is locked in), equal or custom shares that must add up.',
    watch: 'Custom shares that do not add up: the remainder warns live and Split explains. Success: each share becomes “Owes £21.00”, Ada “Paid”.',
  },
  {
    id: 'allowance',
    title: 'Top up an allowance',
    summary: 'The named envelope: top up with pending, the tick and a 10 s Undo; Empty outcome shows the set-up state.',
    watch: 'Slow: “Topping up…”, then the saved amount rises, the tick plays and a toast offers Undo for 10 s. Fail: the reason inside the card. Empty: “Give Ivy a regular allowance” with one primary action.',
  },
  {
    id: 'activity',
    title: 'Search and filter activity',
    summary: 'Search and a person filter over the transactions table.',
    watch: 'First load: skeleton rows after 400 ms. Later searches: the table stays and a bar runs along the top. Empty: “No transactions match” with the filters echoed and Clear filters. Fail: the error replaces the table, filters kept. Stalled: at 8 s “Still loading activity” over the skeleton; at 10 s Cancel, which stops the search and keeps the filters.',
  },
  {
    id: 'analytics',
    title: 'Spending analytics',
    summary: 'KPI tiles and charts in one region; a period change refreshes it in place.',
    watch: 'Slow: chart skeletons with the data track. Changing the period keeps the old charts and shows the bar. Empty: “Nothing spent this month yet”. Bars grow once on first view, never under reduced motion. Stalled: at 8 s “Still loading spending”; at 10 s Cancel, which returns to the start or to the charts you had.',
  },
  {
    id: 'request',
    title: 'Approve a kid’s request',
    summary: 'Not optimistic: it moves money and tells Ivy.',
    watch: 'Slow: “Approving…” in the button; Decline unavailable with “Wait for the approval to finish”. Success: the tick, “Approved”, focus on the card heading, a toast with Undo for 10 s. Fail: the request stays waiting with the reason in the card. Empty: “All caught up”.',
  },
  {
    id: 'budget',
    title: 'Adjust a budget',
    summary: 'Edit the limit in a dialog; the meter redraws; over the limit raises the section banner.',
    watch: 'The run opens the editor in place with £300.00 and presses Save. Slow: “Saving…” inside it. Fail: the error stays inside it, the value kept. Success: it closes, the meter moves to the new limit, “£12.40 over” and the banner appear.',
  },
  {
    id: 'sign-in',
    title: 'Sign in with the passcode',
    summary: 'Six digits, paste anywhere; the check runs on the sixth digit.',
    watch: 'Wrong code: the boxes clear, the error says how many tries are left, focus returns. Three wrong: locked with Face ID offered. Fail or offline: “Could not reach Kitty”. 123456 signs in.',
  },
  {
    id: 'live',
    title: 'Live balance',
    summary: 'Someone else spends every 5 s.',
    watch: 'The balance swaps once per change (no count-up). Rows never move by themselves: a “N new transactions” button collects them and inserts them with a short highlight. Offline: the banner, “Updated 12 min ago”. Live updates can be paused.',
  },
  {
    id: 'first-use',
    title: 'First use',
    summary: 'Name the household and invite family; the empty kitty follows.',
    watch: 'Submit empty: the field error takes focus (two or more errors: the summary). Slow: “Sending 2 invites…”. Success: the empty Balance card with Add money and the invited people tagged “Invited”.',
  },
  {
    id: 'offline',
    title: 'Not connected and sync',
    summary: 'Low-stakes changes queue; money moves wait for the network.',
    watch: 'Offline: the global banner; a category change shows “Waiting to send”; Send fails at once with “Not sent. You’re not connected…” beside it. Back online: “Sending 1 change…”, then “All changes sent” and the back banner. A failed sync shows “Not sent” with Try again and Discard.',
  },
  {
    id: 'settings',
    title: 'Settings switches',
    summary: 'Optimistic: the switch is the result.',
    watch: 'The run turns Face ID on. Any latency: the switch is on at once; on slow a spinner joins it after 400 ms. Fail or offline: it flips back to off and “Not saved. Try again.” appears under it.',
  },
]

export const SCENARIO_DEMOS: Readonly<Record<string, ComponentType<ScenarioProps>>> = {
  'send-money': SendMoneyScenario,
  split: SplitScenario,
  allowance: AllowanceScenario,
  activity: ActivityScenario,
  analytics: AnalyticsScenario,
  request: RequestScenario,
  budget: BudgetScenario,
  'sign-in': SignInScenario,
  live: LiveScenario,
  'first-use': FirstUseScenario,
  offline: OfflineScenario,
  settings: SettingsScenario,
}
