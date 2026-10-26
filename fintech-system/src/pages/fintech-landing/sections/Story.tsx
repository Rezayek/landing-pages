/**
 * S2-S5 as one pinned step story (UX.md, MOTION.md "Scroll story"). Wide screens: the step texts scroll on the left;
 * on the right a sticky panel shows the active step's figure (all four stacked in one cell, so the panel never resizes)
 * and the week's ledger, which gains one line per step: the thread. The pocket-money step changes the panel's ground
 * (the kids' chapter). Phones: each step is text, its ledger line and its figure, stacked; nothing is pinned.
 */
import { type JSX, type ReactNode, useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { Amount, Ledger, PersonDot } from '@/system/ui'
import { prefersReducedMotion, spring } from '@/system/motion'
import { useWide } from '../cinematic'
import { BALANCE_PENCE, STORY_LINES } from '../data'
import { AskFigure, KittyFigure, PocketFigure, SplitFigure, WhereFigure } from './figures'
import { useVisitor } from '../visitor'

type Key = keyof typeof STORY_LINES

interface Step {
  key: Key
  id: string
  title: string
  body: ReactNode
  /** What it does, three short facts in the product's own scope (SYSTEM.md §Project) */
  facts: readonly string[]
  /** One objection answered beside the step, in the FAQ's words (UX.md S6); the link opens the full answer. */
  qa: { q: string; a: string; anchor?: string }
}

const STEPS: readonly Step[] = [
  {
    key: 'kitty',
    id: 'one-kitty',
    title: 'One kitty the whole family can see',
    body: 'Today the money is spread over a joint account, a kids’ card and a group chat full of “can you send me £5?”. In Kitty it is one balance the whole family can see, each person with their own login.',
    facts: ['Parents and kids, one balance', 'Every payment shows who made it', 'Kids get their own, simpler login'],
    qa: { q: 'Who holds the money?', a: 'We haven’t named who will yet, so we make no claim about it. Until Kitty opens it holds nothing: the waitlist only takes your email.', anchor: 'q-money' },
  },
  {
    key: 'split',
    id: 'how-it-works',
    title: 'Pay it once. Kitty works out the shares.',
    body: 'Whoever pays adds the bill. Choose who’s in, equal or your own amounts, and everyone sees what they owe and when it’s settled.',
    facts: ['Equal shares or your own amounts', 'Whoever paid is always in', 'Everyone sees what they owe'],
    qa: { q: 'Do we have to leave our bank?', a: 'Joining the waitlist asks you to change nothing. We’ll explain how money gets into the kitty before Kitty opens.', anchor: 'q-bank' },
  },
  {
    key: 'pocket',
    id: 'for-kids',
    title: 'Pocket money that arrives on the day you choose',
    body: 'Set an amount and a day once. Kids see what they have, what they’ve saved and when the next one arrives, and they ask you when they need more.',
    facts: ['An amount and a day, set once', 'Kids see what they spent and saved', 'Pause it or top it up any time'],
    qa: { q: 'What does Ivy see?', a: 'Her own money: what she has, what she’s saved and when the next pocket money arrives. She asks you for more from her login.' },
  },
  {
    key: 'ask',
    id: 'kids-ask',
    title: 'Kids ask. You decide.',
    body: 'When a kid needs more than their pocket money, they ask in the app and say what it’s for. A parent says yes or no, and nothing moves until they do.',
    facts: ['A request comes with its reason', 'Approve or decline in one tap', 'Nothing moves until a parent says yes'],
    qa: { q: 'Will I see what my kids spend?', a: 'Every payment shows with the name of who made it, and a request waits for a parent.', anchor: 'q-kids' },
  },
  {
    key: 'where',
    id: 'where-it-went',
    title: 'See where it went, by person and by category',
    body: 'Every payment is filed with who made it. At the end of the month you see the totals, not a pile of receipts.',
    facts: ['By person or by category', 'Budgets that say when you’re over', 'Every chart also as a table'],
    qa: { q: 'What does it cost?', a: 'Joining the waitlist is free. We haven’t published a price yet; it will be here before Kitty opens.', anchor: 'q-cost' },
  },
]

const RAIL: Readonly<Record<Key, string>> = { kitty: 'One kitty', split: 'Split', pocket: 'Pocket money', ask: 'Kids ask', where: 'Where it went' }
/** The scene behind each step: the kitchen table for the family, the fridge door for the requests (DESIGN.md §Sources). */
const SCENE: Readonly<Record<Key, string>> = { kitty: 'kitchen-table', split: 'step-split', pocket: 'step-pocket', ask: 'step-kitty', where: 'step-where' }

/** The kitty before the story's lines, so the ledger ends on the hero's £1,284.50 once all four are written. */
const START_PENCE = BALANCE_PENCE - STEPS.reduce((sum, step) => sum + (STORY_LINES[step.key].pence ?? 0), 0)

/** Each step's scene from the household's world (generated still lifes, DESIGN.md §Sources): decorative, empty alt. */
function Photo({ storyKey, className, eager }: { storyKey: Key; className: string; eager?: boolean }): JSX.Element {
  return (
    <img
      className={className}
      src={`/fintech-landing/${SCENE[storyKey]}.webp`}
      srcSet={`/fintech-landing/${SCENE[storyKey]}-768.webp 768w, /fintech-landing/${SCENE[storyKey]}.webp 1536w`}
      sizes="(min-width: 64rem) 45vw, 100vw"
      width={1536}
      height={1024}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}

function figureFor(key: Key, run: number): JSX.Element {
  if (key === 'kitty') return <KittyFigure />
  if (key === 'split') return <SplitFigure />
  if (key === 'pocket') return <PocketFigure />
  if (key === 'ask') return <AskFigure />
  return <WhereFigure run={run} />
}

/** The step's own ledger line, ruled, above its heading (phones; on wide screens the panel's ledger carries it). */
function StepLine({ storyKey }: { storyKey: Key }): JSX.Element {
  const line = STORY_LINES[storyKey]
  return (
    <p className="fl-strip">
      <span className="fl-strip__day">{line.day}</span>
      {line.person ? (
        <span className="fl-strip__who">
          <PersonDot person={line.person} />
          {line.person.name}
        </span>
      ) : null}
      <span className="fl-strip__what">{line.what}</span>
      {line.pence !== undefined ? <Amount pence={line.pence} signed /> : null}
    </p>
  )
}

function StepText({ step, index, onActive }: { step: Step; index: number; onActive: (index: number) => void }): JSX.Element {
  const ref = useRef<HTMLElement>(null)
  // Active while the step's text crosses the middle of the screen, whatever its height.
  const inView = useInView(ref, { margin: '-50% 0px -50% 0px' })
  useEffect(() => {
    if (inView) onActive(index)
  }, [inView, index, onActive])
  return (
    <section ref={ref} id={step.id} className="fl-step" aria-labelledby={`${step.id}-title`}>
      <h2 id={`${step.id}-title`} className="fl-h2">
        {step.title}
      </h2>
      <p className="fl-body">{step.body}</p>
      <StepLine storyKey={step.key} />
      <ul className="fl-facts">
        {step.facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      <aside className="fl-qa" aria-label={step.qa.q}>
        <p className="fl-qa__q">{step.qa.q}</p>
        <p className="fl-qa__a">
          {step.qa.a}
          {step.qa.anchor ? (
            <>
              {' '}
              <a className="k-link" href={`#${step.qa.anchor}`}>
                The full answer
              </a>
            </>
          ) : null}
        </p>
      </aside>
      <div className="fl-step__figure">
        <Photo storyKey={step.key} className="fl-step__photo" />
        {figureFor(step.key, 0)}
        <p className="fl-sample">Sample household</p>
      </div>
    </section>
  )
}

export function Story(): JSX.Element {
  const wide = useWide()
  // Under reduced motion every line is written from the start, and steps switch without a fade (CSS).
  const [reached, setReached] = useState(() => (prefersReducedMotion() ? STEPS.length - 1 : -1))
  const [active, setActive] = useState(0)
  const [runs, setRuns] = useState(0)
  const onActive = useRef((index: number) => {
    setActive(index)
    setReached((r) => Math.max(r, index))
    if (STEPS[index].key === 'where') setRuns((n) => n + 1)
  }).current

  const fresh = !prefersReducedMotion()
  const { approved } = useVisitor()
  const lines = STEPS.slice(0, reached + 1).map((step) => ({ ...STORY_LINES[step.key], fresh }))
  // The decision the visitor made in the hero travels with them: their stamped line heads the week's ledger
  const yours = approved ? [{ id: 'yours', day: 'Wed', what: 'You approved Ivy’s school trip', stamp: 'Yours' }] : []
  const total = lines.reduce((sum, line) => sum + (line.pence ?? 0), START_PENCE)

  return (
    <div className="fl-story" data-story="week" data-step={STEPS[active].key}>
      <div className="fl-story__steps">
        {STEPS.map((step, i) => (
          <StepText key={step.key} step={step} index={i} onActive={onActive} />
        ))}
      </div>
      {wide ? (
        <div className="fl-story__panel">
          <div className="fl-panel" data-ground={STEPS[active].key === 'pocket' || undefined}>
            {/* The scene behind the panel changes with the chapter: a cross-fade, the new one settling in scale */}
            <div className="fl-panel__scenes" aria-hidden="true">
              {STEPS.map((step, i) => (
                <div key={step.key} className="fl-panel__scene" data-active={i === active || undefined}>
                  <Photo storyKey={step.key} className="fl-panel__photo" />
                </div>
              ))}
            </div>
            {/* Where you are in the story: the marker slides to the active step (layout animation) */}
            <ol className="fl-rail" aria-label="Steps">
              {STEPS.map((step, i) => (
                <li key={step.key} aria-current={i === active ? 'step' : undefined}>
                  <a href={`#${step.id}`}>
                    {RAIL[step.key]}
                  </a>
                  {i === active ? <motion.span layoutId="fl-rail-marker" className="fl-rail__marker" transition={spring.default} /> : null}
                </li>
              ))}
            </ol>
            <div className="fl-panel__stack">
              {STEPS.map((step, i) => (
                <div key={step.key} className="fl-panel__figure" data-active={i === active || undefined} aria-hidden={i === active ? undefined : true} inert={i !== active}>
                  {figureFor(step.key, step.key === 'where' ? runs : 0)}
                </div>
              ))}
            </div>
            {/* The thread, kept small beside the figure: the line this step wrote and the running total */}
            <Ledger
              compact
              title="This week, as you read"
              label={`${lines.length} of ${STEPS.length} lines · sample`}
              lines={[...yours, ...lines.slice(-1)]}
              totalPence={lines.length ? total : undefined}
              totalLabel="Running total"
              headingLevel={3}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
