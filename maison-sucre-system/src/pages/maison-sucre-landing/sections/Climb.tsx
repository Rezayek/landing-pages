/**
 * S1 + S2, the climb (UX.md; CONCEPT.md "The climb"; MOTION.md): the rendered film is pinned behind the first five
 * screens while the hero and the four chapter cards scroll over it. The scroll is the camera: it rises from the board
 * to the topper. The rail under the film says where you are and jumps to each chapter. Without JS the poster and the
 * cards read as a plain story.
 */
import { type JSX, useEffect, useRef, useState } from 'react'
import { FilmPlayer, type FilmSpec } from '@/system/film'
import { BeadBorder, ChapterRail } from '@/system/ui'
import { play } from '@/system/vfx'
import film from '../film.json'
import './climb.css'

const CHAPTERS = [
  {
    id: 'chapter-board',
    rail: 'The board',
    title: 'It starts with what you taste.',
    body: 'The base tier carries the most portions. Inside: three layers of sponge, two of filling, a thin coat of ganache to hold the shape. You choose the flavour of every tier.',
    small: 'Vanilla bean sponge · raspberry jam · Swiss meringue buttercream (sample)',
  },
  {
    id: 'chapter-piping',
    rail: 'Piping',
    title: 'Piped by hand, bead by bead.',
    body: 'Lines and beads in royal icing, laid with a fine nozzle around each tier. Lace patterns can follow the lace of your dress.',
  },
  {
    id: 'chapter-flowers',
    rail: 'Sugar flowers',
    title: 'Flowers made of sugar, petal by petal.',
    body: 'Each flower is shaped on wire, dusted with colour and set in a cascade down the cake. We can match them to your bouquet.',
  },
  {
    id: 'chapter-topper',
    rail: 'The topper',
    title: 'Finished in gold, at the top.',
    body: 'A crown of sugar flowers and pressed gold leaf on the top tier, the one to keep for your first anniversary.',
    finale: true,
  },
] as const

const STEPS = CHAPTERS.map((c) => ({ href: `#${c.id}`, label: c.rail }))

export function Climb(): JSX.Element {
  const story = useRef<HTMLElement>(null)
  const [chapter, setChapter] = useState(0)
  const topper = useRef<HTMLSpanElement>(null)
  // the finale's gilded numeral is pressed on once when its card arrives ('gild', FOUNDATIONS §10: gold leaf fleck)
  useEffect(() => {
    const el = topper.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void play(el, 'gild')
          io.disconnect()
        }
      },
      { threshold: 1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <section ref={story} id="top" className="climb" aria-labelledby="hero-title" data-story="climb">
      {/* the rail rides above the content (the stage sits behind it): a zero-height pinned bar at the screen's foot; first in the section so it pins from the first screen */}
      <div className="climb__railbar">
        <div className="climb__rail">
          <ChapterRail steps={STEPS} current={Math.max(0, chapter - 1)} label="The cake, tier by tier" />
        </div>
      </div>
      <div className="climb__stage" data-moment="film">
        {/* the desktop poster is the arrival's first frame: the wide view of the room the camera glides in from */}
        <FilmPlayer
          film={film as unknown as FilmSpec}
          trigger={story}
          onChapter={setChapter}
          poster={{ desktop: '/maison-sucre-landing/film/desktop-intro/000.webp', phone: '/maison-sucre-landing/film/phone/000.webp' }}
        />
        <div className="climb__shade" aria-hidden="true" />
        <p className="climb__credit">Rendered study</p>
      </div>


      <div className="climb__hero" data-journey="hero">
        <h1 id="hero-title" className="ms-display climb__h1">
          The cake you&apos;ll cut together, tier by tier.
        </h1>
        {/* the H1's device is the contract's shell piping, piped once as the line lands */}
        <BeadBorder variant="shell" className="climb__piping" />
        <p className="climb__sub">Wedding cakes made to order for your day: tasted first, designed with you, delivered and set up at your venue.</p>
        <div className="climb__actions">
          <a className="ms-btn" data-variant="primary" href="#tastings">
            Book a tasting
          </a>
          <a className="ms-link" data-standalone href="#design">
            See the sample price of a cake like this
          </a>
        </div>
        <p className="climb__note">Choose a date and a time. Design study: nothing is sent.</p>
        <p className="climb__hint" aria-hidden={chapter > 0 || undefined}>
          Scroll to climb the cake <span aria-hidden="true">↓</span>
        </p>
      </div>

      {CHAPTERS.map((c, i) => (
        <article key={c.id} id={c.id} className="climb__chapter" data-journey={c.id} aria-labelledby={`${c.id}-title`}>
          <div className="climb__card">
            {/* the gilded numeral ties the card to its rail step: beside the title, never a kicker line above it */}
            <div className="climb__head">
              <span ref={'finale' in c ? topper : undefined} className="ms-numeral climb__num" aria-hidden="true">
                {i + 1}
              </span>
              <h2 id={`${c.id}-title`} className="ms-display climb__title">
                {c.title}
              </h2>
            </div>
            <BeadBorder variant="shell" className="climb__piping" />
            <p className="climb__body">{c.body}</p>
            {'small' in c ? <p className="climb__small">{c.small}</p> : null}
            {'finale' in c ? (
              <div className="climb__actions">
                <a className="ms-btn" data-variant="primary" href="#tastings">
                  Book a tasting
                </a>
                <a className="ms-link" data-standalone href="#design">
                  Or design yours first
                </a>
              </div>
            ) : null}
            {'finale' in c ? <p className="climb__note">Taste up to six flavours before you choose.</p> : null}
          </div>
        </article>
      ))}
    </section>
  )
}
