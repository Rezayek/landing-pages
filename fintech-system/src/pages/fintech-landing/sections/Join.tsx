/**
 * S7 Join (UX.md, A14-A16): the action once more. The waiting ledger line is the visitor's own; it is written only
 * when the sign-up really went through (connected or the labelled simulation), never while nothing was sent.
 */
import { type JSX, useState } from 'react'
import { Scissors } from 'lucide-react'
import { announce } from '@/system/feedback'
import { Ledger } from '@/system/ui'
import { WaitlistForm } from '../WaitlistForm'
import { useVisitor } from '../visitor'

export function Join(): JSX.Element {
  const [joined, setJoined] = useState(false)
  const { approved } = useVisitor()
  const [copied, setCopied] = useState<'idle' | 'copied' | 'blocked'>('idle')
  return (
    <section id="join" className="fl-slip" aria-labelledby="join-title">
      <span className="fl-slip__tear" aria-hidden="true">
        <Scissors className="k-icon" data-size="sm" />
      </span>
      <h2 id="join-title" className="fl-h2">
        Put your household on the waitlist
      </h2>
      <p className="fl-body">One email address is enough. When Kitty opens you’ll set up your household and invite the family.</p>
      <Ledger
        compact
        title="Next on the list"
        headingLevel={3}
        lines={[
          ...(approved ? [{ id: 'yours', day: 'Wed', what: 'You approved Ivy’s school trip', stamp: 'Yours' }] : []),
          joined
            ? { id: 'you', day: 'Today', what: 'Your household', note: 'Joined the waitlist', tick: 1, fresh: true }
            : { id: 'you', day: 'Today', what: 'Your household', waiting: true },
        ]}
      />
      <div className="fl-join-box">
        <WaitlistForm onJoined={() => setJoined(true)} />
        <p className="fl-note">Kitty isn’t open yet. We’ll email you when your household can start.</p>
        {joined ? (
          <div className="fl-share">
            <button
              type="button"
              className="k-btn"
              data-variant="secondary"
              onClick={async () => {
                const url = window.location.origin + window.location.pathname
                try {
                  // Phones get their share sheet; a desktop copies the link (UX.md A15)
                  if (navigator.share && window.matchMedia('(pointer: coarse)').matches) await navigator.share({ title: 'Kitty', url })
                  else await navigator.clipboard.writeText(url)
                  setCopied('copied')
                  announce('Link copied.')
                  window.setTimeout(() => setCopied('idle'), 1500)
                } catch {
                  setCopied('blocked')
                }
              }}
            >
              {copied === 'copied' ? 'Link copied' : 'Share Kitty with another family'}
            </button>
            {copied === 'blocked' ? (
              <label className="fl-share__fallback">
                Copy it from here.
                <input readOnly value={window.location.origin + window.location.pathname} onFocus={(e) => e.currentTarget.select()} />
              </label>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
