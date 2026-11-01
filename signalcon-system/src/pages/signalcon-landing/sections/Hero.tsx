/**
 * S1 Hero: what, when, where and how much, and the signature: the key art tunes in from static on CH 27.
 * The headline, sub, button and price are in the first render and never move; only the screen and its stickers do.
 */
import { type CSSProperties, type JSX, type Ref, useEffect, useRef, useState } from 'react'
import { flip, tuneIn } from '@/system/vfx'
import { prefersReducedMotion } from '@/system/motion'
import { ButtonLink, Screen, SignalLost, StockGauge, Tape } from '@/system/ui'
import { DAYS, EVENT, SCHEDULE } from '../data'
import { afterBoot, bootPlayed, bootThisLoad } from './boot-state'
import { focusHeading } from './Header'

const TUNED_KEY = 'signalcon:tuned'

function alreadyTuned(): boolean {
  try {
    return sessionStorage.getItem(TUNED_KEY) === '1'
  } catch {
    return false
  }
}

export function Hero({ threeDayLeft, threeDayTotal, ctaRef }: { threeDayLeft: number; threeDayTotal: number; ctaRef: Ref<HTMLAnchorElement> }): JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const [tuned, setTuned] = useState(() => alreadyTuned() || prefersReducedMotion())
  // after the boot, which searched the channels, the screen is already on CH 27
  const [channel, setChannel] = useState(() => (alreadyTuned() || prefersReducedMotion() || bootThisLoad() ? 27 : 0))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // under reduced motion the state starts tuned, so this never runs
    if (tuned || !canvas.current) return
    const el = canvas.current
    let tick = 0
    let cancel = (): void => {}
    // on a first visit the boot plays over the page first; the tune-in starts as it wipes off
    const stop = afterBoot(() => {
      // the channel number ticks up while the static holds, then the art locks on with a flip; after the boot, which
      // already searched the channels, the screen sits on CH 27
      const start = performance.now()
      if (bootPlayed()) setChannel(27)
      else
        tick = window.setInterval(() => {
          const p = Math.min(1, (performance.now() - start) / 700)
          setChannel(Math.round(p * 27))
          if (p >= 1) window.clearInterval(tick)
        }, 40)
      cancel = tuneIn(el, {
        onDone: () => {
          setTuned(true)
          void flip(screen.current)
          try {
            sessionStorage.setItem(TUNED_KEY, '1')
          } catch {
            /* plays again next visit */
          }
        },
      })
    })
    return () => {
      stop()
      cancel()
      window.clearInterval(tick)
    }
  }, [tuned])

  const ch = `CH ${String(channel).padStart(2, '0')}` // taste-skill-ignore: a TV channel readout, not list numbering
  return (
    <section className="pg-hero" id="top" aria-labelledby="hero-title">
      <div className="pg-wrap pg-hero-grid">
        <div className="pg-hero-screen">
          <Screen
            ref={screen}
            ratio="var(--hero-ratio)"
            channel={ch}
            busy={!tuned}
            caption={
              <span aria-live="off">
                {tuned ? `${ch} · Tuned in` : `${ch} · Tuning…`}
                {tuned && <span className="pg-caption-more">{` · ${EVENT.datesMono} · ${EVENT.venue}`}</span>}
              </span>
            }
          >
            {failed ? (
              <div className="pg-hero-fail">
                <SignalLost>The poster didn't load. Everything else works.</SignalLost>
              </div>
            ) : (
              <img
                className="pg-hero-art"
                src="/signalcon-landing/art/keyart-960.webp"
                srcSet="/signalcon-landing/art/keyart-640.webp 640w, /signalcon-landing/art/keyart-960.webp 960w, /signalcon-landing/art/keyart-1536.webp 1536w"
                sizes="(min-width: 1024px) 52vw, 100vw"
                width={1536}
                height={1024}
                alt="Expo key art: three fans in streetwear on a rainy night street in Canal Ward, a stack of old TVs showing static beside them."
                fetchPriority="high"
                decoding="async"
                onError={() => setFailed(true)}
              />
            )}
            {!tuned && <canvas ref={canvas} className="pg-hero-static" aria-hidden />}
          </Screen>
          {/* the tape sits on the art; when the art fails it would cover the error text, so it goes with the art */}
          {!failed && (
            <Tape tone="signal" tilt={-6} slam className="pg-hero-onair" style={{ '--slam-delay': '1300ms' } as CSSProperties}>
              On air
            </Tape>
          )}
          <span className="pg-bubble" data-slam="" style={{ '--slam-rot': '-4deg', '--slam-delay': '1450ms' } as CSSProperties}>
            On air 23 July
          </span>
        </div>

        <div className="pg-hero-copy">
          <h1 id="hero-title" className="pg-h1">
            <span className="pg-h1-line">Three days of</span> <span className="pg-h1-line sc-outline">anime + games</span>
          </h1>
          <p className="pg-hero-tapes">
            <Tape tone="paper" tilt={-2} mono>
              {EVENT.datesShort} · {EVENT.district}
            </Tape>
          </p>
          <p className="pg-hero-sub">An expo of two night concerts, 24 panels, 120 artist tables and 40 game demos at the Relay Hall.</p>
          <div className="pg-hero-cta">
            <ButtonLink ref={ctaRef} id="hero-cta" href="#tickets" variant="primary" size="lg" onClick={() => focusHeading('tickets')}>
              Pick your pass · from €39
            </ButtonLink>
            <p className="pg-hero-note">1-day, 3-day or VIP. Prices include tax.</p>
          </div>
          <div className="pg-hero-meta">
            <span className="pg-hero-stock">
              <span className="sc-mono">3-Day stock ·</span> <StockGauge left={threeDayLeft} total={threeDayTotal} />
              <span className="pg-sample">sample</span>
            </span>
            <a href="#tickets" className="pg-hero-secondary" onClick={() => focusHeading('tickets')}>
              Is 3 days worth it? Compare passes
            </a>
          </div>
          {/* desktop: the column's foot carries the weekend's three main events as a mini TV guide */}
          <div className="pg-hero-guide">
            <Tape tone="night" tilt={-2} className="pg-hero-guide-tape">
              Main events
            </Tape>
            <ul aria-label="Main events this weekend">
              {SCHEDULE.filter((slot) => slot.main).map((slot) => (
                <li key={slot.title}>
                  <span className="sc-mono">
                    {DAYS.find((d) => d.id === slot.day)?.short} {slot.time}
                  </span>
                  <span>{slot.title}</span>
                </li>
              ))}
            </ul>
            <a href="#schedule" className="pg-hero-secondary" onClick={() => focusHeading('schedule')}>
              See the full guide
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
