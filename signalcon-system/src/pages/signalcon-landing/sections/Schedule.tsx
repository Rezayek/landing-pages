/**
 * S4 Schedule, CH03 (UX.md §S4; actions A8, A9). Day tabs switch the panel (the Tabs component plays the channel
 * flip), kind chips filter the rows in place, and a filter with no rows shows "No signal" in the same box.
 * Layout and type live in schedule.css; every colour, size and duration there is a system token.
 */
import { type CSSProperties, type JSX, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  Button,
  Chips,
  IconArtist,
  IconConcert,
  IconCosplay,
  IconGame,
  IconPanel,
  NoSignal,
  SectionHeader,
  Tabs,
  Tape,
} from '@/system/ui'
import type { ChipItem, TabItem } from '@/system/ui'
import { announce } from '@/system/feedback'
import { DAYS, KINDS, SCHEDULE, type Day, type DayId, type Kind, type KindId } from '../data'
import './schedule.css'

type KindFilter = KindId | 'all'

const CHIP_ICON: Record<KindId, JSX.Element> = {
  concert: <IconConcert size={16} />,
  panel: <IconPanel size={16} />,
  cosplay: <IconCosplay size={16} />,
  artist: <IconArtist size={16} />,
  game: <IconGame size={16} />,
}

/** The same glyphs at row size. */
const ROW_ICON: Record<KindId, JSX.Element> = {
  concert: <IconConcert size={20} />,
  panel: <IconPanel size={20} />,
  cosplay: <IconCosplay size={20} />,
  artist: <IconArtist size={20} />,
  game: <IconGame size={20} />,
}

/** One event, for a count of 1 ("1 concert on Saturday 24"). */
const SINGULAR: Record<KindId, string> = {
  concert: 'concert',
  panel: 'panel',
  cosplay: 'cosplay event',
  artist: 'artist alley event',
  game: 'game demo',
}

const TAB_ITEMS: readonly TabItem[] = DAYS.map((d) => ({ id: d.id, label: d.short, sub: d.date }))

const CHIP_ITEMS: readonly ChipItem[] = [
  { id: 'all', label: 'All' },
  ...KINDS.map((k) => ({ id: k.id, label: k.title, icon: CHIP_ICON[k.id] })),
]

const kindOf = (id: KindId): Kind => KINDS.find((k) => k.id === id) ?? KINDS[0]

const COMPACT = '(min-width: 1024px)'
const subscribeCompact = (cb: () => void): (() => void) => {
  const mq = window.matchMedia(COMPACT)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const compactNow = (): boolean => window.matchMedia(COMPACT).matches

/** "No cosplay events on Friday. Cosplay runs Saturday and Sunday." (CONTENT.md Empty states) */
const emptyBody = (kind: Kind, day: Day): string =>
  `No ${kind.plural} on ${day.name}. ${kind.title} ${kind.title.endsWith('s') ? 'run' : 'runs'} ${kind.days}.`

function countText(n: number, kind: KindFilter, day: Day): string {
  if (kind === 'all') return `${day.name} ${day.date}: ${n} ${n === 1 ? 'event' : 'events'}`
  const k = kindOf(kind)
  return `${n} ${n === 1 ? SINGULAR[k.id] : k.plural} on ${day.name} ${day.date}`
}

export function Schedule({
  kind,
  onKindChange,
}: {
  kind: KindId | 'all'
  onKindChange: (k: KindId | 'all') => void
}): JSX.Element {
  const [dayId, setDayId] = useState<DayId>('fri')
  const compact = useSyncExternalStore(subscribeCompact, compactNow, () => false)

  const day = DAYS.find((d) => d.id === dayId) ?? DAYS[0]
  const dayRows = SCHEDULE.filter((s) => s.day === day.id)
  const rows = kind === 'all' ? dayRows : dayRows.filter((s) => s.kind === kind)
  const activeKind = kind === 'all' ? null : kindOf(kind)
  const empty = rows.length === 0 && activeKind !== null

  // Polite announcements (CONTENT.md Loading): never on first render. A day change speaks the day and its count, a
  // filter change speaks the count, an empty result speaks the empty title and body.
  const prev = useRef<{ day: DayId; kind: KindFilter } | null>(null)
  useEffect(() => {
    const before = prev.current
    prev.current = { day: day.id, kind }
    if (!before || (before.day === day.id && before.kind === kind)) return
    const d = DAYS.find((x) => x.id === day.id) ?? DAYS[0]
    const n = SCHEDULE.filter((s) => s.day === d.id && (kind === 'all' || s.kind === kind)).length
    announce(n === 0 && kind !== 'all' ? `No signal. ${emptyBody(kindOf(kind), d)}` : countText(n, kind, d))
  }, [day.id, kind])

  const onKind = (id: string): void => {
    onKindChange(id === 'all' ? 'all' : kindOf(id as KindId).id)
  }

  return (
    <section
      className="pg-section"
      id="schedule-sec"
      data-band="paper"
      data-wipe=""
      style={{ '--wipe-color': 'var(--night-950)' } as CSSProperties}
      aria-labelledby="schedule"
    >
      <div className="pg-wrap">
        <SectionHeader
          id="schedule"
          channel="CH03"
          title="The guide:"
          outlined="Fri 23 to Sun 25"
          sub="Pick a day. Times are Varo City time (VCT)."
        />

        <Tabs items={TAB_ITEMS} value={day.id} onChange={(id) => setDayId(id as DayId)} label="Day">
          <div className="sc-sched-filter">
            <Chips items={CHIP_ITEMS} value={kind} onChange={onKind} label="Filter by kind" />
            <p className="sc-sched-meta">
              <span>
                {rows.length} {rows.length === 1 ? 'event' : 'events'}
              </span>
              <span aria-hidden>·</span>
              <span>Doors {day.doors}</span>
            </p>
          </div>

          <div className="sc-sched-box" data-density={compact ? 'compact' : undefined}>
            {empty && activeKind ? (
              <NoSignal
                action={
                  <Button variant="secondary" onClick={() => onKindChange('all')}>
                    Show all of {day.name}
                  </Button>
                }
              >
                {emptyBody(activeKind, day)}
              </NoSignal>
            ) : (
              <ol className="sc-sched-list">
                {rows.map((s) => (
                  <li key={`${s.day}-${s.time}-${s.title}`} className="sc-sched-row" data-main={s.main ? '' : undefined}>
                    <time className="sc-sched-time" dateTime={`2027-07-${day.date}T${s.time}`}>
                      {s.time}
                    </time>
                    <span className="sc-sched-title">
                      <span className="sc-sched-name" title={s.title}>
                        {s.title}
                      </span>
                      {s.main && (
                        <Tape tone="signal" mono tilt={-2} className="sc-sched-tape">
                          Main event
                        </Tape>
                      )}
                    </span>
                    <span className="sc-sched-place" title={s.place}>
                      {s.place}
                    </span>
                    <span className="sc-sched-kind">
                      {ROW_ICON[s.kind]}
                      {kindOf(s.kind).title}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <p className="sc-sched-after">
            <a href="#tickets" className="sc-link-btn sc-sched-link">
              Pick your pass for {day.name}
            </a>
          </p>
        </Tabs>
      </div>
    </section>
  )
}
