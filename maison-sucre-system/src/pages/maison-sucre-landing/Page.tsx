/**
 * Maison Sucre: wedding cakes made to order (`maison-sucre-landing`): "The climb" (CONCEPT.md). A rendered four-tier
 * cake in a wedding room; the scroll is the camera, rising tier by tier from the board to the topper, ending on
 * "Book a tasting". The thread is the cake on its stand: the film, the builder's live stand, the delivery still and
 * the booking card. Built on the project's system (src/system); copy from UX.md; every action and wait from its
 * inventory. Sections in UX.md order, in ./sections/.
 */
import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/figtree'
import { type RefObject, useEffect, useRef, useState } from 'react'
import '@/system/tokens.css'
import './tokens.css'
import { LiveRegion, ToastRegion } from '@/system/feedback'
import { Footer, Header, useInPageLinks } from '@/system/ui'
import { type Design } from '@/system/cake'
import { type LatencyId, parseLatency } from '@/system/latency'
import { Climb } from './sections/Climb'
import { Cakes } from './sections/Cakes'
import { DesignYours } from './sections/DesignYours'
import { HowItWorks } from './sections/HowItWorks'
import { Flavours } from './sections/Flavours'
import { Delivery } from './sections/Delivery'
import { Tastings } from './sections/Tastings'

/** The tab title: product and outcome, from UX.md. */
const TITLE = 'Maison Sucre · wedding cakes made to order'
const DARK = '(prefers-color-scheme: dark)'

/** Plain-word navigation (UX.md §Header). */
const NAV = [
  { href: '#cakes', label: 'Cakes' },
  { href: '#design', label: 'Design yours' },
  { href: '#how', label: 'How it works' },
  { href: '#flavours', label: 'Flavours' },
  { href: '#delivery', label: 'Delivery' },
  { href: '#tastings', label: 'Tastings' },
] as const

/** The film's cake, so the builder opens on what the visitor just climbed (UX.md A6). */
const FILM_CAKE: Design = {
  tiers: 4,
  shape: 'round',
  finish: 'fondant',
  flowers: 'cascade',
  goldLeaf: true,
  flavours: ['pistachio-rose', 'lemon-elderflower', 'chocolate-caramel', 'vanilla-raspberry'],
}

/** Mirror the page's ground and colour scheme onto the document and the theme-color meta. */
function useDocumentSurfaces(root: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const html = document.documentElement
    const before = { title: document.title, bg: html.style.backgroundColor, scheme: html.style.colorScheme }
    const existing = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const meta = existing ?? document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }))
    const metaBefore = meta.content
    const sync = (): void => {
      const style = getComputedStyle(el)
      const bg = style.getPropertyValue('--bg').trim()
      html.style.backgroundColor = bg
      html.style.colorScheme = style.getPropertyValue('color-scheme')
      meta.content = bg
    }
    document.title = TITLE
    sync()
    const dark = window.matchMedia(DARK)
    dark.addEventListener('change', sync)
    const observer = new MutationObserver(sync)
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      dark.removeEventListener('change', sync)
      observer.disconnect()
      document.title = before.title
      html.style.backgroundColor = before.bg
      html.style.colorScheme = before.scheme
      if (existing) meta.content = metaBefore
      else meta.remove()
    }
  }, [root])
}

/** The simulated waits (no backend: design study) read ?latency= like /system; a visitor gets "fast". */
function useLatency(): LatencyId {
  const [latency] = useState<LatencyId>(() => (typeof window === 'undefined' ? 'fast' : parseLatency(new URLSearchParams(window.location.search).get('latency')) ?? 'fast'))
  return latency
}

export default function Page(): React.JSX.Element {
  const root = useRef<HTMLDivElement>(null)
  useDocumentSurfaces(root)
  useInPageLinks(root)
  const latency = useLatency()
  const [design, setDesign] = useState<Design>(FILM_CAKE)
  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])
  const goTastings = (): void => {
    document.getElementById('tastings')?.scrollIntoView()
    document.getElementById('tastings-title')?.focus()
  }

  return (
    <div ref={root} data-page="maison-sucre-landing" className="min-h-svh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-[var(--space-3)] focus:left-[var(--space-3)] focus:z-50 focus:bg-[var(--surface)] focus:p-[var(--space-3)]"
      >
        Skip to content
      </a>
      <Header nav={NAV} bookVariant="secondary" onBook={goTastings} />
      <main id="main">
        <Climb />
        <Cakes latency={latency} onDesign={setDesign} />
        <DesignYours latency={latency} design={design} onDesign={setDesign} />
        <HowItWorks />
        <Flavours latency={latency} />
        <Delivery latency={latency} />
        <Tastings latency={latency} />
      </main>
      <Footer nav={NAV} />
      <LiveRegion />
      <ToastRegion />
    </div>
  )
}
