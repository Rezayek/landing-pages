/**
 * Core components (COMPONENTS.md, Specs — core): button, link, skip link, visually hidden text, tooltip, tags,
 * status tag, logo, segmented control, theme switch, wishlist toggle and copy button. Tokens only (vc.css).
 * The action button with its pending, success and error lifecycle is the restyled `ActionButton` in ../feedback.
 */
import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { announce } from '../feedback'
import { CheckIcon, CloseIcon, CopyIcon, ErrorIcon, GlobeIcon, HeartIcon, InfoIcon, SuccessIcon, WarningIcon } from '../feedback/icons'
import './vc.css'

export type Preview = 'hover' | 'focus' | 'pressed'
const cx = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(' ')

/* Button --------------------------------------------------------------------------------------------------------- */
export interface ButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'disabled'> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
  size?: 'regular' | 'large'
  icon?: ReactNode
  /** Icon-only: `label` is the accessible name and the tooltip. */
  iconOnly?: boolean
  label?: string
  /** A truly impossible action stays focusable and says why. */
  disabledReason?: string
  preview?: Preview
}

export function Button({ variant = 'secondary', size, icon, iconOnly, label, disabledReason, preview, className, children, onClick, ...rest }: ButtonProps): JSX.Element {
  const reasonId = useId()
  const button = (
    <button
      type="button"
      {...rest}
      className={cx('vc-btn vc-cut', className)}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly || undefined}
      data-preview={preview}
      aria-label={iconOnly ? label : rest['aria-label']}
      aria-disabled={disabledReason ? true : undefined}
      aria-describedby={disabledReason ? reasonId : rest['aria-describedby']}
      onClick={disabledReason ? undefined : onClick}
    >
      {icon ? <span className="vc-icon" aria-hidden="true">{icon}</span> : null}
      {iconOnly ? null : children}
    </button>
  )
  return (
    <>
      {iconOnly && label ? <Tooltip text={label}>{button}</Tooltip> : button}
      {disabledReason ? (
        <span id={reasonId} className="vc-field__hint">
          {disabledReason}
        </span>
      ) : null}
    </>
  )
}

/* Link ----------------------------------------------------------------------------------------------------------- */
export interface TextLinkProps extends ComponentPropsWithoutRef<'a'> {
  variant?: 'inline' | 'standalone' | 'quiet'
  current?: boolean
  preview?: Preview
}

export function TextLink({ variant = 'inline', current, preview, className, ...rest }: TextLinkProps): JSX.Element {
  return (
    <a
      {...rest}
      className={cx('vc-link', className)}
      data-variant={variant}
      data-preview={preview}
      aria-current={current ? 'page' : undefined}
    />
  )
}

export function SkipLink({ preview }: { preview?: Preview }): JSX.Element {
  return (
    <a className="vc-skip" href="#main" data-preview={preview}>
      Skip to content
    </a>
  )
}

export function VisuallyHidden({ children }: { children: ReactNode }): JSX.Element {
  return <span className="vc-sr">{children}</span>
}

/* Tooltip: on hover after 500 ms, at once on keyboard focus; Esc closes. Never holds interactive content. ---------- */
export function Tooltip({ text, children, open: forced }: { text: string; children: ReactNode; open?: boolean }): JSX.Element {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const id = useId()
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const show = (delay: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(false), 100)
  }
  return (
    <span
      className="vc-tip-anchor"
      onPointerEnter={() => show(500)}
      onPointerLeave={hide}
      onFocus={() => show(0)}
      onBlur={hide}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
      aria-describedby={id}
    >
      {children}
      <span role="tooltip" id={id} className="vc-tip" data-open={forced ?? open}>
        {text}
      </span>
    </span>
  )
}

/* Tags ------------------------------------------------------------------------------------------------------------ */
export type Platform = 'PC' | 'PS5' | 'XBOX' | 'SWITCH'

export function PlatformTag({ platform }: { platform: Platform }): JSX.Element {
  return (
    <span className="vc-tag vc-cut" data-kind="platform">
      {platform}
    </span>
  )
}

export function DiscountTag({ percent }: { percent: number }): JSX.Element {
  return (
    <span className="vc-tag vc-cut" data-kind="discount">
      <span aria-hidden="true">−{percent}%</span>
      <VisuallyHidden>{percent}% off</VisuallyHidden>
    </span>
  )
}

export function RegionTag({ region }: { region: string }): JSX.Element {
  return (
    <span className="vc-tag vc-cut" data-kind="region">
      <span className="vc-icon" aria-hidden="true">
        <GlobeIcon />
      </span>
      {region}
    </span>
  )
}

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }): JSX.Element {
  return (
    <span className="vc-tag vc-cut" data-kind="chip">
      {label}
      <button type="button" className="vc-tag__remove" aria-label={`Remove filter: ${label}`} onClick={onRemove}>
        <CloseIcon />
      </button>
    </span>
  )
}

export type StatusTone = 'positive' | 'info' | 'warning' | 'negative' | 'neutral'
const STATUS_ICON: Record<StatusTone, () => JSX.Element> = {
  positive: SuccessIcon,
  info: InfoIcon,
  warning: WarningIcon,
  negative: ErrorIcon,
  neutral: InfoIcon,
}

export function StatusTag({ tone, children }: { tone: StatusTone; children: ReactNode }): JSX.Element {
  const Icon = STATUS_ICON[tone]
  return (
    <span className="vc-status vc-cut" data-tone={tone}>
      <span className="vc-icon" aria-hidden="true">
        <Icon />
      </span>
      {children}
    </span>
  )
}

/* Logo: the Cut V mark and the hand-drawn wordmark (public/brand), one colour from the text unless `plate`. ------- */
export function LogoMark({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={cx('vc-logo__mark', className)} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path className="vc-logo__mark-plate" d="M0 0H24L32 8V32H8L0 24Z" />
      <path className="vc-logo__mark-v" d="M7 7H11.8L16 18.6L20.2 7H22.6L25 9.4L18.6 25H13.4Z" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={cx('vc-logo__word', className)} viewBox="0 0 136 20" aria-hidden="true" focusable="false" fill="currentColor" fillRule="evenodd">
      <path d="M0 0H4.2L7 13.6L9.8 0H11.8L14 2.2L9.4 20H4.6Z" />
      <path transform="translate(17.5 0)" d="M0 0H10L14 4V20H4L0 16Z M4 4V16H10V4Z" />
      <path transform="translate(35 0)" d="M0 0H4V16H13V20H0Z" />
      <path transform="translate(51.5 0)" d="M0 0H14V4H9V20H5V4H0Z" />
      <path transform="translate(69 0)" d="M0 0H14V4H4V16H14V20H4L0 16Z" />
      <path transform="translate(86.5 0)" d="M0 0H10L14 4V20H10V13H4V20H0Z M4 4V9H10V4Z" />
      <path transform="translate(104 0)" d="M0 0H10L14 4V13H10.6L14 20H9.6L6.4 13H4V20H0Z M4 4V9H10V4Z" />
      <path transform="translate(121.5 0)" d="M0 0H14V4H9V20H5V4H0Z" />
    </svg>
  )
}

export function Logo({ href = '#', markOnly = false }: { href?: string; markOnly?: boolean }): JSX.Element {
  return (
    <a className="vc-logo" href={href} aria-label="VOLTCART, store home">
      <LogoMark />
      {markOnly ? null : <Wordmark />}
    </a>
  )
}

/* Segmented control (radio group pattern: arrows move and select) --------------------------------------------- */
export interface SegmentOption<T extends string> {
  id: T
  label: string
  icon?: ReactNode
  iconOnly?: boolean
}

export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: readonly SegmentOption<T>[]; value: T; onChange: (value: T) => void }): JSX.Element {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  function onKeyDown(event: KeyboardEvent, index: number): void {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    const to = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : step ? (index + step + options.length) % options.length : -1
    if (to < 0) return
    event.preventDefault()
    onChange(options[to].id)
    refs.current[to]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={label} className="vc-seg vc-cut">
      {options.map((option, index) => (
        <button
          key={option.id}
          ref={(el) => {
            refs.current[index] = el
          }}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          aria-label={option.iconOnly ? option.label : undefined}
          tabIndex={option.id === value ? 0 : -1}
          className="vc-seg__opt"
          onClick={() => onChange(option.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {option.icon ? <span className="vc-icon" aria-hidden="true">{option.icon}</span> : null}
          {option.iconOnly ? null : option.label}
        </button>
      ))}
    </div>
  )
}

/* Wishlist toggle: optimistic, rolls back with a reason (INTERACTION.md allow-list) ------------------------------ */
export interface WishlistToggleProps {
  game: string
  saved: boolean
  /** Persists the new value; rejects to roll back. */
  onSave: (next: boolean) => Promise<unknown>
  withLabel?: boolean
  onFailed?: (retry: () => void) => void
}

export function WishlistToggle({ game, saved: initial, onSave, withLabel, onFailed }: WishlistToggleProps): JSX.Element {
  const [saved, setSaved] = useState(initial)
  const [failed, setFailed] = useState<boolean | null>(null)
  const latest = useRef(0)
  const noteId = useId()
  useEffect(() => setSaved(initial), [initial])
  async function toggle(next = !saved): Promise<void> {
    const ticket = ++latest.current
    const previous = saved
    setSaved(next)
    setFailed(null)
    announce(next ? `Added ${game} to your wishlist` : `Removed ${game} from your wishlist`)
    try {
      await onSave(next)
    } catch {
      if (ticket !== latest.current) return
      setSaved(previous)
      // Rolled back, and said where the heart is (INTERACTION.md: failures sit beside their cause, never in a toast).
      setFailed(next)
      announce(`Not saved: your wishlist didn't change. Try again.`, 'assertive')
      onFailed?.(() => void toggle(next))
    }
  }
  const name = saved ? `Remove ${game} from wishlist` : `Save ${game} to wishlist`
  return (
    <span className="vc-wish-wrap">
    <Button
      aria-describedby={failed !== null ? noteId : undefined}
      variant={withLabel ? 'secondary' : 'quiet'}
      iconOnly={!withLabel}
      label={name}
      aria-pressed={saved}
      className="vc-wish"
      icon={
        <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" className="vc-wish__icon" data-on={saved}>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
      }
      onClick={() => void toggle()}
    >
      {saved ? 'On wishlist' : 'Wishlist'}
    </Button>
      {failed !== null ? (
        <span id={noteId} className="vc-wish-note">
          <span className="vc-icon" aria-hidden="true">
            <ErrorIcon />
          </span>
          Not saved: your wishlist didn't change.
          <button type="button" className="vc-link" onClick={() => void toggle(failed)}>
            Try again
          </button>
        </span>
      ) : null}
    </span>
  )
}

export { HeartIcon }

/* Copy button: success in place, never a toast; on failure the code is selected for a manual copy ---------------- */
export function CopyButton({ text, what, targetId, large }: { text: string; what: string; targetId?: string; large?: boolean }): JSX.Element {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
      announce('Copied')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setState('idle'), 1500)
    } catch {
      setState('failed')
      announce("Couldn't copy. The code is selected: press Ctrl+C.")
      const target = targetId ? document.getElementById(targetId) : null
      if (target) window.getSelection()?.selectAllChildren(target)
    }
  }
  return (
    <span className="vc-stack">
      <Button variant="secondary" size={large ? 'large' : undefined} aria-label={`Copy code for ${what}`} icon={state === 'copied' ? <CheckIcon /> : <CopyIcon />} onClick={() => void copy()}>
        {state === 'copied' ? 'Copied' : 'Copy code'}
      </Button>
      {state === 'failed' ? (
        <span className="vc-field__line" data-tone="warning">
          Couldn't copy. The code is selected: press Ctrl+C.
        </span>
      ) : null}
    </span>
  )
}
