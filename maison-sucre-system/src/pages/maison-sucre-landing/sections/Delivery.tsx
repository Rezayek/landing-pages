/**
 * S7 Delivery (UX.md §S7, inventory A19): the ganache band, "Dark band behind light product for one section only"
 * (steal list 12). The band carries the words and the rendered still; the check itself is a light card (the system's
 * surface tone) standing on it with a lace scallop, so every system field keeps its own contrast in both themes.
 * Behaviour follows DeliveryScenario in system/scenarios: checked on submit, the button pending ("Checking…"), the
 * answer under it in a reserved space, validation stops the action and focuses the first field with a problem.
 */
import { useId, useRef, useState, type JSX } from 'react'
import { ACTION_STOPPED, ActionButton, InlineMessage, announce } from '@/system/feedback'
import { checkDelivery, normalisePostcode } from '@/system/cake'
import { simulate, type LatencyId } from '@/system/latency'
import { BeadBorder, Button, DatePicker, Field, TextInput, describedBy, formatDate } from '@/system/ui'
import './delivery.css'

interface Answer {
  tone: 'success' | 'warning'
  title: string
  text: string
}

export function Delivery({ latency }: { latency: LatencyId }): JSX.Element {
  const postcodeId = useId()
  const dateId = useId()
  const [postcode, setPostcode] = useState('')
  const [date, setDate] = useState<Date | null>(null)
  const [error, setError] = useState<{ postcode?: string; date?: string }>({})
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [failed, setFailed] = useState(false)
  const check = useRef<HTMLButtonElement>(null)

  // an answer belongs to the words that were checked: editing either field puts it away
  const forget = (): void => {
    setAnswer(null)
    setFailed(false)
  }

  return (
    <section id="delivery" className="dl" aria-labelledby="delivery-title">
      <div className="dl__inner">
        <header className="dl__head">
          <h2 id="delivery-title" className="ms-focus-target" tabIndex={-1}>
            Delivery
          </h2>
          <BeadBorder variant="shell" />
          <p className="dl__sub">We set it up at your venue within 20 miles, Tuesday to Saturday (sample rules).</p>
        </header>

        <figure className="dl__fig">
          {/* its own picture (blender/delivery_still.py): the cake set up on its table in the room, as the couple will find it */}
          <img
            src="/maison-sucre-landing/stills/delivery-600.webp"
            srcSet="/maison-sucre-landing/stills/delivery-600.webp 600w, /maison-sucre-landing/stills/delivery-1200.webp 1200w"
            sizes="(min-width: 60rem) 46vw, 100vw"
            width={600}
            height={700}
            loading="lazy"
            decoding="async"
            alt="The four-tier cake set up on its round table in the wedding room: a garland on the cloth, a cake knife, a tasting slice and candles, guest tables and gold chairs behind, tall arched windows onto a garden."
          />
          <figcaption>Rendered study</figcaption>
        </figure>

        <form
          className="dl__card ms-scallop"
          noValidate
          aria-label="Check delivery"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="dl__fields">
            <Field
              id={postcodeId}
              label="Venue postcode"
              hint="For example SW4 0JH"
              message={error.postcode}
            >
              <TextInput
                id={postcodeId}
                value={postcode}
                autoComplete="postal-code"
                invalid={!!error.postcode}
                aria-describedby={describedBy(postcodeId, true, !!error.postcode)}
                onChange={(e) => {
                  setPostcode(e.target.value)
                  setError((current) => ({ ...current, postcode: undefined }))
                  forget()
                }}
              />
            </Field>
            <DatePicker
              id={dateId}
              label="Wedding date"
              value={date}
              message={error.date}
              onChange={(d) => {
                setDate(d)
                setError((current) => ({ ...current, date: undefined }))
                forget()
              }}
            />
          </div>

          <div className="dl__act">
            <ActionButton
              ref={check}
              type="submit"
              variant="secondary"
              pendingLabel="Checking…"
              successLabel="Checked"
              successMessage={false}
              errorMessage={() => 'We could not check delivery just now. Everything you wrote is still here.'}
              onAction={async (signal) => {
                forget()
                const pc = normalisePostcode(postcode)
                const problems = {
                  postcode: pc
                    ? undefined
                    : postcode.trim()
                      ? 'Postcode must be a full UK postcode, like SW4 0JH'
                      : 'Enter your venue postcode',
                  date: date ? undefined : 'Enter your wedding date',
                }
                setError(problems)
                if (problems.postcode || problems.date || !pc || !date) {
                  document.getElementById(problems.postcode ? postcodeId : dateId)?.focus()
                  return ACTION_STOPPED
                }
                const result = await simulate(latency, checkDelivery(pc, date), signal)
                const next: Answer =
                  result.kind === 'delivers'
                    ? {
                        tone: 'success',
                        title: 'We can bring it to your venue',
                        text: `We deliver to ${result.area} on ${formatDate(date)}. Delivery is included within 20 miles (sample).`,
                      }
                    : result.kind === 'monday'
                      ? {
                          tone: 'warning',
                          title: 'We do not deliver on Mondays',
                          text: 'Choose another day, or collect it the Saturday before.',
                        }
                      : {
                          tone: 'warning',
                          title: 'That venue is beyond 20 miles',
                          text: 'We can still bring it for a sample fee, or you can collect it.',
                        }
                setAnswer(next)
                announce(`${next.title}. ${next.text}`)
              }}
              onError={() => setFailed(true)}
            >
              Check delivery
            </ActionButton>
          </div>

          {/* the answer's space is reserved: the card never changes height when it arrives */}
          <div className="dl__answer">
            {answer ? (
              <InlineMessage tone={answer.tone} title={answer.title}>
                {answer.text}
              </InlineMessage>
            ) : failed ? (
              <InlineMessage
                tone="error"
                title="We could not check delivery just now"
                action={
                  <Button variant="secondary" onClick={() => check.current?.click()}>
                    Try again
                  </Button>
                }
              >
                Everything you wrote is still here.
              </InlineMessage>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  )
}
