/**
 * S4 Specs (UX.md, Q5 "Does it work with my setup?"): four big numerals in the readout face that type on once when
 * scrolled into view (MOTION.md "S4 specs: numerals"; system type-on), then the dense spec wall as a definition list.
 * Under reduced motion the numerals are shown at once. Every number is invented for the study, and the page says so.
 */
import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { reducedMotion, typeOn } from '@/system/vfx'
import './specs.css'

const NUMERALS = ['8 voices', '49 keys', '32 steps', '40 Hz–12 kHz'] as const

const WALL: readonly { term: string; value: string }[] = [
  { term: 'Voices', value: '8, two oscillators each plus sub and noise, glide' },
  { term: 'Oscillators', value: 'sine, triangle, saw, square, osc 2 detune to 50 cents' },
  { term: 'Filter', value: '12 dB/oct low-pass, resonance to self-oscillation' },
  { term: 'Envelope', value: 'attack 1 ms–5 s, decay 1 ms–5 s, sustain 0–100 %, release 1 ms–8 s' },
  { term: 'LFO', value: '0.05–12 Hz, to cutoff' },
  { term: 'Effects', value: 'drive, delay, reverb' },
  { term: 'Loop', value: '32 steps, 4 patterns plus generated, 70–160 bpm' },
  { term: 'Keys', value: '49 (4 octaves), velocity' },
  { term: 'Outputs', value: 'line out 3.5 mm, headphones 3.5 mm' },
  { term: 'MIDI', value: 'in, 3.5 mm TRS, and over USB' },
  { term: 'USB-C', value: 'power (5 V), MIDI and audio to your DAW (class-compliant)' },
  { term: 'Size', value: '700 × 160 × 48 mm' },
  { term: 'Weight', value: '2.4 kg' },
  { term: 'Finishes', value: 'Graphite, Bone' },
]

/** The stagger between numerals, read from the token (ms). */
function staggerMs(el: HTMLElement): number {
  const v = getComputedStyle(el).getPropertyValue('--stagger-scene').trim()
  return v.endsWith('ms') ? Number.parseFloat(v) : v.endsWith('s') ? Number.parseFloat(v) * 1000 : 0
}

export function Specs(): JSX.Element {
  const grid = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const host = grid.current
    if (!host || reducedMotion() || typeof IntersectionObserver === 'undefined') return
    const cells = Array.from(host.querySelectorAll<HTMLElement>('[data-numeral]'))
    // armed: hidden until its turn, so a later numeral never shows whole and then restarts
    cells.forEach((c) => c.setAttribute('data-armed', ''))
    const timers: number[] = []
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        const step = staggerMs(host)
        cells.forEach((c, i) => {
          timers.push(
            window.setTimeout(() => {
              c.removeAttribute('data-armed')
              void typeOn(c, c.dataset.numeral ?? '')
            }, i * step),
          )
        })
      },
      { threshold: 0.4 },
    )
    io.observe(host)
    return () => {
      io.disconnect()
      timers.forEach((t) => window.clearTimeout(t))
      cells.forEach((c) => c.removeAttribute('data-armed'))
    }
  }, [])

  return (
    <section id="specs" aria-labelledby="specs-title" data-section="specs" className="specs">
      <div className="specs__inner">
        <h2 id="specs-title" className="specs__title">
          Plugs into what you already have.
        </h2>
        <p className="specs__lead">Works with your DAW over USB-C: audio and MIDI in one cable, no drivers.</p>

        <ul ref={grid} className="specs__numerals">
          {NUMERALS.map((n) => (
            <li key={n} className="specs__cell">
              <span className="specs__numeral" data-numeral={n}>
                {n}
              </span>
            </li>
          ))}
        </ul>

        <dl className="specs__wall" data-density="compact">
          {WALL.map((it) => (
            <div key={it.term} className="specs__row">
              <dt className="pi-legend">{it.term}</dt>
              <dd>{it.value}</dd>
            </div>
          ))}
        </dl>

        <p className="specs__note">All specs invented for this design study.</p>
      </div>
    </section>
  )
}
