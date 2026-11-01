import type { CSSProperties, JSX } from 'react'
import { cx } from './internal'

export interface SkeletonProps {
  /** `text` draws `lines` bars, `heading` one thicker bar, `rect` a block, `circle` a round avatar. */
  variant?: 'text' | 'heading' | 'rect' | 'circle'
  /** Number of text lines. */
  lines?: number
  /** Width of the last text line, so a paragraph does not look like a box. */
  lastLineWidth?: string
  /** CSS size of a `rect` or `circle`: a number is px. */
  width?: string | number
  height?: string | number
  className?: string
}

const size = (value: string | number | undefined): string | undefined =>
  typeof value === 'number' ? `${value}px` : value

/**
 * A placeholder shaped like the content that is coming. Build it from the SAME layout as the loaded content (same
 * grid, gaps, padding and line height) so the swap moves nothing. It is hidden from assistive technology: the
 * region that holds it carries `aria-busy` and speaks once (see Region).
 *
 * Use it only where a region has nothing to show yet. Never on a refresh of content already on screen, and never
 * on buttons, menus, toasts or dialogs. Under reduced motion it is static.
 */
export function Skeleton({
  variant = 'text',
  lines = 3,
  lastLineWidth = '60%',
  width,
  height,
  className,
}: SkeletonProps): JSX.Element {
  if (variant === 'heading') {
    return (
      <span className={cx('fb fb-skeleton-text', className)} data-variant="heading" aria-hidden="true">
        <span className="fb-skeleton" />
      </span>
    )
  }
  if (variant === 'text') {
    return (
      <span className={cx('fb fb-skeleton-text', className)} aria-hidden="true">
        {Array.from({ length: Math.max(1, lines) }, (_, index) => (
          <span
            key={index}
            className="fb-skeleton"
            style={index === lines - 1 && lines > 1 ? ({ width: lastLineWidth } satisfies CSSProperties) : undefined}
          />
        ))}
      </span>
    )
  }
  return (
    <span
      className={cx('fb fb-skeleton', className)}
      data-variant={variant}
      style={{ width: size(width) ?? (variant === 'circle' ? '2.5rem' : '100%'), height: size(height) ?? (variant === 'circle' ? '2.5rem' : '6rem') }}
      aria-hidden="true"
    />
  )
}
