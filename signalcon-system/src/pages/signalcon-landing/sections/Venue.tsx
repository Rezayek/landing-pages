/**
 * S6 Venue and travel (CH05, Q6): where it is, how to get there and home, when the doors open. A paper band.
 * The map is a CRT screen with the drawn district map; it flips once (channel change) when it first scrolls in.
 * Copy is from UX.md §S6; the facts come from data.ts.
 */
import { type CSSProperties, type JSX, useEffect, useRef } from 'react'
import {
  ButtonLink,
  IconAccess,
  IconBike,
  IconClock,
  IconDoor,
  IconExternal,
  IconMoon,
  IconTram,
  Screen,
  SectionHeader,
  Tape,
} from '@/system/ui'
import { flip } from '@/system/vfx'
import { DAYS, EVENT, TRAVEL } from '../data'
import { VenueMap } from './VenueMap'
import './venue-faq.css'

const ICONS = {
  tram: IconTram,
  night: IconMoon,
  bike: IconBike,
  access: IconAccess,
} as const

/** The ring colour of each row's icon: the night tram is the hot line, step-free access is the acid one. */
const TONE = { tram: undefined, night: 'signal', bike: undefined, access: 'accent' } as const

const MAPS_HREF = `https://www.openstreetmap.org/search?query=${encodeURIComponent('Ferry Lane')}`

export function Venue(): JSX.Element {
  const screen = useRef<HTMLDivElement>(null)

  // Channel flip, once, when the map screen first scrolls into view.
  useEffect(() => {
    const el = screen.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        void flip(el)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section
      className="pg-section"
      id="venue-sec"
      data-band="paper"
      data-wipe=""
      style={{ '--wipe-color': 'var(--night-950)' } as CSSProperties}
      aria-labelledby="venue"
    >
      <div className="pg-wrap">
        <SectionHeader id="venue" channel="CH05" title="Getting there" outlined="and getting home" />
        <div className="vf-grid">
          <div className="vf-map-col">
            <Screen ref={screen} ratio="var(--vf-map-ratio)" channel="CH05" caption="Map not to scale.">
              <VenueMap />
            </Screen>
          </div>

          <div className="vf-info">
            <address className="vf-address">
              {EVENT.venue}, {EVENT.address}
            </address>

            <ul className="vf-rows">
              {TRAVEL.map((t) => {
                const Icon = ICONS[t.id]
                return (
                  <li className="vf-row" key={t.id}>
                    <span className="vf-ico" data-tone={TONE[t.id]}>
                      <Icon size={24} />
                    </span>
                    <p className="vf-row-text">{t.text}</p>
                  </li>
                )
              })}
            </ul>

            <div className="vf-doors">
              <Tape tone="night" tilt={-2}>
                Doors
              </Tape>
              <dl className="vf-doors-list">
                {DAYS.map((d) => (
                  <div key={d.id}>
                    <dt>{d.short}</dt>
                    <dd>{d.doors}</dd>
                  </div>
                ))}
              </dl>
              <p className="vf-note" data-strong="">
                <IconDoor size={22} />
                <span>VIP early entry one hour before doors.</span>
              </p>
            </div>

            <p className="vf-note">
              <IconClock size={22} />
              <span>Lines are longest in the first 90 minutes after doors open. Come after that, or get VIP early entry and skip them.</span>
            </p>

            <div className="vf-actions">
              <ButtonLink variant="secondary" href={MAPS_HREF} target="_blank" rel="noopener">
                Open in maps (new tab)
                <IconExternal size={20} />
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Venue
