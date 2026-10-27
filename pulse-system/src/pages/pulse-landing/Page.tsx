/**
 * PULSE-1 (`pulse-landing`): the signal path, live and patchable. The visitor plays the instrument on the first screen,
 * watches the signal on a phosphor CRT, then sees the device lift apart in the order the sound travels, plays six
 * patches, reads the specs and pre-orders with the sound they made (CONCEPT.md). The thread: the signal, as the trace
 * and the patch cable.
 * Built on the project's system: tokens, components, motion and the feedback standard live in src/system/. This page
 * composes them; its own parts (the CRT, the cable, the path, the tag, the scroll story) are in ./parts and
 * ./sections, recorded in SYSTEM.md as page-local. Copy comes from UX.md only.
 */
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/doto'
import { type RefObject, use, useEffect, useRef, useState } from 'react'
import '@/system/tokens.css'
import './tokens.css'
import { LiveRegion, announce } from '@/system/feedback'
import { Led, SiteFooter, SiteHeader, applyFinish, engine, savedFinish, type Finish } from '@/system/instrument'
import { OrderBar } from './parts/OrderBar'
import { startYourPatch } from './parts/yourPatch'
import { Hero } from './sections/Hero'
import { Inside } from './sections/Inside'
import { Patches } from './sections/Patches'
import { Specs } from './sections/Specs'
import { Preorder } from './sections/Preorder'

/** The tab title: product and outcome, from UX.md. */
const TITLE = 'PULSE-1 · an eight-voice desktop synth you can play here (design study)'

const DARK = '(prefers-color-scheme: dark)'

/** The page's two faces, fetched before its first render (a second at most, then it renders on the fallbacks): the
 *  headline is set at 82 % width and the legends at 125 %, which no local face can match, so the text sets once in
 *  its own face and the swap moves nothing (CLS). */
const FONTS: Promise<unknown> =
  typeof document === 'undefined'
    ? Promise.resolve()
    : Promise.race([
        Promise.all([document.fonts.load('700 16px "Archivo Variable"'), document.fonts.load('400 16px "Doto Variable"')]).catch(() => undefined),
        new Promise((done) => window.setTimeout(done, 1000)),
      ])

// the visitor's patch (Night Bass) is loaded before the first render, so the first screen never paints the engine's
// default sound and then jumps to it (the CRT marks and the OLED moved: CLS)
startYourPatch()

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

/** The header's sound key: shown once the sound is on, so it can be stopped from anywhere on the page (UX A5). */
function HeaderSound(): React.JSX.Element | null {
  const { status } = engine.useEngine()
  if (status !== 'on') return null
  return (
    <button
      type="button"
      className="pi-quiet pl-sound-off"
      onClick={() => {
        // this key leaves with the sound: focus goes to the device's sound key, the one that turns it back on
        ;[...document.querySelectorAll<HTMLElement>('.pl-hero .pi-sound .fb-btn')].find((key) => key.offsetParent)?.focus()
        void engine.stop().then(() => announce('Sound off'))
      }}
    >
      <Led state="on" /> Sound off
    </button>
  )
}

export default function Page(): React.JSX.Element {
  use(FONTS)
  const root = useRef<HTMLDivElement>(null)
  const [finish, setFinish] = useState<Finish>(() => savedFinish() ?? 'graphite')
  useDocumentSurfaces(root)
  // in-page links (UX A20): the browser scrolls, and focus follows to the section's heading, so a keyboard or
  // screen-reader visitor lands where they jumped
  useEffect(() => {
    const el = root.current
    if (!el) return
    const onClick = (e: MouseEvent): void => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const target = document.getElementById(decodeURIComponent(a.hash.slice(1)))
      const heading = target?.matches('h1, h2') ? target : target?.querySelector<HTMLElement>('h1, h2')
      if (!heading) return
      if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1
      requestAnimationFrame(() => heading.focus({ preventScroll: true }))
    }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  }, [])
  // section hand-offs (MOTION.md): each section is marked once as it arrives, so its arrival effect plays once;
  // nothing is hidden before it, and reduced motion skips the marks
  useEffect(() => {
    const el = root.current
    if (!el || document.documentElement.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).dataset.seen = 'true'
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.25 },
    )
    el.querySelectorAll('[data-section]').forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    document.documentElement.lang = 'en'
    applyFinish(finish)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pickFinish = (f: Finish): void => {
    setFinish(f)
    applyFinish(f)
  }

  return (
    <div ref={root} data-page="pulse-landing" id="top">
      <SiteHeader
        finishIn="footer"
        finish={finish}
        onFinish={pickFinish}
        actions={
          <>
            <span className="pl-study pi-legend">Design study · not a real product</span>
            <HeaderSound />
            <a className="fb fb-btn" data-variant="secondary" href="#order">
              Pre-order
            </a>
          </>
        }
      />
      <main id="main">
        <Hero />
        <Inside />
        <Patches />
        <Specs />
        <Preorder />
      </main>
      <OrderBar />
      <SiteFooter finish={finish} onFinish={pickFinish} notice="PULSE-1 is a design study. It isn't a real product, nothing ships, and the order form sends nothing. Not related to any real instrument of a similar name." />
      <LiveRegion />
    </div>
  )
}
