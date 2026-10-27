/**
 * The factory bank: six patches built to sound clearly apart (invented for the study, like everything here). Each is a
 * full patch, so loading one sets every knob, fader and effect. The scenarios on /system and the landing's patch
 * list both read this file.
 */
import { DEFAULT_PATCH, type Patch } from './engine'
import type { PatchType } from './PatchList'

export interface FactoryPatch {
  readonly id: string
  readonly number: number
  readonly name: string
  readonly type: PatchType
  /** one line in the voice of CONTENT.md: what it sounds like */
  readonly blurb: string
  readonly patch: Patch
}

const p = (over: Partial<Patch>): Patch => ({ ...DEFAULT_PATCH, ...over })

export const FACTORY_PATCHES: readonly FactoryPatch[] = [
  {
    id: 'p1', number: 1, name: 'Night Bass', type: 'bass',
    blurb: 'Round, low and heavy: a sine sub under a soft saw.',
    patch: p({ wave: 'sawtooth', wave2: 'sine', detune: 0, osc2: 0.5, sub: 0.9, noise: 0, cutoff: 360, resonance: 2, filterEnv: 0.25, attack: 0.004, decay: 0.28, sustain: 0.7, release: 0.16, lfoRate: 0.2, lfoDepth: 0, drive: 0.35, glide: 0.04, delay: 0, reverb: 0.05 }),
  },
  {
    id: 'p2', number: 2, name: 'Acid Line', type: 'bass',
    blurb: 'Squelchy and rubbery: high resonance, a fast filter snap and a little slide.',
    patch: p({ wave: 'sawtooth', wave2: 'square', detune: 4, osc2: 0.25, sub: 0.2, noise: 0, cutoff: 260, resonance: 14, filterEnv: 0.85, attack: 0.002, decay: 0.18, sustain: 0.25, release: 0.1, lfoRate: 0.1, lfoDepth: 0, drive: 0.6, glide: 0.08, delay: 0.22, delayTime: 0.225, feedback: 0.3, reverb: 0.05 }),
  },
  {
    id: 'p3', number: 7, name: 'Glass Lead', type: 'lead',
    blurb: 'Bright and singing: two squares a few cents apart, vibrato from the LFO, a long echo.',
    patch: p({ wave: 'square', wave2: 'square', detune: 14, osc2: 0.8, sub: 0, noise: 0, cutoff: 3600, resonance: 3, filterEnv: 0.3, attack: 0.01, decay: 0.3, sustain: 0.75, release: 0.4, lfoRate: 5.5, lfoDepth: 0.08, drive: 0.2, glide: 0.06, delay: 0.42, delayTime: 0.375, feedback: 0.45, reverb: 0.3 }),
  },
  {
    id: 'p4', number: 12, name: 'Slow Bloom', type: 'pad',
    blurb: 'Wide and slow: detuned saws swelling in over a second, a breathing filter, a big room.',
    patch: p({ wave: 'sawtooth', wave2: 'sawtooth', detune: 22, osc2: 0.9, sub: 0.15, noise: 0.04, cutoff: 1500, resonance: 1.5, filterEnv: 0.2, attack: 1.4, decay: 1.2, sustain: 0.85, release: 2.6, lfoRate: 0.3, lfoDepth: 0.35, drive: 0.05, glide: 0, delay: 0.2, delayTime: 0.5, feedback: 0.4, reverb: 0.75 }),
  },
  {
    id: 'p5', number: 13, name: 'Pluck Keys', type: 'lead',
    blurb: 'Short and woody: a triangle plucked by the filter envelope, good for chords.',
    patch: p({ wave: 'triangle', wave2: 'sawtooth', detune: 6, osc2: 0.35, sub: 0.1, noise: 0.02, cutoff: 700, resonance: 5, filterEnv: 0.7, attack: 0.002, decay: 0.32, sustain: 0.05, release: 0.3, lfoRate: 0.5, lfoDepth: 0, drive: 0.1, glide: 0, delay: 0.3, delayTime: 0.3, feedback: 0.35, reverb: 0.35 }),
  },
  {
    id: 'p6', number: 21, name: 'Dust Storm', type: 'fx',
    blurb: 'Noise and wobble: filtered noise swept fast by the LFO, washed in echo.',
    patch: p({ wave: 'square', wave2: 'sawtooth', detune: 40, osc2: 0.3, sub: 0, noise: 0.95, cutoff: 1800, resonance: 12, filterEnv: 0.5, attack: 0.08, decay: 0.9, sustain: 0.5, release: 1.4, lfoRate: 7, lfoDepth: 0.6, drive: 0.5, glide: 0, delay: 0.55, delayTime: 0.42, feedback: 0.7, reverb: 0.5 }),
  },
]
