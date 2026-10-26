/**
 * Echo Atlas landing (`tidelog-landing`): the Echo orbit concept (CONCEPT.md R2-5), built from UX.md on the project's
 * system. Header and hero on the night band; the build, planner, team, banners and start sections follow the theme.
 */
import '@fontsource-variable/saira/wdth.css'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { LiveRegion, ToastRegion } from '@/system/feedback'
import { reducedMotion } from '@/system/vfx'
import './tokens.css'
import './landing.css'
import { BuildProvider } from './sections/build'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { BannersSection, BuildSection, PageFooter, PlannerSection, StartSection, TeamSection } from './sections/Sections'

const TITLE = 'Echo Atlas: every Resonator build, the Echo planner and the team builder'

const DARK = '(prefers-color-scheme: dark)'

/** Long enough for a section's arrival (its last list item's delay plus --dur-route-in). */
const ARRIVAL_MS = 1400

/** Mirror the page's ground and colour scheme onto the document and the theme-color meta, so overscroll, the
 *  window scrollbar and the browser chrome follow the tokens in both themes. Restored when the page unmounts. */
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

/**
 * Scroll spy: the section crossing the middle band of the viewport is the top bar's current item; none over the hero.
 * After a nav click the arch goes straight to the chosen item: the spy holds until that scroll ends, so the arch never
 * stops on the sections it passes.
 */
function useCurrentSection(root: RefObject<HTMLDivElement | null>): [string | null, (id: string) => void] {
  const [current, setCurrent] = useState<string | null>(null)
  const held = useRef(false)
  const spied = useRef<string | null>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const seen = new Map<string, boolean>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set((e.target as HTMLElement).dataset.spy ?? '', e.isIntersecting)
        const order = [...el.querySelectorAll<HTMLElement>('[data-spy]')].map((s) => s.dataset.spy ?? '')
        spied.current = order.find((id) => seen.get(id)) ?? null
        if (!held.current) setCurrent(spied.current)
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    for (const s of el.querySelectorAll('[data-spy]')) io.observe(s)
    return () => io.disconnect()
  }, [root])
  const navigate = useCallback((id: string) => {
    setCurrent(id)
    held.current = true
    let fallback = 0
    const release = (): void => {
      window.clearTimeout(fallback)
      window.removeEventListener('scrollend', release)
      // the chosen item stays current (Banners may never reach the middle band at the page's end); scrolling moves it
      held.current = false
    }
    window.addEventListener('scrollend', release, { once: true })
    // browsers without scrollend, or a click that does not scroll
    fallback = window.setTimeout(release, 1200)
  }, [])
  return [current, navigate]
}

/**
 * Section arrival: arms the page (landing.css hides a section's parts only while it is armed and unseen, so without
 * JS nothing is hidden) and marks each section `data-seen` the first time it enters, which plays its settle once.
 */
function useSectionArrival(root: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const section = e.target as HTMLElement
          section.dataset.seen = ''
          io.unobserve(section)
          // once the arrival has played, items mounted later (a swapped Echo, a placed card) answer at once
          window.setTimeout(() => (section.dataset.settled = ''), ARRIVAL_MS)
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    for (const s of el.querySelectorAll('.tl-section, .tl-footer')) io.observe(s)
    el.dataset.armed = ''
    return () => {
      io.disconnect()
      delete el.dataset.armed
    }
  }, [root])
}

/** In-page links (A5, A19): scroll to the section (no travel under reduced motion) and move focus to its heading. */
function goToSection(event: React.MouseEvent<HTMLDivElement>): void {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
  const target = link && link.hash.length > 1 ? document.getElementById(link.hash.slice(1)) : null
  if (!target || event.defaultPrevented || event.metaKey || event.ctrlKey) return
  event.preventDefault()
  target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', link!.hash)
  const heading = target.matches('h1, h2') ? target : target.querySelector<HTMLElement>('h1, h2')
  if (heading) {
    heading.tabIndex = -1
    heading.focus({ preventScroll: true })
  }
}

export default function Page(): React.JSX.Element {
  const root = useRef<HTMLDivElement>(null)
  useDocumentSurfaces(root)
  const [current, setCurrent] = useCurrentSection(root)
  useSectionArrival(root)
  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])
  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- delegates the links' own clicks; Enter on a link fires click
    <div ref={root} data-page="tidelog-landing" id="top" onClick={goToSection}>
      <Header current={current} onNavigate={setCurrent} />
      <BuildProvider>
        <main>
          <Hero />
          <BuildSection />
          <PlannerSection />
          <TeamSection />
          <BannersSection />
          <StartSection />
        </main>
      </BuildProvider>
      <PageFooter />
      <LiveRegion />
      <ToastRegion />
    </div>
  )
}
