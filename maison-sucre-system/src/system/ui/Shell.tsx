import { useEffect, useRef, useState, type JSX } from 'react'
import { CloseIcon, DeviceIcon, MenuIcon, MoonIcon, SunIcon } from '../feedback/icons'
import { announce } from '../feedback'
import { BeadBorder } from './BeadBorder'
import { Button, IconButton, TextLink } from './Button'
import { Logo } from './Logo'

export const NAV = [
  { href: '#cakes', label: 'Cakes' },
  { href: '#flavours', label: 'Flavours' },
  { href: '#design', label: 'Design yours' },
  { href: '#tastings', label: 'Tastings' },
  { href: '#questions', label: 'Questions' },
] as const

type ThemeChoice = 'system' | 'light' | 'dark'
const THEME_KEY = 'ms-theme'

function readTheme(): ThemeChoice {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

/**
 * Match my device, light or dark (COMPONENTS.md §Theme toggle): a menu button. Stored in localStorage (`ms-theme`)
 * and applied before first paint by the script in index.html. The re-theme is instant.
 */
export function ThemeToggle(): JSX.Element {
  const [choice, setChoice] = useState<ThemeChoice>(readTheme)
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const options: { id: ThemeChoice; label: string; icon: JSX.Element }[] = [
    { id: 'system', label: 'Match my device', icon: <DeviceIcon /> },
    { id: 'light', label: 'Light', icon: <SunIcon /> },
    { id: 'dark', label: 'Dark', icon: <MoonIcon /> },
  ]
  useEffect(() => {
    if (open) items.current[options.findIndex((o) => o.id === choice)]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const apply = (next: ThemeChoice): void => {
    setChoice(next)
    try {
      if (next === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, next)
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
    if (next === 'system') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = next
    announce(next === 'system' ? 'Theme matches your device' : `${next === 'dark' ? 'Dark' : 'Light'} theme`)
    setOpen(false)
    wrap.current?.querySelector<HTMLButtonElement>('.ms-iconbtn')?.focus()
  }
  const current = options.find((o) => o.id === choice) ?? options[0]
  return (
    <div className="ms-theme" ref={wrap}>
      <IconButton
        label={`Theme: ${current.label}`}
        icon={current.icon}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      />
      {open ? (
        <div
          className="ms-theme__menu"
          role="menu"
          aria-label="Theme"
          onKeyDown={(e) => {
            const i = items.current.findIndex((el) => el === document.activeElement)
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              items.current[(i + 1) % options.length]?.focus()
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              items.current[(i - 1 + options.length) % options.length]?.focus()
            } else if (e.key === 'Escape') {
              setOpen(false)
              wrap.current?.querySelector<HTMLButtonElement>('.ms-iconbtn')?.focus()
            }
          }}
        >
          {options.map((o, i) => (
            <button
              key={o.id}
              ref={(el) => {
                items.current[i] = el
              }}
              type="button"
              role="menuitemradio"
              aria-checked={o.id === choice}
              className="ms-theme__item"
              tabIndex={-1}
              onClick={() => apply(o.id)}
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * The header (COMPONENTS.md §Header): the logo, five section links, the theme toggle and the primary action; on a
 * phone the links move into a sheet behind "Menu". Esc closes the sheet and focus returns to Menu. The bead border
 * closes it.
 */
export interface HeaderProps {
  current?: string
  onBook?: () => void
  /** The page's own section links (default: NAV). */
  nav?: readonly { href: string; label: string }[]
  /** Outlined where the page's first screen already holds the filled primary (one filled action per screen). */
  bookVariant?: 'primary' | 'secondary'
}

export function Header({ current, onBook, nav = NAV, bookVariant = 'primary' }: HeaderProps): JSX.Element {
  const [menu, setMenu] = useState(false)
  const menuButton = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (menu) sheet.current?.querySelector('a')?.focus()
  }, [menu])
  const closeMenu = (): void => {
    setMenu(false)
    menuButton.current?.querySelector('button')?.focus()
  }
  return (
    <header className="ms-header">
      <div className="ms-header__bar">
        <Logo />
        <nav className="ms-header__nav" aria-label="Maison Sucre sections">
          {nav.map((n) => (
            <TextLink key={n.href} href={n.href} current={current === n.href}>
              {n.label}
            </TextLink>
          ))}
        </nav>
        <div className="ms-header__end">
          <ThemeToggle />
          <Button variant={bookVariant} onClick={onBook}>
            Book a tasting
          </Button>
          <div className="ms-header__menu" ref={menuButton}>
            <IconButton label={menu ? 'Close menu' : 'Menu'} icon={menu ? <CloseIcon /> : <MenuIcon />} aria-expanded={menu} onClick={() => (menu ? closeMenu() : setMenu(true))} />
          </div>
        </div>
      </div>
      <BeadBorder className="ms-header__beads" />
      {menu ? (
        <div
          className="ms-menu"
          ref={sheet}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeMenu()
          }}
        >
          <nav aria-label="Maison Sucre sections, menu">
            <ul>
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} onClick={closeMenu}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

/** The ganache band (COMPONENTS.md §Footer): the same in both themes; contact in the same place on every page. */
/** `headingLevel` 4 where the footer is shown under another heading (the /system component demo). */
export function Footer({ headingLevel = 2, nav = NAV }: { headingLevel?: 2 | 4; nav?: readonly { href: string; label: string }[] } = {}): JSX.Element {
  const Heading = headingLevel === 4 ? 'h4' : 'h2'
  return (
    <footer className="ms-footer">
      <div className="ms-footer__grid">
        <div>
          <Logo />
        </div>
        <div>
          <Heading>Visit the kitchen</Heading>
          <ul>
            <li>By appointment (sample)</li>
            <li>
              <a href="mailto:hello@maisonsucre.example">hello@maisonsucre.example</a>
            </li>
          </ul>
        </div>
        <div>
          <Heading>The site</Heading>
          <ul>
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="ms-footer__note">
        Prices are samples and pictures are rendered studies while Maison Sucre is a working name. Fonts: Fraunces and
        Figtree (SIL OFL).
      </p>
    </footer>
  )
}
