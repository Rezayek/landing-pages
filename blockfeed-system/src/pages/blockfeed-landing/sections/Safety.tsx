/**
 * S5 Safety (Q5: "Is it safe? Who keeps it clean?"). Three plain rows, each with a pixel icon in an inventory slot, and
 * beside them the promise working: a sample comment you can report in two taps (Report, then a reason). Nothing moves
 * on its own here (MOTION.md: trust reads best still); the report swaps in place and is announced. Nothing is sent.
 */
import { useRef, useState, type JSX } from 'react'
import { Avatar, Button, Icon, Panel, Slot } from '@/system/ui'
import { InlineMessage, announce } from '@/system/feedback'
import type { IconName } from '@/system/pixel/icons'
import './page.css'
import './safety.css'

const RULES: readonly { readonly icon: IconName; readonly text: string }[] = [
  { icon: 'flag', text: 'Report any build, comment or message in two taps.' },
  { icon: 'shield', text: 'Moderators read every report.' },
  { icon: 'mail', text: 'Only people you follow can message you, unless you change it.' },
]

const REASONS = ['Scam or asks for a login', 'Mean or unkind', 'Spam', 'Something else'] as const

export function Safety(): JSX.Element {
  const [step, setStep] = useState<'idle' | 'why' | 'done'>('idle')
  const [reason, setReason] = useState<string>('')
  const first = useRef<HTMLButtonElement>(null)
  const result = useRef<HTMLDivElement>(null)

  function open(): void {
    setStep('why')
    window.setTimeout(() => first.current?.focus(), 0)
  }
  function report(why: string): void {
    setReason(why)
    setStep('done')
    announce(`Reported as ${why.toLowerCase()}. The comment is hidden for you.`)
    window.setTimeout(() => result.current?.focus(), 0)
  }

  return (
    <section id="safety" className="bl-section bl-safety" data-y="8" data-y-label="safety" aria-labelledby="safety-title">
      <div className="bl-inner">
        <header className="bl-head">
          <h2 id="safety-title" className="bl-h2">
            Reports are read by people.
          </h2>
        </header>
        <div className="bl-safety__split">
          <Panel flush className="bl-safety__panel">
            <ul className="bl-safety__list">
              {RULES.map((rule) => (
                <li key={rule.icon} className="bl-safety__row">
                  <Slot>
                    <Icon name={rule.icon} size="lg" />
                  </Slot>
                  <p className="bl-safety__text">{rule.text}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="bl-report">
            <p className="bl-report__label">
              Try it on a sample comment
            </p>
            {step === 'done' ? (
              <div ref={result} tabIndex={-1} className="bl-report__result">
                <InlineMessage
                  tone="success"
                  title="Reported to the moderators"
                  action={
                    <Button size="sm" variant="ghost" onClick={() => setStep('idle')}>
                      Show the comment again
                    </Button>
                  }
                >
                  Reason: {reason}. A moderator reads it, usually within a day, and the comment is hidden for you. Design study: nothing was sent.
                </InlineMessage>
              </div>
            ) : (
              <article className="bl-report__comment" aria-label="Sample comment by diamondgiver77">
                <div className="bl-report__who">
                  <Avatar name="diamondgiver77" size="sm" decorative />
                  <span>diamondgiver77</span>
                  <span className="bl-report__when">2 min ago</span>
                </div>
                <p className="bl-report__text">Nice tower! Send me your account login and I’ll add 64 diamonds to your world.</p>
                {step === 'idle' ? (
                  <Button size="sm" icon="flag" onClick={open}>
                    Report
                  </Button>
                ) : (
                  <fieldset className="bl-report__why">
                    <legend>What’s wrong with it?</legend>
                    <div className="bl-report__reasons">
                      {REASONS.map((why, i) => (
                        <Button key={why} size="sm" ref={i === 0 ? first : undefined} onClick={() => report(why)}>
                          {why}
                        </Button>
                      ))}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setStep('idle')}>
                      Cancel
                    </Button>
                  </fieldset>
                )}
              </article>
            )}
          </Panel>
        </div>
      </div>
    </section>
  )
}
