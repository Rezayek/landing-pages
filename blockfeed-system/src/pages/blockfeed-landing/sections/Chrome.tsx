import { useState, type JSX } from 'react'
import { Link } from 'react-router'
import { InlineMessage } from '@/system/feedback'
import { Button, Hotbar, Logo } from '@/system/ui'
import { useLevel } from './world'
import './chrome.css'

const SECTIONS = [
  { id: 'builds', label: 'Builds' },
  { id: 'challenge', label: 'Challenge' },
  { id: 'servers', label: 'Servers' },
] as const

function goTo(id: string): void {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ block: 'start' })
  const heading = el.querySelector<HTMLElement>('h2, h1')
  if (!heading) return
  heading.setAttribute('tabindex', '-1')
  heading.focus({ preventScroll: true })
}

/** Header: the logo, three plain section links, the challenge clock, and a quiet Sign in (never styled like the hero's primary). */
export function Header(): JSX.Element {
  const [note, setNote] = useState(false)
  return (
    <header className="bl-header">
      <div className="bl-header__bar">
        <a href="#top" className="bl-header__home" aria-label="Blockfeed, back to top">
          <Logo />
        </a>
        <nav className="bl-header__nav" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>
        <span className="bl-header__clock">Challenge ends in 2d 14h</span>
        <Button variant="ghost" onClick={() => setNote((n) => !n)} aria-expanded={note}>
          Sign in
        </Button>
      </div>
      {note ? (
        <div className="bl-header__note">
          <InlineMessage tone="info" onDismiss={() => setNote(false)}>
            Design study: there&apos;s nothing to sign in to yet.
          </InlineMessage>
        </div>
      ) : null}
    </header>
  )
}

/** The scroll story's counter: the current Y-level, fixed in a corner. Decorative: the headings carry the structure. */
export function Depth(): JSX.Element {
  const level = useLevel()
  // on the surface the hero's own HUD shows the address; the counter appears once the descent begins
  if (level.label === 'surface') return <></>
  return (
    <div className="bl-depth" aria-hidden="true">
      Y {level.y} · {level.label}
    </div>
  )
}

/** Phones: the section links move to a bottom hotbar within thumb reach. */
export function PhoneBar(): JSX.Element {
  const level = useLevel()
  const current = level.label === 'builds' || level.label === 'challenge' || level.label === 'servers' ? level.label : level.label === 'bedrock' ? 'signup' : 'top'
  return (
    <div className="bl-phonebar">
      <Hotbar
        label="Sections"
        value={current}
        onChange={goTo}
        items={[
          { id: 'top', label: 'Top', icon: 'feed' },
          { id: 'builds', label: 'Builds', icon: 'image' },
          { id: 'challenge', label: 'Challenge', icon: 'trophy' },
          { id: 'servers', label: 'Servers', icon: 'server' },
          { id: 'signup', label: 'Sign up', icon: 'user' },
        ]}
      />
    </div>
  )
}

/** Footer: the legal lines, verbatim from the brief, and the design-study notice. */
export function Footer(): JSX.Element {
  return (
    <footer className="bl-footer">
      <div className="bl-inner">
        <p>Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.</p>
        <p className="bl-note">Blockfeed is a design study; builds, builders and servers shown are invented.</p>
        <p className="bl-row">
          <Link to="/system">How this page is built</Link>
          <a href="#top">Back to top</a>
        </p>
      </div>
    </footer>
  )
}
