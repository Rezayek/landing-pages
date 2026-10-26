/**
 * Kitty's core components (COMPONENTS.md: Skip link, Visually hidden, Logo, Button, Icon button, Link, Button group,
 * Tooltip, Status tag, Amount, Avatar, Person tag, Card). Tokens only; behaviour from guides/interaction.md.
 */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type JSX,
  type ReactNode,
} from 'react'
import { Check, CircleAlert, CircleCheck, Clock, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { timingMs } from '../motion'
import { formatPence, type Person } from './sample'

export type Preview = 'hover' | 'focus' | 'pressed'
export type Tone = 'positive' | 'negative' | 'warning' | 'info' | 'neutral'

/** A Lucide icon at one of the size tokens, decorative unless given a label. */
export function Icon({ icon: Glyph, size = 'md', label }: { icon: LucideIcon; size?: 'sm' | 'md' | 'lg'; label?: string }): JSX.Element {
  return <Glyph className="k-icon" data-size={size} aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined} />
}

export const TONE_ICON: Record<Exclude<Tone, 'neutral'>, LucideIcon> = {
  positive: CircleCheck,
  negative: CircleAlert,
  warning: TriangleAlert,
  info: Info,
}

export function VisuallyHidden({ children }: { children: ReactNode }): JSX.Element {
  return <span className="k-sr">{children}</span>
}

export function SkipLink({ target = 'main', preview }: { target?: string; preview?: 'focus' }): JSX.Element {
  return (
    <a className="k-skip" href={`#${target}`} data-preview={preview}>
      Skip to content
    </a>
  )
}

/** The ledger-ribbon k (public/brand/kitty-mark.svg), drawn inline so it takes currentColor. */
export function LogoMark({ className = 'k-logo__mark' }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <rect x="7" y="3" width="5.5" height="26" rx="1.5" />
      <path d="M12.5 15.5 21 7h6.5l-9 9-6 6Z" />
      <path d="M16.2 18.4 20 15l5 5.5V30l-3-3-3 3v-8.2Z" />
    </svg>
  )
}

export function Logo({ href, markOnly = false, tone }: { href?: string; markOnly?: boolean; tone?: 'band' }): JSX.Element {
  const inner = (
    <>
      <LogoMark />
      {markOnly ? <span className="k-sr">Kitty</span> : <span className="k-logo__word" aria-hidden="true">kitty</span>}
    </>
  )
  return href ? (
    <a className="k-logo" href={href} aria-label="Kitty, home" data-tone={tone}>
      {inner}
    </a>
  ) : (
    <span className="k-logo" role="img" aria-label="Kitty" data-tone={tone}>
      {inner}
    </span>
  )
}

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'danger-quiet'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  block?: boolean
  icon?: LucideIcon
  preview?: Preview
  /** Only what editing cannot change (guides/interaction.md, Disabled): shown beside the button as text. */
  unavailableReason?: string
}

/** A plain Button: local actions. A network action uses ActionButton from ../feedback. */
export function Button({
  variant = 'secondary',
  size = 'md',
  block,
  icon,
  preview,
  unavailableReason,
  children,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps): JSX.Element {
  const reasonId = useId()
  const button = (
    <button
      {...rest}
      type={type}
      className="k-btn"
      data-variant={variant}
      data-size={size === 'sm' ? 'sm' : undefined}
      data-block={block || undefined}
      data-preview={preview}
      aria-disabled={unavailableReason ? true : undefined}
      aria-describedby={unavailableReason ? reasonId : rest['aria-describedby']}
      onClick={(event) => {
        if (unavailableReason) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      {icon ? <Icon icon={icon} /> : null}
      {children}
    </button>
  )
  if (!unavailableReason) return button
  return (
    <span className="k-stack">
      {button}
      <span id={reasonId} className="k-field__hint">
        {unavailableReason}
      </span>
    </span>
  )
}

/** Hover-and-focus tooltip: opens after the delay on hover, at once on focus, closes on Esc. */
export function Tooltip({ text, children, forceOpen = false }: { text: string; children: ReactNode; forceOpen?: boolean }): JSX.Element {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <span
      className="k-tip-anchor"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return
        timer.current = window.setTimeout(() => setOpen(true), timingMs.tooltipDelay)
      }}
      onPointerLeave={() => {
        window.clearTimeout(timer.current)
        setOpen(false)
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span className="k-tip" role="tooltip" aria-hidden="true" data-open={open || forceOpen || undefined}>
        {text}
      </span>
    </span>
  )
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  icon: LucideIcon
  /** The accessible name and the tooltip, the same words. */
  label: string
  variant?: 'quiet' | 'secondary'
  badge?: boolean
  preview?: Preview
  showTip?: boolean
  unavailable?: boolean
}

export function IconButton({ icon, label, variant = 'quiet', badge, preview, showTip, unavailable, onClick, ...rest }: IconButtonProps): JSX.Element {
  return (
    <Tooltip text={label} forceOpen={showTip}>
      <button
        {...rest}
        type="button"
        className="k-iconbtn"
        data-variant={variant}
        data-preview={preview}
        aria-label={label}
        aria-disabled={unavailable || undefined}
        onClick={(event) => {
          if (unavailable) return
          onClick?.(event)
        }}
      >
        <Icon icon={icon} />
        {badge ? <span className="k-iconbtn__badge" aria-hidden="true" /> : null}
      </button>
    </Tooltip>
  )
}

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  standalone?: boolean
  current?: boolean
  external?: boolean
  preview?: Preview
}

export function TextLink({ standalone, current, external, preview, children, ...rest }: TextLinkProps): JSX.Element {
  return (
    <a
      {...rest}
      className="k-link"
      data-standalone={standalone || undefined}
      data-preview={preview}
      aria-current={current ? 'page' : undefined}
      target={external ? '_blank' : rest.target}
      rel={external ? 'noopener noreferrer' : rest.rel}
    >
      {children}
      {external ? <VisuallyHidden> (opens in a new tab)</VisuallyHidden> : null}
    </a>
  )
}

export function ButtonGroup({ label, stacked, children }: { label?: string; stacked?: boolean; children: ReactNode }): JSX.Element {
  return (
    <div className="k-btn-group" role="group" aria-label={label} data-stacked={stacked || undefined}>
      {children}
    </div>
  )
}

const STATUS_ICON: Record<Tone, LucideIcon> = { ...TONE_ICON, neutral: Clock }

export function StatusTag({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }): JSX.Element {
  return (
    <span className="k-tag" data-tone={tone}>
      <Icon icon={STATUS_ICON[tone]} size="sm" />
      {children}
    </span>
  )
}

export interface AmountProps {
  pence: number | null
  /** Show the sign for money in and out (tables, rows). A balance has no sign. */
  signed?: boolean
  size?: 'md' | 'lg' | 'xl' | 'display'
  pending?: boolean
  hidden?: boolean
  /** Swap animation when the value changes in front of the person (never on first paint). */
  live?: boolean
}

/** Every money value shown: Inter, tabular, two decimals, a real minus sign. */
export function Amount({ pence, signed, size = 'md', pending, hidden, live }: AmountProps): JSX.Element {
  const first = useRef(true)
  const [swap, setSwap] = useState(0)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (live) setSwap((n) => n + 1)
  }, [pence, live])
  if (hidden) {
    return (
      <span className="k-amount" data-size={size}>
        <span aria-hidden="true">£••••</span>
        <VisuallyHidden>Balance hidden</VisuallyHidden>
      </span>
    )
  }
  if (pence === null) {
    return (
      <span className="k-amount k-muted" data-size={size}>
        <span aria-hidden="true">—</span>
        <VisuallyHidden>No amount</VisuallyHidden>
      </span>
    )
  }
  const text = formatPence(pence, { sign: signed })
  return (
    <span
      className="k-amount"
      data-size={size}
      data-direction={signed && pence > 0 ? 'in' : undefined}
      data-state={pending ? 'pending' : undefined}
    >
      <span key={swap} className={swap ? 'k-amount__swap' : undefined}>
        {text}
      </span>
    </span>
  )
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function Avatar({ person, size = 32, decorative = false }: { person: Person; size?: 24 | 32 | 40 | 64; decorative?: boolean }): JSX.Element {
  return (
    <span
      className="k-avatar"
      data-colour={person.colour}
      data-size={size}
      data-invited={person.invited || undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : person.invited ? `${person.name}, invited` : person.name}
      aria-hidden={decorative || undefined}
    >
      <span aria-hidden="true">{initials(person.name)}</span>
      {person.photo ? (
        <img
          src={person.photo}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
        />
      ) : null}
    </span>
  )
}

export function AvatarStack({ people, max = 4, size = 24 }: { people: readonly Person[]; max?: number; size?: 24 | 32 | 40 }): JSX.Element {
  const shown = people.slice(0, max)
  const rest = people.slice(max)
  const label = rest.length
    ? `${shown.map((p) => p.name).join(', ')} and ${rest.length} more: ${rest.map((p) => p.name).join(', ')}`
    : shown.map((p) => p.name).join(', ')
  return (
    <span className="k-avatar-stack" role="img" aria-label={label}>
      {shown.map((p) => (
        <Avatar key={p.id} person={p} size={size} decorative />
      ))}
      {rest.length ? (
        <span className="k-avatar" data-size={size} data-more aria-hidden="true">
          +{rest.length}
        </span>
      ) : null}
    </span>
  )
}

export function PersonDot({ person }: { person: Person }): JSX.Element {
  return <span className="k-person-dot" data-colour={person.colour} aria-hidden="true" />
}

export interface PersonTagProps {
  person: Person
  /** A toggle (in a split): pressed means in. */
  pressed?: boolean
  onToggle?: () => void
  onRemove?: () => void
  /** Why it cannot change ("Ada paid, so she's in"). */
  lockedReason?: string
}

export function PersonTag({ person, pressed, onToggle, onRemove, lockedReason }: PersonTagProps): JSX.Element {
  const hintId = useId()
  if (onRemove) {
    return (
      <span className="k-ptag" data-static>
        <Avatar person={person} size={24} decorative />
        {person.name}
        <button type="button" className="k-ptag__remove" aria-label={`Remove ${person.name}`} onClick={onRemove}>
          <X className="k-icon" data-size="sm" aria-hidden="true" />
        </button>
      </span>
    )
  }
  if (!onToggle) {
    return (
      <span className="k-ptag" data-static>
        <Avatar person={person} size={24} decorative />
        {person.name}
        {person.invited ? <StatusTag tone="info">Invited</StatusTag> : null}
      </span>
    )
  }
  return (
    <span className="k-stack">
      <button
        type="button"
        className="k-ptag"
        aria-pressed={pressed}
        aria-disabled={lockedReason ? true : undefined}
        aria-describedby={lockedReason ? hintId : undefined}
        aria-label={`${person.name}, ${pressed ? 'in this bill' : 'not in this bill'}`}
        onClick={() => {
          if (!lockedReason) onToggle()
        }}
      >
        <Avatar person={person} size={24} decorative />
        {person.name}
        {pressed ? <Check className="k-icon k-ptag__check" data-size="sm" aria-hidden="true" /> : null}
      </button>
      {lockedReason ? (
        <span id={hintId} className="k-field__hint">
          {lockedReason}
        </span>
      ) : null}
    </span>
  )
}

export interface CardProps {
  title?: string
  headingLevel?: 2 | 3 | 4
  action?: ReactNode
  /** The whole card is one link: the title is the link text. */
  href?: string
  selected?: boolean
  children?: ReactNode
  className?: string
  labelledBy?: string
}

export function Card({ title, headingLevel = 3, action, href, selected, children, className }: CardProps): JSX.Element {
  const headingId = useId()
  const Heading = `h${headingLevel}` as const
  return (
    <article
      className={className ? `k-card ${className}` : 'k-card'}
      aria-labelledby={title ? headingId : undefined}
      data-link={href ? true : undefined}
      data-selected={selected || undefined}
    >
      {selected ? <span className="k-sr">Selected</span> : null}
      {title || action ? (
        <div className="k-card__head">
          {title ? (
            <Heading id={headingId} className="k-card__title" tabIndex={-1}>
              {href ? (
                <a className="k-card__stretch" href={href}>
                  {title}
                </a>
              ) : (
                title
              )}
            </Heading>
          ) : null}
          {action}
        </div>
      ) : null}
      {children}
    </article>
  )
}

/** The tick: Kitty's one expressive moment (MOTION-SYSTEM.md). Static under reduced motion. */
export { Tick } from './Tick'
