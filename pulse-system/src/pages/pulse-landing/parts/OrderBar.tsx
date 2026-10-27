/**
 * The phone's sticky pre-order bar (UX.md §CTA path: "on phone a sticky bar 'Pre-order · 349 €*' after the hero"). It
 * shows only on phones, only between the hero and the order section: the pre-order key in thumb reach, with the patch
 * the visitor would order on its readout. A raised strip with a machined top edge, never a shadow. While it shows, the
 * document reserves its height at the bottom (scroll-padding), so a focused key or field is never hidden behind it.
 */
import { useEffect, useState, type JSX } from 'react'
import { useYourPatch } from './yourPatch'

const PHONE = '(max-width: 40rem)'

export function OrderBar(): JSX.Element {
  const { name } = useYourPatch()
  const [heroGone, setHeroGone] = useState(false)
  const [orderIn, setOrderIn] = useState(false)
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE).matches)
  const on = phone && heroGone && !orderIn

  useEffect(() => {
    const mq = window.matchMedia(PHONE)
    const sync = (): void => setPhone(mq.matches)
    mq.addEventListener('change', sync)
    const hero = document.querySelector<HTMLElement>('[data-section="hero"]')
    const order = document.getElementById('order')
    const io = new IntersectionObserver((entries) =>
      entries.forEach((e) => {
        if (e.target === hero) setHeroGone(!e.isIntersecting && e.boundingClientRect.top < 0)
        if (e.target === order) setOrderIn(e.isIntersecting)
      }),
    )
    if (hero) io.observe(hero)
    if (order) io.observe(order)
    return () => {
      mq.removeEventListener('change', sync)
      io.disconnect()
    }
  }, [])

  useEffect(() => {
    const html = document.documentElement
    html.style.scrollPaddingBottom = on ? 'calc(var(--bar-h, 4.5rem) + env(safe-area-inset-bottom))' : ''
    return () => {
      html.style.scrollPaddingBottom = ''
    }
  }, [on])

  return (
    <div className="pl-bar" data-on={on || undefined} aria-hidden={!on} inert={!on}>
      <span className="pl-bar__patch">
        <span className="pi-legend">Your patch</span>
        <span className="pl-bar__name">{name}</span>
      </span>
      <a className="fb fb-btn" data-variant="primary" href="#order">
        Pre-order · 349 €*
      </a>
      <span className="pl-bar__terms">*Invented price. Pay nothing until it ships.</span>
    </div>
  )
}
