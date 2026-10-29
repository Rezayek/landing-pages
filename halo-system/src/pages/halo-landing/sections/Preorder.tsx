/**
 * S7 Pre-order (UX.md): the terms, the build, the action, and the quiet secondary: a place on the launch list
 * (A20). The reservation is simulated (latency.ts) and sends nothing.
 */
import { useId, useState, type JSX } from 'react'
import { ActionButton, announce } from '@/system/feedback'
import { Button, Field, PriceSummary, type Build, type PriceState } from '@/system/halo'
import { simulate, type LatencyId } from '@/system/latency'

export interface PreorderProps {
  build: Build
  price: PriceState
  delivery: string
  onRetry: () => void
  onPreorder: () => void
  placed: boolean
  latency: LatencyId
}

export function Preorder({ build, price, delivery, onRetry, onPreorder, placed, latency }: PreorderProps): JSX.Element {
  const [reserving, setReserving] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [reserved, setReserved] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const emailId = useId()

  return (
    <section id="preorder" className="preorder" aria-labelledby="preorder-title" data-stage="paper">
      <h2 id="preorder-title" className="section-title">
        Pre-order now. Pay when it ships.
      </h2>
      <p className="section-sub">Nothing is charged until your HALO ships. You can cancel before then.</p>
      <div className="preorder__summary">
        <PriceSummary build={build} state={price} delivery={delivery} onRetry={onRetry} />
        <a className="preorder__change" href="#design">
          Change
        </a>
      </div>
      <div className="preorder__actions">
        <Button variant="primary" size="large" onClick={onPreorder}>
          {placed ? 'See your pre-order' : 'Pre-order HALO'}
        </Button>
        {reserving || reserved ? null : (
          <Button variant="secondary" onClick={() => setReserving(true)}>
            Reserve a place for launch day
          </Button>
        )}
      </div>
      {reserving || reserved ? null : <p className="preorder__hint">Not ready? Leave your email for launch day.</p>}
      <div className="preorder__reserve">
        {reserved ? (
          <div className="preorder__reserved">
            <p tabIndex={-1} ref={(el) => el?.focus()}>
              You're on the list. We'll write to {reserved} once, on launch day. No other email.
            </p>
            <p className="preorder__study">A design study: nothing was sent.</p>
            <button
              type="button"
              className="order__cancel"
              onClick={() => {
                setReserved(null)
                setReserving(true)
                announce('You left the list.')
              }}
            >
              Leave the list
            </button>
          </div>
        ) : reserving ? (
          <form className="preorder__form" noValidate onSubmit={(e) => e.preventDefault()}>
            <Field
              id={emailId}
              label="Email for launch day"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              reserveMessage
              autoFocus
              action={
                <ActionButton
                  type="submit"
                  variant="secondary"
                  pendingLabel="Reserving…"
                  successLabel="Reserved"
                  successMessage={false}
                  errorMessage={(e) => (e instanceof Error && e.name === 'ValidationError' ? 'Enter an email address like name@example.com' : 'The launch list did not answer. Your email is kept.')}
                  onAction={async (signal) => {
                    setError(null)
                    if (!/^\S+@\S+\.\S+$/.test(email)) {
                      setError('Enter an email address like name@example.com')
                      throw Object.assign(new Error('invalid'), { name: 'ValidationError' })
                    }
                    // offline: the reservation waits on this device and sends when the connection returns (A21)
                    if (!navigator.onLine) {
                      setWaiting(true)
                      await new Promise<void>((resolve) => window.addEventListener('online', () => resolve(), { once: true }))
                      setWaiting(false)
                    }
                    await simulate(latency, true, signal)
                  }}
                  onError={(e) => {
                    if (!(e instanceof Error && e.name === 'ValidationError')) setError('The launch list did not answer. Your email is kept.')
                  }}
                  onDone={() => {
                    // the form gives way to the confirmation, so the button never shows its success: say it here
                    announce("Reserved. You're on the list for launch day.")
                    setReserved(email)
                    setReserving(false)
                  }}
                >
                  Reserve my place
                </ActionButton>
              }
            />
            {waiting ? <p className="preorder__hint">Waiting to send. You're not connected; it sends when you're connected again.</p> : null}
          </form>
        ) : null}
      </div>
    </section>
  )
}
