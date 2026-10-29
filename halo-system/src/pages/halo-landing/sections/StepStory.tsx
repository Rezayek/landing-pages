/**
 * A pinned step story (UX.md "Needs from the system"; kept local to this page until a second page needs it, waiver
 * in SYSTEM.md). The section is one step tall per step plus one screen; its copy pins while the scroll walks the
 * steps. Two scrubbed values go out: `onEnter` (0-1 while the section scrolls into view) and `onProgress` (0 … n
 * through the pinned range). The counter and the step's copy change by a cut, the step is announced once, and
 * without JavaScript every step reads in order as its own heading.
 */
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { announce } from '@/system/feedback'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export interface Step {
  title: string
  body: ReactNode
}

export interface StepStoryProps {
  id: string
  story: string
  title: string
  sub: string
  steps: readonly Step[]
  note: string
  reduced: boolean
  onEnter: (value: number) => void
  onProgress: (value: number) => void
  /** True while this section's stage is the one on screen: from the pin to the next section's pin. */
  onStage?: (active: boolean) => void
  onStep?: (index: number) => void
  /** Poster capture: the story is set by the page, so no trigger writes to it. */
  frozen?: boolean
}

/** ScrollTrigger's catch-up while scrubbing, in seconds (MOTION.md Token extensions, `scrub`). */
const SCRUB = 0.8
/** How long a step must hold before it is announced (ms). */
const STEP_HOLD_MS = 500

export function StepStory({ id, story, title, sub, steps, note, reduced, onEnter, onProgress, onStage, onStep, frozen }: StepStoryProps): JSX.Element {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const last = useRef(0)
  const inside = useRef(false)
  const said = useRef(0)
  useEffect(() => () => window.clearTimeout(said.current), [])
  const headingId = `${id}-title`

  useGSAP(
    () => {
      const el = root.current
      if (!el || frozen) return
      const scrub = reduced ? true : SCRUB
      const enter = { v: 0 }
      const walk = { v: 0 }
      gsap.to(enter, {
        v: 1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top top', scrub },
        onUpdate: () => onEnter(enter.v),
      })
      gsap.to(walk, {
        v: steps.length,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub,
          onToggle: (self) => {
            inside.current = self.isActive
          },
        },
        onUpdate: () => {
          onProgress(walk.v)
          const k = Math.min(steps.length - 1, Math.floor(walk.v))
          if (k !== last.current) {
            last.current = k
            setActive(k)
            onStep?.(k)
            // a step is announced once it holds, so a jump past the story (a nav link, a fast fling) says nothing
            window.clearTimeout(said.current)
            said.current = window.setTimeout(() => {
              // still this step, and the pinned story still fills the screen (the scrub can land a step after the
              // visitor has already moved on to the next section)
              const r = el.getBoundingClientRect()
              const pinned = r.top <= 1 && r.bottom >= window.innerHeight - 1
              if (inside.current && pinned && last.current === k) announce(`Step ${k + 1} of ${steps.length}: ${steps[k].title}`)
            }, STEP_HOLD_MS)
          }
        },
      })
      if (onStage) ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom top', onToggle: (self) => onStage(self.isActive) })
    },
    { scope: root, dependencies: [reduced, steps.length, frozen] },
  )

  return (
    <section ref={root} id={id} className="story-section" aria-labelledby={headingId} data-story={story} style={{ ['--steps' as string]: steps.length }}>
      <div className="story-section__pin">
        <div className="story-section__copy">
          <h2 id={headingId} className="story-section__title">
            {title}
          </h2>
          <p className="story-section__sub">{sub}</p>
          <ol className="story-section__steps">
            {steps.map((s, i) => (
              <li key={s.title} className="story-step" data-active={i === active || undefined}>
                <p className="story-step__count" aria-hidden="true">
                  <span className="story-step__index">{i + 1}</span> / {steps.length}
                </p>
                <h3 className="story-step__title">{s.title}</h3>
                <p className="story-step__body">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="story-section__note">{note}</p>
        </div>
      </div>
    </section>
  )
}
