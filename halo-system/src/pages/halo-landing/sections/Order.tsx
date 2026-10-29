/**
 * The order sheet (UX.md S7, A16-A19, A21): the build at the top, three fields, "Place the pre-order". A simulated
 * order service (latency.ts, `?latency=`); nothing is charged and nothing is sent. Success turns the sheet into its
 * confirmation and closes the halo ring around "Pre-ordered" (the thread); "Cancel this pre-order" offers Undo.
 */
import { useEffect, useId, useRef, useState, type JSX } from 'react'
import { ActionButton, announce, FEEDBACK_TIMING, InlineMessage } from '@/system/feedback'
import { Button, describe, ErrorSummary, euro, Field, OrderSheet, priceOf, type Build } from '@/system/halo'
import { SimulatedFailure, simulate, type LatencyId } from '@/system/latency'

export interface OrderProps {
  open: boolean
  onClose: () => void
  build: Build
  delivery: string
  latency: LatencyId
  /** The page's S7 summary follows the order: placed, cancelled. */
  onPlaced: (placed: boolean) => void
}

class OfflineHold extends Error {
  constructor() {
    super('offline')
    this.name = 'OfflineHold'
  }
}

/** How long "Undo" stays after a cancel, in ms (UX.md A19): the slow-notice span, long enough to read and act. */
const UNDO_MS = FEEDBACK_TIMING.slowNoticeMs

export function Order({ open, onClose, build, delivery, latency, onPlaced }: OrderProps): JSX.Element {
  const [placed, setPlaced] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [postcode, setPostcode] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [held, setHeld] = useState(false)
  const [slow, setSlow] = useState(false)
  const summary = useRef<HTMLDivElement>(null)
  const confirmHeading = useRef<HTMLParagraphElement>(null)
  const slowTimer = useRef<number | undefined>(undefined)
  const undoTimer = useRef<number | undefined>(undefined)
  const ids = { name: useId(), email: useId(), postcode: useId() }

  const errors = [
    !fullName.trim() ? { id: ids.name, text: 'Enter your name' } : null,
    !email.trim() ? { id: ids.email, text: 'Enter your email address' } : !/^\S+@\S+\.\S+$/.test(email) ? { id: ids.email, text: 'Enter an email address like name@example.com' } : null,
    !postcode.trim() ? { id: ids.postcode, text: 'Enter a postcode' } : null,
  ].filter((e): e is { id: string; text: string } => !!e)
  const show = (id: string): string | null => (submitted ? (errors.find((e) => e.id === id)?.text ?? null) : null)
  const reference = `HALO-${build.size}${build.band.slice(0, 2).toUpperCase()}-0427`

  // a pre-order held while offline sends itself when the connection returns (A21)
  useEffect(() => {
    if (!held) return
    const online = (): void => {
      void simulate(latency, true).then(
        () => {
          setHeld(false)
          confirm()
        },
        () => setFailure('The order service did not answer. Nothing was charged and your details are kept.'),
      )
    }
    window.addEventListener('online', online)
    return () => window.removeEventListener('online', online)
  })

  useEffect(() => () => {
    window.clearTimeout(slowTimer.current)
    window.clearTimeout(undoTimer.current)
  }, [])

  function confirm(): void {
    setPlaced(reference)
    setCancelled(false)
    onPlaced(true)
    requestAnimationFrame(() => confirmHeading.current?.focus())
  }

  function cancel(): void {
    setCancelled(true)
    onPlaced(false)
    announce('Pre-order cancelled.')
    window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => {
      setPlaced(null)
      setCancelled(false)
    }, UNDO_MS)
  }

  function undo(): void {
    window.clearTimeout(undoTimer.current)
    setCancelled(false)
    onPlaced(true)
    announce('Pre-ordered')
  }

  const confirmed = placed && !cancelled
  return (
    <OrderSheet
      open={open}
      onClose={onClose}
      title={placed ? 'Your HALO is reserved' : 'Pre-order HALO'}
      footer={
        placed ? (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        ) : (
          <div className="order__foot">
            <span className="order__total">Total {euro(priceOf(build))}. Nothing is charged until your HALO ships.</span>
            <ActionButton
              variant="primary"
              pendingLabel="Placing your pre-order…"
              slowLabel="Still placing your pre-order…"
              slowMessage="Still placing your pre-order. Nothing is charged twice."
              successLabel="Pre-ordered"
              successMessage={false}
              errorMessage={(e) =>
                e instanceof Error && e.name === 'ValidationError'
                  ? `Fix ${errors.length === 1 ? 'this problem' : `${errors.length} problems`} to pre-order`
                  : e instanceof OfflineHold
                    ? "You're not connected. Your pre-order waits on this device and sends when you're connected again."
                    : 'The order service did not answer. Nothing was charged and your details are kept.'
              }
              onAction={async (signal) => {
                setSubmitted(true)
                setFailure(null)
                if (errors.length) {
                  requestAnimationFrame(() => summary.current?.focus())
                  throw Object.assign(new Error('invalid'), { name: 'ValidationError' })
                }
                if (!navigator.onLine) {
                  setHeld(true)
                  throw new OfflineHold()
                }
                window.clearTimeout(slowTimer.current)
                slowTimer.current = window.setTimeout(() => setSlow(true), FEEDBACK_TIMING.slowNoticeMs)
                try {
                  await simulate(latency, true, signal)
                } finally {
                  window.clearTimeout(slowTimer.current)
                  setSlow(false)
                }
              }}
              onSuccess={() => {
                announce('Pre-ordered')
                confirm()
              }}
              onError={(e) => {
                if (e instanceof Error && (e.name === 'ValidationError' || e instanceof OfflineHold)) return
                setFailure(e instanceof SimulatedFailure ? 'The order service did not answer. Nothing was charged and your details are kept.' : 'This took more than 30 seconds and was stopped. Nothing was charged and your details are kept.')
              }}
            >
              Place the pre-order
            </ActionButton>
            <p className="order__study">A design study: nothing is charged and nothing is sent.</p>
          </div>
        )
      }
    >
      {placed ? (
        <div className="order__confirm">
          {confirmed ? (
            <div className="closed-ring" aria-hidden="true">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle className="closed-ring__track" cx="60" cy="60" r="52" />
                <circle className="closed-ring__arc" cx="60" cy="60" r="52" pathLength="1" />
              </svg>
            </div>
          ) : null}
          <p ref={confirmHeading} tabIndex={-1} className="order__state">
            {confirmed ? 'Pre-ordered' : 'Pre-order cancelled.'}
          </p>
          {confirmed ? (
            <>
              <p className="order__ref">Reference {placed}</p>
              <p>
                {describe(build)}. {delivery}. We'll email you at {email} when it ships.
              </p>
              <p className="order__study">A design study: nothing was charged and nothing was sent.</p>
              <button type="button" className="order__cancel" onClick={cancel}>
                Cancel this pre-order
              </button>
            </>
          ) : (
            <Button variant="secondary" onClick={undo}>
              Undo
            </Button>
          )}
        </div>
      ) : (
        <form noValidate className="order__form" onSubmit={(e) => e.preventDefault()}>
          {submitted && errors.length ? <ErrorSummary ref={summary} heading={`Fix ${errors.length === 1 ? 'this problem' : `${errors.length} problems`} to pre-order`} errors={errors} /> : null}
          <p className="order__build">
            <strong>{euro(priceOf(build))}</strong> · {describe(build)} · {delivery}
          </p>
          <Field id={ids.name} label="Full name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} error={show(ids.name)} reserveMessage />
          <Field id={ids.email} label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={show(ids.email)} reserveMessage />
          <Field id={ids.postcode} label="Postcode" autoComplete="postal-code" value={postcode} onChange={(e) => setPostcode(e.target.value)} error={show(ids.postcode)} reserveMessage />
          <div className="order__msg">
            {failure ? (
              <InlineMessage tone="error" title="The pre-order did not go through">
                {failure}
              </InlineMessage>
            ) : held ? (
              <InlineMessage tone="info" title="You're not connected">
                Your pre-order waits on this device and sends when you're connected again.
              </InlineMessage>
            ) : slow ? (
              <InlineMessage tone="info" title="Still placing your pre-order">
                Nothing is charged twice. You can keep waiting.
              </InlineMessage>
            ) : null}
          </div>
        </form>
      )}
    </OrderSheet>
  )
}
