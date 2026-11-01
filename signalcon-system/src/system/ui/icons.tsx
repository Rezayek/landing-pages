/**
 * Icons drawn for SIGNAL//CON (FOUNDATIONS.md §7): one 24-unit grid, `--icon-stroke` round strokes, currentColor.
 * Decorative by default (aria-hidden); the text beside an icon carries the meaning.
 */
import type { JSX, ReactNode } from 'react'

export interface IconProps {
  size?: number
  className?: string
}

function Svg({ size = 20, className, children }: IconProps & { children: ReactNode }): JSX.Element {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="var(--icon-stroke)"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const IconCheck = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M4 12.5l5 5L20 6.5" />
  </Svg>
)
export const IconClose = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
)
export const IconPlus = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)
export const IconMinus = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
)
export const IconClock = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)
/** A TV with a crack through it: "signal lost". */
export const IconSignalLost = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="13" rx="4" />
    <path d="M9 2.5l3 3 3-3M13 9l-3 4h4l-3 4" />
  </Svg>
)
export const IconInfo = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 7.6v.2" />
  </Svg>
)
export const IconExternal = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </Svg>
)
export const IconMenu = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <rect x="3.5" y="6" width="17" height="12" rx="3.5" />
    <path d="M9 3l3 3 3-3M8 12h8" />
  </Svg>
)
/* Kinds of event: each has a glyph and its name (never colour alone). */
export const IconConcert = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </Svg>
)
export const IconPanel = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
  </Svg>
)
export const IconCosplay = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M3 7c3 0 5-2 9-2s6 2 9 2c0 7-3 12-9 12S3 14 3 7z" />
    <path d="M7.5 10.5l3 1M16.5 10.5l-3 1" />
  </Svg>
)
export const IconArtist = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M14.5 4.5l5 5L10 19H5v-5z" />
    <path d="M12.5 6.5l5 5" />
  </Svg>
)
export const IconGame = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M7 8h10a4.5 4.5 0 0 1 4.3 5.8l-1 3.4a2.2 2.2 0 0 1-3.8.8L14.5 16h-5l-2 2a2.2 2.2 0 0 1-3.8-.8l-1-3.4A4.5 4.5 0 0 1 7 8z" />
    <path d="M7.5 11v3M6 12.5h3M15.5 12h.01M17.5 13.5h.01" />
  </Svg>
)
export const IconTram = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <rect x="5" y="6" width="14" height="12" rx="3" />
    <path d="M5 13h14M9 3h6M12 3v3M8 21l1.5-3M16 21l-1.5-3" />
  </Svg>
)
export const IconMoon = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </Svg>
)
export const IconBike = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <circle cx="6" cy="16" r="3.5" />
    <circle cx="18" cy="16" r="3.5" />
    <path d="M6 16l4-7h5l3 7M9 6h3M10 9l2 7" />
  </Svg>
)
export const IconAccess = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <circle cx="12" cy="4.5" r="1.8" />
    <path d="M5 8.5l7 1 7-1M12 9.5v5l-3.5 6M12 14.5l3.5 6" />
  </Svg>
)
export const IconDoor = (p: IconProps): JSX.Element => (
  <Svg {...p}>
    <path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21M3 21h18M15 12h.01" />
  </Svg>
)
