/**
 * StepLoop (COMPONENTS.md): PULSE-1's 32-step loop. A pattern plays sixteenth notes at the tempo through the engine,
 * so the keys, the scope and every readout move while the visitor turns knobs; sound only after the sound key. A step
 * holds one note or a chord, a gate (0 to 1 of the step) and an accent. Patterns: a bass line, an arpeggio, an acid
 * line (its slides use the patch's glide), chord stabs, and "New pattern", which writes a fresh one in A minor.
 */
import { useEffect, useId, useRef, useState, type CSSProperties, type JSX } from 'react'
import { announce } from '../feedback'
import { Knob } from './controls'
import { getState, noteName, noteOff, noteOn } from './engine'

export interface Step {
  readonly notes: readonly number[]
  readonly gate: number
  readonly accent?: boolean
}
export type Pattern = readonly (Step | null)[]
export const STEPS = 32

const n = (notes: number | number[], gate = 0.5, accent = false): Step => ({ notes: Array.isArray(notes) ? notes : [notes], gate, accent })
const A1 = 33, C2 = 36, D2 = 38, E2 = 40, F2 = 41, G2 = 43, A2 = 45, C3 = 48, E3 = 52, G3 = 55, A3 = 57, C4 = 60, D4 = 62, F3 = 53, B3 = 59

function bars(...b: Pattern[]): Pattern {
  return b.flat()
}

export const PATTERNS: Readonly<Record<string, { label: string; pattern: Pattern }>> = {
  bass: {
    label: 'Bass line',
    pattern: bars(
      [n(A1, 0.7, true), null, n(A1, 0.3), n(A2, 0.4), null, n(A1, 0.3), n(C2, 0.6), null, n(A1, 0.7, true), null, n(E2, 0.3), n(A1, 0.3), n(G2, 0.5), null, n(E2, 0.4), n(D2, 0.4)],
      [n(F2, 0.7, true), null, n(F2, 0.3), n(A2 - 4, 0.4), null, n(F2, 0.3), n(G2, 0.6), null, n(A1, 0.7, true), null, n(E2, 0.3), n(A1, 0.3), n(C2, 0.5), n(D2, 0.4), n(E2, 0.4), n(G2, 0.5, true)],
    ),
  },
  arp: {
    label: 'Arpeggio',
    pattern: bars(
      [A2, C3, E3, A3, E3, C3, A2, C3, F2 + 12, A2, C3, F3, C3, A2, F2 + 12, A2].map((x, i) => n(x, 0.45, i % 4 === 0)),
      [C3, E3, G3, C4, G3, E3, C3, E3, G2 + 12, B3 - 12, D4 - 12, G3, D4 - 12, B3 - 12, G2 + 12, B3 - 12].map((x, i) => n(x, 0.45, i % 4 === 0)),
    ),
  },
  acid: {
    label: 'Acid',
    pattern: bars(
      [n(A1, 0.5, true), n(A2, 0.9), n(A1, 0.4), null, n(C3, 0.9, true), n(A2, 0.4), n(G2, 0.9), n(A1, 0.4), n(A1, 0.5), n(E2, 0.9, true), n(G2, 0.5), null, n(A2, 0.9), n(C3, 0.4, true), n(A2, 0.9), n(E2, 0.4)],
      [n(A1, 0.5, true), n(A2, 0.9), n(A1, 0.4), n(D2, 0.9), n(F2, 0.9, true), n(A2, 0.4), null, n(A1, 0.4), n(G2, 0.9), n(A2, 0.5, true), n(C3, 0.9), n(D4 - 12, 0.9), n(E3, 0.4, true), null, n(A2, 0.9), n(G2, 0.4)],
    ),
  },
  chords: {
    label: 'Chord stabs',
    pattern: bars(
      [null, null, n([A2, C3, E3, G3], 0.35, true), null, null, null, n([A2, C3, E3, G3], 0.2), null, null, null, n([F2 + 12, A2, C3, E3], 0.35, true), null, null, n([F2 + 12, A2, C3, E3], 0.2), null, null],
      [null, null, n([C3, E3, G3, B3], 0.35, true), null, null, null, n([C3, E3, G3, B3], 0.2), null, null, null, n([G2, B3 - 12, D4 - 12, F3], 0.35, true), null, n([G2, B3 - 12, D4 - 12, F3], 0.2), null, n([E2 + 12, G2 + 12, B3 - 12, D4 - 12], 0.8), null],
    ),
  },
}

const SCALE = [0, 3, 5, 7, 10] // A minor pentatonic
/** Writes a new 32-step pattern: a root-heavy bass under occasional higher notes and a chord or two. */
export function generatePattern(seed = Math.random()): Pattern {
  let s = Math.floor(seed * 2 ** 31) || 1
  const rand = (): number => ((s = (s * 48271) % 2147483647) / 2147483647)
  return Array.from({ length: STEPS }, (_, i) => {
    const downbeat = i % 4 === 0
    if (!downbeat && rand() < 0.38) return null
    if (i % 16 === 10 && rand() < 0.45) {
      const root = A2 + SCALE[Math.floor(rand() * 3)]
      return n([root, root + 3, root + 7, root + 10], 0.3, true)
    }
    const octave = rand() < 0.7 ? 0 : 12
    const pitch = A1 + octave + SCALE[Math.floor(rand() * SCALE.length)] + (rand() < 0.2 ? 12 : 0)
    return n(downbeat ? A1 + (rand() < 0.3 ? 12 : 0) : pitch, 0.25 + rand() * 0.6, downbeat && rand() < 0.6)
  })
}

const bpmFmt = (v: number): { shown: string; spoken: string } => ({ shown: `${Math.round(v)} bpm`, spoken: `${Math.round(v)} beats per minute` })

export interface StepLoopProps {
  /** start playing at once (a /system or capture story) */
  autoplay?: boolean
  /** told the step (0-31, or -1 when stopped) every time it moves */
  onStep?: (step: number) => void
}

export function StepLoop({ autoplay = false, onStep }: StepLoopProps): JSX.Element {
  const [playing, setPlaying] = useState(autoplay)
  const [patternId, setPatternId] = useState('bass')
  const [custom, setCustom] = useState<Pattern | null>(null)
  const [bpm, setBpm] = useState(112)
  const [step, setStep] = useState(-1)
  const legendId = useId()
  const pattern = custom ?? PATTERNS[patternId].pattern
  const latest = useRef({ pattern, bpm, onStep })
  latest.current = { pattern, bpm, onStep }

  useEffect(() => {
    if (!playing) {
      setStep(-1)
      latest.current.onStep?.(-1)
      return
    }
    let i = 0
    let timer = 0
    const offs = new Set<number>()
    const sounding = new Set<number>()
    const tick = (): void => {
      const { pattern: pat, bpm: tempo } = latest.current
      const ms = 60000 / tempo / 4
      const st = pat[i % STEPS]
      setStep(i % STEPS)
      latest.current.onStep?.(i % STEPS)
      if (st) {
        for (const note of st.notes) {
          noteOn(note)
          sounding.add(note)
          const off = window.setTimeout(() => {
            noteOff(note)
            sounding.delete(note)
            offs.delete(off)
          }, ms * st.gate)
          offs.add(off)
        }
      }
      i++
      timer = window.setTimeout(tick, ms)
    }
    tick()
    return () => {
      window.clearTimeout(timer)
      offs.forEach((o) => window.clearTimeout(o))
      sounding.forEach((note) => noteOff(note))
      for (const held of getState().notes) noteOff(held)
    }
  }, [playing])

  function pick(id: string): void {
    setCustom(null)
    setPatternId(id)
    announce(`${PATTERNS[id].label} pattern`)
  }
  function fresh(): void {
    setCustom(generatePattern())
    setPatternId('new')
    announce('New pattern written')
  }

  return (
    <div className="pi-loop">
      <div className="pi-loop__bar">
        <button type="button" className="pi-quiet pi-loop__key" aria-pressed={playing} onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Stop the loop' : 'Play a loop'}
        </button>
        <div role="radiogroup" aria-labelledby={legendId} className="pi-loop__patterns">
          <span id={legendId} className="pi-legend">
            Pattern
          </span>
          {Object.entries(PATTERNS).map(([id, p]) => (
            <button key={id} type="button" role="radio" aria-checked={patternId === id} className="pi-quiet" onClick={() => pick(id)}>
              {p.label}
            </button>
          ))}
          <button type="button" className="pi-quiet" aria-pressed={patternId === 'new'} onClick={fresh}>
            New pattern
          </button>
        </div>
        <Knob size="sm" label="Tempo" value={bpm} min={70} max={160} steps={90} defaultValue={112} format={bpmFmt} onChange={setBpm} />
      </div>
      <ol className="pi-loop__pads" aria-label={`Loop, ${STEPS} steps`}>
        {pattern.map((st, i) => (
          <li
            key={i}
            data-on={step === i || undefined}
            data-note={st ? true : undefined}
            data-accent={st?.accent || undefined}
            data-beat={i % 4 === 0 || undefined}
            style={{ '--pad-h': st ? Math.min(1, 0.35 + st.gate * 0.65) : 0.12 } as CSSProperties}
          >
            <span className="fb-sr">
              Step {i + 1}: {st ? st.notes.map(noteName).join(', ') : 'rest'}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
