/**
 * HALO's control icons, authored like the feedback icons: a 24 grid, a 1.5 px stroke at 20 px, round caps,
 * `currentColor`, 1em. Always decorative: the control's name carries the meaning.
 */
import type { JSX, ReactNode } from 'react'

function Svg({ children }: { children: ReactNode }): JSX.Element {
  return (
    <svg
      className="h-icon"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const PlusIcon = (): JSX.Element => <Svg><path d="M12 5v14M5 12h14" /></Svg>
export const MinusIcon = (): JSX.Element => <Svg><path d="M5 12h14" /></Svg>
export const MenuIcon = (): JSX.Element => <Svg><path d="M4 8h16M4 16h16" /></Svg>
export const CloseIcon = (): JSX.Element => <Svg><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const PrevIcon = (): JSX.Element => <Svg><path d="M14.5 6l-6 6 6 6" /></Svg>
/** Pause and play: for anything that moves by itself (the hero turntable). */
export const PauseIcon = (): JSX.Element => <Svg><path d="M9 6v12M15 6v12" /></Svg>
export const PlayIcon = (): JSX.Element => <Svg><path d="M8 5.5v13l10.5-6.5z" /></Svg>
export const NextIcon = (): JSX.Element => <Svg><path d="M9.5 6l6 6-6 6" /></Svg>
/** Turn the product to the left: an arc with its head on the left. */
export const TurnLeftIcon = (): JSX.Element => (
  <Svg>
    <path d="M19 13a7 7 0 0 1-13 3.5" />
    <path d="M5 11a7 7 0 0 1 12.2-4.7" />
    <path d="M4 7v4h4" />
  </Svg>
)
export const TurnRightIcon = (): JSX.Element => (
  <Svg>
    <path d="M5 13a7 7 0 0 0 13 3.5" />
    <path d="M19 11a7 7 0 0 0-12.2-4.7" />
    <path d="M20 7v4h-4" />
  </Svg>
)
/** Save a build: a bookmark; filled when saved. */
export const SaveIcon = ({ filled = false }: { filled?: boolean }): JSX.Element => (
  <Svg>
    <path d="M7 4h10v16l-5-4-5 4z" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
)
