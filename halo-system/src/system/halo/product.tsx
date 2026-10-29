/**
 * HALO's product components, built to COMPONENTS.md: ProductViewer, PriceSummary, OrderBar, OrderSheet.
 * The product is the only thing that moves slowly (MOTION-SYSTEM.md): it settles on the weight curve when the build
 * changes, and turns between views on the person's input. The page around it stays still.
 */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { InlineMessage, ProgressBar, Skeleton, announce, usePending } from '../feedback'
import { playHalo } from '../vfx'
import { describe, euro, priceOf, STUDY_NOTE, type Build } from './data'
import { CloseIcon, TurnLeftIcon, TurnRightIcon } from './icons'
import { Button, IconButton } from './controls'
import { Watch, type WatchView } from './Watch'

// ------------------------------------------------------------------------------------------------------------
// ProductViewer
// ------------------------------------------------------------------------------------------------------------
export type FramesState = 'poster' | 'loading' | 'ready' | 'error'

const VIEWS: readonly { id: WatchView; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'dial', label: 'Side, the dial' },
]

export interface ProductViewerProps {
  build: Build
  face?: number
  stage?: 'black' | 'paper'
  /** Loads the 360° frames; reports progress 0-1. Rejects to show the error. Without it the viewer stays a poster. */
  loadFrames?: (signal: AbortSignal, progress: (share: number) => void) => Promise<void>
  /** Load at once instead of on intent (pointer near, focus). */
  eager?: boolean
  controls?: boolean
  width?: number
  /** Pin a state for the /system page. */
  preview?: FramesState | 'stale'
  /** The hero: the watch rises into its shadow once, on mount. */
  rise?: boolean
}

export function ProductViewer({
  build,
  face = 0,
  stage = 'black',
  loadFrames,
  eager = false,
  controls = true,
  width = 220,
  preview,
  rise = false,
}: ProductViewerProps): JSX.Element {
  const [frames, setFrames] = useState<FramesState>('poster')
  const [share, setShare] = useState(0)
  const [view, setView] = useState(0)
  const [stale, setStale] = useState(false)
  const [drawn, setDrawn] = useState<Build>(build)
  const product = useRef<HTMLDivElement>(null)
  const controller = useRef<AbortController | null>(null)
  const started = useRef(false)
  const lastBuild = useRef<string | null>(null)
  const labelId = useId()
  const shown: FramesState = preview && preview !== 'stale' ? preview : frames
  const showBar = usePending(shown === 'loading')

  function load(): void {
    if (!loadFrames || started.current) return
    started.current = true
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    setFrames('loading')
    setShare(0)
    loadFrames(own.signal, setShare)
      .then(() => {
        if (own.signal.aborted) return
        setFrames('ready')
      })
      .catch(() => {
        if (own.signal.aborted) return
        started.current = false
        setFrames('error')
        announce('The 360° view did not load. The still stays.')
      })
  }

  useEffect(() => {
    if (eager) load()
    return () => controller.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eager])

  // A build change: the old frame stays (stale) for a beat, then the product settles in the new build.
  useEffect(() => {
    const key = `${build.size}-${build.finish}-${build.band}`
    if (lastBuild.current === null || lastBuild.current === key) {
      if (lastBuild.current === null && rise) void playHalo(product.current, 'rise')
      lastBuild.current = key
      return
    }
    lastBuild.current = key
    setStale(true)
    const timer = window.setTimeout(() => {
      setStale(false)
      setDrawn(build)
      void playHalo(product.current, 'settle')
      announce(describe(build))
    }, 320)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.size, build.finish, build.band])

  function turn(by: number): void {
    if (shown !== 'ready') {
      load()
      return
    }
    const next = (view + by + VIEWS.length) % VIEWS.length
    setView(next)
    void playHalo(product.current, 'settle')
    announce(VIEWS[next].label)
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') turn(-1)
    else if (event.key === 'ArrowRight') turn(1)
    else return
    event.preventDefault()
  }

  const drag = useRef<number | null>(null)
  const isStale = stale || preview === 'stale'

  return (
    <div
      className="h-viewer"
      data-stage={stage}
      role="group"
      aria-labelledby={labelId}
      aria-busy={shown === 'loading' || undefined}
      onPointerEnter={eager ? undefined : load}
      onFocus={eager ? undefined : load}
    >
      <span id={labelId} className="h-sr">
        HALO, {describe(build)}, {VIEWS[view].label.toLowerCase()} view
      </span>
      <div
        className="h-viewer__stage"
        data-stale={isStale || undefined}
        tabIndex={controls ? 0 : -1}
        role={controls ? 'slider' : undefined}
        aria-label={controls ? 'Turn the watch' : undefined}
        aria-valuemin={controls ? 1 : undefined}
        aria-valuemax={controls ? VIEWS.length : undefined}
        aria-valuenow={controls ? view + 1 : undefined}
        aria-valuetext={controls ? VIEWS[view].label : undefined}
        onKeyDown={controls ? onKeyDown : undefined}
        onPointerDown={(e) => {
          if (!controls) return
          drag.current = e.clientX
        }}
        onPointerUp={(e) => {
          if (drag.current === null) return
          const dx = e.clientX - drag.current
          drag.current = null
          if (Math.abs(dx) > 40) turn(dx > 0 ? -1 : 1)
        }}
      >
        <div className="h-viewer__product" ref={product}>
          <Watch build={drawn} face={face} view={VIEWS[view].id} width={width} />
        </div>
        <span className="halo-shadow" aria-hidden="true" data-vfx-play={rise ? 'rise' : undefined} />
        {isStale ? <span className="h-viewer__bar" aria-hidden="true" /> : null}
        {showBar && shown === 'loading' ? (
          <div className="h-viewer__progress">
            <ProgressBar value={preview ? 0.4 : share} label="Loading the 360° view" />
          </div>
        ) : null}
      </div>
      {controls ? (
        <div className="h-viewer__controls">
          <IconButton label="Turn left" icon={<TurnLeftIcon />} variant="secondary" onClick={() => turn(-1)} />
          <span className="h-viewer__view" aria-hidden="true">
            {shown === 'ready' ? VIEWS[view].label : shown === 'loading' ? 'Loading the 360° view' : '360° view'}
          </span>
          <IconButton label="Turn right" icon={<TurnRightIcon />} variant="secondary" onClick={() => turn(1)} />
        </div>
      ) : null}
      {shown === 'error' ? (
        <div className="h-viewer__msg">
          <InlineMessage
            tone="info"
            title="The 360° view did not load"
            action={
              <Button variant="secondary" onClick={() => load()}>
                Try again
              </Button>
            }
          >
            The frames did not arrive. The still stays, and you can still choose and pre-order.
          </InlineMessage>
        </div>
      ) : null}
    </div>
  )
}

// ------------------------------------------------------------------------------------------------------------
// PriceSummary
// ------------------------------------------------------------------------------------------------------------
export type PriceState = 'skeleton' | 'ready' | 'stale' | 'error'

export interface PriceSummaryProps {
  build: Build
  state: PriceState
  delivery?: string
  updated?: string
  compact?: boolean
  onRetry?: () => void
}

export function PriceSummary({ build, state, delivery, updated, compact, onRetry }: PriceSummaryProps): JSX.Element {
  const price = priceOf(build)
  if (state === 'skeleton') {
    return (
      <div className="h-price" data-compact={compact || undefined} aria-busy="true">
        <span className="h-sr">Loading the price</span>
        <Skeleton variant="rect" width="5ch" height="1.9rem" />
        <Skeleton variant="rect" width="70%" height="0.9em" />
        {compact ? null : <Skeleton variant="rect" width="55%" height="0.9em" />}
      </div>
    )
  }
  return (
    <div className="h-price" data-compact={compact || undefined} data-stale={state === 'stale' || undefined} aria-busy={state === 'stale' || undefined}>
      {state === 'stale' ? <span className="h-price__bar" aria-hidden="true" /> : null}
      <p className="h-price__value">
        <span className="h-sr">Price </span>
        {euro(price)}
      </p>
      <p className="h-price__build">{describe(build)}</p>
      {compact ? null : (
        <>
          {state === 'error' ? (
            <InlineMessage
              tone="info"
              title="Delivery estimate unavailable"
              action={
                onRetry ? (
                  <Button variant="secondary" onClick={onRetry}>
                    Try again
                  </Button>
                ) : undefined
              }
            >
              The stock service did not answer. The price is right; the date comes back with the estimate.
            </InlineMessage>
          ) : (
            <p className="h-price__delivery">
              {delivery}
              {updated ? <span className="h-price__updated"> · {updated}</span> : null}
            </p>
          )}
          <p className="h-price__study">{STUDY_NOTE}</p>
        </>
      )}
    </div>
  )
}

// ------------------------------------------------------------------------------------------------------------
// OrderBar
// ------------------------------------------------------------------------------------------------------------
export interface OrderBarProps {
  build: Build
  shown: boolean
  onOrder: () => void
  priceState?: PriceState
  /** Draw it in place (the /system page) instead of fixed to the bottom of the window. */
  inline?: boolean
  /** The landmark's name; unique when two bars share a page (the /system page). */
  label?: string
}

export function OrderBar({ build, shown, onOrder, priceState = 'ready', inline, label = 'Your HALO' }: OrderBarProps): JSX.Element {
  useEffect(() => {
    if (inline) return
    document.documentElement.style.setProperty('--sticky-bottom', shown ? '76px' : '0px')
    return () => {
      document.documentElement.style.removeProperty('--sticky-bottom')
    }
  }, [shown, inline])
  return (
    <div className="h-orderbar" data-inline={inline || undefined} data-shown={shown || undefined} role="region" aria-label={label} inert={!shown || undefined}>
      <PriceSummary build={build} state={priceState} compact />
      <Button variant="primary" onClick={onOrder}>
        Pre-order
      </Button>
    </div>
  )
}

// ------------------------------------------------------------------------------------------------------------
// OrderSheet: native <dialog>.showModal(), a bottom sheet on phones and a centred dialog on desktop
// ------------------------------------------------------------------------------------------------------------
export interface OrderSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  /** While a payment runs, closing asks first instead of cancelling silently. */
  busy?: boolean
}

export function OrderSheet({ open, onClose, title, children, footer, busy }: OrderSheetProps): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement | null>(null)
  const opener = useRef<Element | null>(null)
  const [closing, setClosing] = useState(false)
  const headingId = useId()

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) {
      opener.current = document.activeElement
      setClosing(false)
      el.showModal()
      requestAnimationFrame(() => heading.current?.focus())
    } else if (!open && el.open) {
      setClosing(true)
      const ms = parseFloat(getComputedStyle(el).getPropertyValue('--dur-sheet-out')) || 300
      const timer = window.setTimeout(() => {
        el.close()
        setClosing(false)
        ;(opener.current as HTMLElement | null)?.focus?.()
      }, ms)
      return () => window.clearTimeout(timer)
    }
  }, [open])

  function requestClose(): void {
    if (busy && !window.confirm('Your payment is still being processed. Close anyway? It will finish in the background.')) return
    onClose()
  }

  return (
    <dialog
      ref={dialog}
      className="h-sheet"
      data-closing={closing || undefined}
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault()
        requestClose()
      }}
      onClick={(e) => {
        if (e.target === dialog.current) requestClose()
      }}
    >
      {open || closing ? (
      <div className="h-sheet__panel">
        <header className="h-sheet__head">
          <h2 id={headingId} tabIndex={-1} ref={heading}>
            {title}
          </h2>
          <IconButton label="Close" icon={<CloseIcon />} onClick={requestClose} />
        </header>
        <div className="h-sheet__body">{children}</div>
        {footer ? <footer className="h-sheet__foot">{footer}</footer> : null}
      </div>
      ) : null}
    </dialog>
  )
}
