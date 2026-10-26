import { useEffect, useRef, type JSX, type ReactNode } from 'react'
import { ActionButton } from './ActionButton'
import { announce } from './announcer'
import { ErrorIcon } from './icons'
import { cx, textOf } from './internal'

export interface ErrorStateProps {
  /** What failed, in the person's words: "Projects did not load". */
  title: string
  /** What it affects and what to do. Not a code, not blame, not "Something went wrong" alone. */
  children?: ReactNode
  /** Retries the work. Give it whenever a retry can help: it keeps its own pending and error states. */
  onRetry?: (signal: AbortSignal) => unknown
  retryLabel?: string
  retryingLabel?: string
  /** A second way out: contact support, go back. */
  secondary?: ReactNode
  /** Move focus to the heading on mount. Use it when the error replaces what the person just asked for. */
  focusOnMount?: boolean
  /** Speak the title (assertive) when it appears. Default on: an error that needs action is worth interrupting for. */
  announceOnMount?: boolean
  headingLevel?: 2 | 3 | 4
  className?: string
}

/**
 * Data exists or was asked for but cannot be shown. It fills the region the content would have filled, in the same
 * reserved space, says what happened and how to fix it, and offers a retry that keeps the person's input.
 * For a failed form field or a failed button, use an InlineMessage next to the cause instead.
 */
export function ErrorState({
  title,
  children,
  onRetry,
  retryLabel = 'Try again',
  retryingLabel = 'Trying again…',
  secondary,
  focusOnMount = false,
  announceOnMount = true,
  headingLevel = 3,
  className,
}: ErrorStateProps): JSX.Element {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'
  const heading = useRef<HTMLHeadingElement>(null)

  const body = textOf(children)
  useEffect(() => {
    if (focusOnMount) heading.current?.focus()
  }, [focusOnMount])
  useEffect(() => {
    if (announceOnMount) announce(`${title}. ${body}`.trim(), 'assertive')
  }, [title, body, announceOnMount])

  return (
    <div className={cx('fb fb-state', className)} data-kind="error">
      <span className="fb-state__icon">
        <ErrorIcon />
      </span>
      <Heading ref={heading} tabIndex={-1} className="fb-state__title">
        {title}
      </Heading>
      {children ? <p className="fb-state__body">{children}</p> : null}
      {onRetry || secondary ? (
        <div className="fb-state__actions">
          {onRetry ? (
            <ActionButton variant="primary" pendingLabel={retryingLabel} onAction={onRetry}>
              {retryLabel}
            </ActionButton>
          ) : null}
          {secondary}
        </div>
      ) : null}
    </div>
  )
}
