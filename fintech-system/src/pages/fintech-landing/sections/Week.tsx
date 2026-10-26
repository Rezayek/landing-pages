/**
 * A week in the kitty (UX.md, after the story): seven days of the sample household in one row, each line in its
 * person's colour. As the section crosses the screen a "today" marker walks from Monday to Sunday and the days it has
 * passed are inked (MOTION.md "The week walks"). Phones: the days stack; no marker. Reduced motion: every day inked.
 */
import { type JSX, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Amount, PersonDot, personById } from '@/system/ui'
import { WEEK_DAYS } from '../data'
import { useVisitor } from '../visitor'

export function Week(): JSX.Element {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { approved } = useVisitor()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.6'] })
  const left = useTransform(scrollYProgress, [0, 1], ['0%', `${(100 * (WEEK_DAYS.length - 1)) / WEEK_DAYS.length}%`])
  const [today, setToday] = useState(reduce ? WEEK_DAYS.length - 1 : 0)
  // At most seven state changes per pass: the marker itself is a motion value, never React state.
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = Math.min(WEEK_DAYS.length - 1, Math.floor(p * WEEK_DAYS.length))
    if (!reduce && next !== today) setToday(next)
  })

  return (
    <section ref={ref} id="a-week" className="fl-week" data-story="days" aria-labelledby="week-title">
      <div className="fl-week__head">
        <h2 id="week-title" className="fl-h2">
          A week in the kitty
        </h2>
        <p className="fl-body">Seven days in a sample household: who paid, who asked and what arrived, each in their own colour.</p>
      </div>
      <div className="fl-week__frame">
        <motion.span className="fl-week__now" aria-hidden="true" style={reduce ? { left: `${(100 * (WEEK_DAYS.length - 1)) / WEEK_DAYS.length}%` } : { left }} />
        <ol className="fl-week__days">
          {WEEK_DAYS.map((d, i) => (
            <li key={d.day} className="fl-week__day" data-past={i <= today || undefined}>
              <h3 className="fl-week__name">{d.day}</h3>
              {d.items.length ? (
                <ul className="fl-week__items">
                  {d.items.map((item) => {
                    const person = personById(item.who)
                    return (
                      <li key={item.what + item.who} className="fl-week__item" data-colour={person.colour}>
                        <span className="fl-week__who">
                          <PersonDot person={person} />
                          {person.name}
                        </span>
                        <span className="fl-week__what">
                          {item.what}
                          {approved && d.day === 'Wed' && item.who === 'ivy' ? <span className="fl-week__yours"> · approved by you</span> : null}
                        </span>
                        <Amount pence={item.pence} signed />
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="fl-week__quiet">A quiet day</p>
              )}
            </li>
          ))}
        </ol>
      </div>
      <p className="fl-sample">Sample household</p>
    </section>
  )
}
