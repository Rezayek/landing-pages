/**
 * S1 Play, the hero and the signature (UX.md S1, MOTION.md: the hero sequence, the signature, the signal path, the patch
 * cable, the annotations, the loop). Built from the locked comp 1d (CONCEPT.md) on the system's instrument parts.
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type JSX, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { Fader, Keyboard, Knob, Led, Oled, PageKeys, SoundSwitch, StepLoop, WaveformSelector, engine, fmt, pageKeyIds } from '@/system/instrument'
import { pulsePlay } from '@/system/vfx'
import { announce } from '@/system/feedback'
import { parseLatency } from '@/system/latency'
import { PatchTag } from '../parts/PatchTag'
import { PhosphorScope, onLevel } from '../parts/PhosphorScope'
import './hero.css'

const WAVE_SHORT = { sine: 'SIN', triangle: 'TRI', sawtooth: 'SAW', square: 'SQR' } as const

/** Mini graphs for the signal path: each stage drawn from the live patch. */
function WaveGlyph({ wave }: { wave: string }): JSX.Element {
  const d =
    wave === 'sine' ? 'M0 12 C 6 0, 12 0, 18 12 S 30 24, 36 12 S 48 0, 54 12'
    : wave === 'triangle' ? 'M0 12 L9 2 L27 22 L45 2 L54 12'
    : wave === 'square' ? 'M0 20 V4 H14 V20 H28 V4 H42 V20 H54'
    : 'M0 20 L18 4 V20 L36 4 V20 L54 4'
  return <svg className="d-glyph" viewBox="0 0 54 24" aria-hidden="true"><path d={d} /></svg>
}
function FilterGlyph({ cutoff, q }: { cutoff: number; q: number }): JSX.Element {
  const x = 4 + (Math.log(cutoff / 40) / Math.log(12000 / 40)) * 44
  const peak = Math.max(2, 10 - q * 0.5)
  return (
    <svg className="d-glyph" viewBox="0 0 54 24" aria-hidden="true">
      <path d={`M0 10 H${x - 6} Q${x - 1} ${peak} ${x} ${peak} Q${x + 2} ${peak} ${x + 8} 22 H54`} />
    </svg>
  )
}
const midiHz = (m: number): number => 440 * 2 ** ((m - 69) / 12)
const query = new URLSearchParams(location.search)

/** Where the envelope is now: the stage and how far through it, from the note's on and off times. */
function useEnvelope(): { stage: 'idle' | 'A' | 'D' | 'S' | 'R'; t: number } {
  const { note, patch } = engine.useEngine()
  const times = useRef<{ on: number; off: number | null }>({ on: 0, off: null })
  const [, tick] = useState(0)
  useEffect(() => {
    if (note !== null) times.current = { on: performance.now(), off: null }
    else if (times.current.off === null && times.current.on) times.current.off = performance.now()
  }, [note])
  useEffect(() => {
    let raf = 0
    let last = 0
    const loop = (now: number): void => {
      raf = requestAnimationFrame(loop)
      if (now - last > 50) {
        last = now
        tick((n) => n + 1)
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  const { on, off } = times.current
  if (!on) return { stage: 'idle', t: 0 }
  const now = performance.now()
  if (off !== null) {
    const r = (now - off) / 1000 / Math.max(0.01, patch.release)
    return r >= 1 ? { stage: 'idle', t: 0 } : { stage: 'R', t: r }
  }
  const e = (now - on) / 1000
  if (e < patch.attack) return { stage: 'A', t: e / Math.max(0.001, patch.attack) }
  if (e < patch.attack + patch.decay) return { stage: 'D', t: (e - patch.attack) / Math.max(0.001, patch.decay) }
  return { stage: 'S', t: 1 }
}

function useLevel(): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    let last = 0
    return onLevel((x) => {
      const now = performance.now()
      if (now - last > 66) {
        last = now
        setV(x)
      }
    })
  }, [])
  return v
}

function EnvGlyphLive({ patch, stage, t }: { patch: { attack: number; decay: number; sustain: number; release: number }; stage: string; t: number }): JSX.Element {
  const ax = 2 + Math.min(14, patch.attack * 10 + 2)
  const dx = ax + Math.min(14, patch.decay * 10 + 2)
  const sy = 22 - patch.sustain * 18
  const rx = Math.min(54, 40 + patch.release * 8 + 2)
  const seg: Record<string, number[]> = { A: [2, 22, ax, 3], D: [ax, 3, dx, sy], S: [dx, sy, 40, sy], R: [40, sy, rx, 22] }
  const s = seg[stage]
  const dot = s ? [s[0] + (s[2] - s[0]) * Math.min(1, t), s[1] + (s[3] - s[1]) * Math.min(1, t)] : null
  return (
    <svg className="d-glyph" viewBox="0 0 54 24" aria-hidden="true">
      <path d={`M0 22 L${ax} 3 L${dx} ${sy} H40 L${rx} 22`} />
      {s ? <path className="d-glyph__hot" d={`M${s[0]} ${s[1]} L${s[2]} ${s[3]}`} /> : null}
      {dot ? <circle className="d-glyph__dot" cx={dot[0]} cy={dot[1]} r="2.2" /> : null}
    </svg>
  )
}

function Vu({ level, on }: { level: number; on: boolean }): JSX.Element {
  const lit = on ? Math.round(Math.min(1, level * 1.8) * 12) : 0
  return (
    <svg className="d-glyph" viewBox="0 0 54 24" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={i * 4.5} y="4" width="3.2" height="16" data-on={i < lit ? true : undefined} data-hot={i >= 10 ? true : undefined} />
      ))}
    </svg>
  )
}

/** A track on this machine (kept out of the repository: its rights are not ours to publish). The line-in key shows
 *  only when the file is there, so the committed page works without it. */
const TRACK = { url: '/pulse-landing/audio/canon.mp3', credit: 'OVERWERK · Canon' }

/** The line input: plays the track through the instrument's output, so the scope, the meter and the path draw it. */
function LineIn(): JSX.Element | null {
  const { track } = engine.useEngine()
  const [present, setPresent] = useState(false)
  useEffect(() => {
    let live = true
    fetch(TRACK.url, { method: 'HEAD' })
      .then((r) => live && setPresent(r.ok && (r.headers.get('content-type') ?? '').startsWith('audio')))
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [])
  if (!present) return null
  const playing = track === 'playing'
  return (
    <span className="e-line">
      <button
        type="button"
        className="pi-quiet e-line__key"
        aria-pressed={playing}
        onClick={() => {
          if (playing) {
            engine.stopTrack()
            announce('Track stopped.')
          } else {
            void engine.playTrack(TRACK.url).then((t) => announce(t === 'playing' ? `Line in: ${TRACK.credit.replace(' · ', ', ')}.` : "The track didn't play."))
          }
        }}
      >
        <Led state={playing ? 'on' : track === 'loading' ? 'blink' : 'off'} />
        {playing ? 'Stop the track' : 'Line in'}
      </button>
      <span className="pi-legend e-line__credit">{track === 'error' ? "The track didn't play" : TRACK.credit}</span>
    </span>
  )
}

type Jack = 'out' | 'phones' | 'none'
const JACK_GAIN: Record<Jack, number> = { out: 1, phones: 0.6, none: 0 }

/**
 * The cable: one end in the scope's CH1 input, the plug on the device. Drag the plug between OUT and PHONES, or drop
 * it anywhere else to unplug it; Enter or Space on the plug cycles OUT, PHONES, unplugged. It sags and swings back
 * when let go, and a pulse of light runs up it on every note while it is plugged in.
 */
function PatchCable({
  host,
  socket,
  jacks,
  jack,
  onJack,
  pulse,
}: {
  host: RefObject<HTMLElement | null>
  socket: RefObject<HTMLElement | null>
  jacks: Record<'out' | 'phones', RefObject<HTMLElement | null>>
  jack: Jack
  onJack: (j: Jack) => void
  pulse: number
}): JSX.Element | null {
  const [geo, setGeo] = useState<{ x1: number; y1: number; right: number; jackPos: Record<'out' | 'phones', [number, number]> } | null>(null)
  const [drag, setDrag] = useState<[number, number] | null>(null)
  const [loose, setLoose] = useState<[number, number] | null>(null)
  const [swing, setSwing] = useState(0)
  const spring = useRef({ x: 0, v: 0, raf: 0 })

  useLayoutEffect(() => {
    const measure = (): void => {
      const h = host.current?.getBoundingClientRect()
      const b = socket.current?.querySelector('i')?.getBoundingClientRect()
      if (!h || !b) return
      const centre = (el: HTMLElement | null): [number, number] => {
        const r = el?.querySelector('i')?.getBoundingClientRect()
        return r ? [r.left + r.width / 2 - h.left, r.top + r.height / 2 - h.top] : [0, 0]
      }
      setGeo({ x1: b.left + b.width / 2 - h.left, y1: b.top + b.height / 2 - h.top, right: h.width - 24, jackPos: { out: centre(jacks.out.current), phones: centre(jacks.phones.current) } })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (host.current) ro.observe(host.current)
    const late = window.setTimeout(measure, 700)
    return () => {
      ro.disconnect()
      window.clearTimeout(late)
    }
  }, [host, socket, jacks])

  function kick(amount: number): void {
    const s = spring.current
    cancelAnimationFrame(s.raf)
    s.x = amount
    s.v = 0
    const step = (): void => {
      s.v += -0.08 * s.x - 0.1 * s.v
      s.x += s.v
      setSwing(s.x)
      if (Math.abs(s.x) > 0.3 || Math.abs(s.v) > 0.3) s.raf = requestAnimationFrame(step)
      else setSwing(0)
    }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) s.raf = requestAnimationFrame(step)
  }

  if (!geo) return null
  const end: [number, number] = drag ?? (jack === 'none' ? (loose ?? [geo.x1 - 40, geo.y1 + 180]) : geo.jackPos[jack])
  const [x2, y2] = end
  const span = Math.hypot(x2 - geo.x1, y2 - geo.y1)
  const sag = Math.min(220, 60 + span * 0.35) + swing
  const cx = Math.min(geo.right, Math.max(geo.x1, x2) + 70)
  const d = `M${geo.x1} ${geo.y1} C ${cx} ${geo.y1 + sag * 0.6}, ${x2 + 10} ${y2 - sag * 0.9}, ${x2} ${y2}`

  function toLocal(e: ReactPointerEvent): [number, number] {
    const h = host.current!.getBoundingClientRect()
    return [e.clientX - h.left, e.clientY - h.top]
  }
  function onUp(e: ReactPointerEvent): void {
    if (!drag || !geo) return
    const p = toLocal(e)
    const near = (['out', 'phones'] as const).find((j) => Math.hypot(p[0] - geo.jackPos[j][0], p[1] - geo.jackPos[j][1]) < 44)
    setDrag(null)
    if (near) onJack(near)
    else {
      setLoose(p)
      onJack('none')
    }
    kick(46)
  }
  const label = jack === 'out' ? 'in OUT' : jack === 'phones' ? 'in PHONES' : 'unplugged'
  return (
    <>
      <svg className="d-cable" aria-hidden="true">
        <path className="d-cable__shadow" d={d} />
        <path className="d-cable__body" d={d} />
        <path className="d-cable__sheen" d={d} />
        {pulse && jack !== 'none' && !drag ? <path key={pulse} className="d-cable__pulse" d={d} pathLength={100} /> : null}
      </svg>
      <button
        type="button"
        className="e-plug"
        data-state={drag ? 'drag' : jack}
        style={{ left: x2, top: y2 }}
        aria-label={`Cable plug, ${label}. Drag it to another jack, or press to move it.`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDrag(toLocal(e))
        }}
        onPointerMove={(e) => drag && setDrag(toLocal(e))}
        onPointerUp={onUp}
        onPointerCancel={() => setDrag(null)}
        onClick={(e) => {
          if (e.detail !== 0) return // a pointer press was handled by the drag
          onJack(jack === 'out' ? 'phones' : jack === 'phones' ? 'none' : 'out')
          kick(30)
        }}
      >
        <span aria-hidden="true" />
      </button>
    </>
  )
}

/** A leader line from the hovered signal-path stage to its control on the device. */
function Leader({ host, from, to }: { host: RefObject<HTMLElement | null>; from: HTMLElement | null; to: HTMLElement | null }): JSX.Element | null {
  const [d, setD] = useState<string | null>(null)
  useLayoutEffect(() => {
    const h = host.current?.getBoundingClientRect()
    const a = from?.getBoundingClientRect()
    const b = to?.getBoundingClientRect()
    if (!h || !a || !b) {
      setD(null)
      return
    }
    const x1 = a.left + a.width / 2 - h.left
    const y1 = a.bottom - h.top
    const x2 = b.left + b.width / 2 - h.left
    const y2 = b.top - h.top - 6
    setD(`M${x1} ${y1} V${y1 + 18} L${x2} ${y2 - 18} V${y2}`)
  }, [host, from, to])
  if (!d) return null
  return (
    <svg className="e-leader" aria-hidden="true">
      <path d={d} />
      <circle cx={d.split(' ')[0].slice(1)} cy={d.split(' ')[1]} r="3" />
    </svg>
  )
}

/** Cutoff, Q and LFO drawn on the spectrum: the knobs' meaning, labelled where the sound changes. */
function Annotations({ cutoff, q, lfoRate, lfoDepth }: { cutoff: number; q: number; lfoRate: number; lfoDepth: number }): JSX.Element {
  const x = (Math.log(cutoff / 40) / Math.log(12000 / 40)) * 100
  const flag = Math.min(70, 8 + q * 3.4)
  return (
    <div className="e-annot" aria-hidden="true" style={vars({ '--fc': `${x}%`, '--flag': `${flag}%`, '--lfo-w': `${4 + lfoDepth * 22}%`, '--lfo-s': `${1 / Math.max(0.05, lfoRate)}s` })}>
      <span className="e-annot__band" />
      <span className="e-annot__fc">
        <span className="pi-legend">fc {fmt.hz(cutoff).shown}</span>
      </span>
      <span className="e-annot__q">
        <span className="pi-legend">Q {q.toFixed(1)}</span>
      </span>
      <span className="e-annot__lfo pi-legend">LFO {lfoRate.toFixed(1)} Hz</span>
    </div>
  )
}

const vars = (v: Record<string, string>): CSSProperties => v as CSSProperties

/** The instrument's control banks (the page keys under the screen), each one row: the wave and the filter, the
 *  envelope, the second oscillator, tone, modulation and effects, the loop. */
const BANKS = [
  { id: 'main', label: 'Main' },
  { id: 'env', label: 'Envelope' },
  { id: 'osc2', label: 'Osc 2' },
  { id: 'tone', label: 'Tone' },
  { id: 'fx', label: 'Mod & FX' },
  { id: 'loop', label: 'Loop' },
] as const

/**
 * S1 Play (UX.md): the instrument on the first screen. The phosphor CRT previews the patch silently until the sound is on;
 * the engraved signal path ticks live; the patch cable runs from the device's OUT jack into the scope's CH1 input;
 * the device below plays (big knobs, envelope faders, voice and effects trims, the 32-step loop, 49 keys); the patch
 * tag and the pre-order sit beside it. Capture parameters: ?loop=1, ?jack=phones|none, ?hot=osc|vcf|env|out.
 */
export function Hero(): JSX.Element {
  const { status, patch, note } = engine.useEngine()
  const on = status === 'on'
  const env = useEnvelope()
  const lvl = useLevel()
  const host = useRef<HTMLElement>(null)
  const outJack = useRef<HTMLSpanElement>(null)
  const phonesJack = useRef<HTMLSpanElement>(null)
  const socket = useRef<HTMLSpanElement>(null)
  const jacks = useMemo(() => ({ out: outJack, phones: phonesJack }), [])
  // the control banks behind the page keys (?bank= opens one, for captures)
  const [bank, setBank] = useState<string>(BANKS.some((b) => b.id === query.get('bank')) ? (query.get('bank') as string) : query.get('loop') === '1' ? 'loop' : 'main')
  const bankBase = useId()
  const bankProps = (id: string): { id: string; 'aria-labelledby': string; hidden: boolean } => {
    const ids = pageKeyIds(bankBase, id)
    return { id: ids.panel, 'aria-labelledby': ids.tab, hidden: bank !== id }
  }
  const [jack, setJack] = useState<Jack>(query.get('jack') === 'none' ? 'none' : query.get('jack') === 'phones' ? 'phones' : 'out')
  const [hot, setHot] = useState<string | null>(query.get('hot'))
  const stageEls = useRef<Record<string, HTMLElement | null>>({})
  const targetEls = useRef<Record<string, HTMLElement | null>>({})
  const [pulse, setPulse] = useState(0)
  // MOTION.md, the hero sequence: the device powers on once (CRT boot in the shader; here the legends type on, the path
  // LEDs light from oscillator to output, the knobs sweep to their values, one pulse runs up the cable)
  const reducedMotion = typeof window !== 'undefined' && (document.documentElement.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [booting, setBooting] = useState(!reducedMotion)
  const hudTl = useRef<HTMLSpanElement>(null)
  const hudTr = useRef<HTMLSpanElement>(null)
  const off = useRef(0)
  // before paint, so the legends never show whole for a frame and then blank out before they type on
  useLayoutEffect(() => {
    if (!booting) return
    // the legends type on with the system effect; their text stays React's (no textContent writes)
    const legends = [hudTl.current, hudTr.current]
    const t1 = window.setTimeout(
      () =>
        legends.forEach((el) => {
          if (!el) return
          el.style.setProperty('--type-chars', String(Math.max(1, (el.textContent ?? '').length)))
          void pulsePlay(el, 'type-on')
        }),
      650,
    )
    const t2 = window.setTimeout(() => {
      setBooting(false)
      setPulse((n) => n + 1)
    }, 1800)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // the tube switches off as the hero leaves the screen (the S1 → S2 hand-off; the story opens from the same line),
  // and the amber lights breathe with the LFO
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number): void => {
      raf = requestAnimationFrame(tick)
      const el = host.current
      if (!el) return
      const box = el.getBoundingClientRect()
      off.current = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - box.bottom) / (window.innerHeight * 0.45)))
      const { patch: pt, status: st } = engine.getState()
      const breathe = st === 'on' && !reducedMotion ? 0.5 + 0.5 * Math.sin(((now - t0) / 1000) * 2 * Math.PI * pt.lfoRate) * Math.min(1, pt.lfoDepth * 2) : 0
      el.style.setProperty('--lfo', breathe.toFixed(3))
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion])
  // a note on pulses the cable (the event line left the hero: the OLED and the tube's status say what happened)
  const prevNote = useRef(note)
  useEffect(() => {
    if (note !== null && note !== prevNote.current) setPulse((n) => n + 1)
    prevNote.current = note
  }, [note])

  const signal = jack !== 'none'
  const hz = midiHz(note ?? 45)
  const hzText = hz < 1000 ? `${hz.toFixed(1)} Hz` : `${(hz / 1000).toFixed(2)} kHz`
  const envText =
    env.stage === 'idle'
      ? `A ${Math.round(patch.attack * 1000)} · D ${Math.round(patch.decay * 1000)} · S ${Math.round(patch.sustain * 100)} · R ${Math.round(patch.release * 1000)}`
      : env.stage === 'S'
        ? `Sustain at ${Math.round(patch.sustain * 100)} %`
        : `${{ A: 'Attack', D: 'Decay', R: 'Release' }[env.stage]} ${Math.round(Math.min(1, env.t) * 100)} %`
  const stages = [
    { id: 'osc', name: 'Oscillator', lit: true, value: `${WAVE_SHORT[patch.wave]} · ${engine.noteName(note ?? 45)} ${hzText}`, short: WAVE_SHORT[patch.wave], glyph: <WaveGlyph wave={patch.wave} /> },
    { id: 'vcf', name: 'Filter', lit: true, value: `${fmt.hz(patch.cutoff).shown} · Q ${patch.resonance.toFixed(1)}`, short: fmt.hz(patch.cutoff).shown, glyph: <FilterGlyph cutoff={patch.cutoff} q={patch.resonance} /> },
    { id: 'env', name: 'Envelope', lit: env.stage !== 'idle', value: envText, short: envText.split(' · ')[0], glyph: <EnvGlyphLive patch={patch} stage={env.stage} t={env.t} /> },
    {
      id: 'out',
      name: 'Output',
      lit: on && signal,
      value: !signal ? 'Cable unplugged' : on ? `${(20 * Math.log10(Math.max(1e-4, lvl))).toFixed(0)} dB · ${jack === 'out' ? 'line' : 'phones'}` : 'Muted · sound off',
      short: !signal ? 'Unplugged' : on ? `${(20 * Math.log10(Math.max(1e-4, lvl))).toFixed(0)} dB` : 'Muted',
      glyph: <Vu level={lvl} on={on && signal} />,
    },
  ]
  const target = (id: string) => (el: HTMLElement | null) => {
    targetEls.current[id] = el
  }
  return (
    <section aria-labelledby="hero-title" data-section="hero" data-moment="signature" data-booting={booting || undefined} className="pl-hero d e" ref={host} style={vars({ '--spill': String(Math.min(1, lvl * 1.6) * (signal ? 1 : 0)) })}>
      {/* the hero is one card: the copy beside the instrument, and the scope is the instrument's own screen, so a knob,
          a key and the trace they move are all in one view */}
      <div className="pl-hero__copy">
        <h1 id="hero-title" className="d-title">
          <span>Turn a knob.</span> <span>Watch the sound change shape.</span>
        </h1>
        <p className="pl-hero__sub">PULSE-1 is an eight-voice analog-style desktop synth for bedroom and laptop producers. Play it right here.</p>
      </div>

      <section className="d-device e-device" aria-label="PULSE-1, playable" id="play">
        <div className="e-desk">
          <div className="d-face e-face">
            <div className="e-edge">
              <LineIn />
              {(['MIDI in', 'USB-C', 'DC 9 V', 'Phones', 'Out'] as const).map((j) => (
                <span
                  key={j}
                  className="d-jack"
                  data-plug={j === 'Out' || j === 'Phones' || undefined}
                  data-target={j === 'Out' ? 'out' : undefined}
                  data-hot={j === 'Out' && hot === 'out' ? true : undefined}
                  data-plugged={(j === 'Out' && jack === 'out') || (j === 'Phones' && jack === 'phones') || undefined}
                  ref={j === 'Out' ? outJack : j === 'Phones' ? phonesJack : undefined}
                >
                  <i />
                  <span className="pi-legend">{j}</span>
                </span>
              ))}
            </div>
            <span className="d-screw d-screw--tl" />
            <span className="d-screw d-screw--tr" />
            <span className="d-screw d-screw--bl" />
            <span className="d-screw d-screw--br" />
            <section className="d-scene" aria-label="Live oscilloscope">
              <div className="d-crt e-crt">
                <PhosphorScope gain={JACK_GAIN[jack]} offRef={off} reduced={reducedMotion} />
                {signal ? <Annotations cutoff={patch.cutoff} q={patch.resonance} lfoRate={patch.lfoRate} lfoDepth={patch.lfoDepth} /> : <p className="e-nosignal pi-legend">CH1 · No signal · plug the cable into OUT or PHONES</p>}
                <span ref={hudTl} className="d-hud d-hud--tl pi-legend">
                  CH1 · {jack === 'out' ? 'Line out' : jack === 'phones' ? 'Phones' : 'Open'} · {on ? 'Live' : 'Preview'}
                </span>
                <span ref={hudTr} className="d-hud d-hud--tr pi-legend">1 ms/div · 0.5 V/div · trig ↑</span>
                <span className="d-hud d-hud--br pi-legend">{note !== null ? `${engine.noteName(note)} · ${hzText}` : 'No note held'}</span>
                {/* the screen's CH1 input, top right, under the OUT jack: the cable makes a short loop over the edge */}
                <span ref={socket} className="e-socket">
                  <i />
                  <span className="pi-legend">CH1 in</span>
                </span>
              </div>
              <ol className="d-path" aria-label="Signal path, live">
                {stages.map((st, i) => (
                  <li
                    key={st.id}
                    className="d-stage"
                    style={{ '--i': i } as CSSProperties}
                    data-lit={st.lit || undefined}
                    data-hot={hot === st.id || undefined}
                    ref={(el) => {
                      stageEls.current[st.id] = el
                    }}
                    tabIndex={0}
                    onPointerEnter={() => setHot(st.id)}
                    onPointerLeave={() => setHot(null)}
                    onFocus={() => setHot(st.id)}
                    onBlur={() => setHot(null)}
                  >
                    <span className="d-stage__head">
                      <Led state={st.lit ? (st.id === 'env' ? 'blink' : 'on') : 'off'} />
                      <span className="pi-legend">
                        {String(i + 1).padStart(2, '0')} <span className="d-stage__name">{st.name}</span>
                      </span>
                    </span>
                    {st.glyph}
                    {/* phones show one stat per cell; the full readout stays for wide screens and screen readers */}
                    <span className="d-stage__value">
                      <span className="d-stage__full">{st.value}</span>
                      <span className="d-stage__short" aria-hidden="true">
                        {st.short}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
            <div className="d-face__left">
              <span className="d-engrave pi-legend">PULSE-1 · eight-voice analog-style synth</span>
              <Oled line1={note !== null ? `${engine.noteName(note)} ${hz.toFixed(1)} Hz` : on ? 'Sound on' : 'Press the key'} line2={`${WAVE_SHORT[patch.wave]} ${fmt.hz(patch.cutoff).shown}`} />
              <div ref={target('out')} className="e-target" data-hot={hot === 'out' || undefined}>
                <SoundSwitch quiet latency={parseLatency(query.get('latency'))} />
              </div>
            </div>
            <div className="pl-banks">
              <PageKeys keys={BANKS} value={bank} onChange={setBank} idBase={bankBase} label="Control banks" />
              <div className="pl-bank" role="tabpanel" {...bankProps('main')}>
                <div className="d-face__knobs">
                  <div ref={target('osc')} className="e-target" data-hot={hot === 'osc' || undefined}>
                    <WaveformSelector value={patch.wave} onChange={(w) => engine.setPatch({ wave: w })} />
                  </div>
                  <div ref={target('vcf')} className="d-face__pair e-target e-scaled" data-hot={hot === 'vcf' || undefined}>
                    <Knob size="lg" label="Cutoff" value={patch.cutoff} min={40} max={12000} log defaultValue={1240} format={fmt.hz} onChange={(v) => engine.setPatch({ cutoff: v })} />
                    <Knob size="lg" label="Resonance" value={patch.resonance} min={0.1} max={18} defaultValue={4} format={fmt.q} onChange={(v) => engine.setPatch({ resonance: v })} />
                  </div>
                </div>
              </div>
              <div className="pl-bank" role="tabpanel" {...bankProps('env')}>
                <div className="e-env" aria-label="Envelope">
                  <Fader label="A" value={patch.attack} min={0.001} max={5} log defaultValue={0.012} format={fmt.ms} onChange={(v) => engine.setPatch({ attack: v })} />
                  <Fader label="D" value={patch.decay} min={0.001} max={5} log defaultValue={0.34} format={fmt.ms} onChange={(v) => engine.setPatch({ decay: v })} />
                  <Fader label="S" value={patch.sustain} min={0} max={1} defaultValue={0.6} format={fmt.pct} onChange={(v) => engine.setPatch({ sustain: v })} />
                  <Fader label="R" value={patch.release} min={0.001} max={8} log defaultValue={0.8} format={fmt.ms} onChange={(v) => engine.setPatch({ release: v })} />
                </div>
              </div>
              <div className="pl-bank" role="tabpanel" {...bankProps('osc2')}>
                <WaveformSelector label="Wave 2" value={patch.wave2} onChange={(w) => engine.setPatch({ wave2: w })} />
                <Knob size="sm" label="Osc 2" value={patch.osc2} min={0} max={1} defaultValue={0.6} format={fmt.pct} onChange={(v) => engine.setPatch({ osc2: v })} />
                <Knob size="sm" label="Detune" value={patch.detune} min={0} max={50} defaultValue={9} format={(v) => ({ shown: `${Math.round(v)} ct`, spoken: `${Math.round(v)} cents` })} onChange={(v) => engine.setPatch({ detune: v })} />
                <Knob size="sm" label="Sub" value={patch.sub} min={0} max={1} defaultValue={0.35} format={fmt.pct} onChange={(v) => engine.setPatch({ sub: v })} />
                <Knob size="sm" label="Noise" value={patch.noise} min={0} max={1} defaultValue={0} format={fmt.pct} onChange={(v) => engine.setPatch({ noise: v })} />
              </div>
              <div className="pl-bank" role="tabpanel" {...bankProps('tone')}>
                <Knob size="sm" label="Filter env" value={patch.filterEnv} min={0} max={1} defaultValue={0.35} format={fmt.pct} onChange={(v) => engine.setPatch({ filterEnv: v })} />
                <Knob size="sm" label="Drive" value={patch.drive} min={0} max={1} defaultValue={0.15} format={fmt.pct} onChange={(v) => engine.setPatch({ drive: v })} />
                <Knob size="sm" label="Glide" value={patch.glide} min={0} max={0.5} defaultValue={0} format={fmt.ms} onChange={(v) => engine.setPatch({ glide: v })} />
              </div>
              <div className="pl-bank" role="tabpanel" {...bankProps('fx')}>
                <Knob size="sm" label="LFO rate" value={patch.lfoRate} min={0.05} max={12} log defaultValue={0.8} format={(v) => ({ shown: `${v.toFixed(1)} Hz`, spoken: `${v.toFixed(1)} hertz` })} onChange={(v) => engine.setPatch({ lfoRate: v })} />
                <Knob size="sm" label="LFO depth" value={patch.lfoDepth} min={0} max={1} defaultValue={0.2} format={fmt.pct} onChange={(v) => engine.setPatch({ lfoDepth: v })} />
                <Knob size="sm" label="Delay" value={patch.delay} min={0} max={1} defaultValue={0.18} format={fmt.pct} onChange={(v) => engine.setPatch({ delay: v })} />
                <Knob size="sm" label="Reverb" value={patch.reverb} min={0} max={1} defaultValue={0.2} format={fmt.pct} onChange={(v) => engine.setPatch({ reverb: v })} />
                <Knob size="sm" label="Volume" value={patch.volume} min={0} max={1} defaultValue={0.7} format={fmt.pct} onChange={(v) => engine.setPatch({ volume: v })} />
              </div>
              <div className="pl-bank" role="tabpanel" {...bankProps('loop')}>
                <StepLoop autoplay={query.get('loop') === '1'} />
              </div>
            </div>
            <div className="d-face__keys">
              <div ref={target('env')} className="e-target" data-hot={hot === 'env' || undefined}>
                <Keyboard octaves={4} />
              </div>
            </div>
            <span className="d-plate pi-legend" aria-hidden="true">
              SN 0001 · Study build · 2026 · Calibrated 440 Hz
            </span>
          </div>
        </div>
      </section>
        <aside className="d-order" aria-label="Pre-order">
          <PatchTag />
          <a className="fb fb-btn" data-variant="primary" href="#order">
            Pre-order with this patch
          </a>
          <p className="pl-hero__terms">Pay nothing until it ships. Cancel any time.</p>
          <p className="pl-hero__note">349 € and every spec here are invented for this study. The form sends nothing.</p>
          <a className="pl-hero__secondary" href="#patches">
            Hear six patches first
          </a>
        </aside>
      <PatchCable host={host} socket={socket} jacks={jacks} jack={jack} onJack={setJack} pulse={pulse} />
      {hot && targetEls.current[hot]?.offsetParent ? <Leader host={host} from={stageEls.current[hot] ?? null} to={targetEls.current[hot] ?? null} /> : null}
    </section>
  )
}

