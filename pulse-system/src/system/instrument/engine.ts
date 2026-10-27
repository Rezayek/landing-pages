/**
 * The PULSE-1 sound engine: eight Web Audio voices, the real thing the knobs, keys and scope talk to.
 *
 *   per voice:  oscillator 1 (wave) + oscillator 2 (wave 2, detuned) + sub (square, an octave down) + noise
 *                 -> low-pass filter (cutoff, resonance) <- filter envelope (amount, on the attack and decay)
 *                                                        <- LFO (rate, depth), shared
 *                 -> amp envelope (attack, decay, sustain, release)
 *   shared:     voices -> drive -> dry + delay (time, feedback) + reverb -> volume -> analyser -> speakers
 *
 * Nothing makes sound until start() runs from a click (browsers need a user gesture). The engine is a module-level
 * singleton with a tiny store, so any component can read it with useEngine(). Eight voices, the oldest stolen when
 * a ninth note comes; `note` is the last note held (what the OLED and scope label), `notes` every note held. Glide
 * slides each new note from the last one played.
 */
import { useSyncExternalStore } from 'react'

export type Wave = 'sine' | 'triangle' | 'sawtooth' | 'square'
export type EngineStatus = 'off' | 'starting' | 'on' | 'blocked' | 'no-device'
/** A track played into the line input: idle, loading, playing, or a file that would not play */
export type TrackStatus = 'idle' | 'loading' | 'playing' | 'error'

export interface Patch {
  readonly wave: Wave
  /** oscillator 2: its wave, its detune in cents (0 to 50) and its level (0 to 1) */
  readonly wave2: Wave
  readonly detune: number
  readonly osc2: number
  /** sub oscillator (square, one octave down) and noise levels, 0 to 1 */
  readonly sub: number
  readonly noise: number
  /** Hz, 40 to 12000 */
  readonly cutoff: number
  /** Q, 0.1 to 18 */
  readonly resonance: number
  /** filter envelope amount, 0 to 1 (up to four octaves above the cutoff at the attack peak) */
  readonly filterEnv: number
  /** amp envelope, seconds; sustain 0 to 1 */
  readonly attack: number
  readonly decay: number
  readonly sustain: number
  readonly release: number
  /** Hz, 0.05 to 12 */
  readonly lfoRate: number
  /** 0 to 1 of the cutoff */
  readonly lfoDepth: number
  /** saturation before the effects, 0 to 1 */
  readonly drive: number
  /** seconds a new note slides from the last one, 0 to 0.5 */
  readonly glide: number
  /** delay: wet level 0 to 1, time in seconds (0.05 to 1), feedback 0 to 0.85 */
  readonly delay: number
  readonly delayTime: number
  readonly feedback: number
  /** reverb wet level, 0 to 1 */
  readonly reverb: number
  /** 0 to 1 */
  readonly volume: number
}

export const VOICES = 8

export const DEFAULT_PATCH: Patch = {
  wave: 'sawtooth',
  wave2: 'sawtooth',
  detune: 9,
  osc2: 0.6,
  sub: 0.35,
  noise: 0,
  cutoff: 1240,
  resonance: 4,
  filterEnv: 0.35,
  attack: 0.012,
  decay: 0.34,
  sustain: 0.6,
  release: 0.8,
  lfoRate: 0.8,
  lfoDepth: 0.2,
  drive: 0.15,
  glide: 0,
  delay: 0.18,
  delayTime: 0.3,
  feedback: 0.35,
  reverb: 0.2,
  volume: 0.7,
}

interface State {
  status: EngineStatus
  patch: Patch
  /** the last MIDI note held, or null */
  note: number | null
  /** every MIDI note held, oldest first */
  notes: readonly number[]
  /** the line-in track (playTrack) */
  track: TrackStatus
}

let state: State = { status: 'off', patch: DEFAULT_PATCH, note: null, notes: [], track: 'idle' }
const listeners = new Set<() => void>()
function set(next: Partial<State>): void {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export function getState(): State {
  return state
}
export function useEngine(): State {
  return useSyncExternalStore(subscribe, getState, getState)
}

interface Voice {
  midi: number
  started: number
  osc1: OscillatorNode
  osc2: OscillatorNode
  sub: OscillatorNode
  noise: AudioBufferSourceNode
  mix1: GainNode
  mix2: GainNode
  mixSub: GainNode
  mixNoise: GainNode
  filter: BiquadFilterNode
  amp: GainNode
  released: boolean
}

interface Graph {
  ctx: AudioContext
  bus: GainNode
  drive: WaveShaperNode
  dry: GainNode
  delay: DelayNode
  delayWet: GainNode
  feedback: GainNode
  delayTone: BiquadFilterNode
  reverb: ConvolverNode
  reverbWet: GainNode
  volume: GainNode
  lfo: OscillatorNode
  lfoGain: GainNode
  analyser: AnalyserNode
  noise: AudioBuffer
  voices: Voice[]
}
let graph: Graph | null = null
let lastFreq: number | null = null

export function getAnalyser(): AnalyserNode | null {
  return graph?.analyser ?? null
}

const START_BUDGET_MS = 5000 // INTERACTION.md: start the sound engine, abort budget

function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024
  const curve = new Float32Array(new ArrayBuffer(n * 4))
  const k = 1 + amount * 24
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    curve[i] = Math.tanh(k * x) / Math.tanh(k)
  }
  return curve
}

/** A generated room: two seconds of decaying stereo noise, so the reverb needs no file. */
function impulse(ctx: AudioContext, seconds = 2.2): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6
  }
  return buf
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

function build(ctx: AudioContext): Graph {
  const bus = ctx.createGain()
  bus.gain.value = 1 / 3 // headroom for chords
  const drive = ctx.createWaveShaper()
  drive.oversample = '2x'
  const dry = ctx.createGain()
  const delay = ctx.createDelay(1.5)
  const delayWet = ctx.createGain()
  const feedback = ctx.createGain()
  const delayTone = ctx.createBiquadFilter()
  delayTone.type = 'lowpass'
  delayTone.frequency.value = 3200
  const reverb = ctx.createConvolver()
  reverb.buffer = impulse(ctx)
  const reverbWet = ctx.createGain()
  const volume = ctx.createGain()
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  bus.connect(drive)
  drive.connect(dry).connect(volume)
  drive.connect(delay)
  delay.connect(delayTone).connect(feedback).connect(delay)
  delayTone.connect(delayWet).connect(volume)
  drive.connect(reverb).connect(reverbWet).connect(volume)
  volume.connect(analyser).connect(ctx.destination)
  lfo.connect(lfoGain)
  lfo.start()
  const g: Graph = { ctx, bus, drive, dry, delay, delayWet, feedback, delayTone, reverb, reverbWet, volume, lfo, lfoGain, analyser, noise: noiseBuffer(ctx), voices: [] }
  apply(g, state.patch)
  return g
}

function apply(g: Graph, p: Patch): void {
  const t = g.ctx.currentTime
  g.drive.curve = driveCurve(p.drive)
  g.dry.gain.setTargetAtTime(1, t, 0.02)
  g.delay.delayTime.setTargetAtTime(p.delayTime, t, 0.05)
  g.feedback.gain.setTargetAtTime(Math.min(0.85, p.feedback), t, 0.02)
  g.delayWet.gain.setTargetAtTime(p.delay * 0.8, t, 0.02)
  g.reverbWet.gain.setTargetAtTime(p.reverb * 0.9, t, 0.02)
  g.lfo.frequency.setTargetAtTime(p.lfoRate, t, 0.02)
  g.lfoGain.gain.setTargetAtTime(p.cutoff * p.lfoDepth, t, 0.02)
  g.volume.gain.setTargetAtTime(p.volume * 0.5, t, 0.01)
  for (const v of g.voices) {
    v.osc1.type = p.wave
    v.osc2.type = p.wave2
    v.osc2.detune.setTargetAtTime(p.detune, t, 0.02)
    v.mix1.gain.setTargetAtTime(1, t, 0.02)
    v.mix2.gain.setTargetAtTime(p.osc2, t, 0.02)
    v.mixSub.gain.setTargetAtTime(p.sub, t, 0.02)
    v.mixNoise.gain.setTargetAtTime(p.noise * 0.6, t, 0.02)
    v.filter.Q.setTargetAtTime(p.resonance, t, 0.01)
    if (!v.released) v.filter.frequency.setTargetAtTime(p.cutoff, t, 0.02)
  }
}

/** Starts (or resumes) the engine. Must run inside a click or key handler. Resolves to the final status. */
export async function start(): Promise<EngineStatus> {
  if (state.status === 'on') return 'on'
  const Ctor: typeof AudioContext | undefined =
    typeof window === 'undefined' ? undefined : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
  if (!Ctor) {
    set({ status: 'no-device' })
    return 'no-device'
  }
  set({ status: 'starting' })
  try {
    const ctx = graph?.ctx ?? new Ctor()
    const resumed = ctx.resume().then(() => true)
    const timedOut = new Promise<false>((resolve) => window.setTimeout(() => resolve(false), START_BUDGET_MS))
    const ok = await Promise.race([resumed, timedOut])
    if (!ok || ctx.state !== 'running') {
      set({ status: 'blocked' })
      return 'blocked'
    }
    if (!graph) graph = build(ctx)
    else graph.volume.gain.setTargetAtTime(state.patch.volume * 0.5, ctx.currentTime, 0.01)
    set({ status: 'on' })
    return 'on'
  } catch {
    set({ status: 'no-device' })
    return 'no-device'
  }
}

/** Releases every voice, ramps the volume to silence over --dur-md (140 ms), then suspends. */
export async function stop(): Promise<void> {
  if (!graph) {
    set({ status: 'off', note: null, notes: [] })
    return
  }
  const { ctx, volume } = graph
  line?.el.pause()
  for (const v of graph.voices) release(graph, v)
  volume.gain.setTargetAtTime(0, ctx.currentTime, 0.035)
  await new Promise((r) => window.setTimeout(r, 140))
  await ctx.suspend()
  set({ status: 'off', note: null, notes: [], track: 'idle' })
}

// The line input: an audio file played through the volume stage and the analyser (not the voices' filter, so the
// patch never colours it), so the scope, the meter and the signal path draw it while the synth stays playable.
let line: { el: HTMLAudioElement; url: string } | null = null

/** Plays a track into the line input, looping; starts the engine first when it is off (call it from a click). */
export async function playTrack(url: string): Promise<TrackStatus> {
  const status = await start()
  if (status !== 'on' || !graph) return state.track
  if (!line || line.url !== url) {
    line?.el.pause()
    const el = new Audio(url)
    el.loop = true
    el.preload = 'auto'
    graph.ctx.createMediaElementSource(el).connect(graph.volume)
    line = { el, url }
  }
  set({ track: 'loading' })
  try {
    await line.el.play()
    set({ track: 'playing' })
  } catch {
    set({ track: 'error' })
  }
  return state.track
}

export function stopTrack(): void {
  line?.el.pause()
  set({ track: 'idle' })
}

export function setPatch(next: Partial<Patch>): void {
  const patch = { ...state.patch, ...next }
  set({ patch })
  if (graph) apply(graph, patch)
}

const freq = (midi: number): number => 440 * 2 ** ((midi - 69) / 12)

function voice(g: Graph, midi: number): Voice {
  const { ctx } = g
  const p = state.patch
  const t = ctx.currentTime
  const f = freq(midi)
  const from = p.glide > 0 && lastFreq ? lastFreq : f
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const sub = ctx.createOscillator()
  const noise = ctx.createBufferSource()
  noise.buffer = g.noise
  noise.loop = true
  osc1.type = p.wave
  osc2.type = p.wave2
  sub.type = 'square'
  osc2.detune.value = p.detune
  for (const [o, mult] of [[osc1, 1], [osc2, 1], [sub, 0.5]] as const) {
    o.frequency.setValueAtTime(from * mult, t)
    if (p.glide > 0) o.frequency.exponentialRampToValueAtTime(f * mult, t + p.glide)
  }
  const mix1 = ctx.createGain()
  const mix2 = ctx.createGain()
  const mixSub = ctx.createGain()
  const mixNoise = ctx.createGain()
  mix1.gain.value = 1
  mix2.gain.value = p.osc2
  mixSub.gain.value = p.sub
  mixNoise.gain.value = p.noise * 0.6
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = p.resonance
  const amp = ctx.createGain()
  amp.gain.value = 0
  osc1.connect(mix1).connect(filter)
  osc2.connect(mix2).connect(filter)
  sub.connect(mixSub).connect(filter)
  noise.connect(mixNoise).connect(filter)
  g.lfoGain.connect(filter.frequency)
  filter.connect(amp).connect(g.bus)
  // the filter envelope: up to four octaves over the cutoff at the attack peak, back to the cutoff over the decay
  const peak = Math.min(18000, p.cutoff * 2 ** (p.filterEnv * 4))
  const a = Math.max(0.003, p.attack)
  filter.frequency.setValueAtTime(p.cutoff, t)
  filter.frequency.linearRampToValueAtTime(peak, t + a)
  filter.frequency.setTargetAtTime(p.cutoff, t + a, Math.max(0.01, p.decay / 3))
  amp.gain.setValueAtTime(0, t)
  amp.gain.linearRampToValueAtTime(1, t + a)
  amp.gain.setTargetAtTime(p.sustain, t + a, Math.max(0.01, p.decay / 3))
  for (const o of [osc1, osc2, sub, noise]) o.start(t)
  lastFreq = f
  return { midi, started: t, osc1, osc2, sub, noise, mix1, mix2, mixSub, mixNoise, filter, amp, released: false }
}

function release(g: Graph, v: Voice, fast = false): void {
  if (v.released) return
  v.released = true
  const t = g.ctx.currentTime
  const r = fast ? 0.02 : Math.max(0.01, state.patch.release)
  v.amp.gain.cancelScheduledValues(t)
  v.amp.gain.setValueAtTime(v.amp.gain.value, t)
  v.amp.gain.setTargetAtTime(0, t, r / 4)
  const end = t + r * 1.6 + 0.05
  for (const o of [v.osc1, v.osc2, v.sub, v.noise]) o.stop(end)
  v.osc1.onended = () => {
    g.lfoGain.disconnect(v.filter.frequency)
    v.amp.disconnect()
    g.voices = g.voices.filter((x) => x !== v)
  }
}

export function noteOn(midi: number): void {
  const notes = [...state.notes.filter((n) => n !== midi), midi]
  set({ note: midi, notes })
  if (!graph || state.status !== 'on') return
  // the same key again retriggers; past eight voices the oldest sounding one is stolen
  for (const v of graph.voices) if (v.midi === midi) release(graph, v, true)
  const sounding = graph.voices.filter((v) => !v.released)
  if (sounding.length >= VOICES) release(graph, sounding[0], true)
  graph.voices.push(voice(graph, midi))
}

export function noteOff(midi: number): void {
  if (!state.notes.includes(midi)) return
  const notes = state.notes.filter((n) => n !== midi)
  set({ notes, note: notes.length ? notes[notes.length - 1] : null })
  if (!graph) return
  for (const v of graph.voices) if (v.midi === midi) release(graph, v)
}

/** Pretend failures for /system: the latency control's "fail" makes start() report a blocked browser. */
export function simulateStatus(status: EngineStatus): void {
  set({ status })
}

/** Note names for labels: 60 -> "C4". */
const NAMES = ['C', 'C sharp', 'D', 'D sharp', 'E', 'F', 'F sharp', 'G', 'G sharp', 'A', 'A sharp', 'B']
export function noteName(midi: number): string {
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
}
