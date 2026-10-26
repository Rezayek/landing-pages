/**
 * Kitty's data display (COMPONENTS.md: Banner, Table, List row, Description list, KPI tile, Balance card, Budget
 * meter, Allowance card, Request card, Filter bar, Dashboard grid, Accordion, Error page). Money is always Amount;
 * who is always a name beside the person colour; status is always icon, word and colour.
 */
import { useId, useState, type CSSProperties, type JSX, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Bus,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  Gamepad2,
  House,
  Pencil,
  Receipt,
  School,
  ShoppingBasket,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { ActionButton, Skeleton } from '../feedback'
import { Amount, Avatar, Button, ButtonGroup, Card, Icon, IconButton, Logo, PersonDot, StatusTag, TONE_ICON, Tick, type Tone } from './core'
import { MenuButton } from './overlays'
import { formatPence, personById, type Category, type Person, type Transaction } from './sample'

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  Groceries: ShoppingBasket,
  Bills: Zap,
  School,
  Transport: Bus,
  Fun: Gamepad2,
  Allowance: Banknote,
  Income: Banknote,
  Home: House,
}

/* Banner ---------------------------------------------------------------------------------------------------------- */

export interface BannerProps {
  tone?: Exclude<Tone, 'neutral'>
  scope?: 'global' | 'page' | 'section'
  title: string
  children?: ReactNode
  action?: ReactNode
  onDismiss?: () => void
}

/** A condition that persists over an area. One at a time; never for the result of one action (InlineMessage). */
export function Banner({ tone = 'info', scope = 'section', title, children, action, onDismiss }: BannerProps): JSX.Element {
  return (
    <div className="k-banner" data-tone={tone} data-scope={scope} role={scope === 'global' && tone === 'negative' ? 'alert' : 'status'}>
      <Icon icon={TONE_ICON[tone]} />
      <div className="k-stack" style={{ gap: 'var(--space-1)' }}>
        <p className="k-banner__title">{title}</p>
        {children ? <p className="k-banner__body">{children}</p> : null}
        {action ? <div className="k-row">{action}</div> : null}
      </div>
      {onDismiss ? <IconButton icon={X} label="Dismiss" onClick={onDismiss} /> : <span />}
    </div>
  )
}

/* Table and rows -------------------------------------------------------------------------------------------------- */

export type SortKey = 'date' | 'amount'

export interface TransactionTableProps {
  caption: string
  rows: readonly Transaction[]
  hiddenCaption?: boolean
  selectable?: boolean
  selected?: readonly string[]
  onSelect?: (id: string) => void
  sort?: { key: SortKey; dir: 'asc' | 'desc' }
  onSort?: (key: SortKey) => void
  newIds?: readonly string[]
  rowActions?: boolean
}

export function TransactionTable({ caption, rows, hiddenCaption, selected = [], sort, onSort, newIds = [], rowActions = true }: TransactionTableProps): JSX.Element {
  const sortAttr = (key: SortKey): 'ascending' | 'descending' | undefined => (sort?.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined)
  const SortIcon = sort?.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <div className="k-table-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table className="k-table">
        <caption className={hiddenCaption ? 'k-sr' : undefined}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={sortAttr('date')}>
              {onSort ? (
                <button type="button" className="k-sort" onClick={() => onSort('date')}>
                  Date {sort?.key === 'date' ? <SortIcon className="k-icon" data-size="sm" aria-hidden="true" /> : null}
                </button>
              ) : (
                'Date'
              )}
            </th>
            <th scope="col">Payee</th>
            <th scope="col">Person</th>
            <th scope="col">Category</th>
            <th scope="col" data-num aria-sort={sortAttr('amount')}>
              {onSort ? (
                <button type="button" className="k-sort" onClick={() => onSort('amount')}>
                  Amount {sort?.key === 'amount' ? <SortIcon className="k-icon" data-size="sm" aria-hidden="true" /> : null}
                </button>
              ) : (
                'Amount'
              )}
            </th>
            {rowActions ? (
              <th scope="col">
                <span className="k-sr">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const person = personById(row.person)
            const CategoryIcon = CATEGORY_ICON[row.category]
            return (
              <tr key={row.id} aria-selected={selected.includes(row.id) || undefined} data-new={newIds.includes(row.id) || undefined}>
                <td className="k-muted" style={{ whiteSpace: 'nowrap' }}>
                  {row.date}
                </td>
                <td>
                  <span className="k-cell-payee">
                    <CategoryIcon className="k-icon" aria-hidden="true" />
                    <a href={`#transaction-${row.id}`}>{row.payee}</a>
                    {row.status === 'pending' ? <StatusTag tone="neutral">Pending</StatusTag> : null}
                    {row.status === 'waiting' ? <StatusTag tone="warning">Waiting to send</StatusTag> : null}
                    {row.status === 'failed' ? <StatusTag tone="negative">Not sent</StatusTag> : null}
                  </span>
                </td>
                <td>
                  <span className="k-cell-person">
                    <Avatar person={person} size={24} decorative />
                    {person.name}
                  </span>
                </td>
                <td>{row.category}</td>
                <td data-num>
                  <Amount pence={row.pence} signed pending={row.status === 'pending'} />
                </td>
                {rowActions ? (
                  <td style={{ inlineSize: 'var(--control-h)' }}>
                    <MenuButton
                      align="end"
                      items={[
                        { id: 'split', label: 'Split this bill' },
                        { id: 'category', label: 'Change category' },
                        { id: 'receipt', label: 'Add a receipt', icon: Receipt },
                        { id: 'report', label: 'Report a problem', separatorBefore: true },
                      ]}
                      trigger={(props) => (
                        <button type="button" className="k-iconbtn" aria-label={`More actions for ${row.payee}`} {...props}>
                          <Ellipsis className="k-icon" aria-hidden="true" />
                        </button>
                      )}
                    />
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** The skeleton of TransactionTable, from the same table, header and row height, so the swap moves nothing. */
export function TransactionTableSkeleton({ rows = 6 }: { rows?: number }): JSX.Element {
  return (
    <div className="k-table-wrap" aria-hidden="true">
      <table className="k-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Payee</th>
            <th scope="col">Person</th>
            <th scope="col">Category</th>
            <th scope="col" data-num>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              <td>
                <Skeleton variant="rect" width="4.5rem" height={12} />
              </td>
              <td>
                <Skeleton variant="rect" width="7rem" height={12} />
              </td>
              <td>
                <span className="k-cell-person">
                  <Skeleton variant="circle" width={24} height={24} />
                  <Skeleton variant="rect" width="2.5rem" height={12} />
                </span>
              </td>
              <td>
                <Skeleton variant="rect" width="4.5rem" height={12} />
              </td>
              <td data-num>
                <Skeleton variant="rect" width="4rem" height={12} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The skeleton of a list of TransactionRows: the same 40 px lead, two lines and the row height. */
export function TransactionRowsSkeleton({ rows = 6 }: { rows?: number }): JSX.Element {
  return (
    <ul className="k-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i}>
          <span className="k-list-row">
            <Skeleton variant="circle" width={40} height={40} />
            <span className="k-list-row__main">
              <span className="k-list-row__top">
                <Skeleton variant="rect" width="8rem" height={14} />
                <Skeleton variant="rect" width="4rem" height={14} />
              </span>
              <span className="k-list-row__meta">
                <Skeleton variant="rect" width="10rem" height={10} />
              </span>
            </span>
            <span style={{ inlineSize: 'var(--icon-sm)' }} />
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Activity as the screen width allows: a table where the card is wide enough for every column, the phone's two-line
 * rows where it is not (a container query), so no column is ever cut off. `skeleton` draws the same two at rest.
 */
export function TransactionList({ caption, rows, skeleton = false, skeletonRows = 6 }: { caption: string; rows: readonly Transaction[]; skeleton?: boolean; skeletonRows?: number }): JSX.Element {
  return (
    <div className="k-txlist">
      <div className="k-txlist__table">
        {skeleton ? <TransactionTableSkeleton rows={skeletonRows} /> : <TransactionTable caption={caption} hiddenCaption rows={rows} rowActions={false} />}
      </div>
      <div className="k-txlist__rows">
        {skeleton ? (
          <TransactionRowsSkeleton rows={skeletonRows} />
        ) : (
          <ul className="k-list" aria-label={caption}>
            {rows.map((row) => (
              <li key={row.id}>
                <TransactionRow row={row} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Phones and the kid view: payee and amount on line one; person, category and date on line two. */
export function TransactionRow({ row, onRetry }: { row: Transaction; onRetry?: () => void }): JSX.Element {
  const person = personById(row.person)
  const CategoryIcon = CATEGORY_ICON[row.category]
  return (
    <div style={{ display: 'grid', gap: 'var(--space-1)', minInlineSize: 0 }}>
      <a className="k-list-row" href={`#transaction-${row.id}`}>
        <span className="k-list-row__lead">
          <CategoryIcon className="k-icon" aria-hidden="true" />
        </span>
        <span className="k-list-row__main">
          <span className="k-list-row__top">
            <span className="k-list-row__title">{row.payee}</span>
            <Amount pence={row.pence} signed pending={row.status === 'pending'} />
          </span>
          <span className="k-list-row__meta">
            <PersonDot person={person} />
            {person.name} · {row.category} · {row.date}
            {row.status === 'pending' ? <StatusTag tone="neutral">Pending</StatusTag> : null}
            {row.status === 'waiting' ? <StatusTag tone="warning">Waiting to send</StatusTag> : null}
            {row.status === 'failed' ? <StatusTag tone="negative">Not sent</StatusTag> : null}
          </span>
        </span>
        <ChevronRight className="k-icon k-muted" data-size="sm" aria-hidden="true" />
      </a>
      {row.status === 'failed' && onRetry ? (
        <div className="k-row" style={{ paddingInlineStart: 'calc(40px + var(--space-6))' }}>
          <Button variant="quiet" size="sm" onClick={onRetry}>
            Try again
          </Button>
          <Button variant="danger-quiet" size="sm">
            Discard
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function DescriptionList({ items, onChange }: { items: readonly { term: string; value: ReactNode; change?: string }[]; onChange?: (term: string) => void }): JSX.Element {
  return (
    <dl className="k-dl">
      {items.map((item) => (
        <div key={item.term}>
          <dt>{item.term}</dt>
          <dd className="k-dl__value">
            <span>{item.value ?? <><span aria-hidden="true" className="k-muted">—</span><span className="k-sr">Not set</span></>}</span>
            {item.change && onChange ? (
              <button type="button" className="k-btn" data-variant="quiet" data-size="sm" onClick={() => onChange(item.term)}>
                {item.change}
              </button>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/* Figures --------------------------------------------------------------------------------------------------------- */

export interface KpiProps {
  label: string
  pence: number | null
  delta?: { text: string; tone: 'good' | 'bad' | 'none'; direction?: 'up' | 'down' }
  answer?: boolean
  action?: ReactNode
}

/** One key number with its change. Colour means good or bad; the words carry it. */
export function KpiTile({ label, pence, delta, answer, action }: KpiProps): JSX.Element {
  const headingId = useId()
  return (
    <article className="k-kpi" aria-labelledby={headingId}>
      <h3 id={headingId} className="k-kpi__label" style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </h3>
      <Amount pence={pence} size={answer ? 'xl' : 'lg'} />
      {delta ? (
        <p className="k-kpi__delta" data-tone={delta.tone === 'none' ? undefined : delta.tone}>
          {delta.direction ? <Icon icon={delta.direction === 'up' ? ArrowUp : ArrowDown} size="sm" /> : null}
          {delta.text}
        </p>
      ) : null}
      {action}
    </article>
  )
}

export interface BalanceCardProps {
  label: string
  pence: number
  members: readonly { person: Person; spentPence: number }[]
  inPence: number
  outPence: number
  updated: string
  stale?: boolean
  hidden?: boolean
  band?: boolean
  action?: ReactNode
  tick?: number
  onMember?: (person: Person) => void
}

/** The signature: the kitty and who is in it. Once per screen, at the top of Home and the kid view. */
export function BalanceCard({ label, pence, members, inPence, outPence, updated, stale, hidden, band, action, tick = 0, onMember }: BalanceCardProps): JSX.Element {
  const headingId = useId()
  return (
    <article className="k-card k-balance" data-band={band || undefined} aria-labelledby={headingId}>
      <div className="k-card__head">
        <h3 id={headingId} className="k-balance__label" style={{ fontFamily: 'var(--font-body)' }}>
          {label}
        </h3>
        {band ? <Logo markOnly tone="band" /> : null}
      </div>
      <div className="k-row" style={{ gap: 'var(--space-3)' }}>
        <Amount pence={pence} size="display" hidden={hidden} live />
        {tick ? <Tick play={tick} label="Money arrived" /> : null}
      </div>
      {members.length ? (
        <ul className="k-balance__strip" aria-label="Who spent what this month">
          {members.map(({ person, spentPence }) => (
            <li key={person.id}>
              <button type="button" className="k-member" aria-label={`${person.name}, spent ${formatPence(spentPence)} this month`} onClick={() => onMember?.(person)}>
                <Avatar person={person} size={24} decorative />
                <span aria-hidden="true">
                  {person.name} <span className="k-amount k-muted">{formatPence(spentPence)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="k-balance__flows">
        <span>
          <Amount pence={inPence} signed /> in
        </span>
        <span>
          <Amount pence={-outPence} signed /> out
        </span>
      </p>
      <div className="k-balance__foot">
        <span className={stale ? undefined : 'k-subtle'} style={{ fontSize: 'var(--step--2)', display: 'inline-flex', gap: 'var(--space-1)', alignItems: 'center' }}>
          {stale ? <StatusTag tone="warning">{updated}</StatusTag> : updated}
        </span>
        {action}
      </div>
    </article>
  )
}

export interface BudgetMeterProps {
  category: Category
  spent: number
  limit: number | null
  onEdit?: () => void
  saving?: boolean
  note?: ReactNode
}

export function budgetState(spent: number, limit: number | null): 'none' | 'ok' | 'near' | 'over' {
  if (!limit) return 'none'
  const share = spent / limit
  return share > 1 ? 'over' : share >= 0.8 ? 'near' : 'ok'
}

/** Spending against a limit: accent under 80 %, warning to 100 %, negative over, always with words. */
export function BudgetMeter({ category, spent, limit, onEdit, saving, note }: BudgetMeterProps): JSX.Element {
  const state = budgetState(spent, limit)
  const CategoryIcon = CATEGORY_ICON[category]
  const valueText = limit ? `${formatPence(spent)} of ${formatPence(limit)}` : `${formatPence(spent)}, no limit`
  return (
    <div className="k-meter" data-state={state}>
      <div className="k-meter__head">
        <span className="k-meter__name">
          <CategoryIcon className="k-icon" aria-hidden="true" />
          {category}
        </span>
        {state === 'near' ? <StatusTag tone="warning">Nearly at limit</StatusTag> : null}
        {state === 'over' && limit ? <StatusTag tone="negative">{formatPence(spent - limit)} over</StatusTag> : null}
        <span className="k-meter__value">
          <Amount pence={spent} />
          {limit ? <span className="k-muted"> of {formatPence(limit)}</span> : <span className="k-muted"> · No limit</span>}
        </span>
        {onEdit ? <IconButton icon={Pencil} label={`Edit ${category.toLowerCase()} budget`} onClick={onEdit} aria-busy={saving || undefined} /> : null}
      </div>
      <div className="k-meter__track" role="meter" aria-label={`${category} budget`} aria-valuemin={0} aria-valuemax={limit ?? spent} aria-valuenow={spent} aria-valuetext={valueText}>
        {limit ? <span className="k-meter__fill" style={{ '--_value': Math.min(1, spent / limit) } as CSSProperties} /> : null}
      </div>
      {note}
    </div>
  )
}

export interface AllowanceCardProps {
  kid: Person
  amount: number
  rhythm: string
  next: string | null
  spent: number
  saved: number
  paused?: boolean
  paidToday?: boolean
  kidView?: boolean
  onTopUp?: (signal: AbortSignal) => Promise<unknown>
  onTopUpDone?: () => void
  onTopUpError?: (error: unknown) => void
  onEdit?: () => void
  onPause?: () => void
  message?: ReactNode
  tick?: number
}

/** A kid's named envelope: amount and rhythm, next payday, spent and saved this month. */
export function AllowanceCard({ kid, amount, rhythm, next, spent, saved, paused, paidToday, kidView, onTopUp, onTopUpDone, onTopUpError, onEdit, onPause, message, tick = 0 }: AllowanceCardProps): JSX.Element {
  const total = Math.max(1, spent + saved)
  return (
    <Card
      title={kidView ? 'Your money' : kid.name}
      action={
        <span className="k-row">
          {tick ? <Tick play={tick} label="Paid" /> : null}
          {paused ? <StatusTag tone="neutral">Paused</StatusTag> : null}
          {paidToday ? <StatusTag tone="positive">Paid today</StatusTag> : null}
          <Avatar person={kid} size={40} />
        </span>
      }
    >
      <p style={{ margin: 0, fontSize: kidView ? 'var(--step-1)' : undefined }}>
        <Amount pence={amount} size={kidView ? 'lg' : 'md'} /> every {rhythm}
      </p>
      {next && !paused ? <p className="k-muted" style={{ margin: 0 }}>Next: {next}</p> : null}
      <div className="k-envelope__bar" aria-hidden="true">
        <span data-part="spent" style={{ flexGrow: spent / total }} />
        <span data-part="saved" style={{ flexGrow: saved / total }} />
      </div>
      <p className="k-envelope__legend">
        <span>
          <PersonDot person={kid} /> Spent <Amount pence={spent} />
        </span>
        <span>Saved <Amount pence={saved} /></span>
      </p>
      {message}
      {kidView ? (
        <Button variant="primary" block>
          Ask for money
        </Button>
      ) : (
        <div className="k-row">
          {onTopUp ? (
            <ActionButton variant="secondary" onAction={onTopUp} pendingLabel="Topping up…" successLabel="Topped up" slowLabel="Still topping up…" successMessage={`Topped up ${kid.name} with £10.00`} onSuccess={onTopUpDone} onError={onTopUpError} errorMessage={() => `Could not top up ${kid.name}. Nothing was sent. Try again.`}>
              Top up {kid.name}
            </ActionButton>
          ) : null}
          {onEdit ? (
            <Button variant="quiet" onClick={onEdit}>
              Edit
            </Button>
          ) : null}
          {onPause ? (
            <Button variant="quiet" onClick={onPause}>
              {paused ? 'Resume' : 'Pause'}
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  )
}

export type RequestStatus = 'waiting' | 'approved' | 'declined' | 'expired'

export interface RequestCardProps {
  kid: Person
  pence: number
  reason: string
  when: string
  status: RequestStatus
  overBalance?: boolean
  onApprove?: (signal: AbortSignal) => Promise<unknown>
  onApproved?: () => void
  onApproveError?: (error: unknown) => void
  onDecline?: () => void
  message?: ReactNode
  tick?: number
  headingRef?: (el: HTMLHeadingElement | null) => void
}

const REQUEST_TAG: Record<RequestStatus, { tone: Tone; text: string }> = {
  waiting: { tone: 'info', text: 'Waiting' },
  approved: { tone: 'positive', text: 'Approved' },
  declined: { tone: 'neutral', text: 'Declined' },
  expired: { tone: 'neutral', text: 'Expired' },
}

/** A kid asks for money; a parent approves (not optimistic: it moves money and notifies the kid) or declines. */
export function RequestCard({ kid, pence, reason, when, status, overBalance, onApprove, onApproved, onApproveError, onDecline, message, tick = 0, headingRef }: RequestCardProps): JSX.Element {
  const headingId = useId()
  const [approving, setApproving] = useState(false)
  const tag = REQUEST_TAG[status]
  return (
    <article className="k-card" aria-labelledby={headingId}>
      <div className="k-card__head">
        <div className="k-request__who">
          <Avatar person={kid} size={40} decorative />
          <div className="k-stack" style={{ gap: 0 }}>
            <h3 id={headingId} ref={headingRef} tabIndex={-1} className="k-card__title" style={{ fontSize: 'var(--step-0)' }}>
              {kid.name} asked for <Amount pence={pence} />
            </h3>
            <span className="k-subtle" style={{ fontSize: 'var(--step--2)' }}>
              {when}
            </span>
          </div>
        </div>
        <span className="k-row">
          {tick ? <Tick play={tick} label="Approved" /> : null}
          <StatusTag tone={tag.tone}>{tag.text}</StatusTag>
        </span>
      </div>
      <p className="k-request__reason">“{reason}”</p>
      {message}
      {status === 'waiting' ? (
        <ButtonGroup label={`${kid.name}’s request`}>
          <Button variant="quiet" onClick={onDecline} unavailableReason={approving ? 'Wait for the approval to finish' : undefined}>
            Decline
          </Button>
          {onApprove && overBalance ? (
            <span className="k-stack" style={{ justifyItems: 'end' }}>
              <Button variant="primary" unavailableReason="Not enough in the kitty">
                Approve {formatPence(pence)}
              </Button>
              <a className="k-link" data-standalone href="#add-money">
                Add money
              </a>
            </span>
          ) : onApprove ? (
            <ActionButton
              variant="primary"
              onAction={async (signal) => {
                setApproving(true)
                try {
                  return await onApprove(signal)
                } finally {
                  setApproving(false)
                }
              }}
              pendingLabel="Approving…"
              successLabel="Approved"
              slowLabel="Still approving…"
              successMessage={`Approved ${formatPence(pence)} for ${kid.name}`}
              errorMessage={() => `Could not approve ${kid.name}’s request. Nothing was sent. Try again.`}
              onSuccess={onApproved}
              onError={onApproveError}
            >
              Approve {formatPence(pence)}
            </ActionButton>
          ) : null}
        </ButtonGroup>
      ) : null}
    </article>
  )
}

/* Layout ---------------------------------------------------------------------------------------------------------- */

export function DashboardGrid({ children }: { children: ReactNode }): JSX.Element {
  return <div className="k-dash">{children}</div>
}

export function GridItem({ span = 12, children }: { span?: number; children: ReactNode }): JSX.Element {
  return <div style={{ '--span': span, minInlineSize: 0 } as CSSProperties}>{children}</div>
}

export function Accordion({ items, defaultOpen = [] }: { items: readonly { id: string; title: string; body: ReactNode; /** An id for in-page links ("#q-money"). */ anchor?: string }[]; /** Items open at first render (a link that opens one answer). */ defaultOpen?: readonly string[] }): JSX.Element {
  const [open, setOpen] = useState<readonly string[]>(defaultOpen)
  const base = useId()
  return (
    <ul className="k-accordion">
      {items.map((item) => {
        const expanded = open.includes(item.id)
        return (
          <li key={item.id} id={item.anchor}>
            <h3>
              <button
                type="button"
                className="k-accordion__btn"
                aria-expanded={expanded}
                aria-controls={`${base}-${item.id}`}
                onClick={() => setOpen((all) => (expanded ? all.filter((x) => x !== item.id) : [...all, item.id]))}
              >
                {item.title}
                <ChevronDown className="k-icon" data-size="sm" aria-hidden="true" />
              </button>
            </h3>
            {expanded ? (
              <div id={`${base}-${item.id}`} className="k-accordion__panel">
                {item.body}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

/** Filters for Activity and Analytics: the count, Clear filters, each filter's value in its button. */
export function FilterBar({ filters, count, onClear, children, label = 'Filter activity' }: { filters: readonly { id: string; label: string; value: string; active: boolean; render: (close: () => void) => ReactNode }[]; count: string; onClear?: () => void; children?: ReactNode; /** The search landmark's name; unique on the page. */ label?: string }): JSX.Element {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="k-filters" role="search" aria-label={label}>
      {children}
      {filters.map((filter) => (
        <div key={filter.id} className="k-pop-anchor">
          <button type="button" className="k-btn k-filter-btn" data-active={filter.active || undefined} aria-expanded={open === filter.id} onClick={() => setOpen((o) => (o === filter.id ? null : filter.id))}>
            {filter.label}: {filter.value}
            <ChevronDown className="k-icon" data-size="sm" aria-hidden="true" />
          </button>
          {open === filter.id ? (
            <div
              className="k-pop"
              data-padded
              role="dialog"
              aria-label={filter.label}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setOpen(null)
              }}
            >
              {filter.render(() => setOpen(null))}
            </div>
          ) : null}
        </div>
      ))}
      <span className="k-filters__count" aria-live="off">
        {count}
      </span>
      {onClear && filters.some((f) => f.active) ? (
        <Button variant="quiet" onClick={onClear}>
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}

/* Error page ------------------------------------------------------------------------------------------------------ */

const ERROR_PAGES = {
  404: { title: 'This page is not in the book', body: 'Check the address, or go to Home.', safe: false },
  500: { title: 'Something on our side stopped working', body: 'Your money is safe. Try again in a few minutes.', safe: true },
  503: { title: 'Kitty is down for a moment', body: 'Your money is safe. We are working on it.', safe: true },
} as const

export function ErrorPage({ code, onRetry }: { code: 404 | 500 | 503; onRetry?: (signal: AbortSignal) => Promise<unknown> }): JSX.Element {
  const page = ERROR_PAGES[code]
  return (
    <article className="k-card" style={{ justifyItems: 'start', gap: 'var(--space-4)', maxInlineSize: 560 }} aria-labelledby={`error-${code}`}>
      <Logo />
      <h3 id={`error-${code}`} style={{ margin: 0, fontSize: 'var(--step-3)' }}>
        {page.title}
      </h3>
      <p style={{ margin: 0 }}>{page.body}</p>
      {code === 503 && onRetry ? (
        <ActionButton variant="primary" onAction={onRetry} pendingLabel="Trying…" successLabel="Back">
          Try again
        </ActionButton>
      ) : (
        <a className="k-btn" data-variant="primary" href="#home">
          Go to Home
        </a>
      )}
      {code === 500 ? <span className="k-subtle" style={{ fontSize: 'var(--step--2)' }}>Reference: KT-2F9A (sample)</span> : null}
      <a className="k-link" href="#help">
        Get help
      </a>
    </article>
  )
}
