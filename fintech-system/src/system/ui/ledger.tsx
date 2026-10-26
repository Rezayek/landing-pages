import { useId, type JSX, type ReactNode } from 'react'
import { Amount, PersonDot } from './core'
import type { Person } from './sample'
import { Tick } from './Tick'

export interface LedgerLine {
  readonly id: string
  /** "Fri", "Today", "Mon 26 Oct" (CONTENT.md dates). */
  readonly day: string
  readonly person?: Person
  /** What happened, in the household's words: "Tesco Express", "asked for £5.00 for the school trip". */
  readonly what: ReactNode
  /** Pence, signed (out of the kitty is negative). None for a request or a waiting line. */
  readonly pence?: number
  /** A short state after the line: "Approved by you", "You said no this time". */
  readonly note?: ReactNode
  /** Replays the tick beside the note (approved, joined). 0: no tick. */
  readonly tick?: number
  /** A rubber-stamp mark over the line ("Approved"): a rare, deliberate yes. It lands once (MOTION-SYSTEM.md "Stamp"). */
  readonly stamp?: string
  /** Buttons that act on the line (a request's Decline and Approve), under it on one row. */
  readonly actions?: ReactNode
  /** The line was just written in front of the person: it holds the accent ground, then fades. */
  readonly fresh?: boolean
  /** An empty ruled line waiting to be filled ("Your household · …"). */
  readonly waiting?: boolean
  /** A line that waits on the reader (a request): tinted at rest, so the one thing to act on is seen first. */
  readonly ask?: boolean
}

export interface LedgerProps {
  /** The page's heading: "The kitty · this week". */
  title: ReactNode
  /** A short corner label: "Sample household". */
  label?: ReactNode
  lines: readonly LedgerLine[]
  /** The foot: "In the kitty" and the running total. */
  totalLabel?: string
  totalPence?: number
  /** Write the lines in on first paint (the landing hero), one after another. Off: the lines are simply there. */
  write?: boolean
  /** Under the foot: a live caption in product terms, its box reserved by the caller. */
  caption?: ReactNode
  headingLevel?: 2 | 3 | 4
  /** Smaller type and rows (a side ledger beside content). */
  compact?: boolean
  /** Screen readers skip a decorative copy (the side ledger repeats lines each section states as text). */
  decorative?: boolean
  className?: string
}

/**
 * The household's written page: ruled lines of day, person, what and amount, a double rule and the total at the foot.
 * The app's TransactionRow is a tappable list row; the Ledger is the record people read together. Lines write in with
 * the "Ledger line write" pattern (MOTION-SYSTEM.md): a clip on an inner span, so the text is laid out and legible at
 * every frame, and simply there under reduced motion.
 */
export function Ledger({ title, label, lines, totalLabel, totalPence, write, caption, headingLevel = 3, compact, decorative, className }: LedgerProps): JSX.Element {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'
  const titleId = useId()
  return (
    <figure
      className={['k-ledger', className].filter(Boolean).join(' ')}
      data-compact={compact || undefined}
      data-write={write || undefined}
      aria-labelledby={decorative ? undefined : titleId}
      aria-hidden={decorative || undefined}
    >
      <div className="k-ledger__head">
        <Heading id={titleId} className="k-ledger__title">
          {title}
        </Heading>
        {label ? <span className="k-ledger__label">{label}</span> : null}
      </div>
      <ol className="k-ledger__lines">
        {lines.map((line, i) => (
          <li key={line.id} className="k-ledger__line" data-fresh={line.fresh || undefined} data-waiting={line.waiting || undefined} data-ask={line.ask || undefined} style={{ ['--i' as string]: i }}>
            <span className="k-ledger__day">{line.day}</span>
            <span className="k-ledger__who">
              {line.person ? (
                <>
                  <PersonDot person={line.person} />
                  {line.person.name}
                </>
              ) : null}
            </span>
            <span className="k-ledger__what">
              <span className="k-ledger__ink">
                {line.what}
                {line.note ? (
                  <span className="k-ledger__note">
                    {line.tick ? <Tick play={line.tick} /> : null}
                    {line.note}
                  </span>
                ) : null}
              </span>
              {line.waiting ? <span className="k-ledger__blank" aria-hidden="true" /> : null}
              {line.stamp ? <span className="k-ledger__stamp">{line.stamp}</span> : null}
            </span>
            <span className="k-ledger__amount">
              {line.pence !== undefined ? (
                <span className="k-ledger__ink">
                  <Amount pence={line.pence} signed live />
                </span>
              ) : null}
            </span>
            {line.actions ? <span className="k-ledger__actions">{line.actions}</span> : null}
          </li>
        ))}
      </ol>
      {totalPence !== undefined ? (
        <div className="k-ledger__foot">
          <span>{totalLabel ?? 'In the kitty'}</span>
          <span className="k-ledger__total">
            <Amount pence={totalPence} size="lg" live />
          </span>
        </div>
      ) : null}
      {caption ? <figcaption className="k-ledger__caption">{caption}</figcaption> : null}
    </figure>
  )
}
