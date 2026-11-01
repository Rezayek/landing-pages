/**
 * The small parts of the SIGNAL//CON system (COMPONENTS.md): wordmark, buttons, tape and stickers, the CRT screen,
 * the section header, the signal-state cards and the motion switch. Styles in ui.css; every value is a token.
 */
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type JSX,
  type ReactNode,
  type Ref,
  useEffect,
  useState,
} from 'react'
import { IconSignalLost } from './icons'

const cx = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(' ')

/* Wordmark ------------------------------------------------------------------------------------------------------ */
/** "SIGNAL//CON" set live in the display face, the slashes in acid (DESIGN.md §Logo). */
export function Wordmark({ className, monument = false }: { className?: string; monument?: boolean }): JSX.Element {
  return (
    <span className={cx('sc-wordmark', monument && 'is-monument', className)}>
      SIGNAL<span className="sc-wordmark-slash">//</span>CON
    </span>
  )
}

/** The Screen-slash mark as inline SVG (public/brand/mark.svg). */
export function Mark({ size = 32, paper = false }: { size?: number; paper?: boolean }): JSX.Element {
  const line = paper ? 'var(--band-ink)' : 'var(--paper-50)'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden focusable="false">
      <path d="M22 4l10 9 10-9" fill="none" stroke={line} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="14" width="56" height="46" rx="14" fill="var(--night-950)" stroke={line} strokeWidth="4" />
      <path d="M26 25l-8 24M40 25l-8 24" stroke="var(--acid-400)" strokeWidth="6.5" strokeLinecap="round" />
      <circle cx="48" cy="24" r="3" fill="var(--hot-500)" />
    </svg>
  )
}

/* Buttons ------------------------------------------------------------------------------------------------------- */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet'
interface ButtonLook {
  variant?: ButtonVariant
  size?: 'md' | 'lg'
  /** A sticker stuck to the top-right edge ("from €39"). */
  sticker?: ReactNode
  block?: boolean
}

/** An action that is not a request (scroll, switch, clear). A request uses the feedback ActionButton. */
export function Button({
  variant = 'secondary',
  size = 'md',
  sticker,
  block,
  className,
  children,
  ref,
  ...rest
}: ButtonLook & ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> }): JSX.Element {
  return (
    <button
      ref={ref}
      type="button"
      className={cx('sc-btn sg-squash', className)}
      data-variant={variant}
      data-size={size}
      data-block={block || undefined}
      {...rest}
    >
      <span className="sc-btn-label">{children}</span>
      {sticker && (
        <span className="sc-btn-sticker" aria-hidden>
          {sticker}
        </span>
      )}
    </button>
  )
}

/** The same look on a link that scrolls or navigates. */
export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  sticker,
  block,
  className,
  children,
  ref,
  ...rest
}: ButtonLook & AnchorHTMLAttributes<HTMLAnchorElement> & { ref?: Ref<HTMLAnchorElement> }): JSX.Element {
  return (
    <a ref={ref} className={cx('sc-btn sg-squash', className)} data-variant={variant} data-size={size} data-block={block || undefined} {...rest}>
      <span className="sc-btn-label">{children}</span>
      {sticker && (
        <span className="sc-btn-sticker" aria-hidden>
          {sticker}
        </span>
      )}
    </a>
  )
}

/* Tape and stickers --------------------------------------------------------------------------------------------- */
export type TapeTone = 'acid' | 'signal' | 'paper' | 'night'
/** A short non-interactive label stuck on something; tilt between -6 and 6 degrees. Slams in when `slam`. */
export function Tape({
  tone = 'acid',
  tilt = -2,
  slam = false,
  mono = false,
  className,
  style,
  children,
}: {
  tone?: TapeTone
  tilt?: number
  slam?: boolean
  mono?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}): JSX.Element {
  return (
    <span
      className={cx('sc-tape', mono && 'is-mono', className)}
      data-tone={tone}
      data-slam={slam ? '' : undefined}
      style={{ ...style, '--slam-rot': `${tilt}deg`, rotate: slam ? undefined : `${tilt}deg` } as CSSProperties}
    >
      {children}
    </span>
  )
}

/** A die-cut round or starburst sticker. */
export function Sticker({
  tone = 'acid',
  shape = 'round',
  tilt = 8,
  slam = false,
  className,
  children,
}: {
  tone?: TapeTone
  shape?: 'round' | 'burst'
  tilt?: number
  slam?: boolean
  className?: string
  children: ReactNode
}): JSX.Element {
  return (
    <span
      className={cx('sc-sticker', className)}
      data-tone={tone}
      data-shape={shape}
      data-slam={slam ? '' : undefined}
      style={{ '--slam-rot': `${tilt}deg`, rotate: slam ? undefined : `${tilt}deg` } as CSSProperties}
    >
      <span>{children}</span>
    </span>
  )
}

/* Screen -------------------------------------------------------------------------------------------------------- */
/**
 * The CRT frame: rounded, outlined, one clipped corner, scanlines over the content, a channel number in the cut and
 * an optional caption plate. Content is the child (an img, an svg, a state card).
 */
export function Screen({
  as: Tag = 'div',
  channel,
  caption,
  ratio = '4 / 3',
  busy,
  className,
  children,
  ref,
  style,
}: {
  /** "span" when the screen sits inside a button or a link (phrasing content only). */
  as?: 'div' | 'span'
  channel?: ReactNode
  caption?: ReactNode
  ratio?: string
  busy?: boolean
  className?: string
  children: ReactNode
  ref?: Ref<HTMLDivElement>
  style?: CSSProperties
}): JSX.Element {
  return (
    <Tag
      ref={ref as Ref<HTMLDivElement & HTMLSpanElement>}
      className={cx('sc-screen', className)}
      style={{ ...style, aspectRatio: ratio }}
      aria-busy={busy || undefined}
    >
      <Tag className="sc-screen-glass">{children}</Tag>
      <span className="sc-screen-scan" aria-hidden />
      {channel != null && (
        <span className="sc-screen-ch">
          <span className="sg-split">{channel}</span>
        </span>
      )}
      {caption != null && <span className="sc-screen-caption">{caption}</span>}
    </Tag>
  )
}

/* Section header ------------------------------------------------------------------------------------------------ */
/**
 * H2 led by its channel chip on the same line (never a label above the heading), with one outlined phrase, then a
 * plain sub-line. The H2 takes focus after an in-page jump.
 */
export function SectionHeader({
  id,
  channel,
  title,
  outlined,
  sub,
  aside,
}: {
  id: string
  channel: string
  title: string
  outlined?: string
  sub?: ReactNode
  aside?: ReactNode
}): JSX.Element {
  return (
    <div className="sc-section-head">
      <div className="sc-section-head-main">
        <h2 id={id} tabIndex={-1} className="sc-h2" data-slam="">
          <span className="sc-chip-ch" aria-hidden>
            {channel}
          </span>{' '}
          {title}
          {outlined && (
            <>
              {' '}
              <span className="sc-outline">{outlined}</span>
            </>
          )}
        </h2>
        {sub && <p className="sc-section-sub">{sub}</p>}
      </div>
      {aside}
    </div>
  )
}

/* Signal states ------------------------------------------------------------------------------------------------- */
/** The test-card strip that heads the "No signal" and "Signal lost" cards. */
export function TestCard({ label }: { label: string }): JSX.Element {
  return (
    <div className="sc-testcard" aria-hidden>
      <span className="sc-testcard-bars">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sc-testcard-static sg-static" />
      <span className="sc-testcard-label">{label}</span>
    </div>
  )
}

/** Empty state: a still test card, title, body and one action that fixes the cause. */
export function NoSignal({
  title = 'No signal',
  children,
  action,
}: {
  title?: string
  children: ReactNode
  action?: ReactNode
}): JSX.Element {
  return (
    <div className="sc-signal-state" data-kind="empty" data-vfx="" data-vfx-play="flicker">
      <TestCard label="NO SIGNAL" />
      <h3 className="sc-signal-title">{title}</h3>
      <p className="sc-signal-body">{children}</p>
      {action}
    </div>
  )
}

/** Error state for a failed picture or region: the rest of the page keeps working. */
export function SignalLost({ children, action }: { children: ReactNode; action?: ReactNode }): JSX.Element {
  return (
    <div className="sc-signal-state" data-kind="error" role={action ? undefined : 'img'} aria-label={action ? undefined : String(children)}>
      <TestCard label="SIGNAL LOST" />
      <p className="sc-signal-body">
        <IconSignalLost size={18} /> {children}
      </p>
      {action}
    </div>
  )
}

/* Motion switch ------------------------------------------------------------------------------------------------- */
const MOTION_KEY = 'signalcon:motion'

/** Reads the stored motion choice before first paint of the page (call once, early). */
export function restoreMotionChoice(): void {
  try {
    if (localStorage.getItem(MOTION_KEY) === 'reduced') document.documentElement.dataset.motion = 'reduced'
  } catch {
    /* storage blocked: the system setting still applies */
  }
}

/** "Reduce motion" switch: sets <html data-motion="reduced"> and remembers it on this device. */
export function MotionSwitch({ label = 'Reduce motion' }: { label?: string }): JSX.Element {
  const [on, setOn] = useState(false)
  useEffect(() => setOn(document.documentElement.dataset.motion === 'reduced'), [])
  const toggle = (): void => {
    const next = !on
    setOn(next)
    if (next) document.documentElement.dataset.motion = 'reduced'
    else delete document.documentElement.dataset.motion
    try {
      if (next) localStorage.setItem(MOTION_KEY, 'reduced')
      else localStorage.removeItem(MOTION_KEY)
    } catch {
      /* not remembered; works for this visit */
    }
  }
  return (
    <button type="button" role="switch" aria-checked={on} className="sc-switch" onClick={toggle}>
      <span className="sc-switch-track" aria-hidden>
        <span className="sc-switch-thumb" />
      </span>
      {label}
    </button>
  )
}
