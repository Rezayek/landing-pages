/**
 * Kitty waitlist (`fintech-landing`): the kitchen ledger. The household's ledger page is the thread: this week's lines
 * on the kitchen table in the hero (approve Ivy's request; the camera dives into the ledger as you scroll), one line
 * per step in the pinned story's ledger, and the visitor's own household as the next line at the end.
 * Built on the project's system (`src/system/`: FOUNDATIONS, COMPONENTS, INTERACTION, MOTION-SYSTEM, CONTENT). This
 * page composes it and adds only what it needs. Copy comes from UX.md; every action and wait is a row there.
 */
import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/fraunces/opsz-italic.css'
import '@fontsource-variable/inter'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import '@/system/tokens.css'
import { LiveRegion, ToastRegion } from '@/system/feedback'
import '@/system/ui'
import { prefersReducedMotion } from '@/system/motion'
import './tokens.css'
import './page.css'
import { Header, PageFooter } from './sections/Chrome'
import { Hero } from './sections/Hero'
import { RestBeat } from './sections/RestBeat'
import { Story } from './sections/Story'
import { Table } from './sections/Table'
import { TwoLogins } from './sections/TwoLogins'
import { Week } from './sections/Week'
import { VisitorProvider } from './visitor'

/** The tab title: product and outcome, from UX.md. */
const TITLE = 'Kitty: one balance for the whole family. Join the waitlist'

const DARK = '(prefers-color-scheme: dark)'

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
    // A theme toggle sets data-theme on <html> (guides/design-system.md §2); follow it too.
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

export default function Page(): React.JSX.Element {
  const root = useRef<HTMLDivElement>(null)
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)
  useDocumentSurfaces(root)
  useEffect(() => {
    document.documentElement.lang = 'en' // the language of the copy
  }, [])
  // A plain link to a question (#q-money, from a story step) opens that answer
  useEffect(() => {
    const open = (): void => {
      if (window.location.hash.startsWith('#q-')) setOpenQuestion(window.location.hash.slice(1))
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [])

  // In-page links (A8): scroll to the target (no smooth scroll under reduced motion), update the hash, open a question.
  const go = useCallback((id: string) => {
    if (id.startsWith('q-')) setOpenQuestion(id)
    requestAnimationFrame(() => {
      const target = document.getElementById(id)
      target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
      history.replaceState(null, '', `#${id}`)
      const focusable = id.startsWith('q-') ? target?.querySelector<HTMLElement>('button') : target?.querySelector<HTMLElement>('h2')
      if (focusable && !focusable.hasAttribute('tabindex') && focusable.tagName === 'H2') focusable.setAttribute('tabindex', '-1')
      focusable?.focus({ preventScroll: true })
    })
  }, [])

  // The header action (A7): to the hero's form, focus in the field.
  const toForm = useCallback(() => {
    const field = document.querySelector<HTMLInputElement>('#join-hero input')
    field?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' })
    field?.focus({ preventScroll: true })
  }, [])

  // No overflow clipping on the root: a clipped root hides horizontal overflow from the audit. Clip only the
  // element that bleeds on purpose.
  return (
    <div ref={root} id="top" data-page="fintech-landing" className="fl">
      <a href="#main" className="fl-skip">
        Skip to content
      </a>
      <Header onAnchor={go} onJoin={toForm} />
      <VisitorProvider>
      <main id="main">
        <Hero onAnchor={go} />
        <Story />
        <Week />
        <TwoLogins />
        <RestBeat />
        <Table openId={openQuestion} />
      </main>
      </VisitorProvider>
      <PageFooter onAnchor={go} />
      <LiveRegion />
      <ToastRegion />
    </div>
  )
}
