/**
 * S3 Patches (UX.md, Q4 "Will it sound good?"): the black card. Six factory patches the visitor loads and plays here,
 * each with its number, name, type, one line and a mini trace drawn from the patch's wave and cutoff. Loading goes
 * through the page's "your patch" store (parts/yourPatch.ts), so the hero's knobs move too (A14); "Back to your
 * patch" (A15) shows only when there is something to go back to. Nothing animates on entry (MOTION.md).
 */
import { useEffect, useMemo, useRef } from 'react'
import type { JSX } from 'react'
import { announce } from '@/system/feedback'
import {
  FACTORY_PATCHES,
  Keyboard,
  Led,
  Oled,
  SoundSwitch,
  engine,
  fmt,
  type FactoryPatch,
  type Wave,
} from '@/system/instrument'
import { backToYours, loadFactory, startYourPatch, useYourPatch } from '../parts/yourPatch'
import './patches.css'

const SHORT: Record<Wave, string> = { sine: 'SIN', triangle: 'TRI', sawtooth: 'SAW', square: 'SQR' }

const W = 96
const H = 28
const CYCLES = 3

/** One shape of the wave at phase p (0 to 1), -1 to 1. */
function shape(wave: Wave, p: number): number {
  switch (wave) {
    case 'sine':
      return Math.sin(p * Math.PI * 2)
    case 'triangle':
      return 1 - 4 * Math.abs(p - 0.5)
    case 'sawtooth':
      return 2 * p - 1
    default:
      return p < 0.5 ? 1 : -1
  }
}

/**
 * The patch's trace: its wave over a few cycles, rounded by a one-pole low-pass whose reach follows the cutoff
 * (40 Hz to 12 kHz on a log scale), so a low cutoff reads as a soft curve and a high one as the raw wave.
 * Decorative: it shows the sound's character, not a measurement.
 */
function tracePoints(wave: Wave, cutoff: number): string {
  const t = Math.min(1, Math.max(0, Math.log(cutoff / 40) / Math.log(12000 / 40)))
  const a = 0.06 + 0.94 * t ** 1.6
  const raw = Array.from({ length: W }, (_, i) => shape(wave, ((i / W) * CYCLES) % 1))
  let y = raw[0]
  let out: number[] = raw
  for (let pass = 0; pass < 2; pass++) {
    out = raw.map((x) => (y += a * (x - y)))
  }
  const peak = Math.max(...out.map(Math.abs), 0.001)
  return out.map((v, i) => `${i},${(H / 2 - (v / peak) * (H / 2 - 3)).toFixed(1)}`).join(' ')
}

function MiniTrace({ patch, on }: { patch: FactoryPatch; on: boolean }): JSX.Element {
  const points = useMemo(() => tracePoints(patch.patch.wave, patch.patch.cutoff), [patch])
  return (
    <svg
      className="patches__trace"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      data-on={on || undefined}
    >
      <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="patches__trace-axis" />
      <polyline points={points} className="patches__trace-line" />
    </svg>
  )
}

export function Patches(): JSX.Element {
  const { name, loadedId, saved } = useYourPatch()
  const { patch } = engine.useEngine()
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    startYourPatch()
  }, [])

  function load(f: FactoryPatch): void {
    loadFactory(f.id)
    announce(`${f.name} loaded`)
  }

  function back(): void {
    backToYours()
    announce('Your patch is back')
    // the button leaves with the click: keep keyboard focus on the list
    list.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }

  return (
    <section id="patches" aria-labelledby="patches-title" data-section="patches" className="patches">
      <div className="patches__inner">
        <header className="patches__head">
          <h2 id="patches-title" className="patches__title">
            Six patches to start from.
          </h2>
          <p className="patches__sub">Load one, play it, then twist it into yours.</p>
          <p className="patches__hear">
            Played by a Web Audio voice in this page. It shows the sound's shape, and it isn't a recording of the
            device.
          </p>
        </header>

        <ul ref={list} className="patches__list">
          {FACTORY_PATCHES.map((f) => {
            const loaded = loadedId === f.id
            return (
              <li key={f.id} className="patches__item">
                <button
                  type="button"
                  className="patches__row"
                  aria-label={`Load ${f.name}`}
                  aria-describedby={`${f.id}-blurb`}
                  aria-current={loaded || undefined}
                  data-loaded={loaded || undefined}
                  onClick={() => load(f)}
                >
                  <span className="patches__num pi-legend">{String(f.number).padStart(3, '0')}</span>
                  <span className="patches__name">{f.name}</span>
                  <span className="patches__type pi-legend">{f.type === 'fx' ? 'FX' : f.type}</span>
                  <span className="patches__blurb" id={`${f.id}-blurb`}>
                    {f.blurb}
                  </span>
                  <MiniTrace patch={f} on={loaded} />
                  <span className="patches__status">
                    <Led state={loaded ? 'on' : 'off'} word={loaded ? 'Loaded' : undefined} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="patches__after">
          <p className="patches__note">
            Loading a patch moves the knobs up top too. Your own patch stays on the tag until you turn a knob.
          </p>
          <div className="patches__back">
            {saved ? (
              <button type="button" className="pi-quiet" onClick={back}>
                Back to your patch
              </button>
            ) : null}
          </div>
        </div>

        <div className="patches__panel" role="group" aria-label="Play the loaded patch">
          <div className="patches__bar">
            <Oled line1={name} line2={`${SHORT[patch.wave]} ${fmt.hz(patch.cutoff).shown}`} size="sm" />
            <SoundSwitch quiet />
          </div>
          <Keyboard octaves={2} />
        </div>
      </div>
    </section>
  )
}
