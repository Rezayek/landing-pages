/**
 * HALO's page chrome, built to COMPONENTS.md: SkipLink, Wordmark, Header (with the phone menu as a disclosure, not a
 * modal) and Footer (with the study line, help and the theme switch).
 */
import { useEffect, useId, useRef, useState, type JSX } from 'react'
import { NAV_LINKS, STUDY_NOTE, type HeaderLink } from './data'
import { Button, TextLink, ThemeSwitch } from './controls'
import { CloseIcon, MenuIcon } from './icons'

export function SkipLink({ target = '#main' }: { target?: string }): JSX.Element {
  return (
    <a className="h-skip" href={target}>
      Skip to content
    </a>
  )
}

/** The wordmark as inline SVG (the same geometry as public/brand/halo-wordmark.svg), in the text colour. */
export function Wordmark({ width = 72, title = 'HALO' }: { width?: number; title?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 352 100" width={width} height={(width * 100) / 352} fill="currentColor" role="img" aria-label={title}>
      <path d="M0 0h16v42h40V0h16v100H56V58H16v42H0z" />
      <path fillRule="evenodd" d="M86 100L117 0h18l31 100H149l-7.5-26h-31L103 100zM115.3 58h21.4L126 22z" />
      <path d="M180 0h16v84h42v16H180z" />
      <path
        fillRule="evenodd"
        d="M302 0a50 50 0 1 1 0 100a50 50 0 1 1 0-100zM286 18h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16h-32a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16z"
      />
    </svg>
  )
}

export interface HeaderProps {
  links?: readonly HeaderLink[]
  current?: string
  stage?: 'black' | 'paper'
  onPreorder?: () => void
  /** Open the phone menu at once (the /system page). */
  menuOpen?: boolean
  /** Force the phone layout (the /system page draws it in a narrow frame). */
  phone?: boolean
  /** The action's weight: secondary while the page's own primary button is on screen, so one screen never holds two. */
  actionVariant?: 'primary' | 'secondary'
}

export function Header({ links = NAV_LINKS, current, stage = 'black', onPreorder, menuOpen = false, phone, actionVariant = 'primary' }: HeaderProps): JSX.Element {
  const [open, setOpen] = useState(menuOpen)
  const toggle = useRef<HTMLButtonElement>(null)
  const panel = useId()

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="h-header" data-stage={stage} data-phone={phone || undefined}>
      <a className="h-header__home" href="#top" aria-label="HALO, home">
        <Wordmark width={64} title="HALO" />
      </a>
      <nav className="h-header__nav" aria-label="HALO">
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <TextLink variant="nav" href={l.href} current={l.href === current}>
                {l.label}
              </TextLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="h-header__end">
        <Button variant={actionVariant} className="h-header__cta" onClick={onPreorder}>
          Pre-order
        </Button>
        <button
          ref={toggle}
          type="button"
          className="h-iconbtn h-header__menu"
          data-variant="quiet"
          aria-expanded={open}
          aria-controls={panel}
          aria-label={open ? 'Close menu' : 'Menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      <div id={panel} className="h-header__panel" hidden={!open}>
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <TextLink variant="nav" href={l.href} current={l.href === current} onClick={() => setOpen(false)}>
                {l.label}
              </TextLink>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}

export interface FooterProps {
  /** A landing page's own links (its sections), shown in place of the Help and Legal columns. */
  links?: readonly HeaderLink[]
  /** A closing line in quiet display type that ends the page (a landing page's own words, its headline). */
  signoff?: string
}

export function Footer({ links, signoff }: FooterProps = {}): JSX.Element {
  return (
    <footer className="h-footer" data-stage="black" data-composed={signoff ? true : undefined}>
      {signoff ? (
        <p className="h-footer__sign" aria-hidden="true">
          {signoff}
        </p>
      ) : null}
      <div className="h-footer__top">
        <Wordmark width={88} />
        <p className="h-footer__study">{STUDY_NOTE} Nothing here is for sale and no form sends anything.</p>
      </div>
      {links ? (
        <div className="h-footer__cols">
          <nav aria-label="On this page">
            <ul>
              {links.map((l) => (
                <li key={l.href}>
                  <TextLink variant="nav" href={l.href}>
                    {l.label}
                  </TextLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : (
      <div className="h-footer__cols">
        <nav aria-label="Help">
          <p className="h-footer__head">Help</p>
          <ul>
            <li><TextLink variant="nav" href="#size-guide">Size guide</TextLink></li>
            <li><TextLink variant="nav" href="#contact">Contact us</TextLink></li>
            <li><TextLink variant="nav" href="#returns">Returns</TextLink></li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="h-footer__head">Legal</p>
          <ul>
            <li><TextLink variant="nav" href="#privacy">Privacy</TextLink></li>
            <li><TextLink variant="nav" href="#terms">Terms of sale</TextLink></li>
          </ul>
        </nav>
        <div className="h-footer__theme">
          <ThemeSwitch />
        </div>
      </div>
      )}
    </footer>
  )
}

