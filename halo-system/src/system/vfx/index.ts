/**
 * Effect primitives for the system's motion language (guides/expression.md), and HALO's own effects (halo.css,
 * halo.ts). Import from here so both stylesheets come with them.
 */
// The primitives in vfx.css are not loaded: HALO's language uses only its own effects (MOTION-SYSTEM.md).
import './halo.css'

export { burst, decode, play, reducedMotion } from './vfx'
export type { OneShot } from './vfx'
export { playHalo } from './halo'
export type { HaloShot } from './halo'
