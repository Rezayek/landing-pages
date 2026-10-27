/**
 * The page frame (COMPONENTS.md, Header and footer): the top rail with the mark, three in-page links, the finish
 * switch and a phone menu (disclosure pattern), and the bottom rail with the design-study notice and the in-app
 * "Reduce motion" switch.
 */
import { useEffect, useId, useRef, useState, type JSX, type ReactNode } from 'react'
import { FinishSwitch, type Finish } from './controls'

const NAV = [
  { href: '#play', label: 'Play' },
  { href: '#inside', label: 'Inside' },
  { href: '#patches', label: 'Patches' },
  { href: '#specs', label: 'Specs' },
] as const

export function PulseMark({ size = 28 }: { size?: number }): JSX.Element {
  return (
    <svg className="pi-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" className="pi-mark__arc" pathLength={360} />
      <circle cx="16" cy="16" r="4" className="pi-mark__led" />
    </svg>
  )
}

export function SiteHeader({
  finish,
  onFinish,
  current,
  actions,
  finishIn = 'header',
}: {
  finish: Finish
  onFinish: (f: Finish) => void
  current?: string
  actions?: ReactNode
  /** where the finish switch sits: the header (and the phone menu), or the footer rail (`SiteFooter` `finish`) */
  finishIn?: 'header' | 'footer'
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <header className="pi-rail pi-rail--top">
      <a className="pi-skip" href="#play">
        Skip to the synth
      </a>
      <a className="pi-brand" href="#top" aria-label="PULSE-1, back to the top">
        <PulseMark />
        <span className="pi-brand__word">PULSE-1</span>
      </a>
      <nav aria-label="Page" className="pi-nav">
        <button
          ref={button}
          type="button"
          className="pi-quiet pi-nav__menu"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
        >
          {/* one short word either way, so opening the menu never reflows the one-row header */}
          {open ? 'Close' : 'Menu'}
        </button>
        <ul id={panelId} className="pi-nav__list" data-open={open || undefined}>
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} aria-current={current === n.href ? 'true' : undefined} onClick={() => setOpen(false)}>
                {n.label}
              </a>
            </li>
          ))}
          {/* phones: the finish switch lives in the menu, so the header keeps one row */}
          {finishIn === 'header' ? (
            <li className="pi-nav__finish">
              <FinishSwitch value={finish} onChange={onFinish} />
            </li>
          ) : null}
        </ul>
      </nav>
      {actions ? <div className="pi-rail__actions">{actions}</div> : null}
      {finishIn === 'header' ? <FinishSwitch value={finish} onChange={onFinish} /> : null}
    </header>
  )
}

export function SiteFooter({ notice, finish, onFinish }: { notice?: ReactNode; finish?: Finish; onFinish?: (f: Finish) => void }): JSX.Element {
  const [reduced, setReduced] = useState(() => typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduced')
  function toggle(): void {
    const next = !reduced
    setReduced(next)
    if (next) document.documentElement.dataset.motion = 'reduced'
    else delete document.documentElement.dataset.motion
    try {
      window.localStorage.setItem('pulse-motion', next ? 'reduced' : 'full')
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  }
  return (
    <footer className="pi-rail pi-rail--bottom">
      <span className="pi-vents" aria-hidden="true" />
      <p className="pi-footer__notice">{notice ?? 'PULSE-1 is a fictional design study. No product, price or ship date exists. Forms send nothing.'}</p>
      <div className="pi-footer__links">
        {finish && onFinish ? <FinishSwitch value={finish} onChange={onFinish} /> : null}
        <button type="button" className="pi-quiet" aria-pressed={reduced} onClick={toggle}>
          Reduce motion
        </button>
        <a href="#top">Back to the top</a>
      </div>
    </footer>
  )
}
