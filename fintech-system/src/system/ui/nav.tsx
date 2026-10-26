/**
 * Kitty's navigation (COMPONENTS.md: App shell, Sidebar, Bottom tab bar, Top bar, Tabs, Breadcrumbs, Pagination,
 * Back link, Footer). Links are real <a href> so middle-click and Back work; the current page is marked by
 * aria-current, weight and a tint, never colour alone.
 */
import { useId, useRef, useState, type JSX, type ReactNode } from 'react'
import {
  ArrowLeftRight,
  Bell,
  ChartColumn,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Ellipsis,
  HandCoins,
  House,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  Send,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, IconButton, Logo, StatusTag } from './core'
import { MenuButton } from './overlays'
import { PEOPLE } from './sample'

export interface NavDestination {
  id: string
  label: string
  icon: LucideIcon
  count?: number
}

export const NAV: readonly NavDestination[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'activity', label: 'Activity', icon: ArrowLeftRight },
  { id: 'analytics', label: 'Analytics', icon: ChartColumn },
  { id: 'send', label: 'Send money', icon: Send },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'allowances', label: 'Allowances', icon: HandCoins },
  { id: 'requests', label: 'Requests', icon: Inbox, count: 2 },
]

const href = (id: string): string => `#${id}`

export function Sidebar({ current = 'home', rail = false, onToggle, label = 'Main' }: { current?: string; rail?: boolean; onToggle?: () => void; /** A distinct name when several navs share a page (the /system demos). */ label?: string }): JSX.Element {
  return (
    <aside className="k-sidebar" data-rail={rail || undefined}>
      <div className="k-sidebar__top">
        <Logo href={href('home')} />
        {onToggle ? <IconButton icon={rail ? PanelLeftOpen : PanelLeftClose} label={rail ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!rail} onClick={onToggle} /> : null}
      </div>
      <div className="k-sidebar__household">
        <MenuButton
          items={[
            { id: 'okafor', label: 'The Okafor home' },
            { id: 'nan', label: 'Nan’s flat' },
            { id: 'settings', label: 'Household settings', icon: Settings, separatorBefore: true },
          ]}
          trigger={(props) => (
            <button type="button" className="k-btn k-household" data-variant="secondary" {...props}>
              The Okafor home
              <ChevronDown className="k-icon" data-size="sm" aria-hidden="true" />
            </button>
          )}
        />
      </div>
      <nav aria-label={label}>
        <ul>
          {NAV.map((item) => (
            <li key={item.id}>
              <NavItem item={item} current={item.id === current} rail={rail} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="k-sidebar__foot">
        <ul style={{ display: 'grid', gap: 2, margin: 0, padding: 0, listStyle: 'none' }}>
          <li>
            <NavItem item={{ id: 'settings', label: 'Settings', icon: Settings }} current={current === 'settings'} rail={rail} />
          </li>
          <li>
            <NavItem item={{ id: 'help', label: 'Help', icon: CircleHelp }} current={current === 'help'} rail={rail} />
          </li>
        </ul>
      </div>
    </aside>
  )
}

function NavItem({ item, current, rail }: { item: NavDestination; current: boolean; rail: boolean }): JSX.Element {
  const name = item.count ? `${item.label}, ${item.count} waiting` : item.label
  const link = (
    <a className="k-nav-item" href={href(item.id)} aria-current={current ? 'page' : undefined} aria-label={rail || item.count ? name : undefined}>
      <item.icon className="k-icon" aria-hidden="true" />
      <span className="k-nav-item__label">{item.label}</span>
      {item.count ? (
        <span className="k-nav-item__count" aria-hidden="true">
          <StatusTag tone="info">{item.count}</StatusTag>
        </span>
      ) : null}
    </a>
  )
  return link
}

const TABS_PARENT: readonly NavDestination[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'activity', label: 'Activity', icon: ArrowLeftRight },
  { id: 'send', label: 'Send', icon: Send },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'more', label: 'More', icon: Ellipsis, count: 2 },
]
const TABS_KID: readonly NavDestination[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'ask', label: 'Ask', icon: HandCoins },
  { id: 'activity', label: 'Activity', icon: ArrowLeftRight },
]

export function BottomTabBar({ current = 'home', kid = false, label = 'Main' }: { current?: string; kid?: boolean; label?: string }): JSX.Element {
  return (
    <nav className="k-tabbar" aria-label={label}>
      {(kid ? TABS_KID : TABS_PARENT).map((item) => (
        <a key={item.id} className="k-tab-link" href={href(item.id)} aria-current={item.id === current ? 'page' : undefined} aria-label={item.count ? `${item.label}, ${item.count} requests waiting` : undefined}>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <item.icon className="k-icon" aria-hidden="true" />
            {item.count ? <span className="k-iconbtn__badge" style={{ insetBlockStart: -2, insetInlineEnd: -4 }} aria-hidden="true" /> : null}
          </span>
          {item.label}
        </a>
      ))}
    </nav>
  )
}

export function TopBar({ title, scrolled = false, onSearch, unread = 0 }: { title?: string; scrolled?: boolean; onSearch?: () => void; unread?: number }): JSX.Element {
  const searchId = useId()
  return (
    <header className="k-topbar" data-scrolled={scrolled || undefined}>
      {title ? <strong>{title}</strong> : null}
      <div className="k-topbar__search">
        <label htmlFor={searchId} className="k-sr">
          Search activity
        </label>
        <button id={searchId} type="button" className="k-input k-select-trigger" style={{ color: 'var(--subtle)' }} onClick={onSearch}>
          <span>Search activity</span>
          <span className="k-kbd" aria-hidden="true">
            Ctrl K
          </span>
        </button>
      </div>
      <div className="k-topbar__end">
        <IconButton icon={Bell} label={unread ? `Notifications, ${unread} new` : 'Notifications'} badge={unread > 0} />
        <MenuButton
          align="end"
          items={[
            { id: 'profile', label: 'Profile' },
            { id: 'preview', label: 'Preview Ivy’s view' },
            { id: 'out', label: 'Sign out', separatorBefore: true },
          ]}
          trigger={(props) => (
            <button type="button" className="k-iconbtn" aria-label="Your account" {...props}>
              <Avatar person={PEOPLE[0]} size={32} decorative />
            </button>
          )}
        />
      </div>
    </header>
  )
}

/** The frame of every parent screen. Collapses to a rail, then to the bottom tab bar under 760 px of its own width. */
export function AppShell({ current = 'home', children, banner, rail: railDefault = false, embedded = false }: { current?: string; children: ReactNode; banner?: ReactNode; rail?: boolean; /** Inside another page (the /system demo): no second <main>. */ embedded?: boolean }): JSX.Element {
  const [rail, setRail] = useState(railDefault)
  return (
    <div className="k-shell" data-rail={rail || undefined}>
      <Sidebar current={current} rail={rail} onToggle={() => setRail((r) => !r)} label={embedded ? 'Main, app shell demo' : 'Main'} />
      <div className="k-shell__main">
        <TopBar unread={2} />
        {banner}
        {embedded ? (
          <div className="k-shell__content">{children}</div>
        ) : (
          <main id="main" className="k-shell__content" tabIndex={-1}>
            {children}
          </main>
        )}
        <div className="k-shell__tabbar">
          <BottomTabBar current={current} label={embedded ? 'Main on phones, app shell demo' : 'Main'} />
        </div>
      </div>
    </div>
  )
}

export interface TabItem {
  id: string
  label: string
}

/** Tabs with automatic activation (APG): ←/→, Home/End; the panel follows. */
export function Tabs({ label, tabs, value, onChange, children }: { label: string; tabs: readonly TabItem[]; value: string; onChange: (id: string) => void; children: ReactNode }): JSX.Element {
  const base = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = tabs.findIndex((t) => t.id === value)
  const go = (i: number): void => {
    const next = (i + tabs.length) % tabs.length
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div className="k-stack" style={{ gap: 'var(--space-4)' }}>
      <div className="k-tabs" role="tablist" aria-label={label}>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${tab.id}`}
            className="k-tab"
            aria-selected={tab.id === value}
            aria-controls={`${base}-panel`}
            tabIndex={tab.id === value ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') go(index + 1)
              else if (event.key === 'ArrowLeft') go(index - 1)
              else if (event.key === 'Home') go(0)
              else if (event.key === 'End') go(tabs.length - 1)
              else return
              event.preventDefault()
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${value}`} tabIndex={0}>
        {children}
      </div>
    </div>
  )
}

export function Breadcrumbs({ trail }: { trail: readonly { label: string; href?: string }[] }): JSX.Element {
  return (
    <nav className="k-crumbs" aria-label="Breadcrumb">
      <ol>
        {trail.map((item, i) => (
          <li key={item.label}>
            {i > 0 ? <ChevronRight className="k-icon" data-size="sm" aria-hidden="true" /> : null}
            {item.href ? (
              <a className="k-link" href={item.href}>
                {item.label}
              </a>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Numbered pages (desktop); the page lives in the URL so Back works. */
export function Pagination({ page, pages, total, perPage, onPage }: { page: number; pages: number; total: number; perPage: number; onPage: (page: number) => void }): JSX.Element {
  const from = (page - 1) * perPage + 1
  const to = Math.min(total, page * perPage)
  const numbers: (number | 'gap')[] = []
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) numbers.push(p)
    else if (numbers[numbers.length - 1] !== 'gap') numbers.push('gap')
  }
  return (
    <nav className="k-pager" aria-label="Pages">
      <span className="k-muted k-num" style={{ fontSize: 'var(--step--1)' }}>
        Showing {from.toLocaleString('en-GB')}-{to.toLocaleString('en-GB')} of {total.toLocaleString('en-GB')}
      </span>
      <ul>
        <li>
          <button type="button" className="k-btn" data-size="sm" aria-disabled={page === 1 || undefined} aria-label={page === 1 ? 'Previous page, none earlier' : 'Previous page'} onClick={() => page > 1 && onPage(page - 1)}>
            <ChevronLeft className="k-icon" data-size="sm" aria-hidden="true" />
            Previous
          </button>
        </li>
        {numbers.map((n, i) =>
          n === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="k-muted" style={{ alignSelf: 'center', paddingInline: 'var(--space-1)' }}>
              …
            </li>
          ) : (
            <li key={n}>
              <button type="button" className="k-page-num" aria-current={n === page ? 'page' : undefined} aria-label={`Page ${n}`} onClick={() => onPage(n)}>
                {n}
              </button>
            </li>
          ),
        )}
        <li>
          <button type="button" className="k-btn" data-size="sm" aria-disabled={page === pages || undefined} aria-label={page === pages ? 'Next page, none later' : 'Next page'} onClick={() => page < pages && onPage(page + 1)}>
            Next
            <ChevronRight className="k-icon" data-size="sm" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  )
}

export function BackLink({ to, label }: { to: string; label: string }): JSX.Element {
  return (
    <a className="k-link" data-standalone href={to}>
      <ChevronLeft className="k-icon" data-size="sm" aria-hidden="true" />
      {label}
    </a>
  )
}

/** The help slot: in the same place on every screen (WCAG 3.2.6). */
export function Footer(): JSX.Element {
  return (
    <footer className="k-footer">
      <a href="#help">Help</a>
      <a href="#privacy">Privacy</a>
      <a href="#terms">Terms</a>
      <span className="k-footer__notice">© 2026 Kitty, a design study</span>
    </footer>
  )
}
