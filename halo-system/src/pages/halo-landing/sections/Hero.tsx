/**
 * S1 Hero (UX.md): what it is, for whom and what to do, beside the live watch. The headline and the action are in
 * the first HTML; the watch is the poster until the story canvas is ready, then the same frame turning (A1, A3).
 * The stage takes a drag; "Turn left" and "Turn right" step the four views, "Pause turning" stops the sway (A5, A5b).
 */
import { useRef, useState, type JSX, type RefObject } from 'react'
import { Button, IconButton, PauseIcon, PlayIcon, TurnLeftIcon, TurnRightIcon } from '@/system/halo'
import { announce } from '@/system/feedback'
import { story, viewOf } from '../story'

export interface HeroProps {
  onPreorder: () => void
  /** The hero's own primary button, watched by the page to keep the header's action secondary while it shows. */
  ctaRef: RefObject<HTMLButtonElement | null>
  /** The 3D watch is live (the stage takes a drag); otherwise the buttons step through still views. */
  live: boolean
  reduced: boolean
  /** Without WebGL, the turn buttons step the poster through its four views. */
  onView?: (view: number) => void
}

const QUARTER = Math.PI / 2

export function Hero({ onPreorder, ctaRef, live, reduced, onView }: HeroProps): JSX.Element {
  const [paused, setPaused] = useState(false)
  const [view, setView] = useState('Front')
  const drag = useRef<{ x: number; yaw: number } | null>(null)

  function step(dir: 1 | -1): void {
    const next = Math.round(story.yawTarget / QUARTER) * QUARTER + dir * QUARTER
    story.yawTarget = next
    const name = viewOf(-next)
    setView(name)
    onView?.(((Math.round(-next / QUARTER) % 4) + 4) % 4)
    announce(name)
  }

  return (
    <section id="top" className="hero" aria-labelledby="hero-title" data-moment="hero">
      <div className="hero__copy">
        <h1 id="hero-title" className="hero__title">
          Train by
          <br />
          the ring.
        </h1>
        <p className="hero__lead">A titanium training watch that reads pace, heart rate, sleep and swim splits at a glance, for up to 14 days on a charge.</p>
        <div className="hero__action">
          <Button ref={ctaRef} variant="primary" size="large" onClick={onPreorder}>
            Pre-order HALO
          </Button>
          <span className="hero__note">From €549 · delivery from 10 Nov</span>
        </div>
        <p className="hero__specline">Up to 14 days · Dual-band GPS · 100 m</p>
        <a className="hero__link" href="#battery">
          Up to 40 hours with dual-band GPS
        </a>
        <p className="hero__caption">The halo fills with today's training: 62% of your goal.</p>
        <dl className="hero__specs">
          <div>
            <dt>Battery</dt>
            <dd>
              Up to 14<span> days</span>
            </dd>
          </div>
          <div>
            <dt>GPS</dt>
            <dd>
              Dual<span>-band</span>
            </dd>
          </div>
          <div>
            <dt>Water</dt>
            <dd>
              100<span> m</span>
            </dd>
          </div>
        </dl>
      </div>
      {/* the drag surface over the watch: the canvas itself never takes pointer events, so the copy stays clickable */}
      <div
        className="hero__stage"
        role="img"
        aria-label={`HALO, ${view} view`}
        data-live={live || undefined}
        onPointerDown={(e) => {
          if (!live) return
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, yaw: story.yawTarget }
          story.dragging = true
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          story.yawTarget = drag.current.yaw + (e.clientX - drag.current.x) * 0.012
        }}
        onPointerUp={() => {
          if (!drag.current) return
          drag.current = null
          story.dragging = false
          const name = viewOf(-story.yawTarget)
          setView(name)
          announce(name)
        }}
        onPointerCancel={() => {
          drag.current = null
          story.dragging = false
        }}
      />
      {/* a slim column on the free right edge: the band runs off the top and bottom of the frame */}
      <div className="hero__controls">
        <div className="hero__turn">
          <IconButton label="Turn left" icon={<TurnLeftIcon />} onClick={() => step(-1)} />
          <IconButton label="Turn right" icon={<TurnRightIcon />} onClick={() => step(1)} />
          {live && !reduced ? (
            <IconButton
              label={paused ? 'Turn again' : 'Pause turning'}
              icon={paused ? <PlayIcon /> : <PauseIcon />}
              aria-pressed={paused}
              onClick={() => {
                const next = !paused
                setPaused(next)
                story.paused = next
                announce(next ? 'Turning paused' : 'Turning again')
              }}
            />
          ) : null}
        </div>
        <span className="hero__hint" aria-hidden="true">
          {live ? 'Drag or turn' : 'Turn it'}
        </span>
      </div>
    </section>
  )
}
