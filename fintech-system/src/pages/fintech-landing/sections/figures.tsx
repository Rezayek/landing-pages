/**
 * The four figures of the pinned story (UX.md S2-S5), each the real system component with sample data. The story
 * shows them in its sticky panel on wide screens and under each step's text on phones.
 */
import { type JSX, useRef, useState } from 'react'
import { announce } from '@/system/feedback'
import {
  AllowanceCard,
  Amount,
  BalanceCard,
  BarList,
  BudgetMeter,
  PEOPLE,
  PersonTag,
  RequestCard,
  SegmentedControl,
  SPENDING_BY_CATEGORY,
  SPENDING_BY_PERSON,
  StackedBar,
  Tabs,
  formatPence,
  personById,
} from '@/system/ui'
import { BALANCE_PENCE, BILL, GROCERIES_BUDGET, IVY_ALLOWANCE, KITTY_MEMBERS, MONEY_IN_PENCE, MONEY_OUT_PENCE, THEO_REQUEST } from '../data'
import { wait } from '@/system/latency'

/** S2: the kitty card (the hand-off: the hero's £1,284.50). */
export function KittyFigure(): JSX.Element {
  return <BalanceCard label="In the kitty" pence={BALANCE_PENCE} members={KITTY_MEMBERS} inPence={MONEY_IN_PENCE} outPence={MONEY_OUT_PENCE} updated="Updated just now" />
}

/** S3 (A9): toggle who's in; the shares recompute in place. Ada paid, so she stays in. */
export function SplitFigure(): JSX.Element {
  const [inBill, setInBill] = useState<readonly string[]>(PEOPLE.map((p) => p.id))
  const payer = personById(BILL.paidBy)
  const equal = Math.floor(BILL.pence / inBill.length)
  // The payer absorbs the odd penny, so the shares always add up to the bill.
  const share = (id: string): number => (id === BILL.paidBy ? BILL.pence - equal * (inBill.length - 1) : equal)

  function toggle(id: string): void {
    if (id === BILL.paidBy) return
    const next = inBill.includes(id) ? inBill.filter((x) => x !== id) : PEOPLE.map((p) => p.id).filter((x) => x === id || inBill.includes(x))
    setInBill(next)
    announce(next.length === 1 ? `${payer.name} pays all ${formatPence(BILL.pence)}.` : `Split ${next.length} ways: ${formatPence(Math.floor(BILL.pence / next.length))} each.`)
  }

  return (
    <article className="k-card fl-split" aria-label={`${BILL.payee} bill`}>
      <p className="fl-split__bill">
        <strong>{BILL.payee}</strong> · <Amount pence={BILL.pence} /> · paid by {payer.name}
      </p>
      <fieldset className="k-fieldset">
        <legend className="fl-split__legend">Who’s in this bill?</legend>
        <p className="k-field__hint">Tap a name to take them out of the split.</p>
        <div className="k-row">
          {PEOPLE.map((p) => (
            <PersonTag key={p.id} person={p} pressed={inBill.includes(p.id)} lockedReason={p.id === BILL.paidBy ? `${payer.name} paid, so she’s in` : undefined} onToggle={() => toggle(p.id)} />
          ))}
        </div>
      </fieldset>
      <ul className="fl-split__shares">
        {inBill.map((id) => (
          <li key={id}>
            <span>{personById(id).name}</span>
            <Amount pence={share(id)} live />
          </li>
        ))}
      </ul>
      <p className="k-field__msg" data-tone="positive">
        {inBill.length === 1 ? `${payer.name} pays all ${formatPence(BILL.pence)}.` : `All ${formatPence(BILL.pence)} shared`}
      </p>
    </article>
  )
}

/** S4 (A10): Ivy's envelope, seen by Ada or by Ivy. */
export function PocketFigure(): JSX.Element {
  const [view, setView] = useState('ada')
  const ivy = personById('ivy')
  return (
    <div className="fl-pocket">
      <SegmentedControl
        label="Whose view"
        value={view}
        onChange={(next) => {
          setView(next)
          announce(next === 'ivy' ? 'Showing Ivy’s view.' : 'Showing Ada’s view.')
        }}
        options={[
          { id: 'ada', label: 'View as Ada' },
          { id: 'ivy', label: 'View as Ivy' },
        ]}
      />
      <div className="fl-view" data-view={view}>
        <AllowanceCard kid={ivy} amount={IVY_ALLOWANCE.amount} rhythm={IVY_ALLOWANCE.rhythm} next={IVY_ALLOWANCE.next} spent={IVY_ALLOWANCE.spent} saved={IVY_ALLOWANCE.saved} kidView={view === 'ivy'} />
      </div>
    </div>
  )
}

/** The kids-ask step (A17): Theo's request, live; approve plays the tick, decline says who decided. Sample: nothing moves. */
export function AskFigure(): JSX.Element {
  const [status, setStatus] = useState<'waiting' | 'approved' | 'declined'>('waiting')
  const [tick, setTick] = useState(0)
  const heading = useRef<HTMLHeadingElement | null>(null)
  const theo = personById(THEO_REQUEST.kid)
  return (
    <div className="fl-ask">
      <RequestCard
        kid={theo}
        pence={THEO_REQUEST.pence}
        reason={THEO_REQUEST.reason}
        when={THEO_REQUEST.when}
        status={status}
        tick={tick}
        onApprove={(signal) => wait(600, signal)}
        headingRef={(el) => {
          heading.current = el
        }}
        onApproved={() => {
          setTick((n) => n + 1)
          setStatus('approved')
          // The buttons have gone: focus moves to the card's heading (COMPONENTS.md, Request card)
          requestAnimationFrame(() => heading.current?.focus())
          announce(`Approved ${formatPence(THEO_REQUEST.pence)} for ${theo.name}.`)
        }}
        onDecline={() => {
          setStatus('declined')
          requestAnimationFrame(() => heading.current?.focus())
          announce(`Declined. ${theo.name} sees “Sam said no this time”.`)
        }}
        message={status === 'declined' ? `${theo.name} sees “Sam said no this time”.` : status === 'approved' ? `${formatPence(THEO_REQUEST.pence)} is in ${theo.name}’s pocket money.` : undefined}
      />
      {status !== 'waiting' ? (
        <button type="button" className="k-link fl-reset" onClick={() => setStatus('waiting')}>
          Reset the sample
        </button>
      ) : null}
    </div>
  )
}

/** S5 (A11): spending by category or by person, and the budget line that went over. `run` replays the bars. */
export function WhereFigure({ run = 0 }: { run?: number }): JSX.Element {
  const [tab, setTab] = useState('category')
  return (
    <article className="k-card" aria-label="Spending, October (sample)">
      <Tabs
        label="Spending"
        tabs={[
          { id: 'category', label: 'By category' },
          { id: 'person', label: 'By person' },
        ]}
        value={tab}
        onChange={setTab}
      >
        {tab === 'category' ? (
          <BarList key={run} caption="Spending by category, October (sample)" rows={SPENDING_BY_CATEGORY} />
        ) : (
          <StackedBar key={run} caption="Spending by person, October (sample)" rows={SPENDING_BY_PERSON} />
        )}
      </Tabs>
      <div className="fl-budget">
        <BudgetMeter category={GROCERIES_BUDGET.category} spent={GROCERIES_BUDGET.spent} limit={GROCERIES_BUDGET.limit} />
      </div>
    </article>
  )
}
