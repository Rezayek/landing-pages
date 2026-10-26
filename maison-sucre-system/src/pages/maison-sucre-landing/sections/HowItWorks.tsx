/**
 * S5 How it works (UX.md §S5, Q5): the order in four steps, with timing. Gilded numerals, one tall rendered still per
 * step, on alternating sides (steal list 9, Caffe Gilli: one tall picture per "room"). Nothing moves here (MOTION.md
 * row S5); the shell-piped rule under the heading pipes in once (BeadBorder, the section transition).
 */
import type { JSX } from 'react'
import { BeadBorder } from '@/system/ui'
import './how-it-works.css'

interface Step {
  n: number
  title: string
  body: string
  /** File stem in /maison-sucre-landing/stills/ (-600.webp and -1200.webp): each step its own render, never a film frame */
  still: string
  /** The 600-wide file's size, for the reserved box */
  size: readonly [number, number]
  alt: string
}

const STEPS: readonly Step[] = [
  {
    n: 1,
    title: 'Taste',
    body: 'Book a tasting. Taste up to six flavours and talk through your day.',
    still: 'how-taste',
    size: [600, 750],
    alt: 'A tasting slice on a porcelain plate with a gold fork, its sponge and raspberry layers showing, beside the foot of a white wedding cake on its stand, with petals and a garland on the linen.',
  },
  {
    n: 2,
    title: 'Design',
    body: 'We draw your cake to your guest count and send a quote within two working days (sample).',
    still: 'how-design',
    size: [600, 750],
    alt: 'The whole four-tier cake on its round table in the wedding room, seen from a little above: quilted and piped tiers, a cascade of sugar roses, gold leaf on top, two flutes and a candelabra beside it.',
  },
  {
    n: 3,
    title: 'Confirm',
    body: 'A deposit holds your date (sample terms). Changes are welcome until four weeks before.',
    still: 'how-confirm',
    size: [600, 750],
    alt: 'The top tier close up, finished in torn gold leaf, crowned with blush and ivory sugar roses, a row of pearl beads at its foot.',
  },
  {
    n: 4,
    title: 'Deliver',
    body: 'We drive it to your venue, set it up and leave it ready for the cutting.',
    still: 'delivery',
    size: [600, 700],
    alt: 'The cake set up on its table in the wedding room, a garland on the cloth, a cake knife, a tasting slice and candles, guest tables and gold chairs behind.',
  },
]

const BASE = '/maison-sucre-landing/stills'

export function HowItWorks(): JSX.Element {
  return (
    <section id="how" className="hiw" aria-labelledby="how-title">
      <div className="hiw__inner">
        <header className="hiw__head">
          <h2 id="how-title" className="hiw__title">
            How it works
          </h2>
          <BeadBorder variant="shell" className="hiw__rule" />
          <p className="hiw__sub">Plan to book 6 to 12 months ahead (sample guide).</p>
        </header>
        <ol className="hiw__steps" role="list">
          {STEPS.map((step) => (
            <li key={step.n} className="hiw__step" data-side={step.n % 2 === 1 ? 'left' : 'right'}>
              <div className="hiw__text">
                <span className="ms-numeral hiw__numeral" aria-hidden="true">
                  {step.n}
                </span>
                <h3 className="hiw__step-title">
                  <span className="ms-sr">Step {step.n}: </span>
                  {step.title}
                </h3>
                <p className="hiw__body">{step.body}</p>
              </div>
              <figure className="hiw__still">
                <img
                  src={`${BASE}/${step.still}-600.webp`}
                  srcSet={`${BASE}/${step.still}-600.webp 600w, ${BASE}/${step.still}-1200.webp 1200w`}
                  sizes="(min-width: 64rem) 40vw, (min-width: 48rem) 50vw, 100vw"
                  width={step.size[0]}
                  height={step.size[1]}
                  loading="lazy"
                  decoding="async"
                  alt={step.alt}
                />
                <figcaption className="hiw__tag">Rendered study</figcaption>
              </figure>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
