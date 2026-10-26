/**
 * Blockfeed landing (`blockfeed-landing`): "Every build has an address." A build assembles on its plot with its seed
 * and coordinates around it; the page then descends through Y-levels (builds, challenge, servers, safety) to the
 * sign-up at bedrock, and every coordinate on the way is a /tp back to the plot. The thread is the address.
 * Built on the project's system (src/system): tokens, components, motion and the feedback standard live there; this page
 * composes them and adds only its voxel plot and strata (tokens.css, sections/). Copy comes from UX.md only.
 * A design study: every build, builder, server and vote is invented (src/system/social/fixtures.ts).
 */
import { type RefObject, useEffect, useRef } from 'react'
import '@/system/tokens.css'
import './tokens.css'
import { LiveRegion, ToastRegion } from '@/system/feedback'
import './sections/page.css'
import { Builds } from './sections/Builds'
import { Challenge } from './sections/Challenge'
import { Depth, Footer, Header, PhoneBar } from './sections/Chrome'
import { Hero } from './sections/Hero'
import { Safety } from './sections/Safety'
import { Servers } from './sections/Servers'
import { SignUp } from './sections/SignUp'
import { Strata } from './sections/Strata'
import { useGroundTextures } from './sections/ground'

/** The tab title: product and outcome, from UX.md. */
const TITLE = 'Blockfeed: share builds with their seed and coordinates'

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
    // dark only (DESIGN.md): the page lives on the night backdrop whatever the setting, like the game's menus
    const themeBefore = html.getAttribute('data-theme')
    html.setAttribute('data-theme', 'dark')
    sync()
    const dark = window.matchMedia(DARK)
    dark.addEventListener('change', sync)
    // A theme toggle sets data-theme on <html> (guides/design-system.md §2); follow it too.
    const observer = new MutationObserver(sync)
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      dark.removeEventListener('change', sync)
      observer.disconnect()
      if (themeBefore === null) html.removeAttribute('data-theme')
      else html.setAttribute('data-theme', themeBefore)
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
  useDocumentSurfaces(root)
  useGroundTextures(root)
  return (
    <div data-page="blockfeed-landing" ref={root}>
      <LiveRegion />
      <ToastRegion />
      <Header />
      <main>
        <Hero />
        <Strata layer="grass" />
        <Builds />
        <Strata layer="dirt" />
        <Challenge />
        <Strata layer="stone" />
        <Servers />
        <Strata layer="deep" />
        <Safety />
        <Strata layer="bedrock" />
        <SignUp />
      </main>
      <Footer />
      <Depth />
      <PhoneBar />
    </div>
  )
}
