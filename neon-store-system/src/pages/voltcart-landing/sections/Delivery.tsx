/**
 * S4 Your code in about 1 min (UX.md §S4, MOTION.md "S4 the dispense run" and "S4 pin").
 * A scripted sample order on the system's CodeReceipt, beside a four-step line with its order clock. One
 * requestAnimationFrame clock (dt capped at 100 ms) drives it, starts when the stage is 40 % in view the first time,
 * freezes while Pause motion is on, and replays from 0:00. At "Code issued" the street gets a `dispense`. Reduced
 * motion shows the finished order at once. Nothing here is a request: it is a design-study sample.
 */
import { useEffect, useRef, useState, type JSX } from 'react'
import { useReducedMotion } from 'motion/react'
import { announce } from '@/system/feedback'
import { CheckIcon } from '@/system/feedback/icons'
import { Button, CodeReceipt, useMotionPaused } from '@/system/components'
import { prefersReducedMotion } from '@/system/motion'
import { DELIVERY_RUN_MS, DELIVERY_STEPS, SAMPLE_CODE, SAMPLE_ORDER } from '../data'
import { sceneBus } from '../state'
import './delivery.css'

type Status = 'waiting' | 'running' | 'done'
type RowState = 'idle' | 'active' | 'done'

/** The run's clock ticks every 100 ms of playback; at 10× that is one second of the order's clock. */
const TICK_MS = 100
const ORDER_SECONDS_PER_TICK = 1
const END_TICK = Math.ceil(DELIVERY_RUN_MS / TICK_MS)
const LAST = DELIVERY_STEPS.length - 1
/** Playback time at which the key is issued (step 3, "Code issued"): the street dispenses. */
const ISSUED_AT = DELIVERY_STEPS[2].at
/** The order's final clock reading (0:58): the last step's time in order seconds. */
const FINAL_SECONDS = Math.round(DELIVERY_STEPS[LAST].at / TICK_MS) * ORDER_SECONDS_PER_TICK

const clockText = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/** The step the run has reached: -1 before it starts, 0..LAST while it plays. */
function stageAt(ms: number): number {
  let stage = -1
  DELIVERY_STEPS.forEach((step, i) => {
    if (ms >= step.at) stage = i
  })
  return stage
}

/** The rail between the dots, 0..1: rows are evenly spaced, time between steps is not, so map piecewise. */
function railAt(ms: number): number {
  if (ms >= DELIVERY_STEPS[LAST].at) return 1
  const i = Math.max(0, stageAt(ms))
  const from = DELIVERY_STEPS[i].at
  const to = DELIVERY_STEPS[i + 1].at
  return (i + Math.max(0, (ms - from) / (to - from))) / LAST
}

export function Delivery(): JSX.Element {
  const paused = useMotionPaused()
  const reduce = useReducedMotion()
  const [status, setStatus] = useState<Status>(() => (prefersReducedMotion() ? 'done' : 'waiting'))
  const [tick, setTick] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLSpanElement>(null)
  const elapsed = useRef(0)
  const issued = useRef(false)

  const setRail = (ms: number): void => railRef.current?.style.setProperty('--p', String(railAt(ms)))

  // Start once, when 40 % of the stage is in view (or 40 % of the screen, for a stage taller than the screen).
  useEffect(() => {
    if (status !== 'waiting' || reduce) return
    const el = stageRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.4 || entry.intersectionRect.height >= 0.4 * window.innerHeight) {
          setStatus('running')
          io.disconnect()
        }
      },
      { threshold: Array.from({ length: 11 }, (_, i) => i / 10) },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [status, reduce])

  // The one clock. Pausing cancels the frame; resuming starts from "now", so a pause never jumps the run ahead.
  useEffect(() => {
    if (status !== 'running' || paused) return
    let raf = 0
    let last = performance.now()
    const frame = (now: number): void => {
      const dt = Math.min(now - last, 100)
      last = now
      const ms = (elapsed.current += dt)
      setRail(ms)
      setTick(Math.min(Math.floor(ms / TICK_MS), END_TICK))
      if (ms >= ISSUED_AT && !issued.current) {
        issued.current = true
        sceneBus.emit({ type: 'dispense' })
      }
      if (ms >= DELIVERY_RUN_MS) {
        setStatus('done')
        announce('Sample order: code ready.')
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [status, paused])

  // The rail rests at its end (done) or its start (waiting).
  useEffect(() => {
    if (status === 'done' || (reduce && status === 'waiting')) setRail(DELIVERY_RUN_MS)
    else if (status === 'waiting') setRail(0)
  }, [status, reduce])

  const replay = (): void => {
    elapsed.current = 0
    issued.current = false
    setRail(0)
    setTick(0)
    setStatus('running')
  }

  // Reduced motion shows the finished order at once; Replay still steps through it (state changes stay, travel goes).
  const shown: Status = reduce && status === 'waiting' ? 'done' : status
  const done = shown === 'done'
  const ms = done ? DELIVERY_RUN_MS : shown === 'running' ? tick * TICK_MS : 0
  const stage = shown === 'waiting' ? -1 : stageAt(ms)
  const seconds = done ? FINAL_SECONDS : Math.min(tick * ORDER_SECONDS_PER_TICK, FINAL_SECONDS)
  const rowState = (i: number): RowState => (done || stage > i ? 'done' : stage === i ? 'active' : 'idle')
  const delivered = done || stage >= LAST

  return (
    <section id="delivery" data-chapter="delivery" aria-labelledby="delivery-title" className="vl-chapter vd-delivery">
      <div className="vl-wrap">
        <header className="vl-panel vd-delivery__head">
          <h2 id="delivery-title" tabIndex={-1} className="vl-h2">
            Your code in about 1 min
          </h2>
          <p className="vl-sub">
            How delivery works in this design: after your payment clears, the code is issued, shown on screen and emailed. Below, a sample order played 10× faster.
          </p>
        </header>

        <div ref={stageRef} className="vd-stage">
          <div className="vd-receipt vl-panel">
            <CodeReceipt
              state={delivered ? 'delivered' : 'issuing'}
              step={Math.min(Math.max(stage, 0), 2)}
              code={SAMPLE_CODE}
              game="Neon Drift"
              platform="PC"
              order={SAMPLE_ORDER}
            />
          </div>

          <div className="vd-steps vl-panel">
            <div className="vd-steps__bar">
              <p className="vd-clock" aria-hidden="true">
                <span className="vd-clock__label">{shown === 'running' && paused ? 'Paused' : 'Order clock'}</span>
                <span className="vd-clock__time">{clockText(seconds)}</span>
              </p>
            </div>

            <div className="vd-list">
              <span ref={railRef} className="vd-rail" aria-hidden="true" />
              <ol className="vd-ol">
              {DELIVERY_STEPS.map((step, i) => {
                const state = rowState(i)
                return (
                  <li key={step.label} className="vd-step" data-state={state}>
                    <span className="vd-step__dot" aria-hidden="true">
                      {state === 'done' ? (
                        <span className="vc-icon">
                          <CheckIcon />
                        </span>
                      ) : null}
                    </span>
                    <span className="vd-step__clock">{step.clock}</span>
                    <span className="vd-step__label">
                      {step.label}
                      <span className="vc-sr">{state === 'done' ? ', done' : state === 'active' ? ', in progress' : ', next'}</span>
                    </span>
                  </li>
                )
              })}
              </ol>
            </div>

            <div className="vd-actions">
              <Button variant="secondary" onClick={replay}>
                Replay sample order
              </Button>
            </div>

            <div className="vd-slow">
              <h3 className="vd-slow__title">If a code is slow</h3>
              <p>
                A code can take up to 5 minutes. You can leave the page; we'll email it too. If it isn't issued by then, you choose a full refund within 3 days, or we try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
