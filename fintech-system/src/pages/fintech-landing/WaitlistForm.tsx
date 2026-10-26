/**
 * The waitlist form (UX.md A6, A14, A16): Field + TextInput + ActionButton, the result replacing the form in its box.
 * Kitty has no sign-up endpoint yet (BRIEF.md open question 3), so the form sends nothing and says so. With
 * `?latency=<preset>` in the URL it runs a labelled simulation of the connected flow, so every state can be captured.
 */
import { type FormEvent, type JSX, useEffect, useId, useRef, useState } from 'react'
import { ActionButton, announce } from '@/system/feedback'
import { Field, TextInput } from '@/system/ui'
import { isAbort, parseLatency, simulate, SimulatedFailure, wait } from '@/system/latency'
import { Tick } from '@/system/ui/Tick'

/** Where sign-ups go once the person gives it (DESIGN.md asset request 1). Empty: not connected. */
const ENDPOINT = ''

type Status = { kind: 'form' } | { kind: 'joined'; email: string; already: boolean } | { kind: 'not-sent' }

class OfflineError extends Error {}
class UnreachableError extends Error {}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function failureText(error: unknown): string {
  if (error instanceof OfflineError) return 'You’re not connected. Your address is still here. Try again once you’re back.'
  if (error instanceof UnreachableError) return 'Could not reach Kitty. Your address is still here. Check your connection, then try again.'
  if (error instanceof DOMException && error.name === 'TimeoutError') return 'This took too long and was stopped. Your address is still here. Try again.'
  return 'Could not add you to the waitlist. Your address is still here. Try again.'
}

export function WaitlistForm({ onJoined }: { onJoined?: (email: string) => void }): JSX.Element {
  const id = useId()
  const fieldRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const resultRef = useRef<HTMLParagraphElement>(null)
  const [email, setEmail] = useState('')
  const [invalid, setInvalid] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'form' })
  const params = new URLSearchParams(window.location.search)
  const simulation = parseLatency(params.get('latency'))
  // ?outcome=unreachable|already|timeout shows the paths that need a real endpoint, as a labelled simulation (UX.md A6)
  const outcome = params.get('outcome')

  function check(): string | null {
    const value = email.trim()
    if (!value) return 'Enter your email address.'
    if (!EMAIL.test(value)) return 'Email address must include @, like ada@example.com.'
    return null
  }

  async function join(signal: AbortSignal): Promise<Status> {
    const address = email.trim().toLowerCase()
    if (!navigator.onLine) throw new OfflineError()
    if (simulation || outcome) {
      if (outcome === 'timeout') await wait(60000, signal) // stopped by the button's timeout (shortened below)
      await simulate(simulation ?? 'slow', true, signal)
      if (outcome === 'unreachable') throw new UnreachableError()
      return { kind: 'joined', email: address, already: outcome === 'already' }
    }
    if (!ENDPOINT) {
      await wait(250, signal) // acknowledged: the form answers, then says nothing was sent
      return { kind: 'not-sent' }
    }
    let response: Response
    try {
      response = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: address }), signal })
    } catch (error) {
      if (isAbort(error)) throw error
      throw new UnreachableError()
    }
    if (response.status === 409) return { kind: 'joined', email: address, already: true } // assumed reply (UX.md A6)
    if (!response.ok) throw new SimulatedFailure()
    return { kind: 'joined', email: address, already: false }
  }

  function settle(next: Status): void {
    setStatus(next)
    // The result replaces the form: say it once, politely (the button's own success message is off)
    announce(
      next.kind === 'joined'
        ? next.already
          ? 'That address is already on the list.'
          : `You’re on the list. We’ll email ${next.email} when Kitty opens.`
        : next.kind === 'not-sent'
          ? 'Not sent. This form isn’t connected yet, so we haven’t received your address.'
          : '',
    )
    if (next.kind === 'joined') onJoined?.(next.email)
  }

  // Focus the result line once it has replaced the form (UX.md A6)
  useEffect(() => {
    if (status.kind !== 'form') resultRef.current?.focus()
  }, [status.kind])

  if (status.kind !== 'form') {
    const joined = status.kind === 'joined'
    const text = joined
      ? status.already
        ? 'That address is already on the list. We’ll email you when Kitty opens.'
        : `You’re on the list. We’ll email ${status.email} when Kitty opens.`
      : 'Not sent. This form isn’t connected yet, so we haven’t received your address.'
    return (
      <div className="fl-join fl-join--done" data-tone={joined ? 'positive' : 'info'}>
        <p ref={resultRef} tabIndex={-1} className="fl-join__result">
          {joined ? <Tick label="Joined" play={1} /> : null}
          <span>
            {text}
            {simulation || outcome ? <span className="fl-sim"> (simulation: nothing was sent)</span> : null}
          </span>
        </p>
        <button
          type="button"
          className="k-btn"
          data-variant="quiet"
          onClick={() => {
            setStatus({ kind: 'form' })
            requestAnimationFrame(() => {
              fieldRef.current?.focus()
              fieldRef.current?.select()
            })
          }}
        >
          {joined ? 'Use a different address' : 'Edit the address'}
        </button>
      </div>
    )
  }

  return (
    <form
      className="fl-join"
      noValidate
      onSubmit={(event: FormEvent) => {
        event.preventDefault()
        buttonRef.current?.click()
      }}
    >
      <div className="fl-join__row">
        <Field id={id} label="Email address" hiddenLabel message={invalid ? { tone: 'negative', text: invalid } : null}>
          {(describedBy) => (
            <TextInput
              ref={fieldRef}
              id={id}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              invalid={!!invalid}
              aria-describedby={[describedBy, failure ? `${id}-failure` : null].filter(Boolean).join(' ') || undefined}
              onChange={(event) => {
                setEmail(event.target.value)
                if (invalid) setInvalid(null)
              }}
            />
          )}
        </Field>
        <ActionButton
          ref={buttonRef}
          type="submit"
          variant="primary"
          pendingLabel="Joining…"
          slowLabel="Still joining…"
          slowMessage="Still joining. This is taking longer than usual."
          successLabel="Joined"
          successMessage={false}
          errorMessage={failureText}
          timeoutMs={outcome === 'timeout' ? 2500 : undefined}
          onClickCapture={(event) => {
            // Check the address before the button goes pending: a typing mistake is not a failed request.
            const problem = check()
            if (!problem) return
            event.preventDefault()
            event.stopPropagation()
            setInvalid(problem)
            setFailure(null)
            announce(problem, 'assertive')
            fieldRef.current?.focus()
          }}
          onAction={async (signal) => {
            setFailure(null)
            settle(await join(signal))
          }}
          onError={(error) => setFailure(failureText(error))}
        >
          Join the waitlist
        </ActionButton>
      </div>
      {failure ? (
        <p id={`${id}-failure`} className="k-field__msg fl-join__failure" data-tone="negative">
          <span>
            {failure}
            {simulation || outcome ? <span className="fl-sim"> (simulation)</span> : null}
          </span>
        </p>
      ) : null}
    </form>
  )
}
