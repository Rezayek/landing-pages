/**
 * S3 Guests (CH02, UX.md §S3): six guest cards as small CRT screens on the night band. A card is one button that
 * opens the shared guest Sheet, which shows the guest's channel card: a screenshot-ready poster (CRT band, portrait,
 * name plate, ON AIR tape with their first slot) that flips in, with its own link (#ch-27 to #ch-32), "Save card
 * image" (a PNG to post) and "Copy channel link"; then the bio, slots, autograph rule and the link to the schedule.
 * Portraits load lazily over a halftone placeholder; a failed portrait keeps the placeholder and shows initials
 * (A6, A7). Styles: whats-on-guests.css.
 */
import { type CSSProperties, type JSX, type Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChannelCard, type ChannelImageSpec, type ChannelTone, CopyLink, SaveCard, Screen, SectionHeader, Sheet, Tape } from '@/system/ui'
import { flip } from '@/system/vfx'
import { EVENT, GUESTS, type Guest } from '../data'
import './whats-on-guests.css'

const channelOf = (index: number): string => `CH${27 + index}`
/** Each guest's channel link: #ch-27 … #ch-32. */
const hashOf = (index: number): string => `#ch-${27 + index}`
const TONES: readonly ChannelTone[] = ['signal', 'acid', 'cyan']
/** What a guest's channel card shows, for the card and for its saved image. */
const specOf = (guest: Guest, index: number): ChannelImageSpec => ({
  channel: channelOf(index).replace('CH', 'CH '),
  tone: TONES[index % 3],
  image: guest.image,
  onAir: guest.slot.split(' · ').slice(0, 2).join(' '),
  name: guest.name,
  role: guest.role,
  dates: EVENT.datesMono,
  place: `${EVENT.venue} · Sample`,
})
const fileOf = (guest: Guest, index: number): string =>
  `signalcon-2027-ch${27 + index}-${guest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`
const indexOfHash = (hash: string): number => {
  const m = /^#ch-(\d+)$/.exec(hash)
  const i = m ? Number(m[1]) - 27 : -1
  return i >= 0 && i < GUESTS.length ? i : -1
}

type PortraitState = 'loading' | 'ok' | 'fail'

/** The picture inside a Screen: halftone placeholder behind, the image fading in over it, initials if it fails. */
function Portrait({
  guest,
  index,
  ratio,
  screenRef,
  as,
}: {
  guest: Guest
  index: number
  ratio: string
  screenRef?: Ref<HTMLDivElement>
  as?: 'div' | 'span'
}): JSX.Element {
  const [state, setState] = useState<PortraitState>('loading')
  const img = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const el = img.current
    if (el?.complete) setState(el.naturalWidth > 0 ? 'ok' : 'fail')
  }, [])
  return (
    <Screen as={as} ref={screenRef} ratio={ratio} channel={channelOf(index)} busy={state === 'loading'}>
      <span className="wg-ph sg-halftone" aria-hidden />
      {state === 'fail' && (
        <span className="wg-initials" aria-hidden>
          {guest.initials}
        </span>
      )}
      <img
        ref={img}
        className="wg-img"
        data-state={state}
        src={guest.image}
        loading="lazy"
        decoding="async"
        width="480"
        height="480"
        alt=""
        onLoad={() => setState('ok')}
        onError={() => setState('fail')}
      />
    </Screen>
  )
}

function GuestCard({
  guest,
  index,
  expanded,
  onOpen,
}: {
  guest: Guest
  index: number
  expanded: boolean
  onOpen: (guest: Guest, index: number) => void
}): JSX.Element {
  const slotId = `guest-slot-${guest.id}`
  return (
    <li className="wg-guest-item" data-slam="" style={{ '--slam-delay': `calc(${index % 6} * var(--stagger-scene))` } as CSSProperties}>
      <button
        type="button"
        className="wg-guest sg-squash"
        aria-label={`${guest.name}, ${guest.role}. Open details`}
        aria-describedby={slotId}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        onClick={() => onOpen(guest, index)}
      >
        <Portrait as="span" guest={guest} index={index} ratio="1 / 1" />
        <span className="wg-guest-name">{guest.name}</span>
        <span className="wg-guest-role">{guest.role}</span>
        <span className="wg-guest-slot" id={slotId}>
          {guest.slot}
        </span>
      </button>
    </li>
  )
}

export function Guests(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<{ guest: Guest; index: number } | null>(null)
  const goToSchedule = useRef(false)

  const card = useRef<HTMLDivElement>(null)
  const spec = useMemo(() => (current ? specOf(current.guest, current.index) : null), [current])

  const openGuest = useCallback((guest: Guest, index: number): void => {
    setCurrent({ guest, index })
    setOpen(true)
    // the card has its own address, without a jump: a link to it opens this card
    history.replaceState(null, '', hashOf(index))
  }, [])

  // A link to a channel (#ch-28) opens that guest's card, on arrival and when the hash changes.
  useEffect(() => {
    const fromHash = (): void => {
      const i = indexOfHash(window.location.hash)
      if (i < 0) return
      document.getElementById('guests-sec')?.scrollIntoView({ block: 'start' })
      setCurrent({ guest: GUESTS[i], index: i })
      setOpen(true)
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  // The channel card flips in right after the sheet opens (the sheet's own effect has run by now).
  useEffect(() => {
    if (open) void flip(card.current)
  }, [open, current])

  const onClose = useCallback((): void => {
    setOpen(false)
    if (indexOfHash(window.location.hash) >= 0) history.replaceState(null, '', window.location.pathname + window.location.search)
    if (!goToSchedule.current) return
    goToSchedule.current = false
    // The sheet hands focus back to the card after this returns; scroll to the schedule after that.
    requestAnimationFrame(() => {
      if (window.location.hash === '#schedule') document.getElementById('schedule')?.scrollIntoView({ block: 'start' })
      else window.location.hash = 'schedule'
    })
  }, [])

  return (
    <>
      <section
        className="pg-section"
        id="guests-sec"
        data-wipe=""
        style={{ '--wipe-color': 'var(--paper-50)' } as CSSProperties}
        aria-labelledby="guests"
      >
        <div className="pg-wrap">
          <SectionHeader
            id="guests"
            channel="CH02"
            title="Who's on"
            outlined="air"
            sub="Six guests so far. Tap a guest to see when they're on."
            aside={
              <Tape tone="paper" mono tilt={2}>
                Sample lineup
              </Tape>
            }
          />
          <ul className="wg-guests">
            {GUESTS.map((guest, i) => (
              <GuestCard key={guest.id} guest={guest} index={i} expanded={open && current?.guest.id === guest.id} onOpen={openGuest} />
            ))}
          </ul>
        </div>
    </section>

      <Sheet open={open} onClose={onClose} title={current?.guest.name ?? ''}>
        {current && spec && (
          <div className="wg-sheet">
            <div className="wg-sheet-portrait">
              <ChannelCard
                ref={card}
                {...spec}
                art={<Portrait key={current.guest.id} guest={current.guest} index={current.index} ratio="4 / 5" />}
              />
            </div>
            {/* under the card on phones; under the text, beside the card, from 768 px */}
            <div className="wg-chcard-actions">
              <SaveCard key={`save-${current.guest.id}`} spec={spec} filename={fileOf(current.guest, current.index)} />
              <CopyLink
                key={current.guest.id}
                url={window.location.origin + window.location.pathname + hashOf(current.index)}
                hash={hashOf(current.index)}
                name={current.guest.name}
              />
              <p className="wg-chcard-hint">Sample lineup: these guests are invented for a design study.</p>
            </div>
            <div className="wg-sheet-text">
              <p className="wg-sheet-bio">{current.guest.bio}</p>
              <h3 className="wg-sheet-h">On air</h3>
              <ul className="wg-sheet-slots">
                {current.guest.slots.map((slot) => (
                  <li key={slot}>{slot}</li>
                ))}
              </ul>
              <p className="wg-sheet-note">Autographs: VIP passes include 2 tokens. One token gets one signature.</p>
              <a
                className="wg-link"
                href="#schedule"
                onClick={(e) => {
                  e.preventDefault()
                  goToSchedule.current = true
                  setOpen(false)
                }}
              >
                See their day in the schedule
              </a>
            </div>
          </div>
        )}
      </Sheet>
    </>
  )
}
