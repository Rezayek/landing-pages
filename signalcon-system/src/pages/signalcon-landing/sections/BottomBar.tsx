/**
 * Phone bottom bar: carries the primary once the hero's own button has left the screen, and hides while the tickets
 * section is on screen, so one primary shows at a time.
 */
import { type JSX, type RefObject, useEffect, useState } from 'react'
import { ButtonLink } from '@/system/ui'
import { focusHeading } from './Header'

export function BottomBar({ heroCta }: { heroCta: RefObject<HTMLAnchorElement | null> }): JSX.Element {
  const [heroVisible, setHeroVisible] = useState(true)
  const [ticketsVisible, setTicketsVisible] = useState(false)

  useEffect(() => {
    const cta = heroCta.current
    const tickets = document.getElementById('tickets-sec')
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === cta) setHeroVisible(e.isIntersecting)
        if (e.target === tickets) setTicketsVisible(e.isIntersecting)
      }
    })
    if (cta) io.observe(cta)
    if (tickets) io.observe(tickets)
    return () => io.disconnect()
  }, [heroCta])

  const shown = !heroVisible && !ticketsVisible
  useEffect(() => {
    document.documentElement.style.setProperty('--sticky-bottom', shown ? '88px' : '0px')
    return () => {
      document.documentElement.style.removeProperty('--sticky-bottom')
    }
  }, [shown])

  return (
    <div className="pg-bottombar" data-shown={shown || undefined} aria-hidden={!shown} inert={!shown}>
      <ButtonLink href="#tickets" variant="primary" block onClick={() => focusHeading('tickets')}>
        Pick your pass · from €39
      </ButtonLink>
      <span className="pg-bottombar-note">1-day, 3-day or VIP</span>
    </div>
  )
}
