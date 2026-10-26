import type { JSX, ReactNode } from 'react'
import { cx } from './internal'

/**
 * The few glyphs the feedback components need, drawn as inline strokes so they take the text colour and carry no
 * dependency. VOLTCART set: 1.75 px stroke, square caps and mitred joins (FOUNDATIONS.md §7). They are always
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
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
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

/* VOLTCART additions: the store's glyphs on the same 24 px grid and stroke. Decorative; the label carries the meaning. */
function Glyph({ d }: { d: string }): JSX.Element {
  return (
    <Svg>
      <path d={d} />
    </Svg>
  )
}

export function CartIcon(): JSX.Element {
  return <Glyph d="M3 4h2.5l2 11h10.5l2-8H7M9 20h.01M17 20h.01" />
}
export function HeartIcon(): JSX.Element {
  return <Glyph d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
}
export function BellIcon(): JSX.Element {
  return <Glyph d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />
}
export function CopyIcon(): JSX.Element {
  return <Glyph d="M8 8h12v12H8zM4 16V4h12" />
}
export function KeyIcon(): JSX.Element {
  return <Glyph d="M14 10a4 4 0 1 0-1.2 2.8L20 20M17 17l2-2M15 15l2-2" />
}
export function ChevronDownIcon(): JSX.Element {
  return <Glyph d="M6 9l6 6 6-6" />
}
export function ChevronLeftIcon(): JSX.Element {
  return <Glyph d="M15 6l-6 6 6 6" />
}
export function ChevronRightIcon(): JSX.Element {
  return <Glyph d="M9 6l6 6-6 6" />
}
export function PlusIcon(): JSX.Element {
  return <Glyph d="M12 5v14M5 12h14" />
}
export function MinusIcon(): JSX.Element {
  return <Glyph d="M5 12h14" />
}
export function TrashIcon(): JSX.Element {
  return <Glyph d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
}
export function GlobeIcon(): JSX.Element {
  return <Glyph d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
}
export function FilterIcon(): JSX.Element {
  return <Glyph d="M4 6h16M7 12h10M10 18h4" />
}
export function UserIcon(): JSX.Element {
  return <Glyph d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
}
export function MenuIcon(): JSX.Element {
  return <Glyph d="M4 7h16M4 12h16M4 17h16" />
}
export function EyeIcon(): JSX.Element {
  return <Glyph d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
}
export function EyeOffIcon(): JSX.Element {
  return <Glyph d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
}
export function CalendarIcon(): JSX.Element {
  return <Glyph d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />
}
export function StoreIcon(): JSX.Element {
  return <Glyph d="M4 9l2-5h12l2 5v11H4zM4 9h16M10 20v-5h4v5" />
}
export function GridIcon(): JSX.Element {
  return <Glyph d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
}
export function ListIcon(): JSX.Element {
  return <Glyph d="M4 6h16M4 12h16M4 18h16" />
}
export function GamepadIcon(): JSX.Element {
  return <Glyph d="M6 8h12l3 9-3 2-3-3H9l-3 3-3-2zM8 11v3M6.5 12.5h3M15 12h.01M17 14h.01" />
}
export function SunIcon(): JSX.Element {
  return <Glyph d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
}
export function MoonIcon(): JSX.Element {
  return <Glyph d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
}
export function MonitorIcon(): JSX.Element {
  return <Glyph d="M3 4h18v12H3zM8 20h8M12 16v4" />
}
export function BoltIcon(): JSX.Element {
  return <Glyph d="M13 2L5 14h6l-1 8 8-12h-6z" />
}
export function ArrowDownIcon(): JSX.Element {
  return <Glyph d="M12 5v14M6 13l6 6 6-6" />
}
export function ArrowUpIcon(): JSX.Element {
  return <Glyph d="M12 19V5M6 11l6-6 6 6" />
}
