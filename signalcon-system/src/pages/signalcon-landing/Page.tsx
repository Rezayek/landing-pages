/**
 * SIGNAL//CON 2027 (`signalcon-landing`): Channel Surf. The expo is a late-night TV channel; the visitor flips CH01
 * to CH06 and lands on the ticket channel (CH04). The hero tunes in from static to the key art.
 * Built on the project's system (src/system: FOUNDATIONS, COMPONENTS, MOTION-SYSTEM, INTERACTION, CONTENT); this page
 * composes it. Copy from UX.md; facts from data.ts (fictional samples). Waits are simulated with latency.ts and read
 * ?latency=fast|slow|very-slow|stalled|fail.
 */
// Fonts load here, so they ship in this page's chunk only (FOUNDATIONS.md §3).
import '@fontsource-variable/archivo/standard-italic.css'
import '@fontsource-variable/instrument-sans/index.css'
import '@fontsource-variable/martian-mono/index.css'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { LiveRegion } from '@/system/feedback'
import { parseLatency, type LatencyId } from '@/system/latency'
import { restoreMotionChoice } from '@/system/ui'
import { armReveals } from '@/system/vfx'
import { type KindId, STOCK_START } from './data'
import { Boot } from './sections/Boot'
import { BottomBar } from './sections/BottomBar'
import { Faq } from './sections/Faq'
import { Footer } from './sections/Footer'
import { Guests } from './sections/Guests'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { Schedule } from './sections/Schedule'
import { type Stock, Tickets } from './sections/Tickets'
import { Venue } from './sections/Venue'
import { WhatsOn } from './sections/WhatsOn'
// This page's extensions to the system's tokens, then its layout.
import './tokens.css'
import './page.css'
import './sections/shell.css'

/** The tab title: product and outcome, from UX.md. */
const TITLE = 'SIGNAL//CON 2027: anime + games expo, 23–25 July, Varo City'

const DARK = '(prefers-color-scheme: dark)'

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

const clock = (): string => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/**
 * The simulated live stock feed (UX.md A10): every 20 s while the tickets section is on screen, a few passes sell.
 * Under ?latency=fail the feed pauses and says so.
 */
function useStockFeed(latency: LatencyId): { stock: Stock; paused: boolean; updatedAt: string } {
  // ?sample=low drops VIP to 3 left, so the mid-hold "only n left" path can be checked (a study sample hook)
  const [stock, setStock] = useState<Stock>(() =>
    new URLSearchParams(window.location.search).get('sample') === 'low' ? { ...STOCK_START, vip: [3, 300] } : { ...STOCK_START },
  )
  const [paused, setPaused] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(clock)
  useEffect(() => {
    const section = document.getElementById('tickets-sec')
    let visible = false
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    if (section) io.observe(section)
    const t = window.setInterval(() => {
      if (!visible) return
      if (latency === 'fail') {
        setPaused(true)
        return
      }
      setPaused(false)
      setStock((s) => {
        const sell = (k: keyof Stock, max: number): readonly [number, number] => [Math.max(0, s[k][0] - Math.floor(Math.random() * (max + 1))), s[k][1]]
        return { ...s, three: sell('three', 4), vip: sell('vip', 1), fri: sell('fri', 6), sun: sell('sun', 5) }
      })
      setUpdatedAt(clock())
    }, 20000)
    return () => {
      window.clearInterval(t)
      io.disconnect()
    }
  }, [latency])
  return { stock, paused, updatedAt }
}

export default function Page(): React.JSX.Element {
  const root = useRef<HTMLDivElement>(null)
  const heroCta = useRef<HTMLAnchorElement>(null)
  const [latency] = useState<LatencyId>(() => parseLatency(new URLSearchParams(window.location.search).get('latency')) ?? 'slow')
  const [kind, setKind] = useState<KindId | 'all'>('all')
  const { stock, paused, updatedAt } = useStockFeed(latency)
  useDocumentSurfaces(root)

  useEffect(() => {
    document.documentElement.lang = 'en'
    restoreMotionChoice()
  }, [])
  useEffect(() => {
    if (!root.current) return
    return armReveals(root.current)
  }, [])

  const seeKind = useCallback((k: KindId) => {
    setKind(k)
    window.setTimeout(() => document.getElementById('schedule')?.focus({ preventScroll: true }), 0)
  }, [])

  // No overflow clipping on the root beyond overflow-x: clip in page.css (the diagonal bands bleed on purpose).
  return (
    <div ref={root} data-page="signalcon-landing" className="min-h-svh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-[var(--space-3)] focus:left-[var(--space-3)] focus:z-[var(--z-toast)] focus:rounded-[var(--radius-control)] focus:bg-[var(--accent)] focus:p-[var(--space-3)] focus:text-[var(--on-accent)]"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero threeDayLeft={stock.three[0]} threeDayTotal={stock.three[1]} ctaRef={heroCta} />
        <WhatsOn onSeeKind={seeKind} />
        <Guests />
        <Schedule kind={kind} onKindChange={setKind} />
        <Tickets stock={stock} feedPaused={paused} updatedAt={updatedAt} latency={latency} />
        <Venue />
        <Faq ctaHref="#tickets" />
      </main>
      <Footer />
      <BottomBar heroCta={heroCta} />
      <LiveRegion />
      <Boot />
    </div>
  )
}
