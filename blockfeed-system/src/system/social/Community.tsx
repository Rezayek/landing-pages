import { useId, useState, type JSX, type ReactNode } from 'react'
import { Button, CycleButton, Icon, Panel, Ping, SearchField, Slot, Tag, XpBar } from '../ui'
import { BuildShot, CopyField } from './Build'
import { buildById, CHALLENGE, EVENTS, MONTH, playerById, type CalendarEvent, type Challenge, type Group, type Server } from './fixtures'
import { NO_FILTERS, timeLeft, type ServerFilters } from './logic'
import './social.css'

// ----- servers --------------------------------------------------------------------------------------------------------

export interface ServerRowProps {
  readonly server: Server
  readonly onJoin?: (id: string) => void
}

/**
 * A server in the list, as one row on the dark field: name and address, version, mode and region, who is online and the
 * ping. Full and offline are written out as words with an icon; the bars and the colour only repeat them.
 */
export function ServerRow({ server, onJoin }: ServerRowProps): JSX.Element {
  const offline = server.ping === null
  const full = !offline && server.online >= server.max
  const share = server.max > 0 ? server.online / server.max : 0
  return (
    <article className="bf-server" aria-label={server.name}>
      <Slot>
        <Icon name={server.realm ? 'globe' : 'server'} size="lg" />
      </Slot>
      <div className="bf-server__main">
        <h3 className="bf-server__name">{server.name}</h3>
        <CopyField label={server.realm ? 'Realm code' : 'Address'} value={server.address} />
        <p className="bf-server__blurb">{server.blurb}</p>
        <div className="bf-row">
          <Tag tone="version">{server.version}</Tag>
          <Tag>{server.mode}</Tag>
          <Tag icon="globe">{server.region}</Tag>
          {server.realm ? <Tag tone="info">Realm</Tag> : null}
        </div>
      </div>
      <div className="bf-server__live">
        {offline ? (
          <Tag tone="negative" icon="cross">
            Offline
          </Tag>
        ) : full ? (
          <Tag tone="warning" icon="lock">
            Full
          </Tag>
        ) : (
          <Tag tone="positive" icon="check">
            Online
          </Tag>
        )}
        <span className="bf-server__players bf-num">
          <Icon name="users" size="sm" /> {server.online} / {server.max}
          <span className="bf-sr"> players online</span>
        </span>
        <XpBar value={server.online} max={server.max} label={`${Math.round(share * 100)}% full`} />
        <Ping ms={server.ping} />
        <Button variant="primary" size="sm" icon="plus" disabled={offline} onClick={() => onJoin?.(server.id)} aria-label={`${full ? 'Join queue for' : 'Join'} ${server.name}`}>
          {full ? 'Queue' : 'Join'}
        </Button>
      </div>
    </article>
  )
}

export interface ServerFilterBarProps {
  readonly value: ServerFilters
  readonly onChange: (next: ServerFilters) => void
  /** Leave out while the list is loading or failed: the bar then shows no count. */
  readonly resultCount?: number
}

/**
 * The filter bar: a search box and four cycle buttons, the game's own control for "pick one of a few". Every active
 * filter shows its value on the button itself, and "Clear filters" appears as soon as one is on.
 */
export function ServerFilterBar({ value, onChange, resultCount }: ServerFilterBarProps): JSX.Element {
  const set = <K extends keyof ServerFilters>(key: K, v: ServerFilters[K]): void => onChange({ ...value, [key]: v })
  const active = JSON.stringify(value) !== JSON.stringify(NO_FILTERS)
  return (
    <Panel flush role="group" aria-label="Filter servers" className="bf-filters">
      <SearchField label="Search servers by name or address" placeholder="Search servers" value={value.query} onChange={(e) => set('query', e.target.value)} />
      <div className="bf-filters__row">
        <CycleButton
          label="Version"
          value={value.version}
          onChange={(v) => set('version', v)}
          options={[
            { value: 'any', label: 'Any' },
            { value: '1.21', label: '1.21' },
            { value: '1.20.4', label: '1.20.4' },
            { value: '1.19.2', label: '1.19.2' },
          ]}
        />
        <CycleButton
          label="Mode"
          value={value.mode}
          onChange={(v) => set('mode', v)}
          options={[
            { value: 'any', label: 'Any' },
            { value: 'Survival', label: 'Survival' },
            { value: 'Creative', label: 'Creative' },
            { value: 'Minigames', label: 'Minigames' },
            { value: 'Roleplay', label: 'Roleplay' },
          ]}
        />
        <CycleButton
          label="Region"
          value={value.region}
          onChange={(v) => set('region', v)}
          options={[
            { value: 'any', label: 'Any' },
            { value: 'EU', label: 'EU' },
            { value: 'NA', label: 'NA' },
            { value: 'Asia', label: 'Asia' },
            { value: 'Oceania', label: 'Oceania' },
          ]}
        />
        <CycleButton
          label="Online"
          value={value.minPlayers}
          onChange={(v) => set('minPlayers', v)}
          options={[
            { value: 'any', label: 'Any' },
            { value: '10', label: '10+' },
            { value: '100', label: '100+' },
          ]}
        />
      </div>
      <div className="bf-row">
        <span role="status" className="bf-muted">
          {resultCount === undefined ? null : resultCount === 0 ? 'No servers match' : `${resultCount} ${resultCount === 1 ? 'server' : 'servers'}`}
        </span>
        {active ? (
          <Button size="sm" variant="ghost" icon="cross" onClick={() => onChange(NO_FILTERS)}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </Panel>
  )
}

// ----- groups ---------------------------------------------------------------------------------------------------------

export interface GroupCardProps {
  readonly group: Group
  readonly joined: boolean
  readonly onToggle: () => void
}

export function GroupCard({ group, joined, onToggle }: GroupCardProps): JSX.Element {
  const members = group.members + (joined && !group.joined ? 1 : !joined && group.joined ? -1 : 0)
  return (
    <Panel as="article" flush className="bf-group" aria-label={group.name}>
      <Slot>
        <Icon name={group.kind === 'Guild' ? 'shield' : group.kind === 'Realm' ? 'globe' : 'server'} size="lg" />
      </Slot>
      <div className="bf-group__main">
        <h3 className="bf-group__name">{group.name}</h3>
        <div className="bf-row">
          <Tag>{group.kind}</Tag>
          <span className="bf-muted bf-num">{members.toLocaleString()} members</span>
        </div>
        <p className="bf-group__blurb">{group.blurb}</p>
      </div>
      <Button variant={joined ? 'secondary' : 'primary'} size="sm" icon={joined ? 'check' : 'plus'} aria-pressed={joined} aria-label={`Join ${group.name}`} onClick={onToggle}>
        {joined ? 'Joined' : 'Join'}
      </Button>
    </Panel>
  )
}

// ----- weekly challenge -----------------------------------------------------------------------------------------------

export interface ChallengeCardProps {
  readonly challenge?: Challenge
  /** build ids the player has voted for */
  readonly voted: readonly string[]
  readonly onVote: (buildId: string) => void
  readonly closed?: boolean
}

/**
 * The weekly challenge: the theme, the time left and the entries with their vote counts. Each player has three votes,
 * shown as three slots that fill with stars. A vote is a toggle: pressing a voted entry takes the vote back.
 */
export function ChallengeCard({ challenge = CHALLENGE, voted, onVote, closed }: ChallengeCardProps): JSX.Element {
  const left = challenge.votesPerPlayer - voted.length
  const total = challenge.entries.reduce((n, e) => n + e.votes + (voted.includes(e.build) ? 1 : 0), 0)
  const headId = useId()
  return (
    <Panel as="section" className="bf-challenge" aria-labelledby={headId}>
      <div className="bf-challenge__head">
        <div>
          <h2 id={headId} className="bf-challenge__title">
            {challenge.title}
          </h2>
          <p className="bf-muted">{challenge.theme}</p>
        </div>
        <div className="bf-challenge__facts">
          <Tag tone={closed ? 'negative' : 'warning'} icon="clock">
            {closed ? 'Voting closed' : timeLeft(challenge.hoursLeft)}
          </Tag>
          <div className="bf-votes" role="img" aria-label={`${left} of ${challenge.votesPerPlayer} votes left`}>
            {Array.from({ length: challenge.votesPerPlayer }, (_, i) => (
              <Slot key={i}>{i < voted.length ? <Icon name="star" size="md" /> : null}</Slot>
            ))}
          </div>
        </div>
      </div>
      <ol className="bf-entries">
        {challenge.entries
          .map((e) => ({ ...e, votes: e.votes + (voted.includes(e.build) ? 1 : 0) }))
          .sort((a, b) => b.votes - a.votes)
          .map((e, rank) => {
            const build = buildById(e.build)
            const mine = voted.includes(e.build)
            return (
              <li key={e.build} className="bf-entry">
                <span className="bf-entry__rank bf-num" aria-label={`Rank ${rank + 1}`}>
                  {rank + 1}
                </span>
                <BuildShot build={build} />
                <div className="bf-entry__main">
                  <strong className="bf-entry__title">{build.title}</strong>
                  <span className="bf-muted">by {playerById(build.author).name}</span>
                  <XpBar value={e.votes} max={total} label={`${e.votes.toLocaleString()} votes, ${Math.round((e.votes / total) * 100)}% of all votes`} />
                </div>
                <div className="bf-entry__vote">
                  <span className="bf-num">{e.votes.toLocaleString()}</span>
                  <Button
                    size="sm"
                    icon={mine ? 'check' : 'star'}
                    aria-pressed={mine}
                    aria-label={`Vote for ${build.title}`}
                    disabled={closed || (!mine && left === 0)}
                    onClick={() => onVote(e.build)}
                  >
                    {mine ? 'Voted' : 'Vote'}
                  </Button>
                </div>
              </li>
            )
          })}
      </ol>
      {!closed && left === 0 ? <p className="bf-muted">You have used all your votes. Take one back to vote for a different build.</p> : null}
    </Panel>
  )
}

// ----- events calendar ------------------------------------------------------------------------------------------------

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const KIND_TONE: Record<CalendarEvent['kind'], 'accent' | 'info' | 'warning' | 'negative'> = { Challenge: 'accent', Showcase: 'info', Meetup: 'warning', Maintenance: 'negative' }

export interface EventCalendarProps {
  readonly selected: number
  readonly onSelect: (day: number) => void
  readonly going: readonly string[]
  readonly onToggleGoing: (eventId: string) => void
  readonly events?: readonly CalendarEvent[]
}

/**
 * A month as a grid of slots. A day with events carries a count (a number, not only a dot); the chosen day is framed;
 * today is written "today" for assistive technology. The events of the chosen day are listed under the grid with an
 * RSVP toggle.
 */
export function EventCalendar({ selected, onSelect, going, onToggleGoing, events = EVENTS }: EventCalendarProps): JSX.Element {
  const cells: (number | null)[] = [...Array<null>(MONTH.startsOn).fill(null), ...Array.from({ length: MONTH.days }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
  const dayEvents = events.filter((e) => e.day === selected).sort((a, b) => a.time.localeCompare(b.time))
  return (
    <Panel as="section" className="bf-calendar" aria-label={`Events in ${MONTH.label}`}>
      <h2 className="bf-calendar__title">{MONTH.label}</h2>
      <table className="bf-cal">
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th key={d} scope="col">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day, i) => {
                if (day === null) return <td key={i} />
                const count = events.filter((e) => e.day === day).length
                const today = day === MONTH.today
                return (
                  <td key={i}>
                    <button
                      type="button"
                      className="bf-day"
                      aria-pressed={day === selected}
                      aria-label={`${day} ${MONTH.label.split(' ')[0]}${today ? ', today' : ''}${count ? `, ${count} ${count === 1 ? 'event' : 'events'}` : ''}`}
                      data-today={today ? '' : undefined}
                      onClick={() => onSelect(day)}
                    >
                      <span className="bf-num">{day}</span>
                      {count ? <span className="bf-day__count bf-num">{count}</span> : null}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div role="region" aria-live="polite" aria-label={`Events on ${selected} ${MONTH.label.split(' ')[0]}`}>
        {dayEvents.length === 0 ? (
          <p className="bf-muted">Nothing planned for the {selected}{ordinal(selected)}. Pick another day.</p>
        ) : (
          <ul className="bf-events">
            {dayEvents.map((e) => {
              const on = going.includes(e.id)
              return (
                <li key={e.id} className="bf-event">
                  <span className="bf-event__time bf-num">{e.time}</span>
                  <div className="bf-event__main">
                    <strong>{e.title}</strong>
                    <span className="bf-muted">
                      {e.place}
                      {e.going ? ` · ${(e.going + (on ? 1 : 0)).toLocaleString()} going` : ''}
                    </span>
                  </div>
                  <Tag tone={KIND_TONE[e.kind]}>{e.kind}</Tag>
                  {e.kind === 'Maintenance' ? null : (
                    <Button size="sm" icon={on ? 'check' : 'plus'} aria-pressed={on} aria-label={`Going to ${e.title}`} onClick={() => onToggleGoing(e.id)}>
                      {on ? 'Going' : 'Going?'}
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Panel>
  )
}

function ordinal(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return 'th'
  return ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
}

/** A titled group of results in search: "Builds", "Players", "Servers". */
export function ResultGroup({ title, count, children }: { title: string; count: number; children: ReactNode }): JSX.Element {
  const [open, setOpen] = useState(true)
  const id = useId()
  return (
    <section className="bf-results" aria-labelledby={id}>
      <h3 id={id} className="bf-results__title">
        <button type="button" className="bf-link" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <Icon name={open ? 'chevronDown' : 'chevronRight'} size="sm" /> {title} <span className="bf-subtle bf-num">({count})</span>
        </button>
      </h3>
      {open ? <div className="bf-results__list">{children}</div> : null}
    </section>
  )
}
