import { useEffect, useRef, useState, type JSX } from 'react'
import { HeartIcon } from '../feedback/icons'
import { InlineMessage, announce } from '../feedback'
import { cssVars } from '../feedback/internal'
import { IconButton } from '../ui'
import { play } from '../vfx'
import type { Flavour } from './data'

export interface FlavourCardProps {
  flavour: Flavour
  kept: boolean
  /** The box is full and this flavour is not in it. */
  boxFull: boolean
  /** Keep or release on the server; rejects on failure. The card is optimistic: it flips first. */
  onToggle: (flavour: Flavour, keep: boolean) => Promise<void>
  /** 4 where the card sits under another h3 (the /system component demos). */
  headingLevel?: 3 | 4
}

/**
 * A sponge and filling pairing with a keep-for-tasting heart (COMPONENTS.md §Flavour card). Optimistic: the heart
 * fills at once with its petal dust ('dust', MOTION-SYSTEM.md: optimistic update) and "Keeping…" shows until the
 * server answers; a failure empties it and says so on the card, with Try again. Allergens are words, never colours.
 */
export function FlavourCard({ flavour, kept, boxFull, onToggle, headingLevel = 3 }: FlavourCardProps): JSX.Element {
  const Heading = headingLevel === 4 ? 'h4' : 'h3'
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const [failed, setFailed] = useState(false)
  const heart = useRef<HTMLDivElement>(null)
  const shown = optimistic ?? kept
  // the dust settles and stays while the flavour is kept; released from the box (here or from the box's ×), it goes
  useEffect(() => {
    const button = heart.current?.querySelector<HTMLElement>('.ms-iconbtn')
    if (!shown && button?.dataset.vfxPlay === 'dust') delete button.dataset.vfxPlay
  }, [shown])

  async function toggle(): Promise<void> {
    const next = !shown
    setFailed(false)
    setOptimistic(next)
    if (next) void play(heart.current?.querySelector('.ms-iconbtn') ?? null, 'dust')
    try {
      await onToggle(flavour, next)
      announce(next ? `${flavour.name} kept for tasting` : `${flavour.name} removed from your tasting box`)
    } catch {
      setFailed(true)
    } finally {
      setOptimistic(null)
    }
  }

  return (
    <article className="ms-flavour">
      {/* the cut slice: this flavour's crumb and filling in layers (tokens --slice-<id>-*) */}
      <span className="ms-flavour__swatch" aria-hidden="true" style={cssVars({ '--_sponge': `var(--slice-${flavour.id}-sponge)`, '--_fill': `var(--slice-${flavour.id}-fill)` })} />
      <div>
        <Heading className="ms-flavour__name">{flavour.name}</Heading>
        <p className="ms-flavour__parts">
          {flavour.sponge} · {flavour.filling} · {flavour.finish}
        </p>
        <p className="ms-flavour__diet">Contains: {flavour.contains.join(', ')}</p>
        {shown && !failed ? <p className="ms-flavour__kept">In your tasting box</p> : null}
      </div>
      <div ref={heart}>
        <IconButton
          label={shown ? 'Kept for tasting' : 'Keep for tasting'}
          icon={<HeartIcon filled={shown} />}
          pressed={shown}
          disabled={!shown && boxFull}
          disabledReason="Your box is full"
          word={optimistic !== null ? (optimistic ? 'Keeping…' : 'Removing…') : undefined}
          aria-busy={optimistic !== null || undefined}
          onClick={() => void toggle()}
        />
      </div>
      {failed ? (
        <div className="ms-flavour__msg">
          <InlineMessage
            tone="error"
            announceText="The tasting box did not answer, so this flavour is not kept."
            action={
              <button type="button" className="ms-btn" data-variant="quiet" onClick={() => void toggle()}>
                Try again
              </button>
            }
            onDismiss={() => setFailed(false)}
          >
            The tasting box did not answer, so this flavour is not kept.
          </InlineMessage>
        </div>
      ) : null}
    </article>
  )
}
