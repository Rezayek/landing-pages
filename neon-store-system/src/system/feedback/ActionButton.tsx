import { Lightning } from './Lightning'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type JSX,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { announce } from './announcer'
import { CheckIcon, ErrorIcon } from './icons'
import { cx, textOf, useLatest } from './internal'
import { Spinner } from './Spinner'
import { FEEDBACK_TIMING, usePending, useSlow } from './usePending'

/** What the work is doing. The control's look (hover, focus, pressed) is CSS and has no state here. */
export type ActionState = 'idle' | 'pending' | 'success' | 'error'

/** Looks the /system page can pin without running anything. */
export type ActionPreview = ActionState | 'slow' | 'hover' | 'focus' | 'pressed' | 'disabled'

export interface ActionButtonProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'disabled' | 'children' | 'type'> {
  ref?: Ref<HTMLButtonElement>
  /**
   * The work. Return a promise (or nothing). It receives an AbortSignal that fires on unmount and on timeout.
   * A thrown or rejected error puts the button in its error state and keeps everything the person typed.
   */
  onAction: (signal: AbortSignal) => unknown
  /** Resting label. */
  children: ReactNode
  /** Progressive verb while working: "Saving…". Falls back to the resting label. */
  pendingLabel?: ReactNode
  /** Shown with a check for `successHoldMs`: "Saved". */
  successLabel?: ReactNode
  /** Label in the error state. Falls back to the resting label with an error icon: the button is ready to retry. */
  errorLabel?: ReactNode
  /** Label after `slowAfterMs` of waiting. */
  slowLabel?: ReactNode
  /** Leading icon in the resting state. */
  icon?: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /** Unavailable. Stays focusable (`aria-disabled`), ignores clicks, and `disabledReason` is read out. */
  disabled?: boolean
  disabledReason?: string
  /** Called when a disabled button is pressed: show the reason in visible text beside it. It is also announced. */
  onDisabledPress?: () => void
  /**
   * `submit` runs `onAction` instead of the native form submit, and Enter in a field counts as a click, so a
   * repeated press is ignored the same way. Default `button`.
   */
  type?: 'button' | 'submit'
  /** Work known to be slow (upload, AI draft, import, payment): show the indicator at once, without the delay. */
  knownSlow?: boolean
  /** Spoken (polite) on success. Default: the success label. `false` for silence when the page announces it. */
  successMessage?: string | false
  /** Spoken (assertive) on failure. Say what failed and what to do; the same text belongs in the inline message. */
  errorMessage?: (error: unknown) => string
  /** Fires the moment the work succeeds: put the result on screen here, in place. */
  onSuccess?: (result: unknown) => void
  /** Fires after the success label has been shown: close the dialog, reset the form, refetch. */
  onDone?: () => void
  onError?: (error: unknown) => void
  successHoldMs?: number
  slowAfterMs?: number
  timeoutMs?: number
  /** Render one look without running anything. For the /system page and tests. */
  preview?: ActionPreview
  /** VOLTCART: show the error text beside the button (default). Off where the caller shows its own message. */
  inlineError?: boolean
}

type Shown = 'idle' | 'quiet' | 'pending' | 'slow' | 'success' | 'error'

const DEFAULT_ERROR = 'That did not work. Check your connection and try again.'
const SLOW_MESSAGE = 'Still working. This is taking longer than usual.'
const TIMED_OUT = 'This took too long and was stopped. Try again.'

function shownFor(preview: ActionPreview): Shown {
  switch (preview) {
    case 'pending':
    case 'slow':
    case 'success':
    case 'error':
      return preview
    default:
      return 'idle'
  }
}

/**
 * A button that does a piece of work and shows what is happening in itself.
 *
 *  - Pressing it sets the pending state in the same event, before any await, so the control answers in the next
 *    frame. A repeated press while the work runs is ignored (no double submit), and Enter in a form field counts.
 *  - It stays focusable and keeps its size: `aria-disabled`, never the native `disabled`, and every label sits in
 *    one grid cell, so the widest label sets the width.
 *  - The spinner and the progressive label appear after the show delay (400 ms) and stay at least 500 ms (see
 *    FEEDBACK_TIMING). Work that ends sooner shows only the result.
 *  - After 8 s the label becomes "Still working…" and is announced; after 30 s the work is aborted and shown as failed.
 *  - Success shows a check and the success label for 1.5 s, then the button rests. Failure puts the button back to
 *    its resting label at once, live for a retry, and keeps focus where it was. The error icon and ink stay until the
 *    next press, so the cause stays attached to the control. The error is announced; the visible error belongs next
 *    to the button, in an InlineMessage, with the same text.
 *
 * Under reduced motion the state changes stay; the press scale and the travel go.
 */
export function ActionButton({
  onAction,
  children,
  pendingLabel,
  successLabel = 'Done',
  errorLabel,
  slowLabel = 'Still working…',
  icon,
  variant = 'secondary',
  disabled = false,
  disabledReason,
  onDisabledPress,
  type = 'button',
  knownSlow = false,
  successMessage,
  errorMessage,
  onSuccess,
  onDone,
  onError,
  successHoldMs = FEEDBACK_TIMING.successHoldMs,
  slowAfterMs = FEEDBACK_TIMING.slowNoticeMs,
  timeoutMs = FEEDBACK_TIMING.timeoutMs,
  preview,
  inlineError = true,
  className,
  ...rest
}: ActionButtonProps): JSX.Element {
  const [status, setStatus] = useState<ActionState>('idle')
  const busy = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const mounted = useRef(true)
  const errorText = useRef(DEFAULT_ERROR)
  const latest = useLatest({
    onDisabledPress,
    disabledReason,
    onAction,
    onSuccess,
    onDone,
    onError,
    errorMessage,
    successMessage,
    successLabel,
    pendingLabel,
    children,
    preview,
  })
  const reasonId = useId()
  // One lightning strike when a pointer enters the primary action (the person's request), at most one per 600 ms.
  const [hoverStrike, setHoverStrike] = useState(0)
  const lastStrike = useRef(0)
  function strikeOnHover(event: PointerEvent<HTMLButtonElement>): void {
    if (variant !== 'primary' || event.pointerType !== 'mouse' || blocked || preview) return
    const now = performance.now()
    if (now - lastStrike.current < 600) return
    lastStrike.current = now
    setHoverStrike((n) => n + 1)
  }
  const errorId = useId()

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      controller.current?.abort()
    }
  }, [])

  const pending = status === 'pending'
  const indicator = usePending(pending, { delay: knownSlow ? 0 : FEEDBACK_TIMING.showDelayMs })
  const slow = useSlow(pending || indicator, slowAfterMs) // stays on through the minimum-shown hold, so the label does not flip back
  const live: Shown = indicator ? (slow ? 'slow' : 'pending') : pending ? 'quiet' : status
  const shown: Shown = preview ? shownFor(preview) : live
  const isDisabled = disabled || preview === 'disabled'
  const blocked = isDisabled || (!preview && pending)

  async function run(): Promise<void> {
    busy.current = true
    setStatus('pending') // synchronous: the control answers in the next frame, before any network work
    const own = new AbortController()
    controller.current = own
    const timer =
      timeoutMs > 0
        ? setTimeout(() => own.abort(new DOMException(TIMED_OUT, 'TimeoutError')), timeoutMs)
        : undefined
    const aborted = new Promise<never>((_, reject) => {
      own.signal.addEventListener('abort', () => reject(own.signal.reason), { once: true })
    })
    aborted.catch(() => {}) // the race below handles it; this keeps a late abort from being reported as unhandled
    try {
      const result = await Promise.race([Promise.resolve(latest.current.onAction(own.signal)), aborted])
      if (!mounted.current) return
      setStatus('success')
      latest.current.onSuccess?.(result)
    } catch (error) {
      if (!mounted.current) return
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
      if (own.signal.aborted && !timedOut) {
        setStatus('idle') // cancelled from outside, not a failure
        return
      }
      errorText.current = timedOut ? TIMED_OUT : (latest.current.errorMessage?.(error) ?? DEFAULT_ERROR)
      setStatus('error')
      latest.current.onError?.(error)
    } finally {
      clearTimeout(timer)
      busy.current = false
    }
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault() // the work replaces a native submit, so it runs once
    if (preview) return
    if (isDisabled) {
      if (latest.current.disabledReason) announce(latest.current.disabledReason)
      latest.current.onDisabledPress?.()
      return
    }
    if (blocked || busy.current) return
    void run()
  }

  // Say what happened, once, when it becomes visible.
  useEffect(() => {
    const { preview: pinned, successMessage: message, successLabel: label } = latest.current
    if (pinned) return
    if (shown === 'success' && message !== false) {
      announce(message ?? textOf(label, 'Done'))
    } else if (shown === 'error') {
      announce(errorText.current, 'assertive')
    } else if (shown === 'slow') {
      announce(SLOW_MESSAGE)
    }
  }, [shown, latest])

  // A wait still going after a second is announced once.
  useEffect(() => {
    const { preview: pinned, pendingLabel: verb, children: label } = latest.current
    if (pinned || !pending) return
    const text = textOf(verb, textOf(label))
    if (!text) return
    const timer = setTimeout(() => announce(text), FEEDBACK_TIMING.announceStartMs)
    return () => clearTimeout(timer)
  }, [pending, latest])

  // Hold the success look, then rest.
  useEffect(() => {
    if (latest.current.preview || shown !== 'success') return
    const timer = setTimeout(() => {
      setStatus((current) => (current === 'success' ? 'idle' : current))
      latest.current.onDone?.()
    }, successHoldMs)
    return () => clearTimeout(timer)
  }, [shown, successHoldMs, latest])

  const describedBy =
    [rest['aria-describedby'], isDisabled && disabledReason ? reasonId : undefined, inlineError && shown === 'error' ? errorId : undefined].filter(Boolean).join(' ') ||
    undefined
  const look = preview === 'hover' || preview === 'focus' || preview === 'pressed' ? preview : undefined
  const dataState = isDisabled ? 'disabled' : shown === 'quiet' || shown === 'slow' ? 'pending' : shown

  return (
    <>
      <button
        {...rest}
        type={type}
        className={cx('fb fb-btn', className)}
        data-variant={variant}
        data-state={dataState}
        data-indicator={shown === 'pending' || shown === 'slow' ? 'true' : undefined}
        data-preview={look}
        aria-disabled={blocked || undefined}
        aria-busy={pending || undefined}
        aria-describedby={describedBy}
        onClick={handleClick}
        onPointerEnter={(event) => {
          strikeOnHover(event)
          rest.onPointerEnter?.(event)
        }}
      >
        <Lightning
          mode={preview ? 'off' : shown === 'pending' || shown === 'slow' ? 'arc' : shown === 'success' || hoverStrike > 0 ? 'strike' : 'off'}
          strikeKey={shown === 'success' ? -1 : hoverStrike}
        />
        <span className="fb-btn__labels">
          <span className="fb-btn__label" data-on={shown === 'idle' || shown === 'quiet'}>
            {icon}
            {children}
          </span>
          <span className="fb-btn__label" data-on={shown === 'pending'}>
            <Spinner size="sm" />
            {pendingLabel ?? children}
          </span>
          <span className="fb-btn__label" data-on={shown === 'success'}>
            <CheckIcon />
            {successLabel}
          </span>
          <span className="fb-btn__label" data-on={shown === 'error'}>
            <ErrorIcon />
            {errorLabel ?? children}
          </span>
          {slowLabel ? (
            // Always in the cell (hidden until slow), so the button never grows when the slow label arrives.
            <span className="fb-btn__label" data-on={shown === 'slow'}>
              <Spinner size="sm" />
              {slowLabel}
            </span>
          ) : null}
        </span>
      </button>
      {isDisabled && disabledReason ? (
        <span id={reasonId} className="fb-btn-note">
          {disabledReason}
        </span>
      ) : null}
      {inlineError && shown === 'error' && !preview ? (
        <span id={errorId} className="fb-btn-note" data-tone="error">
          <ErrorIcon />
          {errorText.current}
        </span>
      ) : null}
    </>
  )
}
