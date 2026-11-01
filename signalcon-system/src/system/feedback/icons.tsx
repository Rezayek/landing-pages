import type { JSX, ReactNode } from 'react'
import { cx } from './internal'

/**
 * The few glyphs the feedback components need, drawn as inline strokes so they take the text colour and carry no
 * dependency. Replace them with the project's icon set in phase 10 (same names, same 1em size). They are always
 * decorative: the meaning is in the text beside them, never in the icon alone.
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function CheckIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  )
}

export function CloseIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  )
}

export function InfoIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </Svg>
  )
}

export function SuccessIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.8 2.8L16 9.6" />
    </Svg>
  )
}

export function WarningIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M12 4l9 16H3L12 4z" />
      <path d="M12 10v4.5M12 17.4v.1" />
    </Svg>
  )
}

export function ErrorIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </Svg>
  )
}

export function InboxIcon(): JSX.Element {
  return (
    <Svg>
      <path d="M4 13l2.2-7h11.6L20 13v5.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V13z" />
      <path d="M4 13h4.5l1 2.5h5l1-2.5H20" />
    </Svg>
  )
}

export function SearchIcon(): JSX.Element {
  return (
    <Svg>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </Svg>
  )
}

export function LockIcon(): JSX.Element {
  return (
    <Svg>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
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
