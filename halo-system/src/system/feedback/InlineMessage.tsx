import { useEffect, type JSX, type ReactNode } from 'react'
import { announce } from './announcer'
import { CloseIcon, ToneIcon, type Tone } from './icons'
import { cx } from './internal'

export interface InlineMessageProps {
  tone?: Exclude<Tone, 'neutral'>
  /** Short, sentence case, no full stop: what happened ("Could not save"). */
  title?: string
  /** What it affects and what to do next. */
  children: ReactNode
  /** A button or link: "Try again", "Undo", "View the project". */
  action?: ReactNode
  /** Adds a close button. */
  onDismiss?: () => void
  dismissLabel?: string
  /**
   * Text to speak when the message appears: polite, or assertive for `error`. Leave it out when something else
   * already announces the same result (an ActionButton does), or the person hears it twice.
   */
  announceText?: string
  id?: string
  className?: string
}

/**
 * A message next to the thing it is about: the result of an action, a warning on a field group, a note under a form.
 * The icon and the title carry the tone as well as the colour. It has no live-region role of its own (a region
 * created with its text is often not spoken): pass `announceText`, or let the control that caused it announce.
 *
 * Put it where the person is looking, keep their input, and say how to fix it. Do not use it for a notice the
 * person has to act on before anything else: that is a dialog.
 */
export function InlineMessage({
  tone = 'info',
  title,
  children,
  action,
  onDismiss,
  dismissLabel = 'Dismiss',
  announceText,
  id,
  className,
}: InlineMessageProps): JSX.Element {
  useEffect(() => {
    if (announceText) announce(announceText, tone === 'error' ? 'assertive' : 'polite')
  }, [announceText, tone])

  return (
    <div id={id} className={cx('fb fb-msg', className)} data-tone={tone}>
      <span className="fb-msg__icon">
        <ToneIcon tone={tone} />
      </span>
      <div className="fb-msg__body">
        {title ? <strong className="fb-msg__title">{title}</strong> : null}
        <div className="fb-msg__text">{children}</div>
        {action ? <div className="fb-msg__action">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button type="button" className="fb-msg__close" aria-label={dismissLabel} onClick={onDismiss}>
          <CloseIcon />
        </button>
      ) : null}
    </div>
  )
}
