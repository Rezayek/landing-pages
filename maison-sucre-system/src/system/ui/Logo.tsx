import type { JSX } from 'react'
import { cx } from '../feedback/internal'

/** The lace-edged board (public/brand/mark.svg), inline so it takes the text colour and the theme's pearl. */
const BOARD =
  'M16.00 4.00 Q19.99 1.12 22.00 5.61 Q26.89 5.11 26.39 10.00 Q30.88 12.01 28.00 16.00 Q30.88 19.99 26.39 22.00 Q26.89 26.89 22.00 26.39 Q19.99 30.88 16.00 28.00 Q12.01 30.88 10.00 26.39 Q5.11 26.89 5.61 22.00 Q1.12 19.99 4.00 16.00 Q1.12 12.01 5.61 10.00 Q5.11 5.11 10.00 5.61 Q12.01 1.12 16.00 4.00 Z'

export function Mark({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={cx('ms-logo__mark', className)} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d={BOARD} fill="currentColor" />
      <circle className="ms-logo__hole" cx="16" cy="16" r="5.4" />
      <circle className="ms-logo__pearl" cx="16" cy="16" r="3.2" />
    </svg>
  )
}

export interface LogoProps {
  href?: string
  /** Mark only (favicon size, tight spots); the name stays as the accessible name. */
  markOnly?: boolean
  className?: string
}

/**
 * The lockup (COMPONENTS.md §Logo): the mark and the wordmark set in Fraunces, the i's dot a gold sugar pearl. A link
 * home named "Maison Sucre, home". The outlined wordmark SVG is an open gap (SYSTEM.md, Decisions).
 */
export function Logo({ href = '#top', markOnly, className }: LogoProps): JSX.Element {
  return (
    <a href={href} className={cx('ms-logo', className)} aria-label="Maison Sucre, home">
      <Mark />
      {markOnly ? null : (
        <span className="ms-logo__word" aria-hidden="true">
          Ma<span className="ms-logo__i">ı</span>son Sucre
        </span>
      )}
    </a>
  )
}
