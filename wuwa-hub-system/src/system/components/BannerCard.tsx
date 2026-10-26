import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { announce } from '../feedback'
import { play } from '../vfx'
import { Icon, Sigil, type Element } from './icons'
import { ChevronTag } from './Data'
import { byId, portraitOf } from './sample'
import { StatusTag } from './StatusTag'

const pad = (n: number): string => String(n).padStart(2, '0')
/** Any time far enough ahead that the skeleton's countdown has the loaded width and no "Ends soon". */
const SKELETON_ENDS_AT = Date.now() + 9 * 86_400_000

function format(ms: number, seconds: boolean): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${pad(d)}d ${pad(h)}:${pad(m)}${seconds ? `:${pad(s)}` : ''}`
}

/** The playground's "server time" is UTC+8, a sample setting shown with every absolute time. */
function absolute(at: number): string {
  const d = new Date(at + 8 * 3600_000)
  const month = d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })
  return `${d.getUTCDate()} ${month}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC+8`
}

/**
 * Countdown: time until a banner, event or maintenance changes state, with the absolute time beside it. Updates once
 * a second (minutes only when Live seconds is off: WCAG 2.2.2), pauses in a hidden tab and resyncs on return. Not
 * live-announced; the owner announces the last hour and the end.
 */
export function Countdown({
  endsAt,
  tone = 'band',
  liveSeconds,
  onLiveSecondsChange,
  onEnd,
  onLastHour,
  unknown = false,
}: {
  endsAt: number
  tone?: 'band' | 'plain'
  liveSeconds: boolean
  onLiveSecondsChange?: (next: boolean) => void
  onEnd?: () => void
  onLastHour?: () => void
  unknown?: boolean
}): JSX.Element {
  const [now, setNow] = useState(() => Date.now())
  const ended = useRef(false)
  const warned = useRef(false)
  useEffect(() => {
    if (unknown) return
    const tick = (): void => setNow(Date.now())
    const timer = window.setInterval(tick, liveSeconds ? 1000 : 30_000)
    const onVisible = (): void => {
      if (!document.hidden) tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [liveSeconds, unknown])
  const left = endsAt - now
  useEffect(() => {
    if (left <= 0 && !ended.current) {
      ended.current = true
      onEnd?.()
    } else if (left > 0 && left <= 3600_000 && !warned.current) {
      warned.current = true
      onLastHour?.()
    }
  }, [left, onEnd, onLastHour])

  return (
    <div className="ea-count-down" data-tone={tone}>
      <span className="ea-count-down__value" role="timer" aria-live="off" aria-label={unknown ? 'End date not announced' : left <= 0 ? 'Ended' : `Ends ${absolute(endsAt)}`}>
        {unknown ? 'End date not announced' : left <= 0 ? 'Ended' : format(left, liveSeconds)}
      </span>
      <span className="ea-count-down__controls">
        {!unknown && left > 0 ? <span className="ea-count-down__caption">until {absolute(endsAt)}</span> : null}
        {onLiveSecondsChange && !unknown && left > 0 ? (
          <button type="button" className="ea-livesec" aria-pressed={liveSeconds} onClick={() => onLiveSecondsChange(!liveSeconds)}>
            <Icon name={liveSeconds ? 'pause' : 'play'} />
            {liveSeconds ? 'Live seconds' : 'Live seconds off'}
          </button>
        ) : null}
      </span>
    </div>
  )
}

export interface BannerCardProps {
  kind: string
  title: string
  endsAt: number
  action?: ReactNode
  size?: 'featured' | 'compact'
  rerun?: boolean
  /** The image behind the band (non-literal art); a still resonance field without it. */
  art?: string
  /** The field drifts once and a light pass crosses the band (a banner arriving). */
  arriving?: boolean
  liveSeconds: boolean
  onLiveSecondsChange?: (next: boolean) => void
  onEnd?: () => void
  ended?: boolean
  /** The featured Resonator: their portrait fills the slot on the right; without one, their element sigil holds it. */
  resonatorId?: string
  element?: Element
  /** The skeleton's stand-in: the title is not a heading, so the page outline never lists a placeholder. */
  placeholder?: boolean
}

/**
 * Banner card: the current Convene banner or event on the fixed night band, in both themes. Title and countdown are
 * readable at first paint; a new banner arrives with the field drifting once (ea-field, 4.8 s, then still) and one
 * `sweep` light pass. Under 24 h it shows "Ends soon"; at zero it says "Ended" in place and the owner swaps the next
 * banner into the same slot.
 */
export function BannerCard({
  kind,
  title,
  endsAt,
  action,
  size = 'featured',
  rerun,
  art,
  arriving = false,
  liveSeconds,
  onLiveSecondsChange,
  onEnd,
  ended = false,
  resonatorId,
  element,
  placeholder = false,
}: BannerCardProps): JSX.Element {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (arriving) void play(ref.current, 'sweep', { duration: 400 })
  }, [arriving])
  const soon = !ended && endsAt - Date.now() < 24 * 3600_000
  return (
    <article
      ref={ref}
      className="ea-bcard ea-frame"
      data-size={size}
      style={art ? ({ '--_art': `url(${art})` } as React.CSSProperties) : undefined}
      aria-label={`${kind}: ${title}`}
    >
      {art ? <span className="ea-bcard__art" aria-hidden="true" /> : null}
      <span className="ea-field" data-field={arriving ? 'drift' : undefined} aria-hidden="true" />
      {resonatorId ? (
        <span className="ea-bcard__portrait" aria-hidden="true">
          {resonatorId && portraitOf(resonatorId) ? (
            <img src={portraitOf(resonatorId)!} alt="" width={366} height={731} decoding="async" />
          ) : (element ?? byId(resonatorId).element) ? (
            <Sigil element={element ?? byId(resonatorId).element} size="xl" />
          ) : null}
        </span>
      ) : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
        <ChevronTag>{kind}</ChevronTag>
        {rerun ? <StatusTag kind="rerun">Rerun</StatusTag> : null}
        {soon ? <StatusTag kind="ends-soon">Ends soon</StatusTag> : null}
      </div>
      {placeholder ? <p className="ea-bcard__title">{title}</p> : <h3 className="ea-bcard__title">{title}</h3>}
      <div className="ea-bcard__row">
        <Countdown
          endsAt={endsAt}
          liveSeconds={liveSeconds}
          onLiveSecondsChange={onLiveSecondsChange}
          onEnd={onEnd}
          onLastHour={() => announce(`${title}'s banner ends in 1 hour.`)}
        />
        {action ? <span className="ea-bcard__action">{action}</span> : null}
      </div>
    </article>
  )
}

/**
 * The banner card's skeleton (ea-skel): the real card with its text made transparent over tuning bars, so it is the
 * loaded size, a gold notched outline that draws on and settles, and the contract's waveform line laid flat along its
 * foot, tuning while it waits (the loaded card replaces it). The placeholder title is one short word, so the featured
 * size keeps one line, as the loaded titles do. Hidden from assistive technology and inert; the Region around it
 * carries aria-busy and speaks.
 */
export function BannerCardSkeleton({ size = 'compact' }: { size?: 'featured' | 'compact' }): JSX.Element {
  return (
    <div className="ea-skel ea-skel--band" aria-hidden="true" inert>
      <BannerCard kind="Character banner" title="Resonator" endsAt={SKELETON_ENDS_AT} liveSeconds={false} size={size} placeholder />
      <span className="ea-skel__line ea-frame" />
      {/* the wave's path slides inside a fixed box, so nothing grows past the card */}
      <svg className="ea-skel__wave" viewBox="0 0 24 12" preserveAspectRatio="none">
        <path d="M0 6 C3 0 9 0 12 6 S21 12 24 6 S33 0 36 6 S45 12 48 6" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}
