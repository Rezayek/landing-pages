/**
 * S2 What's on (CH01, UX.md §S2): five Kind tiles on a paper band. A tile is a drawn glyph on its channel colour,
 * the kind's title, one line, one mono fact and a real link into the schedule. Phone: a horizontal snap row;
 * 768+: a grid; 1024+: six columns with Concerts large. One tile is tilted. Styles: whats-on-guests.css.
 */
import type { CSSProperties, JSX } from 'react'
import { IconArtist, IconConcert, IconCosplay, IconGame, IconPanel, SectionHeader } from '@/system/ui'
import { DAYS, KINDS, type Kind, type KindId, SCHEDULE } from '../data'
import './whats-on-guests.css'

const GLYPH: Record<KindId, (p: { size?: number }) => JSX.Element> = {
  concert: IconConcert,
  panel: IconPanel,
  cosplay: IconCosplay,
  artist: IconArtist,
  game: IconGame,
}

/** The one tilted tile (FOUNDATIONS.md §9: one tilted element per group, at most 3 degrees). */
const TILTED: KindId = 'artist'
const TILT = '-2deg'

function KindTile({ kind, index, onSeeKind }: { kind: Kind; index: number; onSeeKind: (kind: KindId) => void }): JSX.Element {
  const Glyph = GLYPH[kind.id]
  const tilted = kind.id === TILTED
  const large = kind.id === 'concert'
  const style = {
    '--slam-delay': `calc(${Math.min(index + 1, 6)} * var(--stagger-scene))`,
    ...(tilted ? { '--tile-tilt': TILT } : null),
  } as CSSProperties
  return (
    <article
      className="wg-tile"
      data-kind={kind.id}
      data-size={large ? 'large' : undefined}
      data-tilt={tilted ? '' : undefined}
      data-slam=""
      style={style}
    >
      <div className="wg-tile-head" aria-hidden>
        <Glyph size={large ? 72 : 44} />
      </div>
      <div className="wg-tile-body">
        <h3 className="wg-tile-title">{kind.title}</h3>
        <p className="wg-tile-line">{kind.line}</p>
        <p className="wg-tile-fact">{kind.fact}</p>
        <a className="wg-link wg-tile-link" href="#schedule" onClick={() => onSeeKind(kind.id)}>
          See {kind.plural} in the schedule
        </a>
      </div>
      {large && (
        <ul className="wg-tile-shows" aria-label={`${kind.title} by night`}>
          {SCHEDULE.filter((slot) => slot.kind === kind.id).map((slot) => (
            <li key={slot.title}>
              <span className="wg-tile-show-when">
                {DAYS.find((d) => d.id === slot.day)?.name} · {slot.time}
              </span>
              <span className="wg-tile-show-what">{slot.title}</span>
              <span className="wg-tile-show-where">{slot.place}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function WhatsOn({ onSeeKind }: { onSeeKind: (kind: KindId) => void }): JSX.Element {
  return (
    <section
      className="pg-section"
      id="whats-on-sec"
      data-band="paper"
      data-wipe=""
      style={{ '--wipe-color': 'var(--night-950)' } as CSSProperties}
      aria-labelledby="whats-on"
    >
      <div className="pg-wrap">
        <SectionHeader
          id="whats-on"
          channel="CH01"
          title="Five channels,"
          outlined="three days"
          sub="Pick your kind of day. Each one shows how many and when."
        />
        <div className="wg-tiles">
          {KINDS.map((kind, i) => (
            <KindTile key={kind.id} kind={kind} index={i} onSeeKind={onSeeKind} />
          ))}
        </div>
      </div>
    </section>
  )
}
