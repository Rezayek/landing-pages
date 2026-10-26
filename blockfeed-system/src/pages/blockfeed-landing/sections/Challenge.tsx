/**
 * S3 Challenge (UX.md §S3, MOTION.md rows "Challenge countdown" and "Vote"; steals #3 stepped numerals, #6 plinth).
 * The countdown steps its digits (decode) each minute from a fixed sample end time; three sample entries stand on
 * plinths, each with Vote (ActionButton: "Voting…" about 400 ms, then "Voted", orbs to the votes bar, Undo vote for
 * 10 s). Three votes a week; the votes stay on this page. Sample data only.
 */
import { useEffect, useRef, useState, type JSX } from 'react'
import { ActionButton, announce } from '@/system/feedback'
import { Avatar, Button, Icon, Panel, Tag, XpBar } from '@/system/ui'
import { BuildShot } from '@/system/social'
import { buildById, playerById, type Build } from '@/system/social/fixtures'
import { decode, play, xp } from '@/system/vfx'
import { teleportTo } from './world'
import './challenge.css'

interface Entry {
  readonly build: Build
  /** votes before this visitor's */
  readonly votes: number
  /** the small first build among the big ones */
  readonly first?: boolean
}

// Sample entries: two big builds from the fixtures and one small first build (votes as in fixtures.CHALLENGE).
const ENTRIES: readonly Entry[] = [
  { build: buildById('copper-light'), votes: 412 },
  { build: buildById('meadow-cottage'), votes: 41, first: true },
  { build: buildById('lantern-keep'), votes: 377 },
  { build: buildById('tideline-castle'), votes: 203 },
]

const VOTES_PER_WEEK = 3
const VOTE_MS = 400
const UNDO_MS = 10_000
const MINUTE = 60_000
/** 2d 14h 05m from the moment the page opens, then it counts down (a fixed sample end time). */
const END = Date.now() + ((2 * 24 + 14) * 60 + 5) * MINUTE

const minutesLeft = (): number => Math.max(0, Math.ceil((END - Date.now()) / MINUTE))

function votesLeft(left: number): string {
  if (left <= 0) return 'No votes left this week'
  return left === 1 ? '1 vote left' : `${left} votes left`
}

/** One unit of the clock. Its digits step to the new value (decode) whenever the text changes, never on first paint. */
function Segment({ text }: { text: string }): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    void decode(ref.current, text, { duration: 200, glyphs: '0123456789' })
  }, [text])
  return (
    <span ref={ref} className="bl-seg bf-num">
      {text}
    </span>
  )
}

function Countdown({ minutes }: { minutes: number }): JSX.Element {
  if (minutes <= 0) return <p className="bl-clock__closed">Voting closed. Results will show here.</p>
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = String(minutes % 60).padStart(2, '0')
  return (
    <p className="bl-clock" role="timer">
      <span className="bl-clock__label">Voting ends in</span>
      <span className="bl-clock__segs">
        <Segment text={`${days}d`} />
        <Segment text={`${hours}h`} />
        <Segment text={`${mins}m`} />
      </span>
    </p>
  )
}

export function Challenge(): JSX.Element {
  const [minutes, setMinutes] = useState(minutesLeft)
  const [voted, setVoted] = useState<readonly string[]>([])
  const [settled, setSettled] = useState<readonly string[]>([])
  const [undoable, setUndoable] = useState<readonly string[]>([])
  const [barLeft, setBarLeft] = useState(VOTES_PER_WEEK)
  const root = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const count = useRef(0)
  const timers = useRef(new Map<string, number>())
  const closed = minutes <= 0
  const left = VOTES_PER_WEEK - voted.length

  // The clock ticks on the minute: the first tick lands just after the next minute boundary.
  useEffect(() => {
    let timer = 0
    const tick = (): void => {
      const now = minutesLeft()
      setMinutes(now)
      if (now > 0) timer = window.setTimeout(tick, ((END - Date.now()) % MINUTE || MINUTE) + 50)
    }
    timer = window.setTimeout(tick, ((END - Date.now()) % MINUTE || MINUTE) + 50)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const open = timers.current
    return () => open.forEach((t) => window.clearTimeout(t))
  }, [])

  const pad = (id: string): HTMLElement | null => root.current?.querySelector<HTMLElement>(`[data-entry="${id}"] .bl-plinth__pad`) ?? null

  async function cast(): Promise<void> {
    await new Promise<void>((resolve) => window.setTimeout(resolve, VOTE_MS)) // the simulated wait
  }

  function counted(id: string): void {
    const next = voted.includes(id) ? voted : [...voted, id]
    count.current = next.length
    setVoted(next)
    announce(`Voted. ${votesLeft(VOTES_PER_WEEK - next.length)}`)
    void play(pad(id), 'pop')
    void xp(pad(id), bar.current, { count: 5, onArrive: () => setBarLeft(VOTES_PER_WEEK - count.current) })
  }

  function rested(id: string): void {
    setSettled((s) => (s.includes(id) ? s : [...s, id]))
    setUndoable((s) => [...s, id])
    window.clearTimeout(timers.current.get(id))
    timers.current.set(
      id,
      window.setTimeout(() => setUndoable((s) => s.filter((x) => x !== id)), UNDO_MS),
    )
  }

  function undo(id: string): void {
    window.clearTimeout(timers.current.get(id))
    const next = voted.filter((x) => x !== id)
    count.current = next.length
    setVoted(next)
    setSettled((s) => s.filter((x) => x !== id))
    setUndoable((s) => s.filter((x) => x !== id))
    setBarLeft(VOTES_PER_WEEK - next.length)
    // the Undo button is gone: focus returns to that entry's Vote button once it has rendered
    window.requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-entry="${id}"] .fb-btn`)?.focus())
    announce(votesLeft(VOTES_PER_WEEK - next.length))
  }

  return (
    <section id="challenge" className="bl-section" data-y="32" data-y-label="challenge" aria-labelledby="challenge-title">
      <div className="bl-inner" ref={root}>
        <header className="bl-head">
          <h2 id="challenge-title" className="bl-h2">
            This week: lighthouses.
          </h2>
          <p className="bl-lede">
            Build a lighthouse in any world and enter it with its coordinates. Builders vote, not judges. First builds sit next to megabuilds.
          </p>
        </header>

        <Panel className="bl-board">
          <Countdown minutes={minutes} />
          <div className="bl-votebar" ref={bar}>
            <XpBar value={closed ? 0 : barLeft} max={VOTES_PER_WEEK} label={closed ? 'No more votes this week' : votesLeft(barLeft)} showLabel />
          </div>
        </Panel>

        <ol className="bl-entries" aria-label="Entries">
          {ENTRIES.map(({ build, votes, first }) => {
            const mine = voted.includes(build.id)
            const rest = settled.includes(build.id)
            const blocked = !mine && (left <= 0 || closed)
            const [x, y, z] = build.coords
            return (
              <li key={build.id} className="bl-entry" data-entry={build.id} data-voted={mine ? '' : undefined}>
                <Panel as="article" flush className="bl-entry__card" aria-labelledby={`entry-${build.id}`}>
                  <BuildShot build={build} />
                  <h3 id={`entry-${build.id}`} className="bl-entry__title">
                    {build.title}
                  </h3>
                  <div className="bl-entry__by">
                    <Avatar name={playerById(build.author).name} size="sm" decorative />
                    <span>{playerById(build.author).name}</span>
                  </div>
                  <div className="bl-entry__facts">
                    <span className="bf-num">{(votes + (mine ? 1 : 0)).toLocaleString()} votes</span>
                    {first ? (
                      <Tag tone="positive" icon="seed">
                        First build
                      </Tag>
                    ) : null}
                  </div>
                </Panel>
                <div className="bl-plinth">
                  <div className="bl-plinth__pad" data-lit={mine ? '' : undefined}>
                    <Button variant="ghost" size="sm" className="bl-plinth__go" aria-label={`/tp ${x} ${y} ${z}, ${build.title}`} onClick={() => teleportTo(build.id)}>
                      <span className="bf-num">
                        X {x} · Y {y} · Z {z}
                      </span>
                    </Button>
                    <div className="bl-plinth__vote">
                      {mine && rest ? (
                        <>
                          <Tag tone="positive" icon="check">
                            Voted
                          </Tag>
                          {undoable.includes(build.id) ? (
                            <Button size="sm" onClick={() => undo(build.id)}>
                              Undo vote
                            </Button>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <ActionButton
                            icon={<Icon name="star" shadow />}
                            aria-label={`Vote for ${build.title}`}
                            pendingLabel="Voting…"
                            successLabel="Voted"
                            successMessage={false}
                            disabled={blocked}
                            disabledReason={closed ? 'Voting closed' : 'No votes left this week'}
                            onAction={cast}
                            onSuccess={() => counted(build.id)}
                            onDone={() => rested(build.id)}
                          >
                            Vote
                          </ActionButton>
                          {blocked && !closed ? <span className="bl-plinth__why">No votes left this week</span> : null}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bl-plinth__base" aria-hidden="true" />
                </div>
              </li>
            )
          })}
        </ol>

        <p className="bl-note">Sample entries. Voting needs an account. Here, your votes stay on this page.</p>
        {voted.length > 0 ? (
          <div className="bl-row">
            <a className="bf-btn bl-join" href="#signup">
              Create an account to enter your own build
            </a>
          </div>
        ) : null}
      </div>
    </section>
  )
}
