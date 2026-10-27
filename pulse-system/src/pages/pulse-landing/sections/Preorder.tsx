/**
 * S5 Pre-order (UX.md §S5; actions A16, A17, A18). The patch tag beside the form, the form that sends nothing, and
 * the study result that replaces the form in the same box. Validation runs on submit only; the system's ActionButton
 * owns the wait (pending label, no double press, announcement). Fields reuse the system's pi-field classes so they
 * read like PatchNameField.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type JSX, type ReactNode, type Ref } from 'react'
import { ActionButton, InlineMessage, announce } from '@/system/feedback'
import { FinishSwitch, Led, type Finish } from '@/system/instrument'
import { parseLatency, simulate, wait } from '@/system/latency'
import { PatchTag } from '../parts/PatchTag'
import { useYourPatch } from '../parts/yourPatch'
import './preorder.css'

type FieldName = 'name' | 'email' | 'patch'
type Errors = Partial<Record<FieldName, string>>

const MAX_PATCH = 16
const CHECK_FIELDS = 'Check the fields with a message under them.'
const REQUEST_FAILED = "Simulated failure: the pre-order didn't go through. Press the key to try again."
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

class InvalidOrder extends Error {}

function check(field: FieldName, value: string): string | undefined {
  const v = value.trim()
  if (field === 'name') return v ? undefined : 'Add your name to place the order.'
  if (field === 'patch') return v ? undefined : 'Name your patch so it can go on slot 1.'
  if (!v) return 'Add your email to hear when it ships.'
  return EMAIL_SHAPE.test(v) ? undefined : 'That email looks incomplete. Check the part after the @.'
}

/** `?latency=fast|slow|very-slow|stalled|fail`; with none, the 600 ms the study promises (UX A17). */
function placeOrder(): Promise<unknown> {
  const latency = parseLatency(new URLSearchParams(window.location.search).get('latency'))
  return latency ? simulate(latency, true) : wait(600)
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  count?: string
  inputRef?: Ref<HTMLInputElement>
  inputProps: JSX.IntrinsicElements['input']
}

/** A labelled input in the system's field look (pi-field), with its hint and error tied by aria-describedby. */
function Field({ label, hint, error, count, inputRef, inputProps }: FieldProps): JSX.Element {
  const id = useId()
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className="pi-field pl-order__field" data-invalid={error ? true : undefined}>
      <label className="pi-legend" htmlFor={id}>
        {label}
      </label>
      <span className="pi-field__row">
        <input
          {...inputProps}
          id={id}
          ref={inputRef}
          className="pi-field__input pl-order__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {count ? (
          <span className="pi-field__count" aria-hidden="true">
            {count}
          </span>
        ) : null}
      </span>
      {hint ? (
        <span id={`${id}-hint`} className="pi-help">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="pi-field__error">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8" />
            <path d="M7 7 L13 13 M13 7 L7 13" />
          </svg>
          {error}
        </span>
      ) : null}
    </div>
  )
}

function Noscript({ children }: { children: ReactNode }): JSX.Element {
  return (
    <noscript>
      <p className="pi-help">{children}</p>
    </noscript>
  )
}

export function Preorder(): JSX.Element {
  const { name: tagName } = useYourPatch()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [finish, setFinish] = useState<Finish>('graphite')
  // The slot-1 name follows the tag until the visitor edits the field, then it is theirs.
  const [ownPatch, setOwnPatch] = useState<string | null>(null)
  const patch = ownPatch ?? tagName
  const [errors, setErrors] = useState<Errors>({})
  const [placed, setPlaced] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reserved, setReserved] = useState<number | undefined>(undefined)

  const box = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const patchRef = useRef<HTMLInputElement>(null)
  const resultHeading = useRef<HTMLHeadingElement>(null)
  const moveFocus = useRef<'result' | 'name' | null>(null)

  useEffect(() => {
    const target = moveFocus.current
    if (!target) return
    moveFocus.current = null
    if (target === 'result') resultHeading.current?.focus()
    else nameRef.current?.focus()
  }, [placed])

  // A16: an error clears as soon as its field becomes valid; it never appears while typing.
  function edit(field: FieldName, value: string): void {
    if (errors[field] && !check(field, value)) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function submit(): Promise<void> {
    setFailed(false)
    const next: Errors = { name: check('name', name), email: check('email', email), patch: check('patch', patch) }
    setErrors(next)
    const refs: [FieldName, HTMLInputElement | null][] = [
      ['name', nameRef.current],
      ['email', emailRef.current],
      ['patch', patchRef.current],
    ]
    const first = refs.find(([field]) => next[field])
    if (first) {
      first[1]?.focus()
      throw new InvalidOrder(CHECK_FIELDS)
    }
    await placeOrder()
  }

  function done(): void {
    setReserved(box.current?.offsetHeight) // the result keeps the form's height: nothing below moves
    moveFocus.current = 'result'
    setPlaced(true)
    announce(
      `Nothing was sent: this is a design study. If PULSE-1 were real, an email would be on its way to ${email.trim()}.`,
    )
  }

  function change(): void {
    moveFocus.current = 'name'
    setPlaced(false)
    setReserved(undefined)
  }

  const finishWord = finish === 'graphite' ? 'Graphite' : 'Bone'

  return (
    <section id="order" aria-labelledby="order-title" data-section="order" className="pl-order">
      <div className="pl-order__wrap">
        <header className="pl-order__head">
          <h2 id="order-title" tabIndex={-1}>
            Pre-order <span className="pl-nowrap">PULSE-1</span> with your patch.
          </h2>
          <p>It arrives with the sound you made here loaded on the first slot.</p>
        </header>

        <div className="pl-order__tag">
          <PatchTag />
        </div>

        <div ref={box} className="pl-order__box" style={reserved ? { minBlockSize: reserved } : undefined}>
          {placed ? (
            <div className="pl-order__result" role="group" aria-labelledby="order-result-title">
              <h3 id="order-result-title" ref={resultHeading} tabIndex={-1}>
                <Led state="on" flashKey={placed} />
                Nothing was sent: this is a design study.
              </h3>
              <p>
                If PULSE-1 were real, an email would be on its way to <strong>{email.trim()}</strong>. Here is the slip
                it would hold.
              </p>
              {/* the order slip: a ruled ledger that fills the form's box, so the result has no empty half */}
              <dl className="pl-slip">
                <dt className="pi-legend">Name</dt>
                <dd>{name.trim()}</dd>
                <dt className="pi-legend">Email</dt>
                <dd>{email.trim()}</dd>
                <dt className="pi-legend">Finish</dt>
                <dd>{finishWord}</dd>
                <dt className="pi-legend">Slot 1</dt>
                <dd className="pl-slip__patch">{patch.trim()}</dd>
                <dt className="pi-legend">Price</dt>
                <dd>349 € (invented)</dd>
                <dt className="pi-legend">You pay</dt>
                <dd>Nothing until it ships. Cancel any time.</dd>
                <dt className="pi-legend">Sent</dt>
                <dd>Nothing. This is a design study.</dd>
              </dl>
              <button type="button" className="pi-quiet" onClick={change}>
                Change the order
              </button>
            </div>
          ) : (
            <form
              className="pl-order__form"
              noValidate
              aria-label="Pre-order PULSE-1"
              onSubmit={(e: FormEvent) => e.preventDefault()}
            >
              <Field
                label="Your name"
                error={errors.name}
                inputRef={nameRef}
                inputProps={{
                  type: 'text',
                  name: 'name',
                  autoComplete: 'name',
                  value: name,
                  onChange: (e) => {
                    setName(e.target.value)
                    edit('name', e.target.value)
                  },
                }}
              />
              <Field
                label="Email"
                hint="Only used to say when it ships. This study keeps nothing."
                error={errors.email}
                inputRef={emailRef}
                inputProps={{
                  type: 'email',
                  name: 'email',
                  autoComplete: 'email',
                  inputMode: 'email',
                  spellCheck: false,
                  value: email,
                  onChange: (e) => {
                    setEmail(e.target.value)
                    edit('email', e.target.value)
                  },
                }}
              />
              <FinishSwitch value={finish} onChange={setFinish} />
              <Field
                label="Patch on slot 1"
                error={errors.patch}
                count={`${patch.length}/${MAX_PATCH}`}
                inputRef={patchRef}
                inputProps={{
                  type: 'text',
                  name: 'patch',
                  autoComplete: 'off',
                  spellCheck: false,
                  maxLength: MAX_PATCH,
                  value: patch,
                  onChange: (e) => {
                    const value = e.target.value.toUpperCase().slice(0, MAX_PATCH)
                    setOwnPatch(value)
                    edit('patch', value)
                  },
                }}
              />
              <div className="pl-order__act">
                <ActionButton
                  type="submit"
                  variant="primary"
                  pendingLabel="Placing your pre-order…"
                  onAction={submit}
                  successMessage={false}
                  errorMessage={(e): string => (e instanceof InvalidOrder ? CHECK_FIELDS : REQUEST_FAILED)}
                  onSuccess={done}
                  onError={(e) => setFailed(!(e instanceof InvalidOrder))}
                >
                  Pre-order PULSE-1
                </ActionButton>
                {failed ? (
                  <InlineMessage tone="error" title="Pre-order not placed">
                    {REQUEST_FAILED} Your answers are kept.
                  </InlineMessage>
                ) : null}
                <ul className="pl-order__answers">
                  <li>Pay nothing until it ships. Cancel any time.</li>
                  <li>Works with your DAW over USB-C: audio and MIDI in one cable, no drivers.</li>
                  <li>Sound in one press: plug in USB-C, turn it on, play.</li>
                </ul>
                <p className="pi-help pl-order__note">349 €. Every term here is invented for this study. The form sends nothing.</p>
                <Noscript>
                  Design study: the form needs JavaScript to show its result; nothing would be sent either way.
                </Noscript>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
