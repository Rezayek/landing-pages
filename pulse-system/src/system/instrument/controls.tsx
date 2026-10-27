/**
 * PULSE-1's controls (COMPONENTS.md): Knob, Keyboard, WaveformSelector, FinishSwitch and PatchNameField. Every
 * colour, size and timing comes from tokens.css through instrument.css; nothing here holds a raw value except the
 * geometry of the 300° sweep, which is the instrument's own proportion.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from 'react'
import { noteName, noteOff, noteOn, useEngine, type Wave } from './engine'

const SWEEP = 300 // degrees, 7 o'clock to 5 o'clock
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

// -------------------------------------------------------------------------------------------------------------------
// Knob (WAI-ARIA slider pattern)
// -------------------------------------------------------------------------------------------------------------------
export interface KnobProps {
  label: string
  value: number
  min: number
  max: number
  /** logarithmic mapping, for frequencies and rates */
  log?: boolean
  /** number of keyboard steps across the range (default 100) */
  steps?: number
  defaultValue: number
  /** shown text ("1.2 kHz") and spoken text ("1.2 kilohertz") */
  format: (value: number) => { shown: string; spoken: string }
  onChange: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  /** the value arrived from a patch load: move in detents instead of following the hand */
  gliding?: boolean
  /** a preview state for /system */
  preview?: 'hover' | 'focus' | 'dragged'
}

export function Knob({
  label,
  value,
  min,
  max,
  log = false,
  steps = 100,
  defaultValue,
  format,
  onChange,
  size = 'md',
  gliding = false,
  preview,
}: KnobProps): JSX.Element {
  const labelId = useId()
  const toT = useCallback(
    (v: number) => (log ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min)),
    [log, min, max],
  )
  const fromT = useCallback(
    (t: number) => {
      const c = clamp(t, 0, 1)
      return log ? min * (max / min) ** c : min + c * (max - min)
    },
    [log, min, max],
  )
  const t = clamp(toT(value), 0, 1)
  const drag = useRef<{ y: number; t: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const text = format(value)

  function nudge(delta: number): void {
    onChange(fromT(Math.round((t + delta) * steps) / steps))
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>): void {
    const step = 1 / steps
    const map: Record<string, () => void> = {
      ArrowUp: () => nudge(step),
      ArrowRight: () => nudge(step),
      ArrowDown: () => nudge(-step),
      ArrowLeft: () => nudge(-step),
      PageUp: () => nudge(0.1),
      PageDown: () => nudge(-0.1),
      Home: () => onChange(min),
      End: () => onChange(max),
    }
    const run = map[e.key]
    if (run) {
      e.preventDefault()
      run()
    }
  }

  function onPointerDown(e: PointerEvent<HTMLElement>): void {
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    // A click on the arc jumps there (the single-pointer alternative to dragging).
    const box = el.getBoundingClientRect()
    const dx = e.clientX - (box.left + box.width / 2)
    const dy = e.clientY - (box.top + box.height / 2)
    const r = Math.hypot(dx, dy)
    if (r > box.width * 0.36) {
      // angle clockwise from 7 o'clock
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI - 120
      if (deg < 0) deg += 360
      if (deg <= SWEEP) onChange(fromT(deg / SWEEP))
    }
    drag.current = { y: e.clientY, t: toT(value) }
    setDragging(true)
  }
  function onPointerMove(e: PointerEvent<HTMLElement>): void {
    if (!drag.current) return
    const fine = e.shiftKey ? 0.25 : 1
    onChange(fromT(drag.current.t + ((drag.current.y - e.clientY) / 200) * fine))
  }
  function onPointerUp(): void {
    drag.current = null
    setDragging(false)
  }

  const style = { '--knob-t': t, '--knob-turn': `${-SWEEP / 2 + SWEEP * t}deg` } as CSSProperties
  return (
    <div className="pi-knob" data-size={size} data-active={dragging || preview === 'dragged' || undefined}>
      <span
        className="pi-knob__dial"
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number(value.toFixed(3))}
        aria-valuetext={text.spoken}
        data-preview={preview}
        data-gliding={gliding || undefined}
        style={style}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => onChange(defaultValue)}
        onWheel={(e) => {
          if (document.activeElement === e.currentTarget) nudge(e.deltaY < 0 ? 1 / steps : -1 / steps)
        }}
      >
        <svg className="pi-knob__arc" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="18" pathLength={360} className="pi-knob__track" />
          <circle cx="20" cy="20" r="18" pathLength={360} className="pi-knob__value" />
        </svg>
        <span className="pi-knob__cap" aria-hidden="true">
          <span className="pi-knob__needle" />
        </span>
      </span>
      <span className="pi-legend" id={labelId}>
        {label}
      </span>
      <span className="pi-knob__readout">{text.shown}</span>
      <span className="pi-knob__steps">
        <button type="button" className="pi-quiet" aria-label={`Lower ${label}`} onClick={() => nudge(-1 / steps)}>
          −
        </button>
        <button type="button" className="pi-quiet" aria-label={`Raise ${label}`} onClick={() => nudge(1 / steps)}>
          +
        </button>
      </span>
    </div>
  )
}

/** Formatters for the common units (CONTENT.md: digits with units shown, words spoken). */
export const fmt = {
  hz(v: number) {
    return v >= 1000
      ? { shown: `${(v / 1000).toFixed(2)} kHz`, spoken: `${(v / 1000).toFixed(2)} kilohertz` }
      : { shown: `${Math.round(v)} Hz`, spoken: `${Math.round(v)} hertz` }
  },
  ms(seconds: number) {
    const ms = seconds * 1000
    return ms >= 1000
      ? { shown: `${(ms / 1000).toFixed(2)} s`, spoken: `${(ms / 1000).toFixed(2)} seconds` }
      : { shown: `${Math.round(ms)} ms`, spoken: `${Math.round(ms)} milliseconds` }
  },
  pct(v: number) {
    return { shown: `${Math.round(v * 100)} %`, spoken: `${Math.round(v * 100)} percent` }
  },
  q(v: number) {
    return { shown: v.toFixed(1), spoken: `resonance ${v.toFixed(1)}` }
  },
}

// -------------------------------------------------------------------------------------------------------------------
// Fader (WAI-ARIA slider pattern, vertical): the envelope's A D S R and other long-throw values
// -------------------------------------------------------------------------------------------------------------------
export interface FaderProps {
  label: string
  value: number
  min: number
  max: number
  log?: boolean
  steps?: number
  defaultValue: number
  format: (value: number) => { shown: string; spoken: string }
  onChange: (value: number) => void
}

export function Fader({ label, value, min, max, log = false, steps = 50, defaultValue, format, onChange }: FaderProps): JSX.Element {
  const labelId = useId()
  const toT = (v: number): number => (log ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min))
  const fromT = (t: number): number => {
    const c = clamp(t, 0, 1)
    return log ? min * (max / min) ** c : min + c * (max - min)
  }
  const t = clamp(toT(value), 0, 1)
  const track = useRef<HTMLSpanElement>(null)
  const [dragging, setDragging] = useState(false)
  const text = format(value)
  const nudge = (d: number): void => onChange(fromT(Math.round((t + d) * steps) / steps))
  // a press anywhere on the track jumps there, then follows the pointer (the single-pointer alternative to a drag)
  const at = (clientY: number): void => {
    const box = track.current?.getBoundingClientRect()
    if (box) onChange(fromT(1 - (clientY - box.top) / box.height))
  }
  return (
    <div className="pi-fader" data-active={dragging || undefined}>
      <span className="pi-fader__readout">{text.shown}</span>
      <span
        ref={track}
        className="pi-fader__track"
        role="slider"
        tabIndex={0}
        aria-orientation="vertical"
        aria-labelledby={labelId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number(value.toFixed(3))}
        aria-valuetext={text.spoken}
        style={{ '--fader-t': t } as CSSProperties}
        onKeyDown={(e) => {
          const map: Record<string, () => void> = {
            ArrowUp: () => nudge(1 / steps),
            ArrowRight: () => nudge(1 / steps),
            ArrowDown: () => nudge(-1 / steps),
            ArrowLeft: () => nudge(-1 / steps),
            PageUp: () => nudge(0.1),
            PageDown: () => nudge(-0.1),
            Home: () => onChange(min),
            End: () => onChange(max),
          }
          const run = map[e.key]
          if (run) {
            e.preventDefault()
            run()
          }
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDragging(true)
          at(e.clientY)
        }}
        onPointerMove={(e) => dragging && at(e.clientY)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onDoubleClick={() => onChange(defaultValue)}
      >
        <span className="pi-fader__fill" aria-hidden="true" />
        <span className="pi-fader__cap" aria-hidden="true" />
      </span>
      <span className="pi-legend" id={labelId}>
        {label}
      </span>
    </div>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// Keyboard
// -------------------------------------------------------------------------------------------------------------------
// the computer keys play an octave and a half from the key octave: A W S E D F T G Y H U J K O L P ;
const COMPUTER_KEYS = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k', 'o', 'l', 'p', ';']
const IS_BLACK = [false, true, false, true, false, false, true, false, true, false, true, false]

export interface KeyboardProps {
  /** octaves shown, plus the top C: 1 (13 keys), 2 (25), 3 (37) or 4 (49, the full PULSE-1 keybed) */
  octaves?: 1 | 2 | 3 | 4
  /** a preview of one pressed key for /system */
  previewNote?: number
}

const OCTAVE_WORDS = ['', 'one octave', 'two octaves', 'three octaves', 'four octaves']

export function Keyboard({ octaves = 2, previewNote }: KeyboardProps): JSX.Element {
  // the key octave: where the computer keys start (C3). A small bed follows it; the full bed stays at C2 to C6.
  const [base, setBase] = useState(48)
  const { status, notes: held_notes } = useEngine()
  const held = useRef<Set<number>>(new Set())
  const descId = useId()
  const limitId = useId()
  const lowest = base <= 24
  const highest = base >= 84
  const count = octaves * 12 + 1
  const bedBase = octaves >= 3 ? 36 : base
  const notes = Array.from({ length: count }, (_, i) => bedBase + i)
  const whites = notes.filter((n) => !IS_BLACK[n % 12])

  const down = (n: number): void => {
    held.current.add(n)
    noteOn(n)
  }
  const up = (n: number): void => {
    held.current.delete(n)
    noteOff(n)
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>): void {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key.toLowerCase()
    if (k === 'z') return setBase((b) => Math.max(24, b - 12))
    if (k === 'x') return setBase((b) => Math.min(84, b + 12))
    const i = COMPUTER_KEYS.indexOf(k)
    if (i >= 0) {
      e.preventDefault()
      down(base + i)
    }
  }
  function onKeyUp(e: KeyboardEvent<HTMLElement>): void {
    const i = COMPUTER_KEYS.indexOf(e.key.toLowerCase())
    if (i >= 0) up(base + i)
  }

  useEffect(() => {
    const release = (): void => held.current.forEach((n) => up(n))
    window.addEventListener('blur', release)
    return () => window.removeEventListener('blur', release)
  }, [])

  const pressed = (n: number): boolean => held_notes.includes(n) || n === previewNote

  return (
    <div className="pi-keys" data-octaves={octaves}>
      <div className="pi-keys__bar">
        {/* at either end the key stays focusable but disabled, and the readout says why */}
        <button
          type="button"
          className="pi-quiet"
          aria-disabled={lowest || undefined}
          aria-describedby={lowest ? limitId : undefined}
          onClick={() => !lowest && setBase((b) => b - 12)}
        >
          Octave down
        </button>
        <span className="pi-legend" id={limitId}>
          C{Math.floor(base / 12) - 1}
          {lowest ? ' · the lowest octave' : highest ? ' · the highest octave' : ''}
        </span>
        <button
          type="button"
          className="pi-quiet"
          aria-disabled={highest || undefined}
          aria-describedby={highest ? limitId : undefined}
          onClick={() => !highest && setBase((b) => b + 12)}
        >
          Octave up
        </button>
      </div>
      {/* the bed scrolls sideways in its own frame on narrow screens; the frame itself takes focus for scrolling */}
      <div
        className="pi-keys__frame"
        role="group"
        aria-label={`Keyboard, ${OCTAVE_WORDS[octaves]}`}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      >
        <div className="pi-keys__bed" style={{ '--whites': whites.length } as CSSProperties}>
          {notes.map((n) => {
            const black = IS_BLACK[n % 12]
            const whiteIndex = whites.indexOf(black ? n - 1 : n)
            const hint = n >= base ? COMPUTER_KEYS[n - base] : undefined
            return (
              <button
                key={n}
                type="button"
                className={black ? 'pi-key pi-key--black' : 'pi-key'}
                style={{ '--i': whiteIndex } as CSSProperties}
                aria-label={noteName(n)}
                aria-pressed={pressed(n)}
                onPointerDown={(e) => {
                  e.currentTarget.releasePointerCapture?.(e.pointerId)
                  down(n)
                }}
                onPointerUp={() => up(n)}
                onPointerLeave={() => held.current.has(n) && up(n)}
                onPointerEnter={(e) => e.buttons === 1 && down(n)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
                    e.preventDefault()
                    down(n)
                  }
                }}
                onKeyUp={(e) => (e.key === 'Enter' || e.key === ' ') && up(n)}
              >
                {hint ? <span className="pi-key__hint">{hint.toUpperCase()}</span> : null}
              </button>
            )
          })}
        </div>
      </div>
      <p id={descId} className="pi-help">
        Play with the keys A to ; (several at once for chords). Z and X move them an octave.
        {/* the same length in both states, so the line never rewraps */}
        {status === 'on' ? ' Sound is on.' : ' Sound is off.'}
      </p>
    </div>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// Radio groups: waveform jacks and the finish switch (WAI-ARIA radio group pattern)
// -------------------------------------------------------------------------------------------------------------------
interface RadioOption<T extends string> {
  value: T
  label: string
  icon?: JSX.Element
}

function useRadioKeys<T extends string>(options: readonly RadioOption<T>[], value: T, onChange: (v: T) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  return {
    refs,
    onKeyDown(e: KeyboardEvent<HTMLElement>) {
      const i = options.findIndex((o) => o.value === value)
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
      if (!dir) return
      e.preventDefault()
      const next = (i + dir + options.length) % options.length
      onChange(options[next].value)
      refs.current[next]?.focus()
    },
  }
}

const WAVE_PATHS: Record<Wave, string> = {
  sine: 'M2 12 C6 2, 10 2, 12 12 S18 22, 22 12',
  triangle: 'M2 12 L7 4 L17 20 L22 12',
  sawtooth: 'M2 18 L12 6 L12 18 L22 6 L22 18',
  square: 'M2 18 L2 6 L12 6 L12 18 L22 18 L22 6',
}

export const WAVES: readonly RadioOption<Wave>[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'square', label: 'Square' },
]

export function WaveformSelector({ value, onChange, label = 'Wave' }: { value: Wave; onChange: (w: Wave) => void; label?: string }): JSX.Element {
  const legendId = useId()
  const { refs, onKeyDown } = useRadioKeys(WAVES, value, onChange)
  return (
    <div className="pi-waves">
      <span className="pi-legend" id={legendId}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={legendId} className="pi-waves__row" onKeyDown={onKeyDown}>
        {WAVES.map((w, i) => (
          <button
            key={w.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={value === w.value}
            tabIndex={value === w.value ? 0 : -1}
            className="pi-jack"
            onClick={() => onChange(w.value)}
          >
            <span className="pi-jack__ring" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="pi-jack__icon">
                <path d={WAVE_PATHS[w.value]} />
              </svg>
            </span>
            <span className="pi-legend">{w.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export type Finish = 'graphite' | 'bone'
const FINISHES: readonly RadioOption<Finish>[] = [
  { value: 'graphite', label: 'Graphite' },
  { value: 'bone', label: 'Bone' },
]
const FINISH_KEY = 'pulse-finish'

/** Reads the saved finish; falls back to the system setting. Safe when storage is blocked. */
export function savedFinish(): Finish | null {
  try {
    const v = window.localStorage.getItem(FINISH_KEY)
    return v === 'graphite' || v === 'bone' ? v : null
  } catch {
    return null
  }
}

export function applyFinish(finish: Finish): void {
  document.documentElement.dataset.theme = finish === 'graphite' ? 'dark' : 'light'
  try {
    window.localStorage.setItem(FINISH_KEY, finish)
  } catch {
    /* storage blocked: the choice lasts for this visit */
  }
}

export function FinishSwitch({ value, onChange }: { value: Finish; onChange: (f: Finish) => void }): JSX.Element {
  const legendId = useId()
  const { refs, onKeyDown } = useRadioKeys(FINISHES, value, onChange)
  return (
    <div className="pi-finish">
      <span className="pi-legend" id={legendId}>
        Finish
      </span>
      <div role="radiogroup" aria-labelledby={legendId} className="pi-finish__row" onKeyDown={onKeyDown}>
        {FINISHES.map((f, i) => (
          <button
            key={f.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={value === f.value}
            tabIndex={value === f.value ? 0 : -1}
            className="pi-swatch"
            data-finish={f.value}
            onClick={() => onChange(f.value)}
          >
            <span className="pi-swatch__chip" aria-hidden="true" />
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// Patch name field
// -------------------------------------------------------------------------------------------------------------------
export interface PatchNameFieldProps {
  value: string
  onChange: (v: string) => void
  error?: string | null
  inputRef?: Ref<HTMLInputElement>
  onEnter?: () => void
  /** /system only: draw the focus ring without taking focus, so a capture can show it */
  preview?: 'focus'
}

export function PatchNameField({ value, onChange, error, inputRef, onEnter, preview }: PatchNameFieldProps): JSX.Element {
  const id = useId()
  return (
    <div className="pi-field" data-invalid={error ? true : undefined}>
      <label className="pi-legend" htmlFor={id}>
        Patch name
      </label>
      <span className="pi-field__row">
      <input
        id={id}
        ref={inputRef}
        className="pi-field__input"
        data-preview={preview}
        value={value}
        maxLength={16}
        placeholder="NIGHT BASS"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      />
        <span className="pi-field__count" aria-hidden="true">
          {value.length}/16
        </span>
      </span>
      <span id={`${id}-hint`} className="pi-help">
        Up to 16 characters. It shows on the screen.
      </span>
      {error ? (
        <span id={`${id}-error`} className="pi-field__error">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8" />
            <path d="M7 7 L13 13 M13 7 L7 13" />
          </svg>
          {error}
        </span>
      ) : null}
    </div>
  )
}
