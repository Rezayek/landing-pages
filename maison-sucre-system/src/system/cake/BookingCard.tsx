import { useEffect, useRef, type JSX } from 'react'
import { announce } from '../feedback'
import { formatDate } from '../ui'
import { petals, play } from '../vfx'

export interface BookingCardProps {
  date: Date
  time: string
  flavours: readonly string[]
  reference: string
  /** Play the celebration (once per booking; never on a revisit). */
  celebrate?: boolean
  /** Take focus when it replaces the booking form (off for a still view on /system). */
  focusOnMount?: boolean
}

/**
 * The confirmed tasting (COMPONENTS.md §Booking card): it replaces the booking form in the same place and takes
 * focus. The one celebration on the site: the gold fleck is pressed on ('gild') and a few sugar petals fall once
 * ('petals'; the glint was dropped in 0.3.0, calmer motion), MOTION-SYSTEM.md: success. Under reduced motion it is simply there.
 */
export function BookingCard({ date, time, flavours, reference, celebrate = true, focusOnMount = true }: BookingCardProps): JSX.Element {
  const heading = useRef<HTMLHeadingElement>(null)
  const lid = useRef<HTMLDivElement>(null)
  const fleck = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (focusOnMount) heading.current?.focus()
    announce(`Tasting booked for ${formatDate(date, false)} at ${time}`)
    if (!celebrate) return
    void play(fleck.current, 'gild')
    petals(lid.current)
  }, [date, time, celebrate, focusOnMount])
  return (
    <article className="ms-booking">
      <div className="ms-booking__lid" ref={lid}>
        <span className="ms-booking__fleck" ref={fleck} aria-hidden="true" />
        <span>It's in the diary. Six slices will be waiting for you.</span>
      </div>
      <div className="ms-booking__body">
        <h3 ref={heading} tabIndex={-1} className="ms-display">
          Your tasting is booked
        </h3>
        <p className="ms-booking__when">
          {formatDate(date)} at {time}
        </p>
        <p>We can't wait to meet you both.</p>
        <dl>
          <dt>Where</dt>
          <dd>The kitchen, 12 Example Mews, London (sample)</dd>
          <dt>Bring</dt>
          <dd>Your planner and any pictures you love</dd>
          <dt>Flavours</dt>
          <dd>{flavours.length ? flavours.join(', ') : 'We will bring our six favourites'}</dd>
          <dt>Reference</dt>
          <dd className="ms-figure">{reference} (sample)</dd>
        </dl>
        <a className="ms-link" data-standalone="" href="#tastings">
          Add to calendar
        </a>
      </div>
    </article>
  )
}
