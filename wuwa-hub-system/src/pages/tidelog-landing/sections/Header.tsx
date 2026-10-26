/**
 * Header: the mark, the top bar with the resonance cap (CapNav, scroll spy), and the quiet team-builder link. On
 * phones the four items take their short names so the whole bar fits at 320 px (agreed round 1, A12).
 */
import { useSyncExternalStore, type JSX } from 'react'
import { CapNav, Logo } from '@/system/components'
import { LINKS, SECTIONS, SECTIONS_SHORT } from './data'

const NARROW = '(max-width: 52rem)'
const subscribe = (change: () => void): (() => void) => {
  const query = window.matchMedia(NARROW)
  query.addEventListener('change', change)
  return () => query.removeEventListener('change', change)
}

export function Header({ current, onNavigate }: { current: string | null; onNavigate: (id: string) => void }): JSX.Element {
  const narrow = useSyncExternalStore(subscribe, () => window.matchMedia(NARROW).matches)
  return (
    <header className="tl-header">
      <Logo href="#top" />
      <CapNav items={narrow ? SECTIONS_SHORT : SECTIONS} current={current} onNavigate={onNavigate} label="Page sections" />
      <a className="tl-header__action ea-link" data-standalone="" href={LINKS.team}>
        Open the team builder
      </a>
    </header>
  )
}
