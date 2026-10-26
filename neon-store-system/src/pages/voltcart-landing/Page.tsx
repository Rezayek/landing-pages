/**
 * VOLTCART: today's deals (`voltcart-landing`): Dispense Street. The page is a night street you walk down by scrolling;
 * every deal hangs on a kiosk, and the key you buy drops out of its slot. The thread is your key: priced on Kiosk 01,
 * carried along the overhead cable, dispensed in about 1 min, and the final action ("Get your first key").
 * Built on the project's system (src/system): tokens, components (Kiosk, MotionPause added in 0.6.0), motion and the
 * feedback standard. Copy from UX.md; every action and wait from its inventory. Sample data in data.ts (a design study).
 */
import '@fontsource/chakra-petch/500.css'
import '@fontsource/chakra-petch/600.css'
import '@fontsource/chakra-petch/700.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/500.css'
import { type RefObject, useEffect, useRef } from 'react'
import { MotionConfig } from 'motion/react'
import '@/system/tokens.css'
import { LiveRegion } from '@/system/feedback'
import { MotionPauseProvider } from '@/system/components'
import './tokens.css'
import './page.css'
import { StreetLayer } from './scene/StreetLayer'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { Deals } from './sections/Deals'
import { Passes } from './sections/Passes'
import { Delivery } from './sections/Delivery'
import { Payment } from './sections/Payment'
import { Questions } from './sections/Questions'
import { Final } from './sections/Final'
import { SiteFooter } from './sections/SiteFooter'

/** The tab title: product and outcome (UX.md). */
const TITLE = 'VOLTCART: PC and console game keys, up to 72% off (design study)'

/** The street is at night: the page sets the dark theme on <html> while it is open (DESIGN.md §System) and mirrors
 *  its ground onto the document and the theme-color meta. Everything is restored when the page unmounts. */
function useNightDocument(root: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const html = document.documentElement
    const before = { title: document.title, bg: html.style.backgroundColor, scheme: html.style.colorScheme, theme: html.dataset.theme, lang: html.lang }
    const existing = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])')
    const meta = existing ?? document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }))
    const metaBefore = meta.content
    html.dataset.theme = 'dark'
    html.lang = 'en'
    document.title = TITLE
    const ground = getComputedStyle(el).getPropertyValue('--street-fog').trim()
    html.style.backgroundColor = ground
    html.style.colorScheme = 'dark'
    meta.content = ground
    return () => {
      document.title = before.title
      html.style.backgroundColor = before.bg
      html.style.colorScheme = before.scheme
      html.lang = before.lang
      if (before.theme === undefined) delete html.dataset.theme
      else html.dataset.theme = before.theme
      if (existing) meta.content = metaBefore
      else meta.remove()
    }
  }, [root])
}

export default function Page(): React.JSX.Element {
  const root = useRef<HTMLDivElement>(null)
  useNightDocument(root)

  return (
    <MotionPauseProvider>
      {/* `user`: motion/react follows the OS setting and the system's data-motion switch (its CSS tokens). */}
      <MotionConfig reducedMotion="user">
        <div ref={root} data-page="voltcart-landing" data-theme="dark">
          <a href="#main" className="vc-skip">
            Skip to content
          </a>
          <StreetLayer />
          <Header />
          <main id="main" className="vl-main" tabIndex={-1}>
            <Hero />
            <Deals />
            <Passes />
            <Delivery />
            <Payment />
            <Questions />
            <Final />
          </main>
          <SiteFooter />
          <LiveRegion />
        </div>
      </MotionConfig>
    </MotionPauseProvider>
  )
}
