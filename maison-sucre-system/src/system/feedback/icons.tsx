import type { JSX, ReactNode } from 'react'
import { cx } from './internal'

/**
 * The Maison Sucre icon set, drawn as a piped line (FOUNDATIONS.md §7): one stroke width (`--icon-stroke`), round
 * caps and joins, and a filled bead (`data-bead`) where a stroke ends on its own. Every stroke carries
 * `pathLength="1"` so the `pipe` effect (vfx.css) can draw it on along its line. Icons take the text colour and are
 * decorative: the meaning is always in the text or the accessible name beside them.
 */
function Svg({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <svg
      className={cx('fb-icon', className)}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/** A bead: the dot a nozzle leaves where it lifts. */
const Bead = ({ cx: x, cy: y, r = 1.5 }: { cx: number; cy: number; r?: number }): JSX.Element => (
  <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none" data-bead="" />
)

export function CheckIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
      <Bead cx={19} cy={7.5} />
    </Svg>
  )
}

export function CloseIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" pathLength={1} />
    </Svg>
  )
}

export function InfoIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8.5" pathLength={1} />
      <path d="M12 11v5" pathLength={1} />
      <Bead cx={12} cy={7.8} r={1.3} />
    </Svg>
  )
}

export function SuccessIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8.5" pathLength={1} />
      <path d="M8 12.4l2.8 2.8L16 9.8" pathLength={1} />
      <Bead cx={16} cy={9.8} r={1.2} />
    </Svg>
  )
}

export function WarningIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M12 4.2l8.3 14.6H3.7L12 4.2z" pathLength={1} />
      <path d="M12 10v4" pathLength={1} />
      <Bead cx={12} cy={16.4} r={1.2} />
    </Svg>
  )
}

export function ErrorIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8.5" pathLength={1} />
      <path d="M12 7.8v5" pathLength={1} />
      <Bead cx={12} cy={16} r={1.3} />
    </Svg>
  )
}

/** An empty cake board seen from above with its scalloped edge: first use and cleared states. */
export function BoardIcon(): JSX.Element {
  return (
    <Svg>
      <path
        d="M12 3.5q1.6-.9 2.9.4 1.8-.3 2.4 1.4 1.7.6 1.4 2.4 1.3 1.3.4 2.9.9 1.6-.4 2.9.3 1.8-1.4 2.4-.6 1.7-2.4 1.4-1.3 1.3-2.9.4-1.6.9-2.9-.4-1.8.3-2.4-1.4-1.7-.6-1.4-2.4Q3.6 13.6 4.5 12q-.9-1.6.4-2.9-.3-1.8 1.4-2.4.6-1.7 2.4-1.4Q10.4 4 12 3.5z"
        pathLength={1}
      />
      <circle cx="12" cy="12" r="3" pathLength={1} />
    </Svg>
  )
}

export function SearchIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="11" cy="11" r="6.5" pathLength={1} />
      <path d="M16 16l3.5 3.5" pathLength={1} />
      <Bead cx={19.5} cy={19.5} r={1.2} />
    </Svg>
  )
}

export function LockIcon(): JSX.Element {
  return (
    <Svg>
      <rect x="5" y="11" width="14" height="9" rx="2.5" pathLength={1} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" pathLength={1} />
    </Svg>
  )
}

export function PlusIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M12 5.5v13M5.5 12h13" pathLength={1} />
    </Svg>
  )
}

export function MinusIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M5.5 12h13" pathLength={1} />
    </Svg>
  )
}

export function ChevronIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M6.5 9.5l5.5 5.5 5.5-5.5" pathLength={1} />
    </Svg>
  )
}

export function ArrowIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M5 12h13M13 7l5 5-5 5" pathLength={1} />
    </Svg>
  )
}

export function HeartIcon({ filled = false }: { filled?: boolean }): JSX.Element {
  return (
    <Svg>
      <path
        d="M12 19.5s-7-4.3-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.2c0 5-7 9.3-7 9.3z"
        fill={filled ? 'currentColor' : 'none'}
        pathLength={1}
      />
    </Svg>
  )
}

export function CalendarIcon(): JSX.Element {
  return (
    <Svg>
      <rect x="4" y="5.5" width="16" height="14" rx="2.5" pathLength={1} />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" pathLength={1} />
      <Bead cx={12} cy={14.5} r={1.2} />
    </Svg>
  )
}

export function ClockIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8.5" pathLength={1} />
      <path d="M12 7.5V12l3 2" pathLength={1} />
    </Svg>
  )
}

export function PinIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M12 20.5s-6-5.6-6-10.5a6 6 0 0 1 12 0c0 4.9-6 10.5-6 10.5z" pathLength={1} />
      <Bead cx={12} cy={10} r={1.8} />
    </Svg>
  )
}

export function UploadIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M12 15.5V5M7.5 9.5L12 5l4.5 4.5M5 15v3a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18v-3" pathLength={1} />
    </Svg>
  )
}

export function CopyIcon(): JSX.Element {
  return (
    <Svg>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" pathLength={1} />
      <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" pathLength={1} />
    </Svg>
  )
}

export function RotateIcon({ direction = 'left' }: { direction?: 'left' | 'right' }): JSX.Element {
  return (
    <Svg className={direction === 'right' ? 'fb-icon--mirror' : undefined}>
      <path d="M5 9.5A7.5 7.5 0 1 1 6.6 16" pathLength={1} />
      <path d="M5 4.5v5h5" pathLength={1} />
    </Svg>
  )
}

export function MenuIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15" pathLength={1} />
    </Svg>
  )
}

export function SunIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="12" cy="12" r="4" pathLength={1} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <Bead key={a} cx={12 + Math.cos((a * Math.PI) / 180) * 8} cy={12 + Math.sin((a * Math.PI) / 180) * 8} r={1.1} />
      ))}
    </Svg>
  )
}

export function MoonIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" pathLength={1} />
    </Svg>
  )
}

export function DeviceIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8" pathLength={1} />
      <path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" stroke="none" />
    </Svg>
  )
}

/** A three-tier cake on its board: the builder and the servings guide. */
export function CakeIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M9 9.5h6v3H9zM7 12.5h10v3.5H7zM5 16h14v3.5H5zM3.5 20.5h17" pathLength={1} />
      <Bead cx={12} cy={7} r={1.4} />
    </Svg>
  )
}

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'error'

/** The icon for a tone. Neutral has none. */
export function ToneIcon({ tone }: { tone: Tone }): JSX.Element | null {
  switch (tone) {
    case 'info':
      return <InfoIcon />
    case 'success':
      return <SuccessIcon />
    case 'warning':
      return <WarningIcon />
    case 'error':
      return <ErrorIcon />
    default:
      return null
  }
}
