import { useEffect, useState, type JSX, type ReactNode } from 'react'
import { Segmented } from './Button'
import { MenuButton } from './Menu'
import { Avatar } from './Data'
import { Icon, type IconName } from './icons'
import { useInDemo, useLandmarkLabel } from './scope'

/** The mark: the system's notched plate with an A whose crossbar is a wave (public/brand/mark.svg), inline so it
 * takes the text colour. */
export function Mark({ className = 'ea-logo__mark' }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <mask id="ea-mark-cut">
        <rect width="24" height="24" fill="#fff" />
        <g fill="none" stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 19 12 5.5 17.5 19" />
          <path d="M7.6 14.2c1.4 0 1.8-1.6 3-1.6s1.6 1.6 2.8 1.6 1.7-1.6 3-1.6" />
        </g>
      </mask>
      <path d="M2 2h15l5 5v15H2z" fill="currentColor" mask="url(#ea-mark-cut)" />
    </svg>
  )
}

/** Logo: mark plus the wordmark set live in Saira at 125% width, as one link home ("Echo Atlas, home"). */
export function Logo({ markOnly = false, href = '#' }: { markOnly?: boolean; href?: string }): JSX.Element {
  return (
    <a className="ea-logo" href={href} aria-label="Echo Atlas, home">
      <Mark />
      {markOnly ? null : (
        <span className="ea-logo__word" aria-hidden="true">
          ECHO ATLAS
        </span>
      )}
    </a>
  )
}

export type ThemeChoice = 'system' | 'light' | 'dark'

function readTheme(): ThemeChoice {
  const t = document.documentElement.dataset.theme
  return t === 'light' || t === 'dark' ? t : 'system'
}

/** Sets <html data-theme>, stores it as `ea-theme` (read before first paint in index.html); System removes it. */
export function applyTheme(next: ThemeChoice): void {
  if (next === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = next
  try {
    if (next === 'system') localStorage.removeItem('ea-theme')
    else localStorage.setItem('ea-theme', next)
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
}

/** Theme switch: a segmented control in settings; a menu button in the band. */
export function ThemeSwitch({ compact = false, onChange }: { compact?: boolean; onChange?: (next: ThemeChoice) => void }): JSX.Element {
  const [theme, setTheme] = useState<ThemeChoice>(() => readTheme())
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  const choose = (next: ThemeChoice): void => {
    applyTheme(next)
    setTheme(next)
    onChange?.(next)
  }
  const options = [
    { id: 'system' as const, label: 'System', icon: 'monitor' as const },
    { id: 'light' as const, label: 'Daylight', icon: 'sun' as const },
    { id: 'dark' as const, label: 'Night', icon: 'moon' as const },
  ]
  if (compact) {
    return (
      <MenuButton
        label="Theme"
        trigger={<Icon name={theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor'} size="md" />}
        items={options.map((o) => ({ id: o.id, label: o.id === theme ? `${o.label} (current)` : o.label, icon: o.icon }))}
        onSelect={(id) => choose(id as ThemeChoice)}
      />
    )
  }
  return <Segmented label="Theme" options={options} value={theme} onChange={choose} />
}

export interface NavEntry {
  readonly id: string
  readonly label: string
  readonly icon: IconName
}

export const NAV: readonly NavEntry[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'resonators', label: 'Resonators', icon: 'resonators' },
  { id: 'planner', label: 'Echo planner', icon: 'planner' },
  { id: 'team', label: 'Team builder', icon: 'team' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'tiers', label: 'Tier list', icon: 'tier' },
  { id: 'guides', label: 'Guides', icon: 'guide' },
]

/**
 * App shell: the fixed-look band (logo, global search, theme, account), the tab column (expanded or rail), the
 * content plane and the footer. The plane re-mounts with ea-route on navigation (fade with a short rise; a drill-in
 * sweeps from the right, back from the left). Desktop shows the column; phones use PhoneTabBar instead.
 */
export function AppShell({
  current,
  onNavigate,
  rail = false,
  onToggleRail,
  onSearch,
  signedIn = true,
  banner,
  children,
  direction,
}: {
  current: string
  onNavigate: (id: string) => void
  rail?: boolean
  onToggleRail?: () => void
  onSearch: () => void
  signedIn?: boolean
  banner?: ReactNode
  children: ReactNode
  direction?: 'forward' | 'back'
}): JSX.Element {
  const inDemo = useInDemo()
  const mainLabel = useLandmarkLabel('Main')
  const Plane = inDemo ? 'div' : 'main'
  return (
    <div className="ea-shell-host">
    <div className="ea-shell ea-ui" data-rail={rail || undefined}>
      <header className="ea-band">
        <Logo markOnly={rail} />
        <button type="button" className="ea-btn ea-frame ea-edge ea-band__search" data-variant="secondary" onClick={onSearch}>
          <span style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center', minInlineSize: 0 }}>
            <Icon name="search" />
            <span className="ea-band__search-text">Search Resonators, Echoes, guides</span>
          </span>
          <kbd className="ea-kbd ea-band__kbd" aria-hidden="true">
            Ctrl K
          </kbd>
        </button>
        <span className="ea-band__end">
          <ThemeSwitch compact />
          {signedIn ? (
            <MenuButton
              label="Account menu"
              trigger={<Avatar initials="RV" size="sm" />}
              items={[
                { id: 'builds', label: 'Saved builds', icon: 'planner' },
                { id: 'settings', label: 'Settings', icon: 'account' },
                { id: 'signout', label: 'Sign out', icon: 'external', separatorBefore: true },
              ]}
              onSelect={() => {}}
            />
          ) : (
            <button type="button" className="ea-btn ea-frame ea-edge" data-variant="secondary">
              Sign in
            </button>
          )}
        </span>
      </header>
      <nav className="ea-side" aria-label={mainLabel}>
        <ul>
          {NAV.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="ea-nav-item ea-activeline"
                data-axis="inline"
                aria-current={item.id === current ? 'page' : undefined}
                title={rail ? item.label : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate(item.id)
                }}
              >
                <Icon name={item.icon} size="md" />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
        {onToggleRail ? (
          <button type="button" className="ea-nav-item" style={{ border: 0, background: 'none', cursor: 'pointer', font: 'inherit' }} aria-expanded={!rail} onClick={onToggleRail}>
            <Icon name={rail ? 'chevronRight' : 'chevronLeft'} size="md" />
            <span>{rail ? 'Expand menu' : 'Collapse menu'}</span>
          </button>
        ) : null}
      </nav>
      <Plane className="ea-plane" tabIndex={-1}>
        {banner}
        <div key={current} className="ea-route" data-direction={direction} style={{ display: 'grid', gap: 'var(--gap-group)' }}>
          {children}
        </div>
      </Plane>
      <div className="ea-shell__tabbar">
        <PhoneTabBar current={current} onNavigate={onNavigate} onMore={onSearch} />
      </div>
      <Footer />
    </div>
    </div>
  )
}

/** Phone tab bar: five destinations on the band; "More" opens the sheet with the rest. */
export function PhoneTabBar({ current, onNavigate, onMore }: { current: string; onNavigate: (id: string) => void; onMore: () => void }): JSX.Element {
  const items: readonly NavEntry[] = [NAV[0], NAV[1], { ...NAV[2], label: 'Planner' }, NAV[4]]
  const label = useLandmarkLabel('Main, phone')
  return (
    <nav className="ea-tabbar" aria-label={label}>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="ea-activeline"
          aria-current={item.id === current ? 'page' : undefined}
          onClick={(event) => {
            event.preventDefault()
            onNavigate(item.id)
          }}
        >
          <Icon name={item.icon} size="md" />
          {item.label}
        </a>
      ))}
      <button type="button" onClick={onMore}>
        <Icon name="menu" size="md" />
        More
      </button>
    </nav>
  )
}

/** Breadcrumbs (desktop) and the back link that replaces them on phones. */
export function Breadcrumbs({ trail }: { trail: readonly { label: string; href?: string }[] }): JSX.Element {
  const label = useLandmarkLabel('Breadcrumb')
  return (
    <nav className="ea-crumbs" aria-label={label}>
      <ol>
        {trail.map((step, i) => (
          <li key={step.label}>
            {step.href && i < trail.length - 1 ? <a href={step.href}>{step.label}</a> : <span aria-current="page">{step.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function BackLink({ to, href = '#' }: { to: string; href?: string }): JSX.Element {
  return (
    <a className="ea-link" data-standalone="" href={href}>
      <Icon name="chevronLeft" />
      Back to {to}
    </a>
  )
}

/** Pagination for server pages (news, saved builds): numbered links, the current one marked, "Page n of m". */
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (n: number) => void }): JSX.Element {
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const label = useLandmarkLabel('Pages')
  return (
    <nav className="ea-pager" aria-label={label}>
      <button type="button" className="ea-btn ea-frame ea-edge" data-variant="quiet" aria-disabled={page === 1 || undefined} onClick={() => page > 1 && onPage(page - 1)}>
        <Icon name="chevronLeft" /> Previous
      </button>
      {nums.map((n, i) => (
        <span key={n} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i > 0 && n - nums[i - 1] > 1 ? <span aria-hidden="true">…</span> : null}
          <a
            href={`?page=${n}`}
            className="ea-pager__num ea-activeline"
            aria-current={n === page ? 'page' : undefined}
            aria-label={`Page ${n}`}
            onClick={(event) => {
              event.preventDefault()
              onPage(n)
            }}
          >
            {n}
          </a>
        </span>
      ))}
      <button type="button" className="ea-btn ea-frame ea-edge" data-variant="quiet" aria-disabled={page === pages || undefined} onClick={() => page < pages && onPage(page + 1)}>
        Next <Icon name="chevronRight" />
      </button>
      <span style={{ color: 'var(--muted)', fontSize: 'var(--step--1)' }}>
        Page {page} of {pages}
      </span>
    </nav>
  )
}

/** Footer: the unofficial notice, help in the same place on every surface, and the takedown contact. */
export function Footer(): JSX.Element {
  const label = useLandmarkLabel('Footer')
  return (
    <footer className="ea-footer" aria-label={label}>
      <Logo />
      <p className="ea-footer__notice">
        Echo Atlas is an unofficial fan project. It isn't affiliated with or endorsed by Kuro Games. Wuthering Waves and its
        names are trademarks of Kuro Games.
      </p>
      <nav aria-label={`${label} links`}>
        <ul>
          <li>
            <a href="#guides">Guides</a>
          </li>
          <li>
            <a href="#help">Help</a>
          </li>
          {/* The rights-holder contact returns once there is an address; until then nothing points at a missing one. */}
        </ul>
      </nav>
    </footer>
  )
}
