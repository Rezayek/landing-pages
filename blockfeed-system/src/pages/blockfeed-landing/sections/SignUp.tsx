/**
 * S6 Sign up (Q6), the last Y-level: bedrock. The form works without JavaScript as a plain form that posts nowhere.
 * With JavaScript: errors show when a field is left and then follow what is typed; a submit with errors puts a summary
 * under the button and moves focus to it; a valid submit waits 800 ms (simulated), reads "Plot claimed" and shows the
 * design-study note, which takes focus. The panel keeps its height through all of it: the summary and the note share
 * one reserved slot.
 */
import { useEffect, useRef, useState, type FormEvent, type JSX, type MouseEvent } from 'react'
import { Panel, TextField } from '@/system/ui'
import { ActionButton, InlineMessage } from '@/system/feedback'
import { wait } from '@/system/latency'
import { play } from '@/system/vfx'
import './page.css'
import './signup.css'

type Field = 'name' | 'email'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function check(field: Field, value: string): string | undefined {
  if (field === 'name') return value.trim() ? undefined : 'Enter a builder name'
  return EMAIL.test(value.trim()) ? undefined : 'Enter an email like name@example.com'
}

const FIELD_ID: Record<Field, string> = { name: 'signup-name', email: 'signup-email' }

export function SignUp(): JSX.Element {
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '' })
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, email: false })
  const [submitted, setSubmitted] = useState(false)
  const [claims, setClaims] = useState(0)
  const panel = useRef<HTMLDivElement>(null)
  const summary = useRef<HTMLDivElement>(null)
  const note = useRef<HTMLDivElement>(null)
  const [tries, setTries] = useState(0)

  const errors: Partial<Record<Field, string>> = {
    name: check('name', values.name),
    email: check('email', values.email),
  }
  const shown = (field: Field): string | undefined => (touched[field] || submitted ? errors[field] : undefined)
  const failing = (['name', 'email'] as const).filter((f) => errors[f])
  const summaryOn = submitted && failing.length > 0
  const plotName = values.name.trim().slice(0, 18) || 'Your'
  const handle = values.name.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '').slice(0, 18) || 'you'

  // A submit with errors: focus goes to the summary. A claim: focus goes to the study note.
  useEffect(() => {
    if (tries > 0) summary.current?.focus()
  }, [tries])
  useEffect(() => {
    if (claims > 0) note.current?.focus()
  }, [claims])

  function set(field: Field, value: string): void {
    setValues((v) => ({ ...v, [field]: value }))
  }
  function leave(field: Field): void {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  // Runs before the button's own press: an invalid form never starts the wait.
  function guard(event: MouseEvent<HTMLButtonElement>): void {
    if (failing.length === 0) return
    event.preventDefault()
    event.stopPropagation()
    setSubmitted(true)
    setTries((n) => n + 1)
  }

  async function create(signal: AbortSignal): Promise<void> {
    setSubmitted(true)
    await wait(800, signal) // simulated: nothing is sent
  }

  return (
    <section id="signup" className="bl-section bl-signup" data-y="0" data-y-label="bedrock" aria-labelledby="signup-title">
      <div className="bl-inner">
        <header className="bl-head">
          <h2 id="signup-title" className="bl-h2">
            Claim your plot.
          </h2>
          <p className="bl-lede">
            A free account gives you a builder page, a place to post builds with seed and coordinates, and votes in every weekly challenge. Any build counts, first builds too.
          </p>
        </header>
        <div className="bl-signup__split">
        <Panel className="bl-signup__panel" data-claimed={claims > 0 ? '' : undefined}>
          <div ref={panel} className="bl-signup__glint">
            <form
              className="bl-signup__form"
              action="#"
              method="post"
              noValidate
              aria-labelledby="signup-title"
              onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
            >
              <div className="bl-signup__fields">
                <TextField
                  id="signup-name"
                  name="name"
                  label="Builder name"
                  hint="What other builders see. You can change it later."
                  error={shown('name')}
                  autoComplete="nickname"
                  required
                  value={values.name}
                  onChange={(e) => set('name', e.target.value)}
                  onBlur={() => leave('name')}
                />
                <TextField
                  id="signup-email"
                  name="email"
                  type="email"
                  label="Email"
                  hint="Only for sign-in links."
                  error={shown('email')}
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={(e) => set('email', e.target.value)}
                  onBlur={() => leave('email')}
                />
              </div>
              <div className="bl-signup__actions">
                <ActionButton
                  type="submit"
                  variant="primary"
                  pendingLabel="Creating…"
                  successLabel="Plot claimed"
                  onClickCapture={guard}
                  onAction={create}
                  onSuccess={() => {
                    setClaims((n) => n + 1)
                    play(panel.current, 'glint')
                  }}
                >
                  Create free account
                </ActionButton>
              </div>
              <div className="bl-signup__status">
                {summaryOn ? (
                  <div ref={summary} tabIndex={-1} className="bl-signup__focus">
                    <InlineMessage tone="error" title={`Fix ${failing.length} ${failing.length === 1 ? 'thing' : 'things'} to create your account`}>
                      <ul className="bl-signup__errors">
                        {failing.map((field) => (
                          <li key={field}>
                            <a
                              href={`#${FIELD_ID[field]}`}
                              onClick={(event) => {
                                event.preventDefault()
                                document.getElementById(FIELD_ID[field])?.focus()
                              }}
                            >
                              {errors[field]}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </InlineMessage>
                  </div>
                ) : claims > 0 ? (
                  <div ref={note} tabIndex={-1} className="bl-signup__focus">
                    <InlineMessage tone="info">Design study: nothing was sent. A real Blockfeed would email you a sign-in link.</InlineMessage>
                  </div>
                ) : null}
              </div>
            </form>
          </div>
        </Panel>
        {/* the plot you are claiming: its sign follows the builder name as it is typed (decorative; the form says it all) */}
        <figure className="bl-plot" aria-hidden="true" data-claimed={claims > 0 ? '' : undefined}>
          <div className="bl-plot__sign">
            <span className="bl-plot__line">{plotName}’s plot</span>
            <span className="bl-plot__line bl-plot__line--small">blockfeed.example/@{handle}</span>
            <span className="bl-plot__line bl-plot__line--small">{claims > 0 ? 'Claimed today' : '0 builds · free'}</span>
          </div>
          <div className="bl-plot__post" />
          <div className="bl-plot__ground" />
        </figure>
        </div>
        <p className="bl-note">Not affiliated with Mojang or Microsoft.</p>
      </div>
    </section>
  )
}
