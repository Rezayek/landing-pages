/**
 * Effect primitives for the system's motion language (guides/expression.md). Import from here so the stylesheets
 * come with them. PULSE-1's own effects (the dot-matrix power-on language) live in pulse.css and pulse.ts.
 */
import './vfx.css'
import './pulse.css'

export { burst, decode, play, reducedMotion } from './vfx'
export type { OneShot } from './vfx'
export { pulsePlay, typeOn } from './pulse'
export type { PulseShot } from './pulse'
