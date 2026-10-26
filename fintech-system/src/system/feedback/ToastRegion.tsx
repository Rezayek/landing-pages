import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { announce } from './announcer'
import { CloseIcon, ToneIcon } from './icons'
import { cssVars, cx } from './internal'
import { removeToast, toast, useToasts, type ToastAction, type ToastItem, type ToastTone } from './toast'

/** Horizontal travel on touch that dismisses a toast. */
const SWIPE_DISMISS_PX = 50

export interface ToastCardProps {
  tone?: ToastTone
  message: string
  action?: ToastAction
  closing?: boolean
  /** Called by the close button, and after the action runs. */
  onDismiss?: () => void
  /** Called when the exit animation has finished (only while `closing`). */
  onExited?: () => void
  dismissLabel?: string
  id?: string
  className?: string
}

/**
 * One toast, drawn. The region uses it, and so does the /system page to show every tone at rest. It is NOT a live
 * region: its text is spoken by `announce()` (see ToastRegion), so the buttons stay real, focusable controls.
 */
export function ToastCard({
  tone = 'neutral',
  message,
  action,
  closing = false,
  onDismiss,
  onExited,
  dismissLabel = 'Dismiss notification',
  id,
  className,
}: ToastCardProps): JSX.Element {
  const [swipe, setSwipe] = useState<number | null>(null)
  const start = useRef<{ x: number; id: number } | null>(null)

  // A horizontal swipe on touch dismisses (50 px, as Radix does); anything less springs back.
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!onDismiss || event.pointerType !== 'touch' || (event.target as HTMLElement).closest('button')) return
    start.current = { x: event.clientX, id: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
    setSwipe(0)
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (start.current?.id === event.pointerId) setSwipe(event.clientX - start.current.x)
  }
  function onPointerEnd(event: ReactPointerEvent<HTMLDivElement>): void {
    if (start.current?.id !== event.pointerId) return
    const moved = event.clientX - start.current.x
    start.current = null
    setSwipe(null)
    if (Math.abs(moved) >= SWIPE_DISMISS_PX) onDismiss?.()
  }

  return (
    <div
      className={cx('fb fb-toast', className)}
      data-tone={tone}
      data-state={closing ? 'closing' : 'open'}
      data-swiping={swipe === null ? undefined : ''}
      data-toast-id={id}
      style={
        swipe === null
          ? undefined
          : cssVars({ '--fb-swipe': `${swipe}px`, '--fb-swipe-fade': Math.min(1, Math.abs(swipe) / 160) })
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onExited?.()
      }}
    >
      <span className="fb-toast__icon">
        <ToneIcon tone={tone} />
      </span>
      <p className="fb-toast__text">{message}</p>
      <span className="fb-toast__buttons">
        {action ? (
          <button
            type="button"
            className="fb-toast__button"
            onClick={() => {
              action.onClick()
              onDismiss?.()
            }}
          >
            {action.label}
          </button>
        ) : null}
        <button
          type="button"
          className="fb-toast__button fb-toast__close"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <CloseIcon />
        </button>
      </span>
    </div>
  )
}

export interface ToastRegionProps {
  /** How many show at once; the rest wait their turn. */
  max?: number
  /** Accessible name of the group. */
  label?: string
}

/**
 * Draws the toasts raised with `toast()`. Mount it ONCE, next to <LiveRegion />.
 *
 *  - The text of each toast is spoken through `announce()` when it becomes visible: polite, or assertive for
 *    errors. The toast itself is ordinary content, so its Undo button is reachable (press F8 to jump to it).
 *  - The newest is on top. Timers pause while the pointer is over the stack, focus is inside it, the window has lost
 *    focus or the tab is hidden. Escape or the close button dismisses and moves focus to a neighbour.
 *  - It sits at the bottom, centred on a phone and at the right on wider screens, and overlays the page without
 *    pushing it (no layout shift). Set `--fb-toast-bottom` to lift it above a bottom bar.
 *  - A horizontal swipe on touch dismisses. Enter takes the travel out under reduced motion and keeps the fade.
 *  - The element stays in the page when empty (with no name, so it is not a landmark): the /system page uses it to
 *    see that a region is already mounted.
 */
export function ToastRegion({ max = 3, label = 'Notifications' }: ToastRegionProps): JSX.Element {
  const all = useToasts()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [away, setAway] = useState(() => typeof document !== 'undefined' && document.hidden)
  const rootRef = useRef<HTMLElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const spoken = useRef(new Set<string>())

  const visible = all.slice(0, max)
  const ordered = [...visible].reverse() // newest on top

  useEffect(() => {
    const update = (): void => setAway(document.hidden || !document.hasFocus())
    const hide = (): void => setAway(document.hidden)
    window.addEventListener('blur', update)
    window.addEventListener('focus', hide)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.removeEventListener('blur', update)
      window.removeEventListener('focus', hide)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  // F8 jumps to the toasts; closing the last one returns focus to where it was.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key !== 'F8') return
      const first = rootRef.current?.querySelector<HTMLElement>('button')
      if (!first) return
      event.preventDefault()
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      first.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Speak each toast once, when it first becomes visible.
  useEffect(() => {
    const keys = new Set<string>()
    for (const item of visible) {
      const key = `${item.id}#${item.revision}`
      keys.add(key)
      if (item.closing || spoken.current.has(key)) continue
      spoken.current.add(key)
      announce(item.message, item.tone === 'error' ? 'assertive' : 'polite')
    }
    for (const key of spoken.current) if (!keys.has(key)) spoken.current.delete(key)
  })

  function close(id: string): void {
    const root = rootRef.current
    const card = root?.querySelector<HTMLElement>(`[data-toast-id="${CSS.escape(id)}"]`)
    if (card && card.contains(document.activeElement)) {
      const neighbour = (card.nextElementSibling ?? card.previousElementSibling) as HTMLElement | null
      const target = neighbour?.querySelector<HTMLElement>('button') ?? returnTo.current
      target?.focus()
    }
    toast.dismiss(id)
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key !== 'Escape') return
    const id = (event.target as HTMLElement).closest<HTMLElement>('[data-toast-id]')?.dataset.toastId
    if (!id) return
    event.preventDefault()
    close(id)
  }

  const paused = hovered || focused || away
  return (
    <section
      ref={rootRef}
      className="fb fb-toasts"
      data-toasts=""
      aria-label={visible.length ? label : undefined}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      {ordered.map((item) => (
        <ToastView key={item.id} item={item} paused={paused} onClose={() => close(item.id)} />
      ))}
    </section>
  )
}

function ToastView({ item, paused, onClose }: { item: ToastItem; paused: boolean; onClose: () => void }): JSX.Element {
  // Time left, so a pause (hover, focus, blur) resumes where it stopped and a refreshed toast starts over.
  const remaining = useRef(item.durationMs ?? 0)
  useEffect(() => {
    remaining.current = item.durationMs ?? 0
  }, [item.revision, item.durationMs])
  useEffect(() => {
    if (item.durationMs === null || item.closing || paused) return
    const startedAt = performance.now()
    const timer = setTimeout(() => toast.dismiss(item.id), Math.max(0, remaining.current))
    return () => {
      clearTimeout(timer)
      remaining.current -= performance.now() - startedAt
    }
  }, [item.id, item.durationMs, item.closing, item.revision, paused])

  return (
    <ToastCard
      id={item.id}
      tone={item.tone}
      message={item.message}
      action={item.action}
      closing={item.closing}
      onDismiss={onClose}
      onExited={() => removeToast(item.id)}
    />
  )
}
