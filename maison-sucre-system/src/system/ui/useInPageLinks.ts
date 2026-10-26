import { type RefObject, useEffect } from 'react'
import { prefersReducedMotion } from '../motion'

/**
 * In-page links (INTERACTION.md: a jump lands somewhere). A plain `#hash` link scrolls but leaves focus where it was,
 * so the next Tab starts from the link and a screen reader hears nothing. Inside `root`, a click on a link to an id
 * on this page scrolls to it (smooth, or at once under reduced motion), moves focus to the target's first heading
 * (or the target itself) without a second scroll, and puts the hash in the address. Modified clicks are left alone.
 */
export function useInPageLinks(root: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const onClick = (e: MouseEvent): void => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]')
      const id = link?.getAttribute('href')?.slice(1)
      const target = id ? document.getElementById(id) : null
      if (!link || !target) return
      e.preventDefault()
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
      const focusable = target.matches('h1, h2, h3') ? target : (target.querySelector<HTMLElement>('h1, h2, h3') ?? target)
      if (!focusable.hasAttribute('tabindex')) focusable.setAttribute('tabindex', '-1')
      focusable.focus({ preventScroll: true })
      history.pushState(null, '', `#${id}`)
    }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  }, [root])
}
