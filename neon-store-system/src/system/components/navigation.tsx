/**
 * Navigation and overlays (COMPONENTS.md, Specs — navigation and feedback): top bar, sidebar, tab bar, tabs,
 * breadcrumbs, pagination and load more, step indicator, back link, footer, command menu, dialog, sheet, popover,
 * menu button, banner and accordion. Overlays use the native <dialog> (focus trap, Esc, inert background).
 */
import { useEffect, useId, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import {
  BellIcon,
  CartIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  GridIcon,
  HeartIcon,
  KeyIcon,
  ListIcon,
  SearchIcon,
  StoreIcon,
  UserIcon,
  ErrorIcon,
  InfoIcon,
  SuccessIcon,
  WarningIcon,
} from '../feedback/icons'
import { Button, Logo, TextLink, Wordmark } from './primitives'
import { SearchInput } from './forms'
import './vc.css'

const icon = (node: ReactNode) => (
  <span className="vc-icon" aria-hidden="true">
    {node}
  </span>
)

/* Top bar --------------------------------------------------------------------------------------------------------- */
export function TopBar({ cartCount, cartTotal, wishCount, signedIn = true, onSearch, flow, navLabel = 'Primary' }: { cartCount: number; cartTotal: string; wishCount: number; signedIn?: boolean; onSearch?: () => void; flow?: ReactNode; navLabel?: string }): JSX.Element {
  const [query, setQuery] = useState('')
  if (flow) {
    return (
      <div className="vc-shell">
      <header className="vc-topbar">
        <Logo />
        <div className="vc-hide-phone">{flow}</div>
        <TextLink variant="standalone" href="#cart" className="vc-topbar__actions">
          <ChevronLeftIcon /> Back to cart
        </TextLink>
      </header>
      </div>
    )
  }
  return (
    <div className="vc-shell">
    <header className="vc-topbar">
      <Logo />
      <nav aria-label={navLabel} className="vc-topbar__nav">
        <TextLink variant="quiet" href="#store" current>
          Store
        </TextLink>
        <TextLink variant="quiet" href="#browse">
          Browse
        </TextLink>
        <TextLink variant="quiet" href="#passes">
          Battle passes
        </TextLink>
      </nav>
      <div className="vc-topbar__search">
        <SearchInput value={query} onChange={setQuery} label={navLabel === 'Primary' ? undefined : `Search games (${navLabel})`} />
      </div>
      <div className="vc-topbar__actions">
        <span className="vc-show-phone">
          <Button variant="quiet" iconOnly label="Search" icon={<SearchIcon />} onClick={onSearch} />
        </span>
        <Button variant="quiet" iconOnly label={`Wishlist, ${wishCount} saved`} icon={<HeartIcon />} />
        <Button variant="quiet" aria-label={`Cart, ${cartCount} items, ${cartTotal}`} icon={<CartIcon />}>
          <span className="vc-badge" aria-hidden="true">
            {cartCount}
          </span>
          <span className="vc-num vc-hide-phone" aria-hidden="true">
            {cartTotal}
          </span>
        </Button>
        {signedIn ? (
          <Button variant="quiet" iconOnly label="Account menu, Dana" icon={<span className="vc-avatar">D</span>} />
        ) : (
          <Button variant="secondary">Sign in</Button>
        )}
      </div>
    </header>
    </div>
  )
}

/* Sidebar (account) ----------------------------------------------------------------------------------------------- */
const SIDE = [
  { id: 'overview', label: 'Overview', icon: <GridIcon /> },
  { id: 'library', label: 'Library', icon: <KeyIcon /> },
  { id: 'orders', label: 'Orders', icon: <ListIcon /> },
  { id: 'wishlist', label: 'Wishlist and alerts', icon: <BellIcon /> },
  { id: 'settings', label: 'Settings', icon: <UserIcon /> },
] as const

export function Sidebar({ current = 'library' }: { current?: (typeof SIDE)[number]['id'] }): JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <nav aria-label="Account" className="vc-sidebar" data-collapsed={collapsed}>
      {SIDE.map((item) => (
        <a key={item.id} href={`#${item.id}`} className="vc-sidebar__item" aria-current={item.id === current ? 'page' : undefined} title={collapsed ? item.label : undefined}>
          {icon(item.icon)}
          <span className="vc-sidebar__label">{item.label}</span>
        </a>
      ))}
      <Button variant="quiet" aria-expanded={!collapsed} icon={<ChevronLeftIcon />} onClick={() => setCollapsed((v) => !v)}>
        <span className="vc-sidebar__label">{collapsed ? 'Expand menu' : 'Collapse menu'}</span>
      </Button>
    </nav>
  )
}

/* Mobile tab bar -------------------------------------------------------------------------------------------------- */
export function TabBar({ current = 'store', cartCount = 0, wishCount = 0, label = 'Primary' }: { current?: string; cartCount?: number; wishCount?: number; label?: string }): JSX.Element {
  const tabs = [
    { id: 'store', label: 'Store', icon: <StoreIcon /> },
    { id: 'browse', label: 'Browse', icon: <SearchIcon /> },
    { id: 'wishlist', label: 'Wishlist', icon: <HeartIcon />, count: wishCount },
    { id: 'cart', label: 'Cart', icon: <CartIcon />, count: cartCount },
    { id: 'account', label: 'Account', icon: <UserIcon /> },
  ]
  return (
    <nav aria-label={label} className="vc-tabbar">
      {tabs.map((tab) => (
        <a key={tab.id} href={`#${tab.id}`} aria-current={tab.id === current ? 'page' : undefined} aria-label={tab.count ? `${tab.label}, ${tab.count} items` : undefined}>
          <span className="vc-tabbar__icon">
            {icon(tab.icon)}
            {tab.count ? (
              <span className="vc-badge" aria-hidden="true">
                {tab.count}
              </span>
            ) : null}
          </span>
          <span aria-hidden={tab.count ? true : undefined}>{tab.label}</span>
        </a>
      ))}
    </nav>
  )
}

/* Tabs (automatic activation) ------------------------------------------------------------------------------------- */
export function Tabs({ label, tabs, children }: { label: string; tabs: readonly { id: string; label: string; count?: number }[]; children: (id: string) => ReactNode }): JSX.Element {
  const [current, setCurrent] = useState(tabs[0]?.id ?? '')
  const base = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  function onKeyDown(event: KeyboardEvent, index: number): void {
    const to = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1
    if (to < 0) return
    event.preventDefault()
    setCurrent(tabs[to].id)
    refs.current[to]?.focus()
  }
  return (
    <div>
      <div role="tablist" aria-label={label} className="vc-tabs__list">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="tab"
            id={`${base}-${tab.id}`}
            aria-selected={tab.id === current}
            aria-controls={`${base}-${tab.id}-panel`}
            tabIndex={tab.id === current ? 0 : -1}
            className="vc-tabs__tab"
            onClick={() => setCurrent(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
            {tab.count !== undefined ? <span className="vc-muted vc-num"> {tab.count}</span> : null}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${base}-${current}-panel`} aria-labelledby={`${base}-${current}`} tabIndex={0} className="vc-tabs__panel">
        {children(current)}
      </div>
    </div>
  )
}

/* Breadcrumbs, back link ------------------------------------------------------------------------------------------ */
export function Breadcrumbs({ trail }: { trail: readonly string[] }): JSX.Element {
  return (
    <nav aria-label="Breadcrumb" className="vc-crumbs">
      <ol>
        {trail.map((crumb, i) =>
          i === trail.length - 1 ? (
            <li key={crumb} aria-current="page">
              {crumb}
            </li>
          ) : (
            <li key={crumb}>
              <a href={`#${crumb.toLowerCase()}`}>{crumb}</a>
            </li>
          ),
        )}
      </ol>
    </nav>
  )
}

export function BackLink({ to }: { to: string }): JSX.Element {
  return (
    <TextLink variant="standalone" href="#back">
      {icon(<ChevronLeftIcon />)}
      Back to {to}
    </TextLink>
  )
}

/* Pagination (numbered: order history) ---------------------------------------------------------------------------- */
export function Pagination({ page, pages, total, perPage, onPage }: { page: number; pages: number; total: number; perPage: number; onPage: (p: number) => void }): JSX.Element {
  const first = (page - 1) * perPage + 1
  const last = Math.min(total, page * perPage)
  const shown = [1, page - 1, page, page + 1, pages].filter((p, i, all) => p >= 1 && p <= pages && all.indexOf(p) === i).sort((a, b) => a - b)
  return (
    <nav aria-label="Pagination" className="vc-stack">
      <p className="vc-muted vc-num">
        Orders {first}–{last} of {total}
      </p>
      <div className="vc-pages">
        <a href="#prev" aria-label="Previous page" aria-disabled={page === 1 || undefined} onClick={(event) => { event.preventDefault(); if (page > 1) onPage(page - 1) }}>
          <ChevronLeftIcon />
        </a>
        {shown.map((p, i) => (
          <span key={p} className="vc-row">
            {i > 0 && p - shown[i - 1] > 1 ? <span aria-hidden="true">…</span> : null}
            {p === page ? (
              <span aria-current="page" className="vc-num">
                {p}
              </span>
            ) : (
              <a href={`#page-${p}`} aria-label={`Page ${p}`} onClick={(event) => { event.preventDefault(); onPage(p) }}>
                {p}
              </a>
            )}
          </span>
        ))}
        <a href="#next" aria-label="Next page" aria-disabled={page === pages || undefined} onClick={(event) => { event.preventDefault(); if (page < pages) onPage(page + 1) }}>
          <ChevronRightIcon />
        </a>
      </div>
    </nav>
  )
}

/* Step indicator (Cart › Pay › Get your code) --------------------------------------------------------------------- */
export function StepIndicator({ current }: { current: 1 | 2 | 3 }): JSX.Element {
  const steps = ['Cart', 'Pay', 'Get your code']
  return (
    <ol className="vc-steps" aria-label={`Step ${current} of 3`}>
      {steps.map((label, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'current' : 'upcoming'
        return (
          <li key={label} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
            {i > 0 ? (
              <span className="vc-steps__bar" aria-hidden="true">
                <span style={{ '--_fill': n <= current ? 1 : 0 } as CSSProperties} />
              </span>
            ) : null}
            <span className="vc-steps__num vc-cut" aria-hidden="true">
              {state === 'done' ? <CheckIcon /> : n}
            </span>
            {state === 'done' ? <a href={`#step-${n}`}>{label}</a> : label}
            {state === 'done' ? <span className="vc-sr">, completed</span> : null}
          </li>
        )
      })}
    </ol>
  )
}

/* Footer ---------------------------------------------------------------------------------------------------------- */
export function Footer({ headingLevel = 2 }: { headingLevel?: 2 | 3 }): JSX.Element {
  const Heading = `h${headingLevel}` as 'h2' | 'h3'
  const cols = [
    { title: 'Help', links: ['Redeeming a code', 'Refunds', 'Contact'] },
    { title: 'Store', links: ['Deals', 'Battle passes', 'Gift codes'] },
    { title: 'Legal', links: ['Terms', 'Privacy', 'Cookies'] },
  ]
  return (
    <footer className="vc-footer">
      <nav aria-label="Footer" className="vc-footer__cols">
        {cols.map((col) => (
          <div key={col.title}>
            <Heading>{col.title}</Heading>
            <ul>
              {col.links.map((link) => (
                <li key={link}>
                  <TextLink variant="quiet" href={`#${link.toLowerCase().replace(/\s/g, '-')}`}>
                    {link}
                  </TextLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <p>VOLTCART is a design study. The store, games, prices and people are invented, and nothing here can be bought.</p>
      <Wordmark />
    </footer>
  )
}

/* Dialog and sheet (native <dialog>: modal, focus trap, Esc) ----------------------------------------------------- */
export function Dialog({ open, onClose, title, children, actions, variant = 'dialog', initialFocus, headingLevel = 2 }: { open: boolean; onClose: () => void; title: string; children: ReactNode; actions?: ReactNode; variant?: 'dialog' | 'sheet'; initialFocus?: string; headingLevel?: 2 | 3 }): JSX.Element {
  const Heading = `h${headingLevel}` as 'h2' | 'h3'
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const opener = useRef<Element | null>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      opener.current = document.activeElement
      dialog.showModal()
      const target = initialFocus ? dialog.querySelector<HTMLElement>(initialFocus) : null
      target?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
      if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus()
    }
  }, [open, initialFocus])
  return (
    <dialog
      ref={ref}
      className="vc-dialog"
      data-variant={variant}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      {variant === 'sheet' ? (
        <>
          <div className="vc-sheet__head">
            <Heading id={titleId}>{title}</Heading>
            <Button variant="quiet" iconOnly label={`Close ${title.toLowerCase()}`} icon={<CloseIcon />} onClick={onClose} />
          </div>
          <div className="vc-sheet__body">{children}</div>
          {actions ? <div className="vc-sheet__foot">{actions}</div> : null}
        </>
      ) : (
        <div className="vc-dialog__body">
          <Heading id={titleId}>{title}</Heading>
          {children}
          {actions ? <div className="vc-dialog__actions">{actions}</div> : null}
        </div>
      )}
    </dialog>
  )
}

/* Popover (non-modal, opens on click) ----------------------------------------------------------------------------- */
export function Popover({ trigger, title, children, defaultOpen = false }: { trigger: string; title: string; children: ReactNode; defaultOpen?: boolean }): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const wrap = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])
  return (
    <span
      ref={wrap}
      className="vc-anchor"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          wrap.current?.querySelector<HTMLButtonElement>('button')?.focus()
        }
      }}
    >
      <button type="button" className="vc-link" data-variant="standalone" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        {trigger}
      </button>
      {open ? (
        <div id={id} role="dialog" aria-label={title} className="vc-popover vc-cut vc-cut--card">
          <strong className="vc-display">{title}</strong>
          {children}
        </div>
      ) : null}
    </span>
  )
}

/* Menu button (single choice: sort) ------------------------------------------------------------------------------- */
export function MenuButton<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { id: T; label: string }[]; onChange: (v: T) => void }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const menuId = useId()
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (open) items.current[active]?.focus()
  }, [open, active])
  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }
  const current = options.find((o) => o.id === value)
  return (
    <span className="vc-anchor">
      <button
        ref={trigger}
        type="button"
        className="vc-btn vc-cut"
        data-variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          setActive(Math.max(0, options.findIndex((o) => o.id === value)))
          setOpen((v) => !v)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive(0)
            setOpen(true)
          }
        }}
      >
        {label}: {current?.label}
        {icon(<ChevronDownIcon />)}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="vc-menu vc-cut vc-cut--card"
          onKeyDown={(event) => {
            if (event.key === 'Escape' || event.key === 'Tab') close()
            if (event.key === 'ArrowDown') setActive((a) => (a + 1) % options.length)
            if (event.key === 'ArrowUp') setActive((a) => (a - 1 + options.length) % options.length)
            if (event.key === 'Home') setActive(0)
            if (event.key === 'End') setActive(options.length - 1)
            if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') event.preventDefault()
          }}
        >
          {options.map((option, index) => (
            <button
              key={option.id}
              ref={(el) => {
                items.current[index] = el
              }}
              type="button"
              role="menuitemradio"
              aria-checked={option.id === value}
              tabIndex={index === active ? 0 : -1}
              className="vc-menu__item"
              onClick={() => {
                onChange(option.id)
                close()
              }}
            >
              {option.label}
              {option.id === value ? <span className="vc-menu__check" aria-hidden="true"><CheckIcon /></span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  )
}

/* Banner (global, page, section) ---------------------------------------------------------------------------------- */
const BANNER_ICON = { warning: WarningIcon, info: InfoIcon, positive: SuccessIcon, negative: ErrorIcon }
export function Banner({ tone, title, children, action, onDismiss }: { tone: keyof typeof BANNER_ICON; title?: string; children: ReactNode; action?: ReactNode; onDismiss?: () => void }): JSX.Element {
  const Icon = BANNER_ICON[tone]
  return (
    <div className="vc-banner" data-tone={tone}>
      {icon(<Icon />)}
      <p className="vc-banner__text">
        {title ? <strong>{title} </strong> : null}
        {children}
      </p>
      {action}
      {onDismiss ? <Button variant="quiet" iconOnly label="Dismiss" icon={<CloseIcon />} onClick={onDismiss} /> : null}
    </div>
  )
}

/* Accordion ------------------------------------------------------------------------------------------------------- */
export function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className="vc-accordion">
      <h3>
        <button type="button" className="vc-accordion__btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          {title}
          {icon(<ChevronDownIcon />)}
        </button>
      </h3>
      {open ? (
        <div id={id} className="vc-accordion__panel">
          {children}
        </div>
      ) : null}
    </div>
  )
}
